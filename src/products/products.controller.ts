import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import {
  ProductListResponse,
  ProductResponse,
  ProductCreateResponse,
} from './dto/product-response.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(): Promise<ProductListResponse> {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProductResponse> {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(
    @Body(ValidationPipe) createProductDto: CreateProductDto,
  ): Promise<ProductCreateResponse> {
    return this.productsService.create(createProductDto);
  }
}
