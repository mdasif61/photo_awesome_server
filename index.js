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

    // classes get api
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    // classes post api
    app.post("/classes", verifyJWT, async (req, res) => {
      const classes = req.body;
      const result = await classesCollection.insertOne(classes);
      res.send(result);
    });

    // update classes api approve
    app.patch('/classes/:id',verifyJWT,async(req,res)=>{
        const id=req.params.id;
        const filter={_id:new ObjectId(id)};
        // const updateData=req.body;
        const updateDoc={
            $set:{
                status:updateData.status
            }
        };
        const result=await classesCollection.updateOne(filter,updateDoc);
        res.send(result)
    })

    // users get api
    app.get("/users", verifyJWT, async (req, res) => {
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
