# Backend para Solicitud de Citas - Clacas

Este es un backend simple y eficiente construido con Node.js y Express, diseñado para gestionar solicitudes de citas enviadas desde un formulario web. Utiliza Nodemailer para enviar notificaciones por correo electrónico tanto al profesional como al paciente que realiza la solicitud.

Está preparado para ser desplegado fácilmente en [Render](https://render.com/).

## 🚀 Funcionalidades Principales

- **Endpoint único**: `POST /api/send-appointment-email` para recibir los datos del formulario.
- **Doble Notificación por Email**:
  1.  Envía un correo con los detalles de la cita al email del profesional (configurable).
  2.  Envía un correo de confirmación automático al paciente.
- **Configuración Segura**: Utiliza variables de entorno para gestionar datos sensibles como credenciales de correo.
- **CORS Habilitado**: Preparado para recibir solicitudes desde cualquier frontend, como el que tienes en HostGator.

---

## ⚙️ Configuración y Puesta en Marcha Local

Sigue estos pasos para ejecutar el proyecto en tu máquina local.

### 1. Clona el Repositorio

```bash
git clone <URL_DE_TU_REPOSITORIO_EN_GITHUB>
cd clacas-backend
```

### 2. Instala las Dependencias

```bash
npm install
```

### 3. Crea tu Archivo de Entorno

Crea un archivo llamado `.env` en la raíz del proyecto. Este archivo contendrá las variables que la aplicación necesita para funcionar.

```
# .env

# Credenciales para el envío de correos con Gmail.
# IMPORTANTE: Si usas autenticación en 2 pasos (2FA) en tu cuenta de Google,
# debes generar una "Contraseña de aplicación" y usarla aquí.
# No uses tu contraseña principal de Gmail.
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion_de_google

# Correo del profesional que recibirá las notificaciones de nuevas citas.
DEST_EMAIL=rianroca313@gmail.com

# Puerto para el entorno local (opcional).
PORT=3001
```

### 4. Ejecuta el Servidor

```bash
npm run dev
```

El servidor se iniciará en modo de desarrollo y estará escuchando en `http://localhost:3001`.

---

## ☁️ Despliegue en Render (Hosting Gratuito)

Render es una plataforma ideal para desplegar este tipo de servicios.

### Pasos para el Despliegue:

1.  **Sube tu código a GitHub**: Asegúrate de que tu proyecto esté en un repositorio de GitHub. El archivo `.gitignore` debería excluir la carpeta `node_modules` y el archivo `.env`.

2.  **Crea una Cuenta en Render**: Si aún no tienes una, regístrate en [render.com](https://render.com/).

3.  **Crea un Nuevo "Web Service"**:
    - En tu dashboard de Render, haz clic en **"New +"** y selecciona **"Web Service"**.
    - Conecta tu cuenta de GitHub y elige el repositorio `clacas-backend`.

4.  **Configura el Servicio Web**:
    - **Name**: Elige un nombre para tu servicio (ej. `clacas-api`).
    - **Region**: Elige la región más cercana a ti.
    - **Branch**: `main` (o la rama principal de tu repositorio).
    - **Root Directory**: Déjalo en blanco si `package.json` está en la raíz.
    - **Runtime**: Render debería detectar `Node` automáticamente.
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
    - **Instance Type**: `Free` (para el plan gratuito).

5.  **Añade las Variables de Entorno**:
    - Antes de finalizar, ve a la sección **"Environment"**.
    - Haz clic en **"Add Environment Variable"** y añade las mismas claves que tienes en tu archivo `.env` local:
      - `EMAIL_USER`: con tu email de Gmail.
      - `EMAIL_PASS`: con tu contraseña de aplicación.
      - `DEST_EMAIL`: con el correo del profesional.
    - No es necesario añadir `PORT`, Render lo gestiona automáticamente.

6.  **Despliega**:
    - Haz clic en **"Create Web Service"**.
    - Render instalará las dependencias y ejecutará el comando de inicio. La primera vez puede tardar unos minutos.

¡Y listo! Tu backend estará en línea en una URL pública proporcionada por Render (algo como `https://tu-servicio.onrender.com`). Ya puedes usar esta URL en tu frontend de HostGator.

---

## 🔧 Uso de la API

- **URL**: `https://tu-servicio.onrender.com/api/send-appointment-email`
- **Método**: `POST`
- **Body (JSON)**:
  ```json
  {
    "nombre": "Juan Pérez",
    "email": "juan.perez@example.com",
    "telefono": "+123456789",
    "tipoCita": "Presencial",
    "mensaje": "Me gustaría agendar una primera consulta."
  }
  ``` 