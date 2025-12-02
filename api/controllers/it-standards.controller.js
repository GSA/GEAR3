const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');
const { Guid } = require('typescript-guid');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE obj_standard_type.Keyname LIKE 'Software'
      AND obj_technology_status.Keyname NOT LIKE 'Not yet submitted'
      GROUP BY tech.Id
      ORDER BY IFNULL(tech.softwareReleaseName, tech.Keyname);`;

  res = ctrl.sendQuery(query, 'IT Standards', res); //removed sendQuery_cowboy reference
};

exports.findAllNoFilter = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE obj_standard_type.Keyname LIKE 'Software'
      GROUP BY tech.Id
      ORDER BY IFNULL(tech.softwareReleaseName, tech.Keyname);`;

  res = ctrl.sendQuery(query, 'IT Standards', res); //removed sendQuery_cowboy reference
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE tech.Id = ${req.params.id};`;
  res = ctrl.sendQuery(query, 'individual IT Standard', res); //removed sendQuery_cowboy reference
};

exports.findLatest = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` GROUP BY tech.Id
      ORDER BY tech.CreateDTG DESC LIMIT 1;`;

  res = ctrl.sendQuery(query, 'latest individual IT Standard', res); //removed sendQuery_cowboy reference
};

exports.updatedWithinWeek = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE tech.ChangeDTG >= (CURDATE() - INTERVAL 7 DAY)
      GROUP BY tech.Id
      ORDER BY tech.ChangeDTG DESC;`;

  res = ctrl.sendQuery(query, 'IT standard with change date in the last 7 days', res); 
};

exports.findSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` LEFT JOIN zk_systems_subsystems_technology_xml AS mappings ON systems.\`ex:GEAR_ID\` = mappings.\`ex:obj_systems_subsystems_Id\`
      LEFT JOIN obj_technology AS tech                                ON mappings.\`ex:obj_technology_Id\` = tech.Id

      WHERE tech.Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`; //removed LEFT JOIN cowboy_ods.obj_technology reference

  res = ctrl.sendQuery(query, 'systems using IT Standard', res);
};

exports.update = (req, res) => {
  ctrl.getApiToken (req, res)
  .then((response) => {
    if (response === 1) {
      let techId = req.params.id;
      let data = req.body;
      let query = '';
      
      // Update base data
      query += updateData(techId, data);

      // Update Technopedia Fields
      query += saveCustomManufacturer(techId, data.tcManufacturer);
      query += saveCustomSoftwareProduct(techId, data.tcSoftwareProduct, data.tcManufacturer);
      if(data.tcSoftwareVersion && data.tcSoftwareVersion?.name) {
        query += saveCustomSoftwareVersion(techId, data.tcSoftwareVersion, data.tcSoftwareProduct);
        query += saveCustomSoftwareRelease(techId, data.tcSoftwareRelease, data.tcSoftwareVersion);
      } else {
        query += updateITStandardRelease(techId, data.tcSoftwareRelease);
      }

      // Update POCs
      query += removeSavedPOCs(techId);
      if(data.itStandPOC && data.itStandPOC.length > 0) {
        data.itStandPOC.forEach(p => {
          query += savePOCs(techId, p);
        });
      }
      
      // Update App Bundles
      query += removeSavedAppBundles(techId);
      if(data.itStandMobileAppBundles && data.itStandMobileAppBundles.length > 0) {
        data.itStandMobileAppBundles.forEach(a => {
          query += saveAppBundles(techId, a);
        });
      }

      // Update OSs
      query += removeSavedOS(techId);
      if(data.itStandOperatingSystems && data.itStandOperatingSystems.length > 0) {
        data.itStandOperatingSystems.forEach(o => {
          query += saveOS(techId, o);
        });
      }

      // Update Categories
      query += removeSavedCategories(techId);
      if(data.itStandCategory && data.itStandCategory.length > 0) {
        data.itStandCategory.forEach(c => {
          query += saveCategories(techId, c);
        });
      }

      // var logStatement = `insert into gear_log.event (Event, User, DTG) values ('update IT Standard: ${query.replace(/'/g, '')}', '${req.headers.requester}', now());`;
      // res = ctrl.sendQuery(query + ' ' + logStatement, 'update IT Standard', res); //removed sendQuery_cowboy reference
      res = ctrl.sendQuery(query, 'update IT Standard', res);
    } else {
      res.status(502).json({
        message: "No authorization token present. Not allowed to update IT-Standards"
      });
    }
  }); //end getApiToken
};

