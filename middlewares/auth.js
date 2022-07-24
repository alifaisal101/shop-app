const Product = require("./../models/product");
const User = require("./../models/user");

const { validationResult } = require("express-validator");

exports.isUser = (req, res, next) => {
  if (res.userData) {
    next();
  } else {
    res.redirect("/login");
  }
};

exports.isProductAdmin = (req, res, next) => {
  const productId = req.params.productId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.redirect("/");
  }
  Product.findById(productId)
    .then((product) => {
      if (product) {
        if (`${product.userId}` === `${res.userData._id}`) {
          next();
        } else {
          res.redirect("/admin/products");
        }
      } else {
        res.redirect("/admin/products");
      }
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.isAlreadyLoggedIn = (req, res, next) => {
  if (res.userData) {
    res.redirect("/");
  } else {
    next();
  }
};

exports.isOrderGuy = (req, res, next) => {
  const orderId = req.params.orderId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.redirect("/");
  }

  User.findById(res.userData._id, "ordersObj")
    .then((userData) => {
      const orders = userData.ordersObj.orders;
      let isOrderGuy = false;
      for (let i = 0; i < orders.length; i++) {
        if (`${orders[i]._id}` === `${orderId}`) {
          isOrderGuy = true;
        }
      }
      if (isOrderGuy) {
        next();
      } else {
        res.redirect("/");
      }
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
