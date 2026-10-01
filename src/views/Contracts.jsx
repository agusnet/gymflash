import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, CheckCircle, XCircle, DollarSign, Clock, RefreshCw, AlertCircle } from 'lucide-react';

const Contracts = ({ preselectedClientId, currentUser }) => {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'EXPIRED'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [clientId, setClientId] = useState('');
  const [membershipId, setMembershipId] = useState('');
  const [startAt, setStartAt] = useState(new Date().toISOString().split('T')[0]);
  const [finishAt, setFinishAt] = useState('');
  const [recordPayment, setRecordPayment] = useState(true);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId.toString());
      setShowModal(true);
    }
  }, [preselectedClientId]);

  useEffect(() => {
    applyFilters();
  }, [contracts, search, filterStatus]);

  // Recalcular finishAt cuando cambia el membershipId o startAt
  useEffect(() => {
    if (membershipId && memberships.length > 0) {
      const plan = memberships.find(m => m.id.toString() === membershipId.toString());
      if (plan) {
        setSelectedPlanPrice(plan.price);
        const startDate = new Date(startAt);
        if (!isNaN(startDate.getTime())) {
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + parseInt(plan.duration, 10));
          setFinishAt(endDate.toISOString().split('T')[0]);
        }
      }
    }
  }, [membershipId, startAt, memberships]);

  const loadData = async () => {
    if (!window.api) return;
    try {
      const contractsData = await window.api.query(`
        SELECT c.*, 
               cl.name as client_name, 
               cl.lastname as client_lastname, 
               cl.phone as client_phone,
               m.name as membership_name, 
               m.price as membership_price,
               m.duration as membership_duration,
               u.name as user_name,
               (julianday(c.finish_at) - julianday('now')) as days_left,
               (SELECT COALESCE(SUM(amount), 0) FROM payment WHERE contract_id = c.id) as total_paid
        FROM contract c
        JOIN client cl ON c.client_id = cl.id
        JOIN membership m ON c.membership_id = m.id
        LEFT JOIN user u ON c.user_id = u.id
        ORDER BY c.id DESC
      `);
      setContracts(contractsData);

      const clientsList = await window.api.query('SELECT id, name, lastname, email FROM client ORDER BY name ASC');
      setClients(clientsList);

      const plansList = await window.api.query('SELECT * FROM membership ORDER BY price ASC');
      setMemberships(plansList);
      if (plansList.length > 0 && !membershipId) {
        setMembershipId(plansList[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyFilters = () => {
    let result = [...contracts];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.client_name && c.client_name.toLowerCase().includes(q)) ||
        (c.client_lastname && c.client_lastname.toLowerCase().includes(q)) ||
        (c.membership_name && c.membership_name.toLowerCase().includes(q))
      );
    }
    if (filterStatus === 'ACTIVE') {
      result = result.filter(c => c.status === 1 && new Date(c.finish_at) >= new Date(new Date().toDateString()));
    } else if (filterStatus === 'EXPIRED') {
      result = result.filter(c => c.status === 0 || new Date(c.finish_at) < new Date(new Date().toDateString()));
    }
    setFilteredContracts(result);
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    if (!clientId || !membershipId || !startAt || !finishAt) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      // 1. Desactivar contratos anteriores del mismo cliente para que no queden duplicados activos
      await window.api.execute(`
        UPDATE contract SET status = 0 WHERE client_id = ?
      `, [clientId]);

      // 2. Crear contrato
      const contractResult = await window.api.execute(`
        INSERT INTO contract (client_id, membership_id, user_id, start_at, finish_at, status, created_at)
        VALUES (?, ?, ?, ?, ?, 1, datetime('now', 'localtime'))
      `, [clientId, membershipId, currentUser?.id || 1, startAt, finishAt]);

      const newContractId = contractResult.id;

      // 3. Registrar pago inicial si está marcado
      if (recordPayment && selectedPlanPrice > 0) {
        await window.api.execute(`
          INSERT INTO payment (client_id, contract_id, user_id, amount, created_at)
          VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
        `, [clientId, newContractId, currentUser?.id || 1, selectedPlanPrice]);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleContractStatus = async (contract) => {
    const newStatus = contract.status === 1 ? 0 : 1;
    try {
      await window.api.execute('UPDATE contract SET status = ? WHERE id = ?', [newStatus, contract.id]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContract = async (id) => {
    if (confirm('¿Deseas eliminar este contrato y sus registros asociados?')) {
      try {
        await window.api.execute('DELETE FROM control WHERE contract_id = ?', [id]);
        await window.api.execute('DELETE FROM payment WHERE contract_id = ?', [id]);
        await window.api.execute('DELETE FROM contract WHERE id = ?', [id]);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="view-content animate-fade-in">
      <div className="view-header">
        <div>
          <h3>Suscripciones y Contratos</h3>
          <p>Control de vigencias, renovaciones y planes contratados por los socios</p>
        </div>
        <md-filled-button onClick={() => setShowModal(true)}>
          <Plus size={18} slot="icon" />
          Nuevo Contrato
        </md-filled-button>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="search-bar">
          <Search size={18} color="var(--md-outline)" />
          <input
            type="text"
            placeholder="Buscar por socio o plan..."
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
            Todos ({contracts.length})
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
            Vigentes
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
            Vencidos / Cancelados
          </button>
        </div>
      </div>

      {/* Tabla de Contratos */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Socio</th>
              <th>Plan Contratado</th>
              <th>Vigencia (Inicio - Fin)</th>
              <th>Días Restantes</th>
              <th>Pagado</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((c) => {
              const isDateValid = new Date(c.finish_at) >= new Date(new Date().toDateString());
              const isActive = c.status === 1 && isDateValid;
              const days = Math.ceil(c.days_left);

              return (
                <tr key={c.id}>
                  <td><strong>#{c.id}</strong></td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{c.client_name} {c.client_lastname}</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--md-outline)' }}>{c.client_phone || 'Sin tel.'}</span>
                  </td>
                  <td>
                    <div><strong>{c.membership_name}</strong></div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--md-outline)' }}>${c.membership_price}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.88rem' }}>{c.start_at} al {c.finish_at}</div>
                  </td>
                  <td>
                    {isActive ? (
                      <span className="badge badge-active" style={{ fontSize: '0.8rem' }}>
                        {days <= 0 ? 'Vence hoy' : `${days} días`}
                      </span>
                    ) : (
                      <span className="badge badge-expired" style={{ fontSize: '0.8rem' }}>
                        {days < 0 ? `Venció hace ${Math.abs(days)}d` : 'Inactivo'}
                      </span>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: Number(c.total_paid) >= Number(c.membership_price) ? '#16a34a' : '#d97706' }}>
                      ${Number(c.total_paid).toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    {isActive ? (
                      <span className="badge badge-active">Activo</span>
                    ) : (
                      <span className="badge badge-expired">Vencido</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <md-outlined-button onClick={() => toggleContractStatus(c)}>
                        {c.status === 1 ? 'Pausar' : 'Reactivar'}
                      </md-outlined-button>
                      <md-icon-button onClick={() => handleDeleteContract(c.id)}>
                        <md-icon>delete</md-icon>
                      </md-icon-button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredContracts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--md-outline)' }}>
          No se encontraron contratos registrados.
        </div>
      )}

      {/* Modal Crear Nuevo Contrato */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3>Nueva Suscripción / Contrato</h3>
              <md-icon-button onClick={() => setShowModal(false)}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>

            <form onSubmit={handleCreateContract} className="form-grid">
              {/* Seleccionar Socio */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--md-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                  Seleccionar Socio *
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--md-outline-variant)',
                    background: '#ffffff',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="">-- Selecciona un socio --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.lastname} ({c.email || 'ID #' + c.id})</option>
                  ))}
                </select>
              </div>

              {/* Seleccionar Plan */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--md-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                  Plan de Membresía *
                </label>
                <select
                  value={membershipId}
                  onChange={(e) => setMembershipId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--md-outline-variant)',
                    background: '#ffffff',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit'
                  }}
                >
                  {memberships.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} - ${m.price} ({m.duration} días)
                    </option>
                  ))}
                </select>
              </div>

              {/* Fechas */}
              <div className="form-row">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--md-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--md-outline-variant)',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--md-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    value={finishAt}
                    onChange={(e) => setFinishAt(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--md-outline-variant)',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Opción de cobro automático */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--md-surface-variant)',
                padding: '16px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>Registrar cobro inicial ahora</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--md-on-surface-variant)' }}>
                    Crea automáticamente el recibo de pago por ${Number(selectedPlanPrice).toFixed(2)}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={recordPayment}
                  onChange={(e) => setRecordPayment(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--md-primary)' }}
                />
              </div>

              <div className="modal-actions">
                <md-text-button type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </md-text-button>
                <md-filled-button type="submit">
                  Crear Suscripción
                </md-filled-button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
