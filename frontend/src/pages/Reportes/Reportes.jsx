import { useState } from 'react';
import ReporteVentas from './ReporteVentas';
import ReporteMovimientos from './ReporteMovimientos';
import ReporteProductos from './ReporteProductos';

const C = {
  bg: '#f4f5fb', card: '#ffffff', border: '#e5e7eb',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444',
};

const IcoVentas      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoMovimientos = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcoProductos   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;

export default function Reportes() {
  const [seccion, setSeccion] = useState('ventas');

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