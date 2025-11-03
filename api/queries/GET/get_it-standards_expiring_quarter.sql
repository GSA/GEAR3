SELECT COUNT(*) AS Total
FROM obj_technology AS tech
WHERE tech.Approved_Status_Expiration_Date >= CURDATE() AND tech.Approved_Status_Expiration_Date <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
        AND (tech.obj_technology_status_Id = 11 
            OR tech.obj_technology_status_Id = 2 
            OR tech.obj_technology_status_Id = 6 
            OR tech.obj_technology_status_Id = 9);  -- accounting for any status that is technically approved (Approved, Pilot, Exception, Sunsetting)