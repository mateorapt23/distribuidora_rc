import { useEffect, useState, useCallback } from 'react';
import api from '../../api/config';
import { useBreakpoint } from '../../hooks/useIsMobile';

const C = {
  bg: '#f4f5fb', card: '#ffffff',
  border: '#e5e7eb',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981',
  rojo: '#ef4444', morado: '#8b5cf6', gris: '#6b7280',
};

const MODULOS = {
  auth:       { label: 'Auth',       color: '#8b5cf6', bg: '#f3f0ff' },
  documentos: { label: 'Documentos', color: '#3b82f6', bg: '#eff6ff' },
  compras:    { label: 'Compras',    color: '#10b981', bg: '#ecfdf5' },
  productos:  { label: 'Productos',  color: '#f59e0b', bg: '#fffbeb' },
  usuarios:   { label: 'Usuarios',   color: '#ef4444', bg: '#fef2f2' },
  clientes:   { label: 'Clientes',   color: '#06b6d4', bg: '#ecfeff' },
};

const ACCIONES_LABEL = {
  login:              'Inicio de sesión',
  login_fallido:      'Login fallido',
  cambio_password:    'Cambio de contraseña',
  crear_recibo:       'Creó recibo',
  crear_proforma:     'Creó proforma',
  editar_recibo:      'Editó recibo',
  editar_proforma:    'Editó proforma',
  eliminar_recibo:    'Eliminó recibo',
  eliminar_proforma:  'Eliminó proforma',
  convertir_proforma: 'Convirtió proforma',
  crear_compra:       'Creó compra',
  eliminar_compra:    'Eliminó compra',
  crear_producto:     'Creó producto',
  editar_producto:    'Editó producto',
  eliminar_producto:  'Eliminó producto',
  ajuste_stock:       'Ajuste de stock',
  importar_productos: 'Importó productos',
  crear_cliente:      'Creó cliente',
  editar_cliente:     'Editó cliente',
  eliminar_cliente:   'Eliminó cliente',
  importar_clientes:  'Importó clientes',
  crear_usuario:      'Creó usuario',
  editar_usuario:     'Editó usuario',
  desactivar_usuario: 'Desactivó usuario',
};

// ── Iconos ──────────────────────────────────────────────────
const IcoFilter = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IcoRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);
const IcoChevLeft  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoChevRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

// Ícono de actividad estilo "pulso / señal" más refinado
const IcoActividad = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h3l3-8 4 16 3-11 2 3h5"/>
  </svg>
);

