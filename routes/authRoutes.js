const path = require('path');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db'); // Changed from '../server'

module.exports = (passport) => {
  // Login routes
  router.get('/login', (req, res) => {
    res.render('login', { 
      message: req.flash('error')[0] || req.flash('info')[0] // Fixed flash access
    });
  });

  // router.post('/login', passport.authenticate('local', {
  //   successRedirect: '/dashboard',
  //   failureRedirect: '/login',
  //   failureFlash: true
  // }));

  router.post('/login', 
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: true
    }),
    (req, res) => {
      console.log('Successful login, redirecting to dashboard');
      res.redirect('/dashboard');
    }
  );

  // Registration routes
  router.get('/register', (req, res) => {
    res.render('register', { 
      message: req.flash('error')[0] || req.flash('info')[0] // Fixed flash access
    });
  });

  router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
      // 1. Validate input
      if (!username || !email || !password) {
        req.flash('error', 'All fields are required');
        return res.redirect('/register');
      }

      // 2. Check for existing user
      const userExists = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2', 
        [email, username]
      );
      
      if (userExists.rows.length > 0) {
        req.flash('error', 'Email or username already exists');
        return res.redirect('/register');
      }

      // 3. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 4. Create user
      const newUser = await pool.query(
        `INSERT INTO users (username, email, password, avatar, updated_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING id, username, email, avatar`,
        [username, email, hashedPassword, null]
      );

      // 5. Auto-login
      req.login(newUser.rows[0], (err) => {
        if (err) {
          console.error('Login after registration failed:', err);
          req.flash('info', 'Registration successful! Please login');
          return res.redirect('/login');
        }
        return res.redirect('/dashboard');
      });

    } catch (err) {
      console.error('Registration error:', err);
      req.flash('error', 'Registration failed. Please try again.');
      res.redirect('/register');
    }
  });


  router.get('/dashboard', (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash('error', 'Please login first');
      return res.redirect('/login');
    }
    
    // Debug output
    console.log('Session ID:', req.sessionID);
    console.log('Authenticated User:', req.user);
    
    res.render('dashboard', {
      user: req.user,
      title: 'Dashboard'
    });
  });

  // Dashboard route
  router.get('/dashboard', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        req.flash('error', 'Please login first');
        return res.redirect('/login');
      }
  
      // Verify user exists in database
      const user = await pool.query(
        'SELECT id, username, email, avatar FROM users WHERE id = $1',
        [req.user.id]
      );
  
      if (!user.rows[0]) {
        req.logout();
        req.flash('error', 'User not found');
        return res.redirect('/login');
      }
  
      res.render('dashboard', {
        title: 'Dashboard',
        user: user.rows[0]
      });
  
    } catch (err) {
      console.error('Dashboard error:', err);
      req.flash('error', 'Failed to load dashboard');
      res.redirect('/login');
    }
  });

  // Logout route
  router.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      req.flash('success', 'Logged out successfully');
      res.redirect('/');
    });
  });

  return router;
};