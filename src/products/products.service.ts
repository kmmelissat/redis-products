import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

      this.logger.log(
        `Product ${savedProduct.id} created - cache cleared and new product cached`,
      );
    } catch (error) {
      this.logger.warn('Failed to manage cache after product creation');
    }

    return savedProduct;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    // Update cache
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    try {
      await this.redisService.setJSON(cacheKey, updatedProduct, this.CACHE_TTL);
      // Clear the "all products" cache
      await this.redisService.del(`${this.CACHE_PREFIX}all`);
    } catch (error) {
      this.logger.warn('Failed to update product cache');
    }

    this.logger.log(`Product ${id} updated successfully`);
    return updatedProduct;
  }

  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete - mark as inactive
    product.isActive = false;
    await this.productRepository.save(product);

    // Remove from cache
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    try {
      await this.redisService.del(cacheKey);
      // Clear the "all products" cache
      await this.redisService.del(`${this.CACHE_PREFIX}all`);
    } catch (error) {
      this.logger.warn('Failed to remove product from cache');
    }

    this.logger.log(`Product ${id} deleted successfully`);
  }

  async clearCache(): Promise<void> {
    const pattern = `${this.CACHE_PREFIX}*`;
    try {
      const keys = await this.redisService.keys(pattern);

      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.redisService.del(key)));
        this.logger.log(`${keys.length} product cache entries cleared`);
      }
    } catch (error) {
      this.logger.warn('Failed to clear product cache');
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const cacheKey = `${this.CACHE_PREFIX}category:${category}`;

    try {
      // Try to get from cache first
      const cachedProducts =
        await this.redisService.getJSON<Product[]>(cacheKey);
      if (cachedProducts) {
        this.logger.log(
          `Products for category ${category} retrieved from cache`,
        );
        return cachedProducts;
      }
    } catch (error) {
      this.logger.warn(`Cache retrieval failed for category ${category}`);
    }

    // Fetch from database
    const products = await this.productRepository.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
    });

    // Cache the results
    try {
      await this.redisService.setJSON(cacheKey, products, this.CACHE_TTL);
      this.logger.log(`Products for category ${category} cached successfully`);
    } catch (error) {
      this.logger.warn(`Failed to cache products for category ${category}`);
    }

    return products;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const cacheKey = `${this.CACHE_PREFIX}search:${query}`;

    try {
      // Try to get from cache first
      const cachedProducts =
        await this.redisService.getJSON<Product[]>(cacheKey);
      if (cachedProducts) {
        this.logger.log(`Search results for "${query}" retrieved from cache`);
        return cachedProducts;
      }
    } catch (error) {
      this.logger.warn(`Cache retrieval failed for search "${query}"`);
    }

    // Search in database
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere(
        '(product.name ILIKE :query OR product.description ILIKE :query OR product.category ILIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('product.createdAt', 'DESC')
      .getMany();

    // Cache the results with shorter TTL for search results
    try {
      await this.redisService.setJSON(cacheKey, products, 60); // 1 minute TTL
      this.logger.log(`Search results for "${query}" cached successfully`);
    } catch (error) {
      this.logger.warn(`Failed to cache search results for "${query}"`);
    }

    return products;
  }
}
