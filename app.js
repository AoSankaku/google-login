const express = require('express');
const bodyParser = require('body-parser');
const {OAuth2Client} = require('google-auth-library');
const app = express();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

app.use(express.static('client'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());

function extractProfile (profile) {
  let imageUrl = '';
  if (profile.photos && profile.photos.length) {
    imageUrl = profile.photos[0].value;
  }
  return {
    id: profile.id,
    displayName: profile.displayName,
    image: imageUrl
  };
}

passport.use(new GoogleStrategy({
  clientID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  clientSecret: 'YOUR_CLIENT_SECRET',
  callbackURL: 'http://localhost:3000/login/google/callback',
  accessType: 'offline'
}, (accessToken, refreshToken, profile, cb) => {
  cb(null, extractProfile(profile));
}));

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

app.post('/auth', (req, res) => {
  const token = req.body.idtoken;
  const client = new OAuth2Client(CLIENT_ID);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const user = {};
    user.email = payload['email'];
    user.picture = payload['picture'];
    res.send(user);
  }
  verify().catch(console.error);
});

app.get('/login/google/redirect', (req, res, next) => {
    if (req.query.return) {
      req.session.oauth2return = req.query.return;
    }
    next();
  },
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get('/login/google/callback', passport.authenticate('google'), (req, res) => {
  const redirect = req.session.oauth2return || '/';
  delete req.session.oauth2return;
  res.redirect(redirect);
});

app.listen(3000, () => console.log('Example app listening on port 3000!'))