var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var session = require('express-session');
var passport = require('passport');
var expressHandlebars = require('express-handlebars');
var LocalStrategy = require('passport-local');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook');
var bcrypt = require('bcryptjs');
var flash = require('connect-flash');
var config = require('./config').config;
var User = require('./models/user').User;

var home = require('./routes/home');
var signup = require('./routes/signup');
var login = require('./routes/login');
var todo = require('./routes/todo');
var email = require('./routes/email');

var app = express();

var GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = config.GOOGLE_CLIENT_SECRET;

// connect to mongodb
mongoose.connect('mongodb://localhost/tododb1');

// view engine setup
app.set('views', path.join(__dirname, 'views'));

var hbs = expressHandlebars.create({
  helpers: {
    dateFormat: function(value) {
      var options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      };

      return new Date(value).toLocaleString('en-US', options);
    }
  },
  defaultLayout: 'main',
  extname: '.hbs'
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({secret: 'stellar', saveUninitialized: true, resave: true}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', home);
app.use('/login', login);
app.use('/signup', signup);
app.use('/todo', todo);
app.use('/email', email);

// Passport strategies
// Local strategy
passport.use('local-signup', new LocalStrategy({
    usernameField: 'email'
  },
  function(email, password, done) {
    User.findOne({ email: email }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        var passwordHash = bcrypt.hashSync(password, 8);

        // Insert into db
        var NewUser = new User({
          email: email,
          password_hash: passwordHash,
          auth_method: 'local',
          timestamp: Date.now()
        });
        NewUser.save().then(function(user) {
          return done(null, user);  
        });
      } else {
        return done(null, false, { message: 'Email already exists' });
      }
    });
  }
));

passport.use('local-login', new LocalStrategy({
    usernameField: 'email'
  },
  function(email, password, done) {
    User.findOne({ email: email }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!bcrypt.compareSync(password, user.password_hash)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

// Google strategy
passport.use('google', new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback"
}, function(accessToken, refreshToken, profile, done) {
  User.findOne({ profile_id: profile.id }, function(err, user) {
    if(err)
      return done(err);
    
    if(user) {
      return done(null, user);
    } else {
      var newUser = new User({
        profile_id: profile.id,
        auth_method: 'google',
        access_token: accessToken,
        refresh_token: refreshToken,
        email: profile.emails[0].value,
        timestamp: Date.now()
      });

      newUser.save(function(err) {
        if(err)
          throw err;
        
        return done(null, newUser);
      });
    }
  });
}));

passport.serializeUser(function(user, cb) {
  cb(null, {
    id: user._id,
    email: user.email,
    place: user.place
  });
});

passport.deserializeUser(function(user, cb) {
  User.findOne({ email: user.email }, function(err, user) {
    if(err) {
      return cb(err);
    }
    cb(null, {
      id: user._id,
      email: user.email,
      place: user.place
    });
  });
});

app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback', passport.authenticate('google', {
  successRedirect: '/todo',
  failureRedirect: '/login'
}));

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
  req.session.notice = 'You have successfully logged out';
});

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated())
    return next();
  
  res.redirect('/login');
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
