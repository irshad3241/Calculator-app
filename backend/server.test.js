const request = require('supertest');

// Mock pg pool before importing app
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

const { Pool } = require('pg');
const mockPool = new Pool();

// Mock initDB success
mockPool.query.mockResolvedValueOnce({ rows: [] });

const app = require('./server');

describe('Calculator API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok when DB is connected', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /api/calculate', () => {
    it('calculates addition correctly', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1, expression: '2+3', result: 5, created_at: new Date() }],
      });
      const res = await request(app).post('/api/calculate').send({ expression: '2+3' });
      expect(res.status).toBe(200);
      expect(res.body.result).toBe(5);
    });

    it('calculates multiplication correctly', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 2, expression: '4*5', result: 20, created_at: new Date() }],
      });
      const res = await request(app).post('/api/calculate').send({ expression: '4*5' });
      expect(res.status).toBe(200);
      expect(res.body.result).toBe(20);
    });

    it('returns 400 for missing expression', async () => {
      const res = await request(app).post('/api/calculate').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid characters', async () => {
      const res = await request(app).post('/api/calculate').send({ expression: 'rm -rf /' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/history', () => {
    it('returns calculation history', async () => {
      const mockRows = [
        { id: 1, expression: '2+3', result: 5, created_at: new Date() },
        { id: 2, expression: '4*5', result: 20, created_at: new Date() },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: mockRows });
      const res = await request(app).get('/api/history');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('DELETE /api/history', () => {
    it('clears history successfully', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).delete('/api/history');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('History cleared');
    });
  });
});
