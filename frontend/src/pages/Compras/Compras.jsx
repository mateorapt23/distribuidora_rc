import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';

// ── Paleta dark premium ────────────────────────────────────
const D = {
  bg:        '#0F1117',
  panel:     '#161B27',
  card:      '#1E2435',
  cardHov:   '#242A3D',
  border:    '#2A3148',
  borderBrt: '#3A4560',
  text1:     '#F0F2FF',
  text2:     '#9BA3C7',
  text3:     '#5A6280',
  gold:      '#C9A84C',
  goldBg:    'rgba(201,168,76,.12)',
  goldBdr:   'rgba(201,168,76,.25)',
  teal:      '#2DD4BF',
  tealBg:    'rgba(45,212,191,.10)',
  tealBdr:   'rgba(45,212,191,.25)',
  red:       '#F87171',
  redBg:     'rgba(248,113,113,.10)',
  amber:     '#FBBF24',
  amberBg:   'rgba(251,191,36,.10)',
  blue:      '#60A5FA',
  blueBg:    'rgba(96,165,250,.10)',
};

const filaVacia = () => ({
  _id: Math.random(),
  producto_id: null,
  codigo: '',
  descripcion: '',
  cantidad: 1,
  costo: 0,
  iva: 0,
  subtotal: 0,
  guardarEnInventario: false,
});

// ── Icons ──────────────────────────────────────────────────
const Ico = {
  eye:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  save:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  clear:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  upload: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  x:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  file:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  info:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  spin:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin .7s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  pkg:    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  lock:   <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  hist:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  new:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
};

// ── Styled input ───────────────────────────────────────────
const inp = {
  width: '100%', background: '#ffffff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '10px 13px', color: '#111827',
  fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
};

// ── Chip micro-label ───────────────────────────────────────
const Chip = ({ color, bg, border, children }) => (
  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
    color, background: bg, border: `1px solid ${border}`, letterSpacing: .4 }}>
    {children}
  </span>
);

