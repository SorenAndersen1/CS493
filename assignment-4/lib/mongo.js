/*
 * Module for working with a MongoDB connection.
 */

const { MongoClient } = require('mongodb');

const mongoHost = process.env.MONGO_HOST || "localhost";
const mongoPort = process.env.MONGO_PORT || 27017;
const mongoUser = process.env.MONGO_USER || "root";
const mongoPassword = process.env.MONGO_PASSWORD || "hunter2";
const mongoDBName = process.env.MONGO_DATABASE || "businesses";


const mongoUrl = `mongodb://root:hunter2@localhost:27017/businesses?authSource=admin&compressors=zlib&readPreference=primary&gssapiServiceName=mongodb&appname=MongoDB%20Compass&ssl=false`;

let db = null;

exports.connectToDB = function (callback) {
  MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(mongoDBName);
    callback();
  });
};

exports.getDBReference = function () {
  return db;
};
