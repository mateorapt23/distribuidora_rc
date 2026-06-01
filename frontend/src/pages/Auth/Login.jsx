import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/config';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.usuario);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0D111C',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>

      {/* Grid puntitos de fondo */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, opacity: 0.15,
        backgroundImage: 'radial-gradient(circle, #3D5070 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 380,
        background: '#0b0f1a',
        border: '1px solid #1A2238',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>

        {/* Barrita tricolor */}
        <div style={{
          height: 3,
          background: 'linear-gradient(to right, #3b82f6, #F5C400, #10b981)',
        }} />

        <div style={{ padding: '36px 32px 32px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 32 }}>
            <div style={{
              width: 38, height: 38, flexShrink: 0,
              background: 'linear-gradient(135deg, #F5C400, #e6a800)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(245,196,0,0.25)',
            }}>
              <svg viewBox="0 0 16 16" style={{ width: 15, height: 15, stroke: '#0D111C', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round' }}>
                <path d="M2 8h12M8 2v12" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#F5C400', letterSpacing: '2.5px', textTransform: 'uppercase', lineHeight: 1 }}>
                Distribuidora
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF2', letterSpacing: '.2px', marginTop: 3 }}>
                Rodríguez-Carrión
              </div>
            </div>
          </div>

          {/* Título */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#E8EDF2' }}>
              Iniciar sesión
            </div>
            <div style={{ fontSize: 13, color: '#4a5568', marginTop: 4 }}>
              Ingresa tus credenciales para acceder
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderLeft: '3px solid #ef4444',
              color: '#fca5a5',
              padding: '9px 13px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Usuario */}
            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                color: '#3D5070', letterSpacing: '1.1px',
                textTransform: 'uppercase', marginBottom: 7,
              }}>
                Usuario
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: '#3D5070', display: 'flex', pointerEvents: 'none',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="tu usuario"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#141928', border: '1px solid #1A2238',
                    borderRadius: 9, padding: '11px 13px 11px 40px',
                    fontSize: 13, color: '#E8EDF2', outline: 'none',
                    transition: 'border-color .2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#F5C400'}
                  onBlur={e => e.target.style.borderColor = '#1A2238'}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={{
                  fontSize: 11, fontWeight: 700,
                  color: '#3D5070', letterSpacing: '1.1px',
                  textTransform: 'uppercase',
                }}>
                  Contraseña
                </label>
                {/* Link recuperar contraseña */}
                <Link
                  to="/recuperar-password"
                  style={{
                    fontSize: 11, color: '#F5C400', textDecoration: 'none',
                    fontWeight: 600, letterSpacing: 0.2,
                    transition: 'opacity .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: '#3D5070', display: 'flex', pointerEvents: 'none',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="tu contraseña"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#141928', border: '1px solid #1A2238',
                    borderRadius: 9, padding: '11px 40px 11px 40px',
                    fontSize: 13, color: '#E8EDF2', outline: 'none',
                    transition: 'border-color .2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#F5C400'}
                  onBlur={e => e.target.style.borderColor = '#1A2238'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#3D5070', display: 'flex', padding: 4,
                  }}
                >
                  {showPass
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando}
              style={{
                marginTop: 6,
                background: cargando ? '#a88a00' : 'linear-gradient(135deg, #F5C400, #e6a800)',
                border: 'none', borderRadius: 9, padding: '12px',
                fontSize: 13, fontWeight: 700, color: '#0D111C',
                cursor: cargando ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity .2s',
                boxShadow: '0 4px 18px rgba(245,196,0,0.22)',
              }}
              onMouseEnter={e => { if (!cargando) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {cargando ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #1A2238', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#2a3550', letterSpacing: '.4px' }}>
              Materiales de Construcción · Sistema interno
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #2a3550; }
      `}</style>
    </div>
  );
}