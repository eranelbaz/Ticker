import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('CandlesController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 300 candles by default', () => {
    return request(app.getHttpServer())
      .get('/api/candles/BTCUSD')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(300);
      });
  });

  it('honors the count query param', () => {
    return request(app.getHttpServer())
      .get('/api/candles/BTCUSD?count=5')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(5);
      });
  });

  it('rejects a non-numeric count with 400', () => {
    return request(app.getHttpServer())
      .get('/api/candles/BTCUSD?count=abc')
      .expect(400);
  });

  it('rejects an empty count with 400', () => {
    return request(app.getHttpServer())
      .get('/api/candles/BTCUSD?count=')
      .expect(400);
  });
});
