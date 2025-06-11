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

exports.findSystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` LEFT JOIN zk_systems_subsystems_technology_xml AS mappings ON systems.\`ex:GEAR_ID\` = mappings.\`ex:obj_systems_subsystems_Id\`
      LEFT JOIN obj_technology AS tech                                ON mappings.\`ex:obj_technology_Id\` = tech.Id

      WHERE tech.Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`; //removed LEFT JOIN cowboy_ods.obj_technology reference

  res = ctrl.sendQuery(query, 'systems using IT Standard', res);
};

exports.update = (req, res) => {
  //console.log('it-standard update starting...');

  ctrl.getApiToken (req, res)
  .then((response) => {
    //console.log('*** API Security Testing - getApiToken response: ', response); //DEBUGGING

    if (response === 1) {
      //console.log('*** API Security Testing - API Auth Validation: PASSED'); //DEBUGGING

      //if (req.headers.authorization)
      //console.log('it-standard update authorized...');
      var data = req.body;  
      // Create string to update IT Standards Categories
      var catString = '';
      if (data.itStandCategory) {
        // Delete any references first
        catString += `DELETE FROM zk_technology_standard_category WHERE obj_technology_Id=${req.params.id}; `;

        // Insert new IDs
        data.itStandCategory.forEach(catID => {
          catString += `INSERT INTO zk_technology_standard_category (obj_standard_category_Id, obj_technology_Id) VALUES (${catID}, ${req.params.id}); `;
        });
      };

      // Create string to update IT Standards POCs
      var pocString = '';
      if (data.itStandPOC) {
        // Delete any references first
        pocString += `DELETE FROM zk_technology_poc WHERE obj_technology_Id=${req.params.id}; `;

        // Insert new IDs
        data.itStandPOC.forEach(pocSamName => {
          pocString += `INSERT INTO zk_technology_poc (obj_technology_Id, obj_ldap_SamAccountName) VALUES (${req.params.id}, '${pocSamName}'); `;
        });
      };

      // Create string to update IT Standards Operating Systems
      var osString = '';
      var osToDelete = [];
      var osToAdd = [];
      if(data.itStandOperatingSystems && data.itStandOperatingSystems.length > 0) {
        for(const osId of data.itStandOperatingSystems) {
          if(!data.initialOS || (data.initialOS && data.initialOS.length === 0)) {
            osToAdd.push(osId);
          } else {
            if(!data.initialOS.includes(osId)) {
              osToAdd.push(osId);
            }
          }
        }
      }
      if(data.initialOS && data.initialOS.length > 0) {
        for(const osId of data.initialOS) {
          if(!data.itStandOperatingSystems || (data.itStandOperatingSystems && data.itStandOperatingSystems.length === 0)) {
            osToDelete.push(osId);
          } else {
            if(!data.itStandOperatingSystems.includes(osId)) {
              osToDelete.push(osId);
            }
          }
        }
      }

      if(osToDelete.length > 0) {
        osToDelete.forEach(o => {
          osString += `DELETE FROM zk_technology_operating_system WHERE obj_technology_Id=${req.params.id} AND obj_operating_system_Id=${o}; `;
        });
      }

      if(osToAdd.length > 0) {
        osToAdd.forEach(o => {
          osString += `INSERT INTO zk_technology_operating_system (obj_operating_system_Id, obj_technology_Id) VALUES (${o}, ${req.params.id}); `;
        });
      }

      // Create string to update IT Standards App Bundles
      var appBundleString = '';
      var appBundleToDelete = [];
      var appBundleToAdd = [];
      if(data.itStandMobileAppBundles && data.itStandMobileAppBundles.length > 0) {
        for(const appId of data.itStandMobileAppBundles) {
          if(!data.initialAppBundles || (data.initialAppBundles && data.initialAppBundles.length === 0)) {
            appBundleToAdd.push(appId);
          } else { 
            if(!data.initialAppBundles.find(({Name}) => Name === appId.Name)) {
              appBundleToAdd.push(appId);
            }
          }
        }
      }
      if(data.initialAppBundles.length > 0) {
        for(const appId of data.initialAppBundles) {
          if(!data.itStandMobileAppBundles || (data.itStandMobileAppBundles && data.itStandMobileAppBundles.length === 0)) {
            appBundleToDelete.push(appId);
          } else {
            if(!data.itStandMobileAppBundles.find(({Name}) => Name === appId.Name)) {
              appBundleToDelete.push(appId);
            }
          }
        }
      }

      // Delete from app bundle table and match table
      if(appBundleToDelete.length > 0) {
        appBundleToDelete.forEach(a => {
          appBundleString += `DELETE FROM zk_technology_app_bundle WHERE obj_technology_Id=${req.params.id} AND obj_technology_app_bundle_Id=${a.ID}; `;
          appBundleString += `DELETE FROM obj_technology_app_bundle WHERE Id=${a.ID}; `;
        });
      }

      // Add to app bundle table and the match table
      if(appBundleToAdd.length > 0) {
        appBundleToAdd.forEach(a => {
          appBundleString += `INSERT INTO obj_technology_app_bundle (Keyname) VALUES ('${a.Name}'); `;
          appBundleString += `INSERT INTO zk_technology_app_bundle (obj_technology_app_bundle_Id, obj_technology_Id) VALUES (LAST_INSERT_ID(), ${req.params.id}); `;
        });
      }

      // Null any empty text fields
      data.itStandDesc = ctrl.setNullEmptyTextHandler(data.itStandDesc);
      data.itStandAprvExp = ctrl.setNullEmptyTextHandler(data.itStandAprvExp);
      data.itStandRefDocs = ctrl.setNullEmptyTextHandler(data.itStandRefDocs);
      data.itStandApprovedVersions = ctrl.setNullEmptyTextHandler(data.itStandApprovedVersions);

      data.tcManufacturer = ctrl.setNullEmptyTextHandler(data.tcManufacturer);
      data.tcSoftwareProduct = ctrl.setNullEmptyTextHandler(data.tcSoftwareProduct);
      data.tcSoftwareVersion = ctrl.setNullEmptyTextHandler(data.tcSoftwareVersion);
      data.tcSoftwareRelease = ctrl.setNullEmptyTextHandler(data.tcSoftwareRelease);
      data.tcManufacturerName = ctrl.setNullEmptyTextHandler(data.tcManufacturerName);
      data.tcSoftwareProductName = ctrl.setNullEmptyTextHandler(data.tcSoftwareProductName);
      data.tcSoftwareVersionName = ctrl.setNullEmptyTextHandler(data.tcSoftwareVersionName);
      data.tcSoftwareReleaseName = ctrl.setNullEmptyTextHandler(data.tcSoftwareReleaseName);
      data.tcEndOfLifeDate = ctrl.setNullEmptyTextHandler(data.tcEndOfLifeDate);

      data.itStandRITM = ctrl.setNullEmptyTextHandler(data.itStandRITM);

      let keyname = '';
      if (!data.tcSoftwareReleaseName || data.tcSoftwareReleaseName === 'NULL' || data.tcSoftwareReleaseName === 'null') {
        if(!data.itStandName) {
          res.status(500).json({
            message: "IT Standards name missing from API payload."
          });
          return;
        } else {
          keyname = `"${data.itStandName}"`;
        }
      } else {
        keyname = data.tcSoftwareReleaseName;
      }

      const endOfLifeDateFragment = getEolFragment(data.tcEndOfLifeDate);

      var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
      var customManuQuery = '';
      if(data.manufacturerToAdd) {
        customManuQuery = `INSERT INTO obj_manufacturer
        (id, name, createdDate)
        VALUES ('${Guid.create().toString()}', '${data.manufacturerToAdd}', '${date}');`;
      }
      var customProductQuery = '';
      if(data.productToAdd) {
        customProductQuery = `INSERT INTO obj_software_product
        (id, name, createdDate)
        VALUES ('${Guid.create().toString()}', '${data.productToAdd}', '${date}');`;
      }
      var customVersionQuery = '';
      if(data.versionToAdd) {
        customVersionQuery = `INSERT INTO obj_software_version
        (id, name, createdDate)
        VALUES ('${Guid.create().toString()}', '${data.versionToAdd}', '${date}');`;
      }


      var query = `SET FOREIGN_KEY_CHECKS=0;
        UPDATE obj_technology
        SET
          Keyname                         = ${keyname},
          obj_technology_status_Id        = ${data.itStandStatus},
          Description                     = ${data.itStandDesc},
          obj_standard_type_Id            = ${data.itStandType},
          obj_508_compliance_status_Id    = ${data.itStand508},
          Available_through_Myview        = "${data.itStandMyView}",
          Vendor_Standard_Organization    = "${data.itStandVendorOrg}",
          obj_deployment_type_Id          = ${data.itStandDeployment},
          Gold_Image                      = "${data.itStandGoldImg}",
          attestation_required            = ${data.itStandReqAtte},
          fedramp                         = "${data.itStandFedramp}",
          open_source                     = "${data.itStandOpenSource}",
          RITM                            = ${data.itStandRITM},
          Gold_Image_Comment              = "${data.itStandGoldComment}",
          attestation_link                = "${data.itStandAtteLink}",
          Approved_Status_Expiration_Date = ${data.itStandAprvExp},
          Comments                        = "${data.itStandComments}",
          Reference_documents             = ${data.itStandRefDocs},
          ChangeAudit                     = "${data.auditUser}",
          ChangeDTG                       = NOW(),
          manufacturer                    = ${data.tcManufacturer},
          softwareProduct                 = ${data.tcSoftwareProduct},
          softwareVersion                 = ${data.tcSoftwareVersion},
          softwareRelease                 = ${data.tcSoftwareRelease},
          manufacturerName                = ${data.tcManufacturerName},
          softwareProductName             = ${data.tcSoftwareProductName},
          softwareVersionName             = ${data.tcSoftwareVersionName},
          softwareReleaseName             = ${data.tcSoftwareReleaseName},
          endOfLifeDate                   = ${endOfLifeDateFragment},
          approvedVersions                = ${data.itStandApprovedVersions}
        WHERE Id = ${req.params.id};
        SET FOREIGN_KEY_CHECKS=1;
        ${catString}
        ${pocString}
        ${osString}
        ${appBundleString}
        ${customManuQuery}
        ${customProductQuery}
        ${customVersionQuery}`;

      var logStatement = `insert into gear_log.event (Event, User, DTG) values ('update IT Standard: ${query.replace(/'/g, '')}', '${req.headers.requester}', now());`;
      res = ctrl.sendQuery(query + ' ' + logStatement, 'update IT Standard', res); //removed sendQuery_cowboy reference
    } else {
      //console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

      //console.log('it-standard update no valid token!!!!');
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
    //console.log('*** API Security Testing - getApiToken response: ', response); //DEBUGGING

    if (response === 1) {
      //console.log('*** API Security Testing - API Auth Validation: PASSED'); //DEBUGGING
      //if (req.headers.authorization) {
      var data = req.body;
      // Null any empty text fields
      data.itStandDesc = ctrl.setNullEmptyTextHandler(data.itStandDesc);
      data.itStandAprvExp = ctrl.setNullEmptyTextHandler(data.itStandAprvExp);
      data.itStandRefDocs = ctrl.setNullEmptyTextHandler(data.itStandRefDocs);
      data.itStandApprovedVersions = ctrl.setNullEmptyTextHandler(data.itStandApprovedVersions);

      data.tcManufacturer = ctrl.setNullEmptyTextHandler(data.tcManufacturer);
      data.tcSoftwareProduct = ctrl.setNullEmptyTextHandler(data.tcSoftwareProduct);
      data.tcSoftwareVersion = ctrl.setNullEmptyTextHandler(data.tcSoftwareVersion);
      data.tcSoftwareRelease = ctrl.setNullEmptyTextHandler(data.tcSoftwareRelease);
      data.tcManufacturerName = ctrl.setNullEmptyTextHandler(data.tcManufacturerName);
      data.tcSoftwareProductName = ctrl.setNullEmptyTextHandler(data.tcSoftwareProductName);
      data.tcSoftwareVersionName = ctrl.setNullEmptyTextHandler(data.tcSoftwareVersionName);
      data.tcSoftwareReleaseName = ctrl.setNullEmptyTextHandler(data.tcSoftwareReleaseName);
      data.tcEndOfLifeDate = ctrl.setNullEmptyTextHandler(data.tcEndOfLifeDate);

      data.itStandRITM = ctrl.setNullEmptyTextHandler(data.itStandRITM);

      let keyname = '';
      if (!data.tcSoftwareReleaseName || data.tcSoftwareReleaseName === 'NULL' || data.tcSoftwareReleaseName === 'null') {
        if(!data.itStandName) {
          res.status(500).json({
            message: "IT Standards name missing from API payload."
          });
          return;
        } else {
          keyname = `"${data.itStandName}"`;
        }
      } else {
        keyname = data.tcSoftwareReleaseName;
      }

      const endOfLifeDateFragment = getEolFragment(data.tcEndOfLifeDate);

      var query = `INSERT INTO obj_technology(
        Keyname,
        Description,
        Approved_Status_Expiration_Date,
        Vendor_Standard_Organization,
        Available_through_Myview,
        Gold_Image,
        attestation_required,
        fedramp,
        open_source,
        RITM,
        Gold_Image_Comment,
        attestation_link,
        Comments,
        obj_technology_status_Id,
        obj_deployment_type_Id,
        obj_standard_type_Id,
        obj_508_compliance_status_Id,
        Reference_documents,
        CreateAudit,
        ChangeAudit,
        manufacturer,
        softwareProduct,
        softwareVersion,
        softwareRelease,
        manufacturerName,
        softwareProductName,
        softwareVersionName,
        softwareReleaseName,
        endOfLifeDate,
        approvedVersions) VALUES (
        ${keyname},
        ${data.itStandDesc},
        ${data.itStandAprvExp},
        "${data.itStandVendorOrg}",
        "${data.itStandMyView}",
        "${data.itStandGoldImg}",
        ${data.itStandReqAtte},
        "${data.itStandFedramp}",
        "${data.itStandOpenSource}",
        ${data.itStandRITM},
        "${data.itStandGoldComment}",
        "${data.itStandAtteLink}",
        "${data.itStandComments}",
        ${data.itStandStatus},
        ${data.itStandDeployment},
        ${data.itStandType},
        ${data.itStand508},
        ${data.itStandRefDocs},
        "${data.auditUser}",
        "${data.auditUser}",
        ${data.tcManufacturer},
        ${data.tcSoftwareProduct},
        ${data.tcSoftwareVersion},
        ${data.tcSoftwareRelease},
        ${data.tcManufacturerName},
        ${data.tcSoftwareProductName},
        ${data.tcSoftwareVersionName},
        ${data.tcSoftwareReleaseName},
        ${endOfLifeDateFragment},
        ${data.itStandApprovedVersions});`;

      var logStatement = `insert into gear_log.event (Event, User, DTG) values ('create IT Standard: ${query.replace(/'/g, '')}', '${req.headers.requester}', now());`;
      res = ctrl.sendQuery(query + ' ' + logStatement, 'create IT Standard', res); //removed sendQuery_cowboy reference
    } else {
      //console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

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

exports.updateITStandardWithCustomTechFields = (req, res) => {
  var itStandId = req.params.id;
  var data = req.body;

  console.log('DATA TEST HERE', data);

  let manuQuery = '';
  if(data.manufactuerToAdd) {
    manuQuery = `
      UPDATE 
        obj_technology AS tech,
        (SELECT id, name FROM obj_manufacturer ORDER BY createdDate DESC LIMIT 1) AS manufac
      SET
        tech.manufacturer = manufac.id,
        tech.manufacturerName = manufac.name
      WHERE
        tech.Id = ${itStandId};
    `;
  }

  let prodQuery = '';
  let prodQuerySelf = '';
  if(data.productToAdd) {
    prodQuery = `
      UPDATE 
        obj_technology AS tech,
        (SELECT id, name FROM obj_software_product ORDER BY createdDate DESC LIMIT 1) AS product
      SET
        tech.softwareProduct = product.id,
        tech.softwareProductName = product.name
      WHERE
        tech.Id = ${itStandId};
    `;
    if(data.manufactuerToAdd) {
      prodQuerySelf = `
      UPDATE
        obj_software_product AS product,
        (SELECT id FROM obj_manufacturer ORDER BY createdDate DESC LIMIT 1) AS manufac,
        (SELECT id FROM obj_software_product ORDER BY createdDate DESC LIMIT 1) AS prod
      SET
        product.manufacturer_id = manufac.id
      WHERE
        product.id = prod.id;
    `;
    } else {
      prodQuerySelf = `
      UPDATE
        obj_software_product AS product,
        (SELECT id FROM obj_software_product ORDER BY createdDate DESC LIMIT 1) AS prod
      SET
        product.manufacturer_id = '${data.manufacturerId}'
      WHERE
        product.id = prod.id;
    `;
    }

  }

  let versQuery = '';
  let versQuerySelf = '';
  if(data.versionToAdd) {
    versQuery = `
      UPDATE 
        obj_technology AS tech,
        (SELECT id, name FROM obj_software_version ORDER BY createdDate DESC LIMIT 1) AS version
      SET
        tech.softwareVersion = version.id,
        tech.softwareVersionName = version.name
      WHERE
        tech.Id = ${itStandId};
    `;
    if(data.productToAdd) {
      versQuerySelf = `
      UPDATE
        obj_software_version AS version,
        (SELECT id FROM obj_software_product ORDER BY createdDate DESC LIMIT 1) AS product,
        (SELECT id FROM obj_software_version ORDER BY createdDate DESC LIMIT 1) AS vers
      SET
        version.software_product_id = product.id
      WHERE
        version.id = vers.id;
    `;
    } else {
      versQuerySelf = `
      UPDATE
        obj_software_version AS version,
        (SELECT id FROM obj_software_version ORDER BY createdDate DESC LIMIT 1) AS vers
      SET
        version.software_product_id = '${data.softwareProductId}'
      WHERE
        version.id = vers.id;
    `;
    }

  }

  var query = `
    SET FOREIGN_KEY_CHECKS=0;
    ${manuQuery}
    ${prodQuery}
    ${prodQuerySelf}
    ${versQuery}
    ${versQuerySelf}
    SET FOREIGN_KEY_CHECKS=1;
  `;

  console.log(query);
  var logStatement = `insert into gear_log.event (Event, User, DTG) values ('Update technologies: ${query.replace(/'/g, '')}', '${req.headers.requester}', now());`;
     
  res = ctrl.sendQuery(query + ' ' + logStatement, 'Update Tech Fields', res);
};