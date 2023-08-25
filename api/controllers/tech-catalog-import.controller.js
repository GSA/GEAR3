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

exports.runDailyTechCatalogImport = async (req, res) => {

  const maxJobs = 7;

  const defaultImportType = 'update';
  const refreshToken = req.body.refreshtoken;
  const defaultTakeAmount = '10000';
  const defaultDryRun = 'false';

  let importSummaries = [];

  let groupNumber = 0;
  
  const importGroups = {
    group1 : [  
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "Manufacturer",
        takeamount : "10000",
        dryrun : "false"
      },
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "Platform",
        takeamount : "10000",
        dryrun : "false"
      },
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "Taxonomy",
        takeamount : "10000",
        dryrun : "false"
      }
    ],
    group2 : [
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "SoftwareFamily",
        takeamount : "10000",
        dryrun : "false"
      }
    ],
    group3 : [
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "SoftwareProduct",
        takeamount : "10000",
        dryrun : "false"
      }
    ],
    group4 : [
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "SoftwareMarketVersion",
        takeamount : "10000",
        dryrun : "false"
      },
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "SoftwareEdition",
        takeamount : "10000",
        dryrun : "false"
      },
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "SoftwareProductLink",
        takeamount : "10000",
        dryrun : "false"
      }
    ],
    group5 : [
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "SoftwareVersion",
        takeamount : "10000",
        dryrun : "false"
      }
    ],
    group6 : [
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "SoftwareRelease",
        takeamount : "10000",
        dryrun : "false"
      }
    ],
    group7 : [
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "SoftwareLifecycle",
        takeamount : "10000",
        dryrun : "false"
      },
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "SoftwareReleaseLink",
        takeamount : "10000",
        dryrun : "false"
      },
      {
        importtype : "update",
        refreshtoken : refreshToken,
        dataset : "SoftwareReleasePlatform",
        takeamount : "10000",
        dryrun : "false"
      }
    ]
  };

  function formatDuration(start_date, end_date) {

    // - description: calculates the duration between two dates and returns a formatted date string
    // - parameters: start_date (date object), end_date (date object)
    // - returns: result (string)
  
    const duration = new Date(end_date - start_date);
  
    const hours = duration.getUTCHours();
    const minutes = duration.getUTCMinutes();
    const seconds = duration.getUTCSeconds();
  
    let result = "";
    if (hours > 0) {
      result += hours + (hours === 1 ? " hour" : " hours");
    }
    if (minutes > 0) {
      if (result !== "") {
        result += ", ";
      }
      result += minutes + (minutes === 1 ? " minute" : " minutes");
    }
    if (seconds > 0) {
      if (result !== "") {
        result += ", ";
      }
      result += seconds + (seconds === 1 ? " second" : " seconds");
    }
    
    return result;
  }

  let startTime = new Date();

  do {

    try {

      console.log(`... Starting import for group ${groupNumber}`);

      // set the current group number
      groupNumber++;
      // get the current group dataset(s)
      const promisesGroup = importGroups[`group${groupNumber}`].map(data => ctrl.importTechCatlogData(data, res));
      // run the import for each dataset in the group and wait until all are complete
      const groupSummary = await Promise.all(promisesGroup);
      // add groupSummary to importSummaries
      importSummaries.push(groupSummary);
      // verify the response for each dataset in the group for any fatal errors
      const errors = groupSummary.filter(result => result.fatalError > 0);
      // if any fatal errors occurred, log them and return a 500 error
      if (errors.length > 0) {
          throw `ERROR: 1 or more datasets in group ${groupNumber} failed to import`;
      // otherwise, log the success and continue to the next group
      } else {
          console.log(`... Import group ${groupNumber} has successfully completed imported!`);
          // return the response once all groups have been imported
          if (groupNumber === maxJobs) {
            res.status(200).json({message : `All ${groupNumber} of ${maxJobs} groups have successfully completed imported!`,
                                starttime : startTime,
                                  endtime : new Date(),
                                 duration : formatDuration(startTime, new Date()),
                                    error : null,
                          importSummaries : importSummaries });
          }
      }

    } catch (error) {
      console.error(`an error occurred while importing group ${groupNumber} of ${maxJobs}: \n`, error);
      res.status(500).json({ message : `an error occurred while importing group ${groupNumber}`,
                           starttime : startTime,
                             endtime : new Date(),
                            duration : formatDuration(startTime, new Date()),
                               error : error,
                     importSummaries : importSummaries });
    }

  } while (groupNumber < maxJobs);
      
};
