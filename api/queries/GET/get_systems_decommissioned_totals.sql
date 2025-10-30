SELECT COUNT(CASE WHEN systems.`ex:Status` = 'Inactive' 
                    AND (systems.`ex:ATO_Expiration_Date` <= CURDATE() AND systems.`ex:ATO_Expiration_Date` >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN 1
                ELSE NULL
             END) AS DecommissionedSystemsLastMonth,
       COUNT(CASE WHEN (systems.`ex:Status` = 'Inactive'
                    AND systems.`ex:ATO_Expiration_Date` <= CURDATE() AND systems.`ex:ATO_Expiration_Date` >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)) THEN 1
                ELSE NULL
              END) AS DecommissionedSystemsLastSixMonths
FROM gear_schema.obj_fisma_archer AS systems