// ══════════════════════════════════════════════════════════
export default function Compras() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [seccion, setSeccion] = useState('nueva');
  const [refrescar, setRefrescar] = useState(0);
  const [datosEdicion, setDatosEdicion] = useState(null);

  const onCargarEnNueva = (datos) => {
    setDatosEdicion(datos);
    setSeccion('nueva');
  };

  if (!esAdmin) return (
    <div style={{ background: D.bg, minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 20,
        padding: '52px 48px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 68, height: 68, borderRadius: 18, background: D.amberBg,
          border: `1px solid rgba(251,191,36,.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', color: D.amber }}>
          {Ico.lock}
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, color: D.text1, marginBottom: 10, letterSpacing: -.3 }}>
          Acceso restringido
        </div>
        <div style={{ fontSize: 13.5, color: D.text2, lineHeight: 1.8, marginBottom: 24 }}>
          Esta sección está disponible únicamente para administradores del sistema.
        </div>
        <div style={{ padding: '13px 16px', background: D.blueBg, borderRadius: 10,
          border: `1px solid rgba(96,165,250,.2)`, display: 'flex', gap: 10,
          alignItems: 'flex-start', textAlign: 'left' }}>
          <span style={{ color: D.blue, flexShrink: 0, marginTop: 1 }}>{Ico.info}</span>
          <span style={{ fontSize: 12.5, color: D.blue, lineHeight: 1.6 }}>
            Comunícate con el administrador para obtener acceso.
          </span>
        </div>
      </div>
      <STYLES />
    </div>
  );

  return (
    <div style={{ background: '#f4f5fb', minHeight: '100vh' }}>
      <STYLES />

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 28px', height: 80,
        display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Compras</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Gestión de compras a proveedores</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '0 32px' }}>
        <div style={{ display: 'flex' }}>
          {[
            { key: 'nueva',     label: 'Nueva compra', icon: Ico.new  },
            { key: 'historial', label: 'Historial',    icon: Ico.hist },
          ].map(tab => {
            const active = seccion === tab.key;
            return (
              <button key={tab.key} onClick={() => setSeccion(tab.key)}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  padding: '14px 22px', fontSize: 13.5, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: active ? '#f59e0b' : '#9ca3af',
                  borderBottom: active ? '2px solid #f59e0b' : '2px solid transparent',
                  transition: 'all .15s', marginBottom: -1 }}>
                {tab.icon}{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {seccion === 'nueva'
        ? <NuevaCompra
            onGuardado={() => { setRefrescar(r => r + 1); setSeccion('historial'); }}
            datosEdicion={datosEdicion}
            onDatosUsados={() => setDatosEdicion(null)}
          />
        : <Historial key={refrescar} esAdmin={esAdmin} onCargarEnNueva={onCargarEnNueva} />
      }
    </div>
  );
}

// ── Global styles ──────────────────────────────────────────
const STYLES = () => (
  <style>{`
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    * { box-sizing: border-box; }
    input::placeholder { color: #9ca3af; }
    input:focus, select:focus {
      border-color: ${D.gold} !important;
      box-shadow: 0 0 0 3px rgba(201,168,76,.15) !important;
      outline: none;
    }
    .item-card { transition: background .15s, border-color .15s; }
    .item-card:hover { background: #f3f4f6 !important; border-color: #d1d5db !important; }
    .row-fade { animation: slideUp .18s ease both; }
    .sugg-row:hover { background: #f9fafb !important; }
    .ghost-btn:hover { border-color: ${D.gold} !important; color: ${D.gold} !important; }
    .del-btn:hover { color: ${D.red} !important; background: ${D.redBg} !important; }
    .hist-row:hover td { background: #f9fafb !important; }
    input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.4); }
  `}</style>
);

// ══════════════════════════════════════════════════════════
function ModalSRI({ onImportar, onCerrar }) {
  const [archivo, setArchivo]   = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');
  const [drag, setDrag]         = useState(false);
  const inputRef                = useRef(null);

  const validar = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xml')) { setError('El archivo debe ser .xml'); return; }
    setError('');
    setArchivo(file);
  };

  const parsear = async () => {
    if (!archivo) { setError('Selecciona un archivo XML primero.'); return; }
    setError('');
    setCargando(true);
    try {
      const form = new FormData();
      form.append('archivo', archivo);
      const { data } = await api.post('/compras/sri/xml', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onImportar(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al leer el XML.');
    } finally { setCargando(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,7,14,.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 24, backdropFilter: 'blur(4px)', animation: 'fadeIn .15s' }}>
      <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 20,
        padding: '32px 36px', width: '100%', maxWidth: 500,
        boxShadow: '0 32px 80px rgba(0,0,0,.6)', animation: 'slideUp .2s ease' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: D.goldBg,
                border: `1px solid ${D.goldBdr}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: D.gold }}>{Ico.upload}</div>
              <span style={{ fontSize: 16, fontWeight: 700, color: D.text1 }}>Importar XML de factura</span>
            </div>
            <p style={{ fontSize: 13, color: D.text2, margin: 0, lineHeight: 1.6, paddingLeft: 42 }}>
              Sube el archivo <code style={{ background: D.card, padding: '1px 6px', borderRadius: 4,
                fontSize: 12, color: D.gold, border: `1px solid ${D.border}` }}>.xml</code> de tu proveedor.
            </p>
          </div>
          <button onClick={onCerrar}
            style={{ background: D.card, border: `1px solid ${D.border}`, color: D.text2,
              cursor: 'pointer', borderRadius: 8, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {Ico.x}
          </button>
        </div>

        {/* Drop zone */}
        <div onClick={() => inputRef.current?.click()}
          onDrop={e => { e.preventDefault(); setDrag(false); validar(e.dataTransfer.files?.[0]); }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          style={{ border: `2px dashed ${archivo ? D.teal : drag ? D.gold : D.border}`,
            borderRadius: 14, padding: '32px 24px', marginBottom: 16,
            textAlign: 'center', cursor: 'pointer',
            background: archivo ? D.tealBg : drag ? D.goldBg : D.card,
            transition: 'all .18s' }}>
          <input ref={inputRef} type="file" accept=".xml" style={{ display: 'none' }}
            onChange={e => validar(e.target.files?.[0])} />
          {archivo ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: D.tealBg,
                border: `1px solid ${D.tealBdr}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: D.teal }}>{Ico.check}</div>
              <span style={{ fontSize: 14, fontWeight: 700, color: D.teal }}>{archivo.name}</span>
              <span style={{ fontSize: 12, color: D.text3 }}>{(archivo.size/1024).toFixed(1)} KB · Click para cambiar</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: D.bg,
                border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: D.text3 }}>{Ico.upload}</div>
              <span style={{ fontSize: 14, color: D.text1, fontWeight: 600 }}>Arrastra aquí o haz click</span>
              <span style={{ fontSize: 12, color: D.text3 }}>Solo archivos .xml</span>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: D.redBg, border: '1px solid rgba(248,113,113,.2)',
            borderRadius: 10, padding: '11px 15px', marginBottom: 14,
            display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <span style={{ color: D.red, flexShrink: 0 }}>{Ico.info}</span>
            <span style={{ fontSize: 13, color: D.red, lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        <div style={{ background: D.amberBg, border: '1px solid rgba(251,191,36,.15)',
          borderRadius: 10, padding: '11px 15px', marginBottom: 26,
          display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <span style={{ color: D.amber, flexShrink: 0 }}>{Ico.info}</span>
          <span style={{ fontSize: 12.5, color: D.amber, lineHeight: 1.6 }}>
            El proveedor está <strong>obligado por ley</strong> a enviarte el XML con cada factura electrónica.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCerrar}
            style={{ background: 'transparent', border: `1px solid ${D.border}`, color: D.text2,
              borderRadius: 10, padding: '10px 22px', fontWeight: 600, fontSize: 13.5,
              cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={parsear} disabled={cargando || !archivo}
            style={{ background: D.gold, border: 'none', color: '#0F1117', borderRadius: 10,
              padding: '10px 26px', fontWeight: 700, fontSize: 13.5,
              cursor: (cargando || !archivo) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: (cargando || !archivo) ? .5 : 1,
              display: 'flex', alignItems: 'center', gap: 8 }}>
            {cargando ? <>{Ico.spin} Procesando...</> : <>{Ico.file} Importar XML</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
function NuevaCompra({ onGuardado, datosEdicion, onDatosUsados }) {
  const [proveedor, setProveedor]   = useState('');
  const [ruc, setRuc]               = useState('');
  const [fecha, setFecha]           = useState(new Date().toISOString().split('T')[0]);
  const [facturaRef, setFacturaRef] = useState('');
  const [notas, setNotas]           = useState('');
  const [filas, setFilas]           = useState([filaVacia()]);
  const [guardando, setGuardando]   = useState(false);
  const [modalSRI, setModalSRI]     = useState(false);
  const [importadoSRI, setImportadoSRI] = useState(false);
  const [editandoId, setEditandoId]         = useState(null);
  const [editandoNumero, setEditandoNumero] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [filaActiva, setFilaActiva]   = useState(null);
  // Modal de precios pre-guardado
  const [modalPrecios, setModalPrecios] = useState(false);
  const [productosParaInventario, setProductosParaInventario] = useState([]);
  // Vinculación de ítems XML a productos del inventario
  const [sugerenciasXML, setSugerenciasXML] = useState({}); // { filaId: [productos] }
  const [vinculacionXML, setVinculacionXML] = useState({}); // { filaId: producto | null }
  const autocompleteRef = useRef(null);
  const busquedaTimeout = useRef(null);

  // Cargar datos desde Historial (Ver en nueva compra)
  useEffect(() => {
    if (!datosEdicion) return;
    setEditandoId(datosEdicion.id || null);
    setEditandoNumero(datosEdicion.numero || '');
    setProveedor(datosEdicion.proveedor_nombre || '');
    setRuc(datosEdicion.ruc_proveedor || '');
    setFecha(datosEdicion.fecha?.slice(0, 10) || new Date().toISOString().split('T')[0]);
    setFacturaRef(datosEdicion.factura_ref || '');
    setNotas(datosEdicion.notas || '');
    if (datosEdicion.detalle?.length > 0) {
      setFilas(datosEdicion.detalle.map(item => {
        const cant = parseFloat(item.cantidad) || 1;
        const cost = parseFloat(item.costo)    || 0;
        const iva  = parseFloat(item.iva)       || 0;
        return {
          _id: Math.random(), producto_id: item.producto_id || null,
          codigo: item.codigo || '', descripcion: item.descripcion || '',
          cantidad: cant, costo: cost, iva,
          subtotal: cant * cost * (1 + iva / 100),
          guardarEnInventario: false,
        };
      }));
    }
    onDatosUsados?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datosEdicion]);

  useEffect(() => {
    const handler = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setSugerencias([]); setFilaActiva(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const buscarProductos = useCallback(async (texto, filaId) => {
    if (!texto || texto.length < 2) { setSugerencias([]); return; }
    try {
      const { data } = await api.get(`/productos/buscar?q=${encodeURIComponent(texto)}&limit=8`);
      setSugerencias(data.data || []);
      setFilaActiva(filaId);
    } catch { setSugerencias([]); }
  }, []);

  const onCambioCodigo = (filaId, valor) => {
    actualizarFila(filaId, { codigo: valor, producto_id: null });
    clearTimeout(busquedaTimeout.current);
    busquedaTimeout.current = setTimeout(() => buscarProductos(valor, filaId), 250);
  };

  const onCambioDesc = (filaId, valor) => {
    actualizarFila(filaId, { descripcion: valor, producto_id: null });
    clearTimeout(busquedaTimeout.current);
    busquedaTimeout.current = setTimeout(() => buscarProductos(valor, filaId), 250);
  };

  const seleccionarProducto = (filaId, p) => {
    actualizarFila(filaId, {
      producto_id: p.id, codigo: p.codigo, descripcion: p.descripcion,
      costo: parseFloat(p.pvp1) || 0, iva: parseFloat(p.iva) || 0,
    }, true);
    setSugerencias([]); setFilaActiva(null);
  };

  const actualizarFila = (filaId, cambios, recalcular = false) => {
    setFilas(prev => prev.map(f => {
      if (f._id !== filaId) return f;
      const n = { ...f, ...cambios };
      if (recalcular || ['cantidad','costo','iva'].some(k => k in cambios)) {
        const cant = parseFloat(n.cantidad) || 0;
        const cost = parseFloat(n.costo)    || 0;
        const iva  = parseFloat(n.iva)       || 0;
        n.subtotal = cant * cost * (1 + iva / 100);
      }
      return n;
    }));
  };

  const handleImportarSRI = async (datos) => {
    if (datos.proveedor)   setProveedor(datos.proveedor);
    if (datos.ruc)         setRuc(datos.ruc);
    if (datos.fecha)       setFecha(datos.fecha);
    if (datos.factura_ref) setFacturaRef(datos.factura_ref);

    const nuevasFilas = [];
    if (datos.detalle?.length > 0) {
      for (const item of datos.detalle) {
        const cant = parseFloat(item.cantidad) || 1;
        const cost = parseFloat(item.costo)    || 0;
        const iva  = parseFloat(item.iva)       || 0;
        nuevasFilas.push({
          _id: Math.random(), producto_id: null, codigo: item.codigo || '',
          descripcion: item.descripcion || '', cantidad: cant, costo: cost, iva,
          subtotal: cant * cost * (1 + iva / 100),
          guardarEnInventario: false,
        });
      }
    }
    setFilas(nuevasFilas);
    setVinculacionXML({});

    // Buscar sugerencias de inventario para cada ítem
    const sugs = {};
    for (const fila of nuevasFilas) {
      if (fila.descripcion && fila.descripcion.length >= 3) {
        try {
          const palabras = fila.descripcion.split(' ').slice(0, 3).join(' ');
          const { data } = await api.get(`/productos/buscar?q=${encodeURIComponent(palabras)}&limit=5`);
          if (data.data?.length > 0) sugs[fila._id] = data.data;
        } catch { /* ignorar errores de búsqueda */ }
      }
    }
    setSugerenciasXML(sugs);

    setImportadoSRI(true);
    setModalSRI(false);
  };

  const agregarFila = () => setFilas(prev => [...prev, filaVacia()]);
  const eliminarFila = (id) => { if (filas.length > 1) setFilas(prev => prev.filter(f => f._id !== id)); };

  const limpiar = () => {
    setFilas([filaVacia()]);
    setProveedor(''); setRuc(''); setFecha(new Date().toISOString().split('T')[0]);
    setFacturaRef(''); setNotas(''); setImportadoSRI(false);
    setEditandoId(null); setEditandoNumero('');
    setSugerenciasXML({}); setVinculacionXML({});
  };

  const subtotalBase = filas.reduce((s, f) => s + (parseFloat(f.cantidad)||0)*(parseFloat(f.costo)||0), 0);
  const totalIva     = filas.reduce((s, f) => {
    const b = (parseFloat(f.cantidad)||0)*(parseFloat(f.costo)||0);
    return s + b*((parseFloat(f.iva)||0)/100);
  }, 0);
  const total = subtotalBase + totalIva;
  const itemsValidos = filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0).length;

  // Construye el detalle de la compra (con vinculaciones XML aplicadas)
  const construirDetalle = (validas) => validas.map(f => {
    const vinc = vinculacionXML[f._id];
    return {
      producto_id: vinc ? vinc.id : (f.producto_id || null),
      descripcion: f.descripcion,
      cantidad: parseFloat(f.cantidad),
      costo: parseFloat(f.costo),
      iva: parseFloat(f.iva) || 0,
    };
  });

  // Paso 1: validar y abrir modal de precios si hay ítems marcados,
  // o guardar directamente si no hay ninguno marcado.
  const guardar = () => {
    const validas = filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0);
    if (validas.length === 0) { alert('Agrega al menos un producto'); return; }
    if (!proveedor.trim()) { alert('Ingresa el nombre del proveedor'); return; }

    const paraInventario = validas
      .filter(f => f.guardarEnInventario)
      .map(f => ({
        codigo: (vinculacionXML[f._id]?.codigo || f.codigo || '').toString().trim(),
        descripcion: f.descripcion,
        iva: parseFloat(f.iva) || 0,
        pvp1: 0,
        pvp2: 0,
      }))
      .filter(p => p.descripcion);

    if (paraInventario.length > 0) {
      // Mostrar modal de precios ANTES de guardar
      setProductosParaInventario(paraInventario);
      setModalPrecios(true);
    } else {
      // Sin ítems marcados → guardar directamente
      ejecutarGuardar([]);
    }
  };

  // Paso 2: guardar compra (y opcionalmente productos en inventario)
  const ejecutarGuardar = async (productosInventario) => {
    const validas = filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0);
    setGuardando(true);
    const body = {
      proveedor_nombre: proveedor.trim(), ruc_proveedor: ruc.trim(),
      fecha, factura_ref: facturaRef, notas,
      detalle: construirDetalle(validas),
    };
    try {
      if (editandoId) {
        await api.put(`/compras/${editandoId}`, body);
      } else {
        await api.post('/compras', body);
      }

      // Guardar productos en inventario si los hay
      if (productosInventario.length > 0) {
        const validos = productosInventario.filter(p => p.codigo && p.codigo.trim() && p.descripcion);
        if (validos.length > 0) {
          await api.post('/productos/batch-inventario', { productos: validos });
        }
      }

      setModalPrecios(false);
      setProductosParaInventario([]);
      limpiar();
      onGuardado();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar compra');
    } finally { setGuardando(false); }
  };

  // Llamado desde el modal cuando el usuario confirma precios
  const guardarInventarioBatch = () => {
    ejecutarGuardar(productosParaInventario);
  };

  // Omitir inventario → guardar compra sin agregar a productos
  const omitirInventario = () => {
    setModalPrecios(false);
    ejecutarGuardar([]);
  };

  return (
    <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box' }}>
      {modalSRI && <ModalSRI onImportar={handleImportarSRI} onCerrar={() => setModalSRI(false)} />}

      {/* ── Modal de precios (se abre ANTES de guardar) ── */}
      {modalPrecios && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,7,14,.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: 24, backdropFilter: 'blur(5px)', animation: 'fadeIn .15s' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb',
            borderRadius: 20, padding: '32px 36px', width: '100%', maxWidth: 720,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,.25)', animation: 'slideUp .2s ease' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ background: D.teal, color: '#0A0C10', borderRadius: 6,
                    fontSize: 10, fontWeight: 800, padding: '3px 9px', letterSpacing: .8,
                    textTransform: 'uppercase' }}>
                    Paso 1 de 2
                  </div>
                  <div style={{ background: '#f3f4f6', color: '#9ca3af', borderRadius: 6,
                    fontSize: 10, fontWeight: 700, padding: '3px 9px', letterSpacing: .8,
                    textTransform: 'uppercase' }}>
                    Paso 2: Registrar compra
                  </div>
                </div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>
                  Definir precios de venta
                </h2>
              </div>
              <button onClick={omitirInventario} disabled={guardando}
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280',
                  cursor: 'pointer', borderRadius: 9, width: 34, height: 34,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {Ico.x}
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0, marginBottom: 20, lineHeight: 1.6 }}>
              Estos productos serán guardados en tu inventario. Define el <strong>código interno</strong> y los <strong>precios a los que los venderás</strong> — no el costo de compra.
            </p>

            {/* Aviso */}
            <div style={{ padding: '11px 15px', background: D.amberBg,
              border: '1px solid rgba(251,191,36,.2)', borderRadius: 10, marginBottom: 20,
              display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <span style={{ color: D.amber, flexShrink: 0, marginTop: 1 }}>{Ico.info}</span>
              <span style={{ fontSize: 12.5, color: D.amber, lineHeight: 1.6 }}>
                Si el código ya existe en inventario, se actualizarán sus precios. Si no, se creará el producto nuevo.
              </span>
            </div>

            {/* Cabecera columnas */}
            <div style={{ display: 'grid',
              gridTemplateColumns: '1fr 130px 110px 110px 75px',
              gap: 8, padding: '8px 12px', marginBottom: 4 }}>
              {['Descripción del producto', 'Código interno', 'PVP 1 (precio)', 'PVP 2 (mayorista)', 'IVA %'].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af',
                  letterSpacing: 1, textTransform: 'uppercase',
                  textAlign: i === 0 ? 'left' : 'center' }}>{h}</div>
              ))}
            </div>

            {/* Filas de productos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {productosParaInventario.map((p, idx) => {
                const sinCodigo = !p.codigo || !p.codigo.trim();
                return (
                  <div key={idx} style={{
                    background: sinCodigo ? '#fff7ed' : '#f9fafb',
                    border: `1px solid ${sinCodigo ? '#fed7aa' : '#e5e7eb'}`,
                    borderRadius: 10, display: 'grid',
                    gridTemplateColumns: '1fr 130px 110px 110px 75px',
                    gap: 8, alignItems: 'center', padding: '10px 12px' }}>

                    {/* Descripción */}
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={p.descripcion}>
                      {p.descripcion}
                      {sinCodigo && <div style={{ fontSize: 10.5, color: '#f97316', fontWeight: 500, marginTop: 2 }}>
                        ⚠ Ingresa un código para guardar
                      </div>}
                    </div>

                    {/* Código */}
                    <input value={p.codigo}
                      onChange={e => setProductosParaInventario(prev =>
                        prev.map((x, i) => i === idx ? { ...x, codigo: e.target.value } : x))}
                      placeholder="Ej: PROD-001"
                      style={{ ...inp, padding: '8px 10px', fontSize: 12.5,
                        textAlign: 'center', fontFamily: 'monospace',
                        borderColor: sinCodigo ? '#f97316' : undefined,
                        background: sinCodigo ? '#fff' : undefined }} />

                    {/* PVP1 */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: 9, color: '#9ca3af', fontSize: 12, pointerEvents: 'none' }}>$</span>
                      <input type="number" value={p.pvp1} min="0" step="0.01"
                        onChange={e => setProductosParaInventario(prev =>
                          prev.map((x, i) => i === idx ? { ...x, pvp1: e.target.value } : x))}
                        style={{ ...inp, padding: '8px 10px', paddingLeft: 20, fontSize: 12.5, textAlign: 'right' }} />
                    </div>

                    {/* PVP2 */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: 9, color: '#9ca3af', fontSize: 12, pointerEvents: 'none' }}>$</span>
                      <input type="number" value={p.pvp2} min="0" step="0.01"
                        onChange={e => setProductosParaInventario(prev =>
                          prev.map((x, i) => i === idx ? { ...x, pvp2: e.target.value } : x))}
                        style={{ ...inp, padding: '8px 10px', paddingLeft: 20, fontSize: 12.5, textAlign: 'right' }} />
                    </div>

                    {/* IVA */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input type="number" value={p.iva} min="0" max="100"
                        onChange={e => setProductosParaInventario(prev =>
                          prev.map((x, i) => i === idx ? { ...x, iva: e.target.value } : x))}
                        style={{ ...inp, padding: '8px 10px', paddingRight: 20, fontSize: 12.5, textAlign: 'center' }} />
                      <span style={{ position: 'absolute', right: 8, color: '#9ca3af', fontSize: 11, pointerEvents: 'none' }}>%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 12.5, color: '#9ca3af' }}>
                {(() => {
                  const conCod = productosParaInventario.filter(p => p.codigo?.trim()).length;
                  const sinCod = productosParaInventario.length - conCod;
                  if (sinCod > 0) return <span style={{ color: '#f97316' }}>⚠ {sinCod} producto{sinCod > 1 ? 's' : ''} sin código — serán omitidos</span>;
                  return <span style={{ color: '#059669' }}>✓ {conCod} producto{conCod > 1 ? 's' : ''} listos para guardar</span>;
                })()}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={omitirInventario} disabled={guardando}
                  style={{ background: 'transparent', border: '1px solid #e5e7eb', color: '#6b7280',
                    borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 13,
                    cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: guardando ? .5 : 1 }}>
                  Omitir y solo registrar compra
                </button>
                <button onClick={guardarInventarioBatch} disabled={guardando}
                  style={{ background: D.teal, border: 'none', color: '#0A0C10',
                    borderRadius: 10, padding: '10px 26px', fontWeight: 800, fontSize: 14,
                    cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: guardando ? .6 : 1,
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 16px rgba(45,212,191,.3)' }}>
                  {guardando ? <>{Ico.spin} Guardando...</> : <>{Ico.check} Confirmar y registrar compra</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner modo edición */}
      {editandoId && (
        <div style={{ background: D.blueBg, border: `1px solid rgba(96,165,250,.25)`,
          borderRadius: 12, padding: '12px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'slideUp .2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: D.blue,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F1117', flexShrink: 0 }}>
              {Ico.save}
            </div>
            <span style={{ fontSize: 13.5, color: D.blue, fontWeight: 700 }}>
              Editando compra {editandoNumero}
            </span>
            <span style={{ fontSize: 12.5, color: D.text2 }}>· Los cambios se guardarán sobre esta compra</span>
          </div>
          <button onClick={limpiar}
            style={{ background: 'none', border: 'none', color: D.blue, cursor: 'pointer', padding: 4 }}>
            {Ico.x}
          </button>
        </div>
      )}

      {/* Banner importado */}
      {importadoSRI && (
        <div style={{ background: D.tealBg, border: `1px solid ${D.tealBdr}`,
          borderRadius: 12, padding: '12px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'slideUp .2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: D.teal,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F1117', flexShrink: 0 }}>
              {Ico.check}
            </div>
            <span style={{ fontSize: 13.5, color: D.teal, fontWeight: 700 }}>XML importado correctamente</span>
            {proveedor && <span style={{ fontSize: 12.5, color: D.text2, marginLeft: 4 }}>
              · {proveedor}{ruc ? ` · ${ruc}` : ''}
            </span>}
          </div>
          <button onClick={() => setImportadoSRI(false)}
            style={{ background: 'none', border: 'none', color: D.teal, cursor: 'pointer', padding: 4 }}>
            {Ico.x}
          </button>
        </div>
      )}

      {/* Layout 1 columna — tabla ancha + barra de resumen abajo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Card: Cabecera proveedor */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 22, borderRadius: 3, background: D.gold }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151',
                letterSpacing: 1, textTransform: 'uppercase' }}>Proveedor</span>
            </div>
            <button onClick={() => setModalSRI(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7,
                background: D.goldBg, border: `1px solid ${D.goldBdr}`,
                color: D.gold, borderRadius: 8, padding: '7px 14px',
                fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .15s' }}>
              {Ico.upload} Importar XML
            </button>
          </div>
          <div style={{ padding: '20px 22px', display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16 }}>
            <Field label="Proveedor" required>
              <input value={proveedor} onChange={e => setProveedor(e.target.value)}
                placeholder="Nombre del proveedor" style={inp} />
            </Field>
            <Field label="RUC / Cédula">
              <input value={ruc} onChange={e => setRuc(e.target.value)}
                placeholder="1792072018001"
                style={{ ...inp, fontFamily: 'monospace', fontSize: 12.5 }} />
            </Field>
            <Field label="Fecha">
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inp} />
            </Field>
            <Field label="N° Factura">
              <input value={facturaRef} onChange={e => setFacturaRef(e.target.value)}
                placeholder="027-070-000086972"
                style={{ ...inp, fontFamily: 'monospace', fontSize: 12.5 }} />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Notas">
                <input value={notas} onChange={e => setNotas(e.target.value)}
                  placeholder="Observaciones opcionales..." style={inp} />
              </Field>
            </div>
          </div>
        </div>

        {/* Card: Ítems — ahora ancho completo */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'visible' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 22, borderRadius: 3, background: D.teal }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151',
                letterSpacing: 1, textTransform: 'uppercase' }}>Productos</span>
            </div>
            {itemsValidos > 0 && (
              <Chip color={D.teal} bg={D.tealBg} border={D.tealBdr}>
                {itemsValidos} ítem{itemsValidos !== 1 ? 's' : ''}
              </Chip>
            )}
          </div>

          {/* Cabecera de columnas */}
          <TablaHeader
            modoXML={importadoSRI}
            todosM={filas.length > 0 && filas.every(f => f.guardarEnInventario)}
            algunoM={filas.some(f => f.guardarEnInventario)}
            toggleTodos={() => {
              const todosM = filas.length > 0 && filas.every(f => f.guardarEnInventario);
              setFilas(prev => prev.map(f => ({ ...f, guardarEnInventario: !todosM })));
            }}
          />

          {/* Filas de ítems */}
          <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filas.map((fila, idx) => (
              <ItemRow key={fila._id} fila={fila} idx={idx}
                onCambioCodigo={onCambioCodigo}
                onCambioDesc={onCambioDesc}
                actualizarFila={actualizarFila}
                eliminarFila={eliminarFila}
                puedeEliminar={filas.length > 1}
                sugerencias={filaActiva === fila._id ? sugerencias : []}
                seleccionarProducto={seleccionarProducto}
                autocompleteRef={autocompleteRef}
                sugerenciasXML={sugerenciasXML[fila._id] || []}
                vinculacionXML={vinculacionXML[fila._id] || null}
                onVincularXML={(prod) => setVinculacionXML(prev => ({ ...prev, [fila._id]: prod }))}
                modoXML={importadoSRI}
              />
            ))}
          </div>

          {/* Agregar fila */}
          <div style={{ padding: '8px 16px 14px' }}>
            <button onClick={agregarFila} className="ghost-btn"
              style={{ width: '100%', background: 'transparent',
                border: `1.5px dashed ${D.border}`, color: D.text3,
                borderRadius: 10, padding: '10px', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'all .15s' }}>
              {Ico.plus} Agregar producto
            </button>
          </div>
        </div>

        {/* ── Barra de resumen + acciones (horizontal, ancho completo) ── */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16,
          padding: '14px 24px', display: 'flex', alignItems: 'center',
          gap: 0, flexWrap: 'wrap' }}>

          {/* Subtotal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1,
            paddingRight: 28, borderRight: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af',
              letterSpacing: .9, textTransform: 'uppercase' }}>Subtotal</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>
              ${subtotalBase.toFixed(2)}
            </span>
          </div>

          {/* IVA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1,
            paddingLeft: 28, paddingRight: 28, borderRight: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af',
              letterSpacing: .9, textTransform: 'uppercase' }}>IVA</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>
              ${totalIva.toFixed(2)}
            </span>
          </div>

          {/* Total */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1,
            paddingLeft: 28, paddingRight: 32 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: D.gold,
              letterSpacing: .9, textTransform: 'uppercase' }}>Total a pagar</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: D.gold, letterSpacing: -1 }}>
              ${total.toFixed(2)}
            </span>
          </div>

          {/* Aviso inventario (solo si hay marcados) */}
          {filas.some(f => f.guardarEnInventario) && (
            <div style={{ flex: 1, background: D.tealBg, border: `1px solid ${D.tealBdr}`,
              borderRadius: 10, padding: '8px 14px', marginRight: 16,
              display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: D.teal, flexShrink: 0 }}>{Ico.info}</span>
              <span style={{ fontSize: 12, color: D.teal, lineHeight: 1.4 }}>
                <strong>{filas.filter(f => f.guardarEnInventario).length}</strong> producto{filas.filter(f => f.guardarEnInventario).length !== 1 ? 's' : ''} al inventario · se pedirán precios de venta
              </span>
            </div>
          )}

          {/* Spacer */}
          {!filas.some(f => f.guardarEnInventario) && <div style={{ flex: 1 }} />}

          {/* Botones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button onClick={limpiar}
              style={{ background: 'transparent', border: '1px solid #e5e7eb', color: '#9ca3af',
                borderRadius: 10, padding: '9px 20px', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 7, transition: 'all .15s',
                whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = D.red; e.currentTarget.style.color = D.red; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#9ca3af'; }}>
              {Ico.clear} Limpiar
            </button>
            <button onClick={guardar} disabled={guardando}
              style={{ background: D.gold, border: 'none', color: '#0A0C10',
                borderRadius: 10, padding: '9px 28px', fontWeight: 800, fontSize: 14,
                cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: guardando ? .6 : 1, display: 'flex', alignItems: 'center', gap: 9,
                boxShadow: '0 4px 16px rgba(201,168,76,.3)', transition: 'all .15s',
                letterSpacing: .2, whiteSpace: 'nowrap' }}>
              {guardando ? <>{Ico.spin} Guardando...</> : editandoId ? <>{Ico.save} Guardar cambios</> : <>{Ico.save} Registrar compra</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Cabecera de tabla de ítems ─────────────────────────────
function TablaHeader({ modoXML, todosM, algunoM, toggleTodos }) {
  const cols = modoXML
    ? '28px 110px 1fr 70px 95px 66px 78px 100px 155px 30px'
    : '28px 110px 1fr 70px 95px 66px 78px 100px 30px';
  const headers = modoXML
    ? ['#','Código','Descripción','Cant.','Costo unit.','IVA %','Subtotal',null,'Vincular producto','']
    : ['#','Código','Descripción','Cant.','Costo unit.','IVA %','Subtotal',null,''];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols,
      gap: 8, padding: '10px 20px',
      borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
      {headers.map((h, i) => {
        if (h === null) return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', justifyContent: 'center' }}
            title="Marcar para guardar en inventario de productos"
            onClick={toggleTodos}>
            <div style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0,
              border: `2px solid ${algunoM ? D.teal : '#d1d5db'}`,
              background: todosM ? D.teal : algunoM ? D.tealBg : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s' }}>
              {todosM && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0A0C10" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              {algunoM && !todosM && <div style={{ width: 7, height: 2, background: D.teal, borderRadius: 1 }} />}
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 700,
              color: algunoM ? D.teal : '#9ca3af',
              letterSpacing: .8, textTransform: 'uppercase', lineHeight: 1.2 }}>
              Inventario
            </span>
          </div>
        );
        return (
          <div key={i} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af',
            letterSpacing: 1.1, textTransform: 'uppercase',
            textAlign: i === 0 ? 'center' : i === 4 ? 'right' : (i === 3 || i === 5 || i === 6) ? 'center' : 'left' }}>
            {h}
          </div>
        );
      })}
    </div>
  );
}

// ── Item row compacto con grid ─────────────────────────────
function ItemRow({ fila, idx, onCambioCodigo, onCambioDesc, actualizarFila,
  eliminarFila, puedeEliminar, sugerencias, seleccionarProducto, autocompleteRef,
  sugerenciasXML, vinculacionXML, onVincularXML, modoXML }) {

  const [mostrarSugsXML, setMostrarSugsXML] = useState(false);
  const [busqXML, setBusqXML] = useState('');
  const [resBusqXML, setResBusqXML] = useState([]);
  const [buscandoXML, setBuscandoXML] = useState(false);
  const busqTimeout = useRef(null);

  // Búsqueda manual en el dropdown XML — por palabras sueltas para encontrar
  // "ARENA CARRETILLAS" cuando el usuario escribe "CARRETILLAS ARENA"
  const buscarEnInventario = useCallback(async (texto) => {
    if (!texto || texto.trim().length < 2) { setResBusqXML([]); return; }
    setBuscandoXML(true);
    try {
      // Buscar con cada palabra de forma individual y combinar resultados únicos
      const palabras = texto.trim().split(/\s+/).filter(p => p.length >= 2);
      const sets = await Promise.all(
        palabras.map(p => api.get(`/productos/buscar?q=${encodeURIComponent(p)}&limit=8`).then(r => r.data.data || []))
      );
      // Unir y deduplicar por id, ordenar por cuántas palabras matchean (más = primero)
      const mapa = new Map();
      sets.forEach((res, pi) => {
        res.forEach(prod => {
          if (!mapa.has(prod.id)) mapa.set(prod.id, { ...prod, _hits: 0 });
          mapa.get(prod.id)._hits++;
        });
      });
      const ordenados = [...mapa.values()].sort((a, b) => b._hits - a._hits).slice(0, 8);
      setResBusqXML(ordenados);
    } catch { setResBusqXML([]); }
    finally { setBuscandoXML(false); }
  }, []);

  const onBusqXMLChange = (v) => {
    setBusqXML(v);
    clearTimeout(busqTimeout.current);
    busqTimeout.current = setTimeout(() => buscarEnInventario(v), 280);
  };

  const cInp = {
    ...inp, padding: '8px 10px', fontSize: 12.5,
    background: '#f9fafb', borderRadius: 7,
  };

  // El grid siempre incluye la columna del checkbox (col 8).
  // En modo XML se agrega la columna Vincular (col 9) antes del botón eliminar.
  const gridCols = modoXML
    ? '28px 110px 1fr 70px 95px 66px 78px 100px 155px 30px'
    : '28px 110px 1fr 70px 95px 66px 78px 100px 30px';

  return (
    <div className="item-card row-fade"
      style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
        display: 'grid', gridTemplateColumns: gridCols,
        gap: 8, alignItems: 'center', padding: '8px 8px' }}>

      {/* # */}
      <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>
        {idx + 1}
      </div>

      {/* Código */}
      <div style={{ position: 'relative' }}>
        <input value={fila.codigo}
          onChange={e => onCambioCodigo(fila._id, e.target.value)}
          placeholder="Cód." style={cInp} />
        {sugerencias.length > 0 && (
          <div ref={autocompleteRef} style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
            background: '#ffffff', border: '1px solid #e5e7eb',
            borderRadius: 10, minWidth: 380, maxHeight: 230,
            overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}>
            {sugerencias.map(p => (
              <div key={p.id} className="sugg-row"
                onMouseDown={() => seleccionarProducto(fila._id, p)}
                style={{ padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background .1s' }}>
                <div>
                  <span style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'monospace', marginRight: 10 }}>
                    {p.codigo}
                  </span>
                  <span style={{ color: '#111827', fontSize: 13 }}>
                    {p.descripcion.length > 38 ? p.descripcion.slice(0, 36) + '..' : p.descripcion}
                  </span>
                </div>
                <Chip color={D.teal} bg={D.tealBg} border={D.tealBdr}>
                  {parseFloat(p.stock)}
                </Chip>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Descripción */}
      <div style={{ position: 'relative' }}>
        <input value={fila.descripcion}
          onChange={e => onCambioDesc(fila._id, e.target.value)}
          placeholder="Descripción" style={{ ...cInp, minWidth: 0 }} />
      </div>

      {/* Cantidad */}
      <input type="number" value={fila.cantidad} min="0.01" step="0.01"
        onChange={e => actualizarFila(fila._id, { cantidad: e.target.value }, true)}
        style={{ ...cInp, textAlign: 'center' }} />

      {/* Costo */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 9, color: '#9ca3af', fontSize: 12, pointerEvents: 'none' }}>$</span>
        <input type="number" value={fila.costo} min="0" step="0.01"
          onChange={e => actualizarFila(fila._id, { costo: e.target.value }, true)}
          style={{ ...cInp, textAlign: 'right', paddingLeft: 20 }} />
      </div>

      {/* IVA */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input type="number" value={fila.iva} min="0" max="100"
          onChange={e => actualizarFila(fila._id, { iva: e.target.value }, true)}
          style={{ ...cInp, textAlign: 'center', paddingRight: 18 }} />
        <span style={{ position: 'absolute', right: 8, color: '#9ca3af', fontSize: 11, pointerEvents: 'none' }}>%</span>
      </div>

      {/* Subtotal */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: D.teal }}>
          ${parseFloat(fila.subtotal).toFixed(2)}
        </span>
      </div>

      {/* ── Checkbox guardar en inventario (SIEMPRE visible) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer',
          width: 22, height: 22 }} title="Guardar en inventario">
          <input
            type="checkbox"
            checked={fila.guardarEnInventario || false}
            onChange={e => actualizarFila(fila._id, { guardarEnInventario: e.target.checked })}
            style={{ display: 'none' }}
          />
          <div style={{
            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
            border: `2px solid ${fila.guardarEnInventario ? D.teal : '#d1d5db'}`,
            background: fila.guardarEnInventario ? D.teal : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}>
            {fila.guardarEnInventario && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="#0A0C10" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
        </label>
      </div>

      {/* ── Columna Vincular (solo modo XML) ── */}
      {modoXML && (
        <div style={{ position: 'relative' }}>
          {vinculacionXML ? (
            // Ya vinculado — mostrar chip con X para desvincular
            <div style={{ display: 'flex', alignItems: 'center', gap: 5,
              background: D.tealBg, border: `1px solid ${D.tealBdr}`,
              borderRadius: 7, padding: '5px 8px', cursor: 'pointer' }}
              onClick={() => onVincularXML(null)}>
              <span style={{ color: D.teal, fontSize: 11, fontWeight: 700,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                {vinculacionXML.codigo}
              </span>
              <span style={{ color: D.teal, fontSize: 10, flexShrink: 0 }}>{Ico.x}</span>
            </div>
          ) : (
            // Sin vincular: botón que abre dropdown con búsqueda por palabras
            <div>
              <button onClick={() => { setMostrarSugsXML(v => !v); if (!mostrarSugsXML) setBusqXML(''); }}
                style={{ width: '100%', background: sugerenciasXML.length > 0 ? D.goldBg : '#f9fafb',
                  border: `1px solid ${sugerenciasXML.length > 0 ? D.goldBdr : '#e5e7eb'}`,
                  borderRadius: 7, padding: '5px 8px', fontSize: 11,
                  color: sugerenciasXML.length > 0 ? D.gold : '#9ca3af',
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
                {sugerenciasXML.length > 0
                  ? <>{Ico.search} {sugerenciasXML.length} similares</>
                  : <span style={{ fontSize: 10 }}>Vincular...</span>}
              </button>

              {mostrarSugsXML && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 3px)', right: 0, zIndex: 150,
                  background: '#ffffff', border: '1px solid #e5e7eb',
                  borderRadius: 10, width: 280,
                  boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                }}>
                  {/* Buscador manual */}
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 8, top: '50%',
                        transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
                        {Ico.search}
                      </span>
                      <input
                        autoFocus
                        value={busqXML}
                        onChange={e => onBusqXMLChange(e.target.value)}
                        placeholder="Buscar producto..."
                        style={{ ...inp, paddingLeft: 28, padding: '6px 8px 6px 26px',
                          fontSize: 12, background: '#f9fafb', borderRadius: 7 }}
                        onKeyDown={e => { if (e.key === 'Escape') setMostrarSugsXML(false); }}
                      />
                    </div>
                  </div>

                  {/* Lista de resultados */}
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {/* Sugerencias automáticas (del XML) si no hay búsqueda manual */}
                    {!busqXML && sugerenciasXML.length > 0 && (
                      <>
                        <div style={{ padding: '6px 12px', fontSize: 9.5, fontWeight: 700,
                          color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase' }}>
                          Sugerencias automáticas
                        </div>
                        {sugerenciasXML.map(p => (
                          <div key={p.id} className="sugg-row"
                            onMouseDown={() => { onVincularXML(p); setMostrarSugsXML(false); }}
                            style={{ padding: '8px 12px', cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ color: '#111827', fontSize: 12, fontWeight: 600,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.descripcion.length > 34 ? p.descripcion.slice(0, 32) + '..' : p.descripcion}
                            </span>
                            <span style={{ color: '#9ca3af', fontSize: 10.5, fontFamily: 'monospace' }}>
                              {p.codigo} · Stock: {parseFloat(p.stock)}
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Resultados de búsqueda manual */}
                    {busqXML && (
                      buscandoXML ? (
                        <div style={{ padding: '14px', textAlign: 'center', color: '#9ca3af',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          {Ico.spin} Buscando...
                        </div>
                      ) : resBusqXML.length > 0 ? (
                        <>
                          <div style={{ padding: '6px 12px', fontSize: 9.5, fontWeight: 700,
                            color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase' }}>
                            Resultados
                          </div>
                          {resBusqXML.map(p => (
                            <div key={p.id} className="sugg-row"
                              onMouseDown={() => { onVincularXML(p); setMostrarSugsXML(false); setBusqXML(''); }}
                              style={{ padding: '8px 12px', cursor: 'pointer',
                                borderBottom: '1px solid #f3f4f6',
                                display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ color: '#111827', fontSize: 12, fontWeight: 600,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.descripcion.length > 34 ? p.descripcion.slice(0, 32) + '..' : p.descripcion}
                              </span>
                              <span style={{ color: '#9ca3af', fontSize: 10.5, fontFamily: 'monospace' }}>
                                {p.codigo} · Stock: {parseFloat(p.stock)}
                              </span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div style={{ padding: '14px 12px', textAlign: 'center',
                          color: '#9ca3af', fontSize: 12 }}>
                          Sin resultados
                        </div>
                      )
                    )}

                    {!busqXML && sugerenciasXML.length === 0 && (
                      <div style={{ padding: '14px 12px', textAlign: 'center',
                        color: '#9ca3af', fontSize: 12 }}>
                        Escribe para buscar
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '6px 10px', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
                    <button onMouseDown={() => setMostrarSugsXML(false)}
                      style={{ background: 'none', border: 'none', color: '#9ca3af',
                        fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Eliminar */}
      <button className="del-btn" onClick={() => eliminarFila(fila._id)}
        disabled={!puedeEliminar}
        style={{ background: 'transparent', border: 'none', color: D.text3, cursor: puedeEliminar ? 'pointer' : 'not-allowed',
          opacity: puedeEliminar ? 1 : .25, padding: 6, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s' }}>
        {Ico.trash}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
function Historial({ esAdmin, onCargarEnNueva }) {
  const [compras, setCompras]           = useState([]);
  const [totalReg, setTotalReg]         = useState(0);
  const [page, setPage]                 = useState(1);
  const [buscar, setBuscar]             = useState('');
  const [fechaDesde, setFechaDesde]     = useState('');
  const [fechaHasta, setFechaHasta]     = useState('');
  const [cargando, setCargando]         = useState(true);
  const [modalVer, setModalVer]         = useState(false);
  const [compraSeleccionada, setCS]     = useState(null);
  const [detalle, setDetalle]           = useState([]);
  const [cargandoDetalle, setCargDet]   = useState(false);

  // ── Estado modal edición ──────────────────────────────────
  const [modalEditar, setModalEditar]   = useState(false);
  const [editProveedor, setEditProveedor] = useState('');
  const [editRuc, setEditRuc]           = useState('');
  const [editFecha, setEditFecha]       = useState('');
  const [editFacturaRef, setEditFacturaRef] = useState('');
  const [editNotas, setEditNotas]       = useState('');
  const [editFilas, setEditFilas]       = useState([]);
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  const LIMIT = 20;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (buscar)     params.append('buscar', buscar);
      if (fechaDesde) params.append('fecha_desde', fechaDesde);
      if (fechaHasta) params.append('fecha_hasta', fechaHasta);
      const { data } = await api.get(`/compras?${params}`);
      setCompras(data.data);
      setTotalReg(data.total);
    } catch { console.error('Error al cargar compras'); }
    finally { setCargando(false); }
  }, [page, buscar, fechaDesde, fechaHasta]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(1); }, [buscar, fechaDesde, fechaHasta]);

  const abrirDetalle = async (compra) => {
    setCS(compra); setCargDet(true); setModalVer(true);
    try {
      const { data } = await api.get(`/compras/${compra.id}`);
      setDetalle(data.detalle || []);
    } catch { setDetalle([]); }
    finally { setCargDet(false); }
  };

  const eliminar = async (compra) => {
    if (!window.confirm(`¿Eliminar compra ${compra.numero}? Esto revertirá el stock.`)) return;
    try {
      await api.delete(`/compras/${compra.id}`);
      cargar();
    } catch (err) { alert(err.response?.data?.error || 'Error al eliminar'); }
  };

  // ── Edición ───────────────────────────────────────────────
  const abrirEditar = () => {
    if (!compraSeleccionada) return;
    setEditProveedor(compraSeleccionada.proveedor_nombre || '');
    setEditRuc(compraSeleccionada.ruc_proveedor || '');
    setEditFecha(compraSeleccionada.fecha?.slice(0, 10) || '');
    setEditFacturaRef(compraSeleccionada.factura_ref || '');
    setEditNotas(compraSeleccionada.notas || '');
    setEditFilas(detalle.map(d => ({
      _id: Math.random(),
      producto_id: d.producto_id || null,
      codigo: d.codigo || '',
      descripcion: d.descripcion || '',
      cantidad: parseFloat(d.cantidad),
      costo: parseFloat(d.costo),
      iva: parseFloat(d.iva || 0),
      subtotal: parseFloat(d.subtotal),
    })));
    setModalVer(false);
    setModalEditar(true);
  };

  const actualizarFilaEdit = (id, cambios) => {
    setEditFilas(prev => prev.map(f => {
      if (f._id !== id) return f;
      const n = { ...f, ...cambios };
      const cant = parseFloat(n.cantidad) || 0;
      const cost = parseFloat(n.costo)    || 0;
      const iva  = parseFloat(n.iva)       || 0;
      n.subtotal = cant * cost * (1 + iva / 100);
      return n;
    }));
  };

  const eliminarFilaEdit = (id) => {
    if (editFilas.length > 1) setEditFilas(prev => prev.filter(f => f._id !== id));
  };

  const agregarFilaEdit = () => setEditFilas(prev => [...prev, filaVacia()]);

  const verEnNueva = () => {
    onCargarEnNueva?.({
      id:              compraSeleccionada.id,
      numero:          compraSeleccionada.numero,
      proveedor_nombre: editProveedor,
      ruc_proveedor:   editRuc,
      fecha:           editFecha,
      factura_ref:     editFacturaRef,
      notas:           editNotas,
      detalle:         editFilas,
    });
    setModalEditar(false);
  };

  const guardarEdicion = async () => {
    const validas = editFilas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0);
    if (validas.length === 0) { alert('Agrega al menos un producto'); return; }
    if (!editProveedor.trim()) { alert('Ingresa el nombre del proveedor'); return; }
    setGuardandoEdit(true);
    try {
      await api.put(`/compras/${compraSeleccionada.id}`, {
        proveedor_nombre: editProveedor.trim(),
        ruc_proveedor:   editRuc.trim(),
        fecha:           editFecha,
        factura_ref:     editFacturaRef,
        notas:           editNotas,
        detalle: validas.map(f => ({
          producto_id: f.producto_id || null,
          descripcion: f.descripcion,
          cantidad:    parseFloat(f.cantidad),
          costo:       parseFloat(f.costo),
          iva:         parseFloat(f.iva) || 0,
        })),
      });
      setModalEditar(false);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar compra');
    } finally { setGuardandoEdit(false); }
  };

  const totalPags = Math.ceil(totalReg / LIMIT);

  const inpLight = {
    background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8,
    padding: '9px 13px', color: '#111827', fontSize: 13.5, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  };

  const editSubtotalBase = editFilas.reduce((s, f) => s + (parseFloat(f.cantidad)||0)*(parseFloat(f.costo)||0), 0);
  const editTotalIva     = editFilas.reduce((s, f) => {
    const b = (parseFloat(f.cantidad)||0)*(parseFloat(f.costo)||0);
    return s + b*((parseFloat(f.iva)||0)/100);
  }, 0);
  const editTotal = editSubtotalBase + editTotalIva;
  const celdaInp = {
    width: '100%', background: '#ffffff', border: '1px solid #e5e7eb',
    borderRadius: 7, padding: '7px 10px', color: '#111827',
    fontSize: 12.5, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box' }}>

      {/* Buscador + filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Búsqueda texto */}
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%',
            transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
            {Ico.search}
          </span>
          <input type="text" placeholder="Buscar por proveedor, número o factura..."
            value={buscar} onChange={e => setBuscar(e.target.value)}
            style={{ ...inpLight, width: '100%', paddingLeft: 38 }} />
        </div>

        {/* Fecha desde */}
        <div style={{ position: 'relative', width: 150 }}>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
            style={{ ...inpLight, width: '100%', color: fechaDesde ? '#111827' : 'transparent',
              WebkitTextFillColor: fechaDesde ? '#111827' : 'transparent' }} />
          {!fechaDesde && (
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
              color: '#9ca3af', fontSize: 13.5, pointerEvents: 'none', userSelect: 'none',
              background: '#ffffff', zIndex: 1 }}>Desde</span>
          )}
        </div>

        {/* Fecha hasta */}
        <div style={{ position: 'relative', width: 150 }}>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
            style={{ ...inpLight, width: '100%', color: fechaHasta ? '#111827' : 'transparent',
              WebkitTextFillColor: fechaHasta ? '#111827' : 'transparent' }} />
          {!fechaHasta && (
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
              color: '#9ca3af', fontSize: 13.5, pointerEvents: 'none', userSelect: 'none',
              background: '#ffffff', zIndex: 1 }}>Hasta</span>
          )}
        </div>

        {/* Limpiar fechas */}
        {(fechaDesde || fechaHasta) && (
          <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
            style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '8px 12px', cursor: 'pointer', fontSize: 12.5,
              color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'inherit' }}>
            {Ico.x} Fechas
          </button>
        )}

        {/* Contador */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb',
          borderRadius: 8, padding: '9px 16px', fontSize: 13, color: '#374151',
          fontWeight: 600, flexShrink: 0 }}>
          {totalReg} compra{totalReg !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabla historial */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16,
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {[
                { h: 'Número',       align: 'left'   },
                { h: 'Proveedor',    align: 'left'   },
                { h: 'RUC',          align: 'left'   },
                { h: 'Factura Ref.', align: 'left'   },
                { h: 'Fecha',        align: 'left'   },
                { h: 'Total',        align: 'right'  },
                { h: 'Acciones',     align: 'center' },
              ].map(({ h, align }) => (
                <th key={h} style={{ padding: '12px 18px', color: '#9ca3af', fontWeight: 700,
                  fontSize: 10.5, letterSpacing: 1.1, textAlign: align,
                  borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} style={{ padding: 56, textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  {Ico.spin} Cargando compras...
                </div>
              </td></tr>
            ) : compras.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 56, textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: '#d1d5db' }}>{Ico.pkg}</div>
                  <span style={{ color: '#9ca3af', fontSize: 14 }}>No hay compras registradas</span>
                </div>
              </td></tr>
            ) : compras.map((c) => (
              <tr key={c.id} className="hist-row"
                style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '14px 18px', background: '#ffffff', transition: 'background .1s' }}>
                  <span style={{ color: D.gold, fontFamily: 'monospace', fontWeight: 700, fontSize: 12.5 }}>
                    {c.numero}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', background: '#ffffff', color: '#111827', fontWeight: 500, transition: 'background .1s' }}>
                  {c.proveedor_nombre}
                </td>
                <td style={{ padding: '14px 18px', background: '#ffffff', color: '#6b7280', fontFamily: 'monospace', fontSize: 12, transition: 'background .1s' }}>
                  {c.ruc_proveedor || '—'}
                </td>
                <td style={{ padding: '14px 18px', background: '#ffffff', color: '#6b7280', fontFamily: 'monospace', fontSize: 12, transition: 'background .1s' }}>
                  {c.factura_ref || '—'}
                </td>
                <td style={{ padding: '14px 18px', background: '#ffffff', color: '#6b7280', fontSize: 13, transition: 'background .1s' }}>
                  {c.fecha?.slice(0, 10)}
                </td>
                <td style={{ padding: '14px 18px', background: '#ffffff', textAlign: 'right', transition: 'background .1s' }}>
                  <span style={{ color: D.gold, fontWeight: 700, fontSize: 14 }}>
                    ${parseFloat(c.total).toFixed(2)}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', background: '#ffffff', textAlign: 'center', transition: 'background .1s' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <MiniBtn color={D.teal} bg={D.tealBg} onClick={() => abrirDetalle(c)}>
                      {Ico.eye} Ver
                    </MiniBtn>
                    {esAdmin && (
                      <MiniBtn color={D.red} bg={D.redBg} onClick={() => eliminar(c)}>
                        {Ico.trash} Eliminar
                      </MiniBtn>
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 22 }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            style={{ background: '#ffffff', border: '1px solid #e5e7eb', color: '#374151',
              borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600,
              cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? .4 : 1,
              fontFamily: 'inherit' }}>
            ← Anterior
          </button>
          <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
            Página <strong style={{ color: '#111827' }}>{page}</strong> de {totalPags}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPags, p+1))} disabled={page === totalPags}
            style={{ background: '#ffffff', border: '1px solid #e5e7eb', color: '#374151',
              borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600,
              cursor: page === totalPags ? 'not-allowed' : 'pointer', opacity: page === totalPags ? .4 : 1,
              fontFamily: 'inherit' }}>
            Siguiente →
          </button>
        </div>
      )}

      {/* ── Modal Ver ── */}
      {modalVer && compraSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, padding: 20, backdropFilter: 'blur(3px)', animation: 'fadeIn .15s' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb',
            borderRadius: 20, padding: '32px 36px', width: '100%', maxWidth: 760,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,.18)', animation: 'slideUp .2s ease' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 26 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af',
                  letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
                  Detalle de compra
                </div>
                <h2 style={{ color: D.gold, fontSize: 22, fontWeight: 800,
                  margin: 0, fontFamily: 'monospace', letterSpacing: -.5 }}>
                  {compraSeleccionada.numero}
                </h2>
              </div>
              <button onClick={() => setModalVer(false)}
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280',
                  cursor: 'pointer', borderRadius: 9, width: 34, height: 34,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {Ico.x}
              </button>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14,
              marginBottom: 24, padding: '18px 20px',
              background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              {[
                { label: 'Proveedor', valor: compraSeleccionada.proveedor_nombre, mono: false },
                { label: 'RUC',       valor: compraSeleccionada.ruc_proveedor || '—', mono: true },
                { label: 'Factura',   valor: compraSeleccionada.factura_ref || '—', mono: true },
                { label: 'Fecha',     valor: compraSeleccionada.fecha?.slice(0, 10), mono: false },
              ].map(({ label, valor, mono }) => (
                <div key={label}>
                  <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700,
                    letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 5 }}>
                    {label}
                  </div>
                  <div style={{ color: '#111827', fontSize: 13.5, fontWeight: 600,
                    fontFamily: mono ? 'monospace' : 'inherit' }}>
                    {valor}
                  </div>
                </div>
              ))}
            </div>

            {/* Detalle items */}
            {cargandoDetalle ? (
              <div style={{ padding: 36, textAlign: 'center', color: '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {Ico.spin} Cargando...
              </div>
            ) : (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Descripción', 'Cant.', 'Costo unit.', 'IVA %', 'Subtotal'].map((h, i) => (
                        <th key={h} style={{ padding: '10px 16px', color: '#9ca3af', fontSize: 10.5,
                          letterSpacing: 1, fontWeight: 700, textAlign: i === 0 ? 'left' : 'right',
                          borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '11px 16px', color: '#374151' }}>{d.descripcion}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', color: '#374151' }}>{parseFloat(d.cantidad)}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', color: '#374151' }}>${parseFloat(d.costo).toFixed(2)}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', color: '#9ca3af' }}>{parseFloat(d.iva||0)}%</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', color: D.teal, fontWeight: 700 }}>
                          ${parseFloat(d.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totales */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginBottom: 28 }}>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 12, padding: '18px 22px', minWidth: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>Subtotal</span>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                    ${parseFloat(compraSeleccionada.subtotal).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>IVA</span>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                    ${parseFloat(compraSeleccionada.total_iva).toFixed(2)}
                  </span>
                </div>
                <div style={{ background: D.goldBg, border: `1px solid ${D.goldBdr}`,
                  borderRadius: 10, padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: D.gold,
                    letterSpacing: 1, textTransform: 'uppercase' }}>Total</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: D.gold, letterSpacing: -.5 }}>
                    ${parseFloat(compraSeleccionada.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones del modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              {/* Botón Editar (izquierda) */}
              {esAdmin && (
                <button onClick={abrirEditar}
                  style={{ display: 'flex', alignItems: 'center', gap: 7,
                    background: D.goldBg, border: `1px solid ${D.goldBdr}`,
                    color: D.gold, borderRadius: 10, padding: '10px 20px',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = D.gold; e.currentTarget.style.color = '#0A0C10'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = D.goldBg; e.currentTarget.style.color = D.gold; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar compra
                </button>
              )}
              {/* Cerrar (derecha) */}
              <button onClick={() => setModalVer(false)}
                style={{ background: 'transparent', border: '1px solid #e5e7eb', color: '#6b7280',
                  borderRadius: 10, padding: '10px 24px', fontWeight: 600, fontSize: 13.5,
                  cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar ───────────────────────────────────────── */}
      {modalEditar && compraSeleccionada && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 60, padding: '24px 20px', backdropFilter: 'blur(3px)',
            animation: 'fadeIn .15s', overflowY: 'auto' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb',
              borderRadius: 20, padding: '32px 36px', width: '100%', maxWidth: 820,
              boxShadow: '0 20px 60px rgba(0,0,0,.18)', animation: 'slideUp .2s ease',
              margin: 'auto' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 26 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af',
                    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
                    Editar compra
                  </div>
                  <h2 style={{ color: D.gold, fontSize: 22, fontWeight: 800,
                    margin: 0, fontFamily: 'monospace', letterSpacing: -.5 }}>
                    {compraSeleccionada.numero}
                  </h2>
                </div>
                <button onClick={() => setModalEditar(false)}
                  style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280',
                    cursor: 'pointer', borderRadius: 9, width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {Ico.x}
                </button>
              </div>

              {/* Campos cabecera */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                <Field label="Proveedor" required>
                  <input value={editProveedor} onChange={e => setEditProveedor(e.target.value)}
                    placeholder="Nombre del proveedor" style={inp} />
                </Field>
                <Field label="RUC / Cédula">
                  <input value={editRuc} onChange={e => setEditRuc(e.target.value)}
                    placeholder="1792072018001" style={{ ...inp, fontFamily: 'monospace', fontSize: 12.5 }} />
                </Field>
                <Field label="Fecha">
                  <input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} style={inp} />
                </Field>
                <Field label="N° Factura">
                  <input value={editFacturaRef} onChange={e => setEditFacturaRef(e.target.value)}
                    placeholder="001-001-000000001" style={{ ...inp, fontFamily: 'monospace', fontSize: 12.5 }} />
                </Field>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Notas">
                    <input value={editNotas} onChange={e => setEditNotas(e.target.value)}
                      placeholder="Observaciones opcionales..." style={inp} />
                  </Field>
                </div>
              </div>

              {/* Tabla de ítems editable */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                {/* Encabezado de columnas */}
                <div style={{ display: 'grid',
                  gridTemplateColumns: '24px 1fr 80px 120px 70px 100px 34px',
                  gap: 8, padding: '10px 12px',
                  borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  {['#','Descripción','Cant.','Costo','IVA %','Subtotal',''].map((h, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af',
                      letterSpacing: 1.1, textTransform: 'uppercase',
                      textAlign: i >= 2 && i <= 5 ? 'right' : 'left' }}>
                      {h}
                    </div>
                  ))}
                </div>
                {/* Filas */}
                <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {editFilas.map((f, idx) => (
                    <div key={f._id} className="item-card"
                      style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 9,
                        display: 'grid', gridTemplateColumns: '24px 1fr 80px 120px 70px 100px 34px',
                        gap: 8, alignItems: 'center', padding: '7px 8px' }}>
                      <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>{idx + 1}</div>
                      <input value={f.descripcion}
                        onChange={e => actualizarFilaEdit(f._id, { descripcion: e.target.value })}
                        placeholder="Descripción" style={{ ...celdaInp, minWidth: 0 }} />
                      <input type="number" value={f.cantidad} min="0.01" step="0.01"
                        onChange={e => actualizarFilaEdit(f._id, { cantidad: e.target.value })}
                        style={{ ...celdaInp, textAlign: 'center' }} />
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: 8, color: '#9ca3af', fontSize: 12, pointerEvents: 'none' }}>$</span>
                        <input type="number" value={f.costo} min="0" step="0.01"
                          onChange={e => actualizarFilaEdit(f._id, { costo: e.target.value })}
                          style={{ ...celdaInp, textAlign: 'right', paddingLeft: 18 }} />
                      </div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input type="number" value={f.iva} min="0" max="100"
                          onChange={e => actualizarFilaEdit(f._id, { iva: e.target.value })}
                          style={{ ...celdaInp, textAlign: 'center', paddingRight: 16 }} />
                        <span style={{ position: 'absolute', right: 7, color: '#9ca3af', fontSize: 11, pointerEvents: 'none' }}>%</span>
                      </div>
                      <div style={{ textAlign: 'right', paddingRight: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: D.teal }}>
                          ${parseFloat(f.subtotal||0).toFixed(2)}
                        </span>
                      </div>
                      <button className="del-btn" onClick={() => eliminarFilaEdit(f._id)}
                        disabled={editFilas.length <= 1}
                        style={{ background: 'transparent', border: 'none', color: '#9ca3af',
                          cursor: editFilas.length > 1 ? 'pointer' : 'not-allowed',
                          opacity: editFilas.length > 1 ? 1 : .25, padding: 6, borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {Ico.trash}
                      </button>
                    </div>
                  ))}
                </div>
                {/* Agregar fila */}
                <div style={{ padding: '6px 12px 12px' }}>
                  <button onClick={agregarFilaEdit} className="ghost-btn"
                    style={{ width: '100%', background: 'transparent',
                      border: '1.5px dashed #e5e7eb', color: '#9ca3af',
                      borderRadius: 9, padding: '9px', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    {Ico.plus} Agregar producto
                  </button>
                </div>
              </div>

              {/* Totales */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb',
                  borderRadius: 12, padding: '16px 20px', minWidth: 220 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>Subtotal</span>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>${editSubtotalBase.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>IVA</span>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>${editTotalIva.toFixed(2)}</span>
                  </div>
                  <div style={{ background: D.goldBg, border: `1px solid ${D.goldBdr}`,
                    borderRadius: 10, padding: '10px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: D.gold,
                      letterSpacing: 1, textTransform: 'uppercase' }}>Total</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: D.gold, letterSpacing: -.5 }}>
                      ${editTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                {/* Ver en nueva compra (izquierda) */}
                <button onClick={verEnNueva}
                  style={{ display: 'flex', alignItems: 'center', gap: 7,
                    background: 'transparent', border: '1px solid #e5e7eb', color: '#6b7280',
                    borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = D.gold; e.currentTarget.style.color = D.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}>
                  {Ico.new} Ver en nueva compra
                </button>
                {/* Cancelar + Guardar (derecha) */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setModalEditar(false)}
                    style={{ background: 'transparent', border: '1px solid #e5e7eb', color: '#6b7280',
                      borderRadius: 10, padding: '10px 22px', fontWeight: 600, fontSize: 13.5,
                      cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancelar
                  </button>
                  <button onClick={guardarEdicion} disabled={guardandoEdit}
                    style={{ background: D.gold, border: 'none', color: '#0A0C10',
                      borderRadius: 10, padding: '10px 26px', fontWeight: 800, fontSize: 14,
                      cursor: guardandoEdit ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      opacity: guardandoEdit ? .6 : 1,
                      display: 'flex', alignItems: 'center', gap: 8 }}>
                    {guardandoEdit ? <>{Ico.spin} Guardando...</> : <>{Ico.save} Guardar cambios</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 700, color: D.text3, letterSpacing: .8,
      textTransform: 'uppercase', marginBottom: 7 }}>
      {label}{required && <span style={{ color: D.gold, marginLeft: 2 }}>*</span>}
    </div>
    {children}
  </div>
);

const ResumenLine = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
    <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
    <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>{value}</span>
  </div>
);

const MiniBtn = ({ color, bg, onClick, children }) => (
  <button onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: 5,
      background: bg, color, border: `1px solid ${color}33`,
      borderRadius: 7, padding: '5px 12px', fontWeight: 600, fontSize: 12,
      cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity .15s' }}
    onMouseEnter={e => e.currentTarget.style.opacity = '.75'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
    {children}
  </button>
);