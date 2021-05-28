SELECT
  cap.capability_Id       AS ID,
  cap.Capability_Name     AS Name,
  cap.Capability_Ref_Id   AS ReferenceNum,
  cap.Description,
  cap.Capability_Level    AS Level,
  parent.Capability_Name  AS Parent

FROM obj_capability       AS cap

LEFT JOIN obj_capability  AS parent ON cap.Parent_Id = parent.capability_Id