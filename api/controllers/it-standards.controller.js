import { readFileSync } from 'fs';
import { join } from 'path';

import { sendQuery, getApiToken, emptyTextFieldHandler, setEmptyTextFieldHandler } from './base.controller';
import { __dirname } from '../util/path-util';

const queryPath = '../queries/';

export function findAll(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE obj_standard_type.Keyname LIKE 'Software'
      AND obj_technology_status.Keyname NOT LIKE 'Not yet submitted'
      GROUP BY tech.Id
      ORDER BY IFNULL(tech.softwareReleaseName, tech.Keyname);`;

  res = sendQuery(query, 'IT Standards', res); //removed sendQuery_cowboy reference
}

export function findAllNoFilter(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE obj_standard_type.Keyname LIKE 'Software'
      GROUP BY tech.Id
      ORDER BY IFNULL(tech.softwareReleaseName, tech.Keyname);`;

  res = sendQuery(query, 'IT Standards', res); //removed sendQuery_cowboy reference
}

export function findOne(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE tech.Id = ${req.params.id};`;

  res = sendQuery(query, 'individual IT Standard', res); //removed sendQuery_cowboy reference
}

export function findLatest(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` GROUP BY tech.Id
      ORDER BY tech.CreateDTG DESC LIMIT 1;`;

  res = sendQuery(query, 'latest individual IT Standard', res); //removed sendQuery_cowboy reference
}

export function findSystems(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` LEFT JOIN zk_systems_subsystems_technology_xml AS mappings ON systems.\`ex:GEAR_ID\` = mappings.\`ex:obj_systems_subsystems_Id\`
      LEFT JOIN obj_technology AS tech                                ON mappings.\`ex:obj_technology_Id\` = tech.Id

      WHERE tech.Id = ${req.params.id} GROUP BY systems.\`ex:GEAR_ID\`;`; //removed LEFT JOIN cowboy_ods.obj_technology reference

  res = sendQuery(query, 'systems using IT Standard', res);
}

export function update(req, res) {
  //console.log('it-standard update starting...');

  getApiToken (req, res)
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

      // Null any empty text fields
      data.itStandDesc = emptyTextFieldHandler(data.itStandDesc);
      data.itStandAprvExp = emptyTextFieldHandler(data.itStandAprvExp);
      data.itStandRefDocs = emptyTextFieldHandler(data.itStandRefDocs);
      data.itStandApprovedVersions = emptyTextFieldHandler(data.itStandApprovedVersions);

      data.tcManufacturer = emptyTextFieldHandler(data.tcManufacturer);
      data.tcSoftwareProduct = emptyTextFieldHandler(data.tcSoftwareProduct);
      data.tcSoftwareVersion = emptyTextFieldHandler(data.tcSoftwareVersion);
      data.tcSoftwareRelease = emptyTextFieldHandler(data.tcSoftwareRelease);
      data.tcManufacturerName = emptyTextFieldHandler(data.tcManufacturerName);
      data.tcSoftwareProductName = emptyTextFieldHandler(data.tcSoftwareProductName);
      data.tcSoftwareVersionName = emptyTextFieldHandler(data.tcSoftwareVersionName);
      data.tcSoftwareReleaseName = emptyTextFieldHandler(data.tcSoftwareReleaseName);
      data.tcEndOfLifeDate = emptyTextFieldHandler(data.tcEndOfLifeDate);

      data.itStandRITM = setEmptyTextFieldHandler(data.itStandRITM);

      const endOfLifeDateFragment = getEolFragment(data.tcEndOfLifeDate);

      var query = `SET FOREIGN_KEY_CHECKS=0;
        UPDATE obj_technology
        SET  ${(!data.tcSoftwareReleaseName || data.tcSoftwareReleaseName === 'NULL') ?
        "Keyname = '" + data.itStandName + "', " : ""}
          obj_technology_status_Id        = ${data.itStandStatus},
          Description                     = ${data.itStandDesc},
          obj_standard_type_Id            = ${data.itStandType},
          obj_508_compliance_status_Id    = ${data.itStand508},
          Available_through_Myview        = '${data.itStandMyView}',
          Vendor_Standard_Organization    = '${data.itStandVendorOrg}',
          obj_deployment_type_Id          = ${data.itStandDeployment},
          Gold_Image                      = '${data.itStandGoldImg}',
          attestation_required            = '${data.itStandReqAtte}',
          fedramp                         = '${data.itStandFedramp}',
          open_source                     = '${data.itStandOpenSource}',
          RITM                            = '${data.itStandRITM}',
          Gold_Image_Comment              = '${data.itStandGoldComment}',
          attestation_link                = '${data.itStandAtteLink}',
          Approved_Status_Expiration_Date = ${data.itStandAprvExp},
          Comments                        = '${data.itStandComments}',
          Reference_documents             = ${data.itStandRefDocs},
          ChangeAudit                     = '${data.auditUser}',
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
        ${pocString}`;

      var logStatement = `insert into gear_log.event (Event, User, DTG) values ('update IT Standard: ${query.replace(/'/g, '')}', '${req.headers.requester}', now());`;
      res = sendQuery(query + ' ' + logStatement, 'update IT Standard', res); //removed sendQuery_cowboy reference
    } else {
      //console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

      //console.log('it-standard update no valid token!!!!');
      res.status(502).json({
        message: "No authorization token present. Not allowed to update IT-Standards"
      });
    }
  }); //end getApiToken
}

