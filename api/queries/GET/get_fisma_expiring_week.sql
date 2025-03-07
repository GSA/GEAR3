SELECT COUNT(*) AS Total
FROM obj_fisma_archer AS fisma
WHERE fisma.`ex:Renewal_Date` BETWEEN now() AND DATE_ADD(now(), INTERVAL 7 DAY)
AND fisma.`ex:Renewal_Date` IS NOT NULL;