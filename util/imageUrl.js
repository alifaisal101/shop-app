const imagesPath = "/data/images/product-images/";
module.exports = (products) => products.map(product => {
    product.image = imagesPath + product.image;
    return product
});