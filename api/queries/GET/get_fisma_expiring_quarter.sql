SELECT COUNT(*) AS Total
FROM obj_fisma_archer AS fisma
WHERE fisma.`ex:ATO_Expiration_Date` >= CURDATE() AND fisma.`ex:ATO_Expiration_Date` <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
    AND fisma.`ex:SystemLevel` = 'System'
    AND (fisma.`ex:Status` = 'Active' OR fisma.`ex:Status` = 'Pending');