require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const { authRouter, productosRouter, documentosRouter, comprasRouter, usuariosRouter, dashboardRouter, reportesRouter, facturasEfRouter } = require('./routes/index');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

app.use('/api/auth',        authRouter);
app.use('/api/productos',   productosRouter);
app.use('/api/documentos',  documentosRouter);
app.use('/api/compras',     comprasRouter);
app.use('/api/usuarios',    usuariosRouter);
app.use('/api/dashboard',   dashboardRouter);
app.use('/api/reportes',    reportesRouter);
app.use('/api/facturas-ef', facturasEfRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});