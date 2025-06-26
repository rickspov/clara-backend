require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Middlewares
// Habilitar CORS para permitir peticiones desde tu frontend en HostGator
app.use(cors()); // Se puede configurar con más detalle: app.use(cors({ origin: 'https://tu-dominio.com' }));
app.use(express.json()); // Para parsear el body de las peticiones a JSON

// --- Configuración de Nodemailer ---
// Cambiado para usar Outlook SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // true para 465, false para 587
  auth: {
    user: process.env.EMAIL_USER, // Tu correo de Outlook desde las variables de entorno
    pass: process.env.EMAIL_PASS, // Tu contraseña de Outlook desde las variables de entorno
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

// Almacenamiento temporal en memoria para sesiones pagadas (solo para pruebas)
const paidSessions = new Map();

// --- Rutas de la API ---

// Endpoint para recibir la solicitud de cita
app.post('/api/send-appointment-email', async (req, res) => {
  try {
    console.log('BODY RECIBIDO:', req.body); // Log para depuración
    const { nombre, email, telefono, tipoCita, mensaje, session_id } = req.body;

    // 1. Validación básica de los datos recibidos
    if (!nombre || !email || !telefono || !tipoCita) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos.' });
    }

    // 2. Validación según tipo de cita
    if (tipoCita.toLowerCase() === 'online') {
      if (!session_id) {
        return res.status(400).json({ success: false, error: 'Falta session_id para cita online.' });
      }
      if (!paidSessions.has(session_id)) {
        return res.status(403).json({ success: false, error: 'El pago no ha sido verificado o session_id inválido.' });
      }
    }
    // Para cita presencial, no se exige session_id ni validación de pago

    // Email para el psicólogo (dueño del servicio)
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
      to: email,
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

    // 3. Enviar ambos correos en paralelo
    await Promise.all([
        transporter.sendMail(emailToPsychologist),
        transporter.sendMail(emailToPatient)
    ]);

    // 4. Responder con éxito
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ success: false, error: 'Ocurrió un error al procesar tu solicitud.' });
  }
});

// Endpoint para crear una sesión de pago de Stripe
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Aquí puedes ajustar el precio y la moneda según tu configuración en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'mxn', // Cambia la moneda si es necesario
            product_data: {
              name: 'Consulta Online 60 min',
            },
            unit_amount: 80000, // Monto en centavos (ejemplo: 800.00 MXN)
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/pago-exitoso?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/pago-cancelado',
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creando la sesión de Stripe:', error);
    res.status(500).json({ error: 'No se pudo crear la sesión de pago.' });
  }
});

// Endpoint para el webhook de Stripe
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // Debes agregar esta variable en tu .env
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento de sesión completada
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Guardar el session_id y el email del comprador
    paidSessions.set(session.id, session.customer_email || session.customer_details?.email);
    // Aquí podrías guardar en base de datos en vez de memoria
    console.log('Pago exitoso registrado para session:', session.id, 'email:', session.customer_email || session.customer_details?.email);
  }

  res.json({ received: true });
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