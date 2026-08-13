const request = require('supertest');
const app = require('../app');

let token;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  token = res.body.token;
});

describe('GET /api/compras', () => {
  it('debe rechazar sin token (401)', async () => {
    const res = await request(app).get('/api/compras');
    expect(res.status).toBe(401);
  });

  it('debe listar compras con token válido (200)', async () => {
    const res = await request(app)
      .get('/api/compras')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});

describe('POST /api/compras', () => {
  it('debe rechazar una compra sin detalle (400)', async () => {
    const res = await request(app)
      .post('/api/compras')
      .set('Authorization', `Bearer ${token}`)
      .send({ proveedor_nombre: 'Proveedor de prueba' });
    expect(res.status).toBe(400);
  });

  it('debe crear una compra válida (201 o 200)', async () => {
    const res = await request(app)
      .post('/api/compras')
      .set('Authorization', `Bearer ${token}`)
      .send({
        proveedor_nombre: 'Proveedor Test',
        detalle: [{ cantidad: 2, costo: 5.0, iva: 15, descripcion: 'Producto test' }],
      });
    expect([200, 201]).toContain(res.status);
  });
});

describe('DELETE /api/compras/:id', () => {
  it('debe rechazar eliminación con un ID inexistente', async () => {
    const res = await request(app)
      .delete('/api/compras/999999')
      .set('Authorization', `Bearer ${token}`);
    expect([400, 404]).toContain(res.status);
  });
});