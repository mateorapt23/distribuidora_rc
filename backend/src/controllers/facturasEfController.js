// src/controllers/facturasEfController.js
// Importa el Excel exportado desde Efacilito (formato: 1 fila por producto)
// Guarda cabecera de factura + detalle, y descuenta stock de productos.

const pool   = require('../config/db');
const XLSX   = require('xlsx');
const multer = require('multer');

// ── Multer: memoria ───────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('spreadsheet') ||
        file.mimetype.includes('excel') ||
        file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos Excel (.xlsx, .xls)'));
    }
  },
});

// ── Helpers ───────────────────────────────────────────────────
const toFloat = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.substring(0, 10);
    const [d, m, y] = v.split('/');
    if (d && m && y) return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return null;
};

// ── Parsear Excel de Efacilito ────────────────────────────────
// Formato real: cabeceras en fila 4 (índice 3), 1 fila por producto vendido
// Columnas: Nro Factura | Fecha | Tipo | Céd/Ruc/Pas | Cliente | Estado |
//           Código | Producto/Servicio | Precio | Cantidad | Total |
//           Descuento | %Iva | Importe | Vendedor
const parsearExcel = (buffer) => {
  const wb   = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  // Buscar fila de cabeceras (contiene "Nro" o "Nro Factura")
  let headerIdx = -1;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    if (row && row.some(c =>
      typeof c === 'string' &&
      (c.trim().toLowerCase() === 'nro factura' || c.trim().toLowerCase() === 'nro')
    )) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('No se encontraron las cabeceras del archivo Efacilito.');

  const headers = rows[headerIdx].map(h => (h || '').toString().trim().toLowerCase());

  const col = (names) => {
    for (const n of names) {
      const idx = headers.findIndex(h => h.includes(n.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxNro      = col(['nro factura', 'nro']);
  const idxFecha    = col(['fecha']);
  const idxCedula   = col(['céd', 'ced', 'ruc', 'identificac']);
  const idxCliente  = col(['cliente']);
  const idxEstado   = col(['estado']);
  const idxCodigo   = col(['código', 'codigo']);
  const idxDesc     = col(['producto', 'servicio', 'descripcion', 'descripción']);
  const idxPrecio   = col(['precio']);
  const idxCantidad = col(['cantidad']);
  const idxTotal    = col(['total']);
  const idxDescto   = col(['descuento']);
  const idxPctIva   = col(['%iva', 'pct iva', 'iva']);
  const idxImporte  = col(['importe']);

  // Agrupar líneas por Nro Factura
  const mapaFacturas = new Map(); // nro_factura → { cabecera, lineas[] }

  for (const row of rows.slice(headerIdx + 1)) {
    const nro = row[idxNro];
    if (!nro || typeof nro !== 'string' || !nro.includes('-')) continue;

    const nroTrim = nro.trim();
    if (!mapaFacturas.has(nroTrim)) {
      mapaFacturas.set(nroTrim, {
        nro_factura: nroTrim,
        fecha:       toDate(row[idxFecha]),
        cedula_ruc:  (() => {
          const v = row[idxCedula];
          if (v === null || v === undefined || v === '') return '';
          // Evitar notación científica en RUCs largos (ej: 1.79e+12 → "1791982894001")
          const n = Number(v);
          if (!isNaN(n) && Math.abs(n) > 999999) return Math.round(n).toString();
          return v.toString().trim();
        })(),
        cliente:     (row[idxCliente] || '').toString().trim(),
        estado:      row[idxEstado] ? row[idxEstado].toString().trim().toUpperCase() : 'AUTORIZADO',
        lineas:      [],
      });
    }

    mapaFacturas.get(nroTrim).lineas.push({
      codigo:      (row[idxCodigo]   || '').toString().trim(),
      descripcion: (row[idxDesc]     || '').toString().trim(),
      precio:      toFloat(row[idxPrecio]),
      cantidad:    toFloat(row[idxCantidad]),
      descuento:   toFloat(row[idxDescto]),
      pct_iva:     toFloat(row[idxPctIva]),
      importe:     toFloat(row[idxImporte]),
    });
  }

  if (mapaFacturas.size === 0) throw new Error('El archivo no contiene facturas válidas.');

  // Calcular total de cada factura sumando importe de sus líneas
  for (const [, fac] of mapaFacturas) {
    fac.total = fac.lineas.reduce((s, l) => s + l.importe, 0);
  }

  return [...mapaFacturas.values()];
};

// ════════════════════════════════════════════════════════════
// POST /api/facturas-ef/importar
// ════════════════════════════════════════════════════════════
const importar = [
  upload.single('archivo'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

    const client = await pool.connect();
    try {
      const facturas = parsearExcel(req.file.buffer);
      await client.query('BEGIN');

      let insertadas = 0, actualizadas = 0, stockMovimientos = 0;

      for (const fac of facturas) {
        // 1. UPSERT cabecera de factura
        const r = await client.query(
          `INSERT INTO facturas_efacilito
             (nro_factura, fecha, cedula_ruc, cliente, estado, total, archivo_origen, usuario_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (nro_factura) DO UPDATE SET
             fecha         = EXCLUDED.fecha,
             cedula_ruc    = EXCLUDED.cedula_ruc,
             cliente       = EXCLUDED.cliente,
             estado        = EXCLUDED.estado,
             total         = EXCLUDED.total,
             archivo_origen= EXCLUDED.archivo_origen
           RETURNING id, (xmax = 0) AS inserted`,
          [
            fac.nro_factura, fac.fecha, fac.cedula_ruc, fac.cliente,
            fac.estado, fac.total,
            req.file.originalname,
            req.user?.id || null,
          ]
        );

        const facturaId = r.rows[0].id;
        const esNueva   = r.rows[0].inserted;

        if (esNueva) {
          insertadas++;
        } else {
          actualizadas++;
          // Borrar el detalle anterior para re-insertar actualizado
          await client.query('DELETE FROM facturas_efacilito_detalle WHERE factura_id = $1', [facturaId]);
        }

        // 2. Insertar líneas de detalle y descontar stock (solo en facturas nuevas)
        for (const linea of fac.lineas) {
          // Buscar producto por código
          let productoId = null;
          if (linea.codigo) {
            const pRes = await client.query(
              'SELECT id, stock FROM productos WHERE codigo = $1 AND activo = TRUE',
              [linea.codigo]
            );
            if (pRes.rows.length > 0) {
              productoId = pRes.rows[0].id;

              // Descontar stock solo en facturas nuevas (no duplicar en re-importación)
              if (esNueva && linea.cantidad > 0) {
                const stockAnterior = parseFloat(pRes.rows[0].stock);
                const stockNuevo    = stockAnterior - linea.cantidad;

                await client.query(
                  'UPDATE productos SET stock = $1 WHERE id = $2',
                  [stockNuevo, productoId]
                );

                await client.query(
                  `INSERT INTO movimiento_stock
                     (producto_id, tipo, cantidad, stock_anterior, stock_nuevo,
                      referencia_id, referencia_tipo, usuario_id)
                   VALUES ($1, 'salida_factura_efacilito', $2, $3, $4, $5, 'facturas_efacilito', $6)`,
                  [productoId, linea.cantidad, stockAnterior, stockNuevo, facturaId, req.user?.id || null]
                );
                stockMovimientos++;
              }
            }
          }

          await client.query(
            `INSERT INTO facturas_efacilito_detalle
               (factura_id, codigo, producto_id, descripcion, precio, cantidad, descuento, pct_iva, importe)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [facturaId, linea.codigo || null, productoId, linea.descripcion,
             linea.precio, linea.cantidad, linea.descuento, linea.pct_iva, linea.importe]
          );
        }
      }

      await client.query('COMMIT');

      // Devolver las facturas importadas
      const nros = facturas.map(f => f.nro_factura);
      const { rows } = await client.query(
        `SELECT f.*, 
           json_agg(
             json_build_object(
               'id', d.id, 'codigo', d.codigo, 'descripcion', d.descripcion,
               'precio', d.precio, 'cantidad', d.cantidad, 'descuento', d.descuento,
               'pct_iva', d.pct_iva, 'importe', d.importe, 'producto_id', d.producto_id
             ) ORDER BY d.id
           ) AS detalle
         FROM facturas_efacilito f
         LEFT JOIN facturas_efacilito_detalle d ON d.factura_id = f.id
         WHERE f.nro_factura = ANY($1)
         GROUP BY f.id
         ORDER BY f.fecha DESC, f.nro_factura DESC`,
        [nros]
      );

      res.json({
        facturas: rows.map(mapRow),
        resumen: { insertadas, actualizadas, total: facturas.length, stockMovimientos },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[facturas-ef] importar:', err.message);
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  },
];

// ════════════════════════════════════════════════════════════
// GET /api/facturas-ef
// ════════════════════════════════════════════════════════════
const listar = async (req, res) => {
  const { fecha_desde, fecha_hasta, buscar } = req.query;

  const conditions = [];
  const params     = [];

  if (fecha_desde) { params.push(fecha_desde); conditions.push(`f.fecha >= $${params.length}`); }
  if (fecha_hasta) { params.push(fecha_hasta); conditions.push(`f.fecha <= $${params.length}`); }
  if (buscar) {
    params.push(`%${buscar}%`);
    conditions.push(`(f.nro_factura ILIKE $${params.length} OR f.cliente ILIKE $${params.length} OR f.cedula_ruc ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT f.*,
         json_agg(
           json_build_object(
             'id', d.id, 'codigo', d.codigo, 'descripcion', d.descripcion,
             'precio', d.precio, 'cantidad', d.cantidad, 'descuento', d.descuento,
             'pct_iva', d.pct_iva, 'importe', d.importe, 'producto_id', d.producto_id
           ) ORDER BY d.id
         ) AS detalle
       FROM facturas_efacilito f
       LEFT JOIN facturas_efacilito_detalle d ON d.factura_id = f.id
       ${where}
       GROUP BY f.id
       ORDER BY f.fecha DESC, f.nro_factura DESC`,
      params
    );

    const total_ventas = rows.reduce((s, r) => s + parseFloat(r.total || 0), 0);

    res.json({
      facturas: rows.map(mapRow),
      resumen: {
        total: rows.length,
        autorizadas: rows.filter(r => r.estado === 'AUTORIZADO').length,
        total_ventas: total_ventas.toFixed(2),
      },
    });
  } catch (err) {
    console.error('[facturas-ef] listar:', err.message);
    res.status(500).json({ error: 'Error al obtener facturas.' });
  }
};

// ════════════════════════════════════════════════════════════
// GET /api/facturas-ef/exportar
// ════════════════════════════════════════════════════════════
const exportar = async (req, res) => {
  const { fecha_desde, fecha_hasta, buscar } = req.query;

  const conditions = [];
  const params     = [];

  if (fecha_desde) { params.push(fecha_desde); conditions.push(`f.fecha >= $${params.length}`); }
  if (fecha_hasta) { params.push(fecha_hasta); conditions.push(`f.fecha <= $${params.length}`); }
  if (buscar) {
    params.push(`%${buscar}%`);
    conditions.push(`(f.nro_factura ILIKE $${params.length} OR f.cliente ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT f.nro_factura, f.fecha, f.cedula_ruc, f.cliente, f.estado, f.total,
              d.codigo, d.descripcion, d.precio, d.cantidad, d.descuento, d.pct_iva, d.importe
       FROM facturas_efacilito f
       LEFT JOIN facturas_efacilito_detalle d ON d.factura_id = f.id
       ${where}
       ORDER BY f.fecha DESC, f.nro_factura DESC, d.id`,
      params
    );

    const datos = rows.map(r => ({
      'Nro. Factura': r.nro_factura,
      'Fecha':        r.fecha ? r.fecha.toISOString().split('T')[0] : '',
      'Cédula / RUC': r.cedula_ruc,
      'Cliente':      r.cliente,
      'Estado':       r.estado,
      'Código':       r.codigo || '',
      'Descripción':  r.descripcion || '',
      'Precio':       parseFloat(r.precio || 0),
      'Cantidad':     parseFloat(r.cantidad || 0),
      'Descuento':    parseFloat(r.descuento || 0),
      '% IVA':        parseFloat(r.pct_iva || 0),
      'Importe':      parseFloat(r.importe || 0),
      'Total Factura':parseFloat(r.total || 0),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datos);
    ws['!cols'] = [
      {wch:22},{wch:12},{wch:16},{wch:30},{wch:13},
      {wch:10},{wch:35},{wch:10},{wch:10},{wch:10},{wch:7},{wch:12},{wch:14},
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas Efacilito');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const desde = fecha_desde || 'todo';
    const hasta  = fecha_hasta || 'todo';
    res.setHeader('Content-Disposition', `attachment; filename="facturas_efacilito_${desde}_${hasta}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error('[facturas-ef] exportar:', err.message);
    res.status(500).json({ error: 'Error al exportar.' });
  }
};

// ════════════════════════════════════════════════════════════
// DELETE /api/facturas-ef/:id
// ════════════════════════════════════════════════════════════
const eliminar = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM facturas_efacilito WHERE id = $1', [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Factura no encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[facturas-ef] eliminar:', err.message);
    res.status(500).json({ error: 'Error al eliminar.' });
  }
};

// ── Mapper BD → frontend ──────────────────────────────────────
const mapRow = (r) => ({
  id:           r.id,
  nro_factura:  r.nro_factura,
  fecha:        r.fecha ? r.fecha.toISOString().split('T')[0] : null,
  cedula_ruc:   r.cedula_ruc,
  cliente:      r.cliente,
  estado:       r.estado,
  total:        parseFloat(r.total || 0),
  importado_en: r.importado_en,
  detalle:      (r.detalle || []).filter(d => d && d.id),
});

module.exports = { importar, listar, exportar, eliminar };