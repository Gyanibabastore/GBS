require('dotenv').config();
process.traceDeprecation = true;

const express = require('express');
const path = require('path');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const ngrok = require('ngrok');
const webhookRoutes = require('./routes/webhook');

const sendWhatsApp = require('./utils/whatsapp');
const connectDB = require('./config/db');
const app = express();






// -------------------- LOAD ENV VARIABLES --------------------
const {
  EMAIL_USER,
  EMAIL_PASS,
  JWT_SECRET,
  PORT = 8080,
  SESSION_SECRET,
  MONGO_URI,
  NGROK_AUTHTOKEN,
  NODE_ENV
} = process.env;




// ✅ Verification endpoint (Meta setup requires this)
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = "your_verify_token"; // You set this on Meta

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// ✅ Webhook Receiver
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach(entry => {
      entry.changes.forEach(change => {
        const value = change.value;

        // ✅ Only process actual messages (ignore statuses)
        if (value.messages) {
          value.messages.forEach(async (message) => {
            const from = message.from; // Sender number
            const text = message.text?.body || '';

            console.log(`📥 Incoming message from ${from}: ${text}`);

            // ✅ Replying to the user (optional)
            const replyText = `Hi! You said: ${text}`;
            await sendWhatsApp(from, replyText); // auto-reply using your function
          });
        }

        // ❌ Ignore statuses (delivered, read, etc.)
        if (value.statuses) {
          // console.log('ℹ️ Ignored status event:', value.statuses);
        }
      });
    });
  }

  res.sendStatus(200);
});

// -------------------- DB CONNECTION --------------------
connectDB();

// -------------------- MIDDLEWARE --------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// -------------------- SESSION --------------------
app.use(session({
  secret: SESSION_SECRET || 'fallbacksecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 24 * 60 * 60 * 7
  })
}));

app.use(flash());
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

// -------------------- HELMET --------------------
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "*"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// -------------------- SANITIZE --------------------
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// -------------------- FILE UPLOAD --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// -------------------- ROUTES --------------------
const authRoutes = require('./routes/authRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
app.use('/', webhookRoutes);
app.use('/auth', authRoutes);
app.use('/buyer', buyerRoutes);
app.use('/admin', adminRoutes);
app.use('/seller', sellerRoutes);

// -------------------- HOME --------------------
app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// -------------------- 404 HANDLER --------------------
app.use((req, res) => {
  res.status(404).render('error/404', { msg: 'Page not found.' });
});

// -------------------- 500 HANDLER --------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error/500', { msg: 'Something went wrong on the server.' });
});

// -------------------- SERVER --------------------
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);


});
