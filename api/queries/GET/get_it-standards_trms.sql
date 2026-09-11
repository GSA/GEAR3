SELECT
  tech.Id AS StandardId,
  IFNULL(tech.softwareReleaseName, tech.Keyname) AS StandardName,
  trm.Technology_Category_Id AS TRMId,
  trm.TRM_Name AS TRMName,
  trm.TRM_Area AS TRMArea,
  trm.TRM_Domain AS TRMDomain,
  trm.Description AS TRMDefinition,
  trm.TRM_Level AS TRMLevel,
  trm.TRM_Type AS TRMType,
  trm.FEA_Code AS FEACode,
  trm.obj_technology_category_Parent_Id AS ParentId
FROM obj_technology AS tech
INNER JOIN zk_technology_TRM AS ttrm ON tech.Id = ttrm.obj_technology_Id
INNER JOIN obj_TRM AS trm ON trm.Technology_Category_Id = ttrm.obj_TRM_Id
ORDER BY IFNULL(tech.softwareReleaseName, tech.Keyname), trm.TRM_Name;
