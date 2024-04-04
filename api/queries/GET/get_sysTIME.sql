SELECT
	`System Id`,
  `System Name`,
  `FY`,
  `TIME Designation`,
  `Business Score`,
  `Technical Score`,
  `O&M Cost`,
  `DM&E Cost`,
  `Software/Hardware License Costs`,
  `Date Script Run`,
  `Questionnaire Last Updated`,
  `POC Last Updated`,
  `File Link`
    
FROM obj_TIME AS time
INNER JOIN obj_fisma_archer AS fisma ON time.`System Id` = fisma.`ex:GEAR_ID`
WHERE fisma.`ex:BusinessApplication` = "Yes"
