const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors')
const path = require('path')
const uploadDestination = path.join(__dirname, "uploads");


const Connection = require('./DataBase/Connection');
const AdminRoute = require('./Routes/App/AdminRoute');
const BuyerRoute = require('./Routes/App/BuyerRoute')
const SignupRoute = require("./Routes/Authentication/Signup");
const LoginRoute = require("./Routes/Authentication/Login");
const Verification = require("./Routes/Authentication/Verification");
const SellerRoute = require('./Routes/App/SellerRoute');

app.use("/uploads", express.static(uploadDestination));
app.use(express.json())
dotenv.config();
app.use(cors());

//test api route
app.get('/', (req, res) => {
    console.log(req.body)
    res.json({
        message: "OK"
    })
})

//authentication routes
app.use("/authentication", SignupRoute);
app.use("/authentication", LoginRoute);
app.use("/authentication", Verification);

//apis for admin
app.use('/app/admin', AdminRoute);

//apis for buyer
app.use('/app/buyer', BuyerRoute)

//apis for seller
app.use('/app/seller', SellerRoute)

const PORT = process.env.PORT || 5500;
app.listen(PORT, async () => {
    console.log("Server is starting...");
    //connecting with DataBase
    await Connection();
    console.log("Server is up and running")
})