const router = require('express').Router();
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const {getReviewsByUserId} = require('../models/review')
const {
  UserSchema,
  getUsersCount,
  getUsersPage,
  insertNewUser,
  getUserById,
  replaceUserById,
  deleteUserById,
  validateUser
} = require('../models/users');
const {getPhotosByUserId} = require('../models/photo');
const {
  getBusinessesByOwnerId,
  getBusinessDetailsById
} = require('../models/business');

/*
 * Route to list all of a user's businesses.
 */
router.get('/:id/businesses', requireAuthentication ,async (req, res, next) => {
  if(req.user != req.params.id && req.user.admin == false) { 
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
  try {
    const businesses = await getBusinessesByOwnerId(parseInt(req.params.id));
    if (businesses) {
      res.status(200).send({ businesses: businesses });
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch businesses.  Please try again later."
    });
  }
}
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:id/reviews', requireAuthentication, async (req, res, next) => {
  if(req.user != req.params.id && req.user.admin == false) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
   try {
    const reviews = await getReviewsByUserId(parseInt(req.params.id));
    if (reviews) {
      res.status(200).send({ reviews: reviews });
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch reviews.  Please try again later."
    });
  }
}
});

router.post('/login', async (req, res) => {
  if (req.body && req.body.id  && req.body.password) {
    try {
      const authenticated = await validateUser(req.body.id, req.body.password);
      if (authenticated) {
        res.status(200).send({
          token: generateAuthToken(req.body.id, authenticated.admin)
        });
      } else {
        res.status(401).send({
          error: "Invalid authentication credentials."
        });
      }
    } catch (err) {
      console.error("  -- error:", err);
      res.status(500).send({
        error: "Error logging in.  Try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body needs `id` and `password`."
    });
  }
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:id/photos', requireAuthentication, async (req, res, next) => {
  if(req.user != req.params.id && req.user.admin == false) { 
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
  try {
    const photos = await getPhotosByUserId(parseInt(req.params.id));
    if (photos) {
      res.status(200).send({ photos: photos });
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch photos.  Please try again later."
    });
  }
}
});

/*
 * Route to create a new user.
 */
router.post('/', async (req, res) => {
  if (validateAgainstSchema(req.body, UserSchema)) {
    try {
      const id = await insertNewUser(req.body);
      res.status(201).send({
        id: id,
        links: {
          business: `/users/${id}`
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Error inserting user into DB.  Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid business object."
    });
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:id', requireAuthentication, async (req, res, next) => {

  if(req.user != req.params.id && req.user.admin == false) { 
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
   try {
     const user = await getUserById(parseInt(req.params.id));
     if (user) {
       res.status(200).send(user);
     } else {
       next();
     }
   } catch (err) {
     console.error(err);
     res.status(500).send({
       error: "Unable to fetch User.  Please try again later."
     });
   }
  }

 });


module.exports = router;
