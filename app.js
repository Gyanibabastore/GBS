// ✅ APP.JS for GYANIBABA STORE
// Setup Express, Middleware, Routes, MongoDB Connection

const express = require('express');
const path = require('path');
const multer = require('multer');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();
const MongoStore = require('connect-mongo');

const connectDB = require('./config/db');
const app = express();

// -------------------- DB CONNECTION --------------------
connectDB();

// -------------------- MIDDLEWARE --------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
// ✅ Body parser for form and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// -------------------- SESSION & FLASH --------------------


app.use(session({
  secret: process.env.SESSION_SECRET || 'yourSecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // ✅ Set this in Render
    ttl: 24 * 60 * 60 // Optional: 1 day session
  })
}));


// ✅ Helmet with Custom Content Security Policy
const { contentSecurityPolicy } = helmet;
app.use(
  contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  })
);


// ✅ Sanitize user input
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// ✅ Flash Messages for Views
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

// -------------------- FILE UPLOAD --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// -------------------- ROUTES --------------------
const authRoutes = require('./routes/authRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
