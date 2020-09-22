SELECT
	records.Title							        AS RecordTitle,
  records.Description,
  items.Record_Format						    AS RecordFormat,
  items.Record_Location					    AS RecordLocation,
  records.Disposition_Instructions	AS DispositionInstructions,
  records.Disposition_Authority			AS DispositionAuthority,
  records.GRS_Record						    AS GRSRecord,
  records.PII,
  records.CUI,
  records.Subject,
  records.Notes,
  
  org.Keyname								        AS Org,
  poc.Keyname								        AS POC,
  poc.Email								          AS POCEmail,

  records.ChangeDTG

FROM cowboy_ods.obj_oas_items       AS items

LEFT JOIN obj_oas_records           AS records  ON items.obj_oas_records_Id = records.Id
LEFT JOIN obj_organization          AS org      ON items.obj_organization_Id = org.Id
LEFT JOIN obj_poc                   AS poc      ON items.obj_poc_Id = poc.Id