const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    " GROUP BY systems.\`ex:System_Name\`;";

  res = ctrl.sendQuery(query, 'Systems and subsystems', res);
};

exports.findOne = (req, res) => {
  let id = req.params.id.trim();
  if(/^\d+$/.test(id)) {
    var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` WHERE systems.\`ex:GEAR_ID\` = ${id} GROUP BY systems.\`ex:GEAR_ID\`;`;

    res = ctrl.sendQuery(query, 'individual System/Subsystem', res);
  } else {
    res.status(500).json({
      message: "Error: Invalid ID",
    });
  }
};

exports.findSubsystems = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_systems.sql')).toString() +
    ` WHERE systems.\`ex:FISMA_System_Identifier\` = 
        (SELECT systems.\`ex:FISMA_System_Identifier\`
        FROM obj_fisma_archer AS systems
        WHERE systems.\`ex:GEAR_ID\` = ${req.params.id} )
      AND systems.\`ex:SystemLevel\` = 'SubSystem';`;
      
  res = ctrl.sendQuery(query, 'Subsystems', res);
};

exports.findCapabilities = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_capabilities.sql')).toString() +
    ` LEFT JOIN zk_systems_subsystems_capabilities AS cap_mapping    ON cap.capability_Id = cap_mapping.obj_capability_Id
      LEFT JOIN obj_fisma_archer                   AS systems        ON cap_mapping.obj_systems_subsystems_Id = systems.\`ex:GEAR_ID\`
      WHERE systems.\`ex:GEAR_ID\` = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'related capabilities for system', res);
};

exports.updateCaps = (req, res) => {
  ctrl.getApiToken (req, res)
  .then((response) => {
    console.log('*** API Security Testing - getApiToken response: ', response); //DEBUGGING

    if (response === 1) {
      console.log('*** API Security Testing - API Auth Validation: PASSED'); //DEBUGGING

      var data = req.body;

      // Create string to update system-business capability relationship
      var capString = '';
      if (data.relatedCaps) {
        // Delete any references first
        capString += `DELETE FROM zk_systems_subsystems_capabilities WHERE obj_systems_subsystems_Id=${req.params.id}; `;

        // Insert new IDs
        data.relatedCaps.forEach(capID => {
          capString += `INSERT INTO zk_systems_subsystems_capabilities (obj_capability_Id, obj_systems_subsystems_Id) VALUES (${capID}, ${req.params.id}); `;
        });
      };

      var query = `${capString}`;
      
      res = ctrl.sendQuery(query, 'updating capabilities for system', res);

    } else {
      console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

      res.status(502).json({
        message: "No authorization token present. Not allowed to update systems-business capabilities mapping."
        });
    }
  });
};


exports.findInvestments = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_investments.sql')).toString() +
    ` LEFT JOIN zk_systems_subsystems_investments AS invest_mapping   ON invest.Investment_Id = invest_mapping.obj_investment_Id
      LEFT JOIN obj_fisma_archer                  AS systems          ON invest_mapping.obj_systems_subsystems_Id = systems.\`ex:GEAR_ID\`
      WHERE systems.\`ex:GEAR_ID\` = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'related investments for system', res);
};

exports.updateInvest = (req, res) => {
  ctrl.getApiToken (req, res)
  .then((response) => {
    console.log('*** API Security Testing - getApiToken response: ', response); //DEBUGGING

    if (response === 1) {
      console.log('*** API Security Testing - API Auth Validation: PASSED'); //DEBUGGING

    var data = req.body;

    // Create string to update system-investments relationship
    var investString = '';
    if (data.relatedInvest) {
      // Delete any references first
      investString += `DELETE FROM zk_systems_subsystems_investments WHERE obj_systems_subsystems_Id=${req.params.id}; `;

      // Insert new IDs
      data.relatedInvest.forEach(investID => {
        investString += `INSERT INTO zk_systems_subsystems_investments (obj_systems_subsystems_Id, obj_investment_Id) VALUES (${req.params.id}, ${investID}); `;
      });
    };

    var query = `${investString}`;
    
    res = ctrl.sendQuery(query, 'updating investments for system', res);

  } else {
    console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

    res.status(502).json({
      message: "No authorization token present. Not allowed to update systems-investments mapping."
      });
    }
  });
};


exports.findRecords = (req, res) => {
  var query = `SELECT * FROM gear_schema.zk_systems_subsystems_records   AS records_mapping
      LEFT JOIN obj_fisma_archer                                      AS systems       ON records_mapping.obj_systems_subsystems_Id = systems.\`ex:GEAR_ID\`
      WHERE systems.\`ex:GEAR_ID\` = ${req.params.id}

    GROUP BY records_mapping.obj_records_Id;`;

  res = ctrl.sendQuery(query, 'related records for system', res);
};

