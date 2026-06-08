import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/config';

const ICONS = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/></svg>,
  productos: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  documentos: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>,
  compras: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  facturas: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>,
  reportes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  usuarios: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 17a4 4 0 0 1 7 0"/></svg>,
  clientes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  actividad: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', label: 'Dashboard',          icon: 'dashboard', roles: ['admin'] },
      { to: '/productos', label: 'Productos',           icon: 'productos' },
      { to: '/clientes',  label: 'Clientes',            icon: 'clientes',  roles: ['admin'] },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/documentos',  label: 'Proformas / Recibos', icon: 'documentos' },
      { to: '/compras',     label: 'Compras',             icon: 'compras',   roles: ['admin'] },
      { to: '/facturas-ef', label: 'Facturas Efacilito',  icon: 'facturas',  roles: ['admin'] },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { to: '/reportes', label: 'Reportes', icon: 'reportes', roles: ['admin'] },
    ],
  },
];

const NAV_ADMIN = {
  label: 'Sistema',
  items: [
    { to: '/usuarios',  label: 'Usuarios',  icon: 'usuarios',  iconSize: 19 },
    { to: '/actividad', label: 'Actividad', icon: 'actividad', iconSize: 16 },
  ],
};

const ROUTE_LABELS = {
  '/dashboard':   'Dashboard',
  '/productos':   'Productos',
  '/clientes':    'Clientes',
  '/documentos':  'Proformas / Recibos',
  '/compras':     'Compras',
  '/facturas-ef': 'Facturas Efacilito',
  '/reportes':    'Reportes',
  '/usuarios':    'Usuarios',
  '/actividad':   'Actividad',
};

// Colores del sidebar oscuro
const S = {
  bg:        '#0D111C',
  bgHover:   '#141928',
  bgActive:  '#1a2235',
  border:    '#1A2238',
  label:     '#3D5070',
  textDim:   '#4a5568',
  textNav:   '#8892a4',
  textActive:'#F5C400',
  gold:      '#F5C400',
};

