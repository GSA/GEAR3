SELECT 
  cap.Id                  AS ID,
  cap.Keyname             AS Name,
  cap.Description, 
  cap.ReferenceNumber     AS ReferenceNum,
  parent.Keyname          AS Parent,
  cap.old_Id

FROM obj_capability       AS cap

LEFT JOIN obj_capability  AS parent ON cap.Parent_Id = parent.Id