import { useEffect, useState, useCallback } from 'react';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useIsMobile';
import { validarEmail } from '../../utils/validaciones';

const C = {
  bg: '#f4f5fb', card: '#ffffff', deep: '#f9fafb',
  border: '#e5e7eb', grid: '#f3f4f6',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444',
};

// ── Iconos SVG ────────────────────────────────────────────────
const IcoPlus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
const IcoPause = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const IcoPlay  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IcoAdmin = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IcoUser  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoSave  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoWarn  = () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoMail  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;

const VACIO = { nombre: '', username: '', password: '', rol: 'bodeguero', email: '' };

export default function Usuarios() {
  const { usuario: usuarioActual } = useAuth();
  const { isMobile } = useBreakpoint();

  const [usuarios, setUsuarios]               = useState([]);
  const [cargando, setCargando]               = useState(true);
  const [modalAbierto, setModalAbierto]       = useState(false);
  const [editando, setEditando]               = useState(null);
  const [form, setForm]                       = useState(VACIO);
  const [guardando, setGuardando]             = useState(false);
  const [error, setError]                     = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch {
      console.error('Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(VACIO);
    setError('');
    setModalAbierto(true);
  };

  const abrirEditar = (u) => {
    setEditando(u.id);
    setForm({ nombre: u.nombre, username: u.username, password: '', rol: u.rol, email: u.email || '' });
    setError('');
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.username || (!editando && !form.password)) {
      setError('Nombre, usuario y contraseña son requeridos');
      return;
    }
    if (form.password && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!validarEmail(form.email)) {
      setError('El correo electrónico no es válido');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (editando) {
        const payload = { nombre: form.nombre, rol: form.rol, email: form.email || null };
        if (form.password) payload.password = form.password;
        await api.put(`/usuarios/${editando}`, payload);
      } else {
        await api.post('/usuarios', { ...form, email: form.email || null });
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (u) => {
    try {
      await api.put(`/usuarios/${u.id}`, { activo: !u.activo });
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const eliminar = async (u) => {
    try {
      await api.delete(`/usuarios/${u.id}`);
      setConfirmEliminar(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? '14px 16px' : '0 28px',
        height: isMobile ? 'auto' : 80,
        display: 'flex', alignItems: 'center', gap: 16,
        flexWrap: 'wrap' }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>Usuarios</div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>Gestión de acceso al sistema</div>
        </div>
        <button onClick={abrirNuevo}
          style={{ display: 'flex', alignItems: 'center', gap: 7,
            background: C.verde, border: 'none', color: '#fff',
            borderRadius: 8, padding: '10px 20px', fontWeight: 700,
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.verde; }}>
          <IcoPlus /> Nuevo usuario
        </button>
      </div>

      {/* Grid de cards */}
      <div style={{ padding: isMobile ? '14px 12px' : '28px 28px' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', color: C.textDim, padding: 60 }}>Cargando...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '260px' : '320px'}, 1fr))`, gap: 16 }}>
            {usuarios.map(u => (
              <div key={u.id} style={{
                background: C.card,
                border: `1px solid ${u.activo ? C.border : C.rojo + '44'}`,
                borderTop: `3px solid ${u.rol === 'admin' ? C.amarillo : C.azul}`,
                borderRadius: 12, padding: 20,
                opacity: u.activo ? 1 : 0.65,
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'box-shadow .15s',
              }}>

                {/* Avatar + info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: u.rol === 'admin' ? '#fef9ec' : '#eff6ff',
                    border: `2px solid ${u.rol === 'admin' ? C.amarillo : C.azul}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    color: u.rol === 'admin' ? C.amarillo : C.azul,
                  }}>
                    {u.rol === 'admin' ? <IcoAdmin /> : <IcoUser />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 15,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.nombre}
                    </div>
                    <div style={{ color: C.textDim, fontSize: 12, fontFamily: 'monospace', marginTop: 2 }}>
                      @{u.username}
                    </div>
                    {/* Email en la card */}
                    {u.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5,
                        color: C.textDim, fontSize: 11, marginTop: 3 }}>
                        <IcoMail />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.email}
                        </span>
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 5,
                    letterSpacing: 0.8, textTransform: 'uppercase', alignSelf: 'flex-start',
                    background: u.rol === 'admin' ? '#fef9ec' : '#eff6ff',
                    color: u.rol === 'admin' ? C.amarillo : C.azul,
                    border: `1px solid ${u.rol === 'admin' ? C.amarillo + '44' : C.azul + '44'}`,
                  }}>
                    {u.rol}
                  </span>
                </div>

                {/* Aviso si no tiene email */}
                {!u.email && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: 7, padding: '7px 11px', fontSize: 11,
                    color: '#92400e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IcoMail /> Sin email — no podrá recuperar contraseña
                  </div>
                )}

                {/* Estado + fecha */}
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 16,
                  paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%',
                      background: u.activo ? C.verde : C.rojo }} />
                    <span style={{ color: u.activo ? C.verde : C.rojo, fontSize: 12, fontWeight: 600 }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <span style={{ color: C.textDim, fontSize: 11 }}>
                    Creado: {u.creado_en?.slice(0, 10)}
                  </span>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <BtnSm color={C.azul} onClick={() => abrirEditar(u)} icon={<IcoEdit />}>Editar</BtnSm>
                  {u.id !== usuarioActual.id && (
                    <BtnSm
                      color={u.activo ? C.amarillo : C.verde}
                      onClick={() => toggleActivo(u)}
                      icon={u.activo ? <IcoPause /> : <IcoPlay />}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </BtnSm>
                  )}
                  {u.id !== usuarioActual.id && (
                    <BtnSm color={C.rojo} onClick={() => setConfirmEliminar(u)} icon={<IcoTrash />}>Eliminar</BtnSm>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: isMobile ? 12 : 16 }}>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`,
            borderRadius: 16, padding: isMobile ? 20 : 28, width: '100%', maxWidth: 440,
            boxShadow: '0 24px 64px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ color: C.textPrimary, fontSize: 18, fontWeight: 700, margin: 0 }}>
                {editando ? 'Editar usuario' : 'Nuevo usuario'}
              </h2>
              <button onClick={() => setModalAbierto(false)}
                style={{ background: '#f3f4f6', border: 'none', color: '#6b7280',
                  fontSize: 16, cursor: 'pointer', borderRadius: 8,
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: `1px solid ${C.rojo}44`,
                borderRadius: 8, padding: '10px 14px', color: C.rojo,
                fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Campo label="Nombre completo">
                <Input value={form.nombre} onChange={v => setForm({ ...form, nombre: v })}
                  placeholder="Ej: Juan Pérez" />
              </Campo>
              <Campo label="Usuario (login)">
                <Input value={form.username} onChange={v => setForm({ ...form, username: v })}
                  placeholder="Ej: juan123" disabled={!!editando} />
              </Campo>
              <Campo label={editando ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}>
                <Input type="password" value={form.password}
                  onChange={v => setForm({ ...form, password: v })}
                  placeholder={editando ? 'Nueva contraseña...' : 'Contraseña segura'} />
              </Campo>
              <Campo label="Rol">
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
                  style={inputStyle}>
                  <option value="bodeguero">Bodeguero</option>
                  <option value="admin">Administrador</option>
                </select>
              </Campo>
              <Campo label="Email (para recuperar contraseña)">
                <Input type="email" value={form.email}
                  onChange={v => setForm({ ...form, email: v })}
                  placeholder="correo@ejemplo.com" />
              </Campo>

              {/* Info permisos */}
              <div style={{ background: C.deep, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '12px 14px', fontSize: 12 }}>
                <div style={{ color: C.textDim, marginBottom: 8, fontWeight: 700,
                  fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  Permisos del rol seleccionado
                </div>
                {form.rol === 'admin' ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: C.amarillo }}>
                    <IcoAdmin />
                    <span>Acceso completo: crear, editar, eliminar, reportes y gestión de usuarios.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: C.azul }}>
                    <IcoUser />
                    <span>Puede gestionar proformas y recibos, pero no tiene acceso al dashboard, reportes, facturas importadas, ni opciones de eliminación.</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalAbierto(false)}
                style={{ background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.textDim, borderRadius: 8, padding: '10px 20px',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.textDim; e.currentTarget.style.color = C.textSec; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: 7,
                  background: C.verde, border: 'none', color: '#fff',
                  borderRadius: 8, padding: '10px 22px', fontWeight: 700,
                  fontSize: 13, cursor: guardando ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: guardando ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'all .15s' }}
                onMouseEnter={e => { if (!guardando) e.currentTarget.style.background = '#059669'; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.verde; }}>
                <IcoSave /> {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', border: `1px solid ${C.rojo}44`,
            borderRadius: 16, padding: 32, width: '100%', maxWidth: 380, textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%',
              background: '#fef2f2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px', color: C.rojo }}>
              <IcoWarn />
            </div>
            <h2 style={{ color: C.textPrimary, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              ¿Eliminar usuario?
            </h2>
            <p style={{ color: C.textDim, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              Se eliminará permanentemente la cuenta de{' '}
              <span style={{ color: C.textSec, fontWeight: 700 }}>{confirmEliminar.nombre}</span>.
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmEliminar(null)}
                style={{ background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.textDim, borderRadius: 8, padding: '10px 22px',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={() => eliminar(confirmEliminar)}
                style={{ display: 'flex', alignItems: 'center', gap: 7,
                  background: C.rojo, border: 'none', color: '#fff',
                  borderRadius: 8, padding: '10px 22px', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                <IcoTrash /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────
const inputStyle = {
  width: '100%', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '9px 12px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const Input = ({ value, onChange, type = 'text', placeholder = '', disabled = false }) => (
  <input type={type} value={value} placeholder={placeholder} disabled={disabled}
    onChange={e => onChange(e.target.value)}
    style={{ ...inputStyle, opacity: disabled ? 0.5 : 1 }} />
);

const Campo = ({ label, children }) => (
  <div>
    <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: 1,
      display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
  </div>
);

const BtnSm = ({ color, onClick, children, icon }) => (
  <button onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: 5,
      background: color, color: '#fff', border: 'none',
      borderRadius: 7, padding: '7px 13px', fontWeight: 600,
      fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
      transition: 'opacity .15s' }}
    onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
    {icon}{children}
  </button>
);