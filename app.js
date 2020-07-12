const path = require("path");
const crypto = require('crypto');
const fs = require('fs');

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const mongoose = require('mongoose');
const mongoStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const sgMail = require('@sendgrid/mail');
const multer = require('multer');

const rootDir = require("./util/rootDir");

const User = require('./models/user')

const shop = require("./Routes/shop");
const auth = require("./Routes/auth");
const admin = require("./Routes/admin");

const errorController = require("./controllers/error.con");

const app = express();

if (!fs.existsSync(path.join(rootDir, 'public', 'data'))) {
  fs.mkdirSync(path.join(rootDir, 'public', 'data'));
  fs.mkdirSync(path.join(rootDir, 'public', 'data', 'images'));
  fs.mkdirSync(path.join(rootDir, 'public', 'data', 'images', 'product-images'));
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(rootDir, "public", 'data', 'images', 'product-images'));
  },
  filename: (req, file, cb) => {
    crypto.randomBytes(5, (err, buffer) => {
      cb(null, new Date().toISOString() + '-' + buffer.toString('hex') + "-" + file.originalname);
    });
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/bmp" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.set("view engine", "pug");
app.set("views", path.join(rootDir, "views"));

app.use((req, res, next) => {
  delete req.session;
  res.sgMail = sgMail;
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true },
  store: new mongoStore({
    uri: process.env.MONGODB_URI,
    collection: "sessions"
  })
}));

const csrfProtection = csrf();

app.use((req, res, next) => {
  if (req.session.userId) {
    User.findById(req.session.userId, ['firstName', 'lastName', 'email', 'cart']).then(userDataFromDB => {
      if (!userDataFromDB) {
        next();
      } else {
        res.userData = userDataFromDB;
        next();
      }
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  } else {
    next();
  }
});

app.use(express.static(path.join(rootDir, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.userData = res.userData;
  next();
});
app.use("/admin", admin);
app.use(auth);
app.use(shop);

app.use(errorController.error404);
app.use((error, req, res, next) => {
  res.status(error.httpStatusCode).render('500error', { userData: res.userData });
});

mongoose.connect(process.env.MONGODB_URI).then(result => {
  app.listen(process.env.PORT);
}).catch(err => { console.log(err) });