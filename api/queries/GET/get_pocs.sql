SELECT
  poc.Id                      AS ID,
  poc.Keyname                 AS Name,
  poc.Email                   AS Email,
  poc.PhNum                   AS Phone,
  userloc.Keyname             AS RISSO_Region,
  obj_organization.Keyname    AS Organization

FROM obj_poc AS poc

  LEFT JOIN obj_organization              ON poc.obj_organization_Id = obj_organization.Id
  LEFT JOIN obj_userloc       AS userloc  ON poc.RISSO = userloc.Id