exports.findWebsites = (req, res) => {
  let id = req.params.id.trim();
  if(/^\d+$/.test(id)) {
    var query = `SELECT *
                 FROM gear_schema.zk_systems_subsystems_websites AS websites_mapping
                 LEFT JOIN obj_fisma_archer AS systems
                 ON websites_mapping.obj_systems_subsystems_Id = systems.\`ex:GEAR_ID\`
                 WHERE systems.\`ex:GEAR_ID\` = ${id}
                 GROUP BY websites_mapping.obj_websites_Id;`;

    res = ctrl.sendQuery(query, 'related websites for system', res);
  } else {
    res.status(500).json({
      message: "Error: Invalid ID",
    });
  }
};


exports.findTechnologies = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_it-standards.sql')).toString() +
    ` LEFT JOIN gear_schema.zk_systems_subsystems_technology_xml   AS tech_mapping  ON tech.Id = tech_mapping.\`ex:obj_technology_Id\`
      LEFT JOIN gear_schema.obj_fisma_archer                   AS systems       ON tech_mapping.\`ex:obj_systems_subsystems_Id\` = systems.\`ex:GEAR_ID\`
      WHERE obj_standard_type.Keyname LIKE '%Software%'
        AND systems.\`ex:GEAR_ID\` = ${req.params.id}

    GROUP BY tech.Id
    ORDER BY tech.Keyname;`;

  res = ctrl.sendQuery(query, 'related technologies for system', res); //Removed sendQuery_cowboy reference
};

exports.updateTech = (req, res) => {
  ctrl.getApiToken (req, res)
  .then((response) => {
    console.log('*** API Security Testing - getApiToken response: ', response); //DEBUGGING

    if (response === 1) {
      console.log('*** API Security Testing - API Auth Validation: PASSED'); //DEBUGGING

      var data = req.body;

      // Create string to update system-IT Standards relationship
      var techString = '';
      if (data.relatedTech) {
        // Delete any references first
        techString += `DELETE FROM zk_systems_subsystems_technology_xml WHERE \`ex:obj_systems_subsystems_Id\`=${req.params.id}; `;

        // Insert new IDs
        data.relatedTech.forEach(techID => {
          techString += `INSERT INTO zk_systems_subsystems_technology_xml (\`ex:obj_systems_subsystems_Id\`, \`ex:obj_technology_Id\`) VALUES (${req.params.id}, ${techID}); `;
        });
      };

      var query = `${techString}`;
      
      res = ctrl.sendQuery(query, 'updating IT Standards for system', res);

    } else {
      console.log('*** API Security Testing - API Auth Validation: FAILED'); //DEBUGGING

      res.status(502).json({
        message: "No authorization token present. Not allowed to update systems-business capabilities mapping."
        });
    }
  });
};

exports.findTIME = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_sysTIME.sql')).toString() +
    ` AND \`System Id\` = ${req.params.id};`;

  res = ctrl.sendQuery(query, 'related TIME designations for system', res);
};

exports.getFilterTotals = (req, res) => {  
  var query = fs.readFileSync(path.join(__dirname, queryPath, `GET/get_systems_filter_totals.sql`)).toString();

  res = ctrl.sendQuery(query, `Systems & Subsystems filter totals`, res);
};

