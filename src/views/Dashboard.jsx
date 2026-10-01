import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Activity, Award, UserCheck, AlertTriangle, ArrowUpRight, Clock } from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    activeClients: 0,
    totalClients: 0,
    monthIncome: 0,
    todayCheckIns: 0,
  });
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [recentControls, setRecentControls] = useState([]);
  const [popularPlans, setPopularPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!window.api) return;
    try {
      setLoading(true);

      // 1. Stats
      const [activeRow] = await window.api.query(
        "SELECT COUNT(DISTINCT client_id) as count FROM contract WHERE status = 1 AND finish_at >= date('now')"
      );
      const [totalClientsRow] = await window.api.query(
        "SELECT COUNT(*) as count FROM client"
      );
      const [incomeRow] = await window.api.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM payment WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"
      );
      const [todayRow] = await window.api.query(
        "SELECT COUNT(*) as count FROM control WHERE date(created_at) = date('now')"
      );

      setStats({
        activeClients: activeRow ? activeRow.count : 0,
        totalClients: totalClientsRow ? totalClientsRow.count : 0,
        monthIncome: incomeRow ? incomeRow.total : 0,
        todayCheckIns: todayRow ? todayRow.count : 0,
      });

      // 2. Contratos próximos a vencer (en los próximos 7 días)
      const expiring = await window.api.query(`
        SELECT c.id, c.finish_at, cl.name as client_name, cl.lastname as client_lastname, cl.phone, m.name as membership_name,
               (julianday(c.finish_at) - julianday('now')) as days_left
        FROM contract c
        JOIN client cl ON c.client_id = cl.id
        JOIN membership m ON c.membership_id = m.id
        WHERE c.status = 1 
          AND c.finish_at >= date('now')
          AND c.finish_at <= date('now', '+7 days')
        ORDER BY c.finish_at ASC
        LIMIT 5
      `);
      setExpiringContracts(expiring);

      // 3. Últimos Check-ins registrados
      const controls = await window.api.query(`
        SELECT co.id, co.description, co.created_at, cl.name as client_name, cl.lastname as client_lastname, m.name as membership_name
        FROM control co
        JOIN client cl ON co.client_id = cl.id
        LEFT JOIN contract ct ON co.contract_id = ct.id
        LEFT JOIN membership m ON ct.membership_id = m.id
        ORDER BY co.id DESC
        LIMIT 6
      `);
      setRecentControls(controls);

      // 4. Planes y socios inscritos
      const plans = await window.api.query(`
        SELECT m.id, m.name, m.price, COUNT(c.id) as subscriber_count
        FROM membership m
        LEFT JOIN contract c ON m.id = c.membership_id AND c.status = 1 AND c.finish_at >= date('now')
        GROUP BY m.id
        ORDER BY subscriber_count DESC
      `);
      setPopularPlans(plans);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-content animate-fade-in">
      {/* Tarjetas de Estadísticas Principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <UserCheck size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Socios Activos</span>
            <span className="stat-value">{stats.activeClients}</span>
            <span className="stat-sub">{stats.totalClients} socios en total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffede8', color: '#ff5722' }}>
            <Activity size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Check-ins Hoy</span>
            <span className="stat-value">{stats.todayCheckIns}</span>
            <span className="stat-sub">Accesos registrados hoy</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <DollarSign size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ingresos del Mes</span>
            <span className="stat-value">${Number(stats.monthIncome).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="stat-sub">Facturación mensual en curso</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Award size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Planes Activos</span>
            <span className="stat-value">{popularPlans.length}</span>
            <span className="stat-sub">Membresías configuradas</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Contratos por vencer */}
        <div className="data-card" style={{ background: '#fff', borderRadius: '18px', padding: '24px', border: '1px solid var(--md-surface-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Por Vencer (Próximos 7 días)</h3>
            </div>
            {onNavigate && (
              <md-text-button onClick={() => onNavigate('contracts')}>
                Ver todos
              </md-text-button>
            )}
          </div>

          {expiringContracts.length === 0 ? (
            <p style={{ color: 'var(--md-outline)', fontSize: '0.9rem', padding: '20px 0', textAlign: 'center' }}>
              No hay suscripciones próximas a vencer esta semana.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {expiringContracts.map((c) => {
                const days = Math.ceil(c.days_left);
                return (
                  <div 
                    key={c.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px 14px',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '12px'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>{c.client_name} {c.client_lastname}</p>
                      <p style={{ fontSize: '0.8rem', color: '#92400e' }}>
                        {c.membership_name} · Vence: <strong>{c.finish_at}</strong>
                      </p>
                    </div>
                    <span className="badge badge-warning">
                      {days <= 0 ? 'Vence hoy' : `${days} d restante${days > 1 ? 's' : ''}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimos Check-ins */}
        <div className="data-card" style={{ background: '#fff', borderRadius: '18px', padding: '24px', border: '1px solid var(--md-surface-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="var(--md-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Últimos Accesos (Check-in)</h3>
            </div>
            {onNavigate && (
              <md-text-button onClick={() => onNavigate('access')}>
                Abrir Terminal
              </md-text-button>
            )}
          </div>

          {recentControls.length === 0 ? (
            <p style={{ color: 'var(--md-outline)', fontSize: '0.9rem', padding: '20px 0', textAlign: 'center' }}>
              No se han registrado accesos el día de hoy.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentControls.map((ctrl) => (
                <div 
                  key={ctrl.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid var(--md-surface-variant)',
                    borderRadius: '12px'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>{ctrl.client_name} {ctrl.client_lastname}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--md-on-surface-variant)' }}>
                      {ctrl.membership_name || 'Acceso general'} · {ctrl.description || 'Entrada'}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-outline)' }}>
                    {ctrl.created_at ? new Date(ctrl.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Membresías y Popularidad */}
      <div className="table-container" style={{ background: '#fff', borderRadius: '18px', border: '1px solid var(--md-surface-variant)', padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Planes y Membresías Populares</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Plan / Membresía</th>
              <th>Precio</th>
              <th>Socios con Plan Activo</th>
              <th style={{ textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {popularPlans.map((plan) => (
              <tr key={plan.id}>
                <td>
                  <strong>{plan.name}</strong>
                </td>
                <td>
                  ${Number(plan.price).toFixed(2)}
                </td>
                <td>
                  <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>
                    {plan.subscriber_count} socios activos
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {onNavigate && (
                    <md-outlined-button onClick={() => onNavigate('contracts')}>
                      Asignar Plan
                    </md-outlined-button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
