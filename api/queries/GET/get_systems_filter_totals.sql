SELECT COUNT(CASE WHEN systems.`ex:Status` = 'Active' AND systems.`ex:BusinessApplication` = 'Yes' AND systems.`ex:Cloud_Hosted` = 'Yes' THEN 1
                ELSE NULL
             END) AS CloudEnabledTotal,
       COUNT(CASE WHEN systems.`ex:Status` = 'Inactive' AND systems.`ex:BusinessApplication` = 'Yes' THEN 1
                     ELSE NULL
              END) AS InactiveTotal,
       COUNT(CASE WHEN systems.`ex:Status` = 'Active' AND systems.`ex:BusinessApplication` = 'Yes' THEN 1
                     ELSE NULL
              END) AS AllTotal
FROM gear_schema.obj_fisma_archer AS systems