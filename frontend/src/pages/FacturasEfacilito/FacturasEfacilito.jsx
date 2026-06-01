import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';

const C = {
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  border: '#e5e7eb', bg: '#f4f5fb', card: '#ffffff',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981',
  rojo: '#ef4444', indigo: '#6366f1',
};

const fmt  = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
const fmtN = (n) => parseFloat(n || 0).toFixed(2);

const ESTADO_COLOR = {
  AUTORIZADO: { bg: '#d1fae5', color: '#065f46' },
  ANULADO:    { bg: '#fee2e2', color: '#991b1b' },
  PENDIENTE:  { bg: '#fef3c7', color: '#92400e' },
};

// ── Iconos ──────────────────────────────────────────────────
const IcoUpload   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IcoHistory  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoCheck    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoTrash    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoEye      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoDown     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoSearch   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoInfo     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoCalendar = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoChevron  = ({ open }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}><polyline points="9 18 15 12 9 6"/></svg>;

// ── Helpers UI ───────────────────────────────────────────────
const inputSt = {
  width: '100%', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '9px 12px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const BtnSm = ({ color, onClick, children, disabled, icon, outline }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: outline ? 'transparent' : color,
      color: outline ? color : '#fff',
      border: `1px solid ${color}`,
      borderRadius: 7, padding: '6px 13px',
      fontWeight: 600, fontSize: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1, transition: 'opacity .15s',
      whiteSpace: 'nowrap',
    }}>
    {icon}{children}
  </button>
);

