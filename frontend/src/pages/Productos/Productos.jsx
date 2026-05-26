import { useEffect, useState, useCallback } from 'react';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';

const C = {
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  border: '#e5e7eb', bg: '#f4f5fb', card: '#ffffff',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981',
  rojo: '#ef4444', morado: '#8b5cf6',
};

const VACIO = { codigo: '', descripcion: '', inventariable: true, stock: 0, stock_minimo: 0, iva: 0, pvp1: 0, pvp2: 0 };

// ── Iconos ─────────────────────────────────────────────────
const IcoPlus   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoDown   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoUp     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IcoEdit   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoBox    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
const IcoTrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;

export default function Productos() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';

  const [productos, setProductos]       = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [buscar, setBuscar]             = useState('');
  const [cargando, setCargando]         = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando]         = useState(null);
  const [form, setForm]                 = useState(VACIO);
  const [guardando, setGuardando]       = useState(false);
  const [error, setError]               = useState('');
  const [importando, setImportando]     = useState(false);
  const [modalStock, setModalStock]         = useState(false);
  const [productoStock, setProductoStock]   = useState(null);
  const [ajuste, setAjuste]                 = useState({ cantidad: 0, motivo: '' });
  const [guardandoStock, setGuardandoStock] = useState(false);
  const LIMIT = 50;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (buscar) params.append('buscar', buscar);
      const { data } = await api.get(`/productos?${params}`);
      setProductos(data.data);
      setTotal(data.total);
    } catch { setError('Error al cargar productos'); }
    finally { setCargando(false); }
  }, [page, buscar]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(1); }, [buscar]);

  const abrirNuevo = () => { setEditando(null); setForm(VACIO); setError(''); setModalAbierto(true); };
  const abrirEditar = (p) => {
    setEditando(p.id);
    setForm({ codigo: p.codigo, descripcion: p.descripcion, inventariable: p.inventariable,
      stock: p.stock, stock_minimo: p.stock_minimo, iva: p.iva, pvp1: p.pvp1, pvp2: p.pvp2 });
    setError(''); setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.codigo || !form.descripcion) { setError('Código y descripción son requeridos'); return; }
    setGuardando(true); setError('');
    try {
      editando ? await api.put(`/productos/${editando}`, form) : await api.post('/productos', form);
      setModalAbierto(false); cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try { await api.delete(`/productos/${id}`); cargar(); }
    catch { alert('Error al eliminar'); }
  };

  const abrirStock = (p) => { setProductoStock(p); setAjuste({ cantidad: 0, motivo: '' }); setModalStock(true); };

  const guardarStock = async () => {
    if (!ajuste.cantidad || parseFloat(ajuste.cantidad) === 0) { alert('La cantidad no puede ser 0'); return; }
    setGuardandoStock(true);
    try {
      await api.post('/productos/ajuste-stock', {
        producto_id: productoStock.id,
        cantidad: parseFloat(ajuste.cantidad),
        motivo: ajuste.motivo || 'Ajuste manual',
      });
      setModalStock(false); cargar();
    } catch (err) { alert(err.response?.data?.error || 'Error al ajustar stock'); }
    finally { setGuardandoStock(false); }
  };

  const exportar = async () => {
    try {
      const response = await api.get('/productos/exportar', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a'); a.href = url; a.download = 'productos.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Error al exportar'); }
  };

  const importar = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImportando(true);
    try {
      const fd = new FormData(); fd.append('archivo', file);
      const { data } = await api.post('/productos/importar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert(`Importación completada:\n✅ Insertados: ${data.insertados}\n🔄 Actualizados: ${data.actualizados}`);
      cargar();
    } catch { alert('Error al importar'); }
    finally { setImportando(false); e.target.value = ''; }
  };

  const totalPags = Math.ceil(total / LIMIT);

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: '0 28px', height: 80,
        display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
            Productos
          </div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>
            {total} productos registrados
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* Barra de acciones */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 15, height: 15, stroke: C.textDim, fill: 'none', strokeWidth: 2, strokeLinecap: 'round' }}
              viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Buscar por código o descripción..."
              value={buscar} onChange={e => setBuscar(e.target.value)}
              style={{ width: '100%', background: '#fff', border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '9px 14px 9px 36px', color: C.textSec, fontSize: 14,
                outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <button onClick={abrirNuevo}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.verde,
              color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <IcoPlus /> Nuevo
          </button>

          <button onClick={exportar}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff',
              color: C.azul, border: `1px solid ${C.azul}`, borderRadius: 8, padding: '9px 18px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <IcoDown /> Exportar
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff',
            color: C.amarillo, border: `1px solid ${C.amarillo}`, borderRadius: 8, padding: '9px 18px',
            fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <IcoUp /> {importando ? 'Importando...' : 'Importar Excel'}
            <input type="file" accept=".xlsx,.xls" onChange={importar} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Tabla */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {[
                  { label: 'Código',       align: 'left'   },
                  { label: 'Descripción',  align: 'left'   },
                  { label: 'Inventariable',align: 'center' },
                  { label: 'Stock',        align: 'center' },
                  { label: 'Stock Mín.',   align: 'center' },
                  { label: 'IVA %',        align: 'center' },
                  { label: 'PVP1',         align: 'right'  },
                  { label: 'PVP2',         align: 'right'  },
                  { label: 'Acciones',     align: 'left'   },
                ].map(({ label, align }) => (
                  <th key={label} style={{ padding: '12px 16px', color: C.textDim, fontWeight: 600,
                    fontSize: 11, letterSpacing: 1, textAlign: align,
                    borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>Cargando...</td></tr>
              ) : productos.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>No se encontraron productos</td></tr>
              ) : productos.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}`,
                  background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '11px 16px', color: C.textDim, fontFamily: 'monospace', fontSize: 12 }}>{p.codigo}</td>
                  <td style={{ padding: '11px 16px', color: C.textSec }}>{p.descripcion}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: p.inventariable ? '#d1fae5' : '#fef3c7',
                      color: p.inventariable ? '#065f46' : '#92400e' }}>
                      {p.inventariable ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'center', fontWeight: 700,
                    color: parseFloat(p.stock) <= parseFloat(p.stock_minimo) && p.inventariable ? C.rojo : C.textSec }}>
                    {parseFloat(p.stock)}
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'center', color: C.textDim }}>{parseFloat(p.stock_minimo)}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'center', color: C.textDim }}>{parseFloat(p.iva)}%</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', color: C.textSec }}>${parseFloat(p.pvp1).toFixed(2)}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', color: C.textSec }}>${parseFloat(p.pvp2).toFixed(2)}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <BtnSm color={C.azul} onClick={() => abrirEditar(p)} icon={<IcoEdit />}>Editar</BtnSm>
                      <BtnSm color={C.amarillo} onClick={() => abrirStock(p)} icon={<IcoBox />} darkText>Stock</BtnSm>
                      {esAdmin && <BtnSm color={C.rojo} onClick={() => eliminar(p.id)} icon={<IcoTrash />}>Eliminar</BtnSm>}
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
            <BtnSm color={C.azul} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Anterior</BtnSm>
            <span style={{ color: C.textDim, fontSize: 13 }}>Página {page} de {totalPags}</span>
            <BtnSm color={C.azul} onClick={() => setPage(p => Math.min(totalPags, p + 1))} disabled={page === totalPags}>Siguiente →</BtnSm>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalAbierto && (
        <Modal titulo={editando ? 'Editar producto' : 'Nuevo producto'} onClose={() => setModalAbierto(false)}>
          {error && <ErrorBox msg={error} />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Campo label="Código" span={1}><Input value={form.codigo} onChange={v => setForm({ ...form, codigo: v })} placeholder="Ej: P001" /></Campo>
            <Campo label="Inventariable" span={1}>
              <select value={form.inventariable ? 'true' : 'false'}
                onChange={e => setForm({ ...form, inventariable: e.target.value === 'true' })}
                style={inputSt}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </Campo>
            <Campo label="Descripción" span={2}><Input value={form.descripcion} onChange={v => setForm({ ...form, descripcion: v })} placeholder="Descripción del producto" /></Campo>
            <Campo label="Stock actual" span={1}><Input type="number" value={form.stock} onChange={v => setForm({ ...form, stock: v })} disabled={!!editando} /></Campo>
            <Campo label="Stock mínimo" span={1}><Input type="number" value={form.stock_minimo} onChange={v => setForm({ ...form, stock_minimo: v })} /></Campo>
            <Campo label="IVA %" span={1}><Input type="number" value={form.iva} onChange={v => setForm({ ...form, iva: v })} /></Campo>
            <Campo label="PVP1 $" span={1}><Input type="number" value={form.pvp1} onChange={v => setForm({ ...form, pvp1: v })} /></Campo>
            <Campo label="PVP2 $" span={1}><Input type="number" value={form.pvp2} onChange={v => setForm({ ...form, pvp2: v })} /></Campo>
          </div>
          <ModalFooter onCancel={() => setModalAbierto(false)} onConfirm={guardar}
            loading={guardando} label={editando ? 'Actualizar' : 'Crear producto'} />
        </Modal>
      )}

      {/* Modal ajuste stock */}
      {modalStock && productoStock && (
        <Modal titulo="Ajuste de stock" onClose={() => setModalStock(false)} maxWidth={420}>
          <div style={{ background: '#f9fafb', border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '12px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Producto</div>
            <div style={{ color: C.textSec, fontSize: 14 }}>{productoStock.descripcion}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>
              Stock actual: <span style={{ color: C.amarillo, fontWeight: 700 }}>{parseFloat(productoStock.stock)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Cantidad (+ entrada / - salida)">
              <Input type="number" value={ajuste.cantidad} onChange={v => setAjuste({ ...ajuste, cantidad: v })} placeholder="Ej: 10 o -5" />
            </Campo>
            <Campo label="Motivo">
              <Input value={ajuste.motivo} onChange={v => setAjuste({ ...ajuste, motivo: v })} placeholder="Ej: Conteo físico..." />
            </Campo>
          </div>
          {ajuste.cantidad !== 0 && ajuste.cantidad !== '' && (
            <div style={{ marginTop: 14, background: '#f9fafb', border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              <span style={{ color: C.textDim }}>Stock resultante: </span>
              <span style={{ fontWeight: 700, fontSize: 16,
                color: parseFloat(productoStock.stock) + parseFloat(ajuste.cantidad || 0) < 0 ? C.rojo : C.verde }}>
                {(parseFloat(productoStock.stock) + parseFloat(ajuste.cantidad || 0)).toFixed(2)}
              </span>
            </div>
          )}
          <ModalFooter onCancel={() => setModalStock(false)} onConfirm={guardarStock}
            loading={guardandoStock} label="Aplicar ajuste" color={C.amarillo} darkText />
        </Modal>
      )}
    </div>
  );
}

// ── Helpers UI ─────────────────────────────────────────────
const inputSt = {
  width: '100%', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '9px 12px', color: '#374151', fontSize: 14,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const Input = ({ value, onChange, type = 'text', placeholder = '', disabled = false }) => (
  <input type={type} value={value} placeholder={placeholder} disabled={disabled}
    onChange={e => onChange(e.target.value)}
    style={{ ...inputSt, opacity: disabled ? 0.5 : 1, background: disabled ? '#f9fafb' : '#fff' }} />
);

const Campo = ({ label, children, span = 1 }) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: 1,
      display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
  </div>
);

const Modal = ({ titulo, onClose, children, maxWidth = 520 }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
    <div style={{ background: '#fff', borderRadius: 16, padding: 28,
      width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#111827', fontSize: 18, fontWeight: 700, margin: 0 }}>{titulo}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none',
          color: '#9ca3af', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const ModalFooter = ({ onCancel, onConfirm, loading, label, color = '#10b981', darkText = false }) => (
  <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
    <button onClick={onCancel} style={{ background: '#fff', border: '1px solid #e5e7eb',
      color: '#6b7280', borderRadius: 8, padding: '9px 20px', fontWeight: 600,
      fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
    <button onClick={onConfirm} disabled={loading}
      style={{ background: color, border: 'none',
        color: darkText ? '#111827' : '#fff',
        borderRadius: 8, padding: '9px 22px', fontWeight: 600,
        fontSize: 13, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
      {loading ? 'Guardando...' : label}
    </button>
  </div>
);

const ErrorBox = ({ msg }) => (
  <div style={{ background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, padding: '10px 14px', color: '#ef4444',
    fontSize: 13, marginBottom: 16 }}>{msg}</div>
);

const BtnSm = ({ color, onClick, children, disabled, icon, darkText }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ display: 'flex', alignItems: 'center', gap: 5,
      background: color, color: darkText ? '#111827' : '#fff',
      border: 'none', borderRadius: 7, padding: '5px 12px',
      fontWeight: 600, fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1 }}>
    {icon}{children}
  </button>
);