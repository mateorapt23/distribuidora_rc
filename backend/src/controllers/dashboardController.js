const pool = require('../config/db');

// "HOY" siempre en hora de Ecuador, sin importar en qué zona horaria
// corra el servidor de Postgres (Neon corre en UTC). Antes se usaba
// CURRENT_DATE directo, que en UTC ya cae en "mañana" desde
// aproximadamente las 19:00 hora de Ecuador en adelante, así que
// "ventas hoy" contaba 0 aunque sí hubiera recibos del día.
const HOY_ECUADOR = `(NOW() AT TIME ZONE 'America/Guayaquil')::date`;

const resumen = async (req, res) => {
  try {
    const STOCK_CON_MOVIMIENTO = `
      EXISTS (
        SELECT 1 FROM movimiento_stock ms
        WHERE ms.producto_id = p.id
          AND ms.tipo IN ('entrada_compra', 'ajuste_manual')
          AND ms.cantidad > 0
      )
    `;

    // Proforma "pendiente" = no ha sido convertida todavía a recibo
    // (antes se contaban solo las proformas creadas hoy, por eso
    // casi siempre marcaba 0).
    const PROFORMA_PENDIENTE = `
      NOT EXISTS (
        SELECT 1 FROM documentos r
        WHERE r.tipo = 'recibo' AND r.convertido_de = d.id
      )
    `;

    const [productos, stockBajo, proformasPendientes, recibosHoy, ventasMes, comprasMes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM productos WHERE activo = TRUE'),
      pool.query(`
        SELECT COUNT(*) FROM productos p
        WHERE p.activo = TRUE AND p.inventariable = TRUE
          AND p.stock <= 5
          AND ${STOCK_CON_MOVIMIENTO}
      `),
      pool.query(`SELECT COUNT(*) FROM documentos d WHERE d.tipo = 'proforma' AND ${PROFORMA_PENDIENTE}`),
      pool.query(`SELECT COUNT(*), COALESCE(SUM(total),0) as total FROM documentos WHERE tipo = 'recibo' AND fecha = ${HOY_ECUADOR}`),
      pool.query(`SELECT COALESCE(SUM(total),0) as total, COUNT(*) as cantidad FROM documentos WHERE tipo = 'recibo' AND DATE_TRUNC('month', fecha) = DATE_TRUNC('month', ${HOY_ECUADOR})`),
      pool.query(`SELECT COALESCE(SUM(total),0) as total, COUNT(*) as cantidad FROM compras WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', ${HOY_ECUADOR})`),
    ]);

    // Top 10 para la tabla del dashboard + el total REAL de productos con
    // stock bajo (antes se usaba rows.length de una consulta con LIMIT,
    // así que el aviso flotante nunca podía pasar de ese límite aunque
    // hubiera muchos más productos en esa condición).
    const { rows: alertas } = await pool.query(`
      SELECT p.codigo, p.descripcion, p.stock, p.stock_minimo
      FROM productos p
      WHERE p.activo = TRUE AND p.inventariable = TRUE
        AND p.stock <= 5
        AND ${STOCK_CON_MOVIMIENTO}
      ORDER BY (p.stock - p.stock_minimo) ASC LIMIT 10
    `);

    const { rows: ultimosRecibos } = await pool.query(
      `SELECT numero, cliente, total, fecha FROM documentos
       WHERE tipo = 'recibo' ORDER BY creado_en DESC LIMIT 5`
    );

    res.json({
      productos: parseInt(productos.rows[0].count),
      stock_bajo: parseInt(stockBajo.rows[0].count),
      proformas_hoy: parseInt(proformasPendientes.rows[0].count),
      recibos_hoy: {
        cantidad: parseInt(recibosHoy.rows[0].count),
        total: parseFloat(recibosHoy.rows[0].total),
      },
      ventas_mes: {
        total: parseFloat(ventasMes.rows[0].total),
        cantidad: parseInt(ventasMes.rows[0].cantidad),
      },
      compras_mes: {
        total: parseFloat(comprasMes.rows[0].total),
        cantidad: parseInt(comprasMes.rows[0].cantidad),
      },
      alertas_stock: alertas,
      ultimos_recibos: ultimosRecibos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cargar dashboard' });
  }
};

const reporteVentas = async (req, res) => {
  const { fecha_desde, fecha_hasta } = req.query;
  const params = [];
  let where = "WHERE tipo = 'recibo'";

  if (fecha_desde) { params.push(fecha_desde); where += ` AND fecha >= $${params.length}`; }
  if (fecha_hasta) { params.push(fecha_hasta); where += ` AND fecha <= $${params.length}`; }

  try {
    const { rows } = await pool.query(
      `SELECT d.numero, d.cliente, d.fecha, d.subtotal, d.total_iva, d.total,
              u.nombre as usuario
       FROM documentos d LEFT JOIN usuarios u ON d.usuario_id = u.id
       ${where} ORDER BY d.fecha DESC`,
      params
    );

    const { rows: totales } = await pool.query(
      `SELECT COUNT(*) as cantidad, COALESCE(SUM(total),0) as total,
              COALESCE(SUM(total_iva),0) as total_iva 
       FROM documentos ${where}`,
      params
    );

    res.json({ data: rows, resumen: totales[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error en reporte de ventas' });
  }
};

const productosMasVendidos = async (req, res) => {
  const { fecha_desde, fecha_hasta, limit = 20 } = req.query;
  const params = [];
  let where = "WHERE d.tipo = 'recibo'";

  if (fecha_desde) { params.push(fecha_desde); where += ` AND d.fecha >= $${params.length}`; }
  if (fecha_hasta) { params.push(fecha_hasta); where += ` AND d.fecha <= $${params.length}`; }

  try {
    params.push(limit);
    const { rows } = await pool.query(
      `SELECT p.codigo, p.descripcion, 
              SUM(dd.cantidad) as cantidad_vendida,
              SUM(dd.subtotal) as total_vendido, 
              COUNT(DISTINCT d.id) as num_documentos
       FROM documentos_detalle dd
       JOIN documentos d ON dd.documento_id = d.id
       JOIN productos p ON dd.producto_id = p.id
       ${where}
       GROUP BY p.id, p.codigo, p.descripcion
       ORDER BY cantidad_vendida DESC LIMIT $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en reporte' });
  }
};

const movimientos = async (req, res) => {
  const { producto_id, tipo, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let where = 'WHERE 1=1';

  if (producto_id) { params.push(producto_id); where += ` AND ms.producto_id = $${params.length}`; }
  if (tipo) { params.push(tipo); where += ` AND ms.tipo = $${params.length}`; }
  if (fecha_desde) { params.push(fecha_desde); where += ` AND ms.creado_en::date >= $${params.length}`; }
  if (fecha_hasta) { params.push(fecha_hasta); where += ` AND ms.creado_en::date <= $${params.length}`; }

  try {
    const { rows: total } = await pool.query(
      `SELECT COUNT(*) FROM movimiento_stock ms ${where}`, params
    );

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT ms.*, p.codigo, p.descripcion, u.nombre as usuario_nombre
       FROM movimiento_stock ms
       JOIN productos p ON ms.producto_id = p.id
       LEFT JOIN usuarios u ON ms.usuario_id = u.id
       ${where} ORDER BY ms.creado_en DESC 
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, total: parseInt(total[0].count), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: 'Error en reporte de movimientos' });
  }
};

const alertasStock = async (req, res) => {
  try {
    const CONDICION = `
      p.activo = TRUE
      AND p.inventariable = TRUE
      AND p.stock <= 5
      AND EXISTS (
        SELECT 1 FROM movimiento_stock ms
        WHERE ms.producto_id = p.id
          AND ms.tipo IN ('entrada_compra', 'ajuste_manual')
          AND ms.cantidad > 0
      )
    `;

    // Antes 'total' era rows.length, que con el LIMIT 20 nunca podía pasar
    // de 20 aunque hubiera muchos más productos con stock bajo (por eso el
    // aviso decía "20 productos" mientras el dashboard decía 242: eran la
    // misma condición, pero un número venía recortado por el LIMIT y el
    // otro no). Ahora el total es un COUNT(*) real, y la lista sigue
    // limitada a 20 solo para mostrar el detalle.
    const [{ rows }, { rows: totalRows }] = await Promise.all([
      pool.query(`
        SELECT p.codigo, p.descripcion, p.stock, p.stock_minimo
        FROM productos p
        WHERE ${CONDICION}
        ORDER BY p.stock ASC
        LIMIT 20
      `),
      pool.query(`SELECT COUNT(*) FROM productos p WHERE ${CONDICION}`),
    ]);

    res.json({ alertas: rows, total: parseInt(totalRows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener alertas de stock' });
  }
};

module.exports = { resumen, reporteVentas, productosMasVendidos, movimientos, alertasStock };