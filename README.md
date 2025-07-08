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


## API Endpoints


### Products API (with PostgreSQL + Redis Caching)

- `GET /products` - Get all products (cached)
- `GET /products/:id` - Get product by ID (cached)
- `POST /products` - Create new product

## Example Usage

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

## Database Schema

### Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
);
```

## Caching Strategy

The application implements a comprehensive caching strategy:

1. **Cache-First Pattern**: Always check Redis cache before database
2. **Automatic Invalidation**: Cache clearing on CUD operations
3. **TTL Management**: Different expiration times for different data types
4. **Selective Caching**: Individual product cache + category cache + search cache
5. **Cache Warming**: Automatic cache population on database reads

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
  "price": "Required number, minimum 0",
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

