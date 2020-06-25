SELECT DISTINCT
  app1.Id                                           AS AppID1,
  app1.Keyname                                      AS Name1,
  app1.Display_Name                                 AS NameShort1,
  appstat1.Keyname                                  AS Status1,
  appstat2.Keyname                                  AS Status2,
  
  org1.Keyname                                      AS SSO1,
  org1.Display_name                                 AS SSOShort1,
  owner1.Keyname                                    AS Owner1,
  owner1.Display_name                               AS OwnerShort1,
  
  sys1.Keyname                                      AS System1,
  
  IF(inter.pii = 'yes', 1, 0)                       AS PII,
  IF(inter.pii = 'yes', 'PII Data', 'No PII Data')  AS PIIType,
  
  app2.Id                                           AS AppID2,
  app2.Keyname                                      AS Name2,
  app2.Display_Name                                 AS NameShort2,
  
  org2.Keyname                                      AS SSO2,
  org2.Display_name                                 AS SSOShort2,
  owner2.Keyname                                    AS Owner2,
  owner2.Display_name                               AS OwnerShort2,
  
  sys2.Keyname                                      AS System2
 
FROM obj_application_interfaces AS inter


LEFT JOIN obj_application           AS app1     ON inter.obj_application_Id = app1.Id
LEFT JOIN obj_application           AS app2     ON inter.obj_application_Id1 = app2.Id
LEFT JOIN obj_application_status    AS appstat1 ON app1.obj_application_status_Id = appstat1.Id
LEFT JOIN obj_application_status    AS appstat2 ON app2.obj_application_status_Id = appstat2.Id
LEFT JOIN obj_organization          AS org1     ON app1.obj_org_SSO_Id = org1.Id
LEFT JOIN obj_organization          AS org2     ON app2.obj_org_SSO_Id = org2.Id
LEFT JOIN obj_parent_system         AS sys1     ON app1.obj_parent_system_Id = sys1.Id
LEFT JOIN obj_parent_system         AS sys2     ON app2.obj_parent_system_Id = sys2.Id


LEFT JOIN zk_application_owning_org AS zk_org1  ON app1.Id = zk_org1.obj_application_Id
LEFT JOIN obj_organization          AS owner1   ON zk_org1.obj_org_owner_Id = owner1.Id
LEFT JOIN zk_application_owning_org AS zk_org2  ON app2.Id = zk_org2.obj_application_Id
LEFT JOIN obj_organization          AS owner2   ON zk_org2.obj_org_owner_Id = owner2.Id

-- LEFT JOIN zk_app_interfaces_pii    AS interpii   ON (inter.Source_app_Id = interpii.zk_application_interfaces_Source_app_Id and inter.Destination_application_Id = interpii.zk_application_interfaces_Destination_application_Id)
-- LEFT JOIN obj_pii_category AS pii                ON interpii.obj_pii_category_Id = pii.Id
