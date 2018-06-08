const path = require('path')

const express = require('express')
const passport = require('passport')
const TypeformStrategy = require('passport-typeform')
const cookieSession = require('cookie-session')
const dotenv = require('dotenv').config()

const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))

app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: ['aCookieKey']
  })
)

/* =====================
   Initialize passport
======================== */
app.use(passport.initialize())
app.use(passport.session())

/* =====================
   Configure Passport
======================== */
passport.use(
  new TypeformStrategy(
    {
      // authorizeURL and tokenURL are set by default in the Strategy
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.REDIRECT_URL || '/auth/typeform/redirect',
      scope: [
        'accounts:read', // this scope is also added by default in the Strategy, to be able to return a profile
        'forms:read',
        'forms:write',
        'themes:read',
        'themes:write',
        'images:read',
        'images:write',
        'webhooks:read',
        'webhooks:write',
        'responses:read'
      ]
    },
    (accessToken, refreshToken, profile, cb) => {
      /*
      this is the "verify callback", it fires after exchanging the temp code for profile info + token

      the second argument on cb() will be on the req.user object
      */
      cb(null, { access_token: accessToken, profile })
    }
  )
)

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

/* =====================
      OAuth Routes
======================== */

app.get('/auth/typeform', passport.authenticate('typeform'))

app.get(
  '/auth/typeform/redirect',
  (req, res, next) => {
    // Handle the user declining consent
    if (!req.query.code) {
      return res.redirect('/')
    }

    passport.authenticate('typeform')(req, res, next)
  },
  (req, res) => {
    /* this fires AFTER the passport callback function
    the `user` obj comes in the request as per passport.serialize/deserialize */
    console.log(req.user)
    res.redirect('/authenticated')
  }
)

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

/* =====================
      General Routes
======================== */

app.get('/', (req, res) => res.render('home'))
app.get('/authenticated', (req, res) =>
  res.render('authenticated', { user: req.user })
)

const port = process.env.PORT || 9031

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`app and running at http://localhost:${port}`)
})
