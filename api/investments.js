const express = require('express');

function createRouter(db) {
  const router = express.Router();

  // Route Definitions
  router.get('/investments', function (req, res, next) {
    db.query(
      'SELECT * FROM obj_investment',
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(501).json({status: 'DB Query Error from GEAR'});
        } else {
          res.status(200).json(results);
        }
      }
    )
  })

  return router;
}

module.exports = createRouter;