SELECT COUNT(CASE WHEN fisma.`ex:Status` = 'Inactive' THEN 1
              ELSE NULL
       END) AS RetiredTotal,
       COUNT(CASE WHEN fisma.`ex:Status` = 'Active' AND fisma.`ex:SystemLevel` = 'System' AND fisma.`ex:FISMA_Reportable` = 'Yes' THEN 1
              ELSE NULL
       END) AS AllTotal
FROM gear_schema.obj_fisma_archer AS fisma