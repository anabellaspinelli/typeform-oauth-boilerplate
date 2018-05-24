const express = require('express')
const passport = require('passport')
const TypeformStrategy = require('passport-typeform')
const cookieSession = require('cookie-session')

const path = require('path')

const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))
app.use(express.static(path.join(__dirname, '../public')))

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
      this verify callback function fires after exchanging code for profile info + token

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
  passport.authenticate('typeform'),
  (req, res) => {
    res.redirect('/authenticated')
  }
)

/* =====================
      General Routes
======================== */

app.get('/', (req, res) => res.render('home'))
app.get('/authenticated', (req, res) =>
  res.render('authenticated', { user: req.user })
)

const port = process.env.PORT || 3000

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`app listening on port ${port}`)
})
