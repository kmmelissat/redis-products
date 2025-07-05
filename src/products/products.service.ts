import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import {
  ProductListResponse,
  ProductResponse,
  ProductCreateResponse,
} from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly CACHE_TTL = 30; // 30 seconds
  private readonly CACHE_PREFIX = 'products:';

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly redisService: RedisService,
  ) {}

  async findAll(): Promise<ProductListResponse> {
    const startTime = Date.now();
    const cacheKey = `${this.CACHE_PREFIX}all`;

    try {
      // Try to get from cache first
      const cachedProducts =
        await this.redisService.getJSON<Product[]>(cacheKey);
      if (cachedProducts) {
        const totalTime = Date.now() - startTime;
        this.logger.log(
          `🚀 FETCHING FROM: Redis Cache | Time: ${totalTime}ms | Products: ${cachedProducts.length}`,
        );

        return {
          data: cachedProducts,
          meta: {
            source: 'cache',
            fetchTime: totalTime,
            totalTime,
            count: cachedProducts.length,
            cached: true,
            cacheStatus: 'hit',
          },
        };
      }
    } catch (error) {
      this.logger.warn('Cache retrieval failed, fetching from database');
    }

    // Fetch from database
    this.logger.log('📡 FETCHING FROM: PostgreSQL Database...');
    const dbStartTime = Date.now();
    const products = await this.productRepository.find();
    const dbTime = Date.now() - dbStartTime;

    let cacheTime: number | undefined;
    let cacheStatus = 'not_cached';

    // Cache the results with 30 second TTL
    try {
      const cacheStartTime = Date.now();
      await this.redisService.setJSON(cacheKey, products, this.CACHE_TTL);
      cacheTime = Date.now() - cacheStartTime;
      cacheStatus = 'cached';
    } catch (error) {
      cacheStatus = 'cache_failed';
    }

    const totalTime = Date.now() - startTime;
    this.logger.log(
      `🗄️ FETCHING FROM: PostgreSQL Database | DB Time: ${dbTime}ms | Total Time: ${totalTime}ms | Products: ${products.length} | Cache: ${cacheStatus}`,
    );

    return {
      data: products,
      meta: {
        source: 'database',
        fetchTime: dbTime,
        dbTime,
        cacheTime,
        totalTime,
        count: products.length,
        cached: cacheStatus === 'cached',
        cacheStatus,
      },
    };
  }

  async findOne(id: string): Promise<ProductResponse> {
    const startTime = Date.now();
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    try {
      // Try to get from cache first
      const cachedProduct = await this.redisService.getJSON<Product>(cacheKey);
      if (cachedProduct) {
        const totalTime = Date.now() - startTime;
        this.logger.log(
          `🚀 FETCHING FROM: Redis Cache | Time: ${totalTime}ms | Product: ${cachedProduct.name}`,
        );

        return {
          data: cachedProduct,
          meta: {
            source: 'cache',
            fetchTime: totalTime,
            totalTime,
            cached: true,
            cacheStatus: 'hit',
          },
        };
      }
    } catch (error) {
      this.logger.warn(`Cache retrieval failed for product ${id}`);
    }

    // Fetch from database
    this.logger.log(`📡 FETCHING FROM: PostgreSQL Database for ID: ${id}...`);
    const dbStartTime = Date.now();
    const product = await this.productRepository.findOne({
      where: { id },
    });
    const dbTime = Date.now() - dbStartTime;

    if (!product) {
      const totalTime = Date.now() - startTime;
      this.logger.error(
        `❌ Product ID: ${id} not found | Total Time: ${totalTime}ms`,
      );
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    let cacheTime: number | undefined;
    let cacheStatus = 'not_cached';

    // Cache the result with 30 second TTL
    try {
      const cacheStartTime = Date.now();
      await this.redisService.setJSON(cacheKey, product, this.CACHE_TTL);
      cacheTime = Date.now() - cacheStartTime;
      cacheStatus = 'cached';
    } catch (error) {
      cacheStatus = 'cache_failed';
    }

    const totalTime = Date.now() - startTime;
    this.logger.log(
      `🗄️ FETCHING FROM: PostgreSQL Database | DB Time: ${dbTime}ms | Total Time: ${totalTime}ms | Product: ${product.name} | Cache: ${cacheStatus}`,
    );

    return {
      data: product,
      meta: {
        source: 'database',
        fetchTime: dbTime,
        dbTime,
        cacheTime,
        totalTime,
        cached: cacheStatus === 'cached',
        cacheStatus,
      },
    };
  }

  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductCreateResponse> {
    const startTime = Date.now();
    this.logger.log(`📝 CREATING: New product "${createProductDto.name}"...`);

    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);
    const dbTime = Date.now() - startTime;

    let cacheTime: number | undefined;
    let cacheStatus = 'cache_cleared';

    // Clear all caches when new product is created
    try {
      const cacheStartTime = Date.now();
      // Clear the "all products" cache
      await this.redisService.del(`${this.CACHE_PREFIX}all`);

      // Cache the new product
      const cacheKey = `${this.CACHE_PREFIX}${savedProduct.id}`;
      await this.redisService.setJSON(cacheKey, savedProduct, this.CACHE_TTL);

      cacheTime = Date.now() - cacheStartTime;
      cacheStatus = 'cache_cleared_and_updated';
    } catch (error) {
      cacheStatus = 'cache_management_failed';
    }

    const totalTime = Date.now() - startTime;
    this.logger.log(
      `✅ CREATED: "${savedProduct.name}" | DB Time: ${dbTime}ms | Cache Time: ${cacheTime || 0}ms | Total Time: ${totalTime}ms | Cache: ${cacheStatus}`,
    );

    return {
      data: savedProduct,
      meta: {
        createTime: dbTime,
        dbTime,
        cacheTime,
        totalTime,
        cacheCleared: cacheStatus.includes('cleared'),
        cacheStatus,
      },
    };
  }
}
