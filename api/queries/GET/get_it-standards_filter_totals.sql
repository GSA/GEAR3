SELECT COUNT(CASE WHEN obj_technology_status.Keyname = 'Approved' THEN 1
                ELSE NULL
             END) AS ApprovedTotal,
       COUNT(CASE WHEN obj_technology_status.Keyname = 'Denied' THEN 1
                   ELSE NULL
              END) AS DeniedTotal,
       COUNT(CASE WHEN obj_technology_status.Keyname = 'Retired' THEN 1
              ELSE NULL
              END) AS RetiredTotal,
       COUNT(*) AS AllTotal
FROM obj_technology AS tech
LEFT JOIN obj_technology_status   ON tech.obj_technology_status_Id = obj_technology_status.Id
LEFT JOIN obj_standard_type       ON tech.obj_standard_type_Id = obj_standard_type.Id
WHERE obj_standard_type.Keyname LIKE 'Software'
AND obj_technology_status.Keyname NOT LIKE 'Not yet submitted'