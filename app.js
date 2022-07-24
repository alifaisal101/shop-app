const path = require("path");
const crypto = require("crypto");

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const MongodbStore = require("connect-mongo");
const csrf = require("csurf");
const sgMail = require("@sendgrid/mail");
//const multer = require("multer");

const rootDir = require("./util/functions/path");

const User = require("./models/user");

const shop = require("./Routes/shop");
const auth = require("./Routes/auth");
const admin = require("./Routes/admin.js");

const errorController = require("./controllers/error.con");

const app = express();

// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(rootDir, "public", "data", "images", "product-images"));
//   },
//   filename: (req, file, cb) => {
//     crypto.randomBytes(5, (err, buffer) => {
//       cb(
//         null,
//         new Date().toISOString() +
//           "-" +
//           buffer.toString("hex") +
//           "-" +
//           file.originalname
//       );
//     });
//   },
// });

// const fileFilter = (req, file, cb) => {
//   ////////////////////////////////
//   //file name size limit filter///
//   ////////////////////////////////
//   if (
//     file.mimetype === "image/png" ||
//     file.mimetype === "image/jpg" ||
//     file.mimetype === "image/bmp" ||
//     file.mimetype === "image/jpeg"
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

//sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.set("view engine", "pug");
app.set("views", path.join(rootDir, "views"));

app.use((req, res, next) => {
  delete req.session;
  res.sgMail = sgMail;
  next();
});

app.use(express.static(path.join(rootDir, "public")));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    secret:
      "CRKtEyc!D\b4td<R3&L#gWk#Nmo/t~pWiS*nQehYEQ5KdQTbspX55@Z9F*_p_9fxDxCdewZsuaWuVW`wVfdcw=AX/-QESo#%NAACL@CChggr>j\4p~`jRh^W*Wjwh<+",
    resave: false,
    saveUninitialized: false,
    store: MongodbStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);

const csrfProtection = csrf();

app.use((req, res, next) => {
  if (req.session.userId) {
    User.findById(req.session.userId, [
      "firstName",
      "lastName",
      "email",
      "cart",
    ])
      .then((userDataFromDB) => {
        if (!userDataFromDB) {
          next();
        } else {
          res.userData = userDataFromDB;
          next();
        }
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  } else {
    next();
  }
});

// app.use(
//   multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
// );

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
  res
    .status(error.httpStatusCode)
    .render("500error", { userData: res.userData });
});

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    app.listen(process.env.PORT);
  })
  .catch((err) => {
    console.log(err);
  });

////////////////////////////////////////
////////making a pdf file///////////////
////////////////////////////////////////
