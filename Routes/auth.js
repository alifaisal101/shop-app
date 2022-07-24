const express = require("express");
const { body } = require("express-validator");

const authMiddleWare = require("./../middlewares/auth");

const authController = require("../controllers/auth.con.js");

const Router = express.Router();

Router.get(
  "/register",
  authMiddleWare.isAlreadyLoggedIn,
  authController.getRegisterPage
);

Router.post(
  "/register",
  body("firstName").isLength({ min: 2, max: 24 }).isAlpha(),
  body("lastName").isLength({ min: 2, max: 24 }).isAlpha(),
  body("email").isLength({ min: 5, max: 64 }).isEmail(),
  body("password")
    .isLength({ min: 3, max: 64 })
    .custom((value) => {
      if (/[a-z]/.test(value) && /[0-9]/.test(value) && /[A-Z]/.test(value)) {
        return true;
      } else {
        throw "invalid value";
      }
    }),
  authMiddleWare.isAlreadyLoggedIn,
  authController.postRegister
);
Router.get(
  "/login",
  authMiddleWare.isAlreadyLoggedIn,
  authController.getLoginPage
);

Router.post(
  "/login",
  authMiddleWare.isAlreadyLoggedIn,
  body("email").isEmail(),
  authController.postLogin
);

Router.post("/logout", authMiddleWare.isUser, authController.getLogout);

Router.get(
  "/pass-reset",
  authMiddleWare.isAlreadyLoggedIn,
  authController.getResetPassword
);

Router.post(
  "/pass-reset",
  authMiddleWare.isAlreadyLoggedIn,
  body("email").isEmail(),
  authController.postResetPassword
);

Router.get(
  "/resetpassword-token/:passwordResetToken",
  authMiddleWare.isAlreadyLoggedIn,
  authController.getPasswordResetWithToken
);

Router.post(
  "/set-new-password",
  authMiddleWare.isAlreadyLoggedIn,
  body("newPassword").isLength({ min: 3, max: 64 }) /* .custom((value) => {
    if (/[a-z]/.test(value) && /[0-9]/.test(value) && /[A-Z]/.test(value)) {
      return true;
    } else {
      throw "invalid value";
    }
  }) */,
  authController.postNewPassword
);

module.exports = Router;