export function create(req, res) {
  // api GEAR Manager authorization
  getApiToken (req, res)
  .then((response) => {
    //console.log('*** API Security Testing - getApiToken response: ', response); //DEBUGGING

    if (response === 1) {
      //console.log('*** API Security Testing - API Auth Validation: PASSED'); //DEBUGGING
      //if (req.headers.authorization) {
      var data = req.body;
      // Null any empty text fields
      data.itStandDesc = emptyTextFieldHandler(data.itStandDesc);
      data.itStandAprvExp = emptyTextFieldHandler(data.itStandAprvExp);
      data.itStandRefDocs = emptyTextFieldHandler(data.itStandRefDocs);
      data.itStandApprovedVersions = emptyTextFieldHandler(data.itStandApprovedVersions);

      data.tcManufacturer = emptyTextFieldHandler(data.tcManufacturer);
      data.tcSoftwareProduct = emptyTextFieldHandler(data.tcSoftwareProduct);
      data.tcSoftwareVersion = emptyTextFieldHandler(data.tcSoftwareVersion);
      data.tcSoftwareRelease = emptyTextFieldHandler(data.tcSoftwareRelease);
      data.tcManufacturerName = emptyTextFieldHandler(data.tcManufacturerName);
      data.tcSoftwareProductName = emptyTextFieldHandler(data.tcSoftwareProductName);
      data.tcSoftwareVersionName = emptyTextFieldHandler(data.tcSoftwareVersionName);
      data.tcSoftwareReleaseName = emptyTextFieldHandler(data.tcSoftwareReleaseName);
      data.tcEndOfLifeDate = emptyTextFieldHandler(data.tcEndOfLifeDate);

      data.itStandRITM = setEmptyTextFieldHandler(data.itStandRITM);

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
        ${(!data.tcSoftwareReleaseName || data.tcSoftwareReleaseName === 'NULL') ?
          "'" + data.itStandName + "'" : null},
        ${data.itStandDesc},
        ${data.itStandAprvExp},
        '${data.itStandVendorOrg}',
        '${data.itStandMyView}',
        '${data.itStandGoldImg}',
        '${data.itStandReqAtte}',
        '${data.itStandFedramp}',
        '${data.itStandOpenSource}',
        '${data.itStandRITM}',
        '${data.itStandGoldComment}',
        '${data.itStandAtteLink}',
        '${data.itStandComments}',
        ${data.itStandStatus},
        ${data.itStandDeployment},
        ${data.itStandType},
        ${data.itStand508},
        ${data.itStandRefDocs},
        '${data.auditUser}',
        '${data.auditUser}',
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
      res = sendQuery(query + ' ' + logStatement, 'create IT Standard', res); //removed sendQuery_cowboy reference
    } else {
      //console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

      res.status(502).json({
        message: "No authorization token present. Not allowed to create IT Standard"
      });
    };
  }); //end getApiToken
}

export function find508Compliance(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_it-standard_508_status.sql')).toString();

  res = sendQuery(query, '508 Compliance Statuses', res); //removed sendQuery_cowboy reference
}

export function findCategories(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_it-standard_categories.sql')).toString();

  res = sendQuery(query, 'IT Standard Categories', res); //removed sendQuery_cowboy reference
}

export function findDeployTypes(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_it-standard_deploy_types.sql')).toString();

  res = sendQuery(query, 'IT Standard Deployment Types', res); //removed sendQuery_cowboy reference
}

export function findStatuses(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_it-standard_statuses.sql')).toString();

  res = sendQuery(query, 'IT Standard Statuses', res); //removed sendQuery_cowboy reference
}

export function findTypes(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_it-standard_types.sql')).toString();

  res = sendQuery(query, 'IT Standard Types', res); //removed sendQuery_cowboy reference
}

export function findAttestationStatusTypes(req, res) {
  var query = readFileSync(join(__dirname, queryPath, 'GET/get_attestation-status_types.sql')).toString();

  res = sendQuery(query, 'Attestation Status Types', res); //removed sendQuery_cowboy reference
}


const getEolFragment = (inputDate) => {
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