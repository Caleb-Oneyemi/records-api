import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Import Swagger
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Record API')
    .setDescription('The record management API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const appConfig = app.get(ConfigService);
  const port = appConfig.get<number>('port');

  await app.listen(port);

  Logger.log(`api live at port ${port} 🚀`);
}
bootstrap();
