SELECT COUNT(CASE WHEN systems.`ex:Status` = 'Inactive' 
                    AND systems.`ex:BusinessApplication` = 'Yes' 
                    AND (systems.`ex:ATO_Expiration_Date` BETWEEN now() AND DATE_ADD(now(), INTERVAL 7 DAY)) THEN 1
                ELSE NULL
             END) AS DecommissionedSystemsLastWeek,
       COUNT(CASE WHEN systems.`ex:Status` = 'Inactive'
                         AND systems.`ex:BusinessApplication` = 'Yes'
                         AND (systems.`ex:ATO_Expiration_Date` BETWEEN now() AND DATE_ADD(now(), INTERVAL 6 MONTH)) THEN 1
                     ELSE NULL
              END) AS DecommissionedSystemsLastSixMonths
FROM gear_schema.obj_fisma_archer AS systems