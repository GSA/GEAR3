SELECT DISTINCT invest.Id                         AS ID,
  invest.Keyname                                  AS Name,
  invest.Description,
  invest.Comments,
  invest.Active,
  invest.Budget_Year,
  invest.UII,
  invest.CreateDTG,
  invest.ChangeDTG,
  invest.CreateAudit,
  invest.ChangeAudit,
  invest.old_Id,
  obj_investment_type.Keyname                     AS Type,
  primary_service_area.Keyname                    AS PSA,
  sec_service_area1.Keyname                       AS SSA,
  sec_service_area2.Keyname                       AS sec_service_area2,
  sec_service_area3.Keyname                       AS sec_service_area3,
  sec_service_area4.Keyname                       AS sec_service_area4,
  obj_organization.Keyname                        AS SSO,
  obj_poc.Keyname                                 AS InvManager,
  obj_poc.Email                                   AS InvManagerEmail,
  concat_ws(',', obj_poc.Keyname, obj_poc.email)  AS POC

FROM obj_investment AS invest

  LEFT JOIN obj_poc                                       ON invest.obj_poc_Id = obj_poc.Id
  LEFT JOIN obj_investment_type                           ON invest.obj_investment_type_Id = obj_investment_type.Id
  LEFT JOIN obj_investment_cost                           ON invest.Id = obj_investment_cost.obj_investment_Id
  LEFT JOIN obj_organization                              ON invest.obj_organization_Id = obj_organization.Id
  LEFT JOIN obj_capability        AS primary_service_area ON invest.primary_service_area = primary_service_area.Id
  LEFT JOIN obj_capability        AS sec_service_area1    ON invest.sec_serv_area1 = sec_service_area1.Id
  LEFT JOIN obj_capability        AS sec_service_area2    ON invest.sec_serv_area2 = sec_service_area2.Id
  LEFT JOIN obj_capability        AS sec_service_area3    ON invest.sec_serv_area3 = sec_service_area3.Id
  LEFT JOIN obj_capability        AS sec_service_area4    ON invest.sec_serv_area4 = sec_service_area4.Id
  LEFT JOIN obj_investment_active AS invact               ON invest.Active = invact.Id