const pool = require('../config/db');

const resumen = async (req, res) => {
  try {
    const [productos, stockBajo, proformasHoy, recibosHoy, ventasMes, comprasMes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM productos WHERE activo = TRUE'),
      pool.query('SELECT COUNT(*) FROM productos WHERE activo = TRUE AND inventariable = TRUE AND stock <= stock_minimo AND stock_minimo > 0'),
      pool.query("SELECT COUNT(*) FROM documentos WHERE tipo = 'proforma' AND fecha = CURRENT_DATE"),
      pool.query("SELECT COUNT(*), COALESCE(SUM(total),0) as total FROM documentos WHERE tipo = 'recibo' AND fecha = CURRENT_DATE"),
      pool.query("SELECT COALESCE(SUM(total),0) as total, COUNT(*) as cantidad FROM documentos WHERE tipo = 'recibo' AND DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)"),
      pool.query("SELECT COALESCE(SUM(total),0) as total, COUNT(*) as cantidad FROM compras WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)"),
    ]);

    const { rows: alertas } = await pool.query(
      `SELECT codigo, descripcion, stock, stock_minimo FROM productos
       WHERE activo = TRUE AND inventariable = TRUE AND stock <= stock_minimo AND stock_minimo > 0
       ORDER BY (stock - stock_minimo) ASC LIMIT 10`
    );

    const { rows: ultimosRecibos } = await pool.query(
      `SELECT numero, cliente, total, fecha FROM documentos
       WHERE tipo = 'recibo' ORDER BY creado_en DESC LIMIT 5`
    );

    res.json({
      productos: parseInt(productos.rows[0].count),
      stock_bajo: parseInt(stockBajo.rows[0].count),
      proformas_hoy: parseInt(proformasHoy.rows[0].count),
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

module.exports = { resumen, reporteVentas, productosMasVendidos, movimientos };