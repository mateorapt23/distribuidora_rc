import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/config';

// Reutiliza los mismos estilos visuales del Login
const S = {
  bg: '#0D111C',
  card: '#0b0f1a',
  border: '#1A2238',
  inputBg: '#141928',
  gold: '#F5C400',
  goldDark: '#e6a800',
  text: '#E8EDF2',
  textDim: '#4a5568',
  textDimmer: '#2a3550',
  verde: '#10b981',
  rojo: '#ef4444',
  rojoBg: 'rgba(239,68,68,0.08)',
  rojoBorder: 'rgba(239,68,68,0.2)',
};

const inputStyle = (focused) => ({
  width: '100%', boxSizing: 'border-box',
  background: S.inputBg,
  border: `1px solid ${focused ? S.gold : S.border}`,
  borderRadius: 9,
  padding: '11px 13px 11px 40px',
  fontSize: 13, color: S.text,
  outline: 'none',
  transition: 'border-color .2s',
});

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#3D5070', letterSpacing: '1.1px',
  textTransform: 'uppercase', marginBottom: 7,
};

// ── Iconos ────────────────────────────────────────────────────────────────────
const IcoUser   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoKey    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const IcoLock   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcoArrow  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const IcoBack   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
const IcoCheck  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoSpin   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IcoAlert  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

