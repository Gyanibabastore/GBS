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
  GUPSHUP_API_KEY,
  GUPSHUP_SOURCE_NUMBER,
  GUPSHUP_APP_NAME,
  NGROK_AUTHTOKEN,
  NODE_ENV
} = process.env;

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

  if (NODE_ENV !== 'production') {
    try {
      const url = await ngrok.connect({
        addr: PORT,
        authtoken: NGROK_AUTHTOKEN
      });
      console.log(`🌐 Ngrok tunnel available at: ${url}`);
    } catch (err) {
      console.error("❌ Ngrok error:", err.message);
    }
  }
});
