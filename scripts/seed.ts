import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Product } from '../src/products/entities/product.entity';

// Load environment variables
dotenv.config();

const products = [
  { name: 'iPhone 15 Pro', price: 1199.99 },
  { name: 'MacBook Air M2', price: 1099.99 },
  { name: 'Samsung Galaxy S24', price: 899.99 },
  { name: 'iPad Air', price: 599.99 },
  { name: 'Dell XPS 13', price: 999.99 },
  { name: 'Sony WH-1000XM5', price: 349.99 },
];

// Database configuration
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'redis_products_db',
  entities: [Product],
  synchronize: false,
});

async function seedDatabase(): Promise<void> {
  try {
    console.log('🚀 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!');

    const productRepository = AppDataSource.getRepository(Product);

    // Check if products already exist
    const existingProducts = await productRepository.count();
    if (existingProducts > 0) {
      console.log(`ℹ️  Database already has ${existingProducts} products.`);
      console.log('🗑️  Clearing existing products...');
      await productRepository.clear();
    }

    console.log('🌱 Seeding products...');

    // Create and save products
    const productEntities = products.map((productData) =>
      productRepository.create(productData),
    );

    await productRepository.save(productEntities);

    console.log(`✅ Successfully seeded ${products.length} products!`);

    // Show summary
    const finalCount = await productRepository.count();
    console.log(`📊 Total products in database: ${finalCount}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the seed
seedDatabase();
