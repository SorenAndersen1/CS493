const router = require('express').Router();

exports.router = router;
const mysqlPool = require('../lib/mysqlPool');

const { businesses } = require('./businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');


/*
 * Route to list all of a user's businesses.
 */

/*
 * Route to fetch info about a specific business.
 */
router.get('/:userid/businesses', async (req, res, next) => {
  const userid = parseInt(req.params.userid);
  try {
      const business = await getUserBusinessesById(userid);
      if(business) {
        res.status(200).send(business);
      } else {
        next();
      }    
  } catch (err) {
    res.status(500).send({
      error: "Unable to fetch business." + err
    });
  }  
});


/*
 * Route to list all of a user's reviews.
 */
router.get('/:userid/photos', async (req, res, next) => {
  const userid = parseInt(req.params.userid);
  try {
      const business = await getUserPhotosById(userid);
      if(business) {
        res.status(200).send(business);
      } else {
        next();
      }    
  } catch (err) {
    res.status(500).send({
      error: "Unable to fetch business." 
    });
  }  
});

router.get('/:userid/reviews', async (req, res, next) => {
  const userid = parseInt(req.params.userid);
  try {
      const business = await getUserReviewsById(userid);
      if(business) {
        res.status(200).send(business);
      } else {
        next();
      }    
  } catch (err) {
    res.status(500).send({
      error: "Unable to fetch business."
    });
  }  
});
/*
 * Route to list all of a user's photos.
 */


async function getUserBusinessesById(ownerid) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM businesses WHERE ownerid = ?',
    [ ownerid ],
  );
  return results[0];
}

async function getUserPhotosById(ownerid) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM photos WHERE userid = ?',
    [ ownerid ],
  );
  return results[0];
}

async function getUserReviewsById(userid) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM reviews WHERE userid = ?',
    [ userid ],
  );
  return results[0];
}