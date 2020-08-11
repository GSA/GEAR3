SELECT 
  tech.Id                               AS ID,
  tech.Keyname                          AS Name,
  tech.Description,
  tech.Approved_Status_Expiration_Date  AS ApprovalExpirationDate,
  tech.Vendor_Standard_Organization,
  tech.Available_through_Myview,
  tech.Gold_Image,
  tech.Gold_Image_Comment,
  tech.Comments,
  tech.old_Id,
  tech.Reference_Documents              AS ReferenceDocument,
  tech.CreateDTG,
  tech.ChangeDTG,

  obj_technology_status.Keyname         AS Status,
  obj_deployment_type.Keyname           AS DeploymentType,
  obj_standard_type.Keyname             AS StandardType,
  obj_508_compliance_status.Keyname     AS ComplianceStatus,
  GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', poc.Keyname, poc.Email, org.Display_Name) SEPARATOR '; ')     AS POC,
  GROUP_CONCAT(DISTINCT obj_standard_category.Keyname SEPARATOR ', ')   AS Category

FROM obj_technology AS tech

  LEFT JOIN obj_technology_status               ON tech.obj_technology_status_Id = obj_technology_status.Id
  LEFT JOIN obj_deployment_type                 ON tech.obj_deployment_type_Id = obj_deployment_type.Id
  LEFT JOIN obj_standard_type                   ON tech.obj_standard_type_Id = obj_standard_type.Id
  LEFT JOIN obj_508_compliance_status           ON tech.obj_508_compliance_status_Id = obj_508_compliance_status.Id
    
  LEFT JOIN zk_technology_poc                   ON tech.Id = zk_technology_poc.obj_technology_Id
  LEFT JOIN obj_poc           AS poc            ON zk_technology_poc.obj_poc_Id = poc.Id
  LEFT JOIN obj_organization  AS org            ON poc.obj_organization_Id = org.Id

  LEFT JOIN zk_technology_standard_category     ON tech.Id = zk_technology_standard_category.obj_technology_Id
  LEFT JOIN obj_standard_category               ON zk_technology_standard_category.obj_standard_category_Id = obj_standard_category.Id

  LEFT JOIN zk_application_technology           ON tech.Id = zk_application_technology.obj_technology_Id
  LEFT JOIN obj_application   AS app            ON zk_application_technology.obj_application_Id = app.Id