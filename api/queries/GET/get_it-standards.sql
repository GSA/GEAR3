SELECT
  tech.Id                                         AS ID,
  -- tech.Keyname                          AS Name,
  IFNULL(tech.softwareReleaseName, tech.Keyname)  AS Name,
  tech.Description,
  tech.Approved_Status_Expiration_Date            AS ApprovalExpirationDate,
  tech.Vendor_Standard_Organization,
  tech.Available_through_Myview,
  tech.Gold_Image,
  obj_attestation_status_type.Keyname                       AS attestation_required,
  tech.fedramp,
  tech.open_source,
  tech.RITM,
  tech.Gold_Image_Comment,
  tech.attestation_link,
  tech.Comments,
  tech.old_Id,
  tech.Reference_Documents                        AS ReferenceDocument,
  tech.CreateDTG,
  tech.ChangeDTG,

  tech.manufacturer                               AS Manufacturer,
  tech.softwareProduct                            AS SoftwareProduct,
  tech.softwareVersion                            AS SoftwareVersion,
  tech.softwareRelease                            AS SoftwareRelease,
  tech.manufacturerName                           AS ManufacturerName,
  tech.softwareProductName                        AS SoftwareProductName,
  tech.softwareVersionName                        AS SoftwareVersionName,
  tech.softwareReleaseName                        AS SoftwareReleaseName,
  IFNULL(CONCAT(tech.manufacturerName, ' ', tech.softwareProductName), tech.Keyname) AS ManufacturerSoftwareProductName,

  obj_technology_status.Keyname                   AS Status,
  obj_deployment_type.Keyname                     AS DeploymentType,
  obj_standard_type.Keyname                       AS StandardType,
  obj_508_compliance_status.Keyname               AS ComplianceStatus,
  GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', CONCAT(poc.FirstName, ' ', poc.LastName), poc.Email, org.Display_Name) SEPARATOR '; ')     AS POC,
  GROUP_CONCAT(DISTINCT obj_standard_category.Keyname SEPARATOR ', ')   AS Category,
  tech.Keyname                                    AS OldName,
  DATE(tech.endOfLifeDate)                        AS EndOfLifeDate,
  tech.approvedVersions                           AS ApprovedVersions,
  GROUP_CONCAT(DISTINCT OS.Keyname SEPARATOR ', ') 		  AS OperatingSystems,
  GROUP_CONCAT(DISTINCT BUNDLE.Keyname SEPARATOR ', ') 	  AS AppBundleIds
FROM obj_technology AS tech

LEFT JOIN obj_technology_status               ON tech.obj_technology_status_Id = obj_technology_status.Id
LEFT JOIN obj_deployment_type                 ON tech.obj_deployment_type_Id = obj_deployment_type.Id
LEFT JOIN obj_standard_type                   ON tech.obj_standard_type_Id = obj_standard_type.Id
LEFT JOIN obj_508_compliance_status           ON tech.obj_508_compliance_status_Id = obj_508_compliance_status.Id

LEFT JOIN zk_technology_poc                   ON tech.Id = zk_technology_poc.obj_technology_Id
LEFT JOIN obj_ldap_poc           AS poc       ON zk_technology_poc.obj_ldap_SamAccountName = poc.SamAccountName
LEFT JOIN obj_organization      AS org        ON poc.OrgCode = org.Org_Symbol

LEFT JOIN zk_technology_standard_category     ON tech.Id = zk_technology_standard_category.obj_technology_Id
LEFT JOIN obj_standard_category               ON zk_technology_standard_category.obj_standard_category_Id = obj_standard_category.Id
LEFT JOIN obj_attestation_status_type         ON tech.attestation_required = obj_attestation_status_type.Id
LEFT JOIN zk_technology_operating_system      ON tech.Id = zk_technology_operating_system.obj_technology_Id
LEFT JOIN obj_operating_system		AS OS	  ON zk_technology_operating_system.obj_operating_system_Id = OS.Id
LEFT JOIN zk_technology_app_bundle			  ON tech.Id = zk_technology_app_bundle.obj_technology_Id
LEFT JOIN obj_technology_app_bundle AS BUNDLE ON zk_technology_app_bundle.obj_technology_app_bundle_Id = BUNDLE.Id
