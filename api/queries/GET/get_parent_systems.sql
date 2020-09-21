SELECT
  parentSys.Id                AS ID,
  parentSys.Keyname           AS Name,
  parentSys.Description       AS Description,
  parentSys.URL,
  parentSys.ps_status         AS Status,
  parentSys.old_Id,
  parentSys.CreateDTG,
  parentSys.ChangeDTG,
  org.Keyname                 AS SSO

FROM obj_parent_system        AS parentSys

LEFT JOIN obj_organization  AS org ON parentSys.obj_organization_Id = org.Id