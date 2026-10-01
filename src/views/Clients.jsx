import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Plus, Search, Edit3, Trash2, Eye, Calendar, DollarSign, Activity, FileText } from 'lucide-react';

const Clients = ({ onAssignMembership }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'EXPIRED'
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    address: ''
  });

  // Client Detail Modal
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);
  const [clientContracts, setClientContracts] = useState([]);
  const [clientPayments, setClientPayments] = useState([]);
  const [clientControls, setClientControls] = useState([]);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, search, filterStatus]);

  const loadClients = async () => {
    if (!window.api) return;
    try {
      // Obtenemos los clientes junto con su contrato activo si existe
      const data = await window.api.query(`
        SELECT cl.*, 
               ct.id as active_contract_id,
               ct.start_at,
               ct.finish_at,
               m.name as membership_name,
               CASE 
                 WHEN ct.status = 1 AND ct.finish_at >= date('now') THEN 1 
                 ELSE 0 
               END as is_active
        FROM client cl
        LEFT JOIN contract ct ON ct.client_id = cl.id AND ct.status = 1 AND ct.finish_at >= date('now')
        LEFT JOIN membership m ON ct.membership_id = m.id
        ORDER BY cl.id DESC
      `);
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const applyFilters = () => {
    let result = [...clients];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.lastname && c.lastname.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );
    }
    if (filterStatus === 'ACTIVE') {
      result = result.filter(c => c.is_active === 1);
    } else if (filterStatus === 'EXPIRED') {
      result = result.filter(c => c.is_active === 0);
    }
    setFilteredClients(result);
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || '',
        lastname: client.lastname || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || ''
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', lastname: '', email: '', phone: '', address: '' });
    }
    setShowModal(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    const { name, lastname, email, phone, address } = formData;
    if (!name.trim()) return;

    try {
      if (editingClient) {
        await window.api.execute(`
          UPDATE client 
          SET name = ?, lastname = ?, email = ?, phone = ?, address = ?
          WHERE id = ?
        `, [name, lastname, email, phone, address, editingClient.id]);
      } else {
        await window.api.execute(`
          INSERT INTO client (name, lastname, email, phone, address, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `, [name, lastname, email, phone, address]);
      }
      setShowModal(false);
      loadClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClient = async (id) => {
    if (confirm('¿Deseas eliminar este socio y su información asociada?')) {
      try {
        await window.api.execute('DELETE FROM control WHERE client_id = ?', [id]);
        await window.api.execute('DELETE FROM payment WHERE client_id = ?', [id]);
        await window.api.execute('DELETE FROM contract WHERE client_id = ?', [id]);
        await window.api.execute('DELETE FROM client WHERE id = ?', [id]);
        loadClients();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleViewDetail = async (client) => {
    setSelectedClientDetail(client);
    try {
      const contracts = await window.api.query(`
        SELECT c.*, m.name as membership_name, m.price
        FROM contract c
        JOIN membership m ON c.membership_id = m.id
        WHERE c.client_id = ?
        ORDER BY c.id DESC
      `, [client.id]);
      setClientContracts(contracts);

      const payments = await window.api.query(`
        SELECT p.*, u.name as user_name
        FROM payment p
        LEFT JOIN user u ON p.user_id = u.id
        WHERE p.client_id = ?
        ORDER BY p.id DESC
      `, [client.id]);
      setClientPayments(payments);

      const controls = await window.api.query(`
        SELECT * FROM control WHERE client_id = ? ORDER BY id DESC LIMIT 10
      `, [client.id]);
      setClientControls(controls);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="view-content animate-fade-in">
      <div className="view-header">
        <div>
          <h3>Directorio de Socios</h3>
          <p>Gestiona los datos de los miembros del gimnasio, historial y membresías</p>
        </div>
        <md-filled-button onClick={() => handleOpenModal()}>
          <Plus size={18} slot="icon" />
          Nuevo Socio
        </md-filled-button>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="search-bar">
          <Search size={18} color="var(--md-outline)" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setFilterStatus('ALL')}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              background: filterStatus === 'ALL' ? 'var(--md-primary-container)' : '#fff',
              color: filterStatus === 'ALL' ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: '1px solid var(--md-surface-variant)'
            }}
          >
            Todos ({clients.length})
          </button>
          <button 
            onClick={() => setFilterStatus('ACTIVE')}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              background: filterStatus === 'ACTIVE' ? '#dcfce7' : '#fff',
              color: filterStatus === 'ACTIVE' ? '#15803d' : 'var(--md-on-surface-variant)',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: '1px solid var(--md-surface-variant)'
            }}
          >
            Activos
          </button>
          <button 
            onClick={() => setFilterStatus('EXPIRED')}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              background: filterStatus === 'EXPIRED' ? '#fee2e2' : '#fff',
              color: filterStatus === 'EXPIRED' ? '#b91c1c' : 'var(--md-on-surface-variant)',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: '1px solid var(--md-surface-variant)'
            }}
          >
            Sin Membresía Activa
          </button>
        </div>
      </div>

      {/* Grid de Socios */}
      <div className="cards-grid">
        {filteredClients.map((c) => (
          <div key={c.id} className="custom-card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: c.is_active ? 'var(--md-primary-container)' : '#f1f5f9',
                    color: c.is_active ? 'var(--md-primary)' : 'var(--md-outline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem'
                  }}>
                    {c.name ? c.name.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--md-on-surface)' }}>
                      {c.name} {c.lastname}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--md-outline)' }}>ID #{c.id}</span>
                  </div>
                </div>

                {c.is_active ? (
                  <span className="badge badge-active">Activo</span>
                ) : (
                  <span className="badge badge-expired">Vencido</span>
                )}
              </div>

              {/* Info de contacto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.86rem', color: 'var(--md-on-surface-variant)', marginBottom: '16px' }}>
                {c.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} color="var(--md-outline)" /> {c.email}
                  </span>
                )}
                {c.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} color="var(--md-outline)" /> {c.phone}
                  </span>
                )}
                {c.address && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} color="var(--md-outline)" /> {c.address}
                  </span>
                )}
              </div>

              {/* Membresía actual */}
              <div style={{
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--md-surface-variant)',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--md-outline)' }}>
                  Plan Vigente:
                </span>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', color: c.is_active ? 'var(--md-primary)' : 'var(--md-outline)' }}>
                  {c.membership_name || 'Sin plan asignado'}
                </p>
                {c.finish_at && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-on-surface-variant)' }}>
                    Vence: {c.finish_at}
                  </span>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--md-surface-variant)', paddingTop: '12px' }}>
              <md-text-button onClick={() => handleViewDetail(c)}>
                <Eye size={16} slot="icon" /> Ver Ficha
              </md-text-button>

              <div style={{ display: 'flex', gap: '4px' }}>
                <md-icon-button onClick={() => handleOpenModal(c)}>
                  <Edit3 size={18} />
                </md-icon-button>
                <md-icon-button onClick={() => handleDeleteClient(c.id)}>
                  <Trash2 size={18} color="#dc2626" />
                </md-icon-button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--md-outline)' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No se encontraron socios registrados</p>
          <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Haga clic en "Nuevo Socio" para registrar al primero</p>
        </div>
      )}

      {/* Modal Crear / Editar Socio */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3>{editingClient ? 'Editar Socio' : 'Registrar Nuevo Socio'}</h3>
              <md-icon-button onClick={() => setShowModal(false)}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>

            <form onSubmit={handleSaveClient} className="form-grid">
              <div className="form-row">
                <md-outlined-text-field
                  label="Nombre(s)"
                  value={formData.name}
                  onInput={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ flex: 1 }}
                />
                <md-outlined-text-field
                  label="Apellido(s)"
                  value={formData.lastname}
                  onInput={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>

              <md-outlined-text-field
                label="Correo Electrónico"
                type="email"
                value={formData.email}
                onInput={(e) => setFormData({ ...formData, email: e.target.value })}
              >
                <md-icon slot="leading-icon">mail</md-icon>
              </md-outlined-text-field>

              <md-outlined-text-field
                label="Teléfono / WhatsApp"
                value={formData.phone}
                onInput={(e) => setFormData({ ...formData, phone: e.target.value })}
              >
                <md-icon slot="leading-icon">phone</md-icon>
              </md-outlined-text-field>

              <md-outlined-text-field
                label="Dirección"
                value={formData.address}
                onInput={(e) => setFormData({ ...formData, address: e.target.value })}
              >
                <md-icon slot="leading-icon">home</md-icon>
              </md-outlined-text-field>

              <div className="modal-actions">
                <md-text-button type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </md-text-button>
                <md-filled-button type="submit">
                  {editingClient ? 'Actualizar Socio' : 'Guardar Socio'}
                </md-filled-button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha Completa de Socio */}
      {selectedClientDetail && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.3rem' }}>
                  Ficha de Socio: {selectedClientDetail.name} {selectedClientDetail.lastname}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--md-outline)' }}>
                  ID #{selectedClientDetail.id} · Registrado el {selectedClientDetail.created_at || 'Reciente'}
                </p>
              </div>
              <md-icon-button onClick={() => setSelectedClientDetail(null)}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Resumen de Contacto */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid var(--md-surface-variant)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-outline)' }}>CORREO</span>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedClientDetail.email || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-outline)' }}>TELÉFONO</span>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedClientDetail.phone || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-outline)' }}>DIRECCIÓN</span>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedClientDetail.address || 'N/A'}</p>
                </div>
              </div>

              {/* Historial de Contratos / Membresías */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="var(--md-primary)" /> Historial de Contratos
                  </h4>
                  {onAssignMembership && (
                    <md-outlined-button onClick={() => {
                      const cid = selectedClientDetail.id;
                      setSelectedClientDetail(null);
                      onAssignMembership(cid);
                    }}>
                      + Nuevo Contrato
                    </md-outlined-button>
                  )}
                </div>

                {clientContracts.length === 0 ? (
                  <p style={{ color: 'var(--md-outline)', fontSize: '0.85rem' }}>No registra suscripciones.</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Plan</th>
                          <th>Inicio</th>
                          <th>Fin</th>
                          <th>Precio</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientContracts.map(c => {
                          const isActive = c.status === 1 && new Date(c.finish_at) >= new Date(new Date().toDateString());
                          return (
                            <tr key={c.id}>
                              <td><strong>{c.membership_name}</strong></td>
                              <td>{c.start_at}</td>
                              <td>{c.finish_at}</td>
                              <td>${c.price}</td>
                              <td>
                                {isActive ? (
                                  <span className="badge badge-active">Activo</span>
                                ) : (
                                  <span className="badge badge-expired">Vencido</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Historial de Pagos */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <DollarSign size={18} color="#16a34a" /> Pagos Registrados
                </h4>
                {clientPayments.length === 0 ? (
                  <p style={{ color: 'var(--md-outline)', fontSize: '0.85rem' }}>No registra pagos.</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Folio</th>
                          <th>Monto</th>
                          <th>Fecha</th>
                          <th>Atendido por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientPayments.map(p => (
                          <tr key={p.id}>
                            <td>#{p.id}</td>
                            <td><strong style={{ color: '#16a34a' }}>${Number(p.amount).toFixed(2)}</strong></td>
                            <td>{p.created_at}</td>
                            <td>{p.user_name || 'Admin'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Últimos Check-ins */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Activity size={18} color="var(--md-primary)" /> Últimos Ingresos (Check-ins)
                </h4>
                {clientControls.length === 0 ? (
                  <p style={{ color: 'var(--md-outline)', fontSize: '0.85rem' }}>No registra asistencias aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {clientControls.map(ctrl => (
                      <div key={ctrl.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid var(--md-surface-variant)' }}>
                        <span>{ctrl.description}</span>
                        <span style={{ fontWeight: 600, color: 'var(--md-outline)' }}>{ctrl.created_at}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
