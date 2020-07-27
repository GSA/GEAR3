SELECT DISTINCT 
  app.Id                            AS ID,
  app.Keyname                       AS Name,
  app.Description                   AS Description,
  app.Display_Name                  AS DisplayName,
  -- app.Application_alias             AS Alias,
  app.Cloud_Indicator               AS Cloud,
  app.Mobile_App_Indicator,
  -- app.Desktop_Indicator,
  -- app.Regional_Classification      AS RegionClassification,
  app.Application_or_Website,
  nou.Keyname                       AS Number_of_Users,
  -- app.Generate_Revenue_Indicator   AS IsRevenueGenerator,
  app.Application_Notes,
  ot.Keyname                        AS Tier,
  app.Production_Year               AS ProdYear,
  app.Retired_Year                  AS RetiredYear,
  app.URL,
  app.TIME_Notes,
  app.CUI_Indicator                 AS CUI,
  app.Unique_Identifier_Code        AS OMBUID,
  app.Reference_Document,
  -- obj_app_platform.Keyname         AS TechnologyPlatform,  
  obj_app_hostingprovider.Keyname   AS HostingProvider,
  obj_application_status.Keyname    AS Status,
  org.Keyname                       AS SSO,
  org.Display_name                  AS SSOShort,
  owner.Keyname                     AS Owner,
  owner.Display_name                AS OwnerShort,
  GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', buspoc.Keyname, buspoc.Email, busorg.Display_Name) SEPARATOR '; ')     AS BusinessPOC,
  GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', techpoc.Keyname, techpoc.Email, techorg.Display_Name) SEPARATOR '; ')  AS TechnicalPOC,
  GROUP_CONCAT(DISTINCT  buspoc.Keyname SEPARATOR ', ')                                                         AS BusPOC,
  GROUP_CONCAT(DISTINCT  busorg.Display_Name SEPARATOR ', ')                                                    AS BusOrg,
  GROUP_CONCAT(DISTINCT  techpoc.Keyname SEPARATOR ', ')                                                        AS TechPOC,
  GROUP_CONCAT(DISTINCT  techorg.Display_Name SEPARATOR ', ')                                                   AS TechOrg,
  
  CONCAT_WS('*', CONCAT_WS(':', 'BusinessPOC', GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', buspoc.Keyname, buspoc.Email, busorg.Display_Name) SEPARATOR '; ')) ,
  CONCAT_WS(':', 'TechnicalPOC', GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', techpoc.Keyname, techpoc.Email, techorg.Display_Name) SEPARATOR '; '))  ) AS POC,
 
  -- GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', fy.Keyname, timeq.Keyname) SEPARATOR '; ') AS AppTime,
  GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', apprat.fy, apprat.TIME_Val) SEPARATOR '; ') AS AppTime,

  obj_parent_system.Keyname           AS ParentSystem,
  obj_parent_system.Id                AS ParentSystemID,
  obj_investment.Id                   AS InvestmentID,
  obj_portfolio.Keyname               AS Portfolio,
  obj_fisma_archer.`ex:System_Name`   AS FISMASystem,
  app.CreateDTG,
  app.ChangeDTG,
  app.CreateAudit,
  app.ChangeAudit,
  app.old_Id
  -- GROUP_CONCAT(DISTINCT  replacedby.Keyname SEPARATOR ', ') AS Replacedby
  
FROM obj_application AS app
  
LEFT JOIN obj_organization  AS org    ON app.obj_org_SSO_Id = org.Id
LEFT JOIN obj_parent_system           ON app.obj_parent_system_Id = obj_parent_system.Id
LEFT JOIN obj_investment              ON app.obj_investment_Id = obj_investment.Id
LEFT JOIN obj_portfolio               ON app.obj_portfolio_Id = obj_portfolio.Id
LEFT JOIN obj_fisma_archer            ON app.obj_fisma_Id = obj_fisma_archer.`ex:GEAR_ID`
-- LEFT JOIN obj_app_platform           ON app.obj_app_platform_Id = obj_app_platform.Id
LEFT JOIN obj_app_hostingprovider     ON app.obj_app_hostingprovider_Id = obj_app_hostingprovider.Id
LEFT JOIN obj_application_status      ON app.obj_application_status_Id = obj_application_status.Id
LEFT JOIN obj_num_of_users  AS nou    ON app.Number_of_Users = nou.Id
LEFT JOIN obj_tier          AS ot     ON app.Tier = ot.Id


LEFT JOIN zk_application_owning_org  ON app.Id = zk_application_owning_org.obj_application_Id
LEFT JOIN obj_organization AS owner  ON app.App_Owning_Org = owner.Id

-- LEFT JOIN zk_application_replacedby ON app.Id = zk_application_replacedby.obj_application_Id
-- LEFT JOIN obj_application AS replacedby ON zk_application_replacedby.obj_application_Id1 = replacedby.Id

LEFT JOIN zk_application_business_poc    ON app.Id = zk_application_business_poc.obj_application_Id
LEFT JOIN obj_poc          AS buspoc     ON zk_application_business_poc.obj_bus_poc_Id = buspoc.Id
LEFT JOIN obj_organization AS busorg     ON buspoc.obj_organization_Id = busorg.Id

LEFT JOIN zk_application_technical_poc   ON app.Id = zk_application_technical_poc.obj_application_Id
LEFT JOIN obj_poc          AS techpoc    ON zk_application_technical_poc.obj_tech_poc_Id = techpoc.Id
LEFT JOIN obj_organization AS techorg    ON techpoc.obj_organization_Id = techorg.Id

-- LEFT JOIN zk_application_time ON app.Id = zk_application_time.obj_application_Id
-- LEFT JOIN obj_fy AS fy ON zk_application_time.obj_fy_Id = fy.Id   
-- LEFT JOIN obj_time_quadrant AS timeq ON zk_application_time.obj_time_quadrant_Id = timeq.Id
LEFT JOIN obj_application_rationalization AS apprat ON app.Id = apprat.obj_application_Id