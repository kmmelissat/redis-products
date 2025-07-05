import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('redis/ping')
  async redisPing(): Promise<string> {
    return await this.redisService.ping();
  }

  @Post('redis/set')
  async setRedisValue(
    @Body() body: { key: string; value: string; ttl?: number },
  ) {
    await this.redisService.set(body.key, body.value, body.ttl);
    return { message: `Key ${body.key} set successfully` };
  }

  @Get('redis/get/:key')
  async getRedisValue(@Param('key') key: string) {
    const value = await this.redisService.get(key);
    return { key, value };
  }

  @Delete('redis/del/:key')
  async deleteRedisKey(@Param('key') key: string) {
    const result = await this.redisService.del(key);
    return { message: `Key ${key} deleted`, result };
  }

  @Get('redis/keys')
  async getRedisKeys() {
    const keys = await this.redisService.keys();
    return { keys };
  }

  @Post('redis/setJSON')
  async setRedisJSON(@Body() body: { key: string; value: any; ttl?: number }) {
    await this.redisService.setJSON(body.key, body.value, body.ttl);
    return { message: `JSON data for key ${body.key} set successfully` };
  }

  @Get('redis/getJSON/:key')
  async getRedisJSON(@Param('key') key: string) {
    const value = await this.redisService.getJSON(key);
    return { key, value };
  }
}
