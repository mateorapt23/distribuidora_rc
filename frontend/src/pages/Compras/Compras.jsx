import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';

const C = {
  bgBase: '#f4f5fb', bgCard: '#ffffff', bgDeep: '#f9fafb',
  border: '#e5e7eb', textPrimary: '#111827', textSec: '#374151',
  textDim: '#9ca3af', amarillo: '#f59e0b', azul: '#3b82f6',
  verde: '#10b981', rojo: '#ef4444', grid: '#f3f4f6',
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
});

const IcoEye    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoTrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
const IcoSave   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoClear  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
const IcoSRI    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;

export default function Compras() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';

  const [seccion, setSeccion] = useState('nueva');
  const [refrescar, setRefrescar] = useState(0);

  if (!esAdmin) return (
    <div style={{ background: C.bgBase, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '52px 44px', maxWidth: 440, width: '100%',
        textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: '1px solid #e5e7eb' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          boxShadow: '0 4px 16px rgba(245,158,11,0.20)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, marginBottom: 10, letterSpacing: -0.3 }}>
          Sin acceso a Compras
        </div>
        <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7, marginBottom: 6 }}>
          No tienes permisos para registrar ni gestionar <strong>compras a proveedores</strong>.
        </div>
        <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.7, marginBottom: 28 }}>
          Esta sección está disponible únicamente para administradores del sistema.
        </div>
        <div style={{ padding: '14px 18px', background: C.bgBase, borderRadius: 12,
          border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
          <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <span style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.6 }}>
            Si necesitas registrar una compra, comunícate con el administrador del sistema.
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bgBase, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: '0 28px', height: 80, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
            Compras
          </div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>
            Registro de compras a proveedores
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`,
        background: '#fff', padding: '0 28px' }}>
        {[
          { key: 'nueva',     label: 'Nueva Compra',
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
          { key: 'historial', label: 'Historial',
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
        ].map(tab => (
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

      {seccion === 'nueva'
        ? <NuevaCompra onGuardado={() => { setRefrescar(r => r + 1); setSeccion('historial'); }} />
        : <Historial key={refrescar} esAdmin={esAdmin} />
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════
function ModalSRI({ onImportar, onCerrar }) {
  const [archivo, setArchivo]   = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');
  const inputRef                = useRef(null);

  const onSeleccionarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('El archivo debe tener extensión .xml');
      return;
    }
    setError('');
    setArchivo(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('El archivo debe tener extensión .xml');
      return;
    }
    setError('');
    setArchivo(file);
  };

  const parsear = async () => {
    if (!archivo) { setError('Selecciona un archivo XML primero.'); return; }
    setError('');
    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      const { data } = await api.post('/compras/sri/xml', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onImportar(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al leer el XML. Verifica que sea una factura electrónica válida.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 520,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: `1px solid ${C.border}` }}>

        {/* Header del modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IcoSRI />
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, color: C.textPrimary }}>
                Importar XML de factura
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.textDim, margin: 0, lineHeight: 1.6 }}>
              Sube el archivo <strong>.xml</strong> que te envió tu proveedor junto con la factura electrónica.
            </p>
          </div>
          <button onClick={onCerrar}
            style={{ background: '#f3f4f6', border: 'none', color: '#6b7280', cursor: 'pointer',
              borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0, marginLeft: 16 }}>✕</button>
        </div>

        {/* Zona de drop */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          style={{
            border: `2px dashed ${archivo ? C.verde : C.border}`,
            borderRadius: 12, padding: '28px 20px', marginBottom: 16,
            textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
            background: archivo ? '#f0fdf4' : C.bgDeep,
          }}
          onMouseEnter={e => { if (!archivo) e.currentTarget.style.borderColor = C.azul; }}
          onMouseLeave={e => { if (!archivo) e.currentTarget.style.borderColor = C.border; }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xml"
            style={{ display: 'none' }}
            onChange={onSeleccionarArchivo}
          />
          {archivo ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.verde }}>{archivo.name}</span>
              <span style={{ fontSize: 12, color: C.textDim }}>
                {(archivo.size / 1024).toFixed(1)} KB · Click para cambiar
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>📂</span>
              <span style={{ fontSize: 14, color: C.textSec, fontWeight: 600 }}>
                Arrastra el XML aquí o haz click para seleccionarlo
              </span>
              <span style={{ fontSize: 12, color: C.textDim }}>Solo archivos .xml</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ color: C.rojo, fontSize: 16, flexShrink: 0 }}>⚠</span>
            <span style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* Info */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
          padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
            El proveedor está <strong>obligado por ley</strong> a enviarte el XML con cada factura electrónica,
            generalmente por correo junto con el RIDE (PDF). Ese mismo archivo es el que debes subir aquí.
          </span>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCerrar}
            style={{ background: '#fff', border: `1px solid ${C.border}`, color: C.textSec,
              borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={parsear} disabled={cargando || !archivo}
            style={{ background: C.azul, border: 'none', color: '#fff', borderRadius: 10,
              padding: '10px 24px', fontWeight: 700, fontSize: 13,
              cursor: (cargando || !archivo) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: (cargando || !archivo) ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
            {cargando ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Procesando...
              </>
            ) : (
              <><IcoSRI /> Importar XML</>
            )}
          </button>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
function NuevaCompra({ onGuardado }) {
  const [proveedor, setProveedor]   = useState('');
  const [ruc, setRuc]               = useState('');
  const [fecha, setFecha]           = useState(new Date().toISOString().split('T')[0]);
  const [facturaRef, setFacturaRef] = useState('');
  const [notas, setNotas]           = useState('');
  const [filas, setFilas]           = useState([filaVacia()]);
  const [guardando, setGuardando]   = useState(false);
  const [modalSRI, setModalSRI]     = useState(false);
  const [importadoSRI, setImportadoSRI] = useState(false);

  const [sugerencias, setSugerencias] = useState([]);
  const [filaActiva, setFilaActiva]   = useState(null);
  const autocompleteRef = useRef(null);
  const busquedaTimeout = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setSugerencias([]);
        setFilaActiva(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const buscarProductos = useCallback(async (texto, filaId) => {
    if (!texto || texto.length < 2) { setSugerencias([]); return; }
    try {
      const { data } = await api.get(`/productos?buscar=${encodeURIComponent(texto)}&limit=8`);
      setSugerencias(data.data || []);
      setFilaActiva(filaId);
    } catch { setSugerencias([]); }
  }, []);

  const onCambioCodigo = (filaId, valor) => {
    actualizarFila(filaId, { codigo: valor, producto_id: null });
    clearTimeout(busquedaTimeout.current);
    busquedaTimeout.current = setTimeout(() => buscarProductos(valor, filaId), 250);
  };

  const onCambioDescripcion = (filaId, valor) => {
    actualizarFila(filaId, { descripcion: valor, producto_id: null });
    clearTimeout(busquedaTimeout.current);
    busquedaTimeout.current = setTimeout(() => buscarProductos(valor, filaId), 250);
  };

  const seleccionarProducto = (filaId, producto) => {
    actualizarFila(filaId, {
      producto_id: producto.id,
      codigo:      producto.codigo,
      descripcion: producto.descripcion,
      costo:       parseFloat(producto.pvp1) || 0,
      iva:         parseFloat(producto.iva)  || 0,
    }, true);
    setSugerencias([]);
    setFilaActiva(null);
  };

  const actualizarFila = (filaId, cambios, recalcular = false) => {
    setFilas(prev => prev.map(f => {
      if (f._id !== filaId) return f;
      const nueva = { ...f, ...cambios };
      if (recalcular || cambios.cantidad !== undefined || cambios.costo !== undefined || cambios.iva !== undefined) {
        const cant = parseFloat(nueva.cantidad) || 0;
        const cost = parseFloat(nueva.costo)    || 0;
        const iva  = parseFloat(nueva.iva)       || 0;
        nueva.subtotal = cant * cost * (1 + iva / 100);
      }
      return nueva;
    }));
  };

  // ── Importar desde SRI ───────────────────────────────────
  const handleImportarSRI = (datos) => {
    // Pre-llenar cabecera
    if (datos.proveedor)   setProveedor(datos.proveedor);
    if (datos.ruc)         setRuc(datos.ruc);
    if (datos.fecha)       setFecha(datos.fecha);
    if (datos.factura_ref) setFacturaRef(datos.factura_ref);

    // Pre-llenar filas con los productos de la factura
    if (datos.detalle && datos.detalle.length > 0) {
      const nuevasFilas = datos.detalle.map(item => {
        const cant = parseFloat(item.cantidad) || 1;
        const cost = parseFloat(item.costo)    || 0;
        const iva  = parseFloat(item.iva)       || 0;
        return {
          _id:         Math.random(),
          producto_id: null,
          codigo:      item.codigo || '',
          descripcion: item.descripcion || '',
          cantidad:    cant,
          costo:       cost,
          iva:         iva,
          subtotal:    cant * cost * (1 + iva / 100),
        };
      });
      setFilas(nuevasFilas);
    }

    setImportadoSRI(true);
    setModalSRI(false);
  };

  const agregarFila = () => setFilas(prev => [...prev, filaVacia()]);
  const eliminarFila = (id) => { if (filas.length > 1) setFilas(prev => prev.filter(f => f._id !== id)); };
  const limpiar = () => {
    setFilas([filaVacia()]);
    setProveedor(''); setRuc(''); setFecha(new Date().toISOString().split('T')[0]);
    setFacturaRef(''); setNotas('');
    setImportadoSRI(false);
  };

  const subtotalBase = filas.reduce((s, f) => s + (parseFloat(f.cantidad) || 0) * (parseFloat(f.costo) || 0), 0);
  const totalIva     = filas.reduce((s, f) => {
    const base = (parseFloat(f.cantidad) || 0) * (parseFloat(f.costo) || 0);
    return s + base * ((parseFloat(f.iva) || 0) / 100);
  }, 0);
  const total = subtotalBase + totalIva;

  const guardar = async () => {
    const filasValidas = filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0);
    if (filasValidas.length === 0) { alert('Agrega al menos un producto'); return; }
    if (!proveedor.trim()) { alert('Ingresa el nombre del proveedor'); return; }
    setGuardando(true);
    try {
      await api.post('/compras', {
        proveedor_nombre: proveedor.trim(),
        ruc_proveedor: ruc.trim(),
        fecha, factura_ref: facturaRef, notas,
        detalle: filasValidas.map(f => ({
          producto_id: f.producto_id,
          descripcion: f.descripcion,
          cantidad:    parseFloat(f.cantidad),
          costo:       parseFloat(f.costo),
          iva:         parseFloat(f.iva) || 0,
        })),
      });
      limpiar();
      onGuardado();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar compra');
    } finally { setGuardando(false); }
  };

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Modal SRI */}
      {modalSRI && <ModalSRI onImportar={handleImportarSRI} onCerrar={() => setModalSRI(false)} />}

      {/* Banner importado desde XML */}
      {importadoSRI && (
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac',
          borderRadius: 12, padding: '10px 16px', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 13, color: '#14532d', fontWeight: 700 }}>XML importado correctamente</span>
              {proveedor && <span style={{ fontSize: 12, color: '#166534', marginLeft: 8 }}>· {proveedor}{ruc ? ` · RUC ${ruc}` : ''}</span>}
            </div>
          </div>
          <button onClick={() => setImportadoSRI(false)}
            style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer',
              fontSize: 18, lineHeight: 1, padding: 2 }}>✕</button>
        </div>
      )}

      {/* Botón importar SRI + Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => setModalSRI(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            border: 'none', color: '#fff', borderRadius: 10,
            padding: '10px 20px', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 10px rgba(59,130,246,0.35)', transition: 'all .15s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <IcoSRI />
          Importar XML del proveedor
        </button>
      </div>

      {/* Cabecera */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '20px 22px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: 1.2,
          textTransform: 'uppercase', marginBottom: 16 }}>Datos del proveedor</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 3, minWidth: 200 }}>
            <Label>Proveedor *</Label>
            <input value={proveedor} onChange={e => setProveedor(e.target.value)}
              placeholder="Nombre del proveedor" style={inputSt} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Label>RUC / Cédula</Label>
            <input value={ruc} onChange={e => setRuc(e.target.value)}
              placeholder="Ej. 1792072018001" style={{ ...inputSt, fontFamily: 'monospace', fontSize: 12 }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Label>Fecha</Label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputSt} />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <Label>Nº Factura / Ref.</Label>
            <input value={facturaRef} onChange={e => setFacturaRef(e.target.value)}
              placeholder="027-070-000086972" style={{ ...inputSt, fontFamily: 'monospace', fontSize: 12 }} />
          </div>
          <div style={{ flex: 2, minWidth: 200 }}>
            <Label>Notas</Label>
            <input value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Observaciones opcionales..." style={inputSt} />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: 'visible', marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '14px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Detalle de productos
          </span>
          <span style={{ fontSize: 12, color: C.textDim }}>
            {filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0).length} ítem(s)
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 10 }}>
          <thead>
            <tr style={{ background: C.bgDeep }}>
              {[
                { label: '#',          w: 36  },
                { label: 'Código',     w: 110 },
                { label: 'Descripción',w: null },
                { label: 'Cant.',      w: 80  },
                { label: 'Costo unit.',w: 110 },
                { label: 'IVA %',      w: 75  },
                { label: 'Subtotal',   w: 100 },
                { label: '',           w: 36  },
              ].map(({ label, w }) => (
                <th key={label} style={{ padding: '10px 12px', color: C.textDim, fontWeight: 700,
                  fontSize: 10, letterSpacing: 1.1, textAlign: label === 'Subtotal' ? 'right' : 'left',
                  borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase',
                  ...(w ? { width: w } : {}) }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, idx) => (
              <tr key={fila._id} style={{ borderBottom: `1px solid ${C.grid}` }}>
                <td style={{ padding: '7px 12px', color: C.textDim, fontSize: 11, width: 36, textAlign: 'center' }}>{idx + 1}</td>

                {/* Código */}
                <td style={{ padding: '6px 8px', position: 'relative', width: 120 }}>
                  <input value={fila.codigo}
                    onChange={e => onCambioCodigo(fila._id, e.target.value)}
                    placeholder="Código" style={{ ...celdaInputSt, width: '100%' }} />
                  {filaActiva === fila._id && sugerencias.length > 0 && (
                    <div ref={autocompleteRef} style={{
                      position: 'absolute', top: '100%', left: 0, zIndex: 100,
                      background: '#fff', border: `1px solid ${C.border}`,
                      borderRadius: 8, minWidth: 360, maxHeight: 220,
                      overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }}>
                      {sugerencias.map(p => (
                        <div key={p.id} onMouseDown={() => seleccionarProducto(fila._id, p)}
                          style={{ padding: '10px 14px', cursor: 'pointer',
                            borderBottom: `1px solid ${C.grid}`,
                            display: 'flex', justifyContent: 'space-between' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div>
                            <span style={{ color: C.textDim, fontSize: 11, fontFamily: 'monospace' }}>{p.codigo}</span>
                            <span style={{ color: C.textSec, fontSize: 13, marginLeft: 10 }}>
                              {p.descripcion.length > 35 ? p.descripcion.slice(0, 33) + '..' : p.descripcion}
                            </span>
                          </div>
                          <span style={{ color: C.verde, fontSize: 11 }}>Stock: {parseFloat(p.stock)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>

                {/* Descripción */}
                <td style={{ padding: '6px 8px', position: 'relative' }}>
                  <input value={fila.descripcion}
                    onChange={e => onCambioDescripcion(fila._id, e.target.value)}
                    placeholder="Descripción" style={{ ...celdaInputSt, width: '100%', minWidth: 200 }} />
                </td>

                <td style={{ padding: '6px 8px', width: 80 }}>
                  <input type="number" value={fila.cantidad} min="0.01" step="0.01"
                    onChange={e => actualizarFila(fila._id, { cantidad: e.target.value }, true)}
                    style={{ ...celdaInputSt, width: '100%', textAlign: 'center' }} />
                </td>
                <td style={{ padding: '6px 8px', width: 110 }}>
                  <input type="number" value={fila.costo} min="0" step="0.01"
                    onChange={e => actualizarFila(fila._id, { costo: e.target.value }, true)}
                    style={{ ...celdaInputSt, width: '100%', textAlign: 'right' }} />
                </td>
                <td style={{ padding: '6px 8px', width: 80 }}>
                  <input type="number" value={fila.iva} min="0" max="100"
                    onChange={e => actualizarFila(fila._id, { iva: e.target.value }, true)}
                    style={{ ...celdaInputSt, width: '100%', textAlign: 'center' }} />
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', width: 100, whiteSpace: 'nowrap' }}>
                  <span style={{ color: C.verde, fontWeight: 700, fontSize: 13 }}>
                    ${parseFloat(fila.subtotal).toFixed(2)}
                  </span>
                </td>
                <td style={{ padding: '6px 10px', width: 36 }}>
                  <button onClick={() => eliminarFila(fila._id)}
                    style={{ background: 'none', border: 'none', color: C.textDim,
                      cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 4 }}
                    onMouseEnter={e => e.currentTarget.style.color = C.rojo}
                    onMouseLeave={e => e.currentTarget.style.color = C.textDim}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.grid}` }}>
          <button onClick={agregarFila}
            style={{ background: 'none', border: `1px dashed ${C.border}`, color: C.textDim,
              borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13,
              fontFamily: 'inherit', width: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.verde; e.currentTarget.style.color = C.verde; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}>
            + Agregar fila
          </button>
        </div>
      </div>

      {/* Totales + Acciones */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>

        {/* Botones en columna — izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={limpiar}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
              border: `1px solid ${C.border}`, color: C.textDim, borderRadius: 10,
              padding: '11px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.rojo; e.currentTarget.style.color = C.rojo; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}>
            <IcoClear /> Limpiar todo
          </button>
          <button onClick={guardar} disabled={guardando}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.verde,
              border: 'none', color: '#fff', borderRadius: 10,
              padding: '11px 24px', fontWeight: 700, fontSize: 13,
              cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: guardando ? 0.65 : 1,
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)', transition: 'all .15s' }}
            onMouseEnter={e => { if (!guardando) e.currentTarget.style.background = '#059669'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.verde; }}>
            <IcoSave /> {guardando ? 'Guardando...' : 'Registrar Compra'}
          </button>
        </div>

        {/* Card totales — ocupa el resto */}
        <div style={{ flex: 1, background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 280 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim,
            letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 20 }}>
            Resumen de la compra
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: C.textDim, fontSize: 14 }}>Subtotal (sin IVA)</span>
              <span style={{ color: C.textSec, fontWeight: 600, fontSize: 15 }}>${subtotalBase.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: C.textDim, fontSize: 14 }}>IVA</span>
              <span style={{ color: C.textSec, fontWeight: 600, fontSize: 15 }}>${totalIva.toFixed(2)}</span>
            </div>
            <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
              <span style={{ color: C.textPrimary, fontWeight: 700, fontSize: 16 }}>TOTAL</span>
              <span style={{ color: C.verde, fontWeight: 800, fontSize: 32, letterSpacing: -1 }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
function Historial({ esAdmin }) {
  const [compras, setCompras]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [buscar, setBuscar]     = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalVer, setModalVer] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [detalle, setDetalle]   = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const LIMIT = 20;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (buscar) params.append('buscar', buscar);
      const { data } = await api.get(`/compras?${params}`);
      setCompras(data.data);
      setTotal(data.total);
    } catch { console.error('Error al cargar compras'); }
    finally { setCargando(false); }
  }, [page, buscar]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(1); }, [buscar]);

  const abrirDetalle = async (compra) => {
    setCompraSeleccionada(compra);
    setCargandoDetalle(true);
    setModalVer(true);
    try {
      const { data } = await api.get(`/compras/${compra.id}`);
      setDetalle(data.detalle || []);
    } catch { setDetalle([]); }
    finally { setCargandoDetalle(false); }
  };

  const eliminar = async (compra) => {
    if (!window.confirm(`¿Eliminar compra ${compra.numero}? Esto revertirá el stock.`)) return;
    try {
      await api.delete(`/compras/${compra.id}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const totalPags = Math.ceil(total / LIMIT);

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input type="text" placeholder="Buscar por proveedor, número o factura..."
          value={buscar} onChange={e => setBuscar(e.target.value)}
          style={{ flex: 1, ...inputSt }} />
        <span style={{ color: C.textDim, fontSize: 13 }}>{total} compras</span>
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: C.bgDeep }}>
              {['Número', 'Proveedor', 'RUC', 'Factura Ref.', 'Fecha', 'Total', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '14px 16px', color: C.textDim, fontWeight: 600,
                  fontSize: 11, letterSpacing: 1.2, textAlign: 'left',
                  borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>Cargando...</td></tr>
            ) : compras.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>No hay compras registradas</td></tr>
            ) : compras.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${C.grid}`,
                background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', color: C.azul, fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{c.numero}</td>
                <td style={{ padding: '12px 16px', color: C.textPrimary, fontWeight: 500 }}>{c.proveedor_nombre}</td>
                <td style={{ padding: '12px 16px', color: C.textDim, fontFamily: 'monospace', fontSize: 12 }}>{c.ruc_proveedor || '—'}</td>
                <td style={{ padding: '12px 16px', color: C.textDim, fontFamily: 'monospace', fontSize: 12 }}>{c.factura_ref || '—'}</td>
                <td style={{ padding: '12px 16px', color: C.textDim, fontSize: 13 }}>{c.fecha?.slice(0, 10)}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ background: '#f0fdf4', color: C.verde, fontWeight: 700, fontSize: 13, padding: '3px 10px', borderRadius: 6 }}>${parseFloat(c.total).toFixed(2)}</span></td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <BtnSm color={C.azul} onClick={() => abrirDetalle(c)} icon={<IcoEye />}>Ver</BtnSm>
                    {esAdmin && <BtnSm color={C.rojo} onClick={() => eliminar(c)} icon={<IcoTrash />}>Eliminar</BtnSm>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPags > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <BtnSm color={C.azul} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Ant.</BtnSm>
          <span style={{ color: C.textDim, fontSize: 13 }}>Página {page} de {totalPags}</span>
          <BtnSm color={C.azul} onClick={() => setPage(p => Math.min(totalPags, p + 1))} disabled={page === totalPags}>Sig. →</BtnSm>
        </div>
      )}

      {/* Modal Ver */}
      {modalVer && compraSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18,
            padding: 28, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: C.textPrimary, fontSize: 17, fontWeight: 700, margin: 0 }}>
                Compra — {compraSeleccionada.numero}
              </h2>
              <button onClick={() => setModalVer(false)}
                style={{ background: '#f3f4f6', border: 'none', color: '#6b7280', fontSize: 16,
                  cursor: 'pointer', borderRadius: 8, width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 16, marginBottom: 20, padding: '16px', background: C.bgDeep,
              borderRadius: 10, border: `1px solid ${C.border}` }}>
              {[
                { label: 'Proveedor',   valor: compraSeleccionada.proveedor_nombre, mono: false },
                { label: 'RUC',         valor: compraSeleccionada.ruc_proveedor || '—', mono: true },
                { label: 'Factura Ref', valor: compraSeleccionada.factura_ref || '—', mono: true },
                { label: 'Fecha',       valor: compraSeleccionada.fecha?.slice(0, 10), mono: false },
              ].map(({ label, valor, mono }) => (
                <div key={label}>
                  <div style={{ color: C.textDim, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                    textTransform: 'uppercase', marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: 600,
                    fontFamily: mono ? 'monospace' : 'inherit' }}>
                    {valor}
                  </div>
                </div>
              ))}
            </div>

            {cargandoDetalle ? (
              <div style={{ padding: 30, textAlign: 'center', color: C.textDim }}>Cargando...</div>
            ) : (
              <div style={{ background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Descripción', 'Cant.', 'Costo unit.', 'IVA %', 'Subtotal'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', color: C.textDim, fontSize: 10,
                          letterSpacing: 1.2, textAlign: h === 'Descripción' ? 'left' : 'right',
                          borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((d, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.grid}` }}>
                        <td style={{ padding: '10px 14px', color: C.textSec }}>{d.descripcion}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: C.textSec }}>{parseFloat(d.cantidad)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: C.textSec }}>${parseFloat(d.costo).toFixed(2)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: C.textDim }}>{parseFloat(d.iva || 0)}%</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: C.verde, fontWeight: 700 }}>
                          ${parseFloat(d.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '14px 20px', minWidth: 220 }}>
                <Row label="Subtotal" valor={`$${parseFloat(compraSeleccionada.subtotal).toFixed(2)}`} />
                <Row label="IVA"      valor={`$${parseFloat(compraSeleccionada.total_iva).toFixed(2)}`} />
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 8,
                  display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.textPrimary, fontWeight: 700 }}>TOTAL</span>
                  <span style={{ color: C.verde, fontWeight: 900, fontSize: 20 }}>
                    ${parseFloat(compraSeleccionada.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <BtnSm color={C.textDim} onClick={() => setModalVer(false)}>Cerrar</BtnSm>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────
const Label = ({ children }) => (
  <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600,
    letterSpacing: 1, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
    {children}
  </label>
);

const Row = ({ label, valor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
    <span style={{ color: '#9ca3af', fontSize: 13 }}>{label}:</span>
    <span style={{ color: '#374151', fontWeight: 600 }}>{valor}</span>
  </div>
);

const inputSt = {
  width: '100%', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '9px 12px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const celdaInputSt = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
  padding: '6px 9px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const BtnSm = ({ color, onClick, children, disabled, outline, icon }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ display: 'flex', alignItems: 'center', gap: 5,
      background: outline ? 'transparent' : color,
      color: outline ? color : '#fff',
      border: `1px solid ${color}`, borderRadius: 7,
      padding: '5px 12px', fontWeight: 600, fontSize: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1, transition: 'all .15s' }}>
    {icon}{children}
  </button>
);