const request = require('supertest');
const app = require('../app');

describe('POST /api/auth/login', () => {
  it('debe rechazar si falta username o password (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin' });
    expect(res.status).toBe(400);
  });

  it('debe rechazar credenciales incorrectas (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'clave_incorrecta' });
    expect(res.status).toBe(401);
  });

  it('debe autenticar correctamente y devolver un token (200)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.rol).toBe('admin');
  });
});

describe('Rutas protegidas', () => {
  it('debe rechazar sin token (401)', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
  });

  it('debe rechazar con token inválido (403)', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', 'Bearer token_falso_123');
    expect(res.status).toBe(403);
  });
});