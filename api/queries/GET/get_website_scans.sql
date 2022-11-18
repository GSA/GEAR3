SELECT
	id			              AS Scan_ID,
  obj_website_id        AS Website_ID,
  desktop_img_file_name,
  mobile_img_file_name,
  scan_date,
  scan_version 
  FROM
  obj_website_scan AS scans

  