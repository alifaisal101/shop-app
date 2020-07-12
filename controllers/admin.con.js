const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const rootDir = require('./../util/rootDir');
const imageUrl = require('./../util/imageUrl');

const Product = require('./../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    page: "add-product",
    editing: false,
  });
};

exports.postProduct = (req, res, next) => {
  const userId = res.userData._id;
  const { title, price, description } = req.body;
  let image = req.file;
  const errors = validationResult(req);
  if (!errors.isEmpty() || !image) {
    let msg;
    if (!image) {
      msg = 'invalidimage';
    } else {
      fs.unlink(path.join(rootDir, 'public', 'data', 'images', 'product-images', image.filename), err => {
        if (err) {
          error.httpStatusCode = 500;
          return next(new Error(err));
        }
      });
      msg = `invalid${errors.errors[0].param}`;
    }
    return res.status(422).render('admin/edit-product', {
      page: "add-product",
      editing: false,
      title: title,
      price: price,
      description: description,
      msg: msg
    });
  }

  Product.create({
    title: title,
    price: price,
    image: image.filename,
    description: description,
    userId: userId
  }).then(() => {
    res.redirect('/admin/products');
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getProducts = (req, res, next) => {
  let page = req.query.page;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.redirect('/');
  }
  if (!page) {
    page = 1;
  }
  Product.find({ userId: res.userData._id }).skip((page - 1) * 6).limit(6).then(products => {
    Product.find().countDocuments().then(productsAmount => {
      let pages = 1;
      if ((productsAmount / 6) !== Math.floor((productsAmount / 6))) {
        pages += Math.floor(productsAmount / 6);
      } else {
        pages = productsAmount / 6;
      }
      const pages_arr = [];
      for (let i = 0; i < pages; i++) { pages_arr.push(i + 1) }
      res.render("admin/products", {
        page: "products",
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


exports.getEditProduct = (req, res, next) => {
  const prodId = req.params.productId;

  if (!prodId) { res.redirect('/') }
  else {
    Product.findById(prodId).then(product => {
      if (!product) { res.redirect('/admin/products'); }
      else {
        res.render("admin/edit-product", {
          product: product,
          editing: true
        });
      }
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  }
};


exports.postEditProduct = (req, res, next) => {
  const errors = validationResult(req);
  const { title, price, description, _id } = req.body;
  const image = req.file;

  if (!errors.isEmpty()) {
    const msg = `invalid${errors.errors[0].param}`;
    return res.status(422).render('admin/edit-product', {
      _id: _id,
      editing: false,
      isRedirect: true,
      title: title,
      price: price,
      description: description,
      msg: msg
    });
  }

  Product.findById(req.body._id).then(product => {
    if (!product) { res.redirect('/admin/products') }
    else {
      const editedProduct = {
        title: title,
        price: price,
        description: description
      }
      if (image) {
        fs.unlink(path.join(rootDir, 'public', 'data', 'images', 'product-images', porduct.image), err => {
          if (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          }
        });
        editedProduct.image = image.filename;
      }
      Product.updateOne({ _id: req.body._id }, editedProduct).then(() => {
        res.redirect('/admin/products');
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

exports.deleteProduct = (req, res, next) => {
  const productId = req.params.productId;

  const errors = validationResult(req);
  if (!errors.isEmpty) {
    return res.redirect('/');
  }
  Product.findById(productId).then(product => {
    if (!product) { throw new Error('No such product') }
    else {
      Product.deleteOne({ _id: product._id }).then(() => {
        res.status(200).json({ msg: "success" });
      }).catch(err => {
        console.log(err);
      });
    }
  }).catch(err => {
    console.log('dsadsa');
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};
