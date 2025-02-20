const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const uri = process.env.URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

module.exports = client;
