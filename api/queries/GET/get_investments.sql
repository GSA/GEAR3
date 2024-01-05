SELECT DISTINCT invest.Investment_Id                      AS ID,
  invest.Unique_Investment_Identifier                     AS UII,
  invest.Investment_Name                                  AS Name,
  invest.Description,
  invest.Budget_Year,
  invest.Cloud_Computing_Alternatives_Evaluation          AS Cloud_Alt,
  invest.Comments,
  invest.Investment_Start_Year                            AS Start_Year,
  invest.Investment_End_Year                              AS End_Year,
  invest.Investment_Manager_Name                          AS InvManager,
  invest.Investment_Status_Name                           AS Status,
  invest.Investment_Type                                  AS Type,
  invest.IT_Portfolio,
  REGEXP_REPLACE(invest.primary_service_area, '[0-9]+ - ', '')  AS PSA,  -- Remove Leading Numbers
  invest.Updated_Date,

  invest.`Total IT Spending (PY) ($ M)`            AS Total_Spend_PY,
  invest.`Total IT Spending (CY) ($ M)`            AS Total_Spend_CY,
  invest.`Total IT Spending (BY) ($ M)`            AS Total_Spend_BY,
  invest.`DME PY Agency Funding ($ M)`                    AS DME_Agency_Fund_PY,
  invest.`DME PY Contributions ($ M)`                     AS DME_Contributions_PY,
  invest.`DME CY Agency Funding ($ M)`                    AS DME_Agency_Fund_CY,
  invest.`DME CY Contributions ($ M)`                     AS DME_Contributions_CY,
  invest.`DME BY Agency Funding ($ M)`                    AS DME_Agency_Fund_BY,
  invest.`DME BY Contributions ($ M)`                     AS DME_Contributions_BY,
  invest.`DME BY Budget Authority Agency Funding ($ M)`   AS DME_Budget_Auth_BY,
  invest.`O&M PY Agency Funding ($ M)`                    AS OnM_Agency_Fund_PY,
  invest.`O&M PY Contributions ($ M)`                     AS OnM_Contributions_PY,
  invest.`O&M CY Agency Funding ($ M)`                    AS OnM_Agency_Fund_CY,
  invest.`O&M CY Contributions ($ M)`                     AS OnM_Contributions_CY,
  invest.`O&M BY Agency Funding ($ M)`                    AS OnM_Agency_Fund_BY,
  invest.`O&M BY Contributions ($ M)`                     AS OnM_Contributions_BY,
  invest.`O&M BY Budget Authority Agency Funding ($ M)`   AS OnM_Budget_Auth_BY

FROM obj_investments AS invest
