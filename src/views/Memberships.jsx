import React, { useState, useEffect } from 'react';
import { Award, Plus, Edit3, Trash2, Calendar, DollarSign, Users } from 'lucide-react';

const Memberships = () => {
  const [memberships, setMemberships] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '30',
    price: ''
  });

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    if (!window.api) return;
    try {
      const plans = await window.api.query(`
        SELECT m.*, COUNT(c.id) as active_subscribers
        FROM membership m
        LEFT JOIN contract c ON m.id = c.membership_id AND c.status = 1 AND c.finish_at >= date('now')
        GROUP BY m.id
        ORDER BY m.price ASC
      `);
      setMemberships(plans);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        duration: plan.duration ? plan.duration.toString() : '30',
        price: plan.price ? plan.price.toString() : ''
      });
    } else {
      setEditingPlan(null);
      setFormData({ name: '', description: '', duration: '30', price: '' });
    }
    setShowModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    const { name, description, duration, price } = formData;
    if (!name.trim() || !price) return;

    try {
      if (editingPlan) {
        await window.api.execute(`
          UPDATE membership 
          SET name = ?, description = ?, duration = ?, price = ?
          WHERE id = ?
        `, [name, description, parseInt(duration, 10) || 30, parseFloat(price), editingPlan.id]);
      } else {
        await window.api.execute(`
          INSERT INTO membership (name, description, duration, price, created_at)
          VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
        `, [name, description, parseInt(duration, 10) || 30, parseFloat(price)]);
      }
      setShowModal(false);
      loadMemberships();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (id) => {
    if (confirm('¿Deseas eliminar este plan de membresía?')) {
      try {
        await window.api.execute('DELETE FROM membership WHERE id = ?', [id]);
        loadMemberships();
      } catch (err) {
        console.error(err);
        alert('No se puede eliminar el plan si ya existen contratos asociados a él.');
      }
    }
  };

  return (
    <div className="view-content animate-fade-in">
      <div className="view-header">
        <div>
          <h3>Membresías y Planes de Acceso</h3>
          <p>Define las tarifas, duraciones y beneficios para los socios del gimnasio</p>
        </div>
        <md-filled-button onClick={() => handleOpenModal()}>
          <Plus size={18} slot="icon" />
          Nuevo Plan
        </md-filled-button>
      </div>

      <div className="cards-grid">
        {memberships.map((plan) => (
          <div key={plan.id} className="custom-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ff5722 0%, #ea580c 100%)'
            }} />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--md-primary-container)', color: 'var(--md-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--md-on-surface)' }}>{plan.name}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--md-outline)' }}>ID #{plan.id}</span>
                  </div>
                </div>
              </div>

              <p style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.9rem', minHeight: '44px', marginBottom: '18px' }}>
                {plan.description || 'Sin descripción detallada.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--md-primary)' }}>
                  ${Number(plan.price).toFixed(2)}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--md-outline)', fontWeight: 600 }}>
                  / {plan.duration} días
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--md-surface-variant)', paddingTop: '14px', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-on-surface-variant)' }}>
                  <Calendar size={16} color="var(--md-outline)" />
                  Duración: <strong>{plan.duration} días naturales</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-on-surface-variant)' }}>
                  <Users size={16} color="var(--md-outline)" />
                  Socios con suscripción activa: <strong>{plan.active_subscribers}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '20px', borderTop: '1px solid var(--md-surface-variant)', paddingTop: '12px' }}>
              <md-icon-button onClick={() => handleOpenModal(plan)}>
                <Edit3 size={18} />
              </md-icon-button>
              <md-icon-button onClick={() => handleDeletePlan(plan.id)}>
                <Trash2 size={18} color="#dc2626" />
              </md-icon-button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar Membresía */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3>{editingPlan ? 'Editar Plan' : 'Nuevo Plan de Membresía'}</h3>
              <md-icon-button onClick={() => setShowModal(false)}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>

            <form onSubmit={handleSavePlan} className="form-grid">
              <md-outlined-text-field
                label="Nombre del Plan"
                placeholder="Ej. Plan Mensual Estándar, Pase Semanal, etc."
                value={formData.name}
                onInput={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <md-outlined-text-field
                label="Descripción y Beneficios"
                type="textarea"
                rows={3}
                placeholder="Acceso a sala de pesas, cardio, regaderas y asesoría..."
                value={formData.description}
                onInput={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <div className="form-row">
                <md-outlined-text-field
                  label="Duración (en días)"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onInput={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                  style={{ flex: 1 }}
                >
                  <md-icon slot="leading-icon">calendar_today</md-icon>
                </md-outlined-text-field>

                <md-outlined-text-field
                  label="Precio ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onInput={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  style={{ flex: 1 }}
                >
                  <md-icon slot="leading-icon">attach_money</md-icon>
                </md-outlined-text-field>
              </div>

              <div className="modal-actions">
                <md-text-button type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </md-text-button>
                <md-filled-button type="submit">
                  {editingPlan ? 'Actualizar Plan' : 'Crear Plan'}
                </md-filled-button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Memberships;
