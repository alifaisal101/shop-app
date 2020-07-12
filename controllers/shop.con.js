const path = require('path');
const fs = require('fs');

const { validationResult } = require('express-validator');

const imageUrl = require('./../util/imageUrl');
const rootDir = require('./../util/rootDir');

const Product = require('./../models/product');
const User = require('./../models/user');

exports.getHome = (req, res, next) => {
  Product.find().limit(3).then(products => {
    res.render("shop/index", {
      page: "Home",
      products: imageUrl(products),
    });
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getShop = (req, res, next) => {
  let page = req.query.page;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.redirect('/');
  }
  if (!page) {
    page = 1;
  }
  Product.find().skip((page - 1) * 6).limit(6).then(products => {
    Product.find().countDocuments().then(productsAmount => {
      let pages = 1;
      if ((productsAmount / 6) !== Math.floor((productsAmount / 6))) {
        pages += Math.floor(productsAmount / 6);
      } else {
        pages = productsAmount / 6;
      }
      const pages_arr = [];
      for (let i = 0; i < pages; i++) { pages_arr.push(i + 1) }

      res.render("shop/product-list", {
        page: "shop",
        products: imageUrl(products),
        pages: pages_arr,
        selectedPage: page
      });
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getProductDetailes = (req, res, next) => {
  const productId = req.params.productId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.redirect('/');
  }

  Product.findById(productId).then(product => {
    product.image = `/data/images/product-images/${product.image}`;
    res.render("shop/product-detailes", {
      product: product,
    });
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};


exports.getAddToCart = (req, res, next) => {
  const productId = req.params.productId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.redirect('/');
  }

  Product.findById(productId).then(productFromdb => {
    if (!productFromdb) { res.redirect('/'); }
    else {
      let itemAlreadyInCart = false;
      if (res.userData.cart.items.length > 0) {
        for (let i = 0; i < res.userData.cart.items.length; i++) {
          if (`${res.userData.cart.items[i].productId}` === `${productId}`) {
            itemAlreadyInCart = true;
            res.userData.cart.items[i].quantity++;
            break;
          }
        }
      }
      const newCart = res.userData.cart;
      if (!itemAlreadyInCart) {
        const newCartItem = {
          productId: productId,
          quantity: 1
        }
        newCart.items.push(newCartItem);
      }
      User.updateOne({ _id: res.userData._id }, { cart: newCart }).then(() => {
        res.redirect('/cart');
      }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
    }
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getCart = (req, res, next) => {
  const cartItemsIDs = [];
  for (let i = 0; i < res.userData.cart.items.length; i++) {
    cartItemsIDs.push(res.userData.cart.items[i].productId);
  }
  Product.find({ _id: { $in: cartItemsIDs } }).then(cartProducts => {
    let totalPrice = 0;
    for (let i = 0; i < cartProducts.length; i++) {
      for (let y = 0; y < res.userData.cart.items.length; y++) {
        if (`${cartProducts[i]._id}` === `${res.userData.cart.items[y].productId}`) {
          cartProducts[i].quantity = res.userData.cart.items[y].quantity;
          totalPrice += cartProducts[i].quantity * cartProducts[i].price;
          break;
        }
      }
    }

    res.render("shop/cart", {
      cartProducts: cartProducts,
      totalPrice: totalPrice,
      page: "cart",

    });
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};



exports.editQuantity = (req, res, next) => {
  let cartProductId = req.body.cartProductId;
  let newQuantity = parseInt(req.body.quantity);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).redirect('/cart');
  }

  for (let i = 0; i < res.userData.cart.items.length; i++) {
    if (`${cartProductId}` === `${res.userData.cart.items[i].productId}`) {
      res.userData.cart.items[i].quantity = newQuantity;
      break;
    }
  }

  User.updateOne({ _id: res.userData._id }, { cart: res.userData.cart }).then(() => {
    res.redirect('/cart');
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.delCartProduct = (req, res, next) => {
  const cartProductId = req.params.cartProductId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.redirect('/');
  }

  for (let i = 0; i < res.userData.cart.items.length; i++) {
    if (`${cartProductId}` === `${res.userData.cart.items[i].productId}`) {
      res.userData.cart.items.splice(i, 1);
    }
  }
  User.updateOne({ _id: res.userData._id }, { cart: res.userData.cart }).then(() => {
    res.redirect('/cart');
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};


exports.getCheckout = (req, res, next) => {
  const cartItemsIDs = [];
  for (let i = 0; i < res.userData.cart.items.length; i++) {
    cartItemsIDs.push(res.userData.cart.items[i].productId);
  }
  Product.find({ _id: { $in: cartItemsIDs } }).then(cartProducts => {
    const newOrderItems = {
      items: cartProducts.map((cartPorduct, index) => {
        let quantity = 0;
        for (let i = 0; i < res.userData.cart.items.length; i++) {
          if (`${res.userData.cart.items[i].productId}` === `${cartPorduct._id}`) {
            quantity = res.userData.cart.items[i].quantity;
            break;
          }
        }
        return ({
          productId: cartPorduct._id,
          title: cartPorduct.title,
          imageUrl: cartPorduct.image,
          price: cartPorduct.price,
          quantity: quantity,
          orderDate: new Date(Date.now())
        });
      })
    };

    User.findById(res.userData._id, "ordersObj").then(userDataOnlyOrders => {
      userDataOnlyOrders.ordersObj.orders.push(newOrderItems);

      User.updateOne({ _id: res.userData._id }, { cart: { items: [] }, ordersObj: userDataOnlyOrders.ordersObj })
        .then(() => { res.redirect('/orders') })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });

}


exports.getOrders = (req, res, next) => {
  User.findById(res.userData._id, "ordersObj").then(userData => {
    res.render("shop/orders", { page: "orders", ordersObj: userData.ordersObj });
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getInvoice = (req, res, next) => {
  const invoiceName = `invoice-${req.params.orderId}.pdf`;
  const invoice = path.join(rootDir, 'private', 'invoices', invoiceName);

  const file = fs.createReadStream(invoice);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
  file.pipe(res);
}