exports.create = (req, res) => {
  // api GEAR Manager authorization
  ctrl.getApiToken (req, res)
  .then((response) => {
    if (response === 1) {
      let data = req.body;
      let query = '';
      
      query = saveData(data);

      // var logStatement = `insert into gear_log.event (Event, User, DTG) values ('create IT Standard: ${query.replace(/'/g, '')}', '${req.headers.requester}', now());`;
      // res = ctrl.sendQuery(query + ' ' + logStatement, 'create IT Standard', res); //removed sendQuery_cowboy reference
      res = ctrl.sendQuery(query, 'create IT Standard', res);
    } else {
      res.status(502).json({
        message: "No authorization token present. Not allowed to create IT Standard"
      });
    };
  }); //end getApiToken
};

exports.createAdvanced = (req, res) => {
  let data = req.body;
  let techId = req.params.id;
  let query = '';

  ctrl.getApiToken (req, res)
  .then((response) => {
    if (response === 1) {
      // Update Technopedia Fields
      query += saveCustomManufacturer(techId, data.tcManufacturer);
      query += saveCustomSoftwareProduct(techId, data.tcSoftwareProduct, data.tcManufacturer);
      if(data.tcSoftwareVersion && data.tcSoftwareVersion?.name) {
        query += saveCustomSoftwareVersion(techId, data.tcSoftwareVersion, data.tcSoftwareProduct);
        query += saveCustomSoftwareRelease(techId, data.tcSoftwareRelease, data.tcSoftwareVersion);
      } else {
        query += updateITStandardRelease(techId, data.tcSoftwareRelease);
      }

      // Update POCs
      query += removeSavedPOCs(techId);
      if(data.itStandPOC && data.itStandPOC.length > 0) {
        data.itStandPOC.forEach(p => {
          query += savePOCs(techId, p);
        });
      }
      
      // Update App Bundles
      query += removeSavedAppBundles(techId);
      if(data.itStandMobileAppBundles && data.itStandMobileAppBundles.length > 0) {
        data.itStandMobileAppBundles.forEach(a => {
          query += saveAppBundles(techId, a);
        });
      }

      // Update OSs
      query += removeSavedOS(techId);
      if(data.itStandOperatingSystems && data.itStandOperatingSystems.length > 0) {
        data.itStandOperatingSystems.forEach(o => {
          query += saveOS(techId, o);
        });
      }

      // Update Categories
      query += removeSavedCategories(techId);
      if(data.itStandCategory && data.itStandCategory.length > 0) {
        data.itStandCategory.forEach(c => {
          query += saveCategories(techId, c);
        });
      }

      var logStatement = `insert into gear_log.event (Event, User, DTG) values ('create IT Standard: ${query.replace(/'/g, '')}', '${req.headers.requester}', now());`;
      res = ctrl.sendQuery(query + ' ' + logStatement, 'create IT Standard', res); //removed sendQuery_cowboy reference
    } else {
      res.status(502).json({
        message: "No authorization token present. Not allowed to create IT Standard"
      });
    };
  }); //end getApiToken
};

exports.find508Compliance = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standard_508_status.sql')).toString();

  res = ctrl.sendQuery(query, '508 Compliance Statuses', res); //removed sendQuery_cowboy reference
};

exports.findCategories = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standard_categories.sql')).toString();

  res = ctrl.sendQuery(query, 'IT Standard Categories', res); //removed sendQuery_cowboy reference
};

exports.findDeployTypes = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standard_deploy_types.sql')).toString();

  res = ctrl.sendQuery(query, 'IT Standard Deployment Types', res); //removed sendQuery_cowboy reference
};

exports.findStatuses = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standard_statuses.sql')).toString();

  res = ctrl.sendQuery(query, 'IT Standard Statuses', res); //removed sendQuery_cowboy reference
};

exports.findTypes = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standard_types.sql')).toString();

  res = ctrl.sendQuery(query, 'IT Standard Types', res); //removed sendQuery_cowboy reference
};

exports.findAttestationStatusTypes = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_attestation-status_types.sql')).toString();

  res = ctrl.sendQuery(query, 'Attestation Status Types', res); //removed sendQuery_cowboy reference
};


