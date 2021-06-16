SELECT
	Records_Id			              AS Rec_ID,
  Record_Status,
  RG,
  GSA_Number,
  Record_Item_Title,
  Description,
  Retention_Instructions,
  Legal_Disposition_Authority,
  Type_Disposition,
  Date_DA_Approved,
  Disposition_Notes,
  FP_Category,
  PII,
  CUI
    
FROM obj_records AS records