exports.getDecommissionedSystemTotals = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, `GET/get_systems_decommissioned_totals.sql`)).toString();

  res = ctrl.sendQuery(query, `Systems decommissioned totals`, res);
};

exports.getPOCsBySystemId = (req, res) => {
  var systemId = req.params.systemId;
  var query = `
  SELECT
    sys.ex:Authorizing_Official_Full_Name              AS AOName,
    sys.ex:Authorizing_Official_Email                  AS AOEmail,
    sys.ex:Authorizing_Official_Phone                  AS AOPhone,
    sys.ex:System_Owner_Full_Name                      AS SOName,
    sys.ex:System_Owner_eMail                          AS SOEmail,
    sys.ex:System_Owner_Phone                          AS SOPhone,
    sys.ex:ISSM_Full_Name                              AS ISSMName,
    sys.ex:ISSM_Email                                  AS ISSMEmail,
    sys.ex:ISSM_Phone                                  AS ISSMPhone,
    sys.ex:ISSO_1_Full_Name                            AS ISSO1Name,
    sys.ex:ISSO_1_Email                                AS ISSO1Email,
    sys.ex:ISSO_1_Phone                                AS ISSO1Phone,
    sys.ex:ISSO_2_Full_Name                            AS ISSO2Name,
    sys.ex:ISSO_2_Email                                AS ISSO2Email,
    sys.ex:ISSO_2_Phone                                AS ISSO2Phone,
    sys.ex:ISSO_3_Full_Name                            AS ISSO3Name,
    sys.ex:ISSO_3_Email                                AS ISSO3Email,
    sys.ex:ISSO_3_Phone                                AS ISSO3Phon,
    sys.ex:ISSO_4_Full_Name                            AS ISSO4Name,
    sys.ex:ISSO_4_Email                                AS ISSO4Email,
    sys.ex:ISSO_4_Phone                                AS ISSO4Phone,
    sys.ex:Contracting_Officer_1_Full_Name             AS CO1Name,
    sys.ex:Contracting_Officer_1_eMail                 AS CO1Email,
    sys.ex:Contracting_Officer_1_Phone                 AS CO1Phone,
    sys.ex:Contracting_Officer_2_Full_Name             AS CO2Name,
    sys.ex:Contracting_Officer_2_eMail                 AS CO2Email,
    sys.ex:Contracting_Officer_2_Phone                 AS CO2Phone,
    sys.ex:ContractingOfficer_Representative1_Name     AS COR1Name,
    sys.ex:ContractingOfficer_Representative1_eMail    AS COR1Email,
    sys.ex:ContractingOfficer_Representative1_Phone    AS COR1Phone,
    sys.ex:ContractingOfficer_Representative2_Name     AS COR2Name,
    sys.ex:ContractingOfficer_Representative2_eMail    AS COR2Email,
    sys.ex:ContractingOfficer_Representative2_Phone    AS COR2Phone,
    sys.ex:BPOC_1__Full_Name                           AS BPOC1Name,
    sys.ex:BPOC_1__Email                               AS BPOC1Email,
    sys.ex:BPOC_1_Phone                                AS BPOC1Phone,
    sys.ex:BPOC_2__Full_Name                           AS BPOC2Name,
    sys.ex:BPOC_2__Email                               AS BPOC2Email,
    sys.ex:BPOC_2_Phone                                AS BPOC2Phone,
    sys.ex:TPOC_1__Full_Name                           AS TPOC1Name,
    sys.ex:TPOC_1__Email                               AS TPOC1Email,
    sys.ex:TPOC_1_Phone                                AS TPOC1Phone,
    sys.ex:TPOC_2__Full_Name                           AS TPOC2Name,
    sys.ex:TPOC_2__Email                               AS TPOC2Email,
    sys.ex:TPOC_2_Phone                                AS TPOC2Phone,
    sys.ex:Data_Steward_Full_Name                      AS DSName,
    sys.ex:Data_Steward_Email                          AS DSEmail
  FROM obj_fisma_archer             AS sys
  WHERE sys.ex:GEAR_ID = ${systemId};
`;

  res = ctrl.sendQuery(query, `POCs by SystemId`, res);
};