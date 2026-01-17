const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const prisma = require('./prisma');

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('Google account does not have an email address'), null);
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email }
        });

        if (user) {
          // User exists, update picture if available
          if (profile.photos && profile.photos[0]) {
            await prisma.user.update({
              where: { id: user.id },
              data: { picture: profile.photos[0].value },
            });
            user.picture = profile.photos[0].value;
          }
          return done(null, user);
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.name?.givenName || 'User',
              password: null, // No password for OAuth users
              role: 'user',
              enabled: true,
              picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            },
          });
          return done(null, user);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || 'your-facebook-app-id',
      clientSecret: process.env.FACEBOOK_APP_SECRET || 'your-facebook-app-secret',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'photos', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        if (!email) {
          return done(new Error('Facebook account does not have an email address'), null);
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists, update picture if available
          if (profile.photos && profile.photos[0]) {
            await prisma.user.update({
              where: { id: user.id },
              data: { picture: profile.photos[0].value },
            });
            user.picture = profile.photos[0].value;
          }
          return done(null, user);
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || 'User',
              password: null, // No password for OAuth users
              role: 'user',
              enabled: true,
              picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            },
          });
          return done(null, user);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

