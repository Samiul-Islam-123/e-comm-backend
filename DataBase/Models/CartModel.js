const mongoose = require('mongoose');
const CartSchema = new mongoose.Schema({
    CartOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "buyers"
    },
    CartProducts: [{
        products: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products"
        }
    }],
    Active: Boolean
})

const CartModel = new mongoose.model('cart', CartSchema);
module.exports = CartModel;