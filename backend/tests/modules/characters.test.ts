import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp, closeTestApp, type TestApp } from '../helpers.js';

describe('Characters module', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('GET /characters returns roster with dreams', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/characters',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<{
      profession: string;
      name: string;
      dreams: Array<{ itemRef: string; name: string; basePrice: number }>;
      items: Array<{ itemRef: string; installmentsPaid: number }>;
    }>;

    expect(body).toHaveLength(6);
    expect(body[0]?.name).toBe('Иваныч');
    expect(body[0]?.dreams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ itemRef: 'trade_pavilion' }),
        expect.objectContaining({ itemRef: 'car_wash' }),
      ]),
    );
    expect(body[4]?.dreams).toHaveLength(2);
    expect(body[0]?.dreamPreview).toMatchObject({
      title: expect.any(String),
      stageCount: 4,
      stages: expect.arrayContaining([
        expect.objectContaining({
          order: 1,
          title: expect.any(String),
          requirementsPreview: expect.arrayContaining([
            expect.objectContaining({
              kind: expect.any(String),
              label: expect.any(String),
            }),
          ]),
        }),
      ]),
    });
  });
});