getEolFragment = (inputDate) => {
  if (!inputDate || inputDate.toString().toUpperCase() === 'NULL' ) {
    return null;
  }
  
  const parsedDate = new Date(inputDate);
  
  // Format the parsed date to '%Y-%m-%d %T'
  const convertedDate = parsedDate.getFullYear() + '-' +
  ('0' + (parsedDate.getMonth() + 1)).slice(-2) + '-' +
  ('0' + parsedDate.getDate()).slice(-2);
  
  return `STR_TO_DATE('${convertedDate}', '%Y-%m-%d %T')`;
};

exports.getAllOperatingSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, `GET/get_operating_systems.sql`)).toString();

  res = ctrl.sendQuery(query, 'Operating Systems', res);
}

exports.getAppBundles = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, `GET/get_it-standard_app_bundles.sql`)).toString() +
  ` WHERE matchBundle.obj_technology_Id = ${req.params.id});`;

  res = ctrl.sendQuery(query, 'App Bundles', res);
}

// Remove and Save Categories
function removeSavedCategories(techId) {
  return `DELETE FROM zk_technology_standard_category WHERE obj_technology_Id=${techId};`;
}
function saveCategories(techId, categoryId) {
  return `INSERT INTO zk_technology_standard_category (obj_standard_category_Id, obj_technology_Id) VALUES (${categoryId}, ${techId});`;
}

// Remove and Save POCs
function removeSavedPOCs(techId) {
  return `DELETE FROM zk_technology_poc WHERE obj_technology_Id=${techId};`;
}
function savePOCs(techId, pocName) {
  return `INSERT INTO zk_technology_poc (obj_technology_Id, obj_ldap_SamAccountName) VALUES (${techId}, '${pocName}');`;
}

// Remove and Save OS
function removeSavedOS(techId) {
  return `DELETE FROM zk_technology_operating_system WHERE obj_technology_Id=${techId}; `;
}
function saveOS(techId, osId) {
  return `INSERT INTO zk_technology_operating_system (obj_operating_system_Id, obj_technology_Id) VALUES (${osId}, ${techId});`;
}

// Remove and Save App Bundles
function removeSavedAppBundles(techId) {
  let deletionString = '';
  deletionString += `DELETE FROM zk_technology_app_bundle WHERE obj_technology_Id=${techId};`;
  deletionString += `DELETE FROM obj_technology_app_bundle WHERE Id=${techId};`;
  return deletionString;
}
function saveAppBundles(techId, appBundle) {
  let saveString = '';
  saveString += `INSERT INTO obj_technology_app_bundle (Keyname) VALUES ('${appBundle.Name}'); `;
  saveString += `INSERT INTO zk_technology_app_bundle (obj_technology_app_bundle_Id, obj_technology_Id) VALUES (LAST_INSERT_ID(), ${techId}); `;
  return saveString;
}

