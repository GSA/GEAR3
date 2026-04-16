const ctrl = require('./base.controller');

// Need to update this to a view in the database for gear_schema like cowboy_ods once everything is transitioned over to the new schema
exports.searchAll = (req, res) => {
  var searchKW = decodeURIComponent(req.params.kw);
  var query = `SELECT * FROM (
    -- Subsystems from FISMA
    SELECT
        systems.\`ex:GEAR_ID\` AS \`Id\`,
        systems.\`ex:System_Name\` AS \`Name\`,
        systems.\`ex:Description\` AS \`Description\`,
        systems.\`ex:Status\` AS \`Status\`,
        'System' AS \`GEAR_Type\`,
        'Business Systems & Subsystems Report' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`,
        -- Weighted Relevance: Give a 'Name' match 5x the score of a 'Description' match
        (MATCH(systems.\`ex:System_Name\`) AGAINST ('${searchKW}' IN BOOLEAN MODE) * 5) +
        (MATCH(systems.\`ex:Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)) AS \`relevance\`
    FROM
        gear_schema.obj_fisma_archer AS systems
    WHERE
        systems.\`ex:SystemLevel\` = 'SubSystem' AND
        MATCH(systems.\`ex:System_Name\`, systems.\`ex:Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)

    UNION

    -- Systems from FISMA
    SELECT
        fisma.\`ex:GEAR_ID\` AS \`Id\`,
        fisma.\`ex:System_Name\` AS \`Name\`,
        fisma.\`ex:Description\` AS \`Description\`,
        fisma.\`ex:Status\` AS \`Status\`,
        'FISMA' AS \`GEAR_Type\`,
        'Security -> FISMA Systems Inventory' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`,
        (MATCH(fisma.\`ex:System_Name\`) AGAINST ('${searchKW}' IN BOOLEAN MODE) * 5) +
        (MATCH(fisma.\`ex:Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)) AS \`relevance\`
    FROM
        gear_schema.obj_fisma_archer AS fisma
    WHERE
        (fisma.\`ex:SystemLevel\` = 'System') AND
        (fisma.\`ex:Status\` <> 'Pending') AND
        MATCH(fisma.\`ex:System_Name\`, fisma.\`ex:Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)

    UNION

    -- Technologies
    SELECT
        tech.\`Id\` AS \`Id\`,
        IFNULL(tech.\`softwareReleaseName\`, tech.\`Keyname\`) AS \`Name\`,
        tech.\`Description\` AS \`Description\`,
        obj_technology_status.\`Keyname\` AS \`Status\`,
        'Technology' AS \`GEAR_Type\`,
        'Technologies -> IT Standards List' AS \`GEAR_Type_Display\`,
        JSON_OBJECT('Vendor', tech.\`Vendor_Standard_Organization\`, 'Comments', tech.\`Comments\`) AS \`Other\`,
        (MATCH(tech.\`softwareReleaseName\`, tech.\`Keyname\`) AGAINST ('${searchKW}' IN BOOLEAN MODE) * 5) +
        (MATCH(tech.\`Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)) AS \`relevance\`
    FROM
        obj_technology AS tech
    LEFT JOIN obj_technology_status ON tech.obj_technology_status_Id = obj_technology_status.Id
    WHERE
        MATCH(tech.\`softwareReleaseName\`, tech.\`Keyname\`, tech.\`Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)

    UNION

    -- Capabilities
    SELECT
        cap.\`capability_Id\` AS \`Id\`,
        cap.\`Capability_Name\` AS \`Name\`,
        cap.\`Description\` AS \`Description\`,
        '' AS \`Status\`,
        'Capability' AS \`GEAR_Type\`,
        'GSA Enterprise -> Business Capability List' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`,
        (MATCH(cap.\`Capability_Name\`) AGAINST ('${searchKW}' IN BOOLEAN MODE) * 5) +
        (MATCH(cap.\`Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)) AS \`relevance\`
    FROM
        gear_schema.obj_capability AS cap
    WHERE
        MATCH(cap.\`Capability_Name\`, cap.\`Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)

    UNION

    -- Organizations
    SELECT
        org.\`Organization_Id\` AS \`Id\`,
        org.\`Organization_Id\` AS \`Name\`,
        org.\`Organization_Name\` AS \`Description\`,
        '' AS \`Status\`,
        'Organization' AS \`GEAR_Type\`,
        'GSA Enterprise -> Organization List' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`,
        (MATCH(org.\`Organization_Id\`) AGAINST ('${searchKW}' IN BOOLEAN MODE) * 5) +
        (MATCH(org.\`Organization_Name\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)) AS \`relevance\`
    FROM
        gear_schema.obj_organization AS org
    WHERE
        MATCH(org.\`Organization_Id\`, org.\`Organization_Name\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)

    UNION

    -- Investments
    SELECT
        invest.\`Investment_Id\` AS \`Id\`,
        invest.\`Investment_Name\` AS \`Name\`,
        invest.\`Description\` AS \`Description\`,
        invest.\`Investment_Status_Name\` AS \`Status\`,
        'Investment' AS \`GEAR_Type\`,
        'IT Strategy -> IT Investments' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`,
        (MATCH(invest.\`Investment_Name\`) AGAINST ('${searchKW}' IN BOOLEAN MODE) * 5) +
        (MATCH(invest.\`Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)) AS \`relevance\`
    FROM
        gear_schema.obj_investments as invest
    WHERE
        MATCH(invest.\`Investment_Name\`, invest.\`Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)

    UNION

    -- Websites
    SELECT
        web.\`id\` AS \`Id\`,
        web.\`domain\` AS \`Name\`,
        web.\`notes\` AS \`Description\`,
        web.\`production_status\` AS \`Status\`,
        'Website' AS \`GEAR_Type\`,
        'Business Systems -> GSA Websites' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`,
        (MATCH(web.\`domain\`) AGAINST ('${searchKW}' IN BOOLEAN MODE) * 5) +
        (MATCH(web.\`notes\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)) AS \`relevance\`
    FROM
        gear_schema.obj_websites as web
    WHERE
        MATCH(web.\`domain\`, web.\`notes\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)

    UNION

    -- TRM
    SELECT
        trm.\`Technology_Category_Id\` AS \`Id\`,
        trm.\`TRM_Name\` AS \`Name\`,
        trm.\`Description\` AS \`Description\`,
        '' AS \`Status\`,
        'TRM' AS \`GEAR_Type\`,
        'Technology Reference Model' AS \`GEAR_Type_Display\`,
        '{}' AS \`Other\`,
        (MATCH(trm.\`TRM_Name\`) AGAINST ('${searchKW}' IN BOOLEAN MODE) * 5) +
        (MATCH(trm.\`Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)) AS \`relevance\`
    FROM
        gear_schema.obj_TRM as trm
    WHERE
        MATCH(trm.\`TRM_Name\`, trm.\`Description\`) AGAINST ('${searchKW}' IN BOOLEAN MODE)

) AS \`final_results\`
WHERE \`relevance\` > 0
ORDER BY \`relevance\` DESC;`; // Removed cowboy_ods.obj_technology AS tech reference
//${searchKW}
  res = ctrl.sendQuery(query, `global search of ${searchKW}`, res);
};