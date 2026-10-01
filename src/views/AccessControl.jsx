import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, User, Search, CheckCircle2, XCircle, Clock, Calendar, RefreshCw } from 'lucide-react';

const AccessControl = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientContract, setClientContract] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState(null); // 'ALLOWED' | 'DENIED' | null
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadRecentLogs();
  }, []);

  const loadRecentLogs = async () => {
    if (!window.api) return;
    try {
      const logs = await window.api.query(`
        SELECT co.id, co.description, co.created_at, cl.id as client_id, cl.name as client_name, cl.lastname as client_lastname, m.name as membership_name
        FROM control co
        JOIN client cl ON co.client_id = cl.id
        LEFT JOIN contract ct ON co.contract_id = ct.id
        LEFT JOIN membership m ON ct.membership_id = m.id
        WHERE date(co.created_at) = date('now')
        ORDER BY co.id DESC
        LIMIT 15
      `);
      setRecentLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setClients([]);
      return;
    }
    try {
      const results = await window.api.query(`
        SELECT * FROM client 
        WHERE name LIKE ? OR lastname LIKE ? OR email LIKE ? OR phone LIKE ? OR id = ?
        LIMIT 8
      `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, query]);
      setClients(results);
    } catch (err) {
      console.error(err);
    }
  };

  const verifyAndCheckIn = async (client) => {
    setSelectedClient(client);
    setSearchQuery('');
    setClients([]);
    setLoading(true);

    try {
      // Buscar contrato activo más reciente
      const contracts = await window.api.query(`
        SELECT c.*, m.name as membership_name, m.price,
               (julianday(c.finish_at) - julianday('now')) as days_left
        FROM contract c
        JOIN membership m ON c.membership_id = m.id
        WHERE c.client_id = ?
        ORDER BY c.finish_at DESC
        LIMIT 1
      `, [client.id]);

      const contract = contracts[0] || null;
      setClientContract(contract);

      const isAllowed = contract && contract.status === 1 && new Date(contract.finish_at) >= new Date(new Date().toDateString());

      if (isAllowed) {
        setCheckInStatus('ALLOWED');
        // Registrar en control
        const description = `Acceso concedido - ${contract.membership_name}`;
        await window.api.execute(`
          INSERT INTO control (client_id, contract_id, user_id, description, created_at)
          VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
        `, [client.id, contract.id, currentUser?.id || 1, description]);

        setNotification(`¡Acceso registrado con éxito para ${client.name}!`);
        setTimeout(() => setNotification(''), 4000);
      } else {
        setCheckInStatus('DENIED');
        // Registrar intento denegado
        const description = contract 
          ? `Acceso DENEGADO - Membresía vencida el ${contract.finish_at}`
          : `Acceso DENEGADO - Sin membresía`;
        await window.api.execute(`
          INSERT INTO control (client_id, contract_id, user_id, description, created_at)
          VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
        `, [client.id, contract ? contract.id : null, currentUser?.id || 1, description]);
      }

      loadRecentLogs();
    } catch (err) {
      console.error('Error verifying check-in:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-content animate-fade-in">
      <div className="view-header">
        <div>
          <h3>Terminal de Control de Acceso (Check-In)</h3>
          <p>Valida la membresía de los socios y registra su ingreso al gimnasio en tiempo real</p>
        </div>
      </div>

      {notification && (
        <div style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={20} />
          {notification}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '28px' }}>
        
        {/* Terminal Principal de Verificación */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Buscador de Socio */}
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid var(--md-surface-variant)', boxShadow: 'var(--elevation-1)' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--md-on-surface-variant)', display: 'block', marginBottom: '8px' }}>
              Buscar Socio por Nombre, Teléfono o ID:
            </label>
            <div style={{ position: 'relative' }}>
              <div className="search-bar" style={{ maxWidth: '100%' }}>
                <Search size={20} color="var(--md-outline)" />
                <input
                  type="text"
                  placeholder="Ej. Carlos, sofia.m@gmail.com, o presione buscar..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Dropdown de Resultados de Búsqueda */}
              {clients.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid var(--md-surface-variant)',
                  borderRadius: '14px',
                  marginTop: '8px',
                  boxShadow: 'var(--elevation-3)',
                  zIndex: 20,
                  overflow: 'hidden'
                }}>
                  {clients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => verifyAndCheckIn(c)}
                      style={{
                        padding: '14px 18px',
                        borderBottom: '1px solid var(--md-surface-variant)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--md-primary-container)', color: 'var(--md-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name} {c.lastname}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--md-on-surface-variant)' }}>{c.phone || c.email || 'Sin contacto'}</p>
                        </div>
                      </div>
                      <md-outlined-button style={{ pointerEvents: 'none' }}>
                        Validar Acceso
                      </md-outlined-button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Banner de Estado de Acceso */}
          {selectedClient && checkInStatus && (
            <div 
              className="animate-fade-in"
              style={{
                borderRadius: '24px',
                padding: '32px',
                border: '2px solid',
                borderColor: checkInStatus === 'ALLOWED' ? '#16a34a' : '#dc2626',
                background: checkInStatus === 'ALLOWED' ? '#f0fdf4' : '#fef2f2',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxShadow: varElevation(checkInStatus)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: checkInStatus === 'ALLOWED' ? '#dcfce7' : '#fee2e2',
                  color: checkInStatus === 'ALLOWED' ? '#16a34a' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {checkInStatus === 'ALLOWED' ? <ShieldCheck size={42} /> : <ShieldAlert size={42} />}
                </div>

                <div>
                  <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    letterSpacing: '-0.5px',
                    color: checkInStatus === 'ALLOWED' ? '#15803d' : '#b91c1c'
                  }}>
                    {checkInStatus === 'ALLOWED' ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}
                  </h2>
                  <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--md-on-surface)' }}>
                    {selectedClient.name} {selectedClient.lastname}
                  </p>
                </div>
              </div>

              {/* Detalles del Contrato */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--md-surface-variant)'
              }}>
                {clientContract ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '0.92rem' }}>
                    <div>
                      <span style={{ color: 'var(--md-outline)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Plan / Membresía:</span>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--md-on-surface)' }}>{clientContract.membership_name}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--md-outline)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Fecha de Vencimiento:</span>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: checkInStatus === 'ALLOWED' ? '#16a34a' : '#dc2626' }}>
                        {clientContract.finish_at}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--md-outline)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Fecha de Inicio:</span>
                      <p style={{ fontWeight: 600 }}>{clientContract.start_at}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--md-outline)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Estado:</span>
                      <div>
                        {checkInStatus === 'ALLOWED' ? (
                          <span className="badge badge-active">Vigente ({Math.ceil(clientContract.days_left)} días restantes)</span>
                        ) : (
                          <span className="badge badge-expired">Vencida / Inactiva</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--md-error)', fontWeight: 600, fontSize: '0.95rem' }}>
                    El socio no tiene ningún plan o suscripción registrada en el sistema.
                  </p>
                )}
              </div>

              {/* Botón para resetear terminal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <md-filled-button onClick={() => { setSelectedClient(null); setCheckInStatus(null); }}>
                  Siguiente Socio
                </md-filled-button>
              </div>
            </div>
          )}

          {!selectedClient && (
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '48px 24px',
              border: '2px dashed var(--md-outline-variant)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--md-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-outline)' }}>
                <User size={32} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--md-on-surface)' }}>Terminal Listo</h4>
              <p style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.9rem', maxWidth: '380px' }}>
                Escriba el nombre, apellido, teléfono o ID del socio arriba para validar el acceso al gimnasio.
              </p>
            </div>
          )}
        </div>

        {/* Registro en Vivo de Hoy (Live Feed) */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid var(--md-surface-variant)', boxShadow: 'var(--elevation-1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="var(--md-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Asistencias de Hoy</h3>
            </div>
            <md-icon-button onClick={loadRecentLogs}>
              <RefreshCw size={18} />
            </md-icon-button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '560px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentLogs.length === 0 ? (
              <p style={{ color: 'var(--md-outline)', textAlign: 'center', padding: '30px 0', fontSize: '0.9rem' }}>
                Sin registros el día de hoy
              </p>
            ) : (
              recentLogs.map((log) => {
                const isDenied = log.description?.includes('DENEGADO');
                return (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: isDenied ? '#fef2f2' : '#f8fafc',
                      borderRadius: '12px',
                      border: `1px solid ${isDenied ? '#fee2e2' : 'var(--md-surface-variant)'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isDenied ? (
                        <XCircle size={18} color="#dc2626" />
                      ) : (
                        <CheckCircle2 size={18} color="#16a34a" />
                      )}
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{log.client_name} {log.client_lastname}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--md-on-surface-variant)' }}>
                          {log.description}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-outline)' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const varElevation = (status) => {
  return status === 'ALLOWED' 
    ? '0 10px 25px -5px rgba(22, 163, 74, 0.2)' 
    : '0 10px 25px -5px rgba(220, 38, 38, 0.2)';
};

export default AccessControl;
