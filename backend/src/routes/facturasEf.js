// src/routes/facturasEf.js
// Rutas para el módulo de Facturas Efacilito

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/facturasEfController');

// Todas las rutas requieren JWT válido
router.use(auth);

// POST  /api/facturas-ef/importar   → sube y procesa el Excel de Efacilito
router.post('/importar', ctrl.importar);

// GET   /api/facturas-ef/exportar   → descarga Excel del historial filtrado
// (debe ir ANTES de /:id para que "exportar" no se interprete como un id)
router.get('/exportar', ctrl.exportar);

// GET   /api/facturas-ef            → lista con filtros opcionales
router.get('/', ctrl.listar);

// DELETE /api/facturas-ef/:id       → elimina una factura del historial
router.delete('/:id', ctrl.eliminar);

module.exports = router;