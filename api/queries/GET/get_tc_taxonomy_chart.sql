SELECT 
	subcategory AS child,
    IF(category="",categoryGroup,category) AS parent,
    id AS ID,
    categoryId AS CategoryId,
    categoryGroup AS CategoryGroup,
    description AS Description,
    softwareOrHardware AS SoftwareOrHardware    
FROM tech_catalog.tp_Taxonomy    
	WHERE softwareOrHardware = "Software" OR softwareOrHardware = "Cloud"
UNION 
SELECT DISTINCT
	categoryGroup as child,
   "Tech Capability" as parent, 
    "" AS ID,
    "" AS CategoryId,
    "" AS CategoryGroup,
    "" AS Description,
    "" AS SoftwareOrHardware    
FROM tech_catalog.tp_Taxonomy
    WHERE category = "" AND softwareOrHardware = "Software" OR softwareOrHardware = "Cloud"
UNION 
SELECT
	"Tech Capability" as child,
    "" as parent,
    "" AS ID,
    "" AS CategoryId,
    "" AS CategoryGroup,
    "" AS Description,
    "" AS SoftwareOrHardware