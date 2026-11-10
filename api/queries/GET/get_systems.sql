SELECT
	systems.`ex:GEAR_ID`									                AS ID,
  
	systems.`ex:Responsible_Org`                        	AS RespOrg,
	systems_ext.Business_Org                            	AS BusOrg,
  org.Display_Name                                      AS BusOrgSymbolAndName,
	CASE  -- If there is no normalized name, use Archer's system name
    WHEN systems_ext.Normalized_Name IS NULL THEN systems.`ex:System_Name`
    ELSE systems_ext.Normalized_Name
  END                                                   AS Name,
  systems_ext.Display_Name					                    AS DisplayName,
  systems_ext.TIME_URL                                  AS TIME_URL,
  systems.`ex:FederalContractor`                      	AS FedContractorLoc,
  systems.`ex:FIPS_Impact_Level`                      	AS FIPS_Impact_Level,
  systems.`ex:BusinessApplication`						          AS BusApp,
  systems.`ex:ATOIATO_Date`                           	AS ATODate,
  systems.`ex:ATO_Type`                               	AS ATOType,
  systems.`ex:ATO_Expiration_Date`                      AS ATOExpirationDate,
  systems.`ex:Renewal_Date`                           	AS RenewalDate,
  systems.`ex:Complete_ASsessment_For_Current_FY_Text`	AS ComplFISMA,
  systems.`ex:PII`                                     	AS PII,
  systems.`ex:Cloud_Hosted`                            	AS CloudYN,
  systems.`ex:Hosting_Provider`                   	    AS CSP,
  systems.`ex:Type_of_Service`                         	AS ServiceType,
  systems.`ex:FISMA_System_Identifier`                 	AS FISMASystemIdentifier,
  systems.`ex:Status`                                   AS Status,
  systems.`ex:Inactive_Date`                           	AS InactiveDate,
  systems.`ex:Description`                             	AS Description,
  systems.`ex:SystemLevel`                             	AS SystemLevel,
  systems.`ex:Parent_Name`                              AS ParentName,
  systems.`ex:SubSystem_Identifier_Tag`                	AS SubSystem_Tag,
  systems.`ex:FISMA_Reportable`                        	AS Reportable,
  systems.`ex:Goverment_Wide_Shared_Service`            AS SharedService,
  systems.`ex:CUI`                                      AS CUI,
  systems.`ex:shadowbudget_alias`                       AS BudgetAlias,
  
  CONCAT_WS('*', CONCAT_WS(':', 'Authorizing Official', CONCAT_WS( '; ', CONCAT_WS(', ', `ex:Authorizing_Official_Full_Name`, `ex:Authorizing_Official_Email`, COALESCE(`ex:Authorizing_Official_Phone`, ''), COALESCE(ao_poc.OrgCode, ''), COALESCE(ao_org.Organization_Name, '')))) ,
  CONCAT_WS(':', 'System Owner',  CONCAT_WS( '; ',  CONCAT_WS(', ', `ex:System_Owner_Full_Name`, `ex:System_Owner_eMail`, COALESCE(`ex:System_Owner_Phone`, ''), COALESCE(so_poc.OrgCode, ''), COALESCE(so_org.Organization_Name, '')))) ,
  CONCAT_WS(':', 'ISSM',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ISSM_Full_Name`, `ex:ISSM_Email`, COALESCE(`ex:ISSM_Phone`, ''), COALESCE(issm_poc.OrgCode, ''), COALESCE(issm_org.Organization_Name, '')))),
  CONCAT_WS(':', 'ISSO',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ISSO_1_Full_Name`, `ex:ISSO_1_Email`, COALESCE(`ex:ISSO_1_Phone`, ''), COALESCE(isso1_poc.OrgCode, ''), COALESCE(isso1_org.Organization_Name, '')), CONCAT_WS(', ', `ex:ISSO_2_Full_Name`, `ex:ISSO_2_Email`, COALESCE(`ex:ISSO_2_Phone`, ''), COALESCE(isso2_poc.OrgCode, ''), COALESCE(isso2_org.Organization_Name, '')), CONCAT_WS(', ', `ex:ISSO_3_Full_Name`, `ex:ISSO_3_Email`, COALESCE(`ex:ISSO_3_Phone`, ''), COALESCE(isso3_poc.OrgCode, ''), COALESCE(isso3_org.Organization_Name, '')), CONCAT_WS(', ', `ex:ISSO_4_Full_Name`, `ex:ISSO_4_Email`, COALESCE(`ex:ISSO_4_Phone`, ''), COALESCE(isso4_poc.OrgCode, ''), COALESCE(isso4_org.Organization_Name, '')))),
  CONCAT_WS(':', 'CO',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:Contracting_Officer_1_Full_Name`, `ex:Contracting_Officer_1_eMail`, COALESCE(`ex:Contracting_Officer_1_Phone`, ''), COALESCE(co1_poc.OrgCode, ''), COALESCE(co1_org.Organization_Name, '')), CONCAT_WS(', ', `ex:Contracting_Officer_2_Full_Name`, `ex:Contracting_Officer_2_eMail`, COALESCE(`ex:Contracting_Officer_2_Phone`, ''), COALESCE(co2_poc.OrgCode, ''), COALESCE(co2_org.Organization_Name, '')))),
  CONCAT_WS(':', 'COR',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ContractingOfficer_Representative1_Name`, `ex:ContractingOfficer_Representative1_eMail`, COALESCE(`ex:ContractingOfficer_Representative1_Phone`, ''), COALESCE(cor1_poc.OrgCode, ''), COALESCE(cor1_org.Organization_Name, '')), CONCAT_WS(', ', `ex:ContractingOfficer_Representative2_Name`, `ex:ContractingOfficer_Representative2_eMail`, COALESCE(`ex:ContractingOfficer_Representative2_Phone`, ''), COALESCE(cor2_poc.OrgCode, ''), COALESCE(cor2_org.Organization_Name, '')))),
  CONCAT_WS(':', 'Business POC',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:BPOC_1__Full_Name`, `ex:BPOC_1__Email`, COALESCE(`ex:BPOC_1_Phone`, ''), COALESCE(bpoc1_poc.OrgCode, ''), COALESCE(bpoc1_org.Organization_Name, '')), CONCAT_WS(', ', `ex:BPOC_2__Full_Name`, `ex:BPOC_2__Email`, COALESCE(`ex:BPOC_2_Phone`, ''), COALESCE(bpoc2_poc.OrgCode, ''), COALESCE(bpoc2_org.Organization_Name, '')))),
  CONCAT_WS(':', 'Technical POC',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:TPOC_1__Full_Name`, `ex:TPOC_1__Email`, COALESCE(`ex:TPOC_1_Phone`, ''), COALESCE(tpoc1_poc.OrgCode, ''), COALESCE(tpoc1_org.Organization_Name, '')), CONCAT_WS(', ', `ex:TPOC_2__Full_Name`, `ex:TPOC_2__Email`, COALESCE(`ex:TPOC_2_Phone`, ''), COALESCE(tpoc2_poc.OrgCode, ''), COALESCE(tpoc2_org.Organization_Name, '')))),
  CONCAT_WS(':', 'Data Steward',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:Data_Steward_Full_Name`, `ex:Data_Steward_Email`, '', COALESCE(ds_poc.OrgCode, ''), COALESCE(ds_org.Organization_Name, '')))) ) AS POC ,

  CONCAT_WS(':', 'AO', CONCAT_WS(', ', `ex:Authorizing_Official_Full_Name`, `ex:Authorizing_Official_Email`, `ex:Authorizing_Official_Phone`)) AS AO,
  CONCAT_WS(':', 'SO', CONCAT_WS(', ', `ex:System_Owner_Full_Name`, `ex:System_Owner_eMail`, `ex:System_Owner_Phone`) ) AS SO,
  CONCAT_WS(':', 'ISSM', CONCAT_WS(', ', `ex:ISSM_Full_Name`, `ex:ISSM_Email`, `ex:ISSM_Phone`) ) AS ISSM,
  CONCAT_WS(':', 'ISSO',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ISSO_1_Full_Name`, `ex:ISSO_1_Email`, `ex:ISSO_1_Phone`), CONCAT_WS(', ', `ex:ISSO_2_Full_Name`, `ex:ISSO_2_Email`, `ex:ISSO_2_Phone`), CONCAT_WS(', ', `ex:ISSO_3_Full_Name`, `ex:ISSO_3_Email`, `ex:ISSO_3_Phone`), CONCAT_WS(', ', `ex:ISSO_4_Full_Name`, `ex:ISSO_4_Email`, `ex:ISSO_4_Phone`) ))  AS ISSO,

  CONCAT_WS(':', 'CO',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:Contracting_Officer_1_Full_Name`, `ex:Contracting_Officer_1_eMail`, `ex:Contracting_Officer_1_Phone`), CONCAT_WS(', ', `ex:Contracting_Officer_2_Full_Name`, `ex:Contracting_Officer_2_eMail`, `ex:Contracting_Officer_2_Phone`) ))  AS CO,
  CONCAT_WS(':', 'COR',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ContractingOfficer_Representative1_Name`, `ex:ContractingOfficer_Representative1_eMail`, `ex:ContractingOfficer_Representative1_Phone`), CONCAT_WS(', ', `ex:ContractingOfficer_Representative2_Name`, `ex:ContractingOfficer_Representative2_eMail`, `ex:ContractingOfficer_Representative2_Phone`) ))  AS COR,

  CONCAT_WS(':', 'BusPOC',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:BPOC_1__Full_Name`, `ex:BPOC_1__Email`, `ex:BPOC_1_Phone`), CONCAT_WS(', ', `ex:BPOC_2__Full_Name`, `ex:BPOC_2__Email`, `ex:BPOC_2_Phone`) ))  AS BusPOC,
  CONCAT_WS(':', 'TechPOC',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:TPOC_1__Full_Name`, `ex:TPOC_1__Email`, `ex:TPOC_1_Phone`), CONCAT_WS(', ', `ex:TPOC_2__Full_Name`, `ex:TPOC_2__Email`, `ex:TPOC_2_Phone`) ))  AS TechPOC,
  CONCAT_WS(':', 'DataSteward', CONCAT_WS(', ', `ex:Data_Steward_Full_Name`, `ex:Data_Steward_Email`) ) AS DataSteward,

  CONCAT_WS(',', `ex:Primary_Artifact_Name`,  `ex:Primary_Artifact_URL`) AS RelatedArtifacts

