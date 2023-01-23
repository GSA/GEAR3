const ctrl = require('./base.controller');

// Need to update this to a view in the database for gear_schema like cowboy_ods once everything is transitioned over to the new schema
exports.searchAll = (req, res) => {
  var query = `SELECT * FROM
      (SELECT 
        systems.\`ex:GEAR_ID\` AS \`Id\`,
        systems.\`ex:System_Name\` AS \`Name\`,
        systems.\`ex:Description\` AS \`Description\`,
        'System' AS \`GEAR_Type\`,
        '{}' AS \`Other\`
      FROM
        gear_schema.obj_fisma_archer AS systems
      WHERE
        systems.\`ex:SystemLevel\` = 'SubSystem'
      UNION SELECT 
        fisma.\`ex:GEAR_ID\` AS \`Id\`,
        fisma.\`ex:System_Name\` AS \`Name\`,
        fisma.\`ex:Description\` AS \`Description\`,
        'FISMA' AS \`GEAR_Type\`,
        '{}' AS \`Other\`
      FROM
      gear_schema.obj_fisma_archer AS fisma
      WHERE
        (fisma.\`ex:SystemLevel\` = 'System') AND
        (fisma.\`ex:Status\` <> 'Pending') 
      UNION SELECT 
        tech.\`Id\` AS \`Id\`,
        tech.\`Keyname\` AS \`Name\`,
        tech.\`Description\` AS \`Description\`,
        'Technology' AS \`GEAR_Type\`,
        JSON_OBJECT('Vendor',
            tech.\`Vendor_Standard_Organization\`,
            'Comments',
            tech.\`Comments\`) AS \`Other\`
      FROM
        obj_technology AS tech
      UNION SELECT 
        cap.\`capability_Id\` AS \`Id\`,
        cap.\`Capability_Name\` AS \`Name\`,
        cap.\`Description\` AS \`Description\`,
        'Capability' AS \`GEAR_Type\`,
        '{}' AS \`Other\`
      FROM
        gear_schema.obj_capability AS cap
      UNION SELECT 
        invest.\`Investment_Id\` AS \`Id\`,
        invest.\`Investment_Name\` AS \`Name\`,
        invest.\`Description\` AS \`Description\`,
        'Investment' AS \`GEAR_Type\`,
        '{}' AS \`Other\`
      FROM
        gear_schema.obj_investments as invest) AS global_search
    WHERE Name LIKE '%${req.params.kw}%' or Description like '%${req.params.kw}%';`; // Removed cowboy_ods.obj_technology AS tech reference

  res = ctrl.sendQuery(query, `global search of ${req.params.kw}`, res);
};
