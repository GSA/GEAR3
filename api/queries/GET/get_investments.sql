SELECT DISTINCT invest.Investment_Id              AS ID,
  invest.Unique_Investment_Identifier             AS UII,
  invest.Investment_Name                          AS Name,
  invest.Description,
  invest.Budget_Year,
  invest.Cloud_Computing_Alternatives_Evaluation  AS Cloud_Alt,
  invest.Comments,
  invest.Investment_Start_Year                    AS Start_Year,
  invest.Investment_End_Year                      AS End_Year,
  invest.Investment_Manager_Name                  AS InvManager,
  invest.Investment_Status_Name                   AS Status,
  invest.Investment_Type                          AS Type,
  invest.IT_Portfolio,
  invest.primary_service_area                     AS PSA,
  invest.Updated_Date

FROM obj_investment AS invest
