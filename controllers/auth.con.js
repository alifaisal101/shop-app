const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

const User = require("./../models/user");

exports.getLoginPage = (req, res, next) => {
  const msg = req.query.msg;
  res.render("auth/login", { msg: msg });
};

exports.postLogin = (req, res, next) => {
  const userLoginData = { ...req.body };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .render("auth/login", {
        msg: "invalidemail",
        email: userLoginData.email,
      });
  }
  User.findOne({ email: userLoginData.email }).then((userDataFromDB) => {
    if (userDataFromDB) {
      bcrypt
        .compare(userLoginData.password, userDataFromDB.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.userId = userDataFromDB._id;
            req.session.save(() => {
              res.redirect("/");
            });
          } else {
            res.render("auth/login", {
              msg: "wrongpassword",
              email: userLoginData.email,
            });
          }
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    } else {
      res.render("auth/login", {
        msg: "noemailfound",
        email: userLoginData.email,
      });
    }
  });
};

exports.getRegisterPage = (req, res, next) => {
  const msg = req.query.msg;
  res.render("auth/register", { msg: msg });
};

exports.postRegister = (req, res, next) => {
  const userRegData = req.body;
  const userRegData_inputNames = Object.keys(userRegData);
  const { firstName, lastName, email } = userRegData;

  const errors = validationResult(req);

  for (let i = 0; i < userRegData_inputNames.length; i++) {
    if (!userRegData[userRegData_inputNames[i]]) {
      return res.render("auth/register", {
        msg: "emptyfields",
        firstName: firstName,
        lastName: lastName,
        email: email,
      });
    }
  }

  if (!errors.isEmpty()) {
    const msg = `invalid${errors.errors[0].param}`;
    return res.status(422).render("auth/register", {
      msg: msg,
      firstName: firstName,
      lastName: lastName,
      email: email,
    });
  }

  if (userRegData.password !== userRegData.cPassword) {
    const { firstName, lastName, email } = userRegData;
    return res.render("auth/register", {
      msg: "passwordsdontmatch",
      firstName: firstName,
      lastName: lastName,
      email: email,
    });
  }

  User.findOne({ email: userRegData.email }).then((userDataFromDB) => {
    if (userDataFromDB) {
      return res.render("auth/register", {
        msg: "emailalreadyinuse",
        firstName: firstName,
        lastName: lastName,
      });
    } else {
      bcrypt.hash(userRegData.password, 12).then((hashedPassword) => {
        const user = {
          firstName: userRegData.firstName,
          lastName: userRegData.lastName,
          email: userRegData.email,
          password: hashedPassword,
        };
        User.create(user).then(() => {
          res.sgMail
            .send({
              to: userRegData.email,
              from: "ali@lbcot.com",
              subject: "Verfiy your email",
              html:
                `<h1 style="text-align:center">
                      Welcome, ` +
                userRegData.firstName +
                userRegData.lastName +
                `
                  </h1>
                  <h2>you have registerd sucssfully</h2>`,
            })
            .then(() => {
              res.redirect("/login");
            })
            .catch((err) => {
              const error = new Error(err);
              error.httpStatusCode = 500;
              return next(error);
            });
        });
      });
    }
  });
};

exports.getLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.getResetPassword = (req, res, next) => {
  const msg = req.query.msg;
  res.render("auth/resetpassword", { msg: msg });
};

exports.postResetPassword = (req, res, next) => {
  const passResetEmail = req.body.email;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).redirect("/pass-reset?msg=invaildValue");
  }
  User.findOne({ email: passResetEmail })
    .then((userDataFromDB) => {
      if (!userDataFromDB) {
        res.redirect("/pass-reset?msg=noemailfound");
      } else {
        crypto.randomBytes(32, (err, buffer) => {
          if (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          } else {
            const token = buffer.toString("hex");
            req.session.cookie.maxAge = 1800000;
            req.session.passResetToken = token;
            req.session.userId_passReset = userDataFromDB._id;
            res.sgMail.send({
              from: "ali@lbcot.com",
              to: passResetEmail,
              subject: "Password reset",
              html: `
              <p>You have requested to reset your password</p>
              <p>click this
                <a href="http://localhost:3000/resetpassword-token/${token}">link</a>
              to continue with the reset process</p>
            `,
            });
            const msg = "email sent successfully";
            res.render("auth/resetpass-msg", { msg: msg });
          }
        });
      }
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getPasswordResetWithToken = (req, res, next) => {
  if (req.session.passResetToken) {
    if (req.session.passResetToken === req.params.passwordResetToken) {
      const msg = req.query.msg;
      res.render("auth/new-password", {
        passwordResetToken: req.params.passwordResetToken,
        msg: msg,
      });
    } else {
      res.render("/");
    }
  } else {
    if (req.params.passwordResetToken) {
      const msg = "Expired Session";
      res.render("auth/resetpass-msg", { msg: msg });
    } else {
      res.redirect("/");
    }
  }
};

exports.postNewPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.redirect(
      `/resetpassword-token/${req.session.passResetToken}?msg=invaildpass`
    );
  }
  if (req.session.passResetToken) {
    if (req.session.passResetToken === req.body.passwordResetToken) {
      if (req.body.newPassword !== req.body.cNewPassword) {
        res.redirect(
          `/resetpassword-token/${req.session.passResetToken}?msg=passnomatch`
        );
      } else {
        bcrypt
          .hash(req.body.newPassword, 12)
          .then((hashedPassword) => {
            User.updateOne(
              { _id: req.session.userId_passReset },
              { password: hashedPassword }
            )
              .then(() => {
                req.session.destroy(() => {
                  res.redirect("/login?msg=passresetsuccssfully");
                });
              })
              .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
              });
          })
          .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
      }
    } else {
      res.render("/");
    }
  } else {
    res.redirect("/");
  }
};
