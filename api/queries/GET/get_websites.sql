SELECT
	id			              AS Website_ID,
  domain,
  parent_domain,
  office,
  sub_office,
  contact_email,
  site_owner_email,
  production_status,
  type_of_site,
  redirects_to,
  cms_platform,
  required_by_law_or_policy,
  has_dap,
  current_uswds_score,
  mobile_friendly,
  has_search,
  repository_url,
  hosting_platform,
  https
    
FROM obj_websites AS websites