SELECT
  poc.SamAccountName                          AS SamAccountName,
  CONCAT_WS(' ', poc.FirstName, poc.LastName) AS Name,
  poc.Email                                   AS Email,
  poc.Phone                                   AS Phone,
  poc.OrgCode                                 AS Organization

FROM obj_ldap_poc                             AS poc
WHERE poc.Enabled = 'TRUE'