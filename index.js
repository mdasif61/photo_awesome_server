const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Photo Awesome is Running");
});

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorized" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: "unauthorized" });
    }
    req.decoded = decoded;
    next();
  });
};

// photo-awesome
// zaVPqYskgkDLiZet

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://photo-awesome:zaVPqYskgkDLiZet@cluster0.kuomool.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const usersCollection = client.db("photo_awesome").collection("users");
    const classesCollection = client.db("photo_awesome").collection("classes");

    app.post("/jwt", (req, res) => {
      const loggedUser = req.body;
      const token = jwt.sign(loggedUser, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middlewere api start
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.status !== 'Admin') {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      next()
    }

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user.status !== 'Instructor') {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      next()
    }
    // middlewere api end

    // classes get api
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    // approved classes api
    app.get('/approved', async (req, res) => {
      const query = { status: 'Approved' };
      const result = await classesCollection.find(query).toArray();
      res.send(result)
    })

    // classes post api
    app.post("/classes", verifyJWT, async (req, res) => {
      const classes = req.body;
      const result = await classesCollection.insertOne(classes);
      res.send(result);
    });

    // update classes api approve
    app.patch('/approved/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'Approved'
        }
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    // update classes api denied
    app.patch('/denied/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'Denied'
        }
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    // users get api
    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // users post api
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser.email };
      const existUser = await usersCollection.findOne(query);
      if (existUser) {
        return res.send({ message: "user already added" });
      }
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    // make admin api
    app.patch('/makeAdmin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'Admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // make instructor api
    app.patch('/makeInstructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'Instructor'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    // get admin api
    app.get('/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded?.email !== email) {
        res.send({ admin: false })
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.status === 'Admin' };
      res.send(result)
    })

    // get instructor api
    app.get('/instructor/:email',verifyJWT,async(req,res)=>{
      const email=req.params.email;
      if(email !==req.decoded?.email){
        res.send({instructor:false})
      }
      const query={email:email};
      const user=await usersCollection.findOne(query);
      const result={instructor:user?.status==='Instructor'};
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("server running port : ", port);
});
