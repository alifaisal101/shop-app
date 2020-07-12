const mongoose = require('mongoose');

const oftUsedProps = {
    type: String,
    required: true
}

const productSchema = new mongoose.Schema({
    title: oftUsedProps,
    price: {
        type: Number,
        required: true
    },
    image: oftUsedProps,
    description: oftUsedProps,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);