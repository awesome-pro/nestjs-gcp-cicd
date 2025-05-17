import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { LoggerService } from './logging/logging.service.js';
import { WinstonModule } from 'nest-winston';
import { configureWinston } from './logging/winston.config.js';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';

async function bootstrap() {
  const winstonLogger = WinstonModule.createLogger(configureWinston());
  const logger = new LoggerService().setContext('Bootstrap');
  
  // Determine if we're in production or development
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Create app with appropriate HTTP/HTTPS options
  let app;
  
  if (isProduction) {
    // Production: Use HTTP only
    app = await NestFactory.create(AppModule, {
      logger: winstonLogger,
    });
    logger.log('Starting server in PRODUCTION mode (HTTP)');
  } else {
    // Development: Use HTTPS with mkcert certificates
    try {
      // Check if certificates exist
      const certPath = './localhost-cert.pem';
      const keyPath = './localhost-key.pem';
      
      if (existsSync(certPath) && existsSync(keyPath)) {
        // HTTPS configuration for development
        const httpsOptions = {
          key: readFileSync(keyPath),
          cert: readFileSync(certPath),
        };
        
        app = await NestFactory.create(AppModule, {
          logger: winstonLogger,
          httpsOptions,
        });
        logger.log('Starting server in DEVELOPMENT mode (HTTPS)');
      } else {
        // Fallback to HTTP if certificates not found
        app = await NestFactory.create(AppModule, {
          logger: winstonLogger,
        });
        logger.warn('SSL certificates not found. Starting in HTTP mode.');
        logger.warn('To use HTTPS, generate certificates with mkcert:');
        logger.warn('mkcert -install && mkcert localhost');
      }
    } catch (error) {
      logger.error('Failed to load SSL certificates', error);
      // Fallback to HTTP
      app = await NestFactory.create(AppModule, {
        logger: winstonLogger,
      });
    }
  }

  const configService = app.get(ConfigService);

  // In main.ts
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // In production, only allow requests from the specified domains
      if (isProduction) {
        const allowedDomains = [
          'https://cynosnexus.com',
          'https://app.cynosnexus.com',
          'https://foundermail.cynosnexus.com',
        ];
        const allowedDomainPattern = /^https:\/\/([a-zA-Z0-9-]+\.)?cynosnexus\.com$/;
        
        if (!origin || allowedDomains.includes(origin) || allowedDomainPattern.test(origin)) {
          callback(null, true);
      } else {
        logger.warn(`Blocked request from unauthorized domain: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow the frontend URL
      const devFrontendUrl = configService.get('FRONTEND_URL');
      if (!origin || origin === devFrontendUrl) {
        callback(null, true);
      } else {
        logger.warn(`Blocked request from unauthorized domain in dev: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization',
    'apollo-require-preflight', 'x-apollo-operation-name', 'apollo-operation-name',
    'x-requested-with', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials',
    'Cookie'
  ],
  exposedHeaders: ['Set-Cookie'],
});
  app.use(cookieParser());
  
  app.use((req: any, res: any, next: () => void) => {
    const startTime = Date.now();
    const requestLogger = new LoggerService().setContext('HTTP');
    requestLogger.debug(`Incoming ${req.method} request to ${req.url}`, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      requestLogger.debug(`Response sent for ${req.method} ${req.url}`, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });
    next();
  });

  await app.listen(8000, '0.0.0.0');
  
  // Log appropriate URL based on environment
  if (isProduction) {
    logger.log(`🚀 Application is running on: http://localhost:8000`);
  } else {
    if (app.getHttpAdapter().getType() === 'https') {
      logger.log(`🚀 Application is running on: https://localhost:8000`);
    } else {
      logger.log(`🚀 Application is running on: http://localhost:8000`);
    }
  }
}

bootstrap().catch((error) => {
  const logger = new LoggerService().setContext('Bootstrap');
  logger.error('Application failed to start', error);
  process.exit(1);
});