function saveCustomManufacturer(techId, manufacturer) {
  // let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let queryString = '';

  if(manufacturer.id) {
    queryString = `UPDATE 
                    obj_technology
                  SET
                    manufacturer = '${manufacturer.id}',
                    manufacturerName = '${manufacturer.name}'
                  WHERE
                    Id = ${techId};`;
  } else {
    let guid = Guid.create().toString();
    queryString += `INSERT INTO obj_manufacturer
                      (id, name, createdDate)
                    VALUES ('${guid}', '${manufacturer.name}', NOW());`;
    queryString += `UPDATE 
                      obj_technology
                    SET
                      manufacturer = '${guid}',
                      manufacturerName = '${manufacturer.name}'
                    WHERE
                      Id = ${techId};`;
  }

  return queryString;
}
function saveCustomSoftwareProduct(techId, softwareProduct, manufacturer) {
  // let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let queryString = '';

  if(softwareProduct.id) {
    queryString = `UPDATE 
                    obj_technology
                  SET
                    softwareProduct = '${softwareProduct.id}',
                    softwareProductName = '${softwareProduct.name}'
                  WHERE
                    Id = ${techId};`;
  } else {
    let guid = Guid.create().toString();
    queryString += `INSERT INTO obj_software_product
                      (id, name, createdDate, manufacturer_id)
                    VALUES ('${guid}', '${softwareProduct.name}', NOW(), '${manufacturer.id}');`;
    queryString += `UPDATE 
                      obj_technology
                    SET
                      softwareProduct = '${guid}',
                      softwareProductName = '${softwareProduct.name}'
                    WHERE
                      Id = ${techId};`;
  }

  return queryString;
}
function saveCustomSoftwareVersion(techId, softwareVersion, softwareProduct) {
  // let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let queryString = '';

  if(softwareVersion.id) {
    queryString = `UPDATE 
                    obj_technology
                  SET
                    softwareVersion = '${softwareVersion.id}',
                    softwareVersionName = '${softwareVersion.name}'
                  WHERE
                    Id = ${techId};`;
  } else {
    let guid = Guid.create().toString();
    queryString += `INSERT INTO obj_software_version
                      (id, name, createdDate, software_product_id)
                    VALUES ('${guid}', '${softwareVersion.name}', NOW(), '${softwareProduct.id}');`;
    queryString += `UPDATE 
                      obj_technology
                    SET
                      softwareVersion = '${guid}',
                      softwareVersionName = '${softwareVersion.name}'
                    WHERE
                      Id = ${techId};`;
  }

  return queryString;
}
function saveCustomSoftwareRelease(techId, softwareRelease, softwareVersion) {
  // let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let queryString = '';

  if(softwareRelease && softwareRelease.id) {
    queryString = `UPDATE 
                    obj_technology
                  SET
                    softwareRelease = '${softwareRelease.id}',
                    softwareReleaseName = '${softwareRelease.application}'
                  WHERE
                    Id = ${techId};`;
  } else if(softwareRelease && !softwareRelease.id) {
    let guid = Guid.create().toString();
    queryString += `INSERT INTO obj_software_release
                      (id, name, createdDate, software_version_id)
                    VALUES ('${guid}', '${softwareRelease.application}', NOW(), '${softwareVersion.id}');`;
    queryString += `UPDATE 
                      obj_technology
                    SET
                      softwareRelease = '${guid}',
                      softwareReleaseName = '${softwareRelease.application}'
                    WHERE
                      Id = ${techId};`;
  }

  return queryString;
}

function updateITStandardRelease(techId, softwareRelease) {
  let queryString = '';
  queryString = `UPDATE 
                  obj_technology
                SET
                  softwareReleaseName = '${softwareRelease.application}'
                WHERE
                  Id = ${techId};`;
  return queryString;
}

function generateKeyname(data) {
  let keyname = '';
  if(!data.tcSoftwareRelease ||
    (data.tcSoftwareRelease && data.tcSoftwareRelease.application === '') ||
    (data.tcSoftwareRelease && data.tcSoftwareRelease.application === 'null') || 
    (data.tcSoftwareRelease && data.tcSoftwareRelease.application === 'NULL')
 ) {
    if(!data.itStandAlsoKnownAs) {
      res.status(500).json({
        message: "IT Standards name missing from API payload."
      });
      return;
    } else {
      keyname = data.itStandAlsoKnownAs;
    }
  } else {
    keyname = data.tcSoftwareRelease.application;
  }
  keyname = keyname.replace(/\s+/g, ' ').trim();
  return keyname;
}

function normalizeFormBooleanValues(booleanValue) {
  if(booleanValue && booleanValue === true) {
    return 'T';
  } else {
    return 'F';
  }
}

