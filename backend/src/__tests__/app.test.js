const request = require('supertest');
const app = require('../app');

describe('POST /api/auth/login - casos generales', () => {
  it('debe retornar 400 con body vacío', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('debe retornar 401 con usuario inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'no_existe_123', password: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('Rutas no encontradas', () => {
  it('debe retornar 404 en una ruta inexistente', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    expect(res.status).toBe(404);
  });
});