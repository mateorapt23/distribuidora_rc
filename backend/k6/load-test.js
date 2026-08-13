import http from 'k6/http';
import { check, sleep } from 'k6';

const API_BASE_URL = 'http://localhost:3001/api';

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.05'],
    'http_req_duration{scenario:public_reads}': ['p(95)<300'],
    'http_req_duration{scenario:admin_writes}': ['p(95)<1000'],
  },
  scenarios: {
    public_reads: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 20,
      maxVUs: 50,
      exec: 'publicReads',
    },
    admin_writes: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 20,
      maxDuration: '3m',
      exec: 'adminWrites',
    },
  },
};

// --- Setup: se ejecuta una sola vez, obtiene el token ---
export function setup() {
  const email = __ENV.TEST_USER_EMAIL || 'admin';
  const password = __ENV.TEST_USER_PASSWORD;

  if (!password) {
    throw new Error("TEST_USER_PASSWORD no fue especificada. Corre k6 con '-e TEST_USER_PASSWORD=tu_password'");
  }

  const loginPayload = JSON.stringify({ username: email, password });
  const params = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post(`${API_BASE_URL}/auth/login`, loginPayload, params);
  check(res, { 'login successful': (r) => r.status === 200 });

  const token = res.json('token');
  if (!token) {
    throw new Error('No se pudo obtener el token de autenticación');
  }

  return { authToken: token };
}

// --- Escenario 1: Lecturas públicas/autenticadas ---
export function publicReads(data) {
  const params = { headers: { Authorization: `Bearer ${data.authToken}` } };
  const res = http.get(`${API_BASE_URL}/productos`, params);
  check(res, { 'GET /api/productos status 200': (r) => r.status === 200 }, { scenario: 'public_reads' });
  sleep(Math.random() * 2);
}

// --- Escenario 2: Escrituras de administrador ---
export function adminWrites(data) {
  const codigo = `K6-TEST-${__VU}-${__ITER}`;
  const createPayload = JSON.stringify({
    codigo,
    descripcion: `Producto de prueba k6 ${__VU}-${__ITER}`,
    stock: 10,
    pvp1: 5.0,
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.authToken}`,
    },
  };

  const res = http.post(`${API_BASE_URL}/productos`, createPayload, params);
  check(res, { 'POST /api/productos status 201': (r) => r.status === 201 }, { scenario: 'admin_writes' });
  sleep(Math.random() * 5 + 1);
}