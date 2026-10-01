import React, { useState } from 'react';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import AccessControl from './views/AccessControl';
import Clients from './views/Clients';
import Memberships from './views/Memberships';
import Contracts from './views/Contracts';
import Payments from './views/Payments';
import Users from './views/Users';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Users as UsersIcon, 
  Award, 
  CalendarCheck, 
  DollarSign, 
  Shield, 
  LogOut, 
  Dumbbell 
} from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [preselectedClientId, setPreselectedClientId] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveView('dashboard');
    setPreselectedClientId(null);
  };

  const handleAssignMembership = (clientId) => {
    setPreselectedClientId(clientId);
    setActiveView('contracts');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': 
        return <Dashboard onNavigate={(view) => setActiveView(view)} />;
      case 'access': 
        return <AccessControl currentUser={user} />;
      case 'clients': 
        return <Clients onAssignMembership={handleAssignMembership} />;
      case 'memberships': 
        return <Memberships />;
      case 'contracts': 
        return <Contracts preselectedClientId={preselectedClientId} currentUser={user} />;
      case 'payments': 
        return <Payments currentUser={user} />;
      case 'users': 
        return <Users currentUser={user} />;
      default: 
        return <Dashboard onNavigate={(view) => setActiveView(view)} />;
    }
  };

  const getTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Panel Principal';
      case 'access': return 'Terminal de Control de Acceso';
      case 'clients': return 'Socios del Gimnasio';
      case 'memberships': return 'Planes y Membresías';
      case 'contracts': return 'Suscripciones y Contratos';
      case 'payments': return 'Caja y Pagos';
      case 'users': return 'Personal y Usuarios';
      default: return 'GymFlash';
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-badge">
            <Dumbbell size={24} strokeWidth={2.4} />
          </div>
          <div className="brand-text">
            <h1>GymFlash</h1>
            <span>Fitness Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Operaciones Diarias</div>
          <button 
            onClick={() => setActiveView('dashboard')} 
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>

          <button 
            onClick={() => setActiveView('access')} 
            className={`nav-item ${activeView === 'access' ? 'active' : ''}`}
          >
            <ShieldCheck size={20} /> Control de Acceso
          </button>

          <div className="nav-section-title">Gestión de Gimnasio</div>
          <button 
            onClick={() => { setPreselectedClientId(null); setActiveView('clients'); }} 
            className={`nav-item ${activeView === 'clients' ? 'active' : ''}`}
          >
            <UsersIcon size={20} /> Socios
          </button>

          <button 
            onClick={() => setActiveView('memberships')} 
            className={`nav-item ${activeView === 'memberships' ? 'active' : ''}`}
          >
            <Award size={20} /> Membresías
          </button>

          <button 
            onClick={() => setActiveView('contracts')} 
            className={`nav-item ${activeView === 'contracts' ? 'active' : ''}`}
          >
            <CalendarCheck size={20} /> Suscripciones
          </button>

          <button 
            onClick={() => setActiveView('payments')} 
            className={`nav-item ${activeView === 'payments' ? 'active' : ''}`}
          >
            <DollarSign size={20} /> Caja y Pagos
          </button>

          {user.kind === 1 && (
            <>
              <div className="nav-section-title">Sistema</div>
              <button 
                onClick={() => setActiveView('users')} 
                className={`nav-item ${activeView === 'users' ? 'active' : ''}`}
              >
                <Shield size={20} /> Personal / Usuarios
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-title">
            <h2>{getTitle()}</h2>
          </div>
          <div className="user-profile">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></span>
            <span>{user.name} ({user.kind === 1 ? 'Admin' : 'Recepción'})</span>
          </div>
        </header>

        <div className="view-container">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App;
