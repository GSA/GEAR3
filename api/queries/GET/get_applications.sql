SELECT 
  app.Id                          AS ID,
  app.Keyname                     AS Name,
  app.Description                 AS Description,
  app.Display_Name                AS DisplayName,
  -- app.Application_alias           AS Alias,
  IF (app.Cloud_Indicator = 1, 'Yes', 'No')       AS Cloud,
  IF (app.Mobile_App_Indicator = 1, 'Yes', 'No')  AS Mobile_App_Indicator,
  app.Desktop_Indicator,
  -- app.Regional_Classification    AS RegionClassification,
  app.Application_or_Website,
  nou.Keyname                     AS Number_of_Users,
  -- app.Generate_Revenue_Indicator AS IsRevenueGenerator,
  app.Application_Notes,
  ot.Keyname                      AS Tier,
  app.Production_Year             AS ProdYear,
  app.Retired_Year                AS RetiredYear,
  app.URL,
  app.TIME_Notes,
  app.CUI_Indicator               AS CUI,
  app.Unique_Identifier_Code      AS OMBUID,
  app.Reference_Document,
  -- obj_app_platform.Keyname       AS TechnologyPlatform,  
  obj_app_hostingprovider.Keyname AS HostingProvider,
  obj_application_status.Keyname  AS Status,
  org.Keyname                     AS SSO,
  org.Display_name                AS SSOShort,

  GROUP_CONCAT(DISTINCT owner.Keyname SEPARATOR ',')                                      AS Owner,
  GROUP_CONCAT(DISTINCT owner.Display_name SEPARATOR ',')                                 AS OwnerShort,
  GROUP_CONCAT(DISTINCT owner.Id SEPARATOR ',')                                           AS OwnerID,
  GROUP_CONCAT(DISTINCT support.Keyname SEPARATOR ',')                                    AS Support,
  GROUP_CONCAT(DISTINCT support.Display_name SEPARATOR ',')                               AS SupportShort,
  GROUP_CONCAT(DISTINCT support.Id SEPARATOR ',')                                         AS SupportID,
  GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', CONCAT_WS(' ', buspoc.FirstName, buspoc.LastName), buspoc.Email, buspoc.OrgCode) SEPARATOR '; ')     AS BusinessPOC,
  GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', CONCAT_WS(' ', techpoc.FirstName, techpoc.LastName), techpoc.Email, techpoc.OrgCode) SEPARATOR '; ') AS TechnicalPOC,
  GROUP_CONCAT(DISTINCT  CONCAT_WS(' ', buspoc.FirstName, buspoc.LastName) SEPARATOR ', ')                                                    AS BusPOC,
  GROUP_CONCAT(DISTINCT  CONCAT_WS(' ', techpoc.FirstName, techpoc.LastName) SEPARATOR ', ')                                                  AS TechPOC,
  
  CONCAT_WS('*', CONCAT_WS(':', 'BusinessPOC', GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', CONCAT_WS(' ', buspoc.FirstName, buspoc.LastName), buspoc.Email) SEPARATOR '; ')) ,
  CONCAT_WS(':', 'TechnicalPOC', GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', CONCAT_WS(' ', techpoc.FirstName, techpoc.LastName), techpoc.Email) SEPARATOR '; '))  ) AS POC,
 
  GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', fy.Keyname, timeq.Keyname) SEPARATOR '; ')       AS AppTime,

  obj_parent_system.Keyname         AS ParentSystem,
  obj_parent_system.Id              AS ParentSystemID,
  obj_investment.Keyname            AS Investment,
  obj_investment.Id                 AS InvestmentID,
  obj_portfolio.Keyname             AS Portfolio,
  obj_fisma_archer.`ex:System_Name` AS FISMASystem,
  obj_fisma_archer.`ex:GEAR_ID`     AS FISMASystemID,
  app.CreateDTG,
  app.ChangeDTG,
  app.CreateAudit,
  app.ChangeAudit,
  app.old_Id

FROM obj_application AS app
  
LEFT JOIN obj_organization            AS org      ON app.obj_org_SSO_Id = org.Id
LEFT JOIN obj_parent_system                       ON app.obj_parent_system_Id = obj_parent_system.Id
LEFT JOIN obj_investment                          ON app.obj_investment_Id = obj_investment.Id
LEFT JOIN obj_portfolio                           ON app.obj_portfolio_Id = obj_portfolio.Id
LEFT JOIN obj_fisma_archer                        ON app.obj_fisma_Id = obj_fisma_archer.`ex:GEAR_ID`
-- LEFT JOIN obj_app_platform                       ON app.obj_app_platform_Id = obj_app_platform.Id
LEFT JOIN obj_app_hostingprovider                 ON app.obj_app_hostingprovider_Id = obj_app_hostingprovider.Id
LEFT JOIN obj_application_status                  ON app.obj_application_status_Id = obj_application_status.Id
LEFT JOIN obj_num_of_users            AS nou      ON app.Number_of_Users = nou.Id
LEFT JOIN obj_tier                    AS ot       ON app.Tier = ot.Id

LEFT JOIN zk_application_owning_org               ON app.Id = zk_application_owning_org.obj_application_Id
LEFT JOIN obj_organization            AS owner    ON zk_application_owning_org.obj_org_owner_Id = owner.Id
LEFT JOIN obj_organization            AS support  ON app.Support_Org = support.Id

LEFT JOIN zk_app_capabilities                     ON app.Id = zk_app_capabilities.obj_application_Id
LEFT JOIN obj_capability              AS cap      ON zk_app_capabilities.obj_capability_Id = cap.Id

LEFT JOIN zk_application_technology               ON app.Id = zk_application_technology.obj_application_Id
LEFT JOIN obj_technology              AS tech     ON zk_application_technology.obj_technology_Id = tech.Id

LEFT JOIN zk_application_business_poc             ON app.Id = zk_application_business_poc.obj_application_Id
LEFT JOIN obj_ldap_poc                AS buspoc   ON zk_application_business_poc.obj_ldap_SamAccountName = buspoc.SamAccountName

LEFT JOIN zk_application_technical_poc            ON app.Id = zk_application_technical_poc.obj_application_Id
LEFT JOIN obj_ldap_poc                AS techpoc  ON zk_application_technical_poc.obj_ldap_SamAccountName = techpoc.SamAccountName

LEFT JOIN zk_application_time                     ON app.Id = zk_application_time.obj_application_Id
LEFT JOIN obj_fy                      AS fy       ON zk_application_time.obj_fy_Id = fy.Id
LEFT JOIN obj_time_quadrant           AS timeq    ON zk_application_time.obj_time_quadrant_Id = timeq.Id

WHERE obj_application_status.Keyname <> 'Retired'