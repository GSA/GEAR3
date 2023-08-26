select 
        sr.id,
        sr.application,
        -- sl.endOfLife,
        -- character_length(sl.endOfLife) - character_length(replace(sl.endOfLife, '/', '')),
        CASE
			WHEN sl.endOfLife IN ('Not Available', '') THEN null
            WHEN character_length(sl.endOfLife) -
					character_length(replace(sl.endOfLife, '/', '')) = 2 THEN DATE_FORMAT(STR_TO_DATE(sl.endOfLife, '%m/%d/%Y'), '%Y-%m-%d')
			WHEN character_length(sl.endOfLife) -
					character_length(replace(sl.endOfLife, '/', '')) = 1 THEN DATE_FORMAT(LAST_DAY(STR_TO_DATE(concat('1/', sl.endOfLife), '%d/%m/%Y')), '%Y-%m-%d')
			WHEN character_length(sl.endOfLife) -
					character_length(replace(sl.endOfLife, '/', '')) = 0 THEN DATE_FORMAT(LAST_DAY(STR_TO_DATE(concat('1/12/', sl.endOfLife), '%d/%m/%Y')), '%Y-%m-%d')
            ELSE null
		END endOfLife
        
from tech_catalog.tp_SoftwareRelease sr
left join tech_catalog.tp_SoftwareLifecycle sl on sr.id = sl.softwareRelease