const ModuloBadge = ({ modulo }) => {
  const cfg = MODULOS[modulo] || { label: modulo, color: C.gris, bg: '#f3f4f6' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}22`,
    }}>
      {cfg.label}
    </span>
  );
};

const esDestructiva = (accion) =>
  accion?.includes('fallido') || accion?.includes('eliminar') || accion?.includes('desactivar');

const formatFecha = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
};

// ── Helpers UI ───────────────────────────────────────────────
const inputSt = {
  height: 34, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '0 10px', fontSize: 13, color: C.textPrimary,
  background: '#fff', outline: 'none', fontFamily: 'inherit',
};

const BtnSecondary = ({ onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '0 14px', height: 34, borderRadius: 8,
      border: `1px solid ${C.border}`, background: '#fff',
      fontSize: 13, fontWeight: 500, color: C.textSec,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
    }}
  >
    {children}
  </button>
);

// ── Componente principal ─────────────────────────────────────
export default function Actividad() {
  const { isMobile } = useBreakpoint();
  const [logs, setLogs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [cargando, setCargando]   = useState(true);
  const [page, setPage]           = useState(1);
  const limit = 50;

  const [usuarios, setUsuarios]   = useState([]);
  const [filtros, setFiltros]     = useState({
    usuario_id: '', modulo: '', fecha_desde: '', fecha_hasta: '',
  });

  const cargarUsuarios = useCallback(async () => {
    try {
      const { data } = await api.get('/logs/usuarios');
      setUsuarios(data);
    } catch { console.error('Error al cargar usuarios para filtro'); }
  }, []);

  const cargar = useCallback(async (p = 1) => {
    setCargando(true);
    try {
      const params = { page: p, limit, ...Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '')) };
      const { data } = await api.get('/logs', { params });
      setLogs(data.data);
      setTotal(data.total);
      setPage(p);
    } catch { console.error('Error al cargar logs'); }
    finally { setCargando(false); }
  }, [filtros]);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);
  useEffect(() => { cargar(1); }, [cargar]);

  const handleFiltro = (campo, valor) => setFiltros(f => ({ ...f, [campo]: valor }));
  const limpiarFiltros = () => setFiltros({ usuario_id: '', modulo: '', fecha_desde: '', fecha_hasta: '' });
  const hayFiltros = Object.values(filtros).some(v => v !== '');
  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* ── Header — mismo estilo que Dashboard / Clientes ── */}
      <div style={{
        background: '#fff',
        borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? '14px 16px' : '0 28px',
        height: isMobile ? 'auto' : 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
      }}>
        {/* Izquierda: barra de color + título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 4, height: 44, borderRadius: 2, flexShrink: 0,
            background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)',
          }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>Actividad</div>
            <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>
              {total.toLocaleString()} registro{total !== 1 ? 's' : ''} en el sistema
            </div>
          </div>
        </div>

        {/* Derecha: botón Actualizar */}
        <BtnSecondary onClick={() => cargar(1)}>
          <IcoRefresh /> Actualizar
        </BtnSecondary>
      </div>

      {/* ── Cuerpo ── */}
      <div style={{ padding: isMobile ? '14px 12px' : '24px 28px' }}>

        {/* Filtros */}
        <div style={{
          background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: '14px 18px', marginBottom: 18,
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textDim, marginRight: 4 }}>
            <IcoFilter />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.4px', textTransform: 'uppercase' }}>
              Filtros
            </span>
          </div>

          {/* Usuario */}
          <select
            value={filtros.usuario_id}
            onChange={e => handleFiltro('usuario_id', e.target.value)}
            style={{ ...inputSt, minWidth: isMobile ? 120 : 160 }}
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>

          {/* Módulo */}
          <select
            value={filtros.modulo}
            onChange={e => handleFiltro('modulo', e.target.value)}
            style={{ ...inputSt, minWidth: isMobile ? 110 : 150 }}
          >
            <option value="">Todos los módulos</option>
            {Object.entries(MODULOS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {/* Desde */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>Desde</span>
            <input
              type="date"
              value={filtros.fecha_desde}
              onChange={e => handleFiltro('fecha_desde', e.target.value)}
              style={inputSt}
            />
          </div>

          {/* Hasta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>Hasta</span>
            <input
              type="date"
              value={filtros.fecha_hasta}
              onChange={e => handleFiltro('fecha_hasta', e.target.value)}
              style={inputSt}
            />
          </div>

          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              style={{
                ...inputSt, padding: '0 12px', cursor: 'pointer',
                color: C.rojo, border: `1px solid #fecaca`, background: '#fef2f2',
                fontSize: 12, fontWeight: 600,
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla */}
        <div style={{
          background: C.card, borderRadius: 12,
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: `1px solid ${C.border}` }}>
                  {['Fecha y hora', 'Usuario', 'Módulo', 'Acción', 'Descripción', 'IP'].map(h => (
                    <th key={h} style={{
                      padding: '11px 16px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, color: C.textDim,
                      letterSpacing: '.8px', textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: C.textDim, fontSize: 14 }}>
                      Cargando actividad…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: C.textDim, fontSize: 14 }}>
                      No hay registros con los filtros aplicados.
                    </td>
                  </tr>
                ) : logs.map((log, i) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: i < logs.length - 1 ? `1px solid ${C.border}` : 'none',
                      background: i % 2 === 0 ? '#fff' : '#fafafa',
                    }}
                  >
                    {/* Fecha */}
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap', color: C.textDim, fontSize: 12 }}>
                      {formatFecha(log.creado_en)}
                    </td>

                    {/* Usuario */}
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: C.textPrimary }}>{log.usuario_nombre || '—'}</span>
                    </td>

                    {/* Módulo */}
                    <td style={{ padding: '11px 16px' }}>
                      <ModuloBadge modulo={log.modulo} />
                    </td>

                    {/* Acción */}
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 500,
                        color: esDestructiva(log.accion) ? C.rojo : C.textSec,
                      }}>
                        {ACCIONES_LABEL[log.accion] || log.accion}
                      </span>
                    </td>

                    {/* Descripción */}
                    <td style={{ padding: '11px 16px', color: C.textSec, maxWidth: 380 }}>
                      <span style={{ fontSize: 12 }}>{log.descripcion}</span>
                    </td>

                    {/* IP */}
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, color: C.textDim, fontFamily: 'monospace' }}>
                        {log.ip || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 8,
              padding: '12px 18px', borderTop: `1px solid ${C.border}`,
              background: '#fafafa',
            }}>
              <span style={{ fontSize: 12, color: C.textDim }}>
                Página {page} de {totalPages} · {total.toLocaleString()} registros
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <BtnSecondary onClick={() => cargar(page - 1)} disabled={page === 1}>
                  <IcoChevLeft /> Anterior
                </BtnSecondary>
                <BtnSecondary onClick={() => cargar(page + 1)} disabled={page === totalPages}>
                  Siguiente <IcoChevRight />
                </BtnSecondary>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}