// ── Componentes internos ──────────────────────────────────────────────────────
const Alerta = ({ mensaje, tipo = 'error' }) => {
  const esError = tipo === 'error';
  return (
    <div style={{
      background: esError ? S.rojoBg : 'rgba(16,185,129,0.08)',
      border: `1px solid ${esError ? S.rojoBorder : 'rgba(16,185,129,0.2)'}`,
      borderLeft: `3px solid ${esError ? S.rojo : S.verde}`,
      color: esError ? '#fca5a5' : '#6ee7b7',
      padding: '9px 13px', borderRadius: 8, fontSize: 13,
      marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <IcoAlert /> {mensaje}
    </div>
  );
};

const CampoInput = ({ label, icon, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
        color: '#3D5070', display: 'flex', pointerEvents: 'none' }}>
        {icon}
      </div>
      {children}
    </div>
  </div>
);

const BtnPrimario = ({ onClick, disabled, cargando, children }) => (
  <button
    onClick={onClick}
    disabled={disabled || cargando}
    style={{
      marginTop: 6,
      background: (disabled || cargando) ? '#a88a00' : `linear-gradient(135deg, ${S.gold}, ${S.goldDark})`,
      border: 'none', borderRadius: 9, padding: '12px',
      fontSize: 13, fontWeight: 700, color: '#0D111C',
      cursor: (disabled || cargando) ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: '100%', transition: 'opacity .2s',
      boxShadow: '0 4px 18px rgba(245,196,0,0.22)',
    }}
    onMouseEnter={e => { if (!disabled && !cargando) e.currentTarget.style.opacity = '0.88'; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
  >
    {cargando ? <><IcoSpin /> Procesando...</> : children}
  </button>
);

// ── Indicador de pasos ────────────────────────────────────────────────────────
const Pasos = ({ actual }) => {
  const pasos = ['Usuario', 'Código', 'Contraseña'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 0, marginBottom: 28 }}>
      {pasos.map((p, i) => {
        const num = i + 1;
        const activo = num === actual;
        const hecho  = num < actual;
        return (
          <div key={p} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: hecho ? S.verde : activo ? S.gold : S.border,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                color: hecho ? '#fff' : activo ? '#0D111C' : '#3D5070',
                transition: 'all .3s',
              }}>
                {hecho ? <IcoCheck /> : num}
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: activo ? S.gold : hecho ? S.verde : '#3D5070' }}>
                {p}
              </span>
            </div>
            {i < pasos.length - 1 && (
              <div style={{
                width: 40, height: 1, margin: '0 4px', marginBottom: 18,
                background: num < actual ? S.verde : S.border,
                transition: 'background .3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────────────────────
export default function RecuperarPassword() {
  const navigate = useNavigate();

  const [paso, setPaso]           = useState(1);
  const [username, setUsername]   = useState('');
  const [codigo, setCodigo]       = useState('');
  const [pass1, setPass1]         = useState('');
  const [pass2, setPass2]         = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState('');
  const [exito, setExito]         = useState('');

  // Estados de focus para los inputs
  const [focusUser, setFocusUser]   = useState(false);
  const [focusCod, setFocusCod]     = useState(false);
  const [focusP1, setFocusP1]       = useState(false);
  const [focusP2, setFocusP2]       = useState(false);

  const limpiar = () => { setError(''); setExito(''); };

  // ── Paso 1: Solicitar código ──
  const solicitarCodigo = async () => {
    limpiar();
    if (!username.trim()) { setError('Ingresa tu nombre de usuario'); return; }
    setCargando(true);
    try {
      await api.post('/auth/recuperar', { username: username.trim() });
      setExito('Si tu usuario tiene email registrado, recibirás el código en unos segundos.');
      setPaso(2);
    } catch {
      setError('Error al enviar el código. Intenta más tarde.');
    } finally {
      setCargando(false);
    }
  };

  // ── Paso 2: Verificar código ──
  const verificarCodigo = async () => {
    limpiar();
    if (codigo.length !== 6) { setError('El código debe tener 6 dígitos'); return; }
    setCargando(true);
    try {
      await api.post('/auth/verificar-codigo', { username: username.trim(), codigo });
      setExito('');
      setPaso(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto o expirado');
    } finally {
      setCargando(false);
    }
  };

  // ── Paso 3: Nueva contraseña ──
  const cambiarPassword = async () => {
    limpiar();
    if (pass1.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (pass1 !== pass2)  { setError('Las contraseñas no coinciden'); return; }
    setCargando(true);
    try {
      await api.post('/auth/nueva-password', {
        username: username.trim(), codigo, nuevaPassword: pass1,
      });
      setPaso(4); // paso de éxito
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  };

  // ── Pantalla de éxito final ──
  if (paso === 4) {
    return (
      <Contenedor>
        <Logo />
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(16,185,129,0.12)',
            border: `2px solid ${S.verde}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            color: S.verde,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: S.text, marginBottom: 8 }}>
            ¡Contraseña actualizada!
          </div>
          <div style={{ fontSize: 13, color: S.textDim, marginBottom: 28, lineHeight: 1.6 }}>
            Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </div>
          <BtnPrimario onClick={() => navigate('/login')}>
            Ir al login <IcoArrow />
          </BtnPrimario>
        </div>
      </Contenedor>
    );
  }

  return (
    <Contenedor>
      <Logo />

      {/* Título */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: S.text }}>
          Recuperar contraseña
        </div>
        <div style={{ fontSize: 13, color: S.textDim, marginTop: 4 }}>
          {paso === 1 && 'Ingresa tu usuario para recibir un código'}
          {paso === 2 && 'Revisa tu email e ingresa el código de 6 dígitos'}
          {paso === 3 && 'Elige una nueva contraseña segura'}
        </div>
      </div>

      <Pasos actual={paso} />

      {error && <Alerta mensaje={error} tipo="error" />}
      {exito && <Alerta mensaje={exito} tipo="exito" />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Paso 1 ── */}
        {paso === 1 && (
          <>
            <CampoInput label="Usuario" icon={<IcoUser />}>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && solicitarCodigo()}
                placeholder="tu usuario"
                style={inputStyle(focusUser)}
                onFocus={() => setFocusUser(true)}
                onBlur={() => setFocusUser(false)}
              />
            </CampoInput>
            <BtnPrimario onClick={solicitarCodigo} cargando={cargando}>
              Enviar código <IcoArrow />
            </BtnPrimario>
          </>
        )}

        {/* ── Paso 2 ── */}
        {paso === 2 && (
          <>
            <CampoInput label="Código de 6 dígitos" icon={<IcoKey />}>
              <input
                type="text"
                value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verificarCodigo()}
                placeholder="123456"
                maxLength={6}
                style={{
                  ...inputStyle(focusCod),
                  letterSpacing: '6px', fontSize: 18, fontWeight: 700,
                  textAlign: 'center', paddingLeft: 13,
                }}
                onFocus={() => setFocusCod(true)}
                onBlur={() => setFocusCod(false)}
              />
            </CampoInput>
            <div style={{ fontSize: 11, color: S.textDim, textAlign: 'center', marginTop: -8 }}>
              El código expira en 15 minutos
            </div>
            <BtnPrimario onClick={verificarCodigo} cargando={cargando}>
              Verificar código <IcoArrow />
            </BtnPrimario>
            <button
              onClick={() => { limpiar(); setPaso(1); }}
              style={{ background: 'none', border: 'none', color: '#3D5070',
                fontSize: 12, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <IcoBack /> Volver
            </button>
          </>
        )}

        {/* ── Paso 3 ── */}
        {paso === 3 && (
          <>
            <CampoInput label="Nueva contraseña" icon={<IcoLock />}>
              <input
                type={showPass ? 'text' : 'password'}
                value={pass1}
                onChange={e => setPass1(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={inputStyle(focusP1)}
                onFocus={() => setFocusP1(true)}
                onBlur={() => setFocusP1(false)}
              />
            </CampoInput>
            <CampoInput label="Confirmar contraseña" icon={<IcoLock />}>
              <input
                type={showPass ? 'text' : 'password'}
                value={pass2}
                onChange={e => setPass2(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && cambiarPassword()}
                placeholder="Repite la contraseña"
                style={inputStyle(focusP2)}
                onFocus={() => setFocusP2(true)}
                onBlur={() => setFocusP2(false)}
              />
            </CampoInput>
            {/* Mostrar/ocultar contraseña */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: S.textDim, cursor: 'pointer', marginTop: -8 }}>
              <input type="checkbox" checked={showPass}
                onChange={e => setShowPass(e.target.checked)}
                style={{ cursor: 'pointer' }} />
              Mostrar contraseñas
            </label>
            <BtnPrimario onClick={cambiarPassword} cargando={cargando}>
              Guardar contraseña <IcoCheck />
            </BtnPrimario>
          </>
        )}
      </div>

      {/* Volver al login */}
      {paso !== 2 && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${S.border}`, textAlign: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: '#3D5070',
              fontSize: 12, cursor: 'pointer', display: 'inline-flex',
              alignItems: 'center', gap: 6 }}>
            <IcoBack /> Volver al login
          </button>
        </div>
      )}
    </Contenedor>
  );
}

// ── Layout compartido ─────────────────────────────────────────────────────────
function Contenedor({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: S.bg,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* Grid puntitos de fondo */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.15,
        backgroundImage: 'radial-gradient(circle, #3D5070 1px, transparent 1px)',
        backgroundSize: '28px 28px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: 400,
        background: S.card, border: `1px solid ${S.border}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>

        {/* Barrita tricolor */}
        <div style={{ height: 3, background: 'linear-gradient(to right, #3b82f6, #F5C400, #10b981)' }} />

        <div style={{ padding: '36px 32px 32px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #2a3550; }
      `}</style>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 32 }}>
      <div style={{ width: 38, height: 38, flexShrink: 0,
        background: 'linear-gradient(135deg, #F5C400, #e6a800)', borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(245,196,0,0.25)' }}>
        <svg viewBox="0 0 16 16" style={{ width: 15, height: 15, stroke: '#0D111C',
          strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round' }}>
          <path d="M2 8h12M8 2v12" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#F5C400',
          letterSpacing: '2.5px', textTransform: 'uppercase', lineHeight: 1 }}>
          Distribuidora
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: S.text,
          letterSpacing: '.2px', marginTop: 3 }}>
          Rodríguez-Carrión
        </div>
      </div>
    </div>
  );
}