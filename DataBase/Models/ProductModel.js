const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
    ProductName: String,
    ProductImageURL: String,
    ProductDescription: String,
    ProductReview: [{
        User: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "buyers"
        },
        review: String
    }],
    //seller ID ref
    Owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sellers"
    },
    Price: Number,
    Qty: Number
})

const ProductModel = new mongoose.model("products", ProductSchema);
module.exports = ProductModel;