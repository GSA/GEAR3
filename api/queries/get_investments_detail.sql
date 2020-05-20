SELECT DISTINCT obj_investment.Id AS ID,
  obj_investment.Keyname AS Name,
  obj_investment.Description,
  obj_investment.Comments,
  invact.Keyname AS Active,
  obj_investment.Budget_Year,
  obj_investment.UII,
  obj_investment.CreateDTG,
  obj_investment.ChangeDTG,
  obj_investment.CreateAudit,
  obj_investment.ChangeAudit,
  obj_investment.old_Id,
  obj_investment_type.Keyname AS Type,
  primary_service_area.Keyname AS PSA,
  sec_service_area1.Keyname AS SSA,
  sec_service_area2.Keyname AS sec_service_area2,
  sec_service_area3.Keyname AS sec_service_area3,
  sec_service_area4.Keyname AS sec_service_area4,
  obj_organization.Keyname AS SSO,
  obj_poc.Keyname AS InvManager,
  obj_poc.Email AS InvManagerEmail,
  concat_ws(',', obj_poc.Keyname, obj_poc.email)  AS POC
   
FROM obj_investment

LEFT JOIN obj_poc ON obj_investment.obj_poc_Id = obj_poc.Id
LEFT JOIN obj_investment_type ON obj_investment.obj_investment_type_Id = obj_investment_type.Id
LEFT JOIN obj_investment_cost ON obj_investment.Id = obj_investment_cost.obj_investment_Id
LEFT JOIN obj_organization ON obj_investment.obj_organization_Id = obj_organization.Id
LEFT JOIN obj_capability AS primary_service_area ON obj_investment.primary_service_area = primary_service_area.Id
LEFT JOIN obj_capability AS sec_service_area1 ON obj_investment.sec_serv_area1 = sec_service_area1.Id
LEFT JOIN obj_capability AS sec_service_area2 ON obj_investment.sec_serv_area2 = sec_service_area2.Id
LEFT JOIN obj_capability AS sec_service_area3 ON obj_investment.sec_serv_area3 = sec_service_area3.Id
LEFT JOIN obj_capability AS sec_service_area4 ON obj_investment.sec_serv_area4 = sec_service_area4.Id
LEFT JOIN obj_investment_active AS invact ON obj_investment.Active = invact.Id

WHERE invact.Keyname <> 'No';