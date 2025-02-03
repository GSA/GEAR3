SELECT appBundle.Id, appBundle.Keyname
FROM obj_technology_app_bundle AS appBundle
WHERE appBundle.Id IN
	(SELECT matchBundle.obj_technology_app_bundle_Id
     FROM zk_technology_app_bundle AS matchBundle
