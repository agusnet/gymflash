# GymFlash 🏋️‍♂️⚡
**Control de Acceso y Gestión Integral de Gimnasios con Material Design 3 y SQLite**

GymFlash es una aplicación de escritorio multiplataforma desarrollada con **Electron, React 19, Vite y SQLite3**, inspirada en la arquitectura moderna de **KontaFlash**. Diseñada para gimnasios, centros fitness, boxes de crossfit y clubes deportivos que requieren rapidez, alta confiabilidad y operación autónoma sin depender de servidores externos en la nube.

---

## ✨ Módulos y Características Principales

### 🎯 Terminal de Control de Acceso (Check-In en Vivo)
- **Validación Instantánea de Membresía**: Búsqueda rápida por nombre, teléfono, correo o número de socio.
- **Feedback Visual Inmediato**:
  - 🟢 **Acceso Autorizado**: Si el socio tiene contrato vigente, muestra banner verde, días restantes de suscripción y confirma entrada.
  - 🔴 **Acceso Denegado**: Si la membresía está vencida o no tiene suscripción activa, muestra alerta roja y opción de renovación express.
- **Registro Automático de Asistencias**: Almacena cada ingreso en la tabla `control` con fecha y hora exacta.
- **Live Feed de Asistencias**: Visualiza en tiempo real los accesos del día desde el mostrador o recepción.

### 📊 Dashboard General
- **Métricas Clave en Tiempo Real**:
  - Socios Activos vs. Total de Socios Registrados.
  - Asistencias / Check-ins de la jornada.
  - Ingresos facturados en el mes actual.
  - Catálogo de planes activos.
- **Alertas de Próximos Vencimientos**: Alerta de socios cuyas membresías vencen en los próximos 7 días para agilizar la retención y cobranza.
- **Popularidad de Planes**: Desglose de planes más contratados por los socios.

### 👥 Directorio de Socios (Clientes)
- Padrón completo de miembros con datos de contacto (nombre, apellido, teléfono, correo, dirección).
- Filtro rápido: Todos, Activos y Vencidos.
- **Ficha Integral de Socio**: Visualiza contratos activos e históricos, historial de pagos y registro de asistencias.
- Alta, edición y baja de socios.

### 🏆 Catálogo de Membresías y Planes
- Configuración de planes por días de vigencia (e.g. Pase Diario: 1 día, Mensual: 30 días, Trimestral: 90 días, Anual VIP: 365 días).
- Fijación de precios y descripción de beneficios.
- Contador automático de socios vigentes suscritos a cada plan.

### 📅 Suscripciones y Contratos
- Emisión de contratos vinculando socio con plan.
- **Cálculo Automático de Vigencia**: Genera la fecha de fin automáticamente sumando los días de duración del plan a la fecha de inicio.
- **Cobro Inicial Integrado**: Opción de emitir automáticamente el recibo de pago en caja al dar de alta la suscripción.
- Control de estado (Vigente / Pausado / Vencido) y renovaciones.

### 💵 Caja y Registro de Pagos
- Historial financiero de cobros por membresías y servicios adicionales.
- Totales en caja: Ingresos del día e ingresos del mes en curso.
- Emisión de recibos de pago vinculados a contratos y atendidos por el personal de turno.

### 🛡️ Personal y Seguridad
- Gestión de usuarios del sistema con roles: **Administrador Total** y **Recepcionista**.
- Inicio de sesión seguro con almacenamiento local de credenciales.
- Acceso por defecto: Usuario `admin` / Contraseña `admin`.

---

## 🛠️ Tecnologías y Arquitectura

- **Framework de Escritorio**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Componentes Visuales**: Google Material Web Components ([@material/web](https://github.com/material-components/material-web)) - Material Design 3
- **Base de Datos Local**: [SQLite3](https://www.sqlite.org/) con IPC seguro (`contextBridge`)
- **Iconografía**: [Lucide React](https://lucide.dev/) + Material Symbols Outlined
- **Empaquetador**: Electron-Builder para ejecutables Windows `.exe` (NSIS)

---

## 🚀 Instalación y Puesta en Marcha

### Requisitos Previos
- Node.js (v18 o superior)
- NPM

### Pasos de Ejecución

1. **Abrir la terminal en la carpeta del proyecto**:
   ```bash
   cd c:\Users\evilnapsis\node\gymflash
   ```

2. **Ejecutar en modo de desarrollo con Electron**:
   ```bash
   npm run electron
   ```

3. **Credenciales por defecto**:
   - **Usuario / Correo**: `admin`
   - **Contraseña**: `admin`

4. **Compilar para producción (Instalador Windows .exe)**:
   ```bash
   npm run dist:win
   ```

---

## 🗄️ Estructura de la Base de Datos (SQLite)

- `user`: Administradores y recepcionistas.
- `client`: Socios y miembros del gimnasio.
- `membership`: Tipos de membresías y precios.
- `contract`: Suscripciones contratadas con fecha de inicio y vencimiento.
- `payment`: Recibos de pago y flujo de caja.
- `control`: Registro de accesos y asistencias (Check-in).
- `person`: Directorio complementario de contactos / proveedores.

---

*Desarrollado como solución desktop de alto rendimiento para centros deportivos y fitness.*
