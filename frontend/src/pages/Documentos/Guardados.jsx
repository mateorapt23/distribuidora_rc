import { useEffect, useState, useCallback } from 'react';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import { generarHTMLTermica } from './Tabla';

const C = {
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  border: '#e5e7eb', bg: '#f4f5fb', card: '#ffffff',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444',
};

// ── Iconos ─────────────────────────────────────────────────
const IcoEye     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoConvert = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IcoPrint   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
const IcoTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
const IcoSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoThermal = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/><line x1="9" y1="17" x2="15" y2="17"/></svg>;
const IcoPDF     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>;
const IcoTabla   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>;

export default function Guardados({ onVerEnTabla }) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';

  const [documentos, setDocumentos]           = useState([]);
  const [total, setTotal]                     = useState(0);
  const [page, setPage]                       = useState(1);
  const [filtroTipo, setFiltroTipo]           = useState('');
  const [buscar, setBuscar]                   = useState('');
  const [cargando, setCargando]               = useState(true);
  const [modalVer, setModalVer]               = useState(false);
  const [modalEditar, setModalEditar]         = useState(false);
  const [modalConvertir, setModalConvertir]   = useState(false);
  const [docSeleccionado, setDocSeleccionado] = useState(null);
  const [detalle, setDetalle]                 = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [editCliente, setEditCliente]         = useState('');
  const [editFecha, setEditFecha]             = useState('');
  const [editNotas, setEditNotas]             = useState('');
  const [editFilas, setEditFilas]             = useState([]);
  const [guardando, setGuardando]             = useState(false);
  const LIMIT = 20;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filtroTipo) params.append('tipo', filtroTipo);
      if (buscar)     params.append('buscar', buscar);
      const { data } = await api.get(`/documentos?${params}`);
      setDocumentos(data.data); setTotal(data.total);
    } catch { console.error('Error al cargar documentos'); }
    finally { setCargando(false); }
  }, [page, filtroTipo, buscar]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(1); }, [filtroTipo, buscar]);

  const abrirDetalle = async (doc) => {
    setDocSeleccionado(doc); setCargandoDetalle(true); setModalVer(true);
    try {
      const { data } = await api.get(`/documentos/${doc.id}`);
      setDetalle(data.detalle || []);
    } catch { setDetalle([]); }
    finally { setCargandoDetalle(false); }
  };

  const abrirEditar = async (doc) => {
    setDocSeleccionado(doc); setCargandoDetalle(true);
    try {
      const { data } = await api.get(`/documentos/${doc.id}`);
      setEditCliente(data.cliente);
      setEditFecha(data.fecha?.slice(0, 10));
      setEditNotas(data.notas || '');
      setEditFilas((data.detalle || []).map(d => ({ ...d, _id: Math.random() })));
      setModalEditar(true);
    } catch { alert('Error al cargar documento'); }
    finally { setCargandoDetalle(false); }
  };

  const abrirConvertir = async (doc) => {
    setDocSeleccionado(doc); setCargandoDetalle(true);
    try {
      const { data } = await api.get(`/documentos/${doc.id}`);
      setDetalle(data.detalle || []); setModalConvertir(true);
    } catch { alert('Error al cargar documento'); }
    finally { setCargandoDetalle(false); }
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    try {
      await api.put(`/documentos/${docSeleccionado.id}`, {
        cliente: editCliente, fecha: editFecha, notas: editNotas,
        detalle: editFilas.map(f => ({
          producto_id: f.producto_id, descripcion: f.descripcion,
          cantidad: parseFloat(f.cantidad), precio: parseFloat(f.precio),
          iva: parseFloat(f.iva) || 0,
        })),
      });
      setModalEditar(false); cargar();
    } catch (err) { alert(err.response?.data?.error || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  const convertir = async () => {
    setGuardando(true);
    try {
      const { data } = await api.post(`/documentos/${docSeleccionado.id}/convertir`, {
        detalle: detalle.map(d => ({
          producto_id: d.producto_id, descripcion: d.descripcion,
          cantidad: parseFloat(d.cantidad), precio: parseFloat(d.precio),
          iva: parseFloat(d.iva) || 0,
        })),
      });
      alert(`✅ Convertido a Recibo ${data.numero}`);
      setModalConvertir(false); cargar();
    } catch (err) { alert(err.response?.data?.error || 'Error al convertir'); }
    finally { setGuardando(false); }
  };

  const eliminar = async (doc) => {
    if (!window.confirm(`¿Eliminar ${doc.tipo} ${doc.numero}?`)) return;
    try { await api.delete(`/documentos/${doc.id}`); cargar(); }
    catch (err) { alert(err.response?.data?.error || 'Error al eliminar'); }
  };

  const imprimir = (doc, detalleImp) => {
    const win = window.open('', '_blank');
    const filas = detalleImp || detalle;
    const subtotalBase = filas.reduce((s, f) => s + parseFloat(f.cantidad) * parseFloat(f.precio), 0);
    const totalIva     = filas.reduce((s, f) => {
      const base = parseFloat(f.cantidad) * parseFloat(f.precio);
      return s + base * ((parseFloat(f.iva) || 0) / 100);
    }, 0);
    win.document.write(generarHTML({
      tipo: doc.tipo.toUpperCase(), numero: doc.numero,
      cliente: doc.cliente, fecha: doc.fecha?.slice(0, 10),
      notas: doc.notas || '', filas,
      subtotalBase, totalIva, total: subtotalBase + totalIva,
    }));
    win.document.close(); win.print();
  };

  const imprimirTermica = (doc, detalleImp) => {
    const filas = detalleImp || detalle;
    const subtotalBase = filas.reduce((s, f) => s + parseFloat(f.cantidad) * parseFloat(f.precio), 0);
    const totalIva     = filas.reduce((s, f) => {
      const base = parseFloat(f.cantidad) * parseFloat(f.precio);
      return s + base * ((parseFloat(f.iva) || 0) / 100);
    }, 0);
    const html = generarHTMLTermica({
      tipo: doc.tipo.toUpperCase(), numero: doc.numero,
      cliente: doc.cliente, fecha: doc.fecha?.slice(0, 10),
      notas: doc.notas || '', filas,
      subtotalBase, totalIva, total: subtotalBase + totalIva,
    });
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  const verEnTabla = () => {
    setModalEditar(false);
    if (onVerEnTabla) onVerEnTabla({
      id: docSeleccionado.id,
      tipo: docSeleccionado.tipo,
      cliente: editCliente,
      fecha: editFecha,
      notas: editNotas,
      filas: editFilas,
    });
  };

  const actualizarFilaEditar = (id, campo, valor) => {
    setEditFilas(prev => prev.map(f => {
      if (f._id !== id) return f;
      const nueva = { ...f, [campo]: valor };
      const cant = parseFloat(nueva.cantidad) || 0;
      const prec = parseFloat(nueva.precio)   || 0;
      const iva  = parseFloat(nueva.iva)       || 0;
      nueva.subtotal = cant * prec * (1 + iva / 100);
      return nueva;
    }));
  };

  const totalPags = Math.ceil(total / LIMIT);

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textDim }}>
            <IcoSearch />
          </div>
          <input type="text" placeholder="Buscar por cliente o número..."
            value={buscar} onChange={e => setBuscar(e.target.value)}
            style={{ ...inputSt, paddingLeft: 36 }} />
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          style={{ ...inputSt, width: 160 }}>
          <option value="">Todos los tipos</option>
          <option value="proforma">Proformas</option>
          <option value="recibo">Recibos</option>
        </select>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '9px 16px', fontSize: 13, color: C.textDim, fontWeight: 500 }}>
          {total} documento{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Número', 'Tipo', 'Cliente', 'Fecha', 'Total', 'Usuario', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', color: C.textDim, fontWeight: 600,
                  fontSize: 10, letterSpacing: 1.1, textAlign: 'left',
                  borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: C.textDim }}>
                Cargando...
              </td></tr>
            ) : documentos.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ color: C.textDim, fontSize: 14 }}>No hay documentos guardados</div>
                <div style={{ color: C.textDim, fontSize: 12, marginTop: 6 }}>
                  Crea una proforma o recibo desde la pestaña Nueva
                </div>
              </td></tr>
            ) : documentos.map((doc, i) => (
              <tr key={doc.id} style={{ borderBottom: `1px solid ${C.border}`,
                background: i % 2 === 0 ? '#fff' : '#fafafa',
                transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700,
                  color: C.azul, fontSize: 13 }}>
                  {doc.numero}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                    background: doc.tipo === 'recibo' ? '#f0fdf4' : '#eff6ff',
                    color: doc.tipo === 'recibo' ? C.verde : C.azul }}>
                    {doc.tipo === 'recibo' ? 'Recibo' : 'Proforma'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: C.textSec, fontWeight: 500 }}>
                  {doc.cliente}
                </td>
                <td style={{ padding: '12px 16px', color: C.textDim, fontSize: 12 }}>
                  {doc.fecha?.slice(0, 10)}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14,
                  color: C.textPrimary }}>
                  ${parseFloat(doc.total).toFixed(2)}
                </td>
                <td style={{ padding: '12px 16px', color: C.textDim, fontSize: 12 }}>
                  {doc.usuario_nombre || '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <BtnSm color={C.azul} outline onClick={() => abrirDetalle(doc)} icon={<IcoEye />}>
                      Ver
                    </BtnSm>
                    <BtnSm color={C.amarillo} outline onClick={() => abrirEditar(doc)} icon={<IcoEdit />}>
                      Editar
                    </BtnSm>
                    {doc.tipo === 'proforma' && (
                      <BtnSm color={C.verde} outline onClick={() => abrirConvertir(doc)} icon={<IcoConvert />}>
                        Recibo
                      </BtnSm>
                    )}
                    {esAdmin && (
                      <BtnSm color={C.rojo} outline onClick={() => eliminar(doc)} icon={<IcoTrash />}>
                        Eliminar
                      </BtnSm>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPags > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <BtnSm color={C.azul} outline onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Anterior
          </BtnSm>
          <span style={{ color: C.textDim, fontSize: 13, padding: '0 8px' }}>
            Página {page} de {totalPags}
          </span>
          <BtnSm color={C.azul} outline onClick={() => setPage(p => Math.min(totalPags, p + 1))} disabled={page === totalPags}>
            Siguiente →
          </BtnSm>
        </div>
      )}

      {/* ── Modal VER ── */}
      {modalVer && docSeleccionado && (
        <Modal titulo={`${docSeleccionado.tipo === 'recibo' ? 'Recibo' : 'Proforma'} — ${docSeleccionado.numero}`}
          onClose={() => setModalVer(false)} maxWidth={720}
          badge={{ label: docSeleccionado.tipo === 'recibo' ? 'Recibo' : 'Proforma',
            color: docSeleccionado.tipo === 'recibo' ? C.verde : C.azul }}>
          <InfoDoc doc={docSeleccionado} />
          {cargandoDetalle ? <Cargando /> : <TablaDetalle filas={detalle} />}
          <TotalesDoc filas={detalle} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <BtnModal color="#374151" outline onClick={() => imprimirTermica(docSeleccionado, detalle)} icon={<IcoThermal />}>
              Térmica
            </BtnModal>
            <BtnModal color={C.azul} outline onClick={() => imprimir(docSeleccionado, detalle)} icon={<IcoPDF />}>
              PDF
            </BtnModal>
            <BtnModal color={C.textDim} outline onClick={() => setModalVer(false)}>
              Cerrar
            </BtnModal>
          </div>
        </Modal>
      )}

      {/* ── Modal EDITAR ── */}
      {modalEditar && docSeleccionado && (
        <Modal titulo={`Editar — ${docSeleccionado.numero}`}
          onClose={() => setModalEditar(false)} maxWidth={780}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2 }}>
              <Label>Cliente</Label>
              <input value={editCliente} onChange={e => setEditCliente(e.target.value)} style={inputSt} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Fecha</Label>
              <input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} style={inputSt} />
            </div>
            <div style={{ flex: 2 }}>
              <Label>Notas</Label>
              <input value={editNotas} onChange={e => setEditNotas(e.target.value)} style={inputSt} />
            </div>
          </div>

          <div style={{ background: '#f9fafb', border: `1px solid ${C.border}`,
            borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  {['Descripción', 'Cant.', 'Precio', 'IVA %', 'Subtotal'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: C.textDim, fontSize: 10,
                      letterSpacing: 1.1, textAlign: h === 'Descripción' ? 'left' : 'right',
                      borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editFilas.map((f, i) => (
                  <tr key={f._id} style={{ borderBottom: `1px solid ${C.border}`,
                    background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <input value={f.descripcion}
                        onChange={e => actualizarFilaEditar(f._id, 'descripcion', e.target.value)}
                        style={{ ...celdaSt, width: '100%', minWidth: 180 }} />
                    </td>
                    <td style={{ padding: '6px 8px', width: 80 }}>
                      <input type="number" value={f.cantidad}
                        onChange={e => actualizarFilaEditar(f._id, 'cantidad', e.target.value)}
                        style={{ ...celdaSt, width: '100%', textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '6px 8px', width: 100 }}>
                      <input type="number" value={f.precio}
                        onChange={e => actualizarFilaEditar(f._id, 'precio', e.target.value)}
                        style={{ ...celdaSt, width: '100%', textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '6px 8px', width: 70 }}>
                      <input type="number" value={f.iva}
                        onChange={e => actualizarFilaEditar(f._id, 'iva', e.target.value)}
                        style={{ ...celdaSt, width: '100%', textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '6px 14px', textAlign: 'right',
                      color: C.verde, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ${parseFloat(f.subtotal || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TotalesDoc filas={editFilas} />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <BtnModal color="#8b5cf6" outline onClick={verEnTabla} icon={<IcoTabla />}>
              Ver en tabla
            </BtnModal>
            <div style={{ display: 'flex', gap: 10 }}>
              <BtnModal color={C.textDim} outline onClick={() => setModalEditar(false)}>Cancelar</BtnModal>
              <BtnModal color={C.verde} onClick={guardarEdicion} disabled={guardando} icon={<IcoEdit />}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </BtnModal>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal CONVERTIR ── */}
      {modalConvertir && docSeleccionado && (
        <Modal titulo={`Convertir a Recibo — ${docSeleccionado.numero}`}
          onClose={() => setModalConvertir(false)} maxWidth={720}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span style={{ color: '#92400e', fontSize: 13 }}>
              El stock se descontará inmediatamente al confirmar la conversión.
            </span>
          </div>
          <InfoDoc doc={docSeleccionado} />
          {cargandoDetalle ? <Cargando /> : <TablaDetalle filas={detalle} />}
          <TotalesDoc filas={detalle} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <BtnModal color={C.textDim} outline onClick={() => setModalConvertir(false)}>Cancelar</BtnModal>
            <BtnModal color={C.verde} onClick={convertir} disabled={guardando} icon={<IcoConvert />}>
              {guardando ? 'Convirtiendo...' : 'Confirmar y convertir'}
            </BtnModal>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────

const InfoDoc = ({ doc }) => (
  <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap',
    background: '#f9fafb', borderRadius: 10, padding: '14px 18px',
    border: '1px solid #e5e7eb' }}>
    {[
      { label: 'Cliente', valor: doc.cliente },
      { label: 'Fecha',   valor: doc.fecha?.slice(0, 10) },
      { label: 'Notas',   valor: doc.notas || '—' },
    ].map(({ label, valor }) => (
      <div key={label}>
        <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 600,
          letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ color: '#374151', fontSize: 14, fontWeight: 500 }}>{valor}</div>
      </div>
    ))}
  </div>
);

const TablaDetalle = ({ filas }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#f3f4f6' }}>
          {['Descripción', 'Cant.', 'Precio', 'IVA %', 'Subtotal'].map(h => (
            <th key={h} style={{ padding: '10px 14px', color: '#9ca3af', fontSize: 10,
              letterSpacing: 1.1, textAlign: h === 'Descripción' ? 'left' : 'right',
              borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', fontWeight: 600 }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6',
            background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
            <td style={{ padding: '10px 14px', color: '#374151' }}>{f.descripcion}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#374151' }}>{parseFloat(f.cantidad)}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#374151' }}>${parseFloat(f.precio).toFixed(2)}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#9ca3af' }}>{parseFloat(f.iva || 0)}%</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
              ${(parseFloat(f.cantidad) * parseFloat(f.precio) * (1 + (parseFloat(f.iva) || 0) / 100)).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TotalesDoc = ({ filas }) => {
  const subtotalBase = filas.reduce((s, f) => s + (parseFloat(f.cantidad || 0)) * (parseFloat(f.precio || 0)), 0);
  const totalIva     = filas.reduce((s, f) => {
    const base = parseFloat(f.cantidad || 0) * parseFloat(f.precio || 0);
    return s + base * ((parseFloat(f.iva) || 0) / 100);
  }, 0);
  const total = subtotalBase + totalIva;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb',
        borderRadius: 12, padding: '16px 22px', minWidth: 240 }}>
        <TotRow label="Subtotal" valor={`$${subtotalBase.toFixed(2)}`} />
        <TotRow label="IVA"      valor={`$${totalIva.toFixed(2)}`} />
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#111827', fontWeight: 700, fontSize: 15 }}>TOTAL</span>
          <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 26 }}>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

const TotRow = ({ label, valor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
    <span style={{ color: '#9ca3af', fontSize: 13 }}>{label}:</span>
    <span style={{ color: '#374151', fontWeight: 600 }}>{valor}</span>
  </div>
);

const Modal = ({ titulo, onClose, children, maxWidth = 600, badge }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
    <div style={{ background: '#fff', borderRadius: 18, padding: 28,
      width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ color: '#111827', fontSize: 17, fontWeight: 700, margin: 0 }}>{titulo}</h2>
          {badge && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              background: badge.color + '18', color: badge.color }}>
              {badge.label}
            </span>
          )}
        </div>
        <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none',
          color: '#6b7280', fontSize: 16, cursor: 'pointer', borderRadius: 8,
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Cargando = () => (
  <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Cargando...</div>
);

const Label = ({ children }) => (
  <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600,
    letterSpacing: 1, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
    {children}
  </label>
);

const inputSt = {
  width: '100%', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '9px 12px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const celdaSt = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
  padding: '6px 9px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const BtnSm = ({ color, onClick, children, disabled, outline, icon }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ display: 'flex', alignItems: 'center', gap: 5,
      background: outline ? 'transparent' : color,
      color: outline ? color : '#fff',
      border: `1px solid ${color}`, borderRadius: 7,
      padding: '5px 12px', fontWeight: 600, fontSize: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1, transition: 'all .15s' }}>
    {icon}{children}
  </button>
);

const BtnModal = ({ color, onClick, children, disabled, outline, icon }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ display: 'flex', alignItems: 'center', gap: 7,
      background: outline ? 'transparent' : color,
      color: outline ? color : (color === '#9ca3af' ? color : '#fff'),
      border: `1px solid ${outline ? color : color}`,
      borderRadius: 9, padding: '10px 20px', fontWeight: 600, fontSize: 13,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1, transition: 'all .15s' }}>
    {icon}{children}
  </button>
);

// ── HTML impresión ─────────────────────────────────────────
export const generarHTML = ({ tipo, numero, cliente, fecha, notas, filas, subtotalBase, totalIva, total }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${tipo} ${numero}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size:12px; color:#111; background:#fff; }
    .page { width: 720px; margin: 0 auto; padding: 24px; }

    /* ── Cabecera estilo Ferretería Carrión ── */
    .header {
      display: flex; justify-content: space-between; align-items: stretch;
      border: 2px solid #333; margin-bottom: 0;
    }
    .header-left {
      background: #F5C400; flex: 1;
      padding: 14px 18px; display: flex; flex-direction: column; justify-content: center;
    }
    .empresa-nombre {
      font-size: 26px; font-weight: 900; color: #111; letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .empresa-info { font-size: 11px; color: #333; margin-top: 6px; line-height: 1.7; }
    .empresa-info strong { font-weight: 700; }
    .header-right {
      background: #0D111C; min-width: 180px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 14px 18px; gap: 4px;
    }
    .doc-tipo  { font-size: 20px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
    .doc-num   { font-size: 15px; font-weight: 700; color: #fde68a; }
    .doc-fecha { font-size: 11px; color: #bfdbfe; margin-top: 2px; }

    /* ── Cliente ── */
    .cliente-row {
      background: #fef3c7; border: 1px solid #333; border-top: none;
      padding: 7px 14px; font-size: 12px;
      display: flex; gap: 24px; align-items: center;
    }
    .cliente-row span { color: #6b7280; font-weight: 600; }
    .cliente-row strong { color: #111; font-weight: 700; }

    /* ── Tabla ── */
    table { width: 100%; border-collapse: collapse; border: 1px solid #333; border-top: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead tr { background: #0D111C; }
    thead th {
      color: #fff; padding: 8px 12px; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.8px; border-right: 1px solid #3b5fc0;
      border-bottom: 2px solid #333;
    }
    thead th:last-child { border-right: none; }
    thead th.right { text-align: right; }
    tbody td { padding: 7px 12px; border-bottom: 1px solid #d1d5db; border-right: 1px solid #e5e7eb; font-size: 12px; }
    tbody td:last-child { border-right: none; }
    tbody td.right { text-align: right; }
    tbody tr:nth-child(even) { background: #fef9c3; }
    tbody tr:nth-child(odd)  { background: #ffffff; }

    /* Filas vacías */
    .fila-vacia td { color: #d1d5db; padding: 6px 12px; border-bottom: 1px solid #e5e7eb; }

    /* ── Total ── */
    .total-row { background: #F5C400 !important; }
    .total-row td {
      font-weight: 900; font-size: 14px; color: #111;
      border-top: 2px solid #333; border-bottom: 2px solid #333;
    }
    .total-row td.total-label { text-align: right; text-transform: uppercase; letter-spacing: 1px; }
    .total-row td.total-valor { text-align: right; font-size: 15px; }

    .notas { margin-top: 16px; font-size: 11px; color: #6b7280; }
    @media print { .page { padding: 12px; } body { background: #fff; } }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="empresa-nombre">Distribuidora RC</div>
      <div class="empresa-info">
        <strong>DIRECCIÓN:</strong> Chimbacalle, Av Napo y Salcedo<br>
        <strong>TELÉFONO:</strong> 0998024883 – 0984666022
      </div>
    </div>
    <div class="header-right">
      <div class="doc-tipo">${tipo}</div>
      <div class="doc-num">N° ${numero}</div>
      <div class="doc-fecha">${fecha}</div>
    </div>
  </div>

  <!-- Cliente -->
  <div class="cliente-row">
    <span>CLIENTE: <strong>${cliente}</strong></span>
    ${notas ? `<span>NOTAS: <strong>${notas}</strong></span>` : ''}
  </div>

  <!-- Tabla -->
  <table>
    <thead>
      <tr>
        <th style="width:60px">CANT.</th>
        <th>DESCRIPCIÓN</th>
        <th class="right" style="width:100px">V. UNITARIO</th>
        <th class="right" style="width:90px">IVA %</th>
        <th class="right" style="width:100px">V. TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${filas.map(f => `
        <tr>
          <td class="right">${parseFloat(f.cantidad)}</td>
          <td>${f.descripcion}</td>
          <td class="right">$${parseFloat(f.precio).toFixed(2)}</td>
          <td class="right">${parseFloat(f.iva || 0)}%</td>
          <td class="right">$${(parseFloat(f.cantidad) * parseFloat(f.precio) * (1 + (parseFloat(f.iva) || 0) / 100)).toFixed(2)}</td>
        </tr>
      `).join('')}
      <!-- Filas vacías de relleno visual -->
      ${Array.from({ length: Math.max(0, 10 - filas.length) }).map(() => `
        <tr class="fila-vacia">
          <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          <td class="right">0,00</td>
        </tr>
      `).join('')}
      <!-- Subtotal si hay IVA -->
      ${totalIva > 0 ? `
        <tr>
          <td colspan="3"></td>
          <td style="text-align:right; font-weight:600; color:#6b7280;">Subtotal:</td>
          <td class="right">$${subtotalBase.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3"></td>
          <td style="text-align:right; font-weight:600; color:#6b7280;">IVA:</td>
          <td class="right">$${totalIva.toFixed(2)}</td>
        </tr>
      ` : ''}
      <!-- Total final -->
      <tr class="total-row">
        <td colspan="4" class="total-label">TOTAL</td>
        <td class="right total-valor">$${total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

</div>
</body>
</html>
`;