function updateData(techId, data) {
  const endOfLifeDateFragment = getEolFragment(data.tcEndOfLifeDate);
  const keyname = generateKeyname(data);

  // data.itStandMyView = normalizeFormBooleanValues(data.itStandMyView);
  // data.itStandFedramp = normalizeFormBooleanValues(data.itStandFedramp);
  // data.itStandOpenSource = normalizeFormBooleanValues(data.itStandOpenSource);
  // data.itStandGoldImg = normalizeFormBooleanValues(data.itStandGoldImg);
  // data.itStandReqAtte = normalizeFormBooleanValues(data.itStandReqAtte);

  data.itStandDesc = ctrl.setNullEmptyTextHandler(data.itStandDesc);
  data.itStandAprvExp = ctrl.setNullEmptyTextHandler(data.itStandAprvExp);
  data.itStandRefDocs = ctrl.setNullEmptyTextHandler(data.itStandRefDocs);
  data.itStandApprovedVersions = ctrl.setNullEmptyTextHandler(data.itStandApprovedVersions);
  data.itStandVendorOrg = ctrl.setNullEmptyTextHandler(data.itStandVendorOrg);
  data.itStandAtteLink = ctrl.setNullEmptyTextHandler(data.itStandAtteLink);
  data.itStandGoldComment = ctrl.setNullEmptyTextHandler(data.itStandGoldComment);
  data.itStandRITM = ctrl.setNullEmptyTextHandler(data.itStandRITM);
  data.itStandComments = ctrl.setNullEmptyTextHandler(data.itStandComments);
  data.itStandConditionsRestrictions = ctrl.setNullEmptyTextHandler(data.itStandConditionsRestrictions);
  data.itStandAlsoKnownAs = ctrl.setNullEmptyTextHandler(data.itStandAlsoKnownAs);

  data.tcEndOfLifeDate = ctrl.setNullEmptyTextHandler(data.tcEndOfLifeDate);

  return `UPDATE obj_technology
          SET
            obj_technology_status_Id          = ${data.itStandStatus},
            Keyname                           = '${keyname}',
            approvedVersions                  = ${data.itStandApprovedVersions},
            Description                       = ${data.itStandDesc},
            obj_standard_type_Id              = ${data.itStandType},
            obj_508_compliance_status_Id      = ${data.itStand508},
            Available_through_Myview          = '${data.itStandMyView}',
            Vendor_Standard_Organization      = ${data.itStandVendorOrg},
            obj_deployment_type_Id            = ${data.itStandDeployment},
            Approved_Status_Expiration_Date   = ${data.itStandAprvExp},
            attestation_required              = ${data.itStandReqAtte},
            attestation_link                  = ${data.itStandAtteLink},
            fedramp                           = '${data.itStandFedramp}',
            open_source                       = '${data.itStandOpenSource}',
            Gold_Image                        = '${data.itStandGoldImg}',
            Gold_Image_Comment                = ${data.itStandGoldComment},
            RITM                              = ${data.itStandRITM},
            Comments                          = ${data.itStandComments},
            Reference_documents               = ${data.itStandRefDocs},
            ChangeAudit                       = '${data.auditUser}',
            ChangeDTG                         = NOW(),
            endOfLifeDate                     = ${endOfLifeDateFragment},
            Conditions_Restrictions           = ${data.itStandConditionsRestrictions},
            AlsoKnownAs                       = ${data.itStandAlsoKnownAs}
          WHERE Id = ${techId};`;
}

function saveData(data) {
  const keyname = generateKeyname(data);
  const endOfLifeDateFragment = getEolFragment(data.tcEndOfLifeDate);

  // data.itStandMyView = normalizeFormBooleanValues(data.itStandMyView);
  // data.itStandFedramp = normalizeFormBooleanValues(data.itStandFedramp);
  // data.itStandOpenSource = normalizeFormBooleanValues(data.itStandOpenSource);
  // data.itStandGoldImg = normalizeFormBooleanValues(data.itStandGoldImg);
  // data.itStandReqAtte = normalizeFormBooleanValues(data.itStandReqAtte);

  data.itStandDesc = ctrl.setNullEmptyTextHandler(data.itStandDesc);
  data.itStandAprvExp = ctrl.setNullEmptyTextHandler(data.itStandAprvExp);
  data.itStandRefDocs = ctrl.setNullEmptyTextHandler(data.itStandRefDocs);
  data.itStandApprovedVersions = ctrl.setNullEmptyTextHandler(data.itStandApprovedVersions);
  data.itStandVendorOrg = ctrl.setNullEmptyTextHandler(data.itStandVendorOrg);
  data.itStandAtteLink = ctrl.setNullEmptyTextHandler(data.itStandAtteLink);
  data.itStandGoldComment = ctrl.setNullEmptyTextHandler(data.itStandGoldComment);
  data.itStandRITM = ctrl.setNullEmptyTextHandler(data.itStandRITM);
  data.itStandComments = ctrl.setNullEmptyTextHandler(data.itStandComments);
  data.itStandConditionsRestrictions = ctrl.setNullEmptyTextHandler(data.itStandConditionsRestrictions);
  data.itStandAlsoKnownAs = ctrl.setNullEmptyTextHandler(data.itStandAlsoKnownAs);

  return `INSERT INTO obj_technology(
            obj_technology_status_Id,
            Keyname,
            approvedVersions,
            Description,
            obj_standard_type_Id,
            obj_508_compliance_status_Id,
            Available_through_Myview,
            Vendor_Standard_Organization,
            obj_deployment_type_Id,
            Approved_Status_Expiration_Date,
            attestation_required,
            attestation_link,
            fedramp,
            open_source,
            Gold_Image,
            Gold_Image_Comment,
            RITM,
            Comments,
            Reference_documents,
            endOfLifeDate,
            Conditions_Restrictions,
            AlsoKnownAs,
            CreateAudit,
            CreateDTG,
            ChangeAudit,
            ChangeDTG
          ) VALUES (
           ${data.itStandStatus},
           '${keyname}',
           ${data.itStandApprovedVersions},
           ${data.itStandDesc},
           ${data.itStandType},
           ${data.itStand508},
           '${data.itStandMyView}',
           ${data.itStandVendorOrg},
           ${data.itStandDeployment},
           ${data.itStandAprvExp},
           ${data.itStandReqAtte},
           ${data.itStandAtteLink},
           '${data.itStandFedramp}',
           '${data.itStandOpenSource}',
           '${data.itStandGoldImg}',
           ${data.itStandGoldComment},
           ${data.itStandRITM},
           ${data.itStandComments},
           ${data.itStandRefDocs},
           ${endOfLifeDateFragment},
           ${data.itStandConditionsRestrictions},
           ${data.itStandAlsoKnownAs},
           '${data.auditUser}',
           NOW(),
           '${data.auditUser}',
           NOW()
          );`;
}

