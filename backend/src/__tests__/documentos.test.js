const request = require('supertest');
const app = require('../app');

let token;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  token = res.body.token;
});

describe('GET /api/documentos', () => {
  it('debe rechazar sin token (401)', async () => {
    const res = await request(app).get('/api/documentos');
    expect(res.status).toBe(401);
  });

  it('debe listar documentos con token válido (200)', async () => {
    const res = await request(app)
      .get('/api/documentos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/documentos', () => {
  it('debe rechazar un documento sin detalle (400)', async () => {
    const res = await request(app)
      .post('/api/documentos')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'proforma', cliente: 'Consumidor Final' });
    expect(res.status).toBe(400);
  });

  it('debe crear una proforma válida (201 o 200)', async () => {
    const res = await request(app)
      .post('/api/documentos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'proforma',
        cliente: 'Cliente de prueba',
        detalle: [{ descripcion: 'Producto test', cantidad: 1, precio: 10, iva: 15 }],
      });
    expect([200, 201]).toContain(res.status);
  });
});