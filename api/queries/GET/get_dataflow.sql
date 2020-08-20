SELECT DISTINCT
  app1.Id                       AS srcAppID,
  app1.Keyname                  AS srcAppLong,
  app1.Display_Name             AS srcApp,
    
  -- COUNT(*)                      AS Connections,
  -- count(distinct pii.Keyname) AS Count,
  -- group_concat(pii.Keyname) AS PII,
  -- pii.Keyname                   AS PII,
  
  app2.Id                       AS destAppID,
  app2.Keyname                  AS destAppLong,
  app2.Display_Name             AS destApp

FROM obj_application_interfaces AS inter

LEFT JOIN obj_application       AS app1     ON inter.obj_application_Id = app1.Id
LEFT JOIN obj_application       AS app2     ON inter.obj_application_Id1 = app2.Id