exports.getRecent = (req, res) => {
  var numberOfRecords = Number(req.params.records);
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards_recent.sql')).toString() +
    ` GROUP BY tech.Id
      ORDER BY tech.CreateDTG DESC LIMIT ${numberOfRecords};`;

  res = ctrl.sendQuery(query, `latest ${numberOfRecords} IT Standard`, res);
};

exports.getExpiringQuarter = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, `GET/get_it-standards_expiring_quarter.sql`)).toString();

  res = ctrl.sendQuery(query, `Expiring IT standards this quarter`, res);
};

exports.getExpiringWeek = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, `GET/get_it-standards_expiring_week.sql`)).toString();

  res = ctrl.sendQuery(query, `Expiring IT standards this week`, res);
};

exports.getRetiredTotals = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, `GET/get_it-standards_retired_totals.sql`)).toString();

  res = ctrl.sendQuery(query, `Retired IT standard totals`, res);
};

exports.getFilterTotals = (req, res) => {
  var filterQueryBase = 'AND (';
  var filterQuery = '';
  var filterQueryEnd  = ')';
  var filterQueryFull = '';
  if(req.params.filters && req.params.filters.length > 0) {
    var filters = req.params.filters.split(',');

    for(i = 0; i < filters.length; i++) {
      if(i === 0) {
        filterQuery += `obj_deployment_type.Keyname = '${filters[i]}'`;
      } else {
        filterQuery += ` OR obj_deployment_type.Keyname = '${filters[i]}'`;
      }
    }

    filterQueryFull = filterQueryBase + filterQuery + filterQueryEnd;
  }

  var allQuery = '';
  if(!filterQueryFull) {
    allQuery = '*';
  } else {
    allQuery = `CASE WHEN (${filterQuery}) THEN 1 ELSE NULL END`;
  }

  var query = `SELECT COUNT(CASE WHEN obj_technology_status.Keyname = 'Approved' ${filterQueryFull} THEN 1
                  ELSE NULL
                END) AS ApprovedTotal,
                COUNT(CASE WHEN obj_technology_status.Keyname = 'Denied' ${filterQueryFull} THEN 1
                  ELSE NULL
                END) AS DeniedTotal,
                COUNT(CASE WHEN obj_technology_status.Keyname = 'Retired' ${filterQueryFull} THEN 1
                  ELSE NULL
                END) AS RetiredTotal,
                COUNT(${allQuery}) AS AllTotal
              FROM obj_technology AS tech
              LEFT JOIN obj_technology_status   ON tech.obj_technology_status_Id = obj_technology_status.Id
              LEFT JOIN obj_standard_type       ON tech.obj_standard_type_Id = obj_standard_type.Id
              LEFT JOIN obj_deployment_type     ON tech.obj_deployment_type_Id = obj_deployment_type.Id
              WHERE obj_standard_type.Keyname LIKE 'Software'
              AND obj_technology_status.Keyname NOT LIKE 'Not yet submitted'`;

  res = ctrl.sendQuery(query, `IT Standards filter totals`, res);
};