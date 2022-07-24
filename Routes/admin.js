const express = require("express");
const { body, check, query } = require("express-validator");

const authMiddleware = require("./../middlewares/auth");
const formidStore = require("./../middlewares/formid-store");

const adminContoller = require("./../controllers/admin.con.js");

const router = express.Router();

router.get("/add-product", authMiddleware.isUser, adminContoller.getAddProduct);
router.post(
  "/add-product",
  authMiddleware.isUser,
  body("title").isLength({ min: 2, max: 255 }),
  body("price")
    .isNumeric()
    .custom((value) => {
      if (value < 50000 && value > 0) {
        return true;
      } else {
        throw "invalid value";
      }
    }),
  body("description").isLength({ min: 2, max: 1000 }),
  formidStore,
  adminContoller.postProduct
);

router.get(
  "/products",
  authMiddleware.isUser,
  query("page")
    .isNumeric()
    .custom((page) => {
      if (page < 1 || page > 20) {
        throw "kombe";
      } else {
        return true;
      }
    }),
  adminContoller.getProducts
);

router.get(
  "/edit-product/:productId",
  authMiddleware.isUser,
  check("productId").isMongoId(),
  authMiddleware.isProductAdmin,
  adminContoller.getEditProduct
);
router.post(
  "/edit-product",
  authMiddleware.isUser,
  body("title").isLength({ min: 2, max: 255 }),
  body("price")
    .isNumeric()
    .custom((value) => {
      if (value < 50000 && value > 0) {
        return true;
      } else {
        throw "invalid value";
      }
    }),
  body("description").isLength({ min: 2, max: 1000 }),
  body("_id").isMongoId(),
  adminContoller.postEditProduct
);

router.delete(
  "/product/:productId",
  authMiddleware.isUser,
  check("productId").isMongoId(),
  authMiddleware.isProductAdmin,
  adminContoller.deleteProduct
);

module.exports = router;
