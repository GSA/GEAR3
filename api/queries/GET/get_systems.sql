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
  
  CONCAT_WS('*', CONCAT_WS(':', 'Authorizing Official', CONCAT_WS( '; ', CONCAT_WS(', ', `ex:Authorizing_Official_Full_Name`, `ex:Authorizing_Official_Email`, `ex:Authorizing_Official_Phone`))) ,
  CONCAT_WS(':', 'System Owner',  CONCAT_WS( '; ',  CONCAT_WS(', ', `ex:System_Owner_Full_Name`, `ex:System_Owner_eMail`, `ex:System_Owner_Phone`))) ,
  CONCAT_WS(':', 'ISSM',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ISSM_Full_Name`, `ex:ISSM_Email`, `ex:ISSM_Phone`))),
  CONCAT_WS(':', 'ISSO',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ISSO_1_Full_Name`, `ex:ISSO_1_Email`, `ex:ISSO_1_Phone`), CONCAT_WS(', ', `ex:ISSO_2_Full_Name`, `ex:ISSO_2_Email`, `ex:ISSO_2_Phone`), CONCAT_WS(', ', `ex:ISSO_3_Full_Name`, `ex:ISSO_3_Email`, `ex:ISSO_3_Phone`), CONCAT_WS(', ', `ex:ISSO_4_Full_Name`, `ex:ISSO_4_Email`, `ex:ISSO_4_Phone`))),
  CONCAT_WS(':', 'CO',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:Contracting_Officer_1_Full_Name`, `ex:Contracting_Officer_1_eMail`, `ex:Contracting_Officer_1_Phone`), CONCAT_WS(', ', `ex:Contracting_Officer_2_Full_Name`, `ex:Contracting_Officer_2_eMail`, `ex:Contracting_Officer_2_Phone`))),
  CONCAT_WS(':', 'COR',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ContractingOfficer_Representative1_Name`, `ex:ContractingOfficer_Representative1_eMail`, `ex:ContractingOfficer_Representative1_Phone`), CONCAT_WS(', ', `ex:ContractingOfficer_Representative2_Name`, `ex:ContractingOfficer_Representative2_eMail`, `ex:ContractingOfficer_Representative2_Phone`))),
  CONCAT_WS(':', 'Business POC',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:BPOC_1__Full_Name`, `ex:BPOC_1__Email`, `ex:BPOC_1_Phone`), CONCAT_WS(', ', `ex:BPOC_2__Full_Name`, `ex:BPOC_2__Email`, `ex:BPOC_2_Phone`))),
  CONCAT_WS(':', 'Technical POC',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:TPOC_1__Full_Name`, `ex:TPOC_1__Email`, `ex:TPOC_1_Phone`), CONCAT_WS(', ', `ex:TPOC_2__Full_Name`, `ex:TPOC_2__Email`, `ex:TPOC_2_Phone`))),
  CONCAT_WS(':', 'Data Steward',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:Data_Steward_Full_Name`, `ex:Data_Steward_Email`))) ) AS POC ,

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