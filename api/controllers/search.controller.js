const ctrl = require('./base.controller');

// Need to update this to a view in the database for gear_schema like cowboy_ods once everything is transitioned over to the new schema
exports.searchAll = (req, res) => {
  var query = `SELECT * FROM
      (SELECT
        systems.\`ex:GEAR_ID\` AS \`Id\`,
        systems.\`ex:System_Name\` AS \`Name\`,
        systems.\`ex:Description\` AS \`Description\`,
        systems.\`ex:Status\` AS \`Status\`,
        'System' AS \`GEAR_Type\`,
        'Business Systems & Subsystems Report' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`
      FROM
        gear_schema.obj_fisma_archer AS systems
      WHERE
        systems.\`ex:SystemLevel\` = 'SubSystem' AND 
        systems.\`ex:BusinessApplication\` = 'Yes'
      UNION SELECT
        fisma_subsystems.\`ex:GEAR_ID\` AS \`Id\`,
        fisma_subsystems.\`ex:System_Name\` AS \`Name\`,
        fisma_subsystems.\`ex:Description\` AS \`Description\`,
        fisma_subsystems.\`ex:Status\` AS \`Status\`,
        'FISMA' AS \`GEAR_Type\`,
        'FISMA Subsystems Report' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`
      FROM
        gear_schema.obj_fisma_archer AS fisma_subsystems
      WHERE
        fisma_subsystems.\`ex:SystemLevel\` = 'SubSystem' AND 
        fisma_subsystems.\`ex:BusinessApplication\` = 'No'
      UNION SELECT
        fisma.\`ex:GEAR_ID\` AS \`Id\`,
        fisma.\`ex:System_Name\` AS \`Name\`,
        fisma.\`ex:Description\` AS \`Description\`,
        fisma.\`ex:Status\` AS \`Status\`,
        'FISMA' AS \`GEAR_Type\`,
        'Security -> FISMA Systems Inventory' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`
      FROM
      gear_schema.obj_fisma_archer AS fisma
      WHERE
        (fisma.\`ex:SystemLevel\` = 'System') AND
        (fisma.\`ex:Status\` <> 'Pending')
      UNION SELECT
        tech.\`Id\` AS \`Id\`,
        IFNULL(tech.\`softwareReleaseName\`, tech.\`Keyname\`) AS \`Name\`,
        tech.\`Description\` AS \`Description\`,
        obj_technology_status.\`Keyname\` AS \`Status\`,
        'Technology' AS \`GEAR_Type\`,
        'Technologies -> IT Standards List' AS \`GEAR_Type_Display\`,
        JSON_OBJECT('Vendor',
            tech.\`Vendor_Standard_Organization\`,
            'Comments',
            tech.\`Comments\`) AS \`Other\`
      FROM
        obj_technology AS tech
      LEFT JOIN obj_technology_status       ON tech.obj_technology_status_Id = obj_technology_status.Id
      UNION SELECT
        cap.\`capability_Id\` AS \`Id\`,
        cap.\`Capability_Name\` AS \`Name\`,
        cap.\`Description\` AS \`Description\`,
        '-' AS \`Status\`,
        'Capability' AS \`GEAR_Type\`,
        'GSA Enterprise -> Business Capability List' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`
      FROM
        gear_schema.obj_capability AS cap
      UNION SELECT
        org.\`Organization_Id\` AS \`Id\`,
        org.\`Organization_Id\` AS \`Name\`,
        org.\`Organization_Name\` AS \`Description\`,
        '-' AS \`Status\`,
        'Organization' AS \`GEAR_Type\`,
        'GSA Enterprise -> Organization List' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`
      FROM
        gear_schema.obj_organization AS org  
      UNION SELECT
        invest.\`Investment_Id\` AS \`Id\`,
        invest.\`Investment_Name\` AS \`Name\`,
        invest.\`Description\` AS \`Description\`,
        invest.\`Investment_Status_Name\` AS \`Status\`,
        'Investment' AS \`GEAR_Type\`,
        'IT Strategy -> IT Investments' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`
      FROM
        gear_schema.obj_investments as invest
      UNION SELECT
        web.\`id\` AS \`Id\`,
        web.\`domain\` AS \`Name\`,
        web.\`notes\` AS \`Description\`,
        web.\`production_status\` AS \`Status\`,
        'Website' AS \`GEAR_Type\`,
        'Business Systems -> GSA Websites' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`
      FROM
          gear_schema.obj_websites as web) AS global_search
    WHERE Name LIKE '%${req.params.kw}%' or Description like '%${req.params.kw}%'
    ORDER BY
      /* Primary relevance tier based on WHERE the keyword matches in Name */
      CASE
        WHEN Name = '${req.params.kw}' THEN 0            /* exact match */
        WHEN Name LIKE '${req.params.kw}%' THEN 1        /* name starts with */
        WHEN Name LIKE '% ${req.params.kw}%' THEN 2      /* matches start of a word */
        WHEN Name LIKE '%${req.params.kw}%' THEN 3       /* matches anywhere in name */
        ELSE 4                                           /* description-only match */
      END ASC,
      /* Tiebreaker 1: earlier the keyword appears in the Name, the more relevant.
         Rows with no Name match (description-only) get a large value so they sink. */
      CASE
        WHEN Name LIKE '%${req.params.kw}%'
          THEN LOCATE('${req.params.kw}', Name)
        ELSE 999999
      END ASC,
      /* Tiebreaker 2: shorter names are more relevant (keyword is a bigger portion of the name) */
      CHAR_LENGTH(Name) ASC,
      /* Tiebreaker 3: GEAR_Type importance */
      CASE \`GEAR_Type\`
        WHEN 'Technology'   THEN 0
        WHEN 'System'       THEN 1
        WHEN 'FISMA'        THEN 2
        WHEN 'Website'      THEN 3
        WHEN 'Organization' THEN 4
        WHEN 'Capability'   THEN 5
        WHEN 'Investment'   THEN 6
        ELSE 7
      END ASC;`; // Removed cowboy_ods.obj_technology AS tech reference

  res = ctrl.sendQuery(query, `global search of ${req.params.kw}`, res);
};
