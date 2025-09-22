SELECT COUNT(CASE WHEN tech.obj_technology_status_Id = 13 
                    AND (tech.Approved_Status_Expiration_Date BETWEEN now() AND DATE_ADD(now(), INTERVAL 7 DAY)) THEN 1
                ELSE NULL
             END) AS RetiredStandardsLastWeek,
       COUNT(CASE WHEN tech.obj_technology_status_Id = 13 
                         AND (tech.Approved_Status_Expiration_Date BETWEEN now() AND DATE_ADD(now(), INTERVAL 6 MONTH)) THEN 1
                     ELSE NULL
              END) AS RetiredStandardsLastSixMonths
FROM gear_schema.obj_technology AS tech