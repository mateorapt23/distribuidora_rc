const pool = require('../config/db');
const { registrarLog } = require('./logHelper');

const generarNumero = async (client, tipo) => {
  const seq = tipo === 'proforma' ? 'seq_proforma' : 'seq_recibo';
  const prefix = tipo === 'proforma' ? 'P' : 'R';
  const { rows } = await client.query(`SELECT nextval('${seq}') AS n`);
  return `${prefix}-${String(rows[0].n).padStart(4, '0')}`;
};

const listar = async (req, res) => {
  const { tipo, buscar, fecha_desde, fecha_hasta, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  if (tipo) { params.push(tipo); where += ` AND tipo = $${params.length}`; }
  if (buscar) { params.push(`%${buscar}%`); where += ` AND (numero ILIKE $${params.length} OR cliente ILIKE $${params.length})`; }
  if (fecha_desde) { params.push(fecha_desde); where += ` AND fecha >= $${params.length}`; }
  if (fecha_hasta) { params.push(fecha_hasta); where += ` AND fecha <= $${params.length}`; }

  try {
    const { rows: total } = await pool.query(
      `SELECT COUNT(*) FROM documentos ${where}`, params
    );

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT d.*, u.nombre as usuario_nombre FROM documentos d
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       ${where} ORDER BY d.creado_en DESC 
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, total: parseInt(total[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar documentos' });
  }
};

const obtener = async (req, res) => {
  try {
    const { rows: doc } = await pool.query(
      `SELECT d.*, u.nombre as usuario_nombre FROM documentos d
       LEFT JOIN usuarios u ON d.usuario_id = u.id WHERE d.id = $1`,
      [req.params.id]
    );
    if (doc.length === 0) return res.status(404).json({ error: 'Documento no encontrado' });

    const { rows: detalle } = await pool.query(
      `SELECT dd.*, p.codigo FROM documentos_detalle dd
       LEFT JOIN productos p ON dd.producto_id = p.id
       WHERE dd.documento_id = $1 ORDER BY dd.id`,
      [req.params.id]
    );

    res.json({ ...doc[0], detalle });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener documento' });
  }
};

const crear = async (req, res) => {
  const { tipo = 'proforma', cliente = 'Consumidor Final', fecha, notas, detalle } = req.body;

  if (!detalle || detalle.length === 0) {
    return res.status(400).json({ error: 'El documento debe tener al menos un producto' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const numero = await generarNumero(client, tipo);

    let subtotal = 0, total_iva = 0;
    for (const item of detalle) {
      const sub = parseFloat(item.cantidad) * parseFloat(item.precio);
      subtotal += sub;
      total_iva += sub * (parseFloat(item.iva || 0) / 100);
    }
    const total = subtotal + total_iva;

    const { rows: docRows } = await client.query(
      `INSERT INTO documentos (numero, tipo, cliente, fecha, subtotal, total_iva, total, notas, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [numero, tipo, cliente, fecha || new Date().toISOString().split('T')[0], subtotal, total_iva, total, notas, req.usuario.id]
    );
    const doc = docRows[0];

    for (const item of detalle) {
      const sub = parseFloat(item.cantidad) * parseFloat(item.precio);

      await client.query(
        `INSERT INTO documentos_detalle (documento_id, producto_id, descripcion, cantidad, precio, iva, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [doc.id, item.producto_id, item.descripcion, item.cantidad, item.precio, item.iva || 0, sub]
      );

      if (tipo === 'recibo' && item.producto_id) {
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
           VALUES ($1,'salida_recibo',$2,$3,$4,$5,'recibo',$6)`,
          [item.producto_id, -parseFloat(item.cantidad), stockAnterior, stockNuevo, doc.id, req.usuario.id]
        );
      }
    }

    await client.query('COMMIT');

    await registrarLog(req, {
      accion: tipo === 'recibo' ? 'crear_recibo' : 'crear_proforma',
      modulo: 'documentos',
      descripcion: `Creó ${tipo} ${numero} para "${cliente}" por $${total.toFixed(2)}`,
      referencia_id: doc.id,
    });

    res.status(201).json({ ...doc, detalle });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al crear documento: ' + err.message });
  } finally {
    client.release();
  }
};

const actualizar = async (req, res) => {
  const { cliente, fecha, notas, detalle } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: docRows } = await client.query(
      'SELECT * FROM documentos WHERE id = $1 FOR UPDATE', [req.params.id]
    );
    if (docRows.length === 0) throw new Error('Documento no encontrado');

    const doc = docRows[0];
    const esRecibo = doc.tipo === 'recibo';

    if (esRecibo) {
      const { rows: detalleAnterior } = await client.query(
        'SELECT * FROM documentos_detalle WHERE documento_id = $1', [req.params.id]
      );
      for (const item of detalleAnterior) {
        if (item.producto_id) {
          const { rows: prod } = await client.query(
            'SELECT stock FROM productos WHERE id = $1 FOR UPDATE', [item.producto_id]
          );
          const stockAnterior = parseFloat(prod[0].stock);
          const stockRevertido = stockAnterior + parseFloat(item.cantidad);

          await client.query(
            'UPDATE productos SET stock = $1 WHERE id = $2', [stockRevertido, item.producto_id]
          );
          await client.query(
            `INSERT INTO movimiento_stock (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_id, referencia_tipo, usuario_id)
             VALUES ($1,'ajuste_manual',$2,$3,$4,$5,'edicion_recibo',$6)`,
            [item.producto_id, parseFloat(item.cantidad), stockAnterior, stockRevertido, req.params.id, req.usuario.id]
          );
        }
      }
    }

    let subtotal = 0, total_iva = 0;
    for (const item of detalle) {
      const sub = parseFloat(item.cantidad) * parseFloat(item.precio);
      subtotal += sub;
      total_iva += sub * (parseFloat(item.iva || 0) / 100);
    }
    const total = subtotal + total_iva;

    await client.query(
      `UPDATE documentos SET cliente=$1, fecha=$2, notas=$3, subtotal=$4, total_iva=$5, total=$6
       WHERE id=$7`,
      [cliente, fecha, notas, subtotal, total_iva, total, req.params.id]
    );

    await client.query(
      'DELETE FROM documentos_detalle WHERE documento_id = $1', [req.params.id]
    );

    for (const item of detalle) {
      const sub = parseFloat(item.cantidad) * parseFloat(item.precio);
      await client.query(
        `INSERT INTO documentos_detalle (documento_id, producto_id, descripcion, cantidad, precio, iva, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [req.params.id, item.producto_id, item.descripcion, item.cantidad, item.precio, item.iva || 0, sub]
      );

      if (esRecibo && item.producto_id) {
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
           VALUES ($1,'salida_recibo',$2,$3,$4,$5,'recibo',$6)`,
          [item.producto_id, -parseFloat(item.cantidad), stockAnterior, stockNuevo, req.params.id, req.usuario.id]
        );
      }
    }

    await client.query('COMMIT');

    await registrarLog(req, {
      accion: esRecibo ? 'editar_recibo' : 'editar_proforma',
      modulo: 'documentos',
      descripcion: `Editó ${doc.tipo} ${doc.numero} — cliente: "${cliente}", total: $${total.toFixed(2)}`,
      referencia_id: parseInt(req.params.id),
    });

    res.json({ mensaje: esRecibo ? 'Recibo actualizado' : 'Proforma actualizada' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

const convertirARecibo = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: docRows } = await client.query(
      'SELECT * FROM documentos WHERE id = $1 FOR UPDATE', [req.params.id]
    );
    if (docRows.length === 0) throw new Error('Documento no encontrado');
    if (docRows[0].tipo !== 'proforma') throw new Error('El documento ya es un recibo');

    const proforma = docRows[0];

    const { rows: detalleOriginal } = await client.query(
      'SELECT * FROM documentos_detalle WHERE documento_id = $1', [proforma.id]
    );

    const detalleConvertir = req.body.detalle || detalleOriginal;

    const numeroRecibo = await generarNumero(client, 'recibo');

    let subtotal = 0, total_iva = 0;
    for (const item of detalleConvertir) {
      const sub = parseFloat(item.cantidad) * parseFloat(item.precio);
      subtotal += sub;
      total_iva += sub * (parseFloat(item.iva || 0) / 100);
    }
    const total = subtotal + total_iva;

    const { rows: reciboRows } = await client.query(
      `INSERT INTO documentos (numero, tipo, cliente, fecha, subtotal, total_iva, total, notas, usuario_id, convertido_de)
       VALUES ($1,'recibo',$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [numeroRecibo, proforma.cliente, req.body.fecha || proforma.fecha, subtotal, total_iva, total, proforma.notas, req.usuario.id, proforma.id]
    );
    const recibo = reciboRows[0];

    for (const item of detalleConvertir) {
      const sub = parseFloat(item.cantidad) * parseFloat(item.precio);
      await client.query(
        `INSERT INTO documentos_detalle (documento_id, producto_id, descripcion, cantidad, precio, iva, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [recibo.id, item.producto_id, item.descripcion, item.cantidad, item.precio, item.iva || 0, sub]
      );

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
           VALUES ($1,'salida_recibo',$2,$3,$4,$5,'recibo',$6)`,
          [item.producto_id, -parseFloat(item.cantidad), stockAnterior, stockNuevo, recibo.id, req.usuario.id]
        );
      }
    }

    await client.query('COMMIT');

    await registrarLog(req, {
      accion: 'convertir_proforma',
      modulo: 'documentos',
      descripcion: `Convirtió proforma ${proforma.numero} → recibo ${numeroRecibo} para "${proforma.cliente}" por $${total.toFixed(2)}`,
      referencia_id: recibo.id,
    });

    res.json({ mensaje: 'Convertido a recibo exitosamente', recibo_id: recibo.id, numero: recibo.numero });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

const eliminar = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM documentos WHERE id = $1', [req.params.id]
    );
    if (rows.length === 0) throw new Error('Documento no encontrado');
    const doc = rows[0];

    if (doc.tipo === 'recibo') {
      const { rows: detalle } = await client.query(
        'SELECT * FROM documentos_detalle WHERE documento_id = $1', [req.params.id]
      );
      for (const item of detalle) {
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
             VALUES ($1,'ajuste_manual',$2,$3,$4,$5,'anulacion_recibo',$6)`,
            [item.producto_id, parseFloat(item.cantidad), stockAnterior, stockNuevo, req.params.id, req.usuario.id]
          );
        }
      }
    }

    await client.query('DELETE FROM documentos WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');

    await registrarLog(req, {
      accion: doc.tipo === 'recibo' ? 'eliminar_recibo' : 'eliminar_proforma',
      modulo: 'documentos',
      descripcion: `Eliminó ${doc.tipo} ${doc.numero} de "${doc.cliente}"`,
      referencia_id: parseInt(req.params.id),
    });

    res.json({ mensaje: 'Documento eliminado' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = { listar, obtener, crear, actualizar, convertirARecibo, eliminar };