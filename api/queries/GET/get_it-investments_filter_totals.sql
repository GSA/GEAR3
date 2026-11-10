SELECT COUNT(CASE WHEN investments.`Investment_Status_Name` LIKE '%eliminated%' THEN 1
                ELSE NULL
             END) AS EliminatedTotal,
       COUNT(*) AS AllTotal
FROM gear_schema.obj_investments AS investments