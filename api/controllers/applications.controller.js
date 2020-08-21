const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
    " WHERE org.Keyname <> 'External' GROUP BY app.Id ORDER BY app.Keyname;";

  res = ctrl.sendQuery(query, 'business applications', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
    ` WHERE app.Id = ${req.params.id};`;
  var params = [req.params.id];

  res = ctrl.sendQuery(query, 'individual business application', res);
};

exports.findLatest = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
    ` GROUP BY app.Id ORDER BY app.CreateDTG DESC LIMIT 1;`;

  res = ctrl.sendQuery(query, 'latest individual business application', res);
};

exports.findAllRetired = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_full_suite.sql')).toString() +
    " WHERE app.Application_or_Website LIKE 'Application' AND app.Retired_Year IS NOT NULL GROUP BY app.Id;";

  res = ctrl.sendQuery(query, 'retired business applications', res);
};

exports.findCapabilities = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` LEFT JOIN zk_app_capabilities           ON cap.Id = zk_app_capabilities.obj_capability_Id
    LEFT JOIN obj_application       AS app    ON zk_app_capabilities.obj_application_Id = app.Id
    WHERE app.Id = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'related capabilities for application', res);
};

exports.findTechnologies = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` WHERE obj_standard_type.Keyname LIKE '%Software%'
      AND obj_technology_status.Keyname NOT LIKE 'Sunsetting'
      AND obj_technology_status.Keyname NOT LIKE 'Not yet submitted'
      AND app.Id = ${req.params.id}

    GROUP BY tech.Id;`;

  res = ctrl.sendQuery(query, 'related technologies for application', res);
};

exports.update = (req, res) => {
  if (req.headers.authorization) {
    var data = req.body;

    // Create string to update Business POCs
    var pocString = '';
    if (data.appBizPOC) {
      // Delete any references first
      pocString += `DELETE FROM zk_application_business_poc WHERE obj_application_Id=${req.params.id}; `;

      // Insert new IDs
      data.appBizPOC.forEach(pocID => {
        pocString += `INSERT INTO zk_application_business_poc (obj_application_Id, obj_bus_poc_Id) VALUES (${req.params.id}, ${pocID}); `;
      });
    };

    // Create string to update Technical POCs
    if (data.appTechPOC) {
      // Delete any references first
      pocString += `DELETE FROM zk_application_technical_poc WHERE obj_application_Id=${req.params.id}; `;

      // Insert new IDs
      data.appBizPOC.forEach(pocID => {
        pocString += `INSERT INTO zk_application_technical_poc (obj_application_Id, obj_tech_poc_Id) VALUES (${req.params.id}, ${pocID}); `;
      });
    };

    // Create string to update technology-apps relationship
    var techString = '';
    if (data.relatedTech) {
      // Delete any references first
      techString += `DELETE FROM zk_application_technology WHERE obj_application_Id=${req.params.id}; `;

      // Insert new IDs
      data.relatedTech.forEach(techID => {
        techString += `INSERT INTO zk_application_technology (obj_application_Id, obj_technology_Id) VALUES (${req.params.id}, ${techID}); `;
      });
    };

    // Create string to update TIME
    var timeString = '';
    for (const [key, value] of Object.entries(data)) {
      // Pull TIME fields and make sure they're not null
      if (key.includes('TIMEFY') && data[key]) {
        var year = key.split('TIME')[1]

        // Insert new IDs or update if already exists
        timeString += `INSERT INTO obj_application_rationalization(
          obj_application_Id,
          FY,
          TIME_Val,
          CreateAudit,
          ChangeAudit,
          Keyname) VALUES (
            ${req.params.id},
            '${year}',
            '${value}',
            '${data.auditUser}',
            '${data.auditUser}',
            '${data.appName}')
          ON DUPLICATE KEY UPDATE
            TIME_Val = '${value}',
            ChangeAudit = '${data.auditUser}'; `;
      };
    };

    // Null any empty text fields
    data.appDesc = ctrl.emptyTextFieldHandler(data.appDesc);
    data.appNotes = ctrl.emptyTextFieldHandler(data.appNotes);
    data.appRefDoc = ctrl.emptyTextFieldHandler(data.appRefDoc);
    data.appCUI = ctrl.emptyTextFieldHandler(data.appCUI);
    data.appProdYr = ctrl.emptyTextFieldHandler(data.appProdYr);
    data.appRetiredYr = ctrl.emptyTextFieldHandler(data.appRetiredYr);
    data.TIMENotes = ctrl.emptyTextFieldHandler(data.TIMENotes);

    var query = `SET FOREIGN_KEY_CHECKS=0;
      UPDATE obj_application
      SET obj_application_status_Id     = ${data.appStatus},
        Keyname                         = '${data.appName}',
        Description                     = ${data.appDesc},
        Display_Name                    = '${data.appDisplayName}',
        Application_Notes               = ${data.appNotes},
        Reference_Document              = ${data.appRefDoc},

        Unique_Identifier_Code          = '${data.appUID}',
        CUI_Indicator                   = ${data.appCUI},
        Production_Year                 = ${data.appProdYr},
        Retired_Year                    = ${data.appRetiredYr},
        obj_org_SSO_Id                  = ${data.appSSO},
        App_Owning_Org                  = ${data.appOwner},

        Cloud_Indicator                 = ${data.appCloud},
        Mobile_App_Indicator            = ${data.appMobile},
        obj_app_hostingprovider_Id      = ${data.appHost},
        obj_fisma_Id                    = ${data.appFISMA},
        obj_parent_system_Id            = ${data.appParent},

        TIME_Notes                      = ${data.TIMENotes},

        ChangeAudit                     = '${data.auditUser}',
        ChangeDTG                       = NOW()
      WHERE Id = ${req.params.id};
      SET FOREIGN_KEY_CHECKS=1;
      ${pocString}
      ${techString}
      ${timeString}`

    res = ctrl.sendQuery(query, 'update business application', res);
  } else {
    res.status(502).json({
      message: "No authorization token present. Not allowed to update business application"
    });
  }
};

exports.create = (req, res) => {
  if (req.headers.authorization) {
    var data = req.body;

    // Null any empty text fields
    data.appDesc = ctrl.emptyTextFieldHandler(data.appDesc);
    data.appNotes = ctrl.emptyTextFieldHandler(data.appNotes);
    data.appRefDoc = ctrl.emptyTextFieldHandler(data.appRefDoc);
    data.appCUI = ctrl.emptyTextFieldHandler(data.appCUI);
    data.appProdYr = ctrl.emptyTextFieldHandler(data.appProdYr);
    data.appRetiredYr = ctrl.emptyTextFieldHandler(data.appRetiredYr);
    data.TIMENotes = ctrl.emptyTextFieldHandler(data.TIMENotes);

    var query = `INSERT INTO obj_application(
      obj_application_status_Id,
      Keyname,
      Description,
      Display_Name,
      Application_Notes,
      Reference_Document,

      Unique_Identifier_Code,
      CUI_Indicator,
      Production_Year,
      Retired_Year,
      obj_org_SSO_Id,
      App_Owning_Org,

      Cloud_Indicator,
      Mobile_App_Indicator,
      obj_app_hostingprovider_Id,
      obj_fisma_Id,
      obj_parent_system_Id,

      TIME_Notes,

      CreateAudit,
      ChangeAudit) VALUES (
        ${data.appStatus},
        '${data.appName}',
        ${data.appDesc},
        '${data.appDisplayName}',
        ${data.appNotes},
        ${data.appRefDoc},

        '${data.appUID}',
        ${data.appCUI},
        ${data.appProdYr},
        ${data.appRetiredYr},
        ${data.appSSO},
        ${data.appOwner},

        '${data.appCloud}',
        '${data.appMobile}',
        ${data.appHost},
        ${data.appFISMA},
        ${data.appParent},

        ${data.TIMENotes},

        '${data.auditUser}',
        '${data.auditUser}');`;

    res = ctrl.sendQuery(query, 'create business application', res);
  } else {
    res.status(502).json({
      message: "No authorization token present. Not allowed to create IT Standard"
    });
  }
};

exports.findStatuses = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_statuses.sql')).toString();

  res = ctrl.sendQuery(query, 'Application Statuses', res);
};

exports.findHosts = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_application_host_providers.sql')).toString();

  res = ctrl.sendQuery(query, 'Application Host Providers', res);
};