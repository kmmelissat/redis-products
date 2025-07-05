import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

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

  async findAll(): Promise<Product[]> {
    const cacheKey = `${this.CACHE_PREFIX}all`;

    try {
      // Try to get from cache first
      const cachedProducts =
        await this.redisService.getJSON<Product[]>(cacheKey);
      if (cachedProducts) {
        this.logger.log('Products retrieved from cache (30s TTL)');
        return cachedProducts;
      }
    } catch (error) {
      this.logger.warn('Cache retrieval failed, fetching from database');
    }

    // Fetch from database
    const products = await this.productRepository.find();

    // Cache the results with 30 second TTL
    try {
      await this.redisService.setJSON(cacheKey, products, this.CACHE_TTL);
      this.logger.log('Products cached successfully (30s TTL)');
    } catch (error) {
      this.logger.warn('Failed to cache products');
    }

    return products;
  }

  async findOne(id: string): Promise<Product> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    try {
      // Try to get from cache first
      const cachedProduct = await this.redisService.getJSON<Product>(cacheKey);
      if (cachedProduct) {
        this.logger.log(`Product ${id} retrieved from cache (30s TTL)`);
        return cachedProduct;
      }
    } catch (error) {
      this.logger.warn(`Cache retrieval failed for product ${id}`);
    }

    // Fetch from database
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Cache the result with 30 second TTL
    try {
      await this.redisService.setJSON(cacheKey, product, this.CACHE_TTL);
      this.logger.log(`Product ${id} cached successfully (30s TTL)`);
    } catch (error) {
      this.logger.warn(`Failed to cache product ${id}`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);

    // Clear all caches when new product is created
    try {
      // Clear the "all products" cache
      await this.redisService.del(`${this.CACHE_PREFIX}all`);

      // Cache the new product
      const cacheKey = `${this.CACHE_PREFIX}${savedProduct.id}`;
      await this.redisService.setJSON(cacheKey, savedProduct, this.CACHE_TTL);

      this.logger.log(`Product ${savedProduct.id} created - cache cleared and new product cached`);
    } catch (error) {
      this.logger.warn('Failed to manage cache after product creation');
    }

    return savedProduct;
  }

}
