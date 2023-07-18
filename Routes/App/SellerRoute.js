const SellerRoute = require("express").Router();
const upload = require("./../../Utils/FileUploader");
const SellerModel = require("../../DataBase/Models/SellerModel");
const DecodeToken = require("../../Utils/TokenDecoder");
const ProductModel = require("../../DataBase/Models/ProductModel");
const OrderModel = require('../../DataBase/Models/OrderModel')
const sendEmail = require('../../Utils/EmailVerification');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'DeliveredContent/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create Multer upload middleware
const OrderUploader = multer({ storage });

//create
SellerRoute.post("/create-seller", upload.single("file"), async (req, res) => {

  try {

    const file = req.file;
    if (!file) {
      res.json({
        message: "file not found"
      });
    }

    const SellerProfilePicURL = `${process.env.API}/uploads/${file.filename}`;

    const decodedToken = await DecodeToken(req.body.token);
    const CurrentSellerData = new SellerModel({
      SellerID: decodedToken.id,
      SellerName: req.body.SellerName,
      SellerEmail: req.body.SellerEmail,
      SellerDescription: req.body.SellerDescription,
      SellerProfilePicURL: SellerProfilePicURL
    });

    //saving it
    await CurrentSellerData.save();

    //sending confirmation mail
    await sendEmail(req.body.SellerEmail, "Seller Profile Created", `Hellow ${req.body.SellerName}, Your Seller account has been created successfully.
    You can now upload your product details to our app and sell it to buyers .
    `)
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

//api for fetching all orders
SellerRoute.get('/fetch-order/:token', async (req, res) => {
  try {
    const decodedToken = await DecodeToken(req.params.token);
    const SellerData = await SellerModel.findOne({
      SellerID: decodedToken.id
    });
    const sourceID = SellerData._id
    const Orders = await OrderModel.find({
      Source: sourceID
    }).populate('Destination Product Source');
    if (!Orders) {
      res.json({
        message: "No Order found"
      })
    }

    else {
      res.json({
        message: "OK",
        Orders: Orders
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

SellerRoute.get('/fetch-order-details/:orderID', async (req, res) => {
  try {
    const OrderDetails = await OrderModel.findOne({
      _id: req.params.orderID
    }).populate('Destination Product Source')

    res.json({
      message: "OK",
      OrderDetails: OrderDetails
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

//read
SellerRoute.get("/fetch-seller/:token", async (req, res) => {
  try {
    const decodedtoken = await DecodeToken(req.params.token);
    const SellerData = await SellerModel.findOne({
      SellerID: decodedtoken.id,
    });


    if (!SellerData) {
      res.json({
        message: "No Seller Data found",
      });
    } else {
      res.json({
        message: "OK",
        SellerData: SellerData,
      });
    }
  } catch (error) {
    res.json({
      message: "error",
      error: error,
    });
  }
});

//update
SellerRoute.post("/update-seller", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.json({
      message: "File not found",
    });
  }

  const SellerProfilePicURL = `${process.env.API}/uploads/${file.filename}`;


  const decodedToken = await DecodeToken(req.body.token);
  const SellerID = decodedToken.id;
  const UpdatedData = await SellerModel.findOneAndUpdate(
    {
      SellerID: SellerID,
    },
    {
      SellerName: req.body.SellerName,
      SellerEmail: req.body.SellerEmail,
      SellerDescription: req.body.SellerDescription,
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

//delete
SellerRoute.post("/delete-seller", async (req, res) => {
  const decodedToken = await DecodeToken(req.body.token);
  const SellerID = decodedToken.id;
  try {
    const deletedSeller = await SellerModel.findOneAndDelete({
      SellerID: SellerID,
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

//add product
SellerRoute.post(
  "/add-product", upload.single('product-image'),
  async (req, res) => {

    const file = req.file;
    if (!file) {
      res.json({
        message: "file not found"
      });
    }

    const ProductPicURL = `${process.env.API}/uploads/${file.filename}`;


    try {
      const decodedToken = await DecodeToken(req.body.token);


      const SellerObject = await SellerModel.findOne({
        SellerID: decodedToken.id
      })

      const OwnerID = SellerObject._id

      const ProductPayload = new ProductModel({
        ProductName: req.body.ProductName,
        ProductDescription: req.body.ProductDescription,
        Owner: OwnerID,
        Price: req.body.Price,
        Qty: req.body.Qty,
        ProductImageURL: ProductPicURL
      });
      await ProductPayload.save();
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
  }
);

SellerRoute.post('/update-product', upload.single('product-image'), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.json({
      message: "File not found",
    });
  }

  const ProductImageURL = `${process.env.API}/uploads/${file.filename}`;

  try {
    const ProductUpdate = {
      ProductName: req.body.ProductName,
      ProductDescription: req.body.ProductDescription,
      ProductImageURL: ProductImageURL,
      Price: req.body.Price,
      Qty: req.body.Qty
    };
    await ProductModel.findByIdAndUpdate(req.body.productID,

      ProductUpdate)

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
})

SellerRoute.post('/delete-product', async (req, res) => {

  try {

    await ProductModel.findOneAndDelete({
      _id: req.body.productID
    })

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
})

//api for getting seller's product
SellerRoute.get('/fetch-product-seller/:token', async (req, res) => {
  try {
    const decodedToken = await DecodeToken(req.params.token);
    const SellerID = decodedToken.id;
    const SellerObject = await SellerModel.findOne({
      SellerID: SellerID
    })
    const products = await ProductModel.find({
      Owner: SellerObject._id
    })

    if (products.length != 0) {
      res.json({
        message: "OK",
        products: products
      })
    }

    else {
      res.json({
        message: "No products found"
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

SellerRoute.get('/fetch-product-Details/:productID', async (req, res) => {
  try {
    const ProductDetails = await ProductModel.findOne({
      _id: req.params.productID
    });
    if (!ProductDetails) {
      res.json({
        message: "no product details found"
      })
    }

    else {
      res.json({
        message: "OK",
        productDetails: ProductDetails
      })
    }
  }
  catch (error) {
    console.log(error)
    res.json({
      message: "error",
      error: error
    })
  }
})

SellerRoute.post('/confirm-order', async (req, res) => {
  try {
    const OrderID = req.body.orderID;

    //exctract Destination's emailId
    const OrderObject = await OrderModel.findOne({
      _id: req.body.orderID
    }).populate('Destination Source Product');
    const DestinationEmail = OrderObject.Destination.BuyerEmail;

    //sending email to destination's email
    console.log('sending shipping email')
    await sendEmail(DestinationEmail, "Your product has been Confirmed by its Owner",
      `Hellow ${OrderObject.Destination.BuyerName}, Your product has been Confirmed successfully by ${OrderObject.Source.SellerName}.
      Total Price :$ ${OrderObject.Product.Price},
      ProductDetails : 
      ProductName : ${OrderObject.Product.ProductName}
      ProductDescription : ${OrderObject.Product.ProductDescription}
      Hope you are happy with our service :)
    `)

    await OrderModel.findOneAndUpdate({
      _id: OrderID
    },
      {
        Status: "Confirmed"
      }
    )

    res.json({
      message: "OK"
    })
  }
  catch (error) {
    res.json({
      message: "error",
      error: error
    })
  }
})

//api to fetch number of orders and cart products
SellerRoute.get('/fetch-shopping-info/:token', async (req, res) => {
  const decodedToken = await DecodeToken(req.params.token);
  //getting number of orders
  const SellerObject = await SellerModel.findOne({
    SellerID: decodedToken.id
  });

  const Orders = await OrderModel.find({
    Source: SellerObject._id,
    Status: { $in: ["Placed", "Confirmed"] }
  });


  res.json({
    message: "OK",
    Orders: Orders.length
  })
})

//api for delivering order
SellerRoute.post('/deliver-order', OrderUploader.array('files'), async (req, res) => {

  try {
    if (!req.files) {
      res.json({
        message: "NO files found from client"
      })
    }

    const decodedToken = await DecodeToken(req.body.token);
    const SellerData = await SellerModel.findOne({
      SellerID: decodedToken.id
    })
    const SourceID = SellerData._id;
    const CurrentOrder = await OrderModel.findOne({
      Source: SourceID
    });

    const files = req.files
    files.map((item) => {
      const fileLink = `${process.env.API}/DeliveredContent/${item.filename}`
      CurrentOrder.Content.push({
        ContentURL: fileLink
      })

    })
    console.log('I have came upto this')

    CurrentOrder.Status = "Delivered"
    await CurrentOrder.save();
    res.json({
      message: "OK"
    })
  }
  catch (error) {
    console.error(error);
    res.json({
      message: "ERROR",
      error: error
    })
  }

})

module.exports = SellerRoute;
