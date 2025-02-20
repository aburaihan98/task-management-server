const express = require("express");
const cors = require("cors");
const client = require("./middleware/middleware");
const { ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { Server } = require("socket.io");
const http = require("http");
const { log } = require("console");

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(
  cors({
    origin: ["http://localhost:5173", "https://task-management-3e3b3.web.app"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

async function run() {
  try {
    // Send a ping to confirm a successful connection
    const database = client.db("task-managementDB");
    const userCollection = database.collection("users");
    const taskCollection = database.collection("tasks");

    // user insert
    app.post("/user", async (req, res) => {
      const body = req.body;

      const existingUser = await userCollection.findOne({ email: body.email });

      if (existingUser) {
        return res.status(400).send({ message: "User already exists" });
      }

      const result = await userCollection.insertOne(body);
      res.send(result);
    });

    // add task
    app.post("/tasks", async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.status(201).send(result);
    });

    // get task
    app.get("/tasks", async (req, res) => {
      const result = await taskCollection.find().toArray();
      res.status(201).send(result);
    });

    // edit tasks
    app.put("/tasks/:id", async (req, res) => {
      const { id } = req.params;
      const updatedTask = req.body;

      const result = await taskCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedTask }
      );

      res.status(200).send(result);
    });

    // delete task
    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });
      res.status(201).send(result);
    });

    // Change Stream Setup
    const changeStream = taskCollection.watch();
    changeStream.on("change", async (change) => {
      console.log(change);
      if (change.operationType === "insert") {
        io.emit("taskAdded", change.fullDocument);
      } else if (change.operationType === "delete") {
        io.emit("taskDeleted", change.documentKey._id);
      } else if (change.operationType === "update") {
        io.emit(
          "taskUpdated",
          change.updateDescription.updatedFields,
          change.documentKey
        );
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from SoloSphere Server....");
});

server.listen(port, () => console.log(`Server running on port ${port}`));
