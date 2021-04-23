SELECT
  poc.SamAccountName                          AS SamAccountName,
  CONCAT_WS(' ', poc.FirstName, poc.LastName) AS Name,
  poc.Email                                   AS Email,
  poc.Phone                                   AS Phone,
  poc.OrgCode                                 AS Organization,
  userloc.Keyname                             AS RISSO_Region

FROM obj_ldap_poc                             AS poc

LEFT JOIN obj_userloc                         AS userloc  ON poc.RISSO = userloc.Id