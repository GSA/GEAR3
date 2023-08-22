const ctrl = require('./base.controller'),
  fs = require('fs'),
  path = require('path'),

  queryPath = '../queries/';



exports.runTechCatalogImport = (req, res) => {
  var data = req.body;

  // insert new records
  ctrl.importTechCatlogData(data, res)
  .then((response) => {
    //let json = response;
    
    // check datatype of response
    if (typeof response === 'object') {
      res.status(200).json(response);
    } else if (typeof response === 'string') {
      res.status(200).json({ message: response, });
    } else {
      res.status(400).json({ message: 'Invalid response type', });
    }

  });
};
/*
exports.runImport = (req, res) => {
  var data = req.body;

  if (data.importtype == 'insert') {

    // insert new records
    ctrl.importNewRecords(data, res)
      .then((response) => {
        //let json = response;
        
        // check datatype of response
        if (typeof response === 'object') {
          res.status(200).json(response);
        } else if (typeof response === 'string') {
          res.status(200).json({ message: response, });
        } else {
          res.status(400).json({ message: 'Invalid response type', });
        }

      });

  } else if (data.importtype == 'update') {

    // update existing records
    ctrl.importUpdatedRecords(data, res)
    .then((response) => {
      //let json = response;

      // check datatype of response
      if (typeof response === 'object') {
        res.status(200).json(response);
      } else if (typeof response === 'string') {
        res.status(200).json({ message: response, });
      } else {
        res.status(400).json({ message: 'Invalid response type', });
      }

    });
    
  } else {

    // return invalid import type
    res.status(400).json({ message: 'Invalid import type', });

  }
};
*/