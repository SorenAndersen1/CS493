const express = require('express');
const logger = require('./lib/logger');

const app = express();
const port = process.env.PORT || 8000;

const users = require('./models/users.json');
const business = require('./models/business.json');


const reviews = require('./models/reviews.json');


app.use(express.json());

app.use(logger);

app.listen(port, () => {
  console.log("== Server is listening on port", port);
});

//Get specific biz
app.get('/business/:bID', (req, res, next) => {
  const bID = req.params.bID;
  if (business[bID]) {
    res.status(200).send(business[bID]);
  } else {
    next();
  }
});


//See all businesses
app.get('/business', (req, res, next) => {
  res.status(200).send(business);
});

//Add Business
app.post('/business', (req, res) => {

  const id = business.length - 1;
  if (req.body && req.body.name && req.body.address && req.body.city && req.body.state && req.body.zip && req.body.phone) {
    business.push({
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      phone: req.body.phone,
      website: req.body.website,
      email: req.body.email,
      category: req.body.category,
      subcategory: req.body.subcategory,
      links: {
        review: '/reviews/' + id
      }
    });
    res.status(201).send({
      id: id
    });
  } else {
    res.status(400).send({
      error: "Incorrect Fields."
    });
  }
});


//Delete specific biz
app.delete('/business/:bID', function (req, res, next) {
    var bID = parseInt(req.params.bID);
    if (business[bID]) {
        business[bID] = null;
        res.status(204).end();
    } else {    
        next();
    }    
});

//Change individual biz
app.put('/business/:bID', (req, res, next) => {
    var bID = parseInt(req.params.bID);
    if (business[bID]) {
        if (req.body && req.body.name && req.body.address && req.body.city && req.body.state && req.body.zip && req.body.phone) {
            business[bID] = req.body;

            res.status(200).json({
              business : "business added",
              name : req.body.name
            });            
        } else {
            res.status(400).send({
                error: "Incorrect body please resubmit."
            });
        }
    } else {
        next();
    } 
});



//get all reviews
app.get('/reviews', (req, res, next) => {
    res.status(200).send(reviews);
  });

//add reviews of specific biz
app.post('/reviews/:bID/:uID', (req, res) => {
  const uID = req.params.uID;

  const bID = req.params.bID;
    if (req.body && req.body.rating && req.body.price) {
      reviews.push({
        rating: req.body.rating,
        price: req.body.price,
        written: req.body.written,
        links: {
            business: '/business/' + bID,
            user: '/user/' + uID
          }
      });
      const id = reviews.length - 1;
      res.status(201).send({
        id: id
      });
    } else {
      res.status(400).send({
        error: "Incorrect Field, please resubmit"
      });
    }
});

//get all reviews of specific biz
app.get('/reviews/:rID', (req, res, next) => {
    const rID = req.params.rID;
    if (reviews[rID]) {
      res.status(200).send(reviews[rID]);
    } else {
      next();
    }
});

app.put('/reviews/:rID', (req, res, next) => {
    var rID = parseInt(req.params.rID);
    if (reviews[rID]) {
        if (req.body && req.body.rating && req.body.price) {
            reviews[rID] = req.body;

            res.status(200).json({
              reviews : "reviews added",
              rating : req.body.rating

            });            
        } else {
            res.status(400).send({
                error: "Incorrect fields please resubmit."
            });
        }
    } else {
        next();
    } 
});

app.delete('/reviews/:rID', function (req, res, next) {
    var rID = parseInt(req.params.rID);
    if (reviews[rID]) {
        reviews[rID] = null;
        res.status(204).end();
    } else {
        next();
    }    
});

app.post('/users/:bID', (req, res) => {
    var bID = parseInt(req.params.bID);
    if (req.body && req.body.image && req.body.caption) {
      users.push({        
        image: req.body.image,
        caption: req.body.caption,
        links: {
            business: '/business/' + bID
        }
      });
      const id = users.length - 1;
      res.status(201).send({
        id: id
      });
    } else {
      res.status(400).send({
        error: "Incorrect Fields please resubmit"
      });
    }
});

app.get('/users/:uID', (req, res, next) => {
    const uID = req.params.uID;
    if (users[uID]) {
      res.status(200).send(users[uID]);
    } else {
      next();
    }
});


app.put('/users/:uID', (req, res, next) => {
    var uID = parseInt(req.params.uID);
    if (users[uID]) {
        if (req.body.caption) {
            users[uID] = req.body;
            res.status(200).json({
              user : "user added",
              caption : req.body.caption
            });            
        } else {
            res.status(400).send({
              error: "Incorrect Fields please resubmit"
            });
        }
    } else {
        next();
    } 
});


app.use('*', (req, res, next) => {
  res.status(404).send({
    error: "Error Could not find " + req.originalUrl
  });
});

