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

  const maxJobsDefault = 9;
  const defaultImportType = 'update';
  const refreshToken = req.body.refreshtoken;
  const defaultTakeAmount = '10000';
  const defaultDryRun = 'false';
  const startTime = new Date();
  let maxJobs = maxJobsDefault;
  let lastSyncDateOverride = null;
  let lastIdOverride = null;
  let importSummaries = [];
  let groupNumber = 0;
  let returnType = 'response';
  let endTime = null;
  let endDailyImport = false;
  let endMessage = null;
  let endError = null;
  let endStatus = 200;

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

  try {

    // check if the requester is GearCronJ
    try {
      if (req.headers.requester === 'GearCronJ') {
        returnType = 'object';
      }
    } catch (error) {
      throw 'no valid requester provided';
    }

    // check for optional parameters - startfromgroupoverride
    try {
      if (req.body.startfromgroupoverride > 0 && req.body.startfromgroupoverride <= maxJobs) {
        groupNumber = req.body.startfromgroupoverride - 1;
      }
    } catch (error) {
      console.log('no startfromgroupoverride provided');
    }

    // check for optional parameters - endongroupoverride
    try {
      if (req.body.endongroupoverride > 0 && req.body.endongroupoverride <= maxJobs) {
        maxJobs = req.body.endongroupoverride;
      }
    } catch (error) {
      console.log('no endongroupoverride provided');
    }

    // check for optional parameters - lastidoverride
    try {
      lastSyncDateOverride = req.body.lastsyncdateoverride;
    } catch (error) {
      console.log('no lastsyncdateoverride provided')
    }

    // check for optional parameters - lastidoverride
    try {
      lastIdOverride = req.body.lastidoverride;
    } catch (error) {
      console.log('no lastidoverride provided')
    }

    // log start of daily import
    ctrl.sendLogQuery(`Tech Catalog Daily Import - Starting import groups ${groupNumber+1} - ${maxJobs}`, req.headers.requester, "tech catalog daily import", null);

    // LIST OF IMPORT GROUPS
    const importGroups = {
      group1: [
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "Manufacturer",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        }
      ],
      group2: [
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "Platform",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        },
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "Taxonomy",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        }
      ],
      group3: [
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "SoftwareFamily",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        }
      ],
      group4: [
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "SoftwareProduct",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        }
      ],
      group5: [
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "SoftwareMarketVersion",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        },
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "SoftwareEdition",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        },
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "SoftwareProductLink",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        }
      ],
      group6: [
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "SoftwareVersion",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        }
      ],
      group7: [
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "SoftwareRelease",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        }
      ],
      group8: [
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "SoftwareReleaseLink",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        },
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "SoftwareReleasePlatform",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        }
      ],
      group9: [
        {
          importtype: defaultImportType,
          refreshtoken: refreshToken,
          dataset: "SoftwareLifecycle",
          takeamount: defaultTakeAmount,
          dryrun: defaultDryRun,
          lastidoverride : lastIdOverride,
          lastsyncdateoverride : lastSyncDateOverride
        }
      ]
    };

    // --------------------------------

    // loop through each import group
    do {

      try {

        // log start of the import group
        console.log(`... Starting import for group ${groupNumber}\n`);
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
        // verify the response for each dataset in the group for any duplicate jobs running
        const duplicateJobsRunning = groupSummary.filter(result => result.duplicateJobsRunning > 0);

        
        if (errors.length > 0) {
          // if any fatal errors occurred, log them and return a 500 error

          endMessage = `ERROR: 1 or more datasets in group ${groupNumber} failed to import.\n`;
          endStatus = 500;
          endDailyImport = true;
          
        } else {
          // if any duplicate jobs are running, log them and return a 200 error

          try {

            if (duplicateJobsRunning.length > 0) {
              // if any duplicate jobs are running, log them and return a 200 error

              endMessage = `Daily Import is already in progress.\n`;
              endStatus = 200;
              endDailyImport = true;
              
            }

          } catch (error) {
            console.log('no duplicateJobsRunning found.\n')
          }

          // otherwise, log the success and continue to the next group

          console.log(`... Import group ${groupNumber} has successfully completed imported!...\n`);

          // return the response once all groups have been imported
          if (groupNumber >= maxJobs) {
            endMessage = `All ${groupNumber} of ${maxJobs} groups have successfully completed imported!\n`,
            endStatus = 200;
            endDailyImport = true;
          }
        }

      } catch (error) {
        console.error(`an error occurred while importing group ${groupNumber} of ${maxJobs}: \n`, error);
        endMessage = `ERROR: an error occurred while importing group ${groupNumber} of ${maxJobs}.\n`;
        endError = error;
        endStatus = 500;
        endDailyImport = true;
      }

    } while (groupNumber < maxJobs && endDailyImport !== true);

    const responseObject = {
      message: endMessage,
      starttime: startTime,
      endtime: new Date(),
      duration: formatDuration(startTime, new Date()),
      error: endError,
      importSummaries: importSummaries
    };

    console.log(responseObject);

    // log start of daily import
    ctrl.sendLogQuery(`Tech Catalog Daily Import - completed`, req.headers.requester, "tech catalog daily import", null);

    if (returnType === 'object') {
      return responseObject;
    } else {
      return res.status(endStatus).json(responseObject);
    }

  } catch (error) {
    console.error(`an error occurred while running the daily import: \n`, error);
    const responseObject = {
      message: `ERROR: an error occurred while running the daily import.`,
      starttime: startTime,
      endtime: new Date(),
      duration: formatDuration(startTime, new Date()),
      error: error
    };
    // log start of daily import
    ctrl.sendLogQuery(`Tech Catalog Daily Import - error importing group ${groupNumber}`, null, "tech catalog daily import", null);
    return res.status(500).json(responseObject);
  }

};
