SELECT COUNT(CASE WHEN tech.obj_technology_status_Id = 13 
                    AND (tech.Approved_Status_Expiration_Date BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()) THEN 1
                ELSE NULL
             END) AS RetiredStandardsLastWeek,
       COUNT(CASE WHEN tech.obj_technology_status_Id = 13 
                         AND (tech.Approved_Status_Expiration_Date BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 MONTH) AND CURDATE()) THEN 1
                     ELSE NULL
              END) AS RetiredStandardsLastSixMonths
FROM gear_schema.obj_technology AS tech