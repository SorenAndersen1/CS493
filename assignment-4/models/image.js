const fs = require('fs');
const { ObjectId, GridFSBucket } = require('mongodb');
var Jimp = require('jimp');
const { getDBReference } = require('../lib/mongo');
const { emitWarning } = require('process');

exports.saveImageInfo = async function (image) {
  const db = getDBReference();
  const collection = db.collection('images');
  const result = await collection.insertOne(image);
  return result.insertedId;
};

exports.saveImageFile = function (image) {
  return new Promise((resolve, reject) => {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    const metadata = {
      contentType: image.contentType,
      userId: image.userId
    };

    const uploadStream = bucket.openUploadStream(
      image.filename,
      { metadata: metadata }
    );
    fs.createReadStream(image.path).pipe(uploadStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
      /*
       * Remove file from fs.
       */
  });
};

exports.saveImageFileWithIDs = function (image, urls, contentType, userID) {
  return new Promise((resolve, reject) => {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    const metadata = {
      contentType: contentType,
      userId: userID
    };
    const uploadStream = bucket.openUploadStream(
      image.filename,
      urls,
      { metadata: metadata }
    );
    fs.createReadStream(image.path).pipe(uploadStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
      /*
       * Remove file from fs.
       */
  });
};

function removeUploadedFile(file) {
    return new Promise((resolve, reject) => {
      fs.unlink(file.path, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
exports.getDimensionArray = async function(dimension) {
  if(dimension > 1024){
    return [128, 256, 640, 1024]
  }
  else if(dimension > 640){
    return [128, 256, 640]
  }
  else if(dimension > 256){
    return [128, 256]
  }
  else if(dimension > 128){
    return [128]
  }
};

exports.getImageDownloadStreamByFilenameAndSize = function(filename) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });
  return bucket.openDownloadStreamByName(filename);
};
exports.getImageDownloadStreamByFilename = function(filename) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'images' });
  return bucket.openDownloadStreamByName(filename);
};

exports.getDownloadStreamById = function (id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'images' });
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    return bucket.openDownloadStream(new ObjectId(id));
  }
};

exports.linkImageByID = async function (id, urls, filenames) {
  const db = getDBReference();
  const collection = db.collection('images.files');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { "urls": urls,
    "filenames":filenames }}
    );
    return result.matchedCount > 0;
  }};

exports.updateImageDimensionsById = async function (dimensions, image, info, itr, imgSize) {
  const db = getDBReference();
  const collection = db.collection('images.files');
  const bucket = new GridFSBucket(db, {bucketName: 'photos'});
  var str = info._id;
  var res = str.toString();
  var filenames = {}
  var urls = {};

  for(var i in imgSize) {    
    var item = imgSize[i];   
    var name = item.toString();
    filenames[name] = `${res}-${item}.jpg`;
    urls[name] = `/media/photos/${res}-${item}.jpg`
  }
  Jimp.read(image).then(async newPhoto => {
    const buffer = await newPhoto.resize(dimensions, dimensions, Jimp.AUTO)
      .getBufferAsync(Jimp.MIME_JPEG);
    const uploadStream = bucket.openUploadStream(
      `${res}-${imgSize[itr]}.jpg`,
        {filenames: filenames},
        {urls: urls}
    );
    uploadStream.write(buffer);
    uploadStream.end();
  }) 
  .catch(err => {
    console.error(err);
  });
  return filenames;
};

exports.getImageInfoById = async function (id) {
  const db = getDBReference();
  // const collection = db.collection('images');
  const bucket = new GridFSBucket(db, { bucketName: 'images' });

  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    // const results = await collection.find({ _id: new ObjectId(id) })
    //   .toArray();
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
};