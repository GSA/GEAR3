SELECT
  tech.Id                                         AS ID,
  IFNULL(tech.softwareReleaseName, tech.Keyname)  AS Name,
  tech.Description,
  GROUP_CONCAT(DISTINCT obj_standard_category.Keyname SEPARATOR ', ')   AS Category,
  obj_technology_status.Keyname                   AS Status,
  obj_deployment_type.Keyname                     AS DeploymentType,
  DATE(tech.Approved_Status_Expiration_Date)      AS ApprovalExpirationDate,
  tech.approvedVersions                           AS ApprovedVersions,
  DATE(tech.CreateDTG)                            AS DateCreated

FROM obj_technology AS tech

LEFT JOIN obj_technology_status               ON tech.obj_technology_status_Id = obj_technology_status.Id
LEFT JOIN obj_deployment_type                 ON tech.obj_deployment_type_Id = obj_deployment_type.Id

LEFT JOIN zk_technology_standard_category     ON tech.Id = zk_technology_standard_category.obj_technology_Id
LEFT JOIN obj_standard_category               ON zk_technology_standard_category.obj_standard_category_Id = obj_standard_category.Id