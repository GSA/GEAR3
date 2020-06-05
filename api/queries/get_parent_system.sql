Select 
  parentSys.Id              AS ID,
  parentSys.Keyname         AS Name,
  parentSys.Description     AS Description,
  parentSys.URL,
  parentSys.old_Id,
  parentSys.CreateDTG,
  parentSys.ChangeDTG,
  org.Keyname               AS SSO
   
FROM obj_parent_system      AS parentSys

LEFT JOIN obj_organization  AS org          ON parentSys.obj_organization_Id = org.Id

WHERE parentSys.ps_status <> 'Retired'