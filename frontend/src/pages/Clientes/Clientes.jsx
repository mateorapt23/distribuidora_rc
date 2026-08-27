import { useEffect, useState, useCallback } from 'react';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useIsMobile';
import { validarIdentificacion, validarEmail, validarTelefono } from '../../utils/validaciones';

const C = {
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  border: '#e5e7eb', bg: '#f4f5fb', card: '#ffffff',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981',
  rojo: '#ef4444',
};

const VACIO = { identificacion: '', tipo: 'CEDULA', nombre: '', direccion: '', telefono: '', email: '' };

const IcoPlus  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoDown  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoUp    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IcoEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoUser  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const TIPO_COLOR = {
  CEDULA:    { bg: '#dbeafe', color: '#1d4ed8' },
  RUC:       { bg: '#d1fae5', color: '#065f46' },
  PASAPORTE: { bg: '#ede9fe', color: '#5b21b6' },
  OTRO:      { bg: '#f3f4f6', color: '#6b7280' },
};

export default function Clientes() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const { isMobile } = useBreakpoint();
  const pad = isMobile ? 16 : 28;

  const [clientes, setClientes]         = useState([]);
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
  const LIMIT = 50;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (buscar) params.append('buscar', buscar);
      const { data } = await api.get(`/clientes?${params}`);
      setClientes(data.data);
      setTotal(data.total);
    } catch { setError('Error al cargar clientes'); }
    finally { setCargando(false); }
  }, [page, buscar]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(1); }, [buscar]);

  const abrirNuevo = () => {
    setEditando(null); setForm(VACIO); setError(''); setModalAbierto(true);
  };

  const abrirEditar = (c) => {
    setEditando(c.id);
    setForm({
      identificacion: c.identificacion,
      tipo: c.tipo,
      nombre: c.nombre,
      direccion: c.direccion || '',
      telefono: c.telefono || '',
      email: c.email || '',
    });
    setError(''); setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.nombre.trim()) {
      setError('El nombre es requerido'); return;
    }
    const errorId = validarIdentificacion(form.identificacion, form.tipo);
    if (errorId) { setError(errorId); return; }
    if (!validarEmail(form.email)) {
      setError('El correo electrónico ingresado no es válido'); return;
    }
    if (!validarTelefono(form.telefono)) {
      setError('El teléfono debe contener solo números (7 a 10 dígitos)'); return;
    }
    setGuardando(true); setError('');
    try {
      editando
        ? await api.put(`/clientes/${editando}`, form)
        : await api.post('/clientes', form);
      setModalAbierto(false); cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    try { await api.delete(`/clientes/${id}`); cargar(); }
    catch { alert('Error al eliminar'); }
  };

  const exportar = async () => {
    try {
      const response = await api.get('/clientes/exportar', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a'); a.href = url; a.download = 'clientes.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Error al exportar'); }
  };

  const importar = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImportando(true);
    try {
      const fd = new FormData(); fd.append('archivo', file);
      const { data } = await api.post('/clientes/importar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`Importación completada:\n✅ Insertados: ${data.insertados}\n🔄 Actualizados: ${data.actualizados}${data.errores?.length ? `\n⚠️ Errores: ${data.errores.length}` : ''}`);
      cargar();
    } catch { alert('Error al importar'); }
    finally { setImportando(false); e.target.value = ''; }
  };

  const totalPags = Math.ceil(total / LIMIT);

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? '14px 16px' : '0 28px',
        height: isMobile ? 'auto' : 80,
        display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>Clientes</div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>
            {total} clientes registrados
          </div>
        </div>
      </div>

      <div style={{ padding: `clamp(16px, 3vw, 24px) ${pad}px` }}>

        {/* Barra de acciones */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 15, height: 15, stroke: C.textDim, fill: 'none', strokeWidth: 2, strokeLinecap: 'round' }}
              viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Buscar por nombre, identificación, teléfono o email..."
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
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {[
                  { label: 'Identificación', align: 'left'   },
                  { label: 'Tipo',           align: 'center' },
                  { label: 'Nombre',         align: 'left'   },
                  { label: 'Teléfono',       align: 'left'   },
                  { label: 'Email',          align: 'left'   },
                  { label: 'Dirección',      align: 'left'   },
                  { label: 'Acciones',       align: 'left'   },
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
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>Cargando...</td></tr>
              ) : clientes.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>
                  No se encontraron clientes
                </td></tr>
              ) : clientes.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`,
                  background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '11px 16px', color: C.textDim, fontFamily: 'monospace', fontSize: 12 }}>
                    {c.identificacion}
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: TIPO_COLOR[c.tipo]?.bg || '#f3f4f6',
                      color: TIPO_COLOR[c.tipo]?.color || '#6b7280',
                    }}>
                      {c.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', color: C.textSec, fontWeight: 500 }}>{c.nombre}</td>
                  <td style={{ padding: '11px 16px', color: C.textDim }}>{c.telefono || '—'}</td>
                  <td style={{ padding: '11px 16px', color: C.textDim }}>{c.email || '—'}</td>
                  <td style={{ padding: '11px 16px', color: C.textDim, maxWidth: 200,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.direccion || '—'}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <BtnSm color={C.azul} onClick={() => abrirEditar(c)} icon={<IcoEdit />}>Editar</BtnSm>
                      {esAdmin && <BtnSm color={C.rojo} onClick={() => eliminar(c.id)} icon={<IcoTrash />}>Eliminar</BtnSm>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
        <Modal titulo={editando ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setModalAbierto(false)}>
          {error && <ErrorBox msg={error} />}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <Campo label="Identificación" span={1}>
              <Input
                value={form.identificacion}
                onChange={v => {
                  const soloDigitos = (form.tipo === 'CEDULA' || form.tipo === 'RUC')
                    ? v.replace(/\D/g, '')
                    : v;
                  const max = form.tipo === 'CEDULA' ? 10 : form.tipo === 'RUC' ? 13 : 20;
                  setForm({ ...form, identificacion: soloDigitos.slice(0, max) });
                }}
                placeholder={form.tipo === 'CEDULA' ? 'Ej: 0102345678 (10 dígitos)' : form.tipo === 'RUC' ? 'Ej: 0102345678001 (13 dígitos)' : 'Identificación'}
              />
            </Campo>
            <Campo label="Tipo" span={1}>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value, identificacion: '' })} style={inputSt}>
                <option value="CEDULA">Cédula</option>
                <option value="RUC">RUC</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="OTRO">Otro</option>
              </select>
            </Campo>
            <Campo label="Nombre completo" span={2}>
              <Input value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} placeholder="Nombre del cliente" />
            </Campo>
            <Campo label="Teléfono" span={1}>
              <Input value={form.telefono} onChange={v => setForm({ ...form, telefono: v.replace(/\D/g, '').slice(0, 10) })} placeholder="Ej: 0991234567" />
            </Campo>
            <Campo label="Email" span={1}>
              <Input type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="correo@ejemplo.com" />
            </Campo>
            <Campo label="Dirección" span={2}>
              <Input value={form.direccion} onChange={v => setForm({ ...form, direccion: v })} placeholder="Dirección del cliente" />
            </Campo>
          </div>
          <ModalFooter
            onCancel={() => setModalAbierto(false)}
            onConfirm={guardar}
            loading={guardando}
            label={editando ? 'Actualizar' : 'Crear cliente'}
          />
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

const Input = ({ value, onChange, type = 'text', placeholder = '' }) => (
  <input type={type} value={value} placeholder={placeholder}
    onChange={e => onChange(e.target.value)} style={inputSt} />
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

const Modal = ({ titulo, onClose, children, maxWidth = 560 }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    padding: '12px' }}>
    <div style={{ background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 28px)',
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

const ModalFooter = ({ onCancel, onConfirm, loading, label, color = '#10b981' }) => (
  <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
    <button onClick={onCancel} style={{ background: '#fff', border: '1px solid #e5e7eb',
      color: '#6b7280', borderRadius: 8, padding: '9px 20px', fontWeight: 600,
      fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
    <button onClick={onConfirm} disabled={loading}
      style={{ background: color, border: 'none', color: '#fff',
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

const BtnSm = ({ color, onClick, children, disabled, icon }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ display: 'flex', alignItems: 'center', gap: 5,
      background: color, color: '#fff',
      border: 'none', borderRadius: 7, padding: '5px 12px',
      fontWeight: 600, fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1 }}>
    {icon}{children}
  </button>
);