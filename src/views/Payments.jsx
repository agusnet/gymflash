import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Calendar, User, TrendingUp, CreditCard, Trash2 } from 'lucide-react';

const Payments = ({ currentUser }) => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientContracts, setClientContracts] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      setFilteredPayments(payments.filter(p => 
        (p.client_name && p.client_name.toLowerCase().includes(q)) ||
        (p.client_lastname && p.client_lastname.toLowerCase().includes(q)) ||
        (p.membership_name && p.membership_name.toLowerCase().includes(q))
      ));
    } else {
      setFilteredPayments(payments);
    }
  }, [search, payments]);

  // When client is selected in form, find their contracts
  useEffect(() => {
    if (selectedClientId) {
      loadClientContracts(selectedClientId);
    } else {
      setClientContracts([]);
      setSelectedContractId('');
    }
  }, [selectedClientId]);

  const loadClientContracts = async (cId) => {
    if (!window.api) return;
    try {
      const contracts = await window.api.query(`
        SELECT c.*, m.name as membership_name, m.price
        FROM contract c
        JOIN membership m ON c.membership_id = m.id
        WHERE c.client_id = ?
        ORDER BY c.id DESC
      `, [cId]);
      setClientContracts(contracts);
      if (contracts.length > 0) {
        setSelectedContractId(contracts[0].id.toString());
        setAmount(contracts[0].price.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPayments = async () => {
    if (!window.api) return;
    try {
      const paymentsData = await window.api.query(`
        SELECT p.*, 
               cl.name as client_name, 
               cl.lastname as client_lastname, 
               cl.email as client_email,
               m.name as membership_name,
               u.name as user_name
        FROM payment p
        JOIN client cl ON p.client_id = cl.id
        LEFT JOIN contract ct ON p.contract_id = ct.id
        LEFT JOIN membership m ON ct.membership_id = m.id
        LEFT JOIN user u ON p.user_id = u.id
        ORDER BY p.id DESC
      `);
      setPayments(paymentsData);

      // Métricas de cobro
      const [todayRow] = await window.api.query(`
        SELECT COALESCE(SUM(amount), 0) as total FROM payment WHERE date(created_at) = date('now')
      `);
      const [monthRow] = await window.api.query(`
        SELECT COALESCE(SUM(amount), 0) as total FROM payment WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
      `);

      setTodayTotal(todayRow ? todayRow.total : 0);
      setMonthTotal(monthRow ? monthRow.total : 0);

      const clientsList = await window.api.query('SELECT id, name, lastname FROM client ORDER BY name ASC');
      setClients(clientsList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!selectedClientId || !amount) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      await window.api.execute(`
        INSERT INTO payment (client_id, contract_id, user_id, amount, created_at)
        VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
      `, [selectedClientId, selectedContractId || null, currentUser?.id || 1, parseFloat(amount)]);

      setShowModal(false);
      setSelectedClientId('');
      setAmount('');
      loadPayments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePayment = async (id) => {
    if (confirm('¿Deseas anular este recibo de pago?')) {
      try {
        await window.api.execute('DELETE FROM payment WHERE id = ?', [id]);
        loadPayments();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="view-content animate-fade-in">
      <div className="view-header">
        <div>
          <h3>Caja y Registro de Pagos</h3>
          <p>Historial financiero de cobros por membresías y renovaciones</p>
        </div>
        <md-filled-button onClick={() => setShowModal(true)}>
          <Plus size={18} slot="icon" />
          Registrar Cobro
        </md-filled-button>
      </div>

      {/* Tarjetas de Resumen de Caja */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <DollarSign size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ingresos de Hoy</span>
            <span className="stat-value">${Number(todayTotal).toFixed(2)}</span>
            <span className="stat-sub">Caja del día actual</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <TrendingUp size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ingresos del Mes</span>
            <span className="stat-value">${Number(monthTotal).toFixed(2)}</span>
            <span className="stat-sub">Total facturado este mes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffede8', color: '#ff5722' }}>
            <CreditCard size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Transacciones</span>
            <span className="stat-value">{payments.length}</span>
            <span className="stat-sub">Recibos emitidos</span>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: '20px' }}>
        <div className="search-bar">
          <Search size={18} color="var(--md-outline)" />
          <input
            type="text"
            placeholder="Buscar por socio o membresía..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha y Hora</th>
              <th>Socio</th>
              <th>Concepto / Plan</th>
              <th>Monto</th>
              <th>Atendido Por</th>
              <th style={{ textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((p) => (
              <tr key={p.id}>
                <td><strong>#{p.id}</strong></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.created_at}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>{p.client_name} {p.client_lastname}</div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-outline)' }}>{p.client_email}</span>
                </td>
                <td>
                  <span className="badge badge-info">
                    {p.membership_name ? p.membership_name : (p.contract_id ? `Contrato #${p.contract_id}` : 'Cobro Directo')}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16a34a' }}>
                    ${Number(p.amount).toFixed(2)}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)' }}>
                    {p.user_name || 'Administración'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <md-icon-button onClick={() => handleDeletePayment(p.id)}>
                    <Trash2 size={18} color="#dc2626" />
                  </md-icon-button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPayments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--md-outline)' }}>
          No se encontraron recibos de pago.
        </div>
      )}

      {/* Modal Registrar Pago */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3>Registrar Cobro en Caja</h3>
              <md-icon-button onClick={() => setShowModal(false)}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>

            <form onSubmit={handleCreatePayment} className="form-grid">
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--md-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                  Socio que Realiza el Pago *
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
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
                  <option value="">-- Seleccionar Socio --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.lastname}</option>
                  ))}
                </select>
              </div>

              {clientContracts.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--md-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                    Contrato / Plan Asociado
                  </label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
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
                    <option value="">Sin contrato vinculado (Cobro libre)</option>
                    {clientContracts.map(c => (
                      <option key={c.id} value={c.id}>
                        Contrato #{c.id} - {c.membership_name} (${c.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <md-outlined-text-field
                label="Monto a Cobrar ($)"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onInput={(e) => setAmount(e.target.value)}
                required
              >
                <md-icon slot="leading-icon">attach_money</md-icon>
              </md-outlined-text-field>

              <div className="modal-actions">
                <md-text-button type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </md-text-button>
                <md-filled-button type="submit">
                  Confirmar Cobro
                </md-filled-button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
