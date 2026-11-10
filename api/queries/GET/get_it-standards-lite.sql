SELECT
  tech.Id                                         AS ID,
  IFNULL(tech.softwareReleaseName, tech.Keyname)  AS Name,
  obj_technology_status.Keyname                   AS Status
FROM obj_technology AS tech
LEFT JOIN obj_technology_status               ON tech.obj_technology_status_Id = obj_technology_status.Id
WHERE obj_technology_status.Keyname = 'Approved'
GROUP BY tech.Id
ORDER BY IFNULL(tech.softwareReleaseName, tech.Keyname);