SELECT
  cap.Id                                                  AS ID,
  cap.Keyname                                             AS Name,
  cap.Description, 
  cap.ReferenceNumber                                     AS ReferenceNum,
  parent.Keyname                                          AS ParentCap,
  GROUP_CONCAT(DISTINCT org.Display_Name SEPARATOR ', ')  AS Organizations,
  GROUP_CONCAT(DISTINCT app.Display_Name SEPARATOR ', ')  AS Applications

FROM obj_capability AS cap

LEFT JOIN obj_capability          AS parent     ON parent.Id = cap.Parent_Id
LEFT JOIN zk_app_capabilities                   ON cap.Id = zk_app_capabilities.obj_capability_Id
LEFT JOIN obj_application         AS app        ON zk_app_capabilities.obj_application_Id = app.Id
LEFT JOIN obj_application_status  AS appStatus  ON app.obj_application_status_Id = appStatus.Id
LEFT JOIN obj_organization        AS org        ON app.obj_org_SSO_Id = org.Id

WHERE org.Display_name LIKE ? AND cap.ReferenceNumber IS NOT NULL AND appStatus.Keyname <> 'Retired'
GROUP BY cap.Id;