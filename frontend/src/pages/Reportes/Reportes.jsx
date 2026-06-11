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

// Genera lista de meses desde hace 12 meses hasta el actual
export function generarMeses() {
  const meses = [];
  const ahora = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const year  = d.getFullYear();
    const month = d.getMonth(); // 0-based
    const desde = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const ultimo = new Date(year, month + 1, 0);
    const hasta  = `${year}-${String(month + 1).padStart(2, '0')}-${String(ultimo.getDate()).padStart(2, '0')}`;
    const label  = d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
    meses.push({ value: `${desde}|${hasta}`, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return meses;
}

// ── Iconos ──────────────────────────────────────────────────────────────────
const IcoVentas      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoMovimientos = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcoProductos   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IcoCalendar    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoChevLeft    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoChevRight   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IcoChevDown    = ({ open }) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>;

const MESES       = generarMeses();
const MES_ACTUAL  = MESES[0].value;
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── MonthPicker ──────────────────────────────────────────────────────────────
// Pill con flechas ← → para navegar mes a mes.
// Al hacer clic en la etiqueta se abre un panel-calendario con rejilla de meses
// y navegación de año. Los meses fuera del rango (13 meses) aparecen deshabilitados.
const MonthPicker = ({ meses, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [panelYear, setPanelYear] = useState(() => value.split('|')[0].split('-')[0]);

  const idx     = meses.findIndex(m => m.value === value);
  const current = meses[idx];

  // Navegación directa con las flechas del pill
  const canBack    = idx < meses.length - 1;
  const canForward = idx > 0;
  const goBack     = () => { if (canBack)    onChange(meses[idx + 1].value); };
  const goForward  = () => { if (canForward) onChange(meses[idx - 1].value); };

  // Años disponibles en el array (como strings)
  const availableYears = [...new Set(meses.map(m => m.value.split('|')[0].split('-')[0]))].sort();
  const minYear = availableYears[0];
  const maxYear = availableYears[availableYears.length - 1];

  const canPrevYear = parseInt(panelYear) > parseInt(minYear);
  const canNextYear = parseInt(panelYear) < parseInt(maxYear);

  // Mapa monthIndex(0-based) → entrada de meses, para el año visible en el panel
  const monthMap = {};
  meses.forEach(m => {
    const [desde] = m.value.split('|');
    const [yr, mn] = desde.split('-');
    if (yr === panelYear) monthMap[parseInt(mn) - 1] = m;
  });

  // Abre el panel sincronizando el año al mes seleccionado
  const openPanel = () => {
    setPanelYear(value.split('|')[0].split('-')[0]);
    setOpen(o => !o);
  };

  // Estilo botones de navegación ← → del pill
  const pillNavStyle = (enabled) => ({
    width: 36, height: '100%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', border: 'none',
    cursor: enabled ? 'pointer' : 'not-allowed',
    color: enabled ? C.textSec : C.textDim + '60',
    transition: 'background .15s',
  });

  // Estilo botones ← → del navegador de año dentro del panel
  const yearNavStyle = (enabled) => ({
    width: 28, height: 28, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: enabled ? C.bg : 'none',
    border: `1px solid ${enabled ? C.border : 'transparent'}`,
    borderRadius: 7,
    cursor: enabled ? 'pointer' : 'not-allowed',
    color: enabled ? C.textSec : C.textDim + '50',
    transition: 'background .15s',
  });

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Pill ── */}
      <div style={{
        display: 'flex', alignItems: 'stretch', height: 40,
        background: '#fff', border: `1px solid ${C.border}`,
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>

        {/* ← mes anterior */}
        <button
          onClick={goBack} disabled={!canBack} title="Mes anterior"
          style={pillNavStyle(canBack)}
          onMouseEnter={e => { if (canBack)    e.currentTarget.style.background = C.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          <IcoChevLeft />
        </button>

        <div style={{ width: 1, background: C.border, flexShrink: 0 }} />

        {/* Etiqueta — abre el panel */}
        <button
          onClick={openPanel}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '0 16px', height: '100%', flexGrow: 1,
            background: open ? C.bg : 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, color: C.textPrimary,
            transition: 'background .15s', minWidth: 172,
            justifyContent: 'center',
          }}
        >
          <span style={{ color: C.azul, display: 'flex', alignItems: 'center' }}><IcoCalendar /></span>
          <span>{current?.label}</span>
          <span style={{ color: C.textDim, display: 'flex', alignItems: 'center' }}><IcoChevDown open={open} /></span>
        </button>

        <div style={{ width: 1, background: C.border, flexShrink: 0 }} />

        {/* → mes siguiente */}
        <button
          onClick={goForward} disabled={!canForward} title="Mes siguiente"
          style={pillNavStyle(canForward)}
          onMouseEnter={e => { if (canForward) e.currentTarget.style.background = C.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          <IcoChevRight />
        </button>
      </div>

      {/* ── Panel calendario ── */}
      {open && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />

          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 100,
            background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: 16, width: 268,
          }}>

            {/* Navegador de año */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 14, paddingBottom: 12,
              borderBottom: `1px solid ${C.border}`,
            }}>
              <button
                onClick={() => { if (canPrevYear) setPanelYear(String(parseInt(panelYear) - 1)); }}
                disabled={!canPrevYear}
                style={yearNavStyle(canPrevYear)}
                onMouseEnter={e => { if (canPrevYear) e.currentTarget.style.background = C.border; }}
                onMouseLeave={e => { if (canPrevYear) e.currentTarget.style.background = C.bg; }}
              >
                <IcoChevLeft />
              </button>

              <span style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, letterSpacing: .3 }}>
                {panelYear}
              </span>

              <button
                onClick={() => { if (canNextYear) setPanelYear(String(parseInt(panelYear) + 1)); }}
                disabled={!canNextYear}
                style={yearNavStyle(canNextYear)}
                onMouseEnter={e => { if (canNextYear) e.currentTarget.style.background = C.border; }}
                onMouseLeave={e => { if (canNextYear) e.currentTarget.style.background = C.bg; }}
              >
                <IcoChevRight />
              </button>
            </div>

            {/* Rejilla de meses: 4 columnas × 3 filas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {MONTH_NAMES.map((name, i) => {
                const entry     = monthMap[i];
                const available = !!entry;
                const selected  = available && entry.value === value;

                return (
                  <button
                    key={i}
                    disabled={!available}
                    onClick={() => { if (available) { onChange(entry.value); setOpen(false); } }}
                    style={{
                      padding: '9px 4px', textAlign: 'center',
                      background: selected ? C.azul : 'none',
                      color: selected ? '#fff' : available ? C.textSec : C.textDim + '45',
                      border: `1px solid ${selected ? C.azul : available ? C.border : 'transparent'}`,
                      borderRadius: 8,
                      cursor: available ? 'pointer' : 'default',
                      fontSize: 12, fontWeight: selected ? 600 : 400,
                      fontFamily: 'inherit', transition: 'all .15s',
                    }}
                    onMouseEnter={e => {
                      if (available && !selected) {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.borderColor = C.azul;
                        e.currentTarget.style.color = C.azul;
                      }
                    }}
                    onMouseLeave={e => {
                      if (available && !selected) {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.color = C.textSec;
                      }
                    }}
                  >
                    {name.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Reportes (componente principal) ─────────────────────────────────────────
export default function Reportes() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [seccion, setSeccion] = useState('ventas');
  const [mesSeleccionado, setMesSeleccionado] = useState(MES_ACTUAL);

  const [desde, hasta] = mesSeleccionado.split('|');

  if (!esAdmin) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.card, borderRadius: 24, padding: '52px 44px', maxWidth: 440, width: '100%',
        textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: `1px solid ${C.border}` }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          boxShadow: '0 4px 16px rgba(59,130,246,0.15)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, marginBottom: 10 }}>Sin acceso a Reportes</div>
        <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7, marginBottom: 6 }}>
          No tienes permisos para consultar los <strong>reportes del sistema</strong>.
        </div>
        <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.7, marginBottom: 28 }}>
          Esta sección está disponible únicamente para administradores del sistema.
        </div>
        <div style={{ padding: '14px 18px', background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
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
    { key: 'ventas',      label: 'Ventas',                 icon: <IcoVentas /> },
    { key: 'movimientos', label: 'Movimientos de stock',   icon: <IcoMovimientos /> },
    { key: 'productos',   label: 'Productos más vendidos', icon: <IcoProductos /> },
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: '0 28px', height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
            background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>Reportes</div>
            <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>
              Análisis y estadísticas del sistema
            </div>
          </div>
        </div>

        {/* Selector de mes */}
        <MonthPicker
          meses={MESES}
          value={mesSeleccionado}
          onChange={setMesSeleccionado}
        />
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
              borderBottom: seccion === tab.key ? `2px solid ${C.azul}` : '2px solid transparent',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {seccion === 'ventas'      && <ReporteVentas      desde={desde} hasta={hasta} />}
      {seccion === 'movimientos' && <ReporteMovimientos desde={desde} hasta={hasta} />}
      {seccion === 'productos'   && <ReporteProductos   desde={desde} hasta={hasta} />}
    </div>
  );
}