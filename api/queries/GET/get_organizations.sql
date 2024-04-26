SELECT
  org.Organization_Id             AS ID,
  org.Organization_Name           AS Name,
  org.Display_Name                AS DisplayName,
  org.Org_Symbol                  AS OrgSymbol,
  org.SSO_Name                    AS SSOName,
  org.Org_Symbol_Two_Letter       AS TwoLetterOrgSymbol,
  org.Org_Symbol_Two_Letter_Name  AS TwoLetterOrgName,
  parent.Organization_Name        AS Parent,
  org.Parent_Id                   AS Parent_ID

FROM obj_organization             AS org

LEFT JOIN obj_organization        AS parent ON org.Parent_Id = parent.Organization_Id