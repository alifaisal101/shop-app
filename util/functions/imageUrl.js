const imageUrl = "/data/images/product-images/";
module.exports = (products) => products.map((product, index) => {
    product.image = imageUrl + product.image;
    return product
});