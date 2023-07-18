const BuyerModel = require("../../DataBase/Models/BuyerModel");
const upload = require("./../../Utils/FileUploader");
const BuyerRoute = require("express").Router();
const DecodeToken = require("../../Utils/TokenDecoder");
const OrderModel = require("../../DataBase/Models/OrderModel");
const ProductModel = require("../../DataBase/Models/ProductModel");
const sendEmail = require("../../Utils/EmailVerification");
const CartModel = require("../../DataBase/Models/CartModel");
const mongoose = require('mongoose')

BuyerRoute.post("/create-buyer", upload.single('file'), async (req, res) => {

  try {

    const file = req.file;
    if (!file) {
      res.json({
        message: "file not found"
      });
    }
    const BuyerProfilePicURL = `${process.env.API}/uploads/${file.filename}`;
    console.log(BuyerProfilePicURL)
    const decodedToken = await DecodeToken(req.body.token);
    const CurrentBuyerData = new BuyerModel({
      BuyerID: decodedToken.id,
      BuyerName: decodedToken.username,
      BuyerEmail: decodedToken.email,
      BuyerProfilePicURL: BuyerProfilePicURL
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

//api for creating the Cart
BuyerRoute.post('/create-cart', async (req, res) => {
  try {
    //get buyer ID
    const token = req.body.token;
    const decodedToken = await DecodeToken(token);
    const BuyerData = await BuyerModel.findOne({
      BuyerID: decodedToken.id
    });


    //creating current Cartdata
    const CurrentData = new CartModel({
      CartOwner: BuyerData._id,
      Active: true,
    });

    //save it
    await CurrentData.save();
    res.json({
      message: "OK"
    })
  }
  catch (error) {
    console.log(error);
    res.json({
      message: "ERROR",
      error: error
    })
  }
})

//api for add to cart
BuyerRoute.post('/add-to-cart', async (req, res) => {
  try {
    //get buyer ID
    const token = req.body.token;
    const decodedToken = await DecodeToken(token);
    const BuyerData = await BuyerModel.findOne({
      BuyerID: decodedToken.id
    });

    const Cart = await CartModel.findOne({
      CartOwner: BuyerData._id
    })
    Cart.CartProducts.push({
      products: req.body.productID
    })

    await Cart.save();

    res.json({
      message: "OK"
    })
  }
  catch (error) {
    console.error(error);
    res.json({
      error: error,
      message: "Error"
    })
  }
})

//api for fetching CartProducts
BuyerRoute.get('/fetch-cart-products/:token', async (req, res) => {
  try {
    //get buyer ID
    const token = req.params.token;
    const decodedToken = await DecodeToken(token);
    const BuyerData = await BuyerModel.findOne({
      BuyerID: decodedToken.id
    });


    if (!BuyerData) {
      res.json({
        message: "Buyer not found"
      })
    }

    else {
      const Cart = await CartModel.findOne({
        CartOwner: BuyerData._id
      }).populate('CartProducts.products')

      if (!Cart)
        res.json({
          message: "NO"
        })

      else
        res.json({
          message: "OK",
          Cart: Cart
        })

    }

  }
  catch (error) {
    console.error(error);
    res.json({
      message: "ERROR",
      error: error
    })
  }
})


BuyerRoute.post('/delete-cart-product', async (req, res) => {
  try {
    const { cartId, productId } = req.body;

    // Find the cart document by ID
    const cart = await CartModel.findById(cartId);

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Find the index of the product to be removed
    const productIndex = cart.CartProducts.findIndex(item => item.products.toString() === productId);



    // Use pop() to remove the product from the CartProducts array at the specified index
    cart.CartProducts.splice(productIndex, 1);

    await cart.save();

    return res.status(200).json({ message: 'OK', cart });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

//api for emptying cart
BuyerRoute.post('/empty-cart', async (req, res) => {
  try {
    await CartModel.findByIdAndRemove(req.body.cartID);
    res.json({
      message: "OK"
    })
  }
  catch (error) {
    console.error(error);
    res.json({
      message: "error",
      error: error
    })
  }
})


//api for placing order
BuyerRoute.post("/place-order", async (req, res) => {
  try {
    const decodedToken = await DecodeToken(req.body.token);
    const DestinationObject = await BuyerModel.findOne({
      BuyerID: decodedToken.id,
    });

    const DestinationID = DestinationObject._id;

    const ProductObject = await ProductModel.findOne({
      _id: req.body.ProductID,
    }).populate("Owner");


    const sellerEmail = ProductObject.Owner.SellerEmail;
    //sending email to destination's email
    console.log("sending order placed email");
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
BuyerRoute.get("/fetch-order-buyer/:token", async (req, res) => {
  try {
    const decodedToken = await DecodeToken(req.params.token);
    const DestinationObject = await BuyerModel.findOne({
      BuyerID: decodedToken.id,
    });
    if (!DestinationObject) {
      res.json({
        message: "Buyer account not created"
      })
    }

    else {
      const DestinationID = DestinationObject._id;
      const OrderData = await OrderModel.find({
        Destination: DestinationID,
      }).populate("Product Source Destination");
      if (!OrderData) {
        res.json({
          message: "No Orders found",
        });
      } else {
        res.json({
          message: "OK",
          OrderData: OrderData,
        });
      }

    }
  } catch (error) {
    console.error(error);
    res.json({
      messaeg: "error",
      error: error,
    });
  }
});

//api to fetch number of orders and cart products
BuyerRoute.get('/fetch-shopping-info/:token', async (req, res) => {
  const decodedToken = await DecodeToken(req.params.token);
  //getting number of orders
  const BuyerObject = await BuyerModel.findOne({
    BuyerID: decodedToken.id
  });

  const Orders = await OrderModel.find({
    Destination: BuyerObject._id,
    Status: { $in: ["Placed", "Confirmed"] }
  });


  const Cart = await CartModel.find({
    CartOwner: BuyerObject._id
  })

  res.json({
    message: "OK",
    Orders: Orders.length,
    CartProducts: Cart.length
  })
})

//api to fetch buyer order details
BuyerRoute.get('/fetch-order-details/:orderID', async (req, res) => {

  try {

    const OrderDetails = await OrderModel.findOne({
      _id: req.params.orderID
    }).populate('Destination Source Product')
    if (OrderDetails) {
      res.json({
        message: "OK",
        OrderDetails: OrderDetails
      })
    }
  }

  catch (error) {
    console.log(error);
    res.json({
      message: "ERROR",
      error: error
    })
  }
})

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
