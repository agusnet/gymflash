const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const crypto = require('crypto');

// Detect development mode natively
const isDev = !app.isPackaged;

// Database initialization
const dbPath = isDev 
  ? path.join(__dirname, '../gymflash.db')
  : path.join(app.getPath('userData'), 'gymflash.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('--- Database Error ---');
    console.error('Could not connect to database', err.message);
    console.error('----------------------');
  } else {
    console.log('Connected to the SQLite database (GymFlash).');
    initDatabase();
  }
});

// Helper for Promisified queries
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize database with schema if needed
function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('Schema file not found at:', schemaPath);
      return;
    }
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // sqlite3.exec can handle multiple statements
    db.exec(schema, async (err) => {
      if (err) {
        console.error('Error executing schema:', err.message);
      } else {
        console.log('--- GymFlash Database Status ---');
        console.log('Path:', dbPath);
        
        // Ensure admin user exists and has correct password
        const pass = 'admin';
        const md5 = crypto.createHash('md5').update(pass).digest('hex');
        const hashedPassword = crypto.createHash('sha1').update(md5).digest('hex');
        
        db.get("SELECT * FROM user WHERE id = 1 OR email = 'admin'", (err, row) => {
          if (!row) {
            db.run(
              "INSERT INTO user (id, name, lastname, email, password, kind, status) VALUES (?, ?, ?, ?, ?, ?, ?)", 
              [1, 'Administrador', 'GymFlash', 'admin', hashedPassword, 1, 1],
              (err) => {
                if (!err) console.log('Default Admin (id 1) created successfully.');
              }
            );
          } else {
            // Update password to ensure it matches
            db.run("UPDATE user SET password = ? WHERE id = ?", [hashedPassword, row.id]);
            console.log('Default Admin verified and updated successfully.');
          }
        });

        console.log('Database Initialization: SUCCESS');
        console.log('--------------------------------');
      }
    });
  } catch (error) {
    console.error('Failed to read schema file:', error.message);
  }
}

// IPC Handlers
ipcMain.handle('db:query', async (event, { sql, params = [] }) => {
  try {
    return await dbQuery(sql, params);
  } catch (error) {
    console.error('DB Query Error:', error);
    throw error;
  }
});

ipcMain.handle('db:execute', async (event, { sql, params = [] }) => {
  try {
    return await dbRun(sql, params);
  } catch (error) {
    console.error('DB Execute Error:', error);
    throw error;
  }
});

ipcMain.handle('db:login', async (event, { username, password }) => {
  try {
    const md5 = crypto.createHash('md5').update(password).digest('hex');
    const hashedPassword = crypto.createHash('sha1').update(md5).digest('hex');

    console.log('--- GymFlash Login Attempt ---');
    console.log('Input:', username);

    // 1. Intento con hash estándar sha1(md5(password))
    let user = await dbGet(
      'SELECT id, name, lastname, email, kind, status FROM user WHERE (email = ? OR email = ? OR name = ?) AND password = ? AND status = 1',
      [username, username.toLowerCase(), username, hashedPassword]
    );

    // 2. Intento con texto plano
    if (!user) {
      user = await dbGet(
        'SELECT id, name, lastname, email, kind, status FROM user WHERE (email = ? OR email = ? OR name = ?) AND password = ? AND status = 1',
        [username, username.toLowerCase(), username, password]
      );
    }

    // 3. Fallback especial para usuario admin
    if (!user && (username.toLowerCase() === 'admin' || username.toLowerCase() === 'administrador') && password === 'admin') {
      user = await dbGet(
        'SELECT id, name, lastname, email, kind, status FROM user WHERE (id = 1 OR email = \'admin\') AND status = 1'
      );
    }
    
    if (user) {
      console.log('Login Result: SUCCESS for', user.email || user.name);
    } else {
      console.log('Login Result: FAILED');
    }
    console.log('------------------------------');
    
    return user || null;
  } catch (error) {
    console.error('Login Handler Error:', error);
    return null;
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 780,
    useContentSize: true,
    autoHideMenuBar: true,
    minWidth: 1050,
    minHeight: 650,
    title: 'GymFlash - Control de Acceso y Gestión de Gimnasio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/favicon.svg')
  });

  win.loadURL(
    isDev
      ? 'http://localhost:5183'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
