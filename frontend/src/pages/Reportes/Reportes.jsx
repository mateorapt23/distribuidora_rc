import { useState } from 'react';
import ReporteVentas from './ReporteVentas';
import ReporteMovimientos from './ReporteMovimientos';
import ReporteProductos from './ReporteProductos';
import { useAuth } from '../../context/AuthContext';

const C = {
  bg: '#f4f5fb', card: '#ffffff', border: '#e5e7eb',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444',
};

const IcoVentas      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoMovimientos = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcoProductos   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;

export default function Reportes() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [seccion, setSeccion] = useState('ventas');

  if (!esAdmin) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.card, borderRadius: 24, padding: '52px 44px', maxWidth: 440, width: '100%',
        textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: `1px solid ${C.border}` }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          boxShadow: '0 4px 16px rgba(59,130,246,0.15)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6"  y1="20" x2="6"  y2="14"/>
            <line x1="2"  y1="20" x2="22" y2="20"/>
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, marginBottom: 10, letterSpacing: -0.3 }}>
          Sin acceso a Reportes
        </div>
        <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7, marginBottom: 6 }}>
          No tienes permisos para consultar los <strong>reportes del sistema</strong>.
        </div>
        <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.7, marginBottom: 28 }}>
          Esta sección está disponible únicamente para administradores del sistema.
        </div>
        <div style={{ padding: '14px 18px', background: C.bg, borderRadius: 12,
          border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
          <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <span style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.6 }}>
            Si necesitas información de reportes, comunícate con el administrador del sistema.
          </span>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { key: 'ventas',      label: 'Ventas',                   icon: <IcoVentas /> },
    { key: 'movimientos', label: 'Movimientos de stock',     icon: <IcoMovimientos /> },
    { key: 'productos',   label: 'Productos más vendidos',   icon: <IcoProductos /> },
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: '0 28px', height: 80, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
            Reportes
          </div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>
            Análisis y estadísticas del sistema
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`,
        background: '#fff', padding: '0 28px' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setSeccion(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 20px', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 7,
              color: seccion === tab.key ? C.azul : C.textDim,
              borderBottom: seccion === tab.key
                ? `2px solid ${C.azul}` : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {seccion === 'ventas'      && <ReporteVentas />}
      {seccion === 'movimientos' && <ReporteMovimientos />}
      {seccion === 'productos'   && <ReporteProductos />}
    </div>
  );
}