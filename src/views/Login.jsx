import React, { useState } from 'react';
import { Dumbbell, ArrowRight, ShieldCheck } from 'lucide-react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.api) {
      setError('Error: Ejecuta la aplicación a través de Electron ("npm run electron")');
      return;
    }
    setLoading(true);
    try {
      const user = await window.api.login({ username, password });
      if (user) {
        onLogin(user);
      } else {
        setError('Credenciales incorrectas o usuario inactivo');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con la base de datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="login-logo-icon">
            <Dumbbell size={36} strokeWidth={2.4} />
          </div>
          <h1>GymFlash</h1>
          <p>Control de Acceso y Gestión de Socios</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <md-outlined-text-field
            label="Usuario o Correo"
            value={username}
            onInput={(e) => setUsername(e.target.value)}
            required
          >
            <md-icon slot="leading-icon">person</md-icon>
          </md-outlined-text-field>

          <md-outlined-text-field
            label="Contraseña"
            type="password"
            value={password}
            onInput={(e) => setPassword(e.target.value)}
            required
          >
            <md-icon slot="leading-icon">lock</md-icon>
          </md-outlined-text-field>

          {error && <div className="login-error">{error}</div>}

          <md-filled-button type="submit" disabled={loading} style={{ marginTop: '12px', width: '100%' }}>
            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
            <ArrowRight size={18} slot="icon" />
          </md-filled-button>
        </form>

        <div className="login-hint">
          Usuario por defecto: <code>admin</code> / Contraseña: <code>admin</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
