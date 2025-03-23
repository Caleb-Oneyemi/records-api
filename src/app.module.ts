import { Module } from '@nestjs/common';
import { RecordModule } from './api/record.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envConfig, envSchema } from './config';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [envConfig],
      validationSchema: envSchema,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          uri: configService.get('mongoUrl'),
          retryAttempts: 4,
          serverSelectionTimeoutMS: 15000,
        };
      },
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [createKeyv({ url: configService.get('redisUrl') })],
          ttl: 2 * 60 * 1000,
        };
      },
    }),
    RecordModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