FROM gear_schema.obj_fisma_archer AS systems

LEFT JOIN gear_schema.obj_systems_subsystems AS systems_ext ON systems.`ex:GEAR_ID` = systems_ext.GEAR_ID
LEFT JOIN gear_schema.obj_organization as org ON org.Organization_Id = systems_ext.obj_org_SSO_Id
LEFT JOIN gear_schema.obj_ldap_poc AS ao_poc    ON LOWER(ao_poc.Email)   = LOWER(systems.`ex:Authorizing_Official_Email`)
LEFT JOIN gear_schema.obj_ldap_poc AS so_poc    ON LOWER(so_poc.Email)   = LOWER(systems.`ex:System_Owner_eMail`)
LEFT JOIN gear_schema.obj_ldap_poc AS issm_poc  ON LOWER(issm_poc.Email) = LOWER(systems.`ex:ISSM_Email`)
LEFT JOIN gear_schema.obj_ldap_poc AS isso1_poc ON LOWER(isso1_poc.Email) = LOWER(systems.`ex:ISSO_1_Email`)
LEFT JOIN gear_schema.obj_ldap_poc AS isso2_poc ON LOWER(isso2_poc.Email) = LOWER(systems.`ex:ISSO_2_Email`)
LEFT JOIN gear_schema.obj_ldap_poc AS isso3_poc ON LOWER(isso3_poc.Email) = LOWER(systems.`ex:ISSO_3_Email`)
LEFT JOIN gear_schema.obj_ldap_poc AS isso4_poc ON LOWER(isso4_poc.Email) = LOWER(systems.`ex:ISSO_4_Email`)
LEFT JOIN gear_schema.obj_ldap_poc AS co1_poc   ON LOWER(co1_poc.Email)  = LOWER(systems.`ex:Contracting_Officer_1_eMail`)
LEFT JOIN gear_schema.obj_ldap_poc AS co2_poc   ON LOWER(co2_poc.Email)  = LOWER(systems.`ex:Contracting_Officer_2_eMail`)
LEFT JOIN gear_schema.obj_ldap_poc AS cor1_poc  ON LOWER(cor1_poc.Email) = LOWER(systems.`ex:ContractingOfficer_Representative1_eMail`)
LEFT JOIN gear_schema.obj_ldap_poc AS cor2_poc  ON LOWER(cor2_poc.Email) = LOWER(systems.`ex:ContractingOfficer_Representative2_eMail`)
LEFT JOIN gear_schema.obj_ldap_poc AS bpoc1_poc ON LOWER(bpoc1_poc.Email) = LOWER(systems.`ex:BPOC_1__Email`)
LEFT JOIN gear_schema.obj_ldap_poc AS bpoc2_poc ON LOWER(bpoc2_poc.Email) = LOWER(systems.`ex:BPOC_2__Email`)
LEFT JOIN gear_schema.obj_ldap_poc AS tpoc1_poc ON LOWER(tpoc1_poc.Email) = LOWER(systems.`ex:TPOC_1__Email`)
LEFT JOIN gear_schema.obj_ldap_poc AS tpoc2_poc ON LOWER(tpoc2_poc.Email) = LOWER(systems.`ex:TPOC_2__Email`)
LEFT JOIN gear_schema.obj_ldap_poc AS ds_poc    ON LOWER(ds_poc.Email)   = LOWER(systems.`ex:Data_Steward_Email`)
LEFT JOIN gear_schema.obj_organization AS ao_org    ON ao_org.Org_Symbol    = ao_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS so_org    ON so_org.Org_Symbol    = so_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS issm_org  ON issm_org.Org_Symbol  = issm_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS isso1_org ON isso1_org.Org_Symbol = isso1_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS isso2_org ON isso2_org.Org_Symbol = isso2_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS isso3_org ON isso3_org.Org_Symbol = isso3_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS isso4_org ON isso4_org.Org_Symbol = isso4_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS co1_org   ON co1_org.Org_Symbol   = co1_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS co2_org   ON co2_org.Org_Symbol   = co2_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS cor1_org  ON cor1_org.Org_Symbol  = cor1_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS cor2_org  ON cor2_org.Org_Symbol  = cor2_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS bpoc1_org ON bpoc1_org.Org_Symbol = bpoc1_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS bpoc2_org ON bpoc2_org.Org_Symbol = bpoc2_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS tpoc1_org ON tpoc1_org.Org_Symbol = tpoc1_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS tpoc2_org ON tpoc2_org.Org_Symbol = tpoc2_poc.OrgCode
LEFT JOIN gear_schema.obj_organization AS ds_org    ON ds_org.Org_Symbol    = ds_poc.OrgCode