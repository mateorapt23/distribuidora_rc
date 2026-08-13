const request = require('supertest');
const app = require('../app');

let token;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  token = res.body.token;
});

describe('GET /api/productos', () => {
  it('debe rechazar sin token (401)', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
  });

  it('debe listar productos con token válido', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/productos', () => {
  it('debe rechazar creación sin token (401)', async () => {
    const res = await request(app).post('/api/productos').send({ nombre: 'Test' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/productos/:id', () => {
  it('debe rechazar sin token (401)', async () => {
    const res = await request(app).delete('/api/productos/999999');
    expect(res.status).toBe(401);
  });

  it('responde 200 aunque el ID no exista (borrado lógico sin validación previa)', async () => {
    const res = await request(app)
      .delete('/api/productos/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});