SELECT
  zk.obj_websites_id AS Website_ID,
  zk.obj_service_category_id AS Service_Category_ID,
  w.domain,
  w.contact_email,
  w.site_owner_email,
  w.office,
  w.sub_office,
  w.type_of_site,
  w.digital_brand_category
  FROM obj_websites as w
  INNER JOIN zk_websites_service_categories AS zk ON zk.obj_websites_id = w.id
