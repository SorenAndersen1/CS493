const router = require('express').Router();
const validation = require('../lib/validation');

const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');
const mysqlPool = require('../lib/mysqlPool');

exports.router = router;
exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};

/*
 * Route to return a list of businesses.
 */
router.get('/', async (req, res) => {

  try {
    const businessesPage = await getBusinessesPage(
      parseInt(req.query.page) || 1
    );
    res.status(200).send(businessesPage);
  } catch (err) {
    console.error("  -- error:", err);
    res.status(500).send({
      err: "Error Cannot Find Businesses"
    });
  }  
});

/*
 * Route to create a new business. MAKE NEW CHECK AGAINST SCHEMA
 */
router.post('/', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, businessSchema)) {
    try {
      const id = await insertNewBusiness(req.body);
      res.status(201).send({
        id: id
      });
    } catch (err) {
      res.status(500).send({
        
        err: "Error Cannot Insert Businesses"
      });
    }
  } else {

    res.status(400).send({
      err: "Request body does not contain a valid Business."
    });
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid/fullinfo', async (req, res, next) => {
  const businessid = parseInt(req.params.businessid);
  console.log("--id: ", businessid);
  try {
      const business = await getBusinessByIdFullInfo(businessid);
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
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async (req, res, next) => {
  const businessid = parseInt(req.params.businessid);
  try {
      const business = await getBusinessById(businessid);
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
 * Route to replace data for a business.
 */
router.put('/:businessid', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, businessSchema)) {
    try {
      const updateSuccessful = await updateBusinessById(parseInt(req.params.businessid), req.body);
      if (updateSuccessful) {
        res.status(200).send({});
      } else {
        next();
      }
    } catch (err) {
      res.status(500).send({
        error: "Unable to update business." + err
      });
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid business."
    });
  }  
});

/*
 * Route to delete a business.
 */
router.delete('/:businessid', async (req, res, next) => {
  const businessid = parseInt(req.params.businessid);
  console.log("--id: ", businessid);
  try {
    const deleteSuccessful = await deleteBusinessById(businessid);
    if (deleteSuccessful) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete business."
    });
  }
});

//GET BUSINESS PAGES FROM LECTURE CODE
async function getBusinessesPage(page) {
  const count = await getBusinessesCount();
  const numPerPage = 10;
  const lastPage = Math.ceil(count/numPerPage);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * numPerPage;

  /*
   * Calculate starting and ending indices of businesses on requested page and
   * slice out the corresponsing sub-array of busibesses.
   */
  // const start = (page - 1) * numPerPage;
  // const end = start + numPerPage;
  // const pageBusinesses = businesses.slice(start, end);

  const [ results ] = await mysqlPool.query(
    "SELECT * FROM businesses ORDER BY id LIMIT ?,?",
    [ offset, numPerPage ]
  );

  /*
   * Generate HATEOAS links for surrounding pages.
   */
  const links = {};
  if (page < lastPage) {
    links.nextPage = `/businesses?page=${page + 1}`;
    links.lastPage = `/businesses?page=${lastPage}`;
  }
  if (page > 1) {
    links.prevPage = `/businesses?page=${page - 1}`;
    links.firstPage = '/businesses?page=1';
  }

  /*
   * Construct and send response.
   */
  return{
    businesses: results,
    pageNumber: page,
    totalPages: lastPage,
    numPerPage: numPerPage,
    totalCount: businesses.length,
    links: links
  };
}
async function getBusinessById(businessId) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM businesses WHERE id = ?',
    [ businessId ],
  );
  return results[0];
}

// exports.getBusinessesPage = getBusinessesPage;
//COUNT IT UP 
async function getBusinessesCount() {
  const [ results ] = await mysqlPool.query(
    "SELECT COUNT(*) AS count FROM businesses"
  );
  console.log("  -- results:", results);
  return results[0].count;
}
//INSERT FUNC
async function insertNewBusiness(business) {
  business = validation.extractValidFields(business, businessSchema);
  const [ result ] = await mysqlPool.query(
    "INSERT INTO businesses SET ?",
    business
  );
  return result.insertId;
}

//FULL INFO FUNC
async function getBusinessByIdFullInfo(businessId) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM businesses AS business INNER JOIN reviews ON business.id = reviews.businessid INNER JOIN photos ON reviews.businessid = photos.businessid WHERE business.id = ?',
    [ businessId ],
  );
  return results;
}

async function updateBusinessById(businessid, business) {
  const validatedBusiness = validation.extractValidFields(
    business,
    businessSchema
  );
  const [ result ] = mysqlPool.query(
    'UPDATE businesses SET ? WHERE id = ?',
    [ validatedBusiness, businessid ]
  );
  return result.affectedRows > 0;

}

async function deleteBusinessById(businessId) {
  const [ result ] = await mysqlPool.query(
    'DELETE FROM businesses WHERE id = ?',
    [ businessId ]
  );
  return result.affectedRows > 0;
}
