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
exports.runDailyTechCatalogImport = (req, res) => {
  
  const group1 = [
    {},
    {},
    {}
  ];

  const group2 = [
    {},
    {},
    {}
  ]

  const group3 = [
    {},
    {},
    {}
  ]

  const group4 = [
    {},
    {},
    {}
  ]

  const group5 = [
    {},
    {},
    {}
  ]

  const group6 = [
    {},
    {},
    {}
  ]

  const group7 = [
    {},
    {},
    {}
  ]

  // run group 1
  try {
    const promisesGroup1 = group1.map(data => ctrl.importTechCatlogData(data, res));

    const group1Summary = await Promise.all(promisesGroup1);

    const errors = group1Summary.filter(result => result.errors > 0);

    if (errors.length > 0) {
        console.error("an error occurred while importing group 1:", errors);
    } else {
        console.log("All datasets in group 1 have been imported successfully!");
    }
  } catch (err) {
    console.error("an error occurred while importing group 1:", err);
  }

  // run group 2

  // run group 3

  // run group 4

  // run group 5

  // run group 6

  // run group 7

  // end daily import ----------------------
      
  // check datatype of response
  if (typeof response === 'object') {
    res.status(200).json(response);
  } else if (typeof response === 'string') {
    res.status(200).json({ message: response, });
  } else {
    res.status(400).json({ message: 'Invalid response type', });
  }
};
*/