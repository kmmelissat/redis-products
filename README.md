<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Redis Products API

A NestJS application demonstrating Redis integration and PostgreSQL database with TypeORM for product management with comprehensive caching capabilities.

## Features

- **Redis Integration**: Complete Redis setup with configuration management
- **PostgreSQL Database**: Full database setup with TypeORM
- **Product Management**: CRUD operations for products with Redis caching
- **Caching Strategy**: Automatic cache invalidation and TTL management
- **Search & Filter**: Product search and category filtering
- **Validation**: Input validation using class-validator
- **Docker Support**: Complete development environment with Docker Compose

## Tech Stack

- **NestJS**: Progressive Node.js framework
- **TypeORM**: Object-Relational Mapping for PostgreSQL
- **Redis**: In-memory data structure store for caching
- **PostgreSQL**: Relational database
- **TypeScript**: Static type checking
- **Class Validator**: Validation decorators

## Installation

```bash
$ npm install
```

## Database & Redis Setup

### Option 1: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL, Redis, and pgAdmin
docker-compose up -d

# Check if services are running
docker-compose ps
```

### Option 2: Local Installation

**Redis:**

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Using Homebrew (macOS)
brew install redis
redis-server

# Using package manager (Ubuntu/Debian)
sudo apt-get install redis-server
```

**PostgreSQL:**

```bash
# Using Docker
docker run -d -p 5432:5432 -e POSTGRES_DB=redis_products_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres postgres:15-alpine

# Using Homebrew (macOS)
brew install postgresql
brew services start postgresql

# Using package manager (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
```

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=redis_products_db

# Application Configuration
PORT=3000
NODE_ENV=development
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Endpoints

### Basic Endpoints

- `GET /` - Hello World
- `GET /redis/ping` - Test Redis connection

### Redis Operations

- `POST /redis/set` - Set a key-value pair
- `GET /redis/get/:key` - Get value by key
- `DELETE /redis/del/:key` - Delete a key
- `GET /redis/keys` - Get all keys
- `POST /redis/setJSON` - Set JSON data
- `GET /redis/getJSON/:key` - Get JSON data

### Products API (with PostgreSQL + Redis Caching)

- `GET /products` - Get all products (cached)
- `GET /products/search?q=query` - Search products (cached)
- `GET /products/category/:category` - Get products by category (cached)
- `GET /products/:id` - Get product by ID (cached)
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product (soft delete)
- `DELETE /products/cache/clear` - Clear products cache

## Example Usage

### Test Redis Connection

```bash
curl http://localhost:3000/redis/ping
```

### Create a Product

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro",
    "description": "Apple MacBook Pro 14-inch with M2 chip",
    "price": 1999.99,
    "category": "Electronics",
    "stock": 10
  }'
```

### Get All Products

```bash
curl http://localhost:3000/products
```

### Search Products

```bash
curl "http://localhost:3000/products/search?q=MacBook"
```

### Get Products by Category

```bash
curl http://localhost:3000/products/category/Electronics
```

### Update a Product

```bash
curl -X PUT http://localhost:3000/products/YOUR_PRODUCT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1899.99,
    "stock": 15
  }'
```

## Database Schema

### Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Caching Strategy

The application implements a comprehensive caching strategy:

1. **Cache-First Pattern**: Always check Redis cache before database
2. **Automatic Invalidation**: Cache clearing on CUD operations
3. **TTL Management**: Different expiration times for different data types
4. **Selective Caching**: Individual product cache + category cache + search cache
5. **Cache Warming**: Automatic cache population on database reads

### Cache Keys Pattern

- `products:all` - All active products
- `products:{id}` - Individual product
- `products:category:{category}` - Products by category
- `products:search:{query}` - Search results

## Development Tools

### Database Management

- **pgAdmin**: Available at http://localhost:5050
  - Email: admin@admin.com
  - Password: admin

### Monitoring

- **Redis CLI**: `docker exec -it redis-products-redis redis-cli`
- **PostgreSQL CLI**: `docker exec -it redis-products-postgres psql -U postgres -d redis_products_db`

## Project Structure

```
src/
├── config/
│   ├── redis.config.ts          # Redis configuration
│   └── database.config.ts       # PostgreSQL configuration
├── redis/
│   ├── redis.module.ts          # Redis module
│   └── redis.service.ts         # Redis service with operations
├── products/
│   ├── dto/
│   │   ├── create-product.dto.ts # Create product validation
│   │   └── update-product.dto.ts # Update product validation
│   ├── entities/
│   │   └── product.entity.ts     # Product entity (TypeORM)
│   ├── products.controller.ts    # Products controller
│   ├── products.module.ts        # Products module
│   └── products.service.ts       # Products service with caching
├── app.controller.ts             # Main controller with Redis demos
├── app.module.ts                 # Main application module
├── app.service.ts                # Main application service
└── main.ts                       # Application entry point
```

## Validation

The API uses class-validator for input validation:

```typescript
// Example: Creating a product with validation
{
  "name": "Required string, max 255 characters",
  "description": "Required string",
  "price": "Required number, minimum 0",
  "category": "Required string, max 100 characters",
  "stock": "Required number, minimum 0",
  "isActive": "Optional boolean, defaults to true"
}
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Production Considerations

1. **Environment Variables**: Use proper secrets management
2. **Database Connections**: Configure connection pooling
3. **Redis Clustering**: Consider Redis Cluster for high availability
4. **Monitoring**: Add application monitoring and logging
5. **Security**: Implement authentication and authorization
6. **Performance**: Configure proper database indexes

## License

This project is [MIT licensed](LICENSE).
