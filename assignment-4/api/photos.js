/*
 * API sub-router for businesses collection endpoints.
 */

const router = require('express').Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs/promises');
const worker = require('../dimensionsWorker');

const { connectToDB } = require('../lib/mongo');
const { connectToRabbitMQ, getChannel } = require('../lib/rabbitmq');
const {
  getImageInfoById,
  saveImageInfo,
  saveImageFile,
  getImageDownloadStreamByFilename,
  getImageDownloadStreamByFilenameAndSize
} = require('../models/image');
const acceptedFileTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif'
};
const { validateAgainstSchema } = require('../lib/validation');
const {
  PhotoSchema,
  insertNewPhoto,
  getPhotoById
} = require('../models/photo');

// const upload = multer({ dest: `${__dirname}/uploads` });
const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = acceptedFileTypes[file.mimetype];
      callback(null, `${filename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!acceptedFileTypes[file.mimetype])
  }
});

/*
 * Route to create a new photo.
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  if (validateAgainstSchema(req.body, PhotoSchema)) {
    console.log("== req.body:", req.body);
    console.log("== req.file:", req.file);
    if (req.file && req.body && req.body.userId) {
      const image = {
        contentType: req.file.mimetype,
        filename: req.file.filename,
        path: req.file.path,
        userId: req.body.userId
      };
      const id = await saveImageFile(image);
      await fs.unlink(req.file.path);

      const channel = getChannel();
      channel.sendToQueue('images', Buffer.from(id.toString()));
      res.status(200).send({ id: id });
    } else {
      res.status(400).send({
        error: "Request body must contain 'image' and 'userId'"
      });
    }
  }
});
router.get('/media/images/:filename', (req, res, next) => {
  getImageDownloadStreamByFilename(req.params.filename)
    .on('file', (file) => {
      res.status(200).type(file.metadata.contentType);
    })
    .on('error', (err) => {
      if (err.code === 'ENOENT') {
        next();
      } else {
        res.status(404).send({
          error: "Could Not find requested File"
        });
      }
    })
    .pipe(res);
});

router.get('/media/photos/:fullFilename', (req, res, next) => {
  getImageDownloadStreamByFilenameAndSize(req.params.fullFilename)
  .on('file', (file) => {
    res.status(200).type("image/jpg");
  })
  .on('error', (err) => {
    if (err.code === 'ENOENT') {
      next();
    } else {
      res.status(404).send({
        error: "Could Not find requested File"
      });

    }
  })
  .pipe(res);
});
/*
 * Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const image = await getImageInfoById(req.params.id);
    if (image) {
      const responseBody = {
        _id: image._id,
        filename: image.filename,
        url: `/media/images/${image.filename}`,
        contentType: image.metadata.contentType,
        userId: image.metadata.userId,
        urls: image.urls,
        filenames: image.filenames
      };
      res.status(200).send(responseBody);
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