function NavItem({ item, open }) {
  const iconSize = item.iconSize || 16;
  return (
    <NavLink
      to={item.to}
      onClick={e => e.stopPropagation()}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center',
        gap: 10, margin: '1px 8px', height: 38,
        borderRadius: 8, cursor: 'pointer',
        textDecoration: 'none', overflow: 'hidden',
        position: 'relative',
        padding: open ? '0 10px' : '0',
        justifyContent: open ? 'flex-start' : 'center',
        background: isActive ? S.bgActive : 'transparent',
        transition: 'background .15s',
      })}
      onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = S.bgHover; }}
      onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div style={{
              position: 'absolute', left: 0, top: 8, bottom: 8,
              width: 3, background: S.gold,
              borderRadius: '0 3px 3px 0',
            }} />
          )}
          <div style={{
            width: 28, height: 28, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 7,
            color: isActive ? S.gold : S.textNav,
            transition: 'color .15s',
          }}>
            <div style={{ width: iconSize, height: iconSize, display: 'flex' }}>
              {ICONS[item.icon]}
            </div>
          </div>
          {open && (
            <span style={{
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              color: isActive ? S.gold : S.textNav,
              whiteSpace: 'nowrap', overflow: 'hidden',
              transition: 'color .15s',
            }}>
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  // ── Toast stock bajo ───────────────────────────────────────────────────
  const [alertasStock, setAlertasStock]   = useState([]);
  const [toastVisible, setToastVisible]   = useState(false);
  const [toastOpaque,  setToastOpaque]    = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    api.get('/dashboard/alertas-stock')
      .then(r => setAlertasStock(r.data.alertas || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (alertasStock.length === 0) return;
    setToastVisible(true);
    const enterTimer = setTimeout(() => setToastOpaque(true), 20);
    toastTimer.current = setTimeout(() => cerrarToast(), 9000);
    return () => { clearTimeout(enterTimer); clearTimeout(toastTimer.current); };
  }, [alertasStock]);

  const cerrarToast = () => {
    clearTimeout(toastTimer.current);
    setToastOpaque(false);
    setTimeout(() => setToastVisible(false), 380);
  };
  // ──────────────────────────────────────────────────────────────────────

  const handleLogout = (e) => { e.stopPropagation(); logout(); navigate('/login'); };

  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  // Filtrar secciones y items según el rol del usuario
  const navSectionsVisibles = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => !item.roles || item.roles.includes(usuario?.rol)),
  })).filter(section => section.items.length > 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5fb', position: 'relative' }}>

      {/* ── Sidebar oscuro ── */}
      <aside
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          height: '100vh',
          width: open ? 232 : 56,
          background: S.bg,
          borderRight: `1px solid ${S.border}`,
          display: 'flex', flexDirection: 'column',
          zIndex: 100,
          transition: 'width .28s cubic-bezier(.4,0,.2,1)',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        {/* Barrita horizontal multicolor en la parte superior */}
        <div style={{
          height: 3, flexShrink: 0,
          background: 'linear-gradient(to right, #3b82f6, #F5C400, #10b981)',
        }} />

        {/* Logo */}
        <div style={{
          padding: '14px 12px 12px',
          borderBottom: `1px solid ${S.border}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 10,
            justifyContent: open ? 'flex-start' : 'center',
          }}>
            <div style={{
              width: 34, height: 34, flexShrink: 0,
              background: 'linear-gradient(135deg, #F5C400, #e6a800)',
              borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(245,196,0,0.22)',
            }}>
              <svg viewBox="0 0 16 16" style={{ width: 15, height: 15, stroke: '#0D111C', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round' }}>
                <path d="M2 8h12M8 2v12" />
              </svg>
            </div>

            {open && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, color: S.gold,
                  letterSpacing: '2.8px', textTransform: 'uppercase',
                  whiteSpace: 'nowrap', lineHeight: 1,
                }}>
                  Distribuidora
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#E8EDF2',
                  letterSpacing: '.2px', whiteSpace: 'nowrap',
                  marginTop: 3, lineHeight: 1.2,
                }}>
                  Rodríguez-Carrión
                </div>
              </div>
            )}
          </div>

          <div style={{
            fontSize: 8.5, color: S.label, fontWeight: 500,
            letterSpacing: '1.1px', textTransform: 'uppercase',
            whiteSpace: 'nowrap', marginTop: 8, paddingLeft: 2,
            visibility: open ? 'visible' : 'hidden',
          }}>
            Materiales de Construcción
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '10px 0', overflow: 'hidden' }}>
          {navSectionsVisibles.map(section => (
            <div key={section.label} style={{ marginBottom: 4 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: S.label,
                letterSpacing: '1.2px', textTransform: 'uppercase',
                padding: '8px 16px 4px', whiteSpace: 'nowrap',
                visibility: open ? 'visible' : 'hidden',
              }}>
                {section.label}
              </div>
              {section.items.map(item => (
                <NavItem key={item.to} item={item} open={open} />
              ))}
            </div>
          ))}

          <div style={{ height: 1, background: S.border, margin: '6px 14px' }} />

          {usuario?.rol === 'admin' && (
            <div>
              <div style={{
                fontSize: 9, fontWeight: 700, color: S.label,
                letterSpacing: '1.2px', textTransform: 'uppercase',
                padding: '8px 16px 4px', whiteSpace: 'nowrap',
                visibility: open ? 'visible' : 'hidden',
              }}>
                {NAV_ADMIN.label}
              </div>
              {NAV_ADMIN.items.map(item => (
                <NavItem key={item.to} item={item} open={open} />
              ))}
            </div>
          )}
        </div>

        {/* Footer usuario */}
        <div style={{ borderTop: `1px solid ${S.border}`, padding: '10px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '7px 6px', borderRadius: 8, overflow: 'hidden',
            justifyContent: open ? 'flex-start' : 'center',
          }}>
            <div style={{
              width: 30, height: 30, flexShrink: 0,
              background: 'linear-gradient(135deg, #F5C400, #e6a800)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#0D111C',
            }}>
              {initials}
            </div>
            {open && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#E8EDF2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {usuario?.nombre}
                  </div>
                  <div style={{ fontSize: 10, color: S.label, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    {usuario?.rol}
                  </div>
                </div>
                <div
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  style={{
                    width: 26, height: 26, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', borderRadius: 6, flexShrink: 0,
                    color: S.label, cursor: 'pointer', transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.background = '#1f0a0a'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.label; }}
                >
                  <div style={{ width: 14, height: 14, display: 'flex' }}>{ICONS.logout}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <div style={{
        marginLeft: open ? 232 : 56,
        flex: 1,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', minWidth: 0,
        transition: 'margin-left .28s cubic-bezier(.4,0,.2,1)',
      }}>

        {/* Topbar */}
        <div style={{
          height: 50, background: '#fff',
          borderBottom: '1px solid #e8eaf0',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 6, flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: '#9ba3b8' }}>Sistema</span>
          <span style={{ fontSize: 12, color: '#d1d5db' }}>/</span>
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
            {ROUTE_LABELS[location.pathname] || ''}
          </span>
        </div>

        {/* Página */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#f4f5fb' }}>
          {children}
        </main>
      </div>

      {/* ── Toast flotante: stock bajo ── */}
      {toastVisible && (
        <div style={{
          position: 'fixed',
          top: 8,
          right: 20,
          width: 310,
          zIndex: 9999,
          background: '#ffffff',
          borderRadius: 12,
          borderLeft: '4px solid #ef4444',
          boxShadow: '0 10px 36px rgba(0,0,0,0.13), 0 2px 8px rgba(239,68,68,0.10)',
          overflow: 'hidden',
          opacity: toastOpaque ? 1 : 0,
          transform: toastOpaque ? 'translateX(0) scale(1)' : 'translateX(28px) scale(0.97)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          pointerEvents: toastOpaque ? 'auto' : 'none',
        }}>

          {/* Cabecera */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 12px 9px 14px',
          }}>
            <div style={{ color: '#ef4444', flexShrink: 0, display: 'flex' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', flex: 1 }}>
              Stock bajo detectado
            </span>
            {/* Badge contador */}
            <span style={{
              background: '#FEE2E2', color: '#ef4444',
              fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20,
            }}>
              {alertasStock.length} {alertasStock.length === 1 ? 'producto' : 'productos'}
            </span>
            {/* Botón cerrar */}
            <button
              onClick={cerrarToast}
              title="Cerrar"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', padding: '2px 2px 2px 6px',
                display: 'flex', alignItems: 'center', borderRadius: 4,
                transition: 'color .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Separador */}
          <div style={{ height: 1, background: '#f3f4f6', margin: '0 14px' }} />

          {/* Lista de productos */}
          <div style={{ padding: '8px 14px 12px' }}>
            {alertasStock.slice(0, 5).map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 0',
                borderBottom: i < Math.min(alertasStock.length, 5) - 1
                  ? '1px solid #f9fafb' : 'none',
              }}>
                <span style={{
                  fontSize: 12.5, color: '#374151',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', maxWidth: 195,
                }}>
                  {p.descripcion}
                </span>
                <span style={{
                  fontSize: 11.5, fontWeight: 700, color: '#ef4444',
                  background: '#FFF5F5', padding: '2px 8px',
                  borderRadius: 20, marginLeft: 8, flexShrink: 0,
                }}>
                  {p.stock} und.
                </span>
              </div>
            ))}
            {alertasStock.length > 5 && (
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 6, paddingTop: 4 }}>
                +{alertasStock.length - 5} productos más con stock bajo
              </div>
            )}
          </div>

          {/* Barra de progreso auto-cierre */}
          <div style={{ height: 3, background: '#FEE2E2' }}>
            <div style={{
              height: '100%', background: '#ef4444',
              animation: 'stockToastProgress 9s linear forwards',
            }} />
          </div>
        </div>
      )}

      {/* Keyframe para la barra de progreso */}
      <style>{`
        @keyframes stockToastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

    </div>
  );
}