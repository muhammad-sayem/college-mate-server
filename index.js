const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middlewares //
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token; // req.cookies er moddhe client side theke token jeta pathano hoy sheta thake //

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access!!" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access!!" });
    }
    console.log("This is from decoded", decoded); // { email: 'tester1@gmail.com', iat: 1751639202, exp: 1751642802 }
    req.user = decoded;   
    next();
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.crzce.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const collegesCollection = client.db('collegeMate').collection('colleges');
    const admissionsCollection = client.db('collegeMate').collection('admissions');
    const reviewsCollection = client.db('collegeMate').collection('reviews');

    // JWT //
    app.post('/jwt', async (req, res) => {
      const user = req.body;   // {email: tester1@gmail.com}
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' }) // JWT Token create //
      res
        .cookie('token', token, {   // Client er browser e ekta cookie set kora hocche. jar name 'token' and value holo je token ta create hoise oita //
          httpOnly: true, // Ei cookie only server access korte parbe, js diye access kora jabe na
          secure: false   // http diye o cookie ta pathano jabe, https must na 
        })
        .send({ success: true });
    });

    app.post('/logout', async(req, res) => {
      res
      .clearCookie('token', {
        httpOnly: true,
        secure: false
      })
      .send({success: "Cookie removed successfully with logout"})
    })

    // ------------------------------ //

    // Get all colleges from collegesCollection //
    app.get('/colleges', async(req, res) => {
      const search = req.query.search || "";
      const filter = {
        collegeName: {
          $regex: search, 
          $options: "i"
        }
      }
      const result = await collegesCollection.find(filter).toArray();
      res.send(result);
    });

    // Get a specific college from collegesCollection //
    app.get('/colleges/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await collegesCollection.findOne(query);
      res.send(result);
    });

    // ------------------------------------------ //

    // Add/Post an admission apply to admissionsCollections //
    app.post('/admissions', async(req, res) => {
      const apply = req.body;
      const result = await admissionsCollection.insertOne(apply);
      res.send(result);
    });

    // Get application of a specific email (user) //
    app.get('/admission/:email', async(req, res) => {
      const email = req. params.email;
      const query = {email: email};
      const result = await admissionsCollection.findOne(query);
      res.send(result);
    }); 

    // ---------------------------------------- //

    // Add / Post a review to reviewsCollection //
    app.post('/reviews', async(req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // Get all reviws fron reviewsCollection //
    app.get('/reviews', async(req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send("College mate is running..........")
});


app.listen(port, () => {
  console.log(`The server is running at port: ${port}`);
})