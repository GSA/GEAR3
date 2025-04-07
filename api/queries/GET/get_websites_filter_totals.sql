SELECT COUNT(CASE WHEN websites.`production_status` = 'decommissioned' THEN 1
              ELSE NULL
       END) AS DecommissionedTotal,
       COUNT(CASE WHEN websites.`production_status` = 'redirect' THEN 1
              ELSE NULL
       END) AS RedirectsTotal,
       COUNT(CASE WHEN websites.`digital_brand_category` = 'External' THEN 1
              ELSE NULL
       END) AS ExternalTotal,
       COUNT(CASE WHEN websites.`production_status` = 'production' AND websites.`digital_brand_category` != 'External' AND
              (websites.`type_of_site` = 'Informational' OR websites.`type_of_site` = 'Application' OR websites.`type_of_site` = 'Application Login') THEN 1
              ELSE NULL
       END) AS AllTotal
FROM gear_schema.obj_websites AS websites