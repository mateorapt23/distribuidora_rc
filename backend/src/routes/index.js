const express = require('express');
const multer  = require('multer');

// ── Multer disk storage (para archivos Excel de importación) ──────────────
const upload = multer({ dest: 'uploads/' });

// ── Multer memory storage (para XML del SRI — no necesita persistirse) ───
const uploadMemory = multer({ storage: multer.memoryStorage() });

const { verificarToken, soloAdmin } = require('../middleware/auth');

const { login, perfil, solicitarRecuperacion, verificarCodigo, nuevaPassword } = require('../controllers/authController');
const { listar: listarProd, obtener: obtenerProd, crear: crearProd, actualizar: actualizarProd, eliminar: eliminarProd, ajusteStock, importarExcel, exportarExcel, buscarProductos, guardarBatchInventario } = require('../controllers/productosController');
const { listar: listarDoc, obtener: obtenerDoc, crear: crearDoc, actualizar: actualizarDoc, convertirARecibo, eliminar: eliminarDoc } = require('../controllers/documentosController');
const { listar: listarComp, obtener: obtenerComp, crear: crearComp, actualizar: actualizarComp, eliminar: eliminarComp } = require('../controllers/comprasController');
const { listar: listarUs, crear: crearUs, actualizar: actualizarUs, eliminar: eliminarUs } = require('../controllers/usuariosController');
const { resumen, reporteVentas, productosMasVendidos, movimientos, alertasStock } = require('../controllers/dashboardController');
const { importar, listar: listarFacEf, exportar: exportarFacEf, eliminar: eliminarFacEf } = require('../controllers/facturasEfController');
const { generarPDF, generarCaptura } = require('../controllers/pdfController');
const {
  listar: listarClientes,
  buscar: buscarClientes,
  obtener: obtenerCliente,
  crear: crearCliente,
  actualizar: actualizarCliente,
  eliminar: eliminarCliente,
  importarExcel: importarClientes,
  exportarExcel: exportarClientes,
} = require('../controllers/clientesController');
const { listar: listarLogs, listarUsuariosLog } = require('../controllers/logsController');
const { parsearXMLFactura } = require('../controllers/sriController'); // ← ACTUALIZADO

// ── AUTH ──────────────────────────────────────────────────
const authRouter = express.Router();
authRouter.post('/login',             login);
authRouter.get('/perfil',             verificarToken, perfil);
authRouter.post('/recuperar',         solicitarRecuperacion);
authRouter.post('/verificar-codigo',  verificarCodigo);
authRouter.post('/nueva-password',    nuevaPassword);

// ── PRODUCTOS ─────────────────────────────────────────────
const productosRouter = express.Router();
productosRouter.use(verificarToken);
productosRouter.get('/',                listarProd);
productosRouter.get('/exportar',        exportarExcel);
productosRouter.get('/buscar',          buscarProductos);
productosRouter.get('/:id',             obtenerProd);
productosRouter.post('/',               crearProd);
productosRouter.post('/importar',       upload.single('archivo'), importarExcel);
productosRouter.post('/ajuste-stock',   soloAdmin, ajusteStock);
productosRouter.post('/batch-inventario', soloAdmin, guardarBatchInventario);
productosRouter.put('/:id',             actualizarProd);
productosRouter.delete('/:id',          soloAdmin, eliminarProd);

// ── CLIENTES ──────────────────────────────────────────────
const clientesRouter = express.Router();
clientesRouter.use(verificarToken);
clientesRouter.get('/buscar',           buscarClientes);
clientesRouter.get('/exportar',         exportarClientes);
clientesRouter.get('/',                 listarClientes);
clientesRouter.get('/:id',             obtenerCliente);
clientesRouter.post('/importar',        upload.single('archivo'), importarClientes);
clientesRouter.post('/',                crearCliente);
clientesRouter.put('/:id',             actualizarCliente);
clientesRouter.delete('/:id',          soloAdmin, eliminarCliente);

// ── DOCUMENTOS ────────────────────────────────────────────
const documentosRouter = express.Router();
documentosRouter.use(verificarToken);
documentosRouter.get('/',               listarDoc);
documentosRouter.get('/:id',            obtenerDoc);
documentosRouter.post('/pdf',           generarPDF);
documentosRouter.post('/captura',       generarCaptura);
documentosRouter.post('/',              crearDoc);
documentosRouter.put('/:id',           actualizarDoc);
documentosRouter.post('/:id/convertir', convertirARecibo);
documentosRouter.delete('/:id',         soloAdmin, eliminarDoc);

// ── COMPRAS ───────────────────────────────────────────────
const comprasRouter = express.Router();
comprasRouter.use(verificarToken, soloAdmin);
comprasRouter.get('/',                          listarComp);
comprasRouter.get('/:id',                       obtenerComp);
comprasRouter.post('/sri/xml',                  uploadMemory.single('archivo'), parsearXMLFactura);
comprasRouter.post('/',                         crearComp);
comprasRouter.put('/:id',                       actualizarComp);
comprasRouter.delete('/:id',                    eliminarComp);

// ── USUARIOS ──────────────────────────────────────────────
const usuariosRouter = express.Router();
usuariosRouter.use(verificarToken, soloAdmin);
usuariosRouter.get('/',       listarUs);
usuariosRouter.post('/',      crearUs);
usuariosRouter.put('/:id',    actualizarUs);
usuariosRouter.delete('/:id', eliminarUs);

// ── DASHBOARD ─────────────────────────────────────────────
const dashboardRouter = express.Router();
dashboardRouter.use(verificarToken);
dashboardRouter.get('/', resumen);
dashboardRouter.get('/alertas-stock', alertasStock);

// ── REPORTES ──────────────────────────────────────────────
const reportesRouter = express.Router();
reportesRouter.use(verificarToken, soloAdmin);
reportesRouter.get('/ventas',                 reporteVentas);
reportesRouter.get('/productos-mas-vendidos', productosMasVendidos);
reportesRouter.get('/movimientos',            movimientos);

// ── FACTURAS EFACILITO ────────────────────────────────────
const facturasEfRouter = express.Router();
facturasEfRouter.use(verificarToken, soloAdmin);
facturasEfRouter.post('/importar',  ...importar);
facturasEfRouter.get('/exportar',   exportarFacEf);
facturasEfRouter.get('/',           listarFacEf);
facturasEfRouter.delete('/:id',     eliminarFacEf);

// ── LOGS DE ACTIVIDAD ─────────────────────────────────────
const logsRouter = express.Router();
logsRouter.use(verificarToken, soloAdmin);
logsRouter.get('/usuarios', listarUsuariosLog);
logsRouter.get('/',         listarLogs);

module.exports = {
  authRouter,
  productosRouter,
  clientesRouter,
  documentosRouter,
  comprasRouter,
  usuariosRouter,
  dashboardRouter,
  reportesRouter,
  facturasEfRouter,
  logsRouter,
};