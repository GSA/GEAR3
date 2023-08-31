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

  const maxJobs = 8;

  const defaultImportType = 'update';
  const refreshToken = req.body.refreshtoken;
  const defaultTakeAmount = '10000';
  const defaultDryRun = 'false';
  let importSummaries = [];
  let groupNumber = 0;
  let returnType = 'response';

  const importGroups = {
    group1: [
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "Manufacturer",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      },
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "Platform",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      },
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "Taxonomy",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      }
    ],
    group2: [
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "SoftwareFamily",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      }
    ],
    group3: [
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "SoftwareProduct",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      }
    ],
    group4: [
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "SoftwareMarketVersion",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      },
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "SoftwareEdition",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      },
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "SoftwareProductLink",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      }
    ],
    group5: [
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "SoftwareVersion",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      }
    ],
    group6: [
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "SoftwareRelease",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      }
    ],
    group7: [
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "SoftwareLifecycle",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      },
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "SoftwareReleaseLink",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
      }
    ],
    group8: [
      {
        importtype: defaultImportType,
        refreshtoken: refreshToken,
        dataset: "SoftwareReleasePlatform",
        takeamount: defaultTakeAmount,
        dryrun: defaultDryRun
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

  try {
    if (req.headers.requester === 'GearCronJ') {
      returnType = 'object';
    }
  } catch (error) {
    returnType = 'response';
  }

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

        const responseObject = {
          message: `All ${groupNumber} of ${maxJobs} groups have successfully completed imported!`,
          starttime: startTime,
          endtime: new Date(),
          duration: formatDuration(startTime, new Date()),
          error: null,
          importSummaries: importSummaries
        };

        // return the response once all groups have been imported
        if (groupNumber === maxJobs) {
          if (returnType === 'object') {
            return responseObject;
          } else {
            res.status(200).json(responseObject);
          }
        }
      }

    } catch (error) {
      console.error(`an error occurred while importing group ${groupNumber} of ${maxJobs}: \n`, error);
      const responseObject = {
        message: `an error occurred while importing group ${groupNumber}`,
        starttime: startTime,
        endtime: new Date(),
        duration: formatDuration(startTime, new Date()),
        error: error,
        importSummaries: importSummaries
      };
      if (returnType === 'object') {
        return responseObject;
      } else {
        res.status(500).json(responseObject);
      }

    }

  } while (groupNumber < maxJobs);

};
