/*
  GymFlash Schema (SQLite version)
*/

CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lastname TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    image TEXT,
    kind INTEGER DEFAULT 0, /* 0: normal / recepcionista, 1: administrator */
    status INTEGER DEFAULT 1, /* 0: inactive, 1: active */
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS person (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lastname TEXT,
    email TEXT,
    address TEXT,
    phone TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lastname TEXT,
    email TEXT,
    password TEXT,
    address TEXT,
    phone TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membership (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, /* duration in days */
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    membership_id INTEGER NOT NULL,
    user_id INTEGER,
    start_at DATE NOT NULL,
    finish_at DATE NOT NULL,
    status INTEGER DEFAULT 1, /* 0: vencido/bloqueado, 1: activo */
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client(id),
    FOREIGN KEY (membership_id) REFERENCES membership(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS payment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    contract_id INTEGER,
    user_id INTEGER,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client(id),
    FOREIGN KEY (contract_id) REFERENCES contract(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS control (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    contract_id INTEGER,
    user_id INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client(id),
    FOREIGN KEY (contract_id) REFERENCES contract(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

/* Default admin user - Password: sha1(md5("admin")) = 90b9aa7e25f80cf4f64e990b78a9fc5ebd6cecad */
INSERT OR REPLACE INTO user (id, name, lastname, email, password, kind, status) 
VALUES (1, 'Administrador', 'GymFlash', 'admin', '90b9aa7e25f80cf4f64e990b78a9fc5ebd6cecad', 1, 1);

/* Initial Memberships */
INSERT OR IGNORE INTO membership (id, name, description, duration, price) VALUES 
(1, 'Plan Mensual Estándar', 'Acceso ilimitado a sala de pesas y cardio por 30 días', 30, 350.00),
(2, 'Plan Trimestral Pro', 'Acceso total y clases grupales incluidas por 90 días', 90, 950.00),
(3, 'Plan Anual VIP', 'Acceso total todo el año + locker + asesoría personalizada', 365, 3400.00),
(4, 'Pase Diario', 'Acceso por 1 día completo a todas las áreas del gimnasio', 1, 50.00);

/* Initial Clients (Socios) */
INSERT OR IGNORE INTO client (id, name, lastname, email, phone, address) VALUES
(1, 'Carlos', 'Ruiz Gómez', 'carlos.ruiz@gmail.com', '555-123-4567', 'Av. Central #120'),
(2, 'Sofía', 'Martínez Díaz', 'sofia.m@gmail.com', '555-987-6543', 'Calle Olivo #45'),
(3, 'Alejandro', 'Torres Vega', 'a.torres@gmail.com', '555-456-7890', 'Blvd. Las Palmas #78'),
(4, 'Valentina', 'López Cruz', 'valen.lopez@gmail.com', '555-321-7654', 'Col. Centro #89');

/* Sample Contracts */
INSERT OR IGNORE INTO contract (id, client_id, membership_id, user_id, start_at, finish_at, status) VALUES
(1, 1, 1, 1, date('now', '-5 days'), date('now', '+25 days'), 1),
(2, 2, 2, 1, date('now', '-30 days'), date('now', '+60 days'), 1),
(3, 3, 1, 1, date('now', '-35 days'), date('now', '-5 days'), 0);

/* Sample Payments */
INSERT OR IGNORE INTO payment (id, client_id, contract_id, user_id, amount) VALUES
(1, 1, 1, 1, 350.00),
(2, 2, 2, 1, 950.00),
(3, 3, 3, 1, 350.00);

/* Sample Controls / Check-ins */
INSERT OR IGNORE INTO control (id, client_id, contract_id, user_id, description) VALUES
(1, 1, 1, 1, 'Acceso concedido - Torniquete 1'),
(2, 2, 2, 1, 'Acceso concedido - Recepción'),
(3, 1, 1, 1, 'Acceso concedido - Torniquete 2');
