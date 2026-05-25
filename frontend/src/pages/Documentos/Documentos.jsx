import { useState } from 'react';
import Tabla from './Tabla';
import Guardados from './Guardados';

const C = {
  textPrimary: '#111827', textDim: '#9ca3af',
  border: '#e5e7eb', bg: '#f4f5fb', card: '#ffffff',
  amarillo: '#f59e0b', azul: '#3b82f6',
};

export default function Documentos() {
  const [seccion, setSeccion] = useState('tabla');
  const [refrescar, setRefrescar] = useState(0);

  const onGuardado = () => { setRefrescar(r => r + 1); setSeccion('guardados'); };

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: '0 28px', height: 80, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
            Proformas / Recibos
          </div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>
            Gestión de documentos de venta
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`,
        background: '#fff', padding: '0 28px' }}>
        {[
          { key: 'tabla',     label: 'Nueva' },
          { key: 'guardados', label: 'Guardados' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setSeccion(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 20px', fontSize: 13, fontWeight: 600,
              color: seccion === tab.key ? C.azul : C.textDim,
              borderBottom: seccion === tab.key
                ? `2px solid ${C.azul}` : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {seccion === 'tabla'
        ? <Tabla onGuardado={onGuardado} />
        : <Guardados key={refrescar} />
      }
    </div>
  );
}