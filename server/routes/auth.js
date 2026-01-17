const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const session = require('express-session');

const { register, login, currentUser, oauthCallback } = require('../controllers/auth');

// Session middleware for OAuth
router.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize passport
router.use(passport.initialize());
router.use(passport.session());

// Traditional auth routes
router.post('/register', register);     
router.post('/login', login);
router.post('/current-user', currentUser);
router.post('/current-admin', currentUser);
router.get('/me', currentUser);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
  oauthCallback
);

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=facebook_failed' }),
  oauthCallback
);

module.exports = router;
