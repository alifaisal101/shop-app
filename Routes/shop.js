const express = require("express");
const { body, param, query } = require("express-validator");

const authMiddleWare = require("../middlewares/auth");

const shopController = require("./../controllers/shop.con.js");

const router = express.Router();

router.get("/", shopController.getHome);

router.get("/shop",
    query('page').isNumeric().custom((page) => {
        if (page < 1 || page > 20) {
            throw 'kombe'
        } else {
            return true;
        }
    }),
    shopController.getShop
);

router.get("/product-detailes/:productId",
    param('productId').isMongoId(),
    shopController.getProductDetailes
);

router.post("/add-cart/:productId",
    authMiddleWare.isUser,
    param('productId').isMongoId(),
    shopController.getAddToCart
);

router.get("/cart", authMiddleWare.isUser, shopController.getCart);

router.post("/edit-quantity",
    authMiddleWare.isUser,
    body('quantity').isNumeric().custom(value => {
        if (50 > value && value > 0) {
            return true;
        } else {
            throw "invaild value";
        }
    }),
    shopController.editQuantity
);

router.post("/del-cartProduct/:cartProductId",
    authMiddleWare.isUser,
    param('cartProductId').isMongoId(),
    shopController.delCartProduct
);

router.get("/orders", authMiddleWare.isUser, shopController.getOrders);

router.post("/checkout", authMiddleWare.isUser, shopController.getCheckout);

router.get("/orders/invoice/:orderId", authMiddleWare.isUser, param('orderId').isMongoId(), authMiddleWare.isOrderGuy, shopController.getInvoice);

module.exports = router;
