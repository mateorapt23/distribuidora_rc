const pool = require('../config/db');
const { registrarLog } = require('./logHelper');

const generarNumeroCompra = async (client) => {
  const { rows } = await client.query("SELECT nextval('seq_compra') AS n");
  return `C-${String(rows[0].n).padStart(4, '0')}`;
};

const listar = async (req, res) => {
  const { buscar, fecha_desde, fecha_hasta, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  if (buscar) {
    params.push(`%${buscar}%`);
    where += ` AND (c.numero ILIKE $${params.length} OR c.proveedor_nombre ILIKE $${params.length} OR c.factura_ref ILIKE $${params.length})`;
  }
  if (fecha_desde) { params.push(fecha_desde); where += ` AND c.fecha >= $${params.length}`; }
  if (fecha_hasta) { params.push(fecha_hasta); where += ` AND c.fecha <= $${params.length}`; }

  try {
    const { rows: total } = await pool.query(
      `SELECT COUNT(*) FROM compras c ${where}`, params
    );

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT c.*, u.nombre as usuario_nombre FROM compras c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       ${where} ORDER BY c.creado_en DESC 
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, total: parseInt(total[0].count), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: 'Error al listar compras' });
  }
};

const obtener = async (req, res) => {
  try {
    const { rows: comp } = await pool.query(
      `SELECT c.*, u.nombre as usuario_nombre FROM compras c
       LEFT JOIN usuarios u ON c.usuario_id = u.id WHERE c.id = $1`,
      [req.params.id]
    );
    if (comp.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });

    const { rows: detalle } = await pool.query(
      `SELECT cd.*, p.codigo FROM compras_detalle cd
       LEFT JOIN productos p ON cd.producto_id = p.id 
       WHERE cd.compra_id = $1 ORDER BY cd.id`,
      [req.params.id]
    );

    res.json({ ...comp[0], detalle });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener compra' });
  }
};

const crear = async (req, res) => {
  const { proveedor_id, proveedor_nombre, fecha, factura_ref, notas, detalle } = req.body;

  if (!detalle || detalle.length === 0) {
    return res.status(400).json({ error: 'La compra debe tener al menos un producto' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const numero = await generarNumeroCompra(client);

    let subtotal = 0, total_iva = 0;
    for (const item of detalle) {
      const sub = parseFloat(item.cantidad) * parseFloat(item.costo);
      subtotal += sub;
      total_iva += sub * (parseFloat(item.iva || 0) / 100);
    }
    const total = subtotal + total_iva;

    const { rows: compRows } = await client.query(
      `INSERT INTO compras (numero, proveedor_id, proveedor_nombre, fecha, factura_ref, subtotal, total_iva, total, notas, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [numero, proveedor_id || null, proveedor_nombre, fecha || new Date().toISOString().split('T')[0], factura_ref, subtotal, total_iva, total, notas, req.usuario.id]
    );
    const compra = compRows[0];

    for (const item of detalle) {
      const sub = parseFloat(item.cantidad) * parseFloat(item.costo);

      await client.query(
        `INSERT INTO compras_detalle (compra_id, producto_id, descripcion, cantidad, costo, iva, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [compra.id, item.producto_id, item.descripcion, item.cantidad, item.costo, item.iva || 0, sub]
      );

      if (item.producto_id) {
        const { rows: prod } = await client.query(
          'SELECT stock FROM productos WHERE id = $1 FOR UPDATE', [item.producto_id]
        );
        const stockAnterior = parseFloat(prod[0].stock);
        const stockNuevo = stockAnterior + parseFloat(item.cantidad);

        await client.query(
          'UPDATE productos SET stock = $1 WHERE id = $2', [stockNuevo, item.producto_id]
        );

        await client.query(
          `INSERT INTO movimiento_stock (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_id, referencia_tipo, usuario_id)
           VALUES ($1,'entrada_compra',$2,$3,$4,$5,'compra',$6)`,
          [item.producto_id, parseFloat(item.cantidad), stockAnterior, stockNuevo, compra.id, req.usuario.id]
        );
      }
    }

    await client.query('COMMIT');

    await registrarLog(req, {
      accion: 'crear_compra',
      modulo: 'compras',
      descripcion: `Registró compra ${numero} de "${proveedor_nombre || 'proveedor desconocido'}" por $${total.toFixed(2)}${factura_ref ? ` (ref: ${factura_ref})` : ''}`,
      referencia_id: compra.id,
    });

    res.status(201).json(compra);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al registrar compra: ' + err.message });
  } finally {
    client.release();
  }
};

const eliminar = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM compras WHERE id = $1', [req.params.id]
    );
    if (rows.length === 0) throw new Error('Compra no encontrada');
    const compra = rows[0];

    const { rows: detalle } = await client.query(
      'SELECT * FROM compras_detalle WHERE compra_id = $1', [req.params.id]
    );

    for (const item of detalle) {
      if (item.producto_id) {
        const { rows: prod } = await client.query(
          'SELECT stock FROM productos WHERE id = $1 FOR UPDATE', [item.producto_id]
        );
        const stockAnterior = parseFloat(prod[0].stock);
        const stockNuevo = stockAnterior - parseFloat(item.cantidad);

        await client.query(
          'UPDATE productos SET stock = $1 WHERE id = $2', [stockNuevo, item.producto_id]
        );
        await client.query(
          `INSERT INTO movimiento_stock (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_id, referencia_tipo, usuario_id)
           VALUES ($1,'ajuste_manual',$2,$3,$4,$5,'anulacion_compra',$6)`,
          [item.producto_id, -parseFloat(item.cantidad), stockAnterior, stockNuevo, req.params.id, req.usuario.id]
        );
      }
    }

    await client.query('DELETE FROM compras WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');

    await registrarLog(req, {
      accion: 'eliminar_compra',
      modulo: 'compras',
      descripcion: `Eliminó compra ${compra.numero} de "${compra.proveedor_nombre || 'proveedor desconocido'}" por $${compra.total}`,
      referencia_id: parseInt(req.params.id),
    });

    res.json({ mensaje: 'Compra eliminada y stock revertido' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = { listar, obtener, crear, eliminar };