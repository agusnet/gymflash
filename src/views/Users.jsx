import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit3, Trash2, Key, UserCheck, UserX } from 'lucide-react';

const Users = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    password: '',
    kind: '0',
    status: '1'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!window.api) return;
    try {
      const data = await window.api.query('SELECT id, name, lastname, email, kind, status, created_at FROM user ORDER BY id ASC');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        lastname: user.lastname || '',
        email: user.email || '',
        password: '',
        kind: user.kind.toString(),
        status: user.status.toString()
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        lastname: '',
        email: '',
        password: '',
        kind: '0',
        status: '1'
      });
    }
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const { name, lastname, email, password, kind, status } = formData;
    if (!name.trim() || !email.trim()) return;

    try {
      if (editingUser) {
        if (password.trim()) {
          // Actualizar con nueva contraseña
          // Precomputar hash sha1(md5(password)) via Electron o guardar plano/query
          await window.api.execute(`
            UPDATE user 
            SET name = ?, lastname = ?, email = ?, password = ?, kind = ?, status = ?
            WHERE id = ?
          `, [name, lastname, email, password, parseInt(kind, 10), parseInt(status, 10), editingUser.id]);
        } else {
          await window.api.execute(`
            UPDATE user 
            SET name = ?, lastname = ?, email = ?, kind = ?, status = ?
            WHERE id = ?
          `, [name, lastname, email, parseInt(kind, 10), parseInt(status, 10), editingUser.id]);
        }
      } else {
        if (!password.trim()) {
          alert('Por favor ingresa una contraseña para el nuevo usuario');
          return;
        }
        await window.api.execute(`
          INSERT INTO user (name, lastname, email, password, kind, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `, [name, lastname, email, password, parseInt(kind, 10), parseInt(status, 10)]);
      }

      setShowModal(false);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === 1) {
      alert('No se puede eliminar la cuenta principal de administrador.');
      return;
    }
    if (confirm('¿Deseas eliminar este usuario del personal?')) {
      try {
        await window.api.execute('DELETE FROM user WHERE id = ?', [id]);
        loadUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="view-content animate-fade-in">
      <div className="view-header">
        <div>
          <h3>Personal y Usuarios del Sistema</h3>
          <p>Administra los accesos para recepcionistas, entrenadores y administradores</p>
        </div>
        <md-filled-button onClick={() => handleOpenModal()}>
          <Plus size={18} slot="icon" />
          Nuevo Usuario
        </md-filled-button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Completo</th>
              <th>Usuario / Correo</th>
              <th>Rol / Permisos</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>#{u.id}</strong></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: u.kind === 1 ? 'var(--md-primary-container)' : '#f1f5f9',
                      color: u.kind === 1 ? 'var(--md-primary)' : 'var(--md-outline)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}>
                      {u.name.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 700 }}>{u.name} {u.lastname}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  {u.kind === 1 ? (
                    <span className="badge" style={{ background: '#ffede8', color: '#ff5722' }}>
                      <Shield size={14} /> Administrador
                    </span>
                  ) : (
                    <span className="badge badge-info">
                      Recepcionista
                    </span>
                  )}
                </td>
                <td>
                  {u.status === 1 ? (
                    <span className="badge badge-active">Activo</span>
                  ) : (
                    <span className="badge badge-expired">Inactivo</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '4px' }}>
                    <md-icon-button onClick={() => handleOpenModal(u)}>
                      <Edit3 size={18} />
                    </md-icon-button>
                    {u.id !== 1 && (
                      <md-icon-button onClick={() => handleDeleteUser(u.id)}>
                        <Trash2 size={18} color="#dc2626" />
                      </md-icon-button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar Usuario */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3>{editingUser ? 'Editar Usuario' : 'Nuevo Miembro del Personal'}</h3>
              <md-icon-button onClick={() => setShowModal(false)}>
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>

            <form onSubmit={handleSaveUser} className="form-grid">
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
                label="Usuario o Correo"
                value={formData.email}
                onInput={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              >
                <md-icon slot="leading-icon">person</md-icon>
              </md-outlined-text-field>

              <md-outlined-text-field
                label={editingUser ? "Nueva Contraseña (dejar en blanco para conservar)" : "Contraseña"}
                type="password"
                value={formData.password}
                onInput={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              >
                <md-icon slot="leading-icon">lock</md-icon>
              </md-outlined-text-field>

              <div className="form-row">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--md-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                    Rol / Nivel de Acceso
                  </label>
                  <select
                    value={formData.kind}
                    onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
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
                    <option value="0">Recepcionista / Operador</option>
                    <option value="1">Administrador Total</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--md-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                    Estado de la Cuenta
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                    <option value="1">Activo</option>
                    <option value="0">Inactivo / Suspendido</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <md-text-button type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </md-text-button>
                <md-filled-button type="submit">
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </md-filled-button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
