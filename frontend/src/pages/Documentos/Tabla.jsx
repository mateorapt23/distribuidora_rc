import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/config';
import { generarHTML } from './Guardados';
import { useBreakpoint } from '../../hooks/useIsMobile';

const C = {
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  border: '#e5e7eb', bg: '#f4f5fb', card: '#ffffff',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444',
};

const IcoTrash    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
const IcoSave     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoClear    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
const IcoPlus     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoProforma = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>;
const IcoRecibo   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>;
const IcoThermal  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/><line x1="9" y1="17" x2="15" y2="17"/></svg>;
const IcoPDF      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/><line x1="9" y1="9" x2="10" y2="9"/></svg>;
const IcoCapture  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IcoX        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoWarn     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
// ── Scoring de relevancia para el autocomplete ─────────────
const _normT = (s) => s.toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();
const _tokT  = (s) => _normT(s).split(/\s+/).filter(t => t.length >= 2);

const scoreProductoTabla = (query, prod) => {
  const q   = _normT(query);
  const cod = _normT(prod.codigo || '');
  const des = _normT(prod.descripcion || '');
  if (cod === q || des === q)                       return 100;
  if (cod.startsWith(q) || des.startsWith(q))       return  80;
  if (cod.includes(q)   || des.includes(q))          return  60;
  const tQ = _tokT(query);
  const tD = _tokT(prod.descripcion || '');
  if (tQ.length === 0 || tD.length === 0) return 0;
  let score = 0, hits = 0;
  tQ.forEach(t => {
    if (tD.some(d => d === t))                              { score += 4; hits++; }
    else if (tD.some(d => d.startsWith(t)||t.startsWith(d))){ score += 2; hits++; }
    else if (tD.some(d => d.includes(t)||t.includes(d)))    { score += 1; hits++; }
    else if (cod.includes(t))                               { score += 1; hits++; }
  });
  const minCov = tQ.length === 1 ? 1.0 : tQ.length <= 3 ? 0.5 : 0.4;
  if (hits / tQ.length < minCov) return 0;
  return score;
};

const filaVacia = () => ({
  _id: Math.random(), producto_id: null, codigo: '',
  descripcion: '', cantidad: 1, precio: 0, subtotal: 0,
});

