const mongoose = require('mongoose');

const oftUsedProps = {
    type: String,
    required: true,
}

const userSchema = new mongoose.Schema({
    firstName: oftUsedProps,
    lastName: oftUsedProps,
    email: oftUsedProps,
    password: oftUsedProps,
    cart: {
        items: [{
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: { type: Number, required: true }
        }]
    },
    ordersObj: {
        orders: [
            {
                items: [{
                    productId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Product',
                        required: true
                    },
                    title: oftUsedProps,
                    price: { type: Number, required: true },
                    quantity: { type: Number, required: true },
                    orderDate: { type: Date, required: true }
                }]
            }
        ]
    }
});

module.exports = mongoose.model('User', userSchema);