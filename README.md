# Asociación de Emprendedores CR

Proyecto universitario que simula la plataforma de una asociación de emprendedores. Todo corre **localmente** en una sola computadora, con dominios ficticios que no existen en internet.


---

## Contenido

1. [Descripción general](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Tecnologías](#tecnologías)
4. [Estructura del repositorio](#estructura-del-repositorio)
5. [Requisitos previos](#requisitos-previos)
6. [Instalación y configuración](#instalación-y-configuración)
7. [Ejecución](#ejecución)
8. [Guía de uso](#guía-de-uso)
9. [Pruebas realizadas](#pruebas-realizadas)
10. [Seguridad](#seguridad)
11. [Solución de problemas](#solución-de-problemas)
12. [Limitaciones conocidas](#limitaciones-conocidas)

---

## Descripción general

El sistema tiene tres componentes:

| Componente | Descripción | Dirección |
|---|---|---|
| **Sitio de clientes** | Los clientes inician sesión únicamente con su cuenta de Google y ven una etiqueta de bienvenida. | `https://www.asociaciondeemprendedorescr.com` |
| **Sitio de empleados** | Los colaboradores inician sesión con correo y contraseña. Si las credenciales son incorrectas se muestra un error. | `https://www.empleados.asociaciondeemprendedorescr.com` |
| **App de escritorio (Java)** | Permite registrar usuarios en la base de datos del sitio de empleados: correo de empresa (`@asociaciondeemprendedorescr.com`), contraseña provisional y rol (empleado, administrador o emprendedor). | Aplicación Swing |

Los dominios son ficticios. Se resuelven en la propia computadora mediante el archivo `hosts` de Windows, y se sirven con HTTPS local gracias a Caddy.

## Arquitectura

```
Navegador
   │  https://www.asociaciondeemprendedorescr.com
   │  https://www.empleados.asociaciondeemprendedorescr.com
   ▼
archivo hosts  ──►  127.0.0.1
   ▼
Caddy (proxy inverso, HTTPS local)
   ├──►  sitio-clientes   (Node.js, puerto 3000) ──► Google OAuth 2.0
   └──►  sitio-empleados  (Node.js, puerto 3001) ──┐
                                                   ▼
                                          MySQL: asociacion_db
                                                   ▲
                                                   │
                         App de escritorio Java ───┘
```

## Tecnologías

- **Node.js** con **Express** (sitios web)
- **Passport** (`passport-google-oauth20`) para el inicio de sesión con Google
- **express-session** para las sesiones
- **MySQL 8** como base de datos
- **bcrypt** (`bcryptjs` en Node y `jBCrypt` en Java) para guardar las contraseñas
- **Java** con **Swing** y **Maven** (app de escritorio)
- **Caddy** como proxy inverso con certificados locales
- **Git** y **GitHub Desktop** para el control de versiones

## Estructura del repositorio

```
asociacion-emprendedores-cr/
├── sitio-clientes/        # Sitio 1: login con Google (puerto 3000)
├── sitio-empleados/       # Sitio 2: login con correo y contraseña (puerto 3001)
├── app-escritorio/        # App Java para registrar usuarios
├── base-de-datos/
│   └── schema.sql         # Script de creación de la base de datos
├── Caddyfile              # Configuración de dominios locales
└── README.md
```

## Requisitos previos

| Programa | Versión recomendada |
|---|---|
| Node.js | LTS |
| JDK | 17 o superior |
| IntelliJ IDEA (o IDE con soporte Maven) | Reciente |
| MySQL Community Server y Workbench | 8.x |
| Caddy | 2.x |
| Git / GitHub Desktop | Reciente |

Verificación en PowerShell:

```powershell
node -v
npm -v
java -version
mysql --version
caddy version
```

Además se necesita una **cuenta de Google** para configurar las credenciales OAuth.

## Instalación y configuración

### 1. Clonar el repositorio

Desde GitHub Desktop (**File → Clone repository**) o con Git:

```powershell
git clone https://github.com/_[usuario]_/asociacion-emprendedores-cr.git
cd asociacion-emprendedores-cr
```

### 2. Base de datos

1. Abre `base-de-datos/schema.sql` en MySQL Workbench.
2. Cambia la contraseña de ejemplo (`cambia_esta_clave`) del usuario `app_user` por una propia.
3. Ejecuta el script completo. Crea la base `asociacion_db`, la tabla `usuarios` y el usuario `app_user` con permisos limitados (`SELECT`, `INSERT`, `UPDATE`).

Estructura de la tabla `usuarios`:

| Columna | Tipo | Detalle |
|---|---|---|
| `id` | INT | Llave primaria, autoincremental |
| `email` | VARCHAR(150) | Único |
| `password_hash` | VARCHAR(100) | Hash bcrypt |
| `rol` | ENUM | `empleado`, `administrador`, `emprendedor` |
| `fecha_creacion` | TIMESTAMP | Fecha de registro |

### 3. Dominios ficticios (archivo hosts)

Abre el Bloc de notas **como administrador** y edita `C:\Windows\System32\drivers\etc\hosts`. Agrega:

```
127.0.0.1 www.asociaciondeemprendedorescr.com
127.0.0.1 www.empleados.asociaciondeemprendedorescr.com
```

Luego limpia la caché DNS:

```powershell
ipconfig /flushdns
```

### 4. Caddy

Desde PowerShell **como administrador**, en la raíz del repositorio:

```powershell
caddy start
caddy trust
```

> Caddy debe estar corriendo **antes** de ejecutar `caddy trust`. Este comando instala el certificado local una sola vez. Se recomienda Chrome o Edge para probar.

### 5. Credenciales de Google (sitio de clientes)

1. Entra a [console.cloud.google.com](https://console.cloud.google.com) y crea un proyecto.
2. Configura la **pantalla de consentimiento de OAuth** como **Externo**, en modo **Testing**, y agrega como usuarios de prueba las cuentas de Google que vayan a iniciar sesión.
3. Crea un **ID de cliente de OAuth** de tipo *Aplicación web* con este URI de redireccionamiento autorizado:

```
https://www.asociaciondeemprendedorescr.com/auth/google/callback
```

4. Copia el ID y el secreto del cliente para el siguiente paso.

> Google puede rechazar dominios ficticios. Si ocurre, registra también `http://localhost:3000/auth/google/callback` como URI autorizado, usa `BASE_URL=http://localhost:3000` en el `.env` y entra al sitio por `http://localhost:3000`.

### 6. Variables de entorno

Cada sitio tiene un archivo `.env.example`. Cópialo como `.env` y completa los valores. **Los archivos `.env` no se suben a GitHub.**

**`sitio-clientes/.env`**

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=
BASE_URL=https://www.asociaciondeemprendedorescr.com
```

**`sitio-empleados/.env`**

```
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=
DB_NAME=asociacion_db
SESSION_SECRET=
BASE_URL=https://www.empleados.asociaciondeemprendedorescr.com
```

`SESSION_SECRET` debe ser una cadena larga y aleatoria, distinta en cada sitio.

### 7. Instalar dependencias de los sitios

```powershell
cd sitio-clientes
npm install
cd ..\sitio-empleados
npm install
cd ..
```

### 8. App de escritorio

1. Dentro de `app-escritorio`, copia `config.properties.example` como `config.properties` y completa los datos:

```
db.host=localhost
db.port=3306
db.name=asociacion_db
db.user=app_user
db.password=
```

2. Abre la carpeta `app-escritorio` en IntelliJ IDEA y carga el proyecto Maven (**Reload All Maven Projects**). El archivo `config.properties` tampoco se sube a GitHub.

## Ejecución

Se necesitan cuatro cosas corriendo. Usa una terminal distinta para cada servidor.

| # | Qué | Cómo |
|---|---|---|
| 1 | MySQL | Servicio **MySQL80** de Windows activo |
| 2 | Caddy | `caddy start` (desde la raíz del repositorio) |
| 3 | Sitio de clientes | `cd sitio-clientes` y luego `node server.js` |
| 4 | Sitio de empleados | `cd sitio-empleados` y luego `node server.js` |

La **app de escritorio** se ejecuta desde IntelliJ (`Main.java` → **Run**) o, tras generar el `.jar`, con el directorio actual en `app-escritorio` (donde está `config.properties`):

```powershell
java -jar target\registro-usuarios-1.0.jar
```

El `.jar` se genera en IntelliJ con **Maven → registro-usuarios → Lifecycle → package**.

Para detener Caddy: `caddy stop`.

## Guía de uso

### Sitio de clientes

1. Entra a `https://www.asociaciondeemprendedorescr.com`.
2. Presiona **Iniciar sesión con Google** y elige una cuenta autorizada.
3. Se muestra la etiqueta **"Bienvenido, _[nombre]_"**.
4. **Cerrar sesión** regresa a la pantalla de inicio.

### Registrar un usuario (app de escritorio)

1. Abre la aplicación.
2. Escribe el correo de empresa (debe terminar en `@asociaciondeemprendedorescr.com`).
3. Escribe la contraseña provisional (mínimo 8 caracteres).
4. Elige el rol: empleado, administrador o emprendedor.
5. Presiona **Registrar usuario**.

### Sitio de empleados

1. Entra a `https://www.empleados.asociaciondeemprendedorescr.com`.
2. Escribe el correo y la contraseña de un usuario registrado desde la app de escritorio.
3. Si los datos son correctos, se accede al panel con el correo y el rol. Si no, se muestra el mensaje **"Correo o contraseña incorrectos."**

## Pruebas realizadas

| Prueba | Resultado |
|---|---|
| Login con Google con cuenta autorizada | Muestra la bienvenida |
| Acceso directo a `/bienvenida` sin sesión | Redirige al inicio |
| Registro de usuario válido en la app Java | Se guarda con hash bcrypt |
| Registro con correo fuera del dominio de la asociación | Rechazado por la app |
| Registro con correo duplicado | Mensaje de usuario ya existente |
| Contraseña provisional menor a 8 caracteres | Rechazada por la app |
| Login de colaboradores con credenciales correctas | Accede al panel |
| Login de colaboradores con contraseña incorrecta | Muestra error |
| Login de colaboradores con correo inexistente | Muestra el mismo error |
| Acceso directo a `/panel` sin sesión | Redirige al inicio |
| Creación de usuarios colaboradores por medio de la aplicación java |
| Creación de usuarios en la aplicación de java con correo incorrecto | Muestra error |

## Seguridad

- Las contraseñas se almacenan con **hash bcrypt**, nunca en texto plano.
- Las consultas SQL usan **parámetros** (`?`) para evitar inyección SQL.
- La aplicación usa un usuario de base de datos con **permisos limitados**, no `root`.
- Los mensajes de error del login no revelan si el correo existe.
- Las sesiones usan cookies `httpOnly` y `secure`, y se regeneran al iniciar sesión.
- El texto mostrado en las páginas se escapa para evitar inyección de HTML.
- Las credenciales (`.env`, `config.properties`) están excluidas del repositorio mediante `.gitignore`.

## Solución de problemas

| Problema | Causa probable y solución |
|---|---|
| `caddy trust` falla con "connection refused" al puerto 2019 | Caddy no está corriendo. Ejecuta primero `caddy start`. |
| Error **502 Bad Gateway** | El servidor Node del sitio correspondiente no está corriendo, o falló al iniciar. Revisa la terminal. |
| El dominio no carga | Revisa el archivo `hosts`, ejecuta `ipconfig /flushdns` y reinicia el navegador. |
| Advertencia de certificado | Repite `caddy trust` como administrador. Usa Chrome o Edge. |
| `redirect_uri_mismatch` en Google | El URI del `.env` no coincide exactamente con el de Google Cloud. |
| `access_denied` en Google | La cuenta no está en la lista de usuarios de prueba. |
| `ECONNREFUSED` o `Access denied` en MySQL | Servicio detenido o contraseña de `app_user` incorrecta en el `.env` o `config.properties`. |
| `EADDRINUSE` | El puerto 3000 o 3001 ya está en uso por otro `node server.js`. |
| La app Java no encuentra `config.properties` | Ejecuta desde la carpeta `app-escritorio` (o ajusta el *Working directory* en IntelliJ). |

## Limitaciones conocidas

- El proyecto está pensado para correr **solo en un entorno local**; no está preparado para producción.
- Los dominios son ficticios y solo funcionan en la computadora donde se configuró el archivo `hosts`.
- El sitio de clientes depende de que Google acepte la configuración OAuth con un dominio ficticio y de que el usuario esté en la lista de usuarios de prueba.
- El sitio de empleados permite iniciar sesión a cualquier usuario registrado, sin importar su rol; los roles se almacenan pero aún no restringen el acceso.
- La aplicación de escritorio solo registra usuarios; no edita ni elimina.