SELECT
	`ex:GEAR_ID`									                AS ID,
	`ex:Responsible_Org`                        	AS orgName,
	`ex:System_Name`                            	AS Name,
  `ex:FederalContractor`                      	AS FedContractorLoc,
  `ex:FIPS_Impact_Level`                      	AS FIPS_Impact_Level,
  `ex:ATOIATO_Date`                           	AS ATODate,
  `ex:ATO_Type`                               	AS ATOType,
  `ex:Renewal_Date`                           	AS RenewalDate,
  `ex:Complete_ASsessment_For_Current_FY_Text`	AS ComplFISMA,
  `ex:PII`                                     	AS PII,
  `ex:Cloud_Hosted`                            	AS CloudYN,
  `ex:Cloud_Server_Provider`                   	AS CSP,
  `ex:Type_of_Service`                         	AS ServiceType,
  `ex:FISMA_System_Identifier`                 	AS FISMASystemIdentifier,
  `ex:Status`                                   AS Status,
  `ex:Inactive_Date`                           	AS InactiveDate,
  `ex:Description`                             	AS Description,
  `ex:SystemLevel`                             	AS SystemLevel,
  `ex:Parent_Name`                              AS ParentName,
  `ex:SubSystem_Identifier_Tag`                	AS SubSystem_Tag,
  `ex:FISMA_Reportable`                        	AS Reportable,
  `ex:Goverment_Wide_Shared_Service`            AS SharedService,

  CONCAT_WS('*', CONCAT_WS(':', 'Authorizing Official', CONCAT_WS( '; ', CONCAT_WS(', ', `ex:Authorizing_Official_Full_Name`, `ex:Authorizing_Official_Email`, `ex:Authorizing_Official_Phone`))) ,
  CONCAT_WS(':', 'System Owner',  CONCAT_WS( '; ',  CONCAT_WS(', ', `ex:System_Owner_Full_Name`, `ex:System_Owner_eMail`, `ex:System_Owner_Phone`))) ,
  CONCAT_WS(':', 'ISSM',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ISSM_Full_Name`, `ex:ISSM_Email`, `ex:ISSM_Phone`))),
  CONCAT_WS(':', 'ISSO',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ISSO_1_Full_Name`, `ex:ISSO_1_Email`, `ex:ISSO_1_Phone`), CONCAT_WS(', ', `ex:ISSO_2_Full_Name`, `ex:ISSO_2_Email`, `ex:ISSO_2_Phone`), CONCAT_WS(', ', `ex:ISSO_3_Full_Name`, `ex:ISSO_3_Email`, `ex:ISSO_3_Phone`), CONCAT_WS(', ', `ex:ISSO_4_Full_Name`, `ex:ISSO_4_Email`, `ex:ISSO_4_Phone`))),
  CONCAT_WS(':', 'CO',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:Contracting_Officer_1_Full_Name`, `ex:Contracting_Officer_1_eMail`, `ex:Contracting_Officer_1_Phone`), CONCAT_WS(', ', `ex:Contracting_Officer_2_Full_Name`, `ex:Contracting_Officer_2_eMail`, `ex:Contracting_Officer_2_Phone`))),
  CONCAT_WS(':', 'COR',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ContractingOfficer_Representative1_Name`, `ex:ContractingOfficer_Representative1_eMail`, `ex:ContractingOfficer_Representative1_Phone`), CONCAT_WS(', ', `ex:ContractingOfficer_Representative2_Name`, `ex:ContractingOfficer_Representative2_eMail`, `ex:ContractingOfficer_Representative2_Phone`))),
  CONCAT_WS(':', 'Business POC',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:BPOC_1_Full_Name`, `ex:BPOC_1_Email`, `ex:BPOC_1_Phone`), CONCAT_WS(', ', `ex:BPOC_2_Full_Name`, `ex:BPOC_2_Email`, `ex:BPOC_2_Phone`))),
  CONCAT_WS(':', 'Technical POC',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:TPOC_1_Full_Name`, `ex:TPOC_1_Email`, `ex:TPOC_1_Phone`), CONCAT_WS(', ', `ex:BPOC_2_Full_Name`, `ex:BPOC_2_Email`, `ex:BPOC_2_Phone`))) ) AS POC,

  CONCAT_WS(':', 'AO', GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', `ex:Authorizing_Official_Full_Name`, `ex:Authorizing_Official_Email`, `ex:Authorizing_Official_Phone`) SEPARATOR '; ')) AS AO,
  CONCAT_WS(':', 'SO', GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', `ex:System_Owner_Full_Name`, `ex:System_Owner_eMail`, `ex:System_Owner_Phone`) SEPARATOR '; ')) AS SO,
  CONCAT_WS(':', 'ISSM', GROUP_CONCAT(DISTINCT  CONCAT_WS(', ', `ex:ISSM_Full_Name`, `ex:ISSM_Email`, `ex:ISSM_Phone`) SEPARATOR '; ')) AS ISSM,
  CONCAT_WS(':', 'ISSO',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ISSO_1_Full_Name`, `ex:ISSO_1_Email`, `ex:ISSO_1_Phone`), CONCAT_WS(', ', `ex:ISSO_2_Full_Name`, `ex:ISSO_2_Email`, `ex:ISSO_2_Phone`), CONCAT_WS(', ', `ex:ISSO_3_Full_Name`, `ex:ISSO_3_Email`, `ex:ISSO_3_Phone`), CONCAT_WS(', ', `ex:ISSO_4_Full_Name`, `ex:ISSO_4_Email`, `ex:ISSO_4_Phone`) ))  AS ISSO,

  CONCAT_WS(':', 'CO',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:Contracting_Officer_1_Full_Name`, `ex:Contracting_Officer_1_eMail`, `ex:Contracting_Officer_1_Phone`), CONCAT_WS(', ', `ex:Contracting_Officer_2_Full_Name`, `ex:Contracting_Officer_2_eMail`, `ex:Contracting_Officer_2_Phone`) ))  AS CO,
  CONCAT_WS(':', 'COR',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:ContractingOfficer_Representative1_Name`, `ex:ContractingOfficer_Representative1_eMail`, `ex:ContractingOfficer_Representative1_Phone`), CONCAT_WS(', ', `ex:ContractingOfficer_Representative2_Name`, `ex:ContractingOfficer_Representative2_eMail`, `ex:ContractingOfficer_Representative2_Phone`) ))  AS COR,

  CONCAT_WS(':', 'BusPOC',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:BPOC_1_Full_Name`, `ex:BPOC_1_Email`, `ex:BPOC_1_Phone`), CONCAT_WS(', ', `ex:BPOC_2_Full_Name`, `ex:BPOC_2_Email`, `ex:BPOC_2_Phone`) ))  AS BusPOC,
  CONCAT_WS(':', 'TechPOC',  CONCAT_WS( '; ', CONCAT_WS(', ', `ex:TPOC_1_Full_Name`, `ex:TPOC_1_Email`, `ex:TPOC_1_Phone`), CONCAT_WS(', ', `ex:BPOC_2_Full_Name`, `ex:BPOC_2_Email`, `ex:BPOC_2_Phone`) ))  AS TechPOC,

  GROUP_CONCAT(DISTINCT concat_ws(',', `ex:Primary_Artifact_Name`,  `ex:Primary_Artifact_URL`) SEPARATOR ';') AS RelatedArtifacts
    
FROM obj_fisma_archer AS archer