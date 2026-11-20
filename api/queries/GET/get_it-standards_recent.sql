SELECT
  tech.Id                                         AS ID,
  IFNULL(tech.softwareReleaseName, tech.Keyname)  AS Name,
  tech.Description,
  -- Each TRM entry is "Domain > Area > Name"; entries are separated by '|' because TRM names can contain commas
  NULLIF(GROUP_CONCAT(DISTINCT CONCAT_WS(' > ', NULLIF(obj_TRM.TRM_Domain, ''), NULLIF(obj_TRM.TRM_Area, ''), obj_TRM.TRM_Name)
                      ORDER BY obj_TRM.TRM_Name SEPARATOR '|'), '')  AS Category,
  obj_technology_status.Keyname                   AS Status,
  obj_deployment_type.Keyname                     AS DeploymentType,
  DATE(tech.Approved_Status_Expiration_Date)      AS ApprovalExpirationDate,
  tech.approvedVersions                           AS ApprovedVersions,
  DATE(tech.CreateDTG)                            AS DateCreated

FROM obj_technology AS tech

LEFT JOIN obj_technology_status               ON tech.obj_technology_status_Id = obj_technology_status.Id
LEFT JOIN obj_deployment_type                 ON tech.obj_deployment_type_Id = obj_deployment_type.Id

LEFT JOIN zk_technology_TRM                   ON tech.Id = zk_technology_TRM.obj_technology_Id
LEFT JOIN obj_TRM                             ON zk_technology_TRM.obj_TRM_Id = obj_TRM.Technology_Category_Id