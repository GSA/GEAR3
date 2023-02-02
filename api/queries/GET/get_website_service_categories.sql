SELECT
  zk.obj_websites_id AS website_id,
  zk.obj_service_category_id AS website_service_category_id,
  sc.name,
  sc.description
  FROM obj_service_category as sc
  INNER JOIN zk_websites_service_categories AS zk ON zk.obj_service_category_id = sc.id

  