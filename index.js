require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Middlewares
// Habilitar CORS para permitir peticiones desde tu frontend en HostGator
app.use(cors()); // Se puede configurar con más detalle: app.use(cors({ origin: 'https://tu-dominio.com' }));
app.use(express.json()); // Para parsear el body de las peticiones a JSON

// --- Configuración de Nodemailer ---
// Es crucial usar variables de entorno para no exponer tus credenciales.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Servidor SMTP de Gmail
  port: 465,
  secure: true, // true para 465, false para otros puertos como 587
  auth: {
    user: process.env.EMAIL_USER, // Tu dirección de correo desde las variables de entorno
    pass: process.env.EMAIL_PASS, // Tu contraseña de aplicación desde las variables de entorno
  },
});

// --- Rutas de la API ---

// Endpoint para recibir la solicitud de cita
app.post('/api/send-appointment-email', async (req, res) => {
  try {
    const { nombre, email, telefono, tipoCita, mensaje } = req.body;

    // 1. Validación básica de los datos recibidos
    if (!nombre || !email || !telefono || !tipoCita) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos.' });
    }
    
    // Email para el psicólogo (dueño del servicio)
    // Este email es modificable a través de la variable de entorno DEST_EMAIL
    const emailToPsychologist = {
      from: `"Formulario de Cita" <${process.env.EMAIL_USER}>`,
      to: process.env.DEST_EMAIL,
      subject: `Nueva solicitud de cita de: ${nombre}`,
      html: `
        <h1>Nueva Solicitud de Cita</h1>
        <p>Has recibido una nueva solicitud de cita a través del formulario de tu página web.</p>
        <h2>Detalles del paciente:</h2>
        <ul>
          <li><strong>Nombre:</strong> ${nombre}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Teléfono:</strong> ${telefono}</li>
          <li><strong>Tipo de Cita:</strong> ${tipoCita}</li>
        </ul>
        <h2>Mensaje:</h2>
        <p>${mensaje || 'No se incluyó un mensaje adicional.'}</p>
      `,
    };

    // Email de confirmación para el paciente
    const emailToPatient = {
      from: `"Confirmación de Solicitud" <${process.env.EMAIL_USER}>`,
      to: email, // El email del paciente que llenó el formulario
      subject: 'Hemos recibido tu solicitud de cita',
      html: `
        <h1>¡Hola, ${nombre}!</h1>
        <p>Hemos recibido correctamente tu solicitud de cita. Nos pondremos en contacto contigo a la brevedad para confirmar el día y la hora.</p>
        <p>A continuación, te dejamos un resumen de los datos que nos proporcionaste:</p>
        <ul>
          <li><strong>Nombre:</strong> ${nombre}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Teléfono:</strong> ${telefono}</li>
          <li><strong>Tipo de Cita:</strong> ${tipoCita}</li>
          <li><strong>Mensaje:</strong> ${mensaje || 'No se incluyó un mensaje adicional.'}</li>
        </ul>
        <p>Gracias por tu confianza.</p>
        <p><em>Este es un correo automático, por favor no respondas a este mensaje.</em></p>
      `,
    };

    // 2. Enviar ambos correos en paralelo
    await Promise.all([
        transporter.sendMail(emailToPsychologist),
        transporter.sendMail(emailToPatient)
    ]);

    // 3. Responder con éxito
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ success: false, error: 'Ocurrió un error al procesar tu solicitud.' });
  }
});

// Ruta raíz para verificar que el servidor funciona (útil para Render)
app.get('/', (req, res) => {
  res.send('El backend está funcionando correctamente.');
});

// --- Iniciar el servidor ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 