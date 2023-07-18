const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
    Product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products"
    },
    Source: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sellers"
    },
    Destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "buyers"
    },
    Status: String,
    ContentDescription: String,
    Content: [{

        ContentURL: String
    }]
})

const OrderModel = new mongoose.model('orders', OrderSchema);
module.exports = OrderModel;