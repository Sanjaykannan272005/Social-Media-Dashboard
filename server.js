require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const flash = require('connect-flash');
const pool = require('./db'); // Import pool from db.js
const CryptoJS = require('crypto-js');

const app = express();



// Add these right after creating the pool
require('./config/passport')(passport, pool); // Initialize passport

// Then add these middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));
app.use(passport.initialize());
app.use(passport.session());


// Encryption middleware
app.use((req, res, next) => {
  if (req.headers['x-encrypted']) {
    try {
      const decrypted = CryptoJS.AES.decrypt(
        req.body.content, 
        process.env.ENCRYPTION_SECRET
      ).toString(CryptoJS.enc.Utf8);
      
      req.body.content = decrypted;
    } catch (err) {
      console.error('Decryption failed:', err);
    }
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// Add this after passport initialization
app.use((req, res, next) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  next();
});

// Add this right after passport initialization
app.use((req, res, next) => {
  console.log('--- Session Debug ---');
  console.log('Session ID:', req.sessionID);
  console.log('Authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  console.log('---------------------');
  next();
});

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/', require('./routes/authRoutes')(passport));


// Add this right before your error handler middleware
app.get('/', (req, res) => {
  console.log('Root route - isAuthenticated:', req.isAuthenticated());
  
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Mount routes in this order:
app.use('/', require('./routes/authRoutes')(passport));
app.use('/api', require('./routes/apiRoutes')); // If you have API routes

// Then add your root route
// app.get('/', (req, res) => {
//   // ... (the code from step 1)
// });

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-strong-secret-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  },
  store: new (require('connect-pg-simple')(session))({
    pool: pool, // Use your existing pool
    tableName: 'user_sessions'
  })
}));

// Finally, add error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


// Make sure these lines exist:
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

