require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3001;
const BASE_URL = process.env.BASE_URL;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5
});

// Hash de relleno: se compara aunque el correo no exista, para que
// la respuesta tarde lo mismo y no revele qué correos están registrados
const HASH_FALSO = bcrypt.hashSync('relleno-no-valido', 10);

// Necesario porque Caddy va delante y termina el HTTPS
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session({
  name: 'empleados.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: BASE_URL.startsWith('https')
  }
}));

// Evita inyectar HTML con datos del usuario
function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pagina(titulo, contenido) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titulo}</title>
  <link rel="stylesheet" href="/estilos.css">
</head>
<body>
  <main class="tarjeta">${contenido}</main>
</body>
</html>`;
}

function paginaLogin(error, email) {
  const bloqueError = error
    ? `<div class="error" role="alert">${escapar(error)}</div>`
    : '';
  return pagina('Portal de colaboradores', `
    <h1>Portal de colaboradores</h1>
    <p>Asociación de Emprendedores CR</p>
    ${bloqueError}
    <form method="POST" action="/login">
      <label for="email">Correo electrónico</label>
      <input type="email" id="email" name="email" value="${escapar(email || '')}" required autofocus>

      <label for="password">Contraseña</label>
      <input type="password" id="password" name="password" required>

      <button type="submit">Iniciar sesión</button>
    </form>
  `);
}

function requiereSesion(req, res, next) {
  if (req.session.usuario) {
    // Evita que el botón "atrás" muestre el panel después de cerrar sesión
    res.set('Cache-Control', 'no-store');
    return next();
  }
  res.redirect('/');
}

// Pantalla de inicio de sesión
app.get('/', (req, res) => {
  if (req.session.usuario) return res.redirect('/panel');
  res.send(paginaLogin());
});

// Validación de credenciales
app.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).send(paginaLogin('Debes ingresar correo y contraseña.', email));
  }

  try {
    const [filas] = await pool.execute(
      'SELECT id, email, password_hash, rol FROM usuarios WHERE email = ?',
      [email]
    );
    const usuario = filas[0];

    const coincide = await bcrypt.compare(
      password,
      usuario ? usuario.password_hash : HASH_FALSO
    );

    if (!usuario || !coincide) {
      return res.status(401).send(paginaLogin('Correo o contraseña incorrectos.', email));
    }

    // Sesión nueva al iniciar sesión (previene fijación de sesión)
    req.session.regenerate((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send(paginaLogin('Error del servidor. Intenta de nuevo.', email));
      }
      req.session.usuario = { id: usuario.id, email: usuario.email, rol: usuario.rol };
      res.redirect('/panel');
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(paginaLogin('Error del servidor. Intenta de nuevo.', email));
  }
});

// Página protegida
app.get('/panel', requiereSesion, (req, res) => {
  const { email, rol } = req.session.usuario;
  res.send(pagina('Panel', `
    <h1 id="etiqueta-bienvenida">Bienvenido al portal de colaboradores</h1>
    <p>${escapar(email)}</p>
    <p class="rol">Rol: ${escapar(rol)}</p>
    <a class="boton-salir" href="/logout">Cerrar sesión</a>
  `));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('empleados.sid');
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Sitio de empleados en el puerto ${PORT} (${BASE_URL})`);
});