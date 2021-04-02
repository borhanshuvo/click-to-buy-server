const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
const port = 5000;
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const admin = require('firebase-admin');

const serviceAccount = require("./click-to-buy-6fa3e-firebase-adminsdk-7twqj-130dd776c8.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wzcd4.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const productsCollection = client.db("clickToBuy").collection("products");
  const ordersCollection = client.db("clickToBuy").collection("orders");

  // add product
  app.post('/addProduct', (req, res) => {
    const product = req.body;
    productsCollection.insertOne(product)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  // add order
  app.post('/addOrder', (req, res) => {
    const orders = req.body;
    ordersCollection.insertOne(orders)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  });

  // all product list
  app.get('/productList', (req, res) => {
    productsCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      });
  });

  // delete product
  app.delete('/delete/:id', (req, res) => {
    productsCollection.deleteOne({ _id: ObjectId(req.params.id) })
      .then(result => {
        res.send(result.deletedCount > 0);
      })
  })

  // single product
  app.get('/product/:id', (req, res) => {
    productsCollection.find({ _id: ObjectId(req.params.id) })
      .toArray((err, document) => {
        res.send(document[0]);
      })
  })

  // all product list per user
  app.get('/orderList', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            ordersCollection.find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              });
          }
          else{
            res.status(401).send('unauthorized access');
          }
        })
        .catch((error) => {
          res.status(401).send('unauthorized access');
        });
    }
    else {
      res.status(401).send('unauthorized access');
    }
  });

});


app.get('/', (req, res) => {
  res.send('Hello Buddy');
})

app.listen(process.env.PORT || port);