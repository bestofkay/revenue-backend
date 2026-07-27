import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Payment flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let agencyId: string;
  let revenueTypeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'officer.apapa@ncs.gov.ng', password: 'ChangeMe@12345' });

    if (login.status !== 201 && login.status !== 200) {
      throw new Error(`Login failed: ${login.status} ${JSON.stringify(login.body)}`);
    }
    accessToken = login.body.accessToken;

    const agencies = await request(app.getHttpServer())
      .get('/api/v1/agencies')
      .set('Authorization', `Bearer ${accessToken}`);
    agencyId = agencies.body[0]?.id;

    const types = await request(app.getHttpServer())
      .get('/api/v1/revenue/types')
      .set('Authorization', `Bearer ${accessToken}`);
    revenueTypeId = types.body[0]?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates invoice with payment link and simulates payment', async () => {
    if (!revenueTypeId) {
      console.warn('Skipping: no revenue types seeded');
      return;
    }

    const invoiceRes = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        payerName: 'E2E Test Payer',
        payerEmail: 'e2e@test.gov.ng',
        payerPhone: '+2348010000000',
        lines: [
          {
            revenueTypeId,
            description: 'E2E port charge',
            quantity: 1,
            unitAmountMinor: 500000,
          },
        ],
        autoPaymentRequest: true,
      })
      .expect(201);

    const paymentCode = invoiceRes.body.paymentRequest?.paymentCode;
    expect(paymentCode).toBeDefined();

    const publicView = await request(app.getHttpServer())
      .get(`/api/v1/payments/${paymentCode}`)
      .expect(200);
    expect(publicView.body.virtualAccount?.accountNumber).toBeDefined();
    expect(publicView.body.status).toBe('PENDING');

    const paid = await request(app.getHttpServer())
      .post('/api/v1/payments/simulate')
      .send({ paymentCode })
      .expect(201);
    expect(paid.body.payment?.status).toBe('PAID');
    expect(paid.body.receipt?.receiptNumber).toMatch(/^RCT-/);

    const after = await request(app.getHttpServer())
      .get(`/api/v1/payments/${paymentCode}`)
      .expect(200);
    expect(after.body.status).toBe('PAID');
  });
});
