SELECT
  trm.Technology_Category_Id AS Id,
  trm.TRM_Name AS Name,
  trm.TRM_Area AS Area,
  trm.TRM_Domain AS Domain,
  trm.Description,
  trm.TRM_Level AS Level,
  trm.TRM_Type AS Type,
  trm.FEA_Code AS FEACode,
  trm.obj_technology_category_Parent_Id AS ParentId,
  trm.CreateDTG,
  trm.ChangeDTG,
  trm.CreateAudit,
  trm.ChangeAudit
FROM obj_TRM AS trm