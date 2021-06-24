const router = require('express').Router();
const validation = require('../lib/validation');

const photos = require('../data/photos');
const mysqlPool = require('../lib/mysqlPool');


exports.router = router;
exports.photos = photos;
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};


/*
 * Route to create a new photo.
 */
router.post('/', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, photoSchema)) {
    try {
      const id = await insertNewphoto(req.body);
      res.status(201).send({
        id: id
      });
    } catch (err) {
      console.error("  -- error:", err);
      res.status(500).send({
        err: "Error inserting photo into DB.  Try again later."
      });
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid photo."
    });
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoid', async (req, res, next) => {
  const photoid = parseInt(req.params.photoid);
  try {
      const photo = await getphotoByID(photoid);
      if(photo) {
        res.status(200).send(photo);
      } else {
        next();
      }    
  } catch (err) {
    res.status(500).send({
      error: "Unable to fetch photo."
    });
  }  
});

/*
 * Route to update a photo.
 */
router.put('/:photoid', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, photoSchema)) {
    try {
      const updateSuccessful = await updatephotoById(parseInt(req.params.photoid), req.body);
      if (updateSuccessful) {
        res.status(200).send({});
      } else {
        next();
      }
    } catch (err) {
      res.status(500).send({
        error: "Unable to update photo." + err 
      });
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid photo."
    });
  }  
});

/*
 * Route to delete a photo.
 */
router.delete('/:photoid', async (req, res, next) => {
  const photoid = parseInt(req.params.photoid);
  console.log("--id: ", photoid);
  try {
    const deleteSuccessful = await deletephotoByID(photoid);
    if (deleteSuccessful) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete photo."
    });
  }
});

async function insertNewphoto(photo) {
  newphoto = validation.extractValidFields(photo, photoSchema);
  console.log("  -- photo:", newphoto);
  const [ result ] = await mysqlPool.query(
    "INSERT INTO photos SET ?",
    newphoto
  );
  return result.insertId;
}


async function deletephotoByID(photoid) {
  const [ result ] = await mysqlPool.query(
    'DELETE FROM photos WHERE id = ?',
    [ photoid ]
  );
  return result.affectedRows > 0;
}

async function getphotoByID(photoid) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM photos WHERE id = ?',
    [ photoid ],
  );
  return results[0];
}

async function updatephotoById(photoid, photo) {
  const validphoto = validation.extractValidFields(
    photo,
    photoSchema
  );
  const [ result ] = mysqlPool.query(
    'UPDATE photos SET ? WHERE id = ?',
    [ validphoto, photoid ]
  );
  return result.affectedRows > 0;

}