const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

exports.findAll = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_fisma_archer.sql')).toString() +
    " GROUP BY archer.\`ex:GEAR_ID\`;";

  res = ctrl.sendQuery(query, 'FISMA Systems', res);
};

exports.findOne = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_fisma_archer.sql')).toString() +
    ` WHERE archer.\`ex:GEAR_ID\` = ${req.params.id} GROUP BY archer.\`ex:GEAR_ID\`;`;

  res = ctrl.sendQuery(query, 'individual FISMA System', res);
};

// exports.findApplications = (req, res) => {
//   var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
//     ` AND app.obj_fisma_Id = ${req.params.id} GROUP BY app.Id;`;

//   res = ctrl.sendQuery_cowboy(query, 'certified applications for FISMA System', res);
// };

exports.findRetired = (req, res) => {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_fisma_archer.sql')).toString() +
    " WHERE archer.\`ex:Status\` = 'Inactive' GROUP BY archer.\`ex:GEAR_ID\`;";

  res = ctrl.sendQuery(query, 'retired FISMA Systems', res);
};

exports.updateAll = (req, res) => {
  console.log("Updating FISMA table");

  var query = "SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE obj_fisma_archer; ";

  var nameFields = [
    'u_authorizing_official.name',
    // 'u_contracting_officer_1',
    // 'u_contracting_officer_2',
    'u_contracting_officer_representative_1.name',
    'u_contracting_officer_representative_1.name',
    'u_issm.name',
    'u_isso.name',
    'u_isso_2.name',
    'u_isso_3.name',
    'u_isso_4.name'
  ]

  for (let index = 0; index < req.body.length; index++) {
    const element = req.body[index];

    for (const [key, value] of Object.entries(element)) {
      // If no value, NULL in SQL string
      if (!value) element[key] = 'NULL';

      else if (key === 'u_active') {
        // If u_active set to 'true', set Status to 'Active, else 'Inactive'
        if (value === 'true') element[key] = "'Active'";
        else element[key] = "'Inactive'";

      } else if (nameFields.includes(key)) {
        // If SN field includes name or in the array of name fields
        // Parse name out of string
        // console.log(`Key: ${key}, "Value: ${value}`);  // Debug
        const regex = /^([a-zA-Z \-()]+) - /;
        const found = value.match(regex);
        element[key] = `'${found[1]}'`;
      }

      else element[key] = `'${value}'`;
    };

    query += `INSERT INTO obj_fisma_archer 
        (\`ex:GEAR_ID\`,
        \`ex:Responsible_Org\`,
        \`ex:System_Name\`,
        \`ex:FederalContractor\`,
        \`ex:FIPS_Impact_Level\`,
        \`ex:ATOIATO_Date\`,
        \`ex:ATO_Type\`,
        \`ex:Renewal_Date\`,
        \`ex:Complete_Assessment_For_Current_FY_Text\`,
        \`ex:PII\`,
        \`ex:Cloud_Hosted\`,
        \`ex:Hosting_Provider\`,
        \`ex:Type_of_Service\`,
        \`ex:FISMA_System_Identifier\`,
        \`ex:Inactive_Date\`,
        \`ex:Status\`,
        \`ex:Description\`,
        \`ex:ISSM_Full_Name\`,
        \`ex:ISSM_Email\`,
        \`ex:ISSM_Phone\`,
        \`ex:ISSO_1_Full_Name\`,
        \`ex:ISSO_1_Email\`,
        \`ex:ISSO_1_Phone\`,
        \`ex:ISSO_2_Full_Name\`,
        \`ex:ISSO_2_Email\`,
        \`ex:ISSO_2_Phone\`,
        \`ex:ISSO_3_Full_Name\`,
        \`ex:ISSO_3_Email\`,
        \`ex:ISSO_3_Phone\`,
        \`ex:ISSO_4_Full_Name\`,
        \`ex:ISSO_4_Email\`,
        \`ex:ISSO_4_Phone\`,
        -- \`ex:System_Owner_Full_Name\`,
        -- \`ex:System_Owner_eMail\`,
        \`ex:System_Owner_Phone\`,
        \`ex:Authorizing_Official_Full_Name\`,
        \`ex:Authorizing_Official_Email\`,
        \`ex:Authorizing_Official_Phone\`,
        -- \`ex:Contracting_Officer_1_Full_Name\`,
        \`ex:Contracting_Officer_1_eMail\`,
        \`ex:Contracting_Officer_1_Phone\`,
        -- \`ex:Contracting_Officer_2_Full_Name\`,
        \`ex:Contracting_Officer_2_eMail\`,
        \`ex:Contracting_Officer_2_Phone\`,
        \`ex:ContractingOfficer_Representative1_Name\`,
        \`ex:ContractingOfficer_Representative1_eMail\`,
        \`ex:ContractingOfficer_Representative1_Phone\`,
        \`ex:ContractingOfficer_Representative2_Name\`,
        \`ex:ContractingOfficer_Representative2_eMail\`,
        \`ex:ContractingOfficer_Representative2_Phone\`,
        \`ex:Primary_Artifact_Name\`,
        \`ex:Primary_Artifact_URL\`,
        \`ex:Goverment_Wide_Shared_Service\`,
        \`ex:SystemLevel\`,
        -- \`ex:ParentSystem\`,
        \`ex:FISMA_Reportable\`)
      VALUES (${element.u_gear_id},
      ${element.u_responsible_sso},
      ${element.u_name},
      ${element.u_fed_or_con},
      ${element.u_fips199_impact_level},
      ${element.u_atoiato_date},
      ${element.u_ato_type},
      ${element.u_renewal_date},
      ${element.u_complete_assement_for_current_fy},
      ${element.u_pii},
      ${element.u_cloud_hosted},
      ${element.u_clound_server_provider},
      ${element.u_type_of_service},
      ${element.u_fisma_system_identifier},
      ${element.u_inactive_date},
      ${element.u_active},
      ${element.u_description},
      ${element['u_issm.name']},
      ${element['u_issm.email']},
      ${element['u_issm.phone']},
      ${element['u_isso.name']},
      ${element['u_isso.email']},
      ${element['u_isso.phone']},
      ${element['u_isso_2.name']},
      ${element['u_isso_2.email']},
      ${element['u_isso_2.phone']},
      ${element['u_isso_3.name']},
      ${element['u_isso_3.email']},
      ${element['u_isso_3.phone']},
      ${element['u_isso_4.name']},
      ${element['u_isso_4.email']},
      ${element['u_isso_4.phone']},
      -- ${element.u_system_owner},
      -- ${element['u_system_owner.email']},
      ${element['u_system_owner.phone']},
      ${element['u_authorizing_official.name']},
      ${element['u_authorizing_official.email']},
      ${element['u_authorizing_official.phone']},
      -- ${element.u_contracting_officer_1},
      ${element['u_contracting_officer_1.email']},
      ${element['u_contracting_officer_1.phone']},
      -- ${element.u_contracting_officer_2},
      ${element['u_contracting_officer_2.email']},
      ${element['u_contracting_officer_2.phone']},
      ${element['u_contracting_officer_representative_1.name']},
      ${element['u_contracting_officer_representative_1.email']},
      ${element['u_contracting_officer_representative_1.phone']},
      ${element['u_contracting_officer_representative_2.name']},
      ${element['u_contracting_officer_representative_2.email']},
      ${element['u_contracting_officer_representative_2.phone']},
      ${element.u_primary_artifact_name},
      ${element.u_primary_artifact_url},
      ${element.u_goverment_wide_shared_service},
      ${element.u_systemlevel},
      -- ${element.u_parent_system},
      ${element.u_fisma_reportable}); `;
  };

  query += " SET FOREIGN_KEY_CHECKS=1;";
  // console.log("Final query string: ", query); // Debug
  res = ctrl.sendQuery_cowboy(query, 'Loading into FISMA Archer Table', res);
};