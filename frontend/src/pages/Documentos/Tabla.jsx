import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/config';
import { generarHTML } from './Guardados';

const C = {
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  border: '#e5e7eb', bg: '#f4f5fb', card: '#ffffff',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444',
};

const IcoTrash    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
const IcoPrint    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
const IcoSave     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoClear    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
const IcoPlus     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoProforma = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>;
const IcoRecibo   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>;

const filaVacia = () => ({
  _id: Math.random(), producto_id: null, codigo: '',
  descripcion: '', cantidad: 1, precio: 0, iva: 0, subtotal: 0,
});

export default function Tabla({ onGuardado }) {
  const [cliente, setCliente]           = useState('');
  const [fecha, setFecha]               = useState(new Date().toISOString().split('T')[0]);
  const [notas, setNotas]               = useState('');
  const [filas, setFilas]               = useState([filaVacia()]);
  const [guardando, setGuardando]       = useState(false);
  const [modalGuardar, setModalGuardar] = useState(false);
  const [sugerencias, setSugerencias]   = useState([]);
  const [filaActiva, setFilaActiva]     = useState(null);

  const autocompleteRef  = useRef(null);
  const dropdownRef      = useRef(null);
  const activeInputRef   = useRef(null);
  const busquedaTimeout  = useRef(null);

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (
        autocompleteRef.current && !autocompleteRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setSugerencias([]); setFilaActiva(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll: mover el dropdown directamente en DOM sin re-render
  useEffect(() => {
    const handleScroll = () => {
      if (dropdownRef.current && activeInputRef.current) {
        const rect = activeInputRef.current.getBoundingClientRect();
        dropdownRef.current.style.top  = `${rect.bottom + 4}px`;
        dropdownRef.current.style.left = `${rect.left}px`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  const calcularPosicion = (e) => {
    activeInputRef.current = e.target;
    const rect = e.target.getBoundingClientRect();
    if (dropdownRef.current) {
      dropdownRef.current.style.top  = `${rect.bottom + 4}px`;
      dropdownRef.current.style.left = `${rect.left}px`;
    }
    // Guardamos también como fallback para el primer render
    return { top: rect.bottom + 4, left: rect.left };
  };

  const [dropdownInitPos, setDropdownInitPos] = useState({ top: 0, left: 0 });

  const buscarProductos = useCallback(async (texto, filaId) => {
    if (!texto || texto.length < 2) { setSugerencias([]); return; }
    try {
      const { data } = await api.get(`/productos?buscar=${encodeURIComponent(texto)}&limit=8`);
      setSugerencias(data.data || []); setFilaActiva(filaId);
    } catch { setSugerencias([]); }
  }, []);

  const onCambioCodigo = (filaId, valor, e) => {
    actualizarFila(filaId, { codigo: valor, producto_id: null });
    const pos = calcularPosicion(e);
    setDropdownInitPos(pos);
    clearTimeout(busquedaTimeout.current);
    busquedaTimeout.current = setTimeout(() => buscarProductos(valor, filaId), 250);
  };

  const onCambioDescripcion = (filaId, valor, e) => {
    actualizarFila(filaId, { descripcion: valor, producto_id: null });
    const pos = calcularPosicion(e);
    setDropdownInitPos(pos);
    clearTimeout(busquedaTimeout.current);
    busquedaTimeout.current = setTimeout(() => buscarProductos(valor, filaId), 250);
  };

  const seleccionarProducto = (filaId, producto) => {
    actualizarFila(filaId, {
      producto_id: producto.id, codigo: producto.codigo,
      descripcion: producto.descripcion,
      precio: parseFloat(producto.pvp1) || 0,
      iva:    parseFloat(producto.iva)  || 0,
    }, true);
    setSugerencias([]); setFilaActiva(null);
    activeInputRef.current = null;
  };

  const actualizarFila = (filaId, cambios, recalcular = false) => {
    setFilas(prev => prev.map(f => {
      if (f._id !== filaId) return f;
      const nueva = { ...f, ...cambios };
      if (recalcular || cambios.cantidad !== undefined || cambios.precio !== undefined || cambios.iva !== undefined) {
        const cant = parseFloat(nueva.cantidad) || 0;
        const prec = parseFloat(nueva.precio)   || 0;
        const iva  = parseFloat(nueva.iva)       || 0;
        nueva.subtotal = cant * prec * (1 + iva / 100);
      }
      return nueva;
    }));
  };

  const agregarFila  = () => setFilas(prev => [...prev, filaVacia()]);
  const eliminarFila = (id) => { if (filas.length > 1) setFilas(prev => prev.filter(f => f._id !== id)); };
  const limpiarTodo  = () => {
    setFilas([filaVacia()]); setCliente(''); setNotas('');
    setFecha(new Date().toISOString().split('T')[0]);
  };

  const subtotalBase = filas.reduce((s, f) => s + (parseFloat(f.cantidad) || 0) * (parseFloat(f.precio) || 0), 0);
  const totalIva     = filas.reduce((s, f) => {
    const base = (parseFloat(f.cantidad) || 0) * (parseFloat(f.precio) || 0);
    return s + base * ((parseFloat(f.iva) || 0) / 100);
  }, 0);
  const total = subtotalBase + totalIva;

  const guardar = async (tipo) => {
    const filasValidas = filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0);
    if (filasValidas.length === 0) { alert('Agrega al menos un producto'); return; }
    setGuardando(true);
    try {
      await api.post('/documentos', {
        tipo, cliente: cliente.trim() || 'Consumidor Final',
        fecha, notas,
        detalle: filasValidas.map(f => ({
          producto_id: f.producto_id, descripcion: f.descripcion,
          cantidad: parseFloat(f.cantidad), precio: parseFloat(f.precio),
          iva: parseFloat(f.iva) || 0,
        })),
      });
      setModalGuardar(false); limpiarTodo(); onGuardado();
    } catch (err) { alert(err.response?.data?.error || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  const imprimir = () => {
    const filasValidas = filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0);
    if (filasValidas.length === 0) { alert('No hay productos para imprimir'); return; }
    const win = window.open('', '_blank');
    win.document.write(generarHTML({
      tipo: 'BORRADOR', numero: '---',
      cliente: cliente || 'Consumidor Final', fecha, notas,
      filas: filasValidas, subtotalBase, totalIva, total,
    }));
    win.document.close(); win.print();
  };

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Cabecera del documento */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: 1.2,
          textTransform: 'uppercase', marginBottom: 16 }}>
          Datos del documento
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 3, minWidth: 200 }}>
            <Label>Cliente</Label>
            <input value={cliente} onChange={e => setCliente(e.target.value)}
              placeholder="Consumidor Final" style={inputSt} />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <Label>Fecha</Label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputSt} />
          </div>
          <div style={{ flex: 3, minWidth: 200 }}>
            <Label>Notas / Observaciones</Label>
            <input value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Opcional..." style={inputSt} />
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textDim,
            letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Productos
          </span>
          <span style={{ fontSize: 12, color: C.textDim }}>
            {filas.filter(f => f.descripcion).length} ítem(s)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 12 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['#', 'Código', 'Descripción', 'Cant.', 'Precio unit.', 'IVA %', 'Subtotal', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 12px', color: C.textDim, fontWeight: 600,
                    fontSize: 10, letterSpacing: 1.1, textAlign: i >= 3 ? 'center' : 'left',
                    borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => (
                <tr key={fila._id} style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: idx % 2 === 0 ? '#fff' : '#fafafa',
                  transition: 'background .1s',
                }}>
                  <td style={{ padding: '8px 12px', color: C.textDim, fontSize: 12, width: 32, textAlign: 'center' }}>
                    {idx + 1}
                  </td>

                  {/* Código — sin dropdown interno */}
                  <td style={{ padding: '6px 6px', width: 120 }}>
                    <input
                      ref={el => { if (filaActiva === fila._id) autocompleteRef.current = el; }}
                      value={fila.codigo}
                      onChange={e => onCambioCodigo(fila._id, e.target.value, e)}
                      onFocus={e => {
                        if (fila.codigo.length >= 2) {
                          calcularPosicion(e);
                          buscarProductos(fila.codigo, fila._id);
                        }
                      }}
                      placeholder="Código"
                      style={{ ...celdaSt, width: '100%' }}
                    />
                  </td>

                  {/* Descripción — sin dropdown interno */}
                  <td style={{ padding: '6px 6px' }}>
                    <input
                      ref={el => { if (filaActiva === fila._id) autocompleteRef.current = el; }}
                      value={fila.descripcion}
                      onChange={e => onCambioDescripcion(fila._id, e.target.value, e)}
                      onFocus={e => {
                        if (fila.descripcion.length >= 2) {
                          calcularPosicion(e);
                          buscarProductos(fila.descripcion, fila._id);
                        }
                      }}
                      placeholder="Descripción del producto"
                      style={{ ...celdaSt, width: '100%', minWidth: 200 }}
                    />
                  </td>

                  <td style={{ padding: '6px 6px', width: 80 }}>
                    <input type="number" value={fila.cantidad} min="0.01" step="0.01"
                      onChange={e => actualizarFila(fila._id, { cantidad: e.target.value }, true)}
                      style={{ ...celdaSt, width: '100%', textAlign: 'center' }} />
                  </td>
                  <td style={{ padding: '6px 6px', width: 100 }}>
                    <input type="number" value={fila.precio} min="0" step="0.01"
                      onChange={e => actualizarFila(fila._id, { precio: e.target.value }, true)}
                      style={{ ...celdaSt, width: '100%', textAlign: 'right' }} />
                  </td>
                  <td style={{ padding: '6px 6px', width: 70 }}>
                    <input type="number" value={fila.iva} min="0" max="100"
                      onChange={e => actualizarFila(fila._id, { iva: e.target.value }, true)}
                      style={{ ...celdaSt, width: '100%', textAlign: 'center' }} />
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', width: 100, whiteSpace: 'nowrap' }}>
                    <span style={{ color: parseFloat(fila.subtotal) > 0 ? C.verde : C.textDim,
                      fontWeight: 700, fontSize: 14 }}>
                      ${parseFloat(fila.subtotal).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '6px 10px', width: 36, textAlign: 'center' }}>
                    <button onClick={() => eliminarFila(fila._id)}
                      style={{ background: 'none', border: 'none', color: C.textDim,
                        cursor: 'pointer', padding: 6, borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = C.rojo; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.textDim; }}>
                      <IcoTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Agregar fila */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={agregarFila}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'none', border: `1px dashed ${C.border}`, color: C.textDim,
              borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13,
              width: '100%', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.azul; e.currentTarget.style.color = C.azul; e.currentTarget.style.background = '#f0f7ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; e.currentTarget.style.background = 'none'; }}>
            <IcoPlus /> Agregar producto
          </button>
        </div>
      </div>

      {/* Totales + Acciones */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={limpiarTodo}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
              border: `1px solid ${C.border}`, color: C.textDim, borderRadius: 10,
              padding: '11px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.rojo; e.currentTarget.style.color = C.rojo; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}>
            <IcoClear /> Limpiar todo
          </button>
          <button onClick={imprimir}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
              border: `1px solid ${C.azul}`, color: C.azul, borderRadius: 10,
              padding: '11px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
            <IcoPrint /> Vista previa / Imprimir
          </button>
          <button onClick={() => setModalGuardar(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.verde,
              border: 'none', color: '#fff', borderRadius: 10,
              padding: '11px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.verde; }}>
            <IcoSave /> Guardar documento
          </button>
        </div>

        {/* Card totales */}
        <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 280 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim,
            letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 20 }}>
            Resumen del documento
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
              <span style={{ color: C.amarillo, fontWeight: 800, fontSize: 32, letterSpacing: -1 }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f9fafb',
            borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.textDim, fontSize: 12 }}>Ítems en el documento</span>
            <span style={{ color: C.textSec, fontWeight: 700, fontSize: 13 }}>
              {filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Dropdown autocomplete — position fixed, manipulado por ref ── */}
      {filaActiva !== null && sugerencias.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top:  dropdownInitPos.top,
            left: dropdownInitPos.left,
            width: 440,
            zIndex: 9999,
            background: '#fff',
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            maxHeight: 260,
            overflowY: 'auto',
            boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
          }}
        >
          {sugerencias.map(p => (
            <div key={p.id}
              onMouseDown={() => seleccionarProducto(filaActiva, p)}
              style={{
                padding: '10px 16px', cursor: 'pointer',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: C.textDim, fontSize: 11, fontFamily: 'monospace' }}>{p.codigo}</span>
                <span style={{ color: C.textSec, fontSize: 13 }}>
                  {p.descripcion.length > 38 ? p.descripcion.slice(0, 36) + '..' : p.descripcion}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                <span style={{ color: C.amarillo, fontWeight: 700, fontSize: 13 }}>
                  ${parseFloat(p.pvp1).toFixed(2)}
                </span>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                  background: p.inventariable && parseFloat(p.stock) <= 0 ? '#fef2f2' : '#f0fdf4',
                  color: p.inventariable && parseFloat(p.stock) <= 0 ? C.rojo : C.verde,
                  fontWeight: 600,
                }}>
                  Stock: {parseFloat(p.stock)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal elegir tipo */}
      {modalGuardar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px',
            width: '100%', maxWidth: 420, textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ width: 56, height: 56, background: '#f0fdf4', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: C.verde }}>
              <IcoSave />
            </div>
            <h2 style={{ color: C.textPrimary, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              ¿Cómo deseas guardar?
            </h2>
            <p style={{ color: C.textDim, fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
              La <strong style={{ color: C.azul }}>proforma</strong> no descuenta stock.<br/>
              El <strong style={{ color: C.verde }}>recibo</strong> descuenta stock inmediatamente.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => guardar('proforma')} disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: 8,
                  background: '#eff6ff', border: `2px solid ${C.azul}`, color: C.azul,
                  borderRadius: 12, padding: '14px 24px', fontWeight: 700,
                  fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.azul; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = C.azul; }}>
                <IcoProforma /> Proforma
              </button>
              <button onClick={() => guardar('recibo')} disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: 8,
                  background: '#f0fdf4', border: `2px solid ${C.verde}`, color: C.verde,
                  borderRadius: 12, padding: '14px 24px', fontWeight: 700,
                  fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.verde; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = C.verde; }}>
                <IcoRecibo /> Recibo
              </button>
            </div>
            <button onClick={() => setModalGuardar(false)}
              style={{ background: 'none', border: 'none', color: C.textDim,
                marginTop: 20, cursor: 'pointer', fontSize: 13 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const Label = ({ children }) => (
  <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: 1,
    display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
    {children}
  </label>
);

const inputSt = {
  width: '100%', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '9px 12px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const celdaSt = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
  padding: '6px 9px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};