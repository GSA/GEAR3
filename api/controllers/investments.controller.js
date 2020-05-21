const Investment = require("../models/investments.model");

function findAll (req, res) {
  Investment.getAll((err, data) => {
    if (err)
      res.status(501).json({
        message:
          err.message || "DB Query Error while retrieving investments"
      });
    else res.status(200).json(data);
  });
};

module.exports = {findAll};