const Modal = ({ titulo, onClose, children, maxWidth = 640 }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
    <div style={{ background: '#fff', borderRadius: 16, padding: 28,
      width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h2 style={{ color: '#111827', fontSize: 17, fontWeight: 700, margin: 0 }}>{titulo}</h2>
        <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none',
          color: '#6b7280', fontSize: 16, cursor: 'pointer', borderRadius: 8,
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════
export default function FacturasEfacilito() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [seccion, setSeccion]     = useState('importar');
  const [refrescar, setRefrescar] = useState(0);

  if (!esAdmin) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: '0 28px', height: 80, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>Facturas Efacilito</div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>
            Importa y consulta el historial de facturas electrónicas
          </div>
        </div>
      </div>
      {/* Pantalla sin acceso */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '52px 44px', maxWidth: 440, width: '100%',
          textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: `1px solid ${C.border}` }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            boxShadow: '0 4px 16px rgba(16,185,129,0.15)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, marginBottom: 10, letterSpacing: -0.3 }}>
            Sin acceso a Facturas
          </div>
          <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7, marginBottom: 6 }}>
            No tienes permisos para importar ni gestionar <strong>facturas electrónicas</strong>.
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
              Si necesitas importar facturas, comunícate con el administrador del sistema.
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: '0 28px', height: 80, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>Facturas Efacilito</div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>
            Importa y consulta el historial de facturas electrónicas
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`,
        background: '#fff', padding: '0 28px' }}>
        {[
          { key: 'importar',  label: 'Importar',  icon: <IcoUpload /> },
          { key: 'historial', label: 'Historial', icon: <IcoHistory /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setSeccion(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 20px', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 7,
              color: seccion === tab.key ? C.azul : C.textDim,
              borderBottom: seccion === tab.key ? `2px solid ${C.azul}` : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {seccion === 'importar'
        ? <PanelImportar onImportado={() => { setRefrescar(r => r + 1); setSeccion('historial'); }} />
        : <PanelHistorial key={refrescar} />
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PANEL IMPORTAR
// ════════════════════════════════════════════════════════════
function PanelImportar({ onImportado }) {
  const [importando, setImportando]   = useState(false);
  const [archivoNombre, setArchivo]   = useState('');
  const [error, setError]             = useState('');
  const [resultado, setResultado]     = useState(null); // { facturas, resumen }
  const inputRef = useRef(null);

  const handleImportar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivo(file.name);
    setImportando(true);
    setError('');
    setResultado(null);

    try {
      const fd = new FormData();
      fd.append('archivo', file);
      const { data } = await api.post('/facturas-ef/importar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResultado(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al importar el archivo.');
    } finally {
      setImportando(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ padding: '28px 28px' }}>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
          padding: '12px 16px', color: C.rojo, fontSize: 13, marginBottom: 20,
          display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <IcoX />{error}
        </div>
      )}

      {/* Card importar */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ede9fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.indigo, flexShrink: 0 }}>
            <IcoUpload />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 15 }}>Importar desde Efacilito</div>
            <div style={{ fontSize: 12, color: C.textDim }}>Sube el Excel exportado desde Consultas → Exportar Facturas</div>
          </div>
        </div>

        {/* Zona drop */}
        <div
          onClick={() => !importando && inputRef.current?.click()}
          style={{
            border: `2px dashed ${importando ? C.indigo : C.border}`,
            borderRadius: 12, padding: '32px 20px', textAlign: 'center',
            cursor: importando ? 'default' : 'pointer',
            background: importando ? '#faf5ff' : '#f9fafb',
            transition: 'all .2s',
          }}
          onMouseEnter={e => { if (!importando) e.currentTarget.style.borderColor = C.indigo; }}
          onMouseLeave={e => { if (!importando) e.currentTarget.style.borderColor = C.border; }}
        >
          {importando ? (
            <div style={{ color: C.indigo, fontSize: 14, fontWeight: 600 }}>⏳ Procesando archivo...</div>
          ) : resultado ? (
            <div style={{ color: C.verde, fontSize: 14, fontWeight: 600 }}>
              ✓ {archivoNombre} — importado
            </div>
          ) : (
            <>
              <div style={{ color: C.textDim, fontSize: 14, marginBottom: 6 }}>
                Haz clic o arrastra el archivo Excel aquí
              </div>
              <div style={{ color: C.textDim, fontSize: 12 }}>Formatos aceptados: .xlsx, .xls</div>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleImportar} style={{ display: 'none' }} />

        {/* Instrucción */}
        <div style={{ marginTop: 14, background: '#f0f4ff', border: '1px solid #c7d2fe',
          borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8 }}>
          <div style={{ color: C.indigo, flexShrink: 0, marginTop: 1 }}><IcoInfo /></div>
          <div style={{ fontSize: 12, color: '#4338ca', lineHeight: 1.7 }}>
            En Efacilito ve a <strong>Consultas → Exportar Facturas</strong>, elige el rango de fechas
            y descarga en formato <strong>Excel</strong>. Luego súbelo aquí para registrar las facturas
            y descontar stock automáticamente.
          </div>
        </div>
      </div>

      {/* Resultado de importación */}
      {resultado && (
        <div style={{ marginTop: 20 }}>
          {/* KPIs resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Facturas nuevas',      value: resultado.resumen.insertadas,      color: C.verde,    bg: '#d1fae5' },
              { label: 'Actualizadas',          value: resultado.resumen.actualizadas,    color: C.amarillo, bg: '#fef9c3' },
              { label: 'Mov. de stock',         value: resultado.resumen.stockMovimientos,color: C.indigo,   bg: '#ede9fe' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim,
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Tabla resumen de lo importado */}
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 14 }}>
                Facturas importadas ({resultado.facturas.length})
              </div>
              <button
                onClick={onImportado}
                style={{ background: C.azul, color: '#fff', border: 'none', borderRadius: 7,
                  padding: '7px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6 }}>
                <IcoHistory /> Ver en Historial
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Nro. Factura', 'Fecha', 'Cliente', 'Cédula/RUC', 'Total', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', color: C.textDim, fontWeight: 600,
                        fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
                        borderBottom: `1px solid ${C.border}`, textAlign: h === 'Total' ? 'right' : 'left',
                        whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultado.facturas.map((f, i) => {
                    const est = ESTADO_COLOR[f.estado] || { bg: '#f3f4f6', color: '#374151' };
                    return (
                      <tr key={f.id || i} style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '9px 14px', color: C.indigo, fontWeight: 600, fontFamily: 'monospace' }}>{f.nro_factura}</td>
                        <td style={{ padding: '9px 14px', color: C.textSec, whiteSpace: 'nowrap' }}>{f.fecha}</td>
                        <td style={{ padding: '9px 14px', color: C.textPrimary }}>{f.cliente}</td>
                        <td style={{ padding: '9px 14px', color: C.textDim, fontFamily: 'monospace', fontSize: 12 }}>{f.cedula_ruc}</td>
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: C.textPrimary }}>{fmt(f.total)}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{ background: est.bg, color: est.color,
                            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                            {f.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botón importar otro */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <BtnSm color={C.indigo} outline onClick={() => { setResultado(null); setArchivo(''); }}>
              Importar otro archivo
            </BtnSm>
            <BtnSm color={C.azul} onClick={onImportado} icon={<IcoHistory />}>
              Ver historial completo
            </BtnSm>          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PANEL HISTORIAL
// Agrupa las facturas por archivo importado (archivo_origen + fecha agrupada)
// y permite eliminar un lote completo
// ════════════════════════════════════════════════════════════
function PanelHistorial() {
  const [facturas, setFacturas]   = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState('');
  const [buscar, setBuscar]       = useState('');
  const [fechaDesde, setDesde]    = useState('');
  const [fechaHasta, setHasta]    = useState('');
  const [expandido, setExpandido] = useState(null);   // archivo_origen del lote abierto
  const [modalDetalle, setModalDetalle] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.append('fecha_desde', fechaDesde);
      if (fechaHasta) params.append('fecha_hasta', fechaHasta);
      if (buscar)     params.append('buscar', buscar);
      const { data } = await api.get(`/facturas-ef?${params}`);
      setFacturas(data.facturas || []);
    } catch {
      setError('Error al cargar el historial.');
    } finally {
      setCargando(false);
    }
  }, [fechaDesde, fechaHasta, buscar]);

  useEffect(() => { cargar(); }, []);

  // Exportar Excel
  const exportar = async () => {
    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.append('fecha_desde', fechaDesde);
      if (fechaHasta) params.append('fecha_hasta', fechaHasta);
      if (buscar)     params.append('buscar', buscar);
      const response = await api.get(`/facturas-ef/exportar?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `facturas_ef_${fechaDesde || 'todo'}_${fechaHasta || 'todo'}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
    } catch { setError('Error al exportar.'); }
  };

  // Eliminar UN lote completo (todas las facturas de un archivo_origen)
  const eliminarLote = async (archivoOrigen, idsLote) => {
    if (!window.confirm(`¿Eliminar las ${idsLote.length} facturas de la importación "${archivoOrigen}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await Promise.all(idsLote.map(id => api.delete(`/facturas-ef/${id}`)));
      setFacturas(prev => prev.filter(f => !idsLote.includes(f.id)));
      if (expandido === archivoOrigen) setExpandido(null);
    } catch { setError('Error al eliminar el lote.'); }
  };

  // Agrupar facturas por archivo_origen
  const lotes = (() => {
    const mapa = new Map();
    for (const f of facturas) {
      const key = f.archivo_origen || '—';
      if (!mapa.has(key)) {
        mapa.set(key, {
          archivo: key,
          importado_en: f.importado_en,
          facturas: [],
        });
      }
      mapa.get(key).facturas.push(f);
    }
    // Ordenar por fecha de importación (más reciente primero)
    return [...mapa.values()].sort((a, b) =>
      new Date(b.importado_en || 0) - new Date(a.importado_en || 0)
    );
  })();

  // KPIs globales
  const totalVentas = facturas.reduce((s, f) => s + parseFloat(f.total || 0), 0);

  return (
    <div style={{ padding: '24px 28px' }}>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
          padding: '12px 16px', color: C.rojo, fontSize: 13, marginBottom: 16,
          display: 'flex', gap: 8 }}>
          <IcoX />{error}
        </div>
      )}

      {/* Filtros */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
        padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: 'uppercase',
            letterSpacing: 1, display: 'block', marginBottom: 5 }}>Desde</label>
          <input type="date" value={fechaDesde} onChange={e => setDesde(e.target.value)}
            style={{ ...inputSt, width: 160 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: 'uppercase',
            letterSpacing: 1, display: 'block', marginBottom: 5 }}>Hasta</label>
          <input type="date" value={fechaHasta} onChange={e => setHasta(e.target.value)}
            style={{ ...inputSt, width: 160 }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: 'uppercase',
            letterSpacing: 1, display: 'block', marginBottom: 5 }}>Buscar</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textDim }}>
              <IcoSearch />
            </div>
            <input value={buscar} onChange={e => setBuscar(e.target.value)}
              placeholder="Factura, cliente o cédula..."
              style={{ ...inputSt, paddingLeft: 34 }} />
          </div>
        </div>
        <BtnSm color={C.azul} onClick={cargar} disabled={cargando} icon={<IcoSearch />}>
          {cargando ? 'Cargando...' : 'Consultar'}
        </BtnSm>
        {facturas.length > 0 && (
          <BtnSm color={C.verde} onClick={exportar} icon={<IcoDown />}>Exportar Excel</BtnSm>
        )}
      </div>

      {/* KPIs */}
      {facturas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Importaciones',  value: lotes.length,                                           color: C.indigo,   bg: '#ede9fe' },
            { label: 'Total facturas', value: facturas.length,                                         color: C.azul,     bg: '#dbeafe' },
            { label: 'Autorizadas',    value: facturas.filter(f => f.estado === 'AUTORIZADO').length,  color: C.verde,    bg: '#d1fae5' },
            { label: 'Total ventas',   value: fmt(totalVentas),                                        color: C.amarillo, bg: '#fef9c3' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {!cargando && facturas.length === 0 && (
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14,
          padding: '52px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f0f4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: C.indigo }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 16, marginBottom: 6 }}>
            Sin importaciones registradas
          </div>
          <div style={{ color: C.textDim, fontSize: 13 }}>
            Cambia a la pestaña Importar para cargar un Excel de Efacilito.
          </div>
        </div>
      )}

      {/* Lista de lotes */}
      {lotes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lotes.map((lote, loteIdx) => {
            const abierto   = expandido === lote.archivo;
            const totalLote = lote.facturas.reduce((s, f) => s + parseFloat(f.total || 0), 0);
            const idsLote   = lote.facturas.map(f => f.id);
            const fechaImp  = lote.importado_en
              ? new Date(lote.importado_en).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
              : '—';
            const nombreLote = (lote.archivo && lote.archivo !== '—')
              ? lote.archivo
              : `Importación ${lotes.length - loteIdx}`;

            return (
              <div key={lote.archivo} style={{ background: '#fff', border: `1px solid ${C.border}`,
                borderRadius: 12, overflow: 'hidden',
                boxShadow: abierto ? '0 4px 16px rgba(99,102,241,0.08)' : 'none' }}>

                {/* Cabecera del lote */}
                <div
                  onClick={() => setExpandido(abierto ? null : lote.archivo)}
                  style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 12,
                    background: abierto ? '#f5f3ff' : '#fff',
                    borderBottom: abierto ? `1px solid ${C.border}` : 'none',
                    transition: 'background .15s' }}>

                  {/* Chevron */}
                  <div style={{ color: abierto ? C.indigo : C.textDim, flexShrink: 0 }}>
                    <IcoChevron open={abierto} />
                  </div>

                  {/* Ícono archivo */}
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ede9fe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: C.indigo, flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 14,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nombreLote}
                    </div>
                    <div style={{ fontSize: 12, color: C.textDim, marginTop: 2, display: 'flex', gap: 12 }}>
                      <span><IcoCalendar /> {fechaImp}</span>
                      <span style={{ color: C.azul, fontWeight: 600 }}>{lote.facturas.length} facturas</span>
                      <span style={{ color: C.verde, fontWeight: 700 }}>Total: {fmt(totalLote)}</span>
                    </div>
                  </div>

                  {/* Botón eliminar lote */}
                  <div onClick={e => e.stopPropagation()}>
                    <BtnSm color={C.rojo} outline
                      onClick={() => eliminarLote(lote.archivo, idsLote)}
                      icon={<IcoTrash />}>
                      Eliminar importación
                    </BtnSm>
                  </div>
                </div>

                {/* Tabla de facturas del lote (expandible) */}
                {abierto && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#fafafa' }}>
                          {['Nro. Factura', 'Fecha', 'Cliente', 'Cédula / RUC', 'Total', 'Estado', ''].map(h => (
                            <th key={h} style={{ padding: '9px 14px', color: C.textDim, fontWeight: 600,
                              fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
                              borderBottom: `1px solid ${C.border}`,
                              textAlign: h === 'Total' ? 'right' : 'left',
                              whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lote.facturas.map((f, i) => {
                          const est = ESTADO_COLOR[f.estado] || { bg: '#f3f4f6', color: '#374151' };
                          return (
                            <tr key={f.id} style={{ borderBottom: `1px solid ${C.border}`,
                              background: i % 2 === 0 ? 'transparent' : '#fafafa', cursor: 'pointer' }}
                              onClick={() => setModalDetalle(f)}
                              onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#fafafa'}>
                              <td style={{ padding: '9px 14px', color: C.indigo, fontWeight: 600,
                                fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{f.nro_factura}</td>
                              <td style={{ padding: '9px 14px', color: C.textSec, whiteSpace: 'nowrap' }}>{f.fecha}</td>
                              <td style={{ padding: '9px 14px', color: C.textPrimary }}>{f.cliente}</td>
                              <td style={{ padding: '9px 14px', color: C.textDim, fontFamily: 'monospace', fontSize: 12 }}>{f.cedula_ruc}</td>
                              <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: C.textPrimary }}>{fmt(f.total)}</td>
                              <td style={{ padding: '9px 14px' }}>
                                <span style={{ background: est.bg, color: est.color,
                                  borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700,
                                  display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                  {f.estado === 'AUTORIZADO' && <IcoCheck />}
                                  {f.estado === 'ANULADO' && <IcoX />}
                                  {f.estado}
                                </span>
                              </td>
                              <td style={{ padding: '9px 14px' }} onClick={e => e.stopPropagation()}>
                                <BtnSm color={C.azul} outline onClick={() => setModalDetalle(f)} icon={<IcoEye />}>Ver</BtnSm>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f0f4ff', borderTop: `2px solid ${C.border}` }}>
                          <td colSpan={4} style={{ padding: '10px 14px', color: C.textDim, fontSize: 12, fontWeight: 700 }}>
                            TOTAL IMPORTACIÓN
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800,
                            color: C.indigo, fontSize: 15 }}>{fmt(totalLote)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle factura */}
      {modalDetalle && (
        <Modal titulo="Detalle de factura" onClose={() => setModalDetalle(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Número de factura</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.indigo }}>{modalDetalle.nro_factura}</div>
            </div>
            {(() => {
              const est = ESTADO_COLOR[modalDetalle.estado] || { bg: '#f3f4f6', color: '#374151' };
              return <span style={{ background: est.bg, color: est.color,
                borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>
                {modalDetalle.estado}
              </span>;
            })()}
          </div>

          {/* Cliente */}
          <div style={{ background: '#f9fafb', border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Cliente</div>
            <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 15, marginBottom: 3 }}>
              {modalDetalle.cliente}
            </div>
            <div style={{ fontSize: 13, color: C.textDim, fontFamily: 'monospace' }}>{modalDetalle.cedula_ruc}</div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: C.textDim, fontSize: 13, marginBottom: 18 }}>
            <IcoCalendar />
            <span>Fecha de emisión: <strong style={{ color: C.textSec }}>{modalDetalle.fecha}</strong></span>
          </div>

          {/* Detalle de productos */}
          {modalDetalle.detalle && modalDetalle.detalle.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Productos</div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Cód.', 'Descripción', 'Precio', 'Cant.', 'Dto.', '%IVA', 'Importe'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', color: C.textDim, fontWeight: 600,
                          fontSize: 10, textTransform: 'uppercase', letterSpacing: 1,
                          borderBottom: `1px solid ${C.border}`,
                          textAlign: ['Precio','Cant.','Dto.','%IVA','Importe'].includes(h) ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modalDetalle.detalle.map((d, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}`,
                        background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                        <td style={{ padding: '8px 12px', color: C.textDim, fontFamily: 'monospace', fontSize: 11 }}>{d.codigo || '—'}</td>
                        <td style={{ padding: '8px 12px', color: C.textSec }}>{d.descripcion}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: C.textSec }}>${fmtN(d.precio)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: C.textSec }}>{fmtN(d.cantidad)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: C.textDim }}>${fmtN(d.descuento)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: C.textDim }}>{fmtN(d.pct_iva)}%</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: C.verde }}>${fmtN(d.importe)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: '#f0f4ff', border: `1px solid #c7d2fe`,
              borderRadius: 10, padding: '14px 20px', minWidth: 200,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 30 }}>
              <span style={{ color: C.indigo, fontWeight: 700, fontSize: 15 }}>TOTAL</span>
              <span style={{ color: C.indigo, fontWeight: 800, fontSize: 20 }}>{fmt(modalDetalle.total)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button onClick={() => setModalDetalle(null)}
              style={{ background: '#f3f4f6', border: 'none', color: C.textSec,
                borderRadius: 8, padding: '9px 22px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}