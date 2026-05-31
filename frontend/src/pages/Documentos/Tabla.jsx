import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/config';
import { generarHTML } from './Guardados';

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
const IcoWarn = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

const filaVacia = () => ({
  _id: Math.random(), producto_id: null, codigo: '',
  descripcion: '', cantidad: 1, precio: 0, iva: 0, subtotal: 0,
});

export default function Tabla({ onGuardado, datosEdicion, onDatosUsados }) {
  const [cliente, setCliente]           = useState('');
  const [fecha, setFecha]               = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotas]               = useState('');
  const [filas, setFilas]               = useState([filaVacia()]);
  const [guardando, setGuardando]       = useState(false);
  const [modalGuardar, setModalGuardar] = useState(false);
  const [modalPDF, setModalPDF]         = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl]     = useState(null);
  const [pdfNombre, setPdfNombre]       = useState('');
  const [pdfGenerando, setPdfGenerando] = useState(false);
  const [idEdicion, setIdEdicion]       = useState(null);
  const [tipoEdicion, setTipoEdicion]   = useState(null);
  const [tipoNuevo, setTipoNuevo]       = useState('recibo');
  const [numeroPreview, setNumeroPreview] = useState('');
  const [numeroEdicion, setNumeroEdicion] = useState('');
  const tablaRef = useRef(null);
  const [sugerencias, setSugerencias]   = useState([]);
  const [filaActiva, setFilaActiva]     = useState(null);

  const autocompleteRef  = useRef(null);
  const dropdownRef      = useRef(null);
  const activeInputRef   = useRef(null);
  const busquedaTimeout  = useRef(null);

  // Obtener próximo número al montar y al cambiar tipoNuevo (solo cuando no hay edición)
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
      subtotal: (parseFloat(f.cantidad) || 0) * (parseFloat(f.precio) || 0) * (1 + (parseFloat(f.iva) || 0) / 100),
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
    setIdEdicion(null); setTipoEdicion(null); setTipoNuevo('recibo'); setNumeroEdicion('');
  };

  const subtotalBase = filas.reduce((s, f) => s + (parseFloat(f.cantidad) || 0) * (parseFloat(f.precio) || 0), 0);
  const totalIva     = filas.reduce((s, f) => {
    const base = (parseFloat(f.cantidad) || 0) * (parseFloat(f.precio) || 0);
    return s + base * ((parseFloat(f.iva) || 0) / 100);
  }, 0);
  const total = subtotalBase + totalIva;

  const guardar = async () => {
    const filasValidas = filas.filter(f => f.descripcion && parseFloat(f.cantidad) > 0);
    if (filasValidas.length === 0) { alert('Agrega al menos un producto'); return; }
    setGuardando(true);
    try {
      const detalle = filasValidas.map(f => ({
        producto_id: f.producto_id, descripcion: f.descripcion,
        cantidad: parseFloat(f.cantidad), precio: parseFloat(f.precio),
        iva: parseFloat(f.iva) || 0,
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

  const imprimirTermica = () => {
    if (filasValidas.length === 0) { alert('No hay productos para imprimir'); return; }
    const tipoDoc = (idEdicion ? tipoEdicion : tipoNuevo).toUpperCase();
    const numeroDoc = idEdicion ? numeroEdicion : (numeroPreview || 'BORRADOR');
    const html = generarHTMLTermica({
      tipo: tipoDoc, numero: numeroDoc,
      cliente: cliente || 'Consumidor Final', fecha, notas: notes,
      filas: filasValidas, subtotalBase, totalIva, total,
    });
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  const obtenerDatosHTML = () => {
    const tipoDoc   = (idEdicion ? tipoEdicion : tipoNuevo).toUpperCase();
    const numeroDoc = idEdicion ? numeroEdicion : (numeroPreview || 'BORRADOR');
    const nombre    = `${tipoDoc}-${numeroDoc}-${fecha}.pdf`;
    const html      = generarHTML({
      tipo: tipoDoc, numero: numeroDoc,
      cliente: cliente || 'Consumidor Final', fecha, notas: notes,
      filas: filasValidas, subtotalBase, totalIva, total,
    });
    return { html, nombre };
  };

  const abrirPDF = async () => {
    if (filasValidas.length === 0) { alert('No hay productos para previsualizar'); return; }
    const { html, nombre } = obtenerDatosHTML();
    setPdfNombre(nombre);
    setModalPDF(true);
    setPdfGenerando(true);
    setPdfBlobUrl(null);
    try {
      const res = await api.post('/documentos/pdf', { html, nombre }, { responseType: 'blob' });
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

  const cerrarModalPDF = () => {
    setModalPDF(false);
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
  };

  const descargarBlobPDF = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = pdfNombre;
    a.click();
  };

  const imprimirDesdeModal = () => {
    if (filasValidas.length === 0) { alert('No hay productos para imprimir'); return; }
    const { html } = obtenerDatosHTML();
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  const tomarCaptura = async () => {
    if (filasValidas.length === 0) { alert('No hay productos para capturar'); return; }

    const el = tablaRef.current;
    if (!el) return;

    const originalScrollX = window.scrollX;
    const originalScrollY = window.scrollY;

    try {
      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(script);
        await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
      }

      el.scrollIntoView({ block: 'start', inline: 'start' });

      // Ocultar campo de Notas dinámicamente antes de renderizar
      const contenedorNotas = el.querySelector('[data-capture-notas]');
      if (contenedorNotas) {
        contenedorNotas.style.display = 'none';
      }

      // Reemplazar el recuadro negro (tipo/número) con contenido estático limpio para la captura
      const headerTipo = el.querySelector('[data-capture-header-tipo]');
      let hijosOcultos = [];
      let divEstatico = null;
      if (headerTipo) {
        const tipoActual = idEdicion ? tipoEdicion : tipoNuevo;
        const numeroActual = idEdicion ? numeroEdicion : numeroPreview;
        const colorTipo = tipoActual === 'recibo' ? '#6ee7b7' : '#93c5fd';
        // Ocultar todos los hijos actuales
        hijosOcultos = Array.from(headerTipo.children);
        hijosOcultos.forEach(h => { h.style.display = 'none'; });
        // Insertar div estático limpio
        divEstatico = document.createElement('div');
        divEstatico.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;';
        divEstatico.innerHTML = `
          <div style="font-size:18px;font-weight:900;color:${colorTipo};text-transform:uppercase;letter-spacing:1px;">${(tipoActual || 'DOCUMENTO').toUpperCase()}</div>
          ${numeroActual ? `<div style="font-size:13px;font-weight:700;color:${colorTipo};letter-spacing:0.5px;">${numeroActual}</div>` : ''}
          <div style="font-size:11px;color:#94a3b8;">${fecha}</div>
        `;
        headerTipo.appendChild(divEstatico);
      }

      const inputsOriginales = Array.from(el.querySelectorAll('input'));
      const datosInputs = inputsOriginales.map(inp => {
        const comp = window.getComputedStyle(inp);
        let valor = inp.value || '';
        const esPlaceholder = !inp.value;
        if (inp.type === 'date' && inp.value) {
          const [y, m, d] = inp.value.split('-');
          valor = `${d}/${m}/${y}`;
        }
        return {
          valor: esPlaceholder ? (inp.placeholder || '') : valor,
          esPlaceholder,
          width: comp.width, height: comp.height,
          fontSize: comp.fontSize, fontFamily: comp.fontFamily,
          fontWeight: comp.fontWeight, color: comp.color,
          paddingLeft: comp.paddingLeft, paddingRight: comp.paddingRight,
          textAlign: comp.textAlign,
        };
      });

      const restauraciones = [];

      inputsOriginales.forEach((inp, idx) => {
        const d = datosInputs[idx];
        const div = document.createElement('div');
        div.textContent = d.valor;
        div.style.cssText = [
          'display:flex', 'align-items:center',
          `width:${d.width}`, `height:${d.height}`,
          `font-size:${d.fontSize}`, `font-family:${d.fontFamily}`,
          `font-weight:${d.fontWeight}`,
          `color:${d.esPlaceholder ? '#9ca3af' : d.color}`,
          'background:transparent', 'border:none',
          `padding-left:${d.paddingLeft}`, `padding-right:${d.paddingRight}`,
          'box-sizing:border-box', 'white-space:nowrap',
          'overflow:hidden', 'text-overflow:ellipsis',
          `text-align:${d.textAlign}`,
          d.textAlign === 'center' ? 'justify-content:center' : d.textAlign === 'right' ? 'justify-content:flex-end' : 'justify-content:flex-start'
        ].join(';');
        inp.parentNode.insertBefore(div, inp);
        inp.style.display = 'none';
        restauraciones.push(() => { inp.style.display = ''; div.remove(); });
      });

      const botonAgregar = el.querySelector('button[data-agregar]');
      const tdAgregar = botonAgregar?.closest('td');
      let restaurarAgregar = null;
      if (tdAgregar) {
        const colSpanOrig = tdAgregar.colSpan;
        const innerOrig   = tdAgregar.innerHTML;
        const celdas = [];
        for (let i = 0; i < 5; i++) {
          const td = document.createElement('td');
          td.style.cssText = 'padding:7px 10px;border-right:1px solid #e5e7eb;';
          celdas.push(td);
        }
        const tdZero = document.createElement('td');
        tdZero.textContent = '0,00';
        tdZero.style.cssText = 'padding:7px 12px;text-align:right;color:#9ca3af;font-size:12px;border-right:1px solid #e5e7eb;';
        celdas.push(tdZero);
        tdAgregar.replaceWith(...celdas);
        restaurarAgregar = () => {
          celdas[0].replaceWith(tdAgregar);
          celdas.slice(1).forEach(td => td.remove());
          tdAgregar.colSpan = colSpanOrig;
          tdAgregar.innerHTML = innerOrig;
        };
      }

      const botonesTrash = Array.from(el.querySelectorAll('button'));
      botonesTrash.forEach(b => { b.style.visibility = 'hidden'; });

      await new Promise(res => setTimeout(res, 50));

      const canvas = await window.html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      // Restaurar todo a la normalidad en la pantalla
      restauraciones.forEach(fn => fn());
      botonesTrash.forEach(b => { b.style.visibility = ''; });
      if (restaurarAgregar) restaurarAgregar();
      if (contenedorNotas) {
        contenedorNotas.style.display = 'flex';
      }
      if (headerTipo) {
        hijosOcultos.forEach(h => { h.style.display = ''; });
        if (divEstatico) divEstatico.remove();
      }

      window.scrollTo(originalScrollX, originalScrollY);

      const tipoCaptura = idEdicion ? tipoEdicion : tipoNuevo;
      const numeroCaptura = idEdicion ? (numeroEdicion || 'borrador') : (numeroPreview || 'borrador');
      const link = document.createElement('a');
      link.download = `${tipoCaptura}-${numeroCaptura}-${fecha}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

    } catch (err) {
      console.error(err);
      window.scrollTo(originalScrollX, originalScrollY);
      alert('Error al tomar captura: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Toast flotante — filas manuales */}
      {filas.some(f => f.descripcion && !f.producto_id) && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9000,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#92400e',
          boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
          maxWidth: 320, pointerEvents: 'none',
        }}>
          <span style={{ color: '#d97706', marginTop: 1, flexShrink: 0 }}><IcoWarn /></span>
          <span>
            <strong>Producto manual.</strong> Las filas con <span style={{ color: '#d97706' }}>⚠</span> no
            están en el inventario — <strong>no se descontará stock</strong> al guardar como recibo.
          </span>
        </div>
      )}

      {/* Tabla de productos — estilo Excel Ferretería */}
      <div ref={tablaRef} style={{ border: '2px solid #333', borderRadius: 2, overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>

        {/* Header empresa */}
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ background: '#F5C400', flex: 1, padding: '14px 20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Distribuidora RC
            </div>
            <div style={{ fontSize: 11, color: '#333', marginTop: 5, lineHeight: 1.8 }}>
              <strong>DIRECCIÓN:</strong> Chimbacalle, Av Napo y Salcedo<br/>
              <strong>TELÉFONO:</strong> 0998024883 – 0984666022
            </div>
          </div>
          <div data-capture-header-tipo="true" style={{ background: '#0D111C', minWidth: 200, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '14px 20px', gap: 6 }}>
            {idEdicion ? (
              /* MODO EDICIÓN: mostrar tipo + número, sin opción a cambiar */
              <>
                <div style={{ fontSize: 18, fontWeight: 900, color: tipoEdicion === 'recibo' ? '#6ee7b7' : '#93c5fd',
                  textTransform: 'uppercase', letterSpacing: 1 }}>
                  {tipoEdicion === 'recibo' ? 'RECIBO' : 'PROFORMA'}
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
                    { key: 'recibo',   label: 'RECIBO',   color: '#6ee7b7' },
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 2, minWidth: 180 }}>
            <span style={{ color: '#6b7280', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>CLIENTE:</span>
            <input value={cliente} onChange={e => setCliente(e.target.value)}
              placeholder="Consumidor Final"
              style={{ ...celdaSt, flex: 1, background: 'transparent', border: '1px solid #d97706',
                fontWeight: 700, fontSize: 13, color: '#111' }} />
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
                  { label: 'IVA %',        align: 'center', w: 72 },
                  { label: 'V. Total',     align: 'right',  w: 105 },
                  { label: '',             align: 'center', w: 38 },
                ].map((h, i) => (
                  <th key={i} style={{
                    padding: '9px 10px', color: '#fff', fontWeight: 700,
                    fontSize: 11, letterSpacing: 0.8, textAlign: h.align,
                    borderRight: i < 7 ? '1px solid #1a3a7a' : 'none',
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
                          calcularPosicion(e);
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
                          calcularPosicion(e);
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
                    <input type="number" value={fila.cantidad} min="0.01" step="0.01"
                      onChange={e => actualizarFila(fila._id, { cantidad: e.target.value }, true)}
                      style={{ ...celdaSt, width: '100%', textAlign: 'center', background: 'transparent',
                        border: '1px solid transparent', borderRadius: 4 }} />
                  </td>

                  {/* V. Unitario */}
                  <td style={{ padding: '4px 4px', borderRight: '1px solid #e5e7eb' }}>
                    <input type="number" value={fila.precio} min="0" step="0.01"
                      onChange={e => actualizarFila(fila._id, { precio: e.target.value }, true)}
                      onBlur={e => {
                        const iva = parseFloat(fila.iva) || 0;
                        if (iva > 0) {
                          const precioConIva = parseFloat(e.target.value);
                          if (!isNaN(precioConIva) && precioConIva > 0) {
                            const precioSinIva = precioConIva / (1 + iva / 100);
                            actualizarFila(fila._id, { precio: parseFloat(precioSinIva.toFixed(4)) }, true);
                          }
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') e.target.blur();
                      }}
                      style={{ ...celdaSt, width: '100%', textAlign: 'right', background: 'transparent',
                        border: '1px solid transparent', borderRadius: 4 }} />
                  </td>

                  {/* IVA % */}
                  <td style={{ padding: '4px 4px', borderRight: '1px solid #e5e7eb' }}>
                    <input type="number" value={fila.iva} min="0" max="100"
                      onChange={e => actualizarFila(fila._id, { iva: e.target.value }, true)}
                      style={{ ...celdaSt, width: '100%', textAlign: 'center', background: 'transparent',
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
                      <td colSpan={6} style={{ padding: '5px 8px', borderRight: '1px solid #e5e7eb' }}>
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
                        <td style={{ borderRight: '1px solid #e5e7eb', padding: '7px 10px' }}>&nbsp;</td>
                        <td style={{ borderRight: '1px solid #e5e7eb', padding: '7px 10px', textAlign: 'right',
                          color: '#9ca3af', fontSize: 12 }}>0,00</td>
                      </>
                    )}
                    <td>&nbsp;</td>
                  </tr>
                );
              })}

              {/* Subtotal / IVA */}
              {totalIva > 0 && <>
                <tr style={{ background: '#f9fafb', borderTop: '1px solid #d1d5db' }}>
                  <td colSpan={5} style={{ borderRight: '1px solid #e5e7eb' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', color: '#6b7280',
                    fontWeight: 600, fontSize: 12, borderRight: '1px solid #e5e7eb' }}>Subtotal:</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600,
                    fontSize: 13, color: '#374151', borderRight: '1px solid #e5e7eb' }}>
                    ${subtotalBase.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
                <tr style={{ background: '#f9fafb' }}>
                  <td colSpan={5} style={{ borderRight: '1px solid #e5e7eb' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', color: '#6b7280',
                    fontWeight: 600, fontSize: 12, borderRight: '1px solid #e5e7eb' }}>IVA:</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600,
                    fontSize: 13, color: '#374151', borderRight: '1px solid #e5e7eb' }}>
                    ${totalIva.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </>}

              {/* Fila TOTAL */}
              <tr style={{ background: '#F5C400', borderTop: '2px solid #333', borderBottom: '2px solid #333' }}>
                <td colSpan={5} style={{ padding: '10px 12px', borderRight: '1px solid #d97706' }}></td>
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
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '12px 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <button onClick={limpiarTodo}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none',
            border: `1px solid ${C.border}`, color: C.textDim, borderRadius: 8,
            padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.rojo; e.currentTarget.style.color = C.rojo; e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; e.currentTarget.style.background = 'none'; }}>
          <IcoClear /> Limpiar todo
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={imprimirTermica}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff',
              border: `1px solid #6b7280`, color: '#374151', borderRadius: 8,
              padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#6b7280'; }}>
            <IcoThermal /> Térmica
          </button>

          <button onClick={abrirPDF}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff',
              border: `1px solid ${C.azul}`, color: C.azul, borderRadius: 8,
              padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
            <IcoPDF /> Vista Previa PDF
          </button>

          <button onClick={tomarCaptura}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff',
              border: `1px solid #8b5cf6`, color: '#8b5cf6', borderRadius: 8,
              padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
            <IcoCapture /> Captura
          </button>

          <button onClick={() => setModalGuardar(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.verde,
              border: 'none', color: '#fff', borderRadius: 8,
              padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.verde; }}>
            <IcoSave /> Guardar
          </button>
        </div>
      </div>

      {/* Dropdown autocomplete */}
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

      {/* Modal Vista Previa PDF — visor nativo del navegador */}
      {modalPDF && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60,
          display: 'flex', flexDirection: 'column', background: '#525659' }}>

          {/* Iframe visor PDF nativo — ocupa todo menos barra inferior */}
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
              <iframe
                src={pdfBlobUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={pdfNombre}
              />
            )}
          </div>

          {/* Barra inferior estilo sistema de facturación */}
          <div style={{
            background: '#3c4043', borderTop: '1px solid #5f6368',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: '10px 24px', flexShrink: 0,
          }}>
            <button
              onClick={descargarBlobPDF}
              disabled={pdfGenerando}
              style={{
                background: '#1a73e8', border: 'none', color: '#fff',
                borderRadius: 6, padding: '10px 24px', fontWeight: 700,
                fontSize: 13, cursor: pdfGenerando ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: pdfGenerando ? 0.5 : 1, letterSpacing: 0.5,
                transition: 'background .15s',
              }}
              onMouseEnter={e => { if (!pdfGenerando) e.currentTarget.style.background = '#1557b0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1a73e8'; }}>
              <IcoDownload /> DESCARGAR PDF
            </button>
            <button
              onClick={cerrarModalPDF}
              style={{
                background: '#5f6368', border: 'none', color: '#e8eaed',
                borderRadius: 6, padding: '10px 28px', fontWeight: 700,
                fontSize: 13, cursor: 'pointer', letterSpacing: 0.5,
                transition: 'background .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#80868b'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#5f6368'; }}>
              S A L I R
            </button>
          </div>
        </div>
      )}

      {/* Modal confirmar guardar */}
      {modalGuardar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px',
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
              {idEdicion ? 'Guardar cambios' : `Guardar ${tipoNuevo === 'recibo' ? 'Recibo' : 'Proforma'}`}
            </h2>
            <p style={{ color: C.textDim, fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
              {idEdicion
                ? <>Se actualizará el <strong style={{ color: tipoEdicion === 'recibo' ? C.verde : C.azul }}>
                    {tipoEdicion === 'recibo' ? 'Recibo' : 'Proforma'}
                  </strong> existente con los nuevos datos.</>
                : tipoNuevo === 'recibo'
                  ? <>Se guardará como <strong style={{ color: C.verde }}>Recibo</strong>. Se descontará stock inmediatamente.</>
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

export const generarHTMLCaptura = ({ tipo, numero, cliente, fecha, notas, filas, subtotalBase, totalIva, total }) => `
<div style="font-family:Arial,sans-serif;font-size:13px;color:#111;background:#fff;">
  <div style="display:flex;align-items:stretch;border:2px solid #333;">
    <div style="background:#F5C400;flex:1;padding:14px 20px;">
      <div style="font-size:22px;font-weight:900;color:#111;text-transform:uppercase;letter-spacing:0.5px;">Distribuidora RC</div>
      <div style="font-size:11px;color:#333;margin-top:5px;line-height:1.8;">
        <strong>DIRECCIÓN:</strong> Chimbacalle, Av Napo y Salcedo<br/>
        <strong>TELÉFONO:</strong> 0998024883 – 0984666022
      </div>
    </div>
    <div style="background:#0D111C;min-width:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 20px;gap:4px;">
      <div style="font-size:18px;font-weight:900;color:${tipo?.toLowerCase() === 'recibo' ? '#6ee7b7' : '#93c5fd'};text-transform:uppercase;letter-spacing:1px;">${(tipo || 'DOCUMENTO').toUpperCase()}</div>
      ${numero ? `<div style="font-size:12px;font-weight:700;color:${tipo?.toLowerCase() === 'recibo' ? '#6ee7b7' : '#93c5fd'};letter-spacing:0.5px;">${numero}</div>` : ''}
      <div style="font-size:11px;color:#64748b;margin-top:2px;">${fecha}</div>
    </div>
  </div>

  <div style="background:#fef3c7;border:1px solid #333;border-top:none;border-bottom:1px solid #aaa;padding:8px 16px;display:flex;gap:20px;align-items:center;">
    <span style="color:#6b7280;font-weight:700;font-size:12px;">CLIENTE:</span>
    <strong style="color:#111;font-size:13px;">${cliente}</strong>
    <span style="color:#6b7280;font-weight:700;font-size:12px;">FECHA:</span>
    <strong style="color:#111;font-size:13px;">${fecha}</strong>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #333;border-top:none;">
    <thead>
      <tr style="background:#0D111C;">
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:center;border-right:1px solid #1a3a7a;text-transform:uppercase;width:36px;">#</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:left;border-right:1px solid #1a3a7a;text-transform:uppercase;width:110px;">Código</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:left;border-right:1px solid #1a3a7a;text-transform:uppercase;">Descripción</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:center;border-right:1px solid #1a3a7a;text-transform:uppercase;width:80px;">Cant.</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:right;border-right:1px solid #1a3a7a;text-transform:uppercase;width:105px;">V. Unitario</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:center;border-right:1px solid #1a3a7a;text-transform:uppercase;width:72px;">IVA %</th>
        <th style="padding:9px 10px;color:#fff;font-weight:700;font-size:11px;letter-spacing:0.8px;text-align:right;text-transform:uppercase;width:105px;">V. Total</th>
      </tr>
    </thead>
    <tbody>
      ${filas.map((f, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#fef9c3'};border-bottom:1px solid #d1d5db;">
          <td style="padding:7px 10px;color:#9ca3af;font-size:12px;text-align:center;border-right:1px solid #e5e7eb;">${idx + 1}</td>
          <td style="padding:7px 10px;border-right:1px solid #e5e7eb;font-family:monospace;font-size:12px;">${f.codigo || ''}</td>
          <td style="padding:7px 10px;border-right:1px solid #e5e7eb;">${f.descripcion}</td>
          <td style="padding:7px 10px;text-align:center;border-right:1px solid #e5e7eb;">${parseFloat(f.cantidad)}</td>
          <td style="padding:7px 10px;text-align:right;border-right:1px solid #e5e7eb;">$${parseFloat(f.precio).toFixed(2)}</td>
          <td style="padding:7px 10px;text-align:center;border-right:1px solid #e5e7eb;">${parseFloat(f.iva || 0)}%</td>
          <td style="padding:7px 10px;text-align:right;font-weight:600;">$${parseFloat(f.subtotal || 0).toFixed(2)}</td>
        </tr>
      `).join('')}
      ${Array.from({ length: Math.max(0, 8 - filas.length) }).map((_, i) => `
        <tr style="background:${(filas.length + i) % 2 === 0 ? '#ffffff' : '#fef9c3'};border-bottom:1px solid #e5e7eb;">
          <td style="padding:7px 10px;color:#e5e7eb;font-size:12px;text-align:center;border-right:1px solid #e5e7eb;">${filas.length + i + 1}</td>
          <td style="border-right:1px solid #e5e7eb;padding:7px 10px;"></td>
          <td style="border-right:1px solid #e5e7eb;padding:7px 10px;"></td>
          <td style="border-right:1px solid #e5e7eb;padding:7px 10px;"></td>
          <td style="border-right:1px solid #e5e7eb;padding:7px 10px;"></td>
          <td style="border-right:1px solid #e5e7eb;padding:7px 10px;"></td>
          <td style="padding:7px 12px;text-align:right;color:#9ca3af;font-size:12px;">0,00</td>
        </tr>
      `).join('')}
      ${totalIva > 0 ? `
        <tr style="background:#f9fafb;border-top:1px solid #d1d5db;">
          <td colspan="5" style="border-right:1px solid #e5e7eb;"></td>
          <td style="padding:6px 12px;text-align:right;color:#6b7280;font-weight:600;font-size:12px;border-right:1px solid #e5e7eb;">Subtotal:</td>
          <td style="padding:6px 12px;text-align:right;font-weight:600;font-size:13px;color:#374151;">$${subtotalBase.toFixed(2)}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td colspan="5" style="border-right:1px solid #e5e7eb;"></td>
          <td style="padding:6px 12px;text-align:right;color:#6b7280;font-weight:600;font-size:12px;border-right:1px solid #e5e7eb;">IVA:</td>
          <td style="padding:6px 12px;text-align:right;font-weight:600;font-size:13px;color:#374151;">$${totalIva.toFixed(2)}</td>
        </tr>
      ` : ''}
      <tr style="background:#F5C400;border-top:2px solid #333;border-bottom:2px solid #333;">
        <td colspan="5" style="padding:10px 12px;border-right:1px solid #d97706;"></td>
        <td style="padding:10px 12px;text-align:right;font-weight:900;font-size:13px;color:#111;text-transform:uppercase;letter-spacing:1px;border-right:1px solid #d97706;">TOTAL</td>
        <td style="padding:10px 12px;text-align:right;font-weight:900;font-size:16px;color:#111;">$${total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
</div>
`;

export const generarHTMLTermica = ({ tipo, numero, cliente, fecha, notas, filas, subtotalBase, totalIva, total }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${tipo} ${numero}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; }
    .ticket { width: 72mm; margin: 0 auto; padding: 4mm 3mm; }
    .header-box { background: #000; color: #fff; padding: 6px 8px; margin-bottom: 0; border: 1px solid #000; }
    .empresa-nombre { font-size: 13pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .empresa-info   { font-size: 7pt; margin-top: 3px; line-height: 1.5; color: #ddd; }
    .doc-box { border: 1px solid #000; border-top: none; padding: 5px 8px; background: #f5f5f5; }
    .doc-tipo { font-size: 11pt; font-weight: 900; text-transform: uppercase; text-align: center; }
    .doc-num  { font-size: 8pt; text-align: center; color: #333; margin-top: 1px; }
    .doc-fecha { font-size: 7pt; text-align: center; color: #555; margin-top: 1px; }
    .cliente-box { border: 1px solid #000; border-top: none; padding: 4px 8px; font-size: 7.5pt; }
    .cliente-row { display: flex; gap: 4px; margin: 1px 0; }
    .cliente-label { font-weight: 700; min-width: 42px; }
    .sep { border-top: 1px dashed #000; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
    .tbl-header { background: #000; }
    .tbl-header th { color: #fff; padding: 3px 4px; font-weight: 700; text-transform: uppercase; font-size: 7pt; border-right: 1px solid #444; }
    .tbl-header th:last-child { border-right: none; }
    .tbl-header th.r { text-align: right; }
    tbody tr td { padding: 3px 4px; border-bottom: 1px dotted #ccc; vertical-align: top; }
    tbody tr:nth-child(even) { background: #f9f9f9; }
    td.r { text-align: right; }
    td.desc { word-wrap: break-word; max-width: 90px; }
    .totales-box { border: 1px solid #000; border-top: 2px solid #000; padding: 4px 8px; margin-top: 0; }
    .tot-row { display: flex; justify-content: space-between; font-size: 7.5pt; margin: 2px 0; }
    .tot-final { display: flex; justify-content: space-between; font-size: 13pt; font-weight: 900; border-top: 1px solid #000; padding-top: 3px; margin-top: 3px; }
    .pie { font-size: 7pt; text-align: center; margin-top: 6px; color: #555; line-height: 1.5; }
    @media print { body { margin: 0; } }
    @page { margin: 0; size: 80mm auto; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
</head>
<body>
<div class="ticket">
  <div class="header-box">
    <div class="empresa-nombre">Distribuidora RC</div>
    <div class="empresa-info">Chimbacalle, Av Napo y Salcedo<br>Tel: 0998024883 – 0984666022</div>
  </div>

  <div class="doc-box">
    <div class="doc-tipo">${tipo}</div>
    <div class="doc-num">N° ${numero}</div>
    <div class="doc-fecha">${fecha}</div>
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
        <th style="width:22px">CANT</th>
        <th>DESCRIPCIÓN</th>
        <th class="r" style="width:36px">P.U.</th>
        <th class="r" style="width:40px">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${filas.map(f => {
        const sub = parseFloat(f.cantidad) * parseFloat(f.precio) * (1 + (parseFloat(f.iva) || 0) / 100);
        return `<tr>
          <td class="r">${parseFloat(f.cantidad)}</td>
          <td class="desc">${f.descripcion}${parseFloat(f.iva) > 0 ? `<br><span style="font-size:6.5pt;color:#666">IVA ${parseFloat(f.iva)}%</span>` : ''}</td>
          <td class="r">${parseFloat(f.precio).toFixed(2)}</td>
          <td class="r">${sub.toFixed(2)}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="totales-box">
    ${totalIva > 0 ? `
      <div class="tot-row"><span>SUBTOTAL SIN IVA:</span><span>$${subtotalBase.toFixed(2)}</span></div>
      <div class="tot-row"><span>IVA:</span><span>$${totalIva.toFixed(2)}</span></div>
    ` : ''}
    <div class="tot-final"><span>TOTAL</span><span>$${total.toFixed(2)}</span></div>
  </div>
</div>
</body>
</html>
`;