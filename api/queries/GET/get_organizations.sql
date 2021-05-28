SELECT
  org.Id                    AS ID,
  org.Keyname               AS Name,
  org.Display_Name          AS DisplayName,
  parent.Keyname            AS Parent

FROM obj_organization       AS org

LEFT JOIN obj_organization  AS parent ON org.Parent_Id = parent.Id