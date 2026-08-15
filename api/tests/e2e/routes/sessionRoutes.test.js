/**
 * End-to-end tests for session routes
 */
const request = require('supertest');
const express = require('express');
const sessionRoutes = require('../../../src/routes/sessionRoutes');
const SessionService = require('../../../src/services/sessionService');
const { responseMiddleware } = require('../../../src/utils/response');

// Mock SessionService module
jest.mock('../../../src/services/sessionService');

describe('Session Routes E2E Tests', () => {
  let app;

  beforeEach(() => {
    jest.resetAllMocks();

    app = express();
    app.use(express.json());
    app.use(responseMiddleware);
    app.use('/api', sessionRoutes);

    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        success: false,
        message: err.message,
        statusCode: err.status || 500
      });
    });

    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        statusCode: 404
      });
    });
  });

  describe('POST /api/sessions/clear-expired', () => {
    it('should clear expired sessions without being captured by :sessionId parameter', async () => {
      SessionService.clearExpiredSessions.mockResolvedValue(5);

      const response = await request(app)
        .post('/api/sessions/clear-expired')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({ count: 5 });
      expect(SessionService.clearExpiredSessions).toHaveBeenCalled();
      expect(SessionService.setSession).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/sessions/:sessionId', () => {
    it('should return session when found', async () => {
      const mockSession = { data: '{"user":"test"}', maxAge: 3600000 };
      SessionService.getSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/api/sessions/sess123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSession);
      expect(SessionService.getSession).toHaveBeenCalledWith('sess123');
    });

    it('should return 404 when session not found', async () => {
      SessionService.getSession.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/sessions/unknown')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/sessions/:sessionId', () => {
    it('should save session with valid data', async () => {
      SessionService.setSession.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/sessions/sess123')
        .send({ data: '{"user":"test"}', maxAge: 3600000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(SessionService.setSession).toHaveBeenCalledWith('sess123', '{"user":"test"}', 3600000);
    });

    it('should validate missing session data', async () => {
      const response = await request(app)
        .post('/api/sessions/sess123')
        .send({ maxAge: 3600000 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/sessions/:sessionId', () => {
    it('should destroy session successfully', async () => {
      SessionService.destroySession.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/sessions/sess123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(SessionService.destroySession).toHaveBeenCalledWith('sess123');
    });
  });
});
