const BuyerModel = require("../../DataBase/Models/BuyerModel");
const upload = require("./../../Utils/FileUploader");
const BuyerRoute = require("express").Router();
const DecodeToken = require("../../Utils/TokenDecoder");
const OrderModel = require("../../DataBase/Models/OrderModel");
const ProductModel = require("../../DataBase/Models/ProductModel");
const sendEmail = require("../../Utils/EmailVerification");

BuyerRoute.post("/create-buyer", async (req, res) => {



  try {
    const decodedToken = await DecodeToken(req.body.token);
    const CurrentBuyerData = new BuyerModel({
      BuyerID: decodedToken.id,
      BuyerName: decodedToken.username,
      BuyerEmail: decodedToken.email
    });

    //saving it
    await CurrentBuyerData.save();
    //sending confirmation mail
    console.log("Sending Confirmation email")
    sendEmail(decodedToken.email, "Buyer Account created",
      `Hellow ${decodedToken.username}, tour buyer account has been successfully created. You may now checkout and order products from our app`)
    res.json({
      message: "OK",
    });
  } catch (error) {
    console.log(error);
    res.json({
      message: "error",
      error: error,
    });
  }
});
//api to fetch buyer data
BuyerRoute.get("/fetch-buyer/:token", async (req, res) => {
  try {
    const decodedtoken = await DecodeToken(req.params.token);
    const BuyerData = await BuyerModel.findOne({
      BuyerID: decodedtoken.id,
    });

    if (!BuyerData) {
      res.json({
        message: "No Buyer Data found",
      });
    } else {
      res.json({
        message: "OK",
        BuyerData: BuyerData,
      });
    }
  } catch (error) {
    res.json({
      message: "error",
      error: error,
    });
  }
});

//api for updating BuyerData
BuyerRoute.post("/update-buyer", async (req, res) => {
  const decodedToken = await DecodeToken(req.body.token);
  const BuyerID = decodedToken.id;
  const UpdatedData = await BuyerModel.findOneAndUpdate(
    {
      BuyerID: BuyerID,
    },
    {
      BuyerName: req.body.BuyerName,
      BuyerEmail: req.body.BuyerEmail,
    }
  );

  if (!UpdatedData) {
    res.json({
      message: "an error occured",
    });
  } else {
    res.json({
      message: "OK",
    });
  }
});

//api for delete buyer
BuyerRoute.post("/delete-buyer", async (req, res) => {
  const decodedToken = await DecodeToken(req.body.token);
  const BuyerID = decodedToken.id;
  try {
    const deletedBuyer = await BuyerModel.findOneAndDelete({
      BuyerID: BuyerID,
    });

    res.json({
      message: "OK",
    });
  } catch (error) {
    console.log(error);
    res.json({
      message: "error",
      error: error,
    });
  }
});

//api to fetch products to display on buyer home page
BuyerRoute.get('/fetch-products-all', async (req, res) => {
  try {
    const Products = await ProductModel.find().sort({ _id: -1 });
    if (!Products)
      res.json({
        message: "No products found"
      })

    else {
      res.json({
        message: "OK",
        Products: Products
      })
    }
  }

  catch (error) {
    res.json({
      message: "error",
      error: error
    })
  }
})

//api for getting specidif product
BuyerRoute.get('/fetch-product/:productID', async (req, res) => {
  const productData = await ProductModel.findOne({
    _id: req.params.productID
  })
  if (productData) {
    res.json({
      message: "OK",
      productData: productData
    })
  }

  else {
    res.json({
      message: "no data found"
    })
  }
})

//api for placing order
BuyerRoute.post("/place-order", async (req, res) => {
  try {
    const decodedToken = await DecodeToken(req.body.token);
    console.log(decodedToken)
    const DestinationObject = await BuyerModel.findOne({
      BuyerID: decodedToken.id,
    });
    console.log(DestinationObject)

    const DestinationID = DestinationObject._id;

    const ProductObject = await ProductModel.findOne({
      _id: req.body.ProductID,
    }).populate("Owner");

    const sellerEmail = ProductObject.Owner.SellerEmail;
    //sending email to destination's email
    console.log("sending shipping email");
    await sendEmail(
      sellerEmail,
      "You have a new Order",
      `Hellow ${ProductObject.Owner.SellerName}, Your have a new order :
      ProductName : ${ProductObject.ProductName}
      ProductDescription : ${ProductObject.ProductDescription}
      ProductPrice : ${ProductObject.Price}

      Your Customer Details : 
      CustomerName : ${DestinationObject.BuyerName}
      CustomerEmail : ${DestinationObject.BuyerEmail}
  
      Check your products in our app and get ready to ship your product as soon as possible
`
    );

    const SourceID = ProductObject.Owner._id;

    const CurrentOrder = new OrderModel({
      Product: req.body.ProductID,
      Source: SourceID,
      Destination: DestinationID,
      Status: "Placed",
    });

    await CurrentOrder.save();
    res.json({
      message: "OK",
    });
  } catch (error) {
    console.error(error);
    res.json({
      message: "Error",
      error: error,
    });
  }
});

//api for canelling order
BuyerRoute.post("/cancel-order", async (req, res) => {
  const OrderID = req.body.orderID;
  try {
    await OrderModel.findOneAndDelete({
      _id: OrderID,
    });
    res.json({
      message: "OK",
    });
  } catch (error) {
    console.error(error);
    res.json({
      message: "error",
      error: error,
    });
  }
});

//api for fetching order
BuyerRoute.get("/fetch-order-buyer/:orderID", async (req, res) => {
  try {
    const decodedToken = await DecodeToken(req.body.token);
    const DestinationObject = await BuyerModel.findOne({
      BuyerID: decodedToken.id,
    });

    const DestinationID = DestinationObject._id;
    const OrderData = await OrderModel.findOne({
      Destination: DestinationID,
    }).populate("Product Source Destination");
    if (!OrderData) {
      res.json({
        message: "No Orders found",
      });
    } else {
      res.json({
        messaeg: "OK",
        OrderData: OrderData,
      });
    }
  } catch (error) {
    console.error(error);
    res.json({
      messaeg: "error",
      error: error,
    });
  }
});

//api to receive order
BuyerRoute.post("/receive-order", async (req, res) => {
  try {
    const OrderID = req.body.orderID;
    await OrderModel.findOneAndUpdate(
      {
        _id: OrderID,
      },
      {
        Status: "Reveived",
      }
    );

    res.json({
      message: "OK",
    });
  } catch (error) {
    res.json({
      message: "error",
      error: error,
    });
  }
});

module.exports = BuyerRoute;
