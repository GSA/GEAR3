SELECT COUNT(*) AS Total
FROM obj_technology AS tech
WHERE tech.Approved_Status_Expiration_Date BETWEEN now() AND DATE_ADD(now(), INTERVAL 7 DAY)
AND tech.Approved_Status_Expiration_Date IS NOT NULL;