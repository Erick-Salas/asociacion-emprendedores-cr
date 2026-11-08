require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = 3000;
const BASE_URL = process.env.BASE_URL;

// Necesario porque Caddy va delante y termina el HTTPS
app.set('trust proxy', 1);

app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: BASE_URL.startsWith('https')
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${BASE_URL}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
  done(null, {
    id: profile.id,
    nombre: profile.displayName,
    email: profile.emails && profile.emails[0] ? profile.emails[0].value : ''
  });
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Evita inyectar HTML con el nombre del usuario
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

function requiereSesion(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

// Pantalla de inicio de sesión
app.get('/', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/bienvenida');
  res.send(pagina('Iniciar sesión', `
    <h1>Asociación de Emprendedores CR</h1>
    <p>Inicia sesión para continuar</p>
    <a class="boton-google" href="/auth/google">Iniciar sesión con Google</a>
  `));
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect('/bienvenida')
);

// Página protegida con la etiqueta de bienvenida
app.get('/bienvenida', requiereSesion, (req, res) => {
  res.send(pagina('Bienvenida', `
    <h1 id="etiqueta-bienvenida">Bienvenido, ${escapar(req.user.nombre)}</h1>
    <p>${escapar(req.user.email)}</p>
    <a class="boton-salir" href="/logout">Cerrar sesión</a>
  `));
});

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => res.redirect('/'));
  });
});

app.listen(PORT, () => {
  console.log(`Sitio de clientes en el puerto ${PORT} (${BASE_URL})`);
});