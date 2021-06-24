const router = require('express').Router();
const validation = require('../lib/validation');

const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');
const mysqlPool = require('../lib/mysqlPool');


exports.router = router;
exports.reviews = reviews;

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};


/*
 * Route to create a new review.
 */
router.post('/', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, reviewSchema)) {
    try {
      const id = await insertNewReview(req.body);
      res.status(201).send({
        id: id
      });
    } catch (err) {
      console.error("  -- error:", err);
      res.status(500).send({
        err: "Error inserting review into DB.  Try again later."
      });
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid Review."
    });
  }
});

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewid', async (req, res, next) => {
  const reviewid = parseInt(req.params.reviewid);
  console.log("--id: ", reviewid);
  try {
      const review = await getReviewByID(reviewid);
      if(review) {
        res.status(200).send(review);
      } else {
        next();
      }    
  } catch (err) {
    res.status(500).send({
      error: "Unable to fetch review."
    });
  }  
});

/*
 * Route to update a review.
 */
router.put('/:reviewid', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, reviewSchema)) {
    try {
      const updateSuccessful = await updateReviewById(parseInt(req.params.reviewid), req.body);
      res.status(201).send({
        id: id
      });
    } catch (err) {
      res.status(500).send({
        error: "Unable to update Review." + err.message
      });
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid Review."
    });
  }  
});

/*
 * Route to delete a review.
 */
router.delete('/:reviewid', async (req, res, next) => {
  const reviewid = parseInt(req.params.reviewid);
  console.log("--id: ", reviewid);
  try {
    const deleteSuccessful = await deleteReviewByID(reviewid);
    if (deleteSuccessful) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete Review."
    });
  }
});

async function insertNewReview(review) {
  newreview = validation.extractValidFields(review, reviewSchema);
  console.log("  -- review:", newreview);
  const [ result ] = await mysqlPool.query(
    "INSERT INTO reviews SET ?",
    newreview
  );
  return result.insertId;
}


async function deleteReviewByID(reviewid) {
  const [ result ] = await mysqlPool.query(
    'DELETE FROM reviews WHERE id = ?',
    [ reviewid ]
  );
  return result.affectedRows > 0;
}

async function getReviewByID(reviewid) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM reviews WHERE id = ?',
    [ reviewid ],
  );
  return results[0];
}

async function updateReviewById(reviewid, review) {
  const validReview = validation.extractValidFields(
    review,
    reviewSchema
  );
  const [ result ] = mysqlPool.query(
    'UPDATE reviews SET ? WHERE id = ?',
    [ validReview, reviewid ]
  );
  return result.affectedRows > 0;
}