export default function Tabla({ onGuardado, datosEdicion, onDatosUsados }) {
  const { isMobile } = useBreakpoint();
  const [cliente, setCliente]           = useState('');
  const [sugerenciasCliente, setSugerenciasCliente] = useState([]);
  const [clienteActivo, setClienteActivo]           = useState(false);
  const clienteRef                                  = useRef(null);
  const clienteTimeout                              = useRef(null);
  const [fecha, setFecha]               = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotas]               = useState('');
  const [filas, setFilas]               = useState([filaVacia()]);
  const [guardando, setGuardando]       = useState(false);
  const [modalGuardar, setModalGuardar] = useState(false);
  const [modalPDF, setModalPDF]         = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl]     = useState(null);
  const [pdfNombre, setPdfNombre]       = useState('');
  const [pdfGenerando, setPdfGenerando] = useState(false);
  const [pdfOpcion, setPdfOpcion]       = useState(1);
  const [pdfEsTermica, setPdfEsTermica] = useState(false);
  const [localImgBase64, setLocalImgBase64] = useState('');
  const [idEdicion, setIdEdicion]       = useState(null);
  const [tipoEdicion, setTipoEdicion]   = useState(null);
  const [tipoNuevo, setTipoNuevo]       = useState('recibo');
  const [numeroPreview, setNumeroPreview] = useState('');
  const [numeroEdicion, setNumeroEdicion] = useState('');
  const tablaRef = useRef(null);
  const [sugerencias, setSugerencias]   = useState([]);
  const [filaActiva, setFilaActiva]     = useState(null);

  // Buscar clientes para autocomplete
  const buscarClientes = async (q) => {
    if (!q || q.trim().length < 1) { setSugerenciasCliente([]); return; }
    clearTimeout(clienteTimeout.current);
    clienteTimeout.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/clientes/buscar?q=${encodeURIComponent(q)}`);
        setSugerenciasCliente(data);
      } catch { setSugerenciasCliente([]); }
    }, 250);
  };

  const seleccionarCliente = (c) => {
    setCliente(c.nombre);
    setSugerenciasCliente([]);
    setClienteActivo(false);
  };

  const autocompleteRef  = useRef(null);
  const dropdownRef      = useRef(null);
  const activeInputRef   = useRef(null);
  const busquedaTimeout  = useRef(null);

  // Cargar imagen del local como base64 comprimida para embeber en PDF/captura
  // Se redimensiona a máx 600px ancho y JPEG 0.75 para no superar el límite de body de Express
  useEffect(() => {
    fetch('/LOCAL.jpg')
      .then(r => r.blob())
      .then(blob => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX_W = 600;
          const ratio = Math.min(1, MAX_W / img.width);
          const canvas = document.createElement('canvas');
          canvas.width  = Math.round(img.width  * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          setLocalImgBase64(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.src = url;
      })
      .catch(() => {});
  }, []);

  // y al cambiar tipoNuevo (solo cuando no hay edición)
  useEffect(() => {
    if (idEdicion) return;
    const obtenerNumero = async () => {
      try {
        // Consultamos el último número de documentos del tipo y calculamos el siguiente
        const { data } = await api.get(`/documentos?tipo=${tipoNuevo}&limit=1`);
        const ultimo = data.data?.[0]?.numero || null;
        if (ultimo) {
          const n = parseInt(ultimo.replace(/\D/g, ''), 10) + 1;
          const prefix = tipoNuevo === 'proforma' ? 'P' : 'R';
          setNumeroPreview(`${prefix}-${String(n).padStart(4, '0')}`);
        } else {
          setNumeroPreview(tipoNuevo === 'proforma' ? 'P-0001' : 'R-0001');
        }
      } catch {
        setNumeroPreview(tipoNuevo === 'proforma' ? 'P-????' : 'R-????');
      }
    };
    obtenerNumero();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoNuevo, idEdicion]);
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

  // Cargar datos cuando viene desde "Ver en tabla" en Guardados
  useEffect(() => {
    if (!datosEdicion) return;
    setCliente(datosEdicion.cliente || '');
    setFecha(datosEdicion.fecha || new Date().toISOString().split('T')[0]);
    setNotas(datosEdicion.notas || '');
    setFilas((datosEdicion.filas || []).map(f => ({
      ...f,
      _id: Math.random(),
      subtotal: (parseFloat(f.cantidad) || 0) * (parseFloat(f.precio) || 0),
    })));
    setIdEdicion(datosEdicion.id || null);
    setTipoEdicion(datosEdicion.tipo || null);
    setNumeroEdicion(datosEdicion.numero || '');
    if (onDatosUsados) onDatosUsados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datosEdicion]);

  // Scroll: mover el dropdown directamente en DOM sin re-render
  useEffect(() => {
    const handleScroll = () => {
      if (dropdownRef.current && activeInputRef.current) {
        const rect = activeInputRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        const maxDropHeight = Math.min(380, Math.max(150, spaceBelow));
        dropdownRef.current.style.top       = `${rect.bottom + 4}px`;
        dropdownRef.current.style.left      = `${rect.left}px`;
        dropdownRef.current.style.width     = `${Math.max(300, rect.right - rect.left)}px`;
        dropdownRef.current.style.maxHeight = `${maxDropHeight}px`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  const calcularPosicion = (e) => {
    activeInputRef.current = e.target;
    const rect = e.target.getBoundingClientRect();
    const dropWidth = Math.max(300, rect.right - rect.left);
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const maxDropHeight = Math.min(380, Math.max(150, spaceBelow));
    if (dropdownRef.current) {
      dropdownRef.current.style.top       = `${rect.bottom + 4}px`;
      dropdownRef.current.style.left      = `${rect.left}px`;
      dropdownRef.current.style.width     = `${dropWidth}px`;
      dropdownRef.current.style.maxHeight = `${maxDropHeight}px`;
    }
    return { top: rect.bottom + 4, left: rect.left, dropWidth, maxDropHeight };
  };

  const [dropdownInitPos, setDropdownInitPos] = useState({ top: 0, left: 0, dropWidth: 300, maxDropHeight: 380 });

  const buscarProductos = useCallback(async (texto, filaId) => {
    if (!texto || texto.trim().length < 2) { setSugerencias([]); return; }
    try {
      // Una sola query con la frase completa → el backend hace AND de todos los tokens
      // Así "tubo 3 plastigama" solo devuelve productos que contengan LAS TRES palabras
      const { data } = await api.get(`/productos/buscar?q=${encodeURIComponent(texto.trim())}&limit=100`);
      const resultados = data.data || [];
      const ordenados = resultados
        .map(p => ({ ...p, _s: scoreProductoTabla(texto, p) }))
        .filter(p => p._s > 0)
        .sort((a, b) => b._s - a._s || a.descripcion.localeCompare(b.descripcion));
      setSugerencias(ordenados);
      setFilaActiva(filaId);
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
    const precioSinIva = parseFloat(producto.pvp1) || 0;
    const iva          = parseFloat(producto.iva)  || 0;
    const precioConIva = parseFloat((precioSinIva * (1 + iva / 100)).toFixed(2));
    actualizarFila(filaId, {
      producto_id: producto.id, codigo: producto.codigo,
      descripcion: producto.descripcion,
      precio: precioConIva,
    }, true);
    setSugerencias([]); setFilaActiva(null);
    activeInputRef.current = null;
  };

  const actualizarFila = (filaId, cambios, recalcular = false) => {
    setFilas(prev => prev.map(f => {
      if (f._id !== filaId) return f;
      const nueva = { ...f, ...cambios };
      if (recalcular || cambios.cantidad !== undefined || cambios.precio !== undefined) {
        const cant = parseFloat(nueva.cantidad) || 0;
        const prec = parseFloat(nueva.precio)   || 0;
        nueva.subtotal = cant * prec;
      }
      return nueva;
    }));
  };

  const agregarFila  = () => setFilas(prev => [...prev, filaVacia()]);
  const eliminarFila = (id) => { if (filas.length > 1) setFilas(prev => prev.filter(f => f._id !== id)); };
  const limpiarTodo  = () => {
    setFilas([filaVacia()]); setCliente(''); setNotas('');
    setFecha(new Date().toISOString().split('T')[0]);
    setIdEdicion(null); setTipoEdicion(null); setTipoNuevo('recibo'); setNumeroEdicion('');
  };

  const subtotalBase = filas.reduce((s, f) => s + (parseFloat(f.cantidad) || 0) * (parseFloat(f.precio) || 0), 0);
  const total = subtotalBase;

  const guardar = async () => {
    const filasValidas = filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0);
    if (filasValidas.length === 0) { alert('Agrega al menos un producto'); return; }
    setGuardando(true);
    try {
      const detalle = filasValidas.map(f => ({
        producto_id: f.producto_id, descripcion: f.descripcion,
        cantidad: parseFloat(f.cantidad), precio: parseFloat(f.precio),
      }));
      if (idEdicion) {
        // Actualizar documento existente
        await api.put(`/documentos/${idEdicion}`, {
          cliente: cliente.trim() || 'Consumidor Final',
          fecha, notas: notes, detalle,
        });
      } else {
        // Crear nuevo documento con el tipo ya seleccionado en el recuadro
        await api.post('/documentos', {
          tipo: tipoNuevo, cliente: cliente.trim() || 'Consumidor Final',
          fecha, notas: notes, detalle,
        });
      }
      setModalGuardar(false); limpiarTodo(); onGuardado();
    } catch (err) { alert(err.response?.data?.error || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  const filasValidas = filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0);

  const imprimirTermica = async () => {
    if (filasValidas.length === 0) { alert('No hay productos para imprimir'); return; }
    const tipoRaw    = (idEdicion ? tipoEdicion : tipoNuevo);
    const tipoDoc    = tipoRaw === 'recibo' ? 'NOTA DE ENTREGA' : tipoRaw.toUpperCase();
    const numeroDoc = idEdicion ? numeroEdicion : (numeroPreview || 'BORRADOR');
    const nombre    = `${tipoDoc}-${numeroDoc}-${fecha}-termica.pdf`;
    const html = generarHTMLTermica({
      tipo: tipoDoc, numero: numeroDoc,
      cliente: cliente || 'Consumidor Final', fecha, notas: notes,
      filas: filasValidas, subtotalBase, total,
    });
    setPdfNombre(nombre);
    setPdfEsTermica(true);
    setModalPDF(true);
    setPdfGenerando(true);
    setPdfBlobUrl(null);
    try {
      const res = await api.post(
        '/documentos/pdf',
        { html, nombre, size: { width: '80mm' }, margins: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' } },
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPdfBlobUrl(url);
    } catch (err) {
      console.error(err);
      alert('Error al generar PDF térmico');
      setModalPDF(false);
    } finally {
      setPdfGenerando(false);
    }
  };

  const obtenerDatosHTML = (opcion = 1) => {
    const tipoRaw    = (idEdicion ? tipoEdicion : tipoNuevo);
    const tipoDoc    = tipoRaw === 'recibo' ? 'NOTA DE ENTREGA' : tipoRaw.toUpperCase();
    const numeroDoc = idEdicion ? numeroEdicion : (numeroPreview || 'BORRADOR');
    const nombre    = `${tipoDoc}-${numeroDoc}-${fecha}.pdf`;
    let html;
    if (opcion === 1) {
      html = generarHTML({
        tipo: tipoDoc, numero: numeroDoc,
        cliente: cliente || 'Consumidor Final', fecha, notas: notes,
        filas: filasValidas, subtotalBase, total,
      });
    } else {
      html = generarHTMLTabla({
        tipo: tipoDoc, numero: numeroDoc,
        cliente: cliente || 'Consumidor Final', fecha, notas: notes,
        filas: filasValidas, subtotalBase, total, imgLocal: localImgBase64,
      });
    }
    return { html, nombre };
  };

  const generarPDFConOpcion = async (opcion) => {
    const { html, nombre } = obtenerDatosHTML(opcion);
    setPdfNombre(nombre);
    setPdfGenerando(true);
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
    try {
      const marginsPorOpcion = opcion === 1
        ? { top: '10mm', right: '0mm', bottom: '0mm', left: '0mm' }
        : { top: '10mm', right: '5mm', bottom: '0mm', left: '5mm' };
      const res = await api.post('/documentos/pdf', { html, nombre, margins: marginsPorOpcion }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPdfBlobUrl(url);
    } catch (err) {
      console.error(err);
      alert('Error al generar el PDF');
      setModalPDF(false);
    } finally {
      setPdfGenerando(false);
    }
  };

  const abrirPDF = async () => {
    if (filasValidas.length === 0) { alert('No hay productos para previsualizar'); return; }
    setPdfOpcion(1);
    setModalPDF(true);
    await generarPDFConOpcion(1);
  };

  const cerrarModalPDF = () => {
    setModalPDF(false);
    setPdfEsTermica(false);
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
  };

  const descargarBlobPDF = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = pdfNombre;
    a.click();
  };

  const cambiarOpcionPDF = async (nuevaOpcion) => {
    if (nuevaOpcion === pdfOpcion || pdfGenerando) return;
    setPdfOpcion(nuevaOpcion);
    await generarPDFConOpcion(nuevaOpcion);
  };

  const imprimirDesdeModal = () => {
    const tipoDoc = (idEdicion ? tipoEdicion : tipoNuevo).toUpperCase();
    const numeroDoc = idEdicion ? numeroEdicion : (numeroPreview || 'BORRADOR');
    const htmlContent = generarHTML({
      tipo: tipoDoc, numero: numeroDoc,
      cliente: cliente || 'Consumidor Final', fecha, notas: notes,
      filas: filasValidas, subtotalBase, total,
    });
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(htmlContent);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  const descargarPDF = async () => {
    if (filasValidas.length === 0) { alert('No hay productos para descargar'); return; }

    // Cargar jsPDF si no está disponible
    if (!window.jspdf) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    const tipoDoc = (idEdicion ? tipoEdicion : tipoNuevo).toUpperCase();
    const numeroDoc = idEdicion ? numeroEdicion : (numeroPreview || 'BORRADOR');
    const nombreArchivo = `${(idEdicion ? tipoEdicion : tipoNuevo)}-${numeroDoc}-${fecha}.pdf`;

    const PW = 210; // ancho A4
    const M  = 14;  // margen lateral
    const CW = PW - M * 2; // ancho contenido = 182mm

    // ── Helpers ─────────────────────────────────────────────
    const hex2rgb = (hex) => {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return [r,g,b];
    };
    const fill  = (hex) => doc.setFillColor(...hex2rgb(hex));
    const stroke= (hex) => doc.setDrawColor(...hex2rgb(hex));
    const text  = (hex) => doc.setTextColor(...hex2rgb(hex));

    let y = 14; // cursor vertical

    // ── CABECERA ─────────────────────────────────────────────
    const HDR_H = 28;
    // Bloque amarillo (izquierda, 60% ancho)
    const leftW = CW * 0.62;
    fill('#F5C400'); stroke('#333333');
    doc.setLineWidth(0.5);
    doc.rect(M, y, leftW, HDR_H, 'FD');

    // Nombre empresa
    doc.setFont('helvetica','bold');
    doc.setFontSize(18);
    text('#111111');
    doc.text('DISTRIBUIDORA RC', M + 5, y + 10);

    // Info empresa
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    text('#333333');
    doc.text('DIRECCIÓN: Chimbacalle, Av Napo y Salcedo', M + 5, y + 17);
    doc.text('TELÉFONO: 0998024883 – 0984666022', M + 5, y + 22);

    // Bloque negro (derecha)
    const rightX = M + leftW;
    const rightW = CW - leftW;
    fill('#0D111C'); stroke('#333333');
    doc.rect(rightX, y, rightW, HDR_H, 'FD');

    doc.setFont('helvetica','bold');
    doc.setFontSize(14);
    text('#FFFFFF');
    doc.text(tipoDoc, rightX + rightW / 2, y + 9, { align: 'center' });

    doc.setFontSize(10);
    text('#FDE68A');
    doc.text(`N° ${numeroDoc}`, rightX + rightW / 2, y + 16, { align: 'center' });

    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    text('#BFDBFE');
    doc.text(fecha, rightX + rightW / 2, y + 22, { align: 'center' });

    y += HDR_H;

    // ── FILA CLIENTE ─────────────────────────────────────────
    const CLI_H = 9;
    fill('#FEF3C7'); stroke('#333333');
    doc.setLineWidth(0.4);
    doc.rect(M, y, CW, CLI_H, 'FD');

    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    text('#6B7280');
    doc.text('CLIENTE:', M + 4, y + 6);
    doc.setFont('helvetica','bold');
    text('#111111');
    doc.text(cliente || 'Consumidor Final', M + 26, y + 6);

    if (notes) {
      doc.setFont('helvetica','bold');
      text('#6B7280');
      doc.text('NOTAS:', M + 100, y + 6);
      doc.setFont('helvetica','normal');
      text('#111111');
      doc.text(notes, M + 117, y + 6);
    }

    y += CLI_H;

    // ── ENCABEZADO TABLA ─────────────────────────────────────
    const cols = [
      { label: 'CANT.',      w: 18,  align: 'right'  },
      { label: 'DESCRIPCIÓN',w: 90,  align: 'left'   },
      { label: 'V. UNITARIO',w: 36,  align: 'right'  },
      { label: 'V. TOTAL',   w: 38,  align: 'right'  },
    ];
    const TH_H = 8;
    fill('#0D111C'); stroke('#333333');
    doc.rect(M, y, CW, TH_H, 'FD');

    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    text('#FFFFFF');
    let cx = M;
    cols.forEach(col => {
      const tx = col.align === 'right'  ? cx + col.w - 3
               : col.align === 'center' ? cx + col.w / 2
               : cx + 3;
      doc.text(col.label, tx, y + 5.5, { align: col.align === 'center' ? 'center' : col.align });
      cx += col.w;
    });

    y += TH_H;

    // ── FILAS DE DATOS ───────────────────────────────────────
    const ROW_H = 7;
    const MIN_ROWS = 10;
    const totalFilas = Math.max(filasValidas.length, MIN_ROWS);

    for (let i = 0; i < totalFilas; i++) {
      const f = filasValidas[i];
      const esVacia = !f;
      const bgColor = i % 2 === 0 ? '#FFFFFF' : '#FEF9C3';

      fill(bgColor); stroke('#E5E7EB');
      doc.setLineWidth(0.3);
      doc.rect(M, y, CW, ROW_H, 'FD');

      if (!esVacia) {
        const sub = parseFloat(f.cantidad) * parseFloat(f.precio);
        doc.setFont('helvetica','normal');
        doc.setFontSize(8.5);
        text('#111111');

        cx = M;
        const vals = [
          { v: String(parseFloat(f.cantidad)), align: 'right'  },
          { v: f.descripcion,                  align: 'left'   },
          { v: `$${parseFloat(f.precio).toFixed(2)}`, align: 'right' },
          { v: `$${sub.toFixed(2)}`,           align: 'right'  },
        ];
        cols.forEach((col, ci) => {
          const val = vals[ci];
          const tx = val.align === 'right'  ? cx + col.w - 3
                   : val.align === 'center' ? cx + col.w / 2
                   : cx + 3;
          // Truncar descripción si es muy larga
          let txt = val.v;
          if (ci === 1 && doc.getTextWidth(txt) > col.w - 6) {
            while (doc.getTextWidth(txt + '…') > col.w - 6 && txt.length > 0) txt = txt.slice(0,-1);
            txt += '…';
          }
          doc.text(txt, tx, y + 4.8, { align: val.align === 'center' ? 'center' : val.align });
          cx += col.w;
        });
      } else {
        // Fila vacía: solo mostrar 0,00 en última columna
        doc.setFont('helvetica','normal');
        doc.setFontSize(8);
        text('#9CA3AF');
        doc.text('0,00', M + CW - 3, y + 4.8, { align: 'right' });
      }

      y += ROW_H;
    }

    // ── FILA TOTAL ───────────────────────────────────────────
    const TOT_H = 10;
    fill('#F5C400'); stroke('#333333');
    doc.setLineWidth(0.6);
    doc.rect(M, y, CW, TOT_H, 'FD');

    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    text('#111111');
    doc.text('TOTAL', M + CW - cols[cols.length-1].w - 3, y + 6.8, { align: 'right' });
    doc.setFontSize(13);
    doc.text(`$${total.toFixed(2)}`, M + CW - 3, y + 6.8, { align: 'right' });

    // ── PIE ──────────────────────────────────────────────────
    doc.setFont('helvetica','normal');
    doc.setFontSize(7.5);
    text('#9CA3AF');
    doc.text('Este documento no es un comprobante fiscal.', PW / 2, 285, { align: 'center' });

    doc.save(nombreArchivo);
  };

  const tomarCaptura = async () => {
    if (filasValidas.length === 0) { alert('No hay productos para capturar'); return; }

    const tipoRaw    = (idEdicion ? tipoEdicion : tipoNuevo);
    const tipoDoc    = tipoRaw === 'recibo' ? 'NOTA DE ENTREGA' : tipoRaw.toUpperCase();
    const numeroDoc  = idEdicion ? numeroEdicion : (numeroPreview || 'BORRADOR');
    const nombre     = `${(idEdicion ? tipoEdicion : tipoNuevo)}-${numeroDoc}-${fecha}.png`;
    const html       = generarHTMLCaptura({
      tipo: tipoDoc, numero: numeroDoc,
      cliente: cliente || 'Consumidor Final', fecha, notas: notes,
      filas: filasValidas, subtotalBase, total, imgLocal: localImgBase64,
    });

    const htmlCompleto = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; padding: 0; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
</head>
<body>${html}</body>
</html>`;

    try {
      const res  = await api.post('/documentos/captura', { html: htmlCompleto, nombre }, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'image/png' });
      let copiado = false;
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); copiado = true; } catch {}
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = nombre; a.click(); URL.revokeObjectURL(url);
      if (copiado) {
        const toast = document.createElement('div');
        toast.innerHTML = `<div style="display:flex;align-items:center;gap:12px;"><div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div><div style="font-size:13px;font-weight:700;color:#fff;">Imagen copiada al portapapeles</div><div style="font-size:11px;color:#94a3b8;margin-top:2px;">Presiona <kbd style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:4px;padding:1px 5px;font-size:10px;color:#e2e8f0;">Ctrl+V</kbd> para pegar en WhatsApp u otra app</div></div></div>`;
        toast.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(0);background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border:1px solid rgba(255,255,255,0.08);box-shadow:0 8px 32px rgba(0,0,0,0.35),0 0 0 1px rgba(16,185,129,0.15);padding:12px 18px;border-radius:14px;z-index:99999;opacity:1;transition:opacity .5s ease,transform .5s ease;pointer-events:none;min-width:320px;';
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(-50%) translateY(8px)'; setTimeout(()=>toast.remove(),500); }, 3000);
      }
    } catch (err) { console.error(err); alert('Error al tomar captura'); }
  };

  return (
    <div style={{ padding: isMobile ? '14px 10px' : '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Toast flotante — filas manuales */}
      {filas.some(f => f.descripcion && !f.producto_id) && (
        <div style={{
          position: 'fixed',
          top: isMobile ? 'auto' : 24,
          bottom: isMobile ? 80 : 'auto',
          right: isMobile ? 10 : 24,
          left: isMobile ? 10 : 'auto',
          zIndex: 9000,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#92400e',
          boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
          maxWidth: isMobile ? '100%' : 320, pointerEvents: 'none',
        }}>
          <span style={{ color: '#d97706', marginTop: 1, flexShrink: 0 }}><IcoWarn /></span>
          <span>
            <strong>Producto manual.</strong> Las filas con <span style={{ color: '#d97706' }}>⚠</span> no
            están en el inventario — <strong>no se descontará stock</strong> al guardar como nota de entrega.
          </span>
        </div>
      )}

      {/* Tabla de productos — estilo Excel Ferretería */}
      <div ref={tablaRef} style={{ border: '2px solid #333', borderRadius: 2, overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>

        {/* Header empresa */}
        <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <div style={{
            background: '#F5C400',
            flex: 1,
            padding: isMobile ? '12px 14px' : '14px 20px',
            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Datos empresa */}
            <div style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              flexShrink: 0,
              flex: isMobile ? 1 : undefined, // en mobile ocupa el espacio restante antes de la imagen
              zIndex: 1,
            }}>
              <div style={{ fontSize: isMobile ? 17 : 22, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Ferreteria Carrión
              </div>
              <div style={{ fontSize: isMobile ? 9.5 : 11, color: '#333', marginTop: 5, lineHeight: 1.8 }}>
                <strong>DIRECCIÓN:</strong> Chimbacalle, Av Napo y Salcedo<br/>
                <strong>TELÉFONO:</strong> 0998024883 – 0984666022
              </div>
            </div>

            {/* Foto del local — dos modos según pantalla */}
            {isMobile ? (
              // Mobile: inline al lado del texto, tamaño pequeño y ordenado
              <img
                src="/LOCAL.jpg"
                alt="Local Ferretería Carrión"
                style={{
                  height: 62,
                  width: 92,
                  objectFit: 'cover',
                  borderRadius: 5,
                  border: '2px solid rgba(0,0,0,0.18)',
                  flexShrink: 0,
                  alignSelf: 'center',
                }}
              />
            ) : (
              // Desktop/tablet: absoluta, centrada en left:60%
              // min(260px, 25%): en 1080p (sección amarilla ~1400px) → 25% = 350px > 260 → usa 260px exacto
              // En resoluciones menores → escala a 25% del contenedor sin moverse del 60%
              <img
                src="/LOCAL.jpg"
                alt="Local Ferretería Carrión"
                style={{
                  position: 'absolute',
                  left: '60%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  height: 'calc(100% - 12px)',
                  width: 'min(260px, 25%)',
                  objectFit: 'fill',
                  borderRadius: 6,
                  border: '2px solid rgba(0,0,0,0.15)',
                }}
              />
            )}
          </div>
          <div data-capture-header-tipo="true" style={{
            background: '#0D111C',
            minWidth: isMobile ? '100%' : 200,
            width: isMobile ? '100%' : undefined,
            display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '14px 20px', gap: 6,
          }}>
            {idEdicion ? (
              /* MODO EDICIÓN: mostrar tipo + número, sin opción a cambiar */
              <>
                <div style={{ fontSize: 18, fontWeight: 900, color: tipoEdicion === 'recibo' ? '#6ee7b7' : '#93c5fd',
                  textTransform: 'uppercase', letterSpacing: 1 }}>
                  {tipoEdicion === 'recibo' ? 'NOTA DE ENTREGA' : 'PROFORMA'}
                </div>
                <div style={{ fontSize: 12, color: '#bfdbfe', fontWeight: 700, letterSpacing: 0.5 }}>
                  {numeroEdicion}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{fecha}</div>
              </>
            ) : (
              /* MODO NUEVO: selector visual clicable */
              <>
                <div data-capture-tipo="true" style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden',
                  border: '1px solid #374151' }}>
                  {[
                    { key: 'proforma', label: 'PROFORMA', color: '#93c5fd' },
                    { key: 'recibo',   label: 'NOTA DE ENTREGA',   color: '#6ee7b7' },
                  ].map(opt => (
                    <button key={opt.key}
                      onClick={() => setTipoNuevo(opt.key)}
                      style={{
                        background: tipoNuevo === opt.key ? '#1e293b' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        padding: '6px 14px', fontSize: 13, fontWeight: 900,
                        color: tipoNuevo === opt.key ? opt.color : '#4b5563',
                        letterSpacing: 0.8, textTransform: 'uppercase',
                        borderBottom: tipoNuevo === opt.key ? `2px solid ${opt.color}` : '2px solid transparent',
                        transition: 'all .15s',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: tipoNuevo === 'recibo' ? '#6ee7b7' : '#93c5fd',
                  fontWeight: 700, letterSpacing: 0.5 }}>
                  {numeroPreview || '…'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{fecha}</div>
              </>
            )}
          </div>
        </div>

        {/* Fila cliente */}
        <div style={{ background: '#fef3c7', borderTop: '1px solid #333', borderBottom: '1px solid #aaa',
          padding: '8px 16px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div ref={clienteRef} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 2, minWidth: 180, position: 'relative' }}>
            <span style={{ color: '#6b7280', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>CLIENTE:</span>
            <input
              value={cliente}
              onChange={e => { setCliente(e.target.value); setClienteActivo(true); buscarClientes(e.target.value); }}
              onFocus={() => { setClienteActivo(true); if (cliente) buscarClientes(cliente); }}
              onBlur={() => setTimeout(() => { setSugerenciasCliente([]); setClienteActivo(false); }, 180)}
              placeholder="Consumidor Final"
              style={{ ...celdaSt, flex: 1, background: 'transparent', border: '1px solid #d97706',
                fontWeight: 700, fontSize: 13, color: '#111' }}
            />
            {clienteActivo && sugerenciasCliente.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200,
                maxHeight: 220, overflowY: 'auto', marginTop: 4,
              }}>
                {sugerenciasCliente.map(c => {
                  const tipoColor = {
                    CEDULA:    { bg: '#dbeafe', color: '#1d4ed8' },
                    RUC:       { bg: '#d1fae5', color: '#065f46' },
                    PASAPORTE: { bg: '#ede9fe', color: '#5b21b6' },
                    OTRO:      { bg: '#f3f4f6', color: '#6b7280' },
                  }[c.tipo] || { bg: '#f3f4f6', color: '#6b7280' };
                  return (
                    <div key={c.id}
                      onMouseDown={() => seleccionarCliente(c)}
                      style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                        display: 'flex', gap: 10, alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fffbeb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{c.nombre}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ background: tipoColor.bg, color: tipoColor.color,
                            fontWeight: 700, fontSize: 10, padding: '1px 7px', borderRadius: 20 }}>
                            {c.tipo}
                          </span>
                          <span style={{ color: '#6b7280' }}>{c.identificacion}</span>
                          {c.telefono && <span style={{ background: '#fef3c7', color: '#92400e',
                            fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>
                            {c.telefono}
                          </span>}
                          {c.email && <span style={{ color: '#8a2085', fontSize: 10 }}>{c.email}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
            <span style={{ color: '#6b7280', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>FECHA:</span>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              style={{ ...celdaSt, background: 'transparent', border: '1px solid #d97706',
                fontWeight: 600, fontSize: 12, color: '#111', textAlign: 'center' }} />
          </div>
          {/* Añadido identificador data-capture-notas para controlar su visibilidad en la captura */}
          <div data-capture-notas="true" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 2, minWidth: 160 }}>
            <span style={{ color: '#6b7280', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>NOTAS:</span>
            <input value={notes} onChange={e => setNotas(e.target.value)}
              placeholder="Opcional..."
              style={{ ...celdaSt, flex: 1, background: 'transparent', border: '1px solid #d97706',
                fontSize: 12, color: '#111' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#0D111C' }}>
                {[
                  { label: '#',            align: 'center', w: 36 },
                  { label: 'Código',       align: 'left',   w: 110 },
                  { label: 'Descripción',  align: 'left',   w: null },
                  { label: 'Cant.',        align: 'center', w: 80 },
                  { label: 'V. Unitario',  align: 'right',  w: 105 },
                  { label: 'V. Total',     align: 'right',  w: 105 },
                  { label: '',             align: 'center', w: 38 },
                ].map((h, i) => (
                  <th key={i} style={{
                    padding: '9px 10px', color: '#fff', fontWeight: 700,
                    fontSize: 11, letterSpacing: 0.8, textAlign: h.align,
                    borderRight: i < 6 ? '1px solid #1a3a7a' : 'none',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                    width: h.w || undefined,
                  }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => (
                <tr key={fila._id} style={{
                  borderBottom: '1px solid #d1d5db',
                  background: idx % 2 === 0 ? '#ffffff' : '#fef9c3',
                  transition: 'background .1s',
                }}>
                  <td style={{ padding: '7px 10px', fontSize: 12, textAlign: 'center',
                    borderRight: '1px solid #e5e7eb',
                    color: fila.descripcion && !fila.producto_id ? '#d97706' : C.textDim }}>
                    {fila.descripcion && !fila.producto_id
                      ? <span title="Producto manual — sin descuento de stock"><IcoWarn /></span>
                      : idx + 1}
                  </td>

                  {/* Código */}
                  <td style={{ padding: '4px 4px', borderRight: '1px solid #e5e7eb' }}>
                    <input
                      ref={el => { if (filaActiva === fila._id) autocompleteRef.current = el; }}
                      value={fila.codigo}
                      onChange={e => onCambioCodigo(fila._id, e.target.value, e)}
                      onFocus={e => {
                        if (fila.codigo.length >= 2) {
                          const pos = calcularPosicion(e);
                          setDropdownInitPos(pos);
                          buscarProductos(fila.codigo, fila._id);
                        }
                      }}
                      placeholder="Código"
                      style={{ ...celdaSt, width: '100%', background: 'transparent',
                        border: '1px solid transparent', borderRadius: 4 }}
                    />
                  </td>

                  {/* Descripción */}
                  <td style={{ padding: '4px 4px', borderRight: '1px solid #e5e7eb' }}>
                    <input
                      ref={el => { if (filaActiva === fila._id) autocompleteRef.current = el; }}
                      value={fila.descripcion}
                      onChange={e => onCambioDescripcion(fila._id, e.target.value, e)}
                      onFocus={e => {
                        if (fila.descripcion.length >= 2) {
                          const pos = calcularPosicion(e);
                          setDropdownInitPos(pos);
                          buscarProductos(fila.descripcion, fila._id);
                        }
                      }}
                      placeholder="Descripción del producto"
                      style={{ ...celdaSt, width: '100%', minWidth: 180, background: 'transparent',
                        border: '1px solid transparent', borderRadius: 4 }}
                    />
                  </td>

                  {/* Cantidad */}
                  <td style={{ padding: '4px 4px', borderRight: '1px solid #e5e7eb' }}>
                    <input type="number" value={fila.cantidad} min="1" step="1"
                      onChange={e => actualizarFila(fila._id, { cantidad: e.target.value }, true)}
                      onFocus={e => e.target.select()}
                      style={{ ...celdaSt, width: '100%', textAlign: 'center', background: 'transparent',
                        border: '1px solid transparent', borderRadius: 4 }} />
                  </td>

                  {/* V. Unitario */}
                  <td style={{ padding: '4px 4px', borderRight: '1px solid #e5e7eb' }}>
                    <input type="number" value={fila.precio} min="0" step="0.01"
                      onChange={e => actualizarFila(fila._id, { precio: e.target.value }, true)}
                      onFocus={e => e.target.select()}
                      style={{ ...celdaSt, width: '100%', textAlign: 'right', background: 'transparent',
                        border: '1px solid transparent', borderRadius: 4 }} />
                  </td>

                  <td style={{ padding: '7px 12px', textAlign: 'right', whiteSpace: 'nowrap',
                    borderRight: '1px solid #e5e7eb' }}>
                    <span style={{ color: parseFloat(fila.subtotal) > 0 ? '#111' : '#9ca3af',
                      fontWeight: 600, fontSize: 13 }}>
                      ${parseFloat(fila.subtotal).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                    <button onClick={() => eliminarFila(fila._id)}
                      style={{ background: 'none', border: 'none', color: '#d1d5db',
                        cursor: 'pointer', padding: 5, borderRadius: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = C.rojo; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#d1d5db'; }}>
                      <IcoTrash />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Filas vacías de relleno */}
              {Array.from({ length: Math.max(1, 8 - filas.length) }).map((_, i) => {
                const rowBg = (filas.length + i) % 2 === 0 ? '#ffffff' : '#fef9c3';
                const isFirstEmpty = i === 0;
                return (
                  <tr key={`empty-${i}`} style={{ background: rowBg, borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '7px 10px', borderRight: '1px solid #e5e7eb',
                      color: '#e5e7eb', fontSize: 12, textAlign: 'center' }}>{filas.length + i + 1}</td>
                    {isFirstEmpty ? (
                      <td colSpan={5} style={{ padding: '5px 8px', borderRight: '1px solid #e5e7eb' }}>
                        <button onClick={agregarFila}
                          data-agregar="true"
                          style={{ display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: '1px dashed #d1d5db', color: C.textDim,
                            borderRadius: 5, padding: '5px 14px', cursor: 'pointer', fontSize: 12,
                            transition: 'all .15s', width: '100%', justifyContent: 'flex-start' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1d4ed8'; e.currentTarget.style.color = '#1d4ed8'; e.currentTarget.style.background = '#eff6ff'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = C.textDim; e.currentTarget.style.background = 'none'; }}>
                          <IcoPlus /> Agregar producto
                        </button>
                      </td>
                    ) : (
                      <>
                        <td style={{ borderRight: '1px solid #e5e7eb', padding: '7px 10px' }}>&nbsp;</td>
                        <td style={{ borderRight: '1px solid #e5e7eb', padding: '7px 10px' }}>&nbsp;</td>
                        <td style={{ borderRight: '1px solid #e5e7eb', padding: '7px 10px' }}>&nbsp;</td>
                        <td style={{ borderRight: '1px solid #e5e7eb', padding: '7px 10px' }}>&nbsp;</td>
                        <td style={{ borderRight: '1px solid #e5e7eb', padding: '7px 10px', textAlign: 'right',
                          color: '#9ca3af', fontSize: 12 }}>0,00</td>
                      </>
                    )}
                    <td>&nbsp;</td>
                  </tr>
                );
              })}

              {/* Fila TOTAL */}
              <tr style={{ background: '#F5C400', borderTop: '2px solid #333', borderBottom: '2px solid #333' }}>
                <td colSpan={4} style={{ padding: '10px 12px', borderRight: '1px solid #d97706' }}></td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900,
                  fontSize: 13, color: '#111', textTransform: 'uppercase', letterSpacing: 1,
                  borderRight: '1px solid #d97706' }}>
                  TOTAL
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900,
                  fontSize: 16, color: '#111', borderRight: '1px solid #d97706' }}>
                  ${total.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* Barra de acciones */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: isMobile ? 'stretch' : 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 10 : 8,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '12px 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <button onClick={limpiarTodo}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'none',
            border: `1px solid ${C.border}`, color: C.textDim, borderRadius: 8,
            padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            transition: 'all .15s', width: isMobile ? '100%' : undefined }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.rojo; e.currentTarget.style.color = C.rojo; e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; e.currentTarget.style.background = 'none'; }}>
          <IcoClear /> Limpiar todo
        </button>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : undefined }}>
          <button onClick={imprimirTermica}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff',
              border: `1px solid #6b7280`, color: '#374151', borderRadius: 8,
              padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'all .15s', flex: isMobile ? '1 1 auto' : undefined }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#6b7280'; }}>
            <IcoThermal /> Térmica
          </button>

          <button onClick={abrirPDF}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff',
              border: `1px solid ${C.azul}`, color: C.azul, borderRadius: 8,
              padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'all .15s', flex: isMobile ? '1 1 auto' : undefined }}
            onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
            <IcoPDF /> {isMobile ? 'PDF' : 'Vista Previa PDF'}
          </button>

          <button onClick={tomarCaptura}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff',
              border: `1px solid #8b5cf6`, color: '#8b5cf6', borderRadius: 8,
              padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'all .15s', flex: isMobile ? '1 1 auto' : undefined }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
            <IcoCapture /> Captura
          </button>

          <button onClick={() => setModalGuardar(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: C.verde,
              border: 'none', color: '#fff', borderRadius: 8,
              padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'all .15s',
              flex: isMobile ? '1 1 auto' : undefined }}
            onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.verde; }}>
            <IcoSave /> Guardar
          </button>
        </div>
      </div>

      {/* Dropdown autocomplete — 2 columnas, ancho = ancho del input activo */}
      {filaActiva !== null && sugerencias.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top:  dropdownInitPos.top,
            left: dropdownInitPos.left,
            width: dropdownInitPos.dropWidth || 300,
            zIndex: 9999,
            background: '#fff',
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            maxHeight: dropdownInitPos.maxDropHeight || 380,
            overflowY: 'auto',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          }}
        >
          {/* Cabecera fija */}
          <div style={{
            padding: '6px 14px', borderBottom: `1px solid ${C.border}`,
            background: '#f9fafb', borderRadius: '12px 12px 0 0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'sticky', top: 0, zIndex: 1,
          }}>
            <span style={{ fontSize: 11, color: C.textDim, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase' }}>
              {sugerencias.length} producto{sugerencias.length !== 1 ? 's' : ''} encontrado{sugerencias.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: 10, color: C.textDim }}>clic para seleccionar</span>
          </div>
          {/* Grid responsive: 1 columna móvil, 2 columnas desktop */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            {sugerencias.map((p, i) => (
              <div key={p.id}
                onMouseDown={() => seleccionarProducto(filaActiva, p)}
                style={{
                  padding: '8px 12px', cursor: 'pointer',
                  borderBottom: `1px solid ${C.border}`,
                  borderRight: !isMobile && i % 2 === 0 ? `1px solid ${C.border}` : 'none',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 8, alignItems: 'center',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <span style={{ color: C.textSec, fontSize: 12.5,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.descripcion}
                </span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ color: C.amarillo, fontWeight: 700, fontSize: 11.5, whiteSpace: 'nowrap' }}>
                    ${(parseFloat(p.pvp1) * (1 + (parseFloat(p.iva) || 0) / 100)).toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap',
                    background: p.inventariable && parseFloat(p.stock) <= 0 ? '#fef2f2' : '#f0fdf4',
                    color: p.inventariable && parseFloat(p.stock) <= 0 ? C.rojo : C.verde,
                    fontWeight: 600,
                  }}>
                    {parseFloat(p.stock)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Vista Previa PDF — visor nativo con selector de formato */}
      {modalPDF && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', flexDirection: 'column', background: '#525659' }}>

          {/* Iframe visor PDF nativo */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {pdfGenerando && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: '#525659', gap: 16, zIndex: 1 }}>
                <div style={{ width: 44, height: 44, border: '3px solid #5f6368',
                  borderTopColor: '#8ab4f8', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#bdc1c6', fontSize: 14, fontWeight: 500 }}>Generando PDF…</span>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {pdfBlobUrl && (
              <iframe src={pdfBlobUrl} style={{ width: '100%', height: '100%', border: 'none' }}
                title={pdfNombre} />
            )}
          </div>

          {/* Barra inferior */}
          <div style={{
            background: '#29292b', borderTop: '1px solid #3c4043',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '10px 24px', flexShrink: 0, flexWrap: 'wrap',
          }}>
            {/* Selector formato en píldora — solo para PDF normal */}
            {!pdfEsTermica && (
            <div style={{
              display: 'flex', alignItems: 'center',
              background: '#2a2c2e', borderRadius: 20, padding: '3px',
              border: '1px solid #5f6368', gap: 2,
            }}>
              <span style={{ color: '#9aa0a6', fontSize: 11, fontWeight: 600,
                padding: '0 10px', whiteSpace: 'nowrap', letterSpacing: 0.4 }}>Formato</span>
              <div style={{ width: 1, height: 16, background: '#5f6368' }} />
              {[{ id: 1, label: 'PDF' }, { id: 2, label: 'Tabla' }].map(op => (
                <button key={op.id}
                  onClick={() => cambiarOpcionPDF(op.id)}
                  disabled={pdfGenerando}
                  style={{
                    background: pdfOpcion === op.id ? '#8ab4f8' : 'transparent',
                    border: 'none',
                    color: pdfOpcion === op.id ? '#202124' : '#9aa0a6',
                    borderRadius: 16, padding: '5px 16px', fontWeight: 700,
                    fontSize: 12, cursor: pdfGenerando ? 'not-allowed' : 'pointer',
                    transition: 'all .15s', whiteSpace: 'nowrap',
                    opacity: pdfGenerando ? 0.5 : 1,
                  }}>
                  {op.label}
                </button>
              ))}
            </div>
            )}

            {/* Descargar PDF */}
            <button onClick={descargarBlobPDF} disabled={pdfGenerando}
              style={{
                background: '#8ab4f8', border: 'none', color: '#202124',
                borderRadius: 20, padding: '8px 22px', fontWeight: 700,
                fontSize: 13, cursor: pdfGenerando ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: pdfGenerando ? 0.5 : 1, transition: 'background .15s',
              }}
              onMouseEnter={e => { if (!pdfGenerando) e.currentTarget.style.background = '#aecbfa'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#8ab4f8'; }}>
              <IcoDownload /> Descargar PDF
            </button>

            {/* Salir */}
            <button onClick={cerrarModalPDF}
              style={{
                background: '#c5221f', border: 'none',
                color: '#fff', borderRadius: 20, padding: '8px 22px',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'background .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#a50e0e'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#c5221f'; }}>
              Salir
            </button>
          </div>
        </div>
      )}

      {/* Modal confirmar guardar */}
      {modalGuardar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20,
            padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 32px)',
            width: '100%', maxWidth: 420, textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ width: 56, height: 56,
              background: idEdicion ? '#fef3c7' : (tipoNuevo === 'recibo' ? '#f0fdf4' : '#eff6ff'),
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              color: idEdicion ? C.amarillo : (tipoNuevo === 'recibo' ? C.verde : C.azul) }}>
              <IcoSave />
            </div>
            <h2 style={{ color: C.textPrimary, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              {idEdicion ? 'Guardar cambios' : `Guardar ${tipoNuevo === 'recibo' ? 'Nota de entrega' : 'Proforma'}`}
            </h2>
            <p style={{ color: C.textDim, fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
              {idEdicion
                ? <>Se actualizará el <strong style={{ color: tipoEdicion === 'recibo' ? C.verde : C.azul }}>
                    {tipoEdicion === 'recibo' ? 'Nota de entrega' : 'Proforma'}
                  </strong> existente con los nuevos datos.</>
                : tipoNuevo === 'recibo'
                  ? <>Se guardará como <strong style={{ color: C.verde }}>Nota de entrega</strong>. Se descontará stock inmediatamente.</>
                  : <>Se guardará como <strong style={{ color: C.azul }}>Proforma</strong>. No descuenta stock.</>
              }
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={guardar} disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: 8,
                  background: idEdicion ? C.amarillo : (tipoNuevo === 'recibo' ? C.verde : C.azul),
                  border: 'none', color: '#fff',
                  borderRadius: 12, padding: '14px 28px', fontWeight: 700,
                  fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}>
                <IcoSave /> {guardando ? 'Guardando...' : 'Confirmar'}
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

const celdaSt = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
  padding: '6px 9px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

export const generarHTMLTabla = ({ tipo, numero, cliente, fecha, notas, filas, subtotalBase, total, imgLocal }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${tipo} ${numero}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; padding: 36px 32px 20px; }
    @media print { body { margin: 0; padding: 12px; } }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
</head>
<body>
${generarHTMLCaptura({ tipo, numero, cliente, fecha, notas, filas, subtotalBase, total, imgLocal, pdf: true })}
</body>
</html>
`;

export const generarHTMLCaptura = ({ tipo, numero, cliente, fecha, notas, filas, subtotalBase, total, imgLocal, pdf = false }) => `
<div style="font-family:Arial,sans-serif;font-size:13px;color:#111;background:#fff;">
  <div style="display:flex;align-items:stretch;border:2px solid #333;">
    ${pdf
      ? `<div style="background:#F5C400;flex:1;padding:14px 20px;display:flex;align-items:center;gap:16px;min-width:0;overflow:hidden;">
          <div style="flex:none;">
            <div style="font-size:22px;font-weight:900;color:#111;text-transform:uppercase;letter-spacing:0.5px;">Ferreteria Carrión</div>
            <div style="font-size:11px;color:#333;margin-top:5px;line-height:1.8;"><strong>DIRECCIÓN:</strong> Chimbacalle, Av Napo y Salcedo<br/><strong>TELÉFONO:</strong> 0998024883 – 0984666022</div>
          </div>
          ${imgLocal ? `<div style="flex:1;display:flex;justify-content:center;align-items:center;overflow:hidden;"><img src="${imgLocal}" style="max-height:70px;max-width:220px;width:auto;height:auto;object-fit:fill;border-radius:6px;border:2px solid rgba(0,0,0,0.15);" /></div>` : ''}
        </div>`
      : `<div style="background:#F5C400;flex:1;padding:14px 20px;position:relative;overflow:hidden;">
          <div style="font-size:22px;font-weight:900;color:#111;text-transform:uppercase;letter-spacing:0.5px;">Ferreteria Carrión</div>
          <div style="font-size:11px;color:#333;margin-top:5px;line-height:1.8;"><strong>DIRECCIÓN:</strong> Chimbacalle, Av Napo y Salcedo<br/><strong>TELÉFONO:</strong> 0998024883 – 0984666022</div>
          ${imgLocal ? `<img src="${imgLocal}" style="position:absolute;left:60%;top:50%;transform:translate(-50%,-50%);height:calc(100% - 12px);width:260px;object-fit:fill;border-radius:6px;border:2px solid rgba(0,0,0,0.15);" />` : ''}
        </div>`
    }
    <div style="background:#0D111C;min-width:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 20px;gap:4px;">
      <div style="font-size:18px;font-weight:900;color:${(tipo?.toLowerCase() === 'recibo' || tipo?.toLowerCase() === 'nota de entrega') ? '#6ee7b7' : '#93c5fd'};text-transform:uppercase;letter-spacing:1px;">${(tipo || 'DOCUMENTO').toUpperCase()}</div>
      ${numero ? `<div style="font-size:12px;font-weight:700;color:${(tipo?.toLowerCase() === 'recibo' || tipo?.toLowerCase() === 'nota de entrega') ? '#6ee7b7' : '#93c5fd'};letter-spacing:0.5px;">${numero}</div>` : ''}
      <div style="font-size:11px;color:#64748b;margin-top:2px;">${fecha}</div>
    </div>
  </div>

  <div style="background:#fef3c7;border:1px solid #333;border-top:none;border-bottom:1px solid #aaa;padding:8px 16px;display:flex;gap:20px;align-items:center;">
    <span style="color:#6b7280;font-weight:700;font-size:12px;">CLIENTE:</span>
    <strong style="color:#111;font-size:13px;">${cliente}</strong>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #333;border-top:none;">
    <thead>
      <tr style="background:#0D111C;">
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:center;border-right:1px solid #1a3a7a;text-transform:uppercase;width:36px;">#</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:left;border-right:1px solid #1a3a7a;text-transform:uppercase;width:110px;">Código</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:left;border-right:1px solid #1a3a7a;text-transform:uppercase;">Descripción</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:center;border-right:1px solid #1a3a7a;text-transform:uppercase;width:80px;">Cant.</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:right;border-right:1px solid #1a3a7a;text-transform:uppercase;width:105px;">V. Unitario</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:right;text-transform:uppercase;width:105px;">V. Total</th>
      </tr>
    </thead>
    <tbody>
      ${filas.map((f, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#fef9c3'};border-bottom:1px solid #d1d5db;">
          <td style="padding:10px 10px;height:40px;color:#9ca3af;font-size:12px;text-align:center;border-right:1px solid #e5e7eb;">${idx + 1}</td>
          <td style="padding:10px 10px;height:40px;border-right:1px solid #e5e7eb;font-size:12px;">${f.codigo || ''}</td>
          <td style="padding:10px 10px;height:40px;border-right:1px solid #e5e7eb;">${f.descripcion}</td>
          <td style="padding:10px 10px;height:40px;text-align:center;border-right:1px solid #e5e7eb;">${parseFloat(f.cantidad)}</td>
          <td style="padding:10px 10px;height:40px;text-align:right;border-right:1px solid #e5e7eb;">$${parseFloat(f.precio).toFixed(2)}</td>
          <td style="padding:10px 10px;height:40px;text-align:right;font-weight:600;">$${(parseFloat(f.cantidad) * parseFloat(f.precio)).toFixed(2)}</td>
        </tr>
      `).join('')}
      ${Array.from({ length: Math.max(0, 8 - filas.length) }).map((_, i) => `
        <tr style="background:${(filas.length + i) % 2 === 0 ? '#ffffff' : '#fef9c3'};border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 10px;height:40px;color:#e5e7eb;font-size:12px;text-align:center;border-right:1px solid #e5e7eb;">${filas.length + i + 1}</td>
          <td style="height:40px;border-right:1px solid #e5e7eb;padding:10px 10px;"></td>
          <td style="height:40px;border-right:1px solid #e5e7eb;padding:10px 10px;"></td>
          <td style="height:40px;border-right:1px solid #e5e7eb;padding:10px 10px;"></td>
          <td style="height:40px;border-right:1px solid #e5e7eb;padding:10px 10px;"></td>
          <td style="height:40px;padding:10px 12px;text-align:right;color:#9ca3af;font-size:12px;">0,00</td>
        </tr>
      `).join('')}
      <tr style="background:#F5C400;border-top:2px solid #333;border-bottom:2px solid #333;">
        <td colspan="4" style="padding:10px 12px;border-right:1px solid #d97706;"></td>
        <td style="padding:10px 12px;text-align:right;font-weight:900;font-size:13px;color:#111;text-transform:uppercase;letter-spacing:1px;border-right:1px solid #d97706;">TOTAL</td>
        <td style="padding:10px 12px;text-align:right;font-weight:900;font-size:16px;color:#111;">$${total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
</div>
`;

export const generarHTMLTermica = ({ tipo, numero, cliente, fecha, notas, filas, subtotalBase, total }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${tipo} ${numero}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; }
    .ticket { width: 72mm; margin: 0 auto; padding: 4mm 3mm; }

    .header-box { border: 2px solid #000; display: flex; align-items: stretch; }
    .header-left { flex: 1; min-width: 0; padding: 7px 7px 7px 8px; border-right: 2px solid #000; overflow: hidden; }
    .header-right { width: 76px; min-width: 76px; max-width: 76px; padding: 6px 3px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; overflow: hidden; }
    .empresa-nombre { font-size: 8.5pt; font-weight: 900; text-transform: uppercase; color: #000; white-space: normal; word-break: break-word; line-height: 1.2; }
    .empresa-info   { font-size: 6.5pt; margin-top: 4px; line-height: 1.7; color: #000; font-weight: 700; }
    .doc-tipo  { font-size: 6pt; font-weight: 900; text-transform: uppercase; text-align: center; color: #000; word-break: break-word; line-height: 1.3; }
    .doc-num   { font-size: 6.5pt; font-weight: 900; text-align: center; color: #000; word-break: break-all; }
    .doc-fecha { font-size: 6pt; font-weight: 700; text-align: center; color: #000; }

    .cliente-box { border: 2px solid #000; border-top: none; padding: 4px 8px; font-size: 7.5pt; }
    .cliente-row { display: flex; gap: 4px; margin: 1px 0; align-items: center; }
    .cliente-label { font-weight: 900; min-width: 42px; color: #000; }

    table { width: 100%; border-collapse: collapse; font-size: 7.5pt; border: 2px solid #000; border-top: none; }
    .tbl-header th { color: #000; background: #fff; padding: 4px 4px; font-weight: 900; text-transform: uppercase; font-size: 7pt; border-bottom: 2px solid #000; border-right: 1px solid #000; }
    .tbl-header th:last-child { border-right: none; }
    .tbl-header th.r { text-align: right; }
    tbody tr td { padding: 3px 4px; border-bottom: 1px solid #ccc; vertical-align: top; color: #000; background: #fff; }
    .sin-sep td { border-bottom: none; }
    td.r { text-align: right; }
    td.desc { word-wrap: break-word; max-width: 90px; }
    .iva-label { font-size: 6.5pt; color: #000; font-weight: 900; }

    .totales-box { border: 2px solid #000; border-top: none; padding: 5px 8px; }
    .tot-sep   { border-top: 1px solid #000; margin: 3px 0; }
    .tot-row   { display: flex; justify-content: space-between; font-size: 7.5pt; font-weight: 700; color: #000; margin: 2px 0; }
    .tot-final { display: flex; justify-content: space-between; font-size: 13pt; font-weight: 900; color: #000; margin-top: 4px; }

    .sep { border-top: 1px dashed #000; margin: 5px 0; }
    .pie { font-size: 7pt; text-align: center; color: #000; font-weight: 700; line-height: 1.6; }
    @media print { body { margin: 0; } }
    @page { margin: 0; size: 80mm auto; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
</head>
<body>
<div class="ticket">

  <div class="header-box">
    <div class="header-left">
      <div class="empresa-nombre">Ferreteria Carrión</div>
      <div class="empresa-info">
        Chimbacalle, Av Napo y Salcedo<br>
        Tel: 0998024883 \u2013 0984666022
      </div>
    </div>
    <div class="header-right">
      <div class="doc-tipo">${tipo}</div>
      <div class="doc-num">N\u00b0 ${numero}</div>
      <div class="doc-fecha">${fecha}</div>
    </div>
  </div>

  <div class="cliente-box">
    <div class="cliente-row">
      <span class="cliente-label">CLIENTE:</span>
      <span>${cliente}</span>
    </div>
    ${notas ? `<div class="cliente-row"><span class="cliente-label">NOTAS:</span><span>${notas}</span></div>` : ''}
  </div>

  <table>
    <thead>
      <tr class="tbl-header">
        <th style="width:22px;text-align:center">CANT</th>
        <th>DESCRIPCI\u00d3N</th>
        <th class="r" style="width:36px">P.U.</th>
        <th class="r" style="width:40px">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${filas.map((f, i) => {
        const sub = parseFloat(f.cantidad) * parseFloat(f.precio);
        const esUltima = i === filas.length - 1;
        return `<tr${esUltima ? ' class="sin-sep"' : ''}>
          <td style="text-align:center;padding:3px 4px;">${parseFloat(f.cantidad)}</td>
          <td class="desc">${f.descripcion}</td>
          <td class="r">${parseFloat(f.precio).toFixed(2)}</td>
          <td class="r">${sub.toFixed(2)}</td>
        </tr>`;
      }).join('')}
      ${Array.from({ length: Math.max(0, 8 - filas.length) }).map(() => `<tr class="sin-sep" style="height:22px;">
        <td style="padding:3px 4px;"></td>
        <td class="desc"></td>
        <td class="r"></td>
        <td class="r"></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totales-box">
    <div class="tot-final"><span>TOTAL</span><span>$${total.toFixed(2)}</span></div>
  </div>

  <div class="sep"></div>
  <div class="pie">\u00a1Gracias por su compra!<br>Este documento no tiene valor tributario.</div>
</div>
</body>
</html>
`;