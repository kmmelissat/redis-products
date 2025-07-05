import { Product } from '../entities/product.entity';

export interface ProductListResponse {
  data: Product[];
  meta: {
    source: 'cache' | 'database';
    fetchTime: number;
    dbTime?: number;
    cacheTime?: number;
    totalTime: number;
    count: number;
    cached: boolean;
    cacheStatus?: string;
  };
}

export interface ProductResponse {
  data: Product;
  meta: {
    source: 'cache' | 'database';
    fetchTime: number;
    dbTime?: number;
    cacheTime?: number;
    totalTime: number;
    cached: boolean;
    cacheStatus?: string;
  };
}

export interface ProductCreateResponse {
  data: Product;
  meta: {
    createTime: number;
    dbTime: number;
    cacheTime?: number;
    totalTime: number;
    cacheCleared: boolean;
    cacheStatus?: string;
  };
}
