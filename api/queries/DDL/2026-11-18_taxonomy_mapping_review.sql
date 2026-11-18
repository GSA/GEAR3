-- Taxonomy mapping re-alignment review: lets the nightly taxonomy-gap
-- analyzer (mcp/taxonomy-gap-analyzer.js) re-check EXISTING mappings, not
-- just find missing ones.
--
-- Why: the analyzer previously only looked at IT standards with zero TRM
-- mapping. A technology already linked in gear_schema.zk_technology_TRM was
-- never reconsidered, even if it was linked to the wrong TRM category or the
-- TRM had since gained a better-fitting one.
--
-- 1. gear_log.taxonomy_mapping_review records when each entity's current
--    mapping set was last reviewed, and what the verdict was. The analyzer
--    works through it in rotation: never-reviewed entities first, then any
--    whose mapping set changed since its last review, then the oldest
--    reviews past GEAR_TAXONOMY_REALIGN_INTERVAL_DAYS. This keeps each run
--    bounded and stops a mapping that was just reviewed (or a recommendation
--    an admin rejected) from being raised again every run. The unmapped
--    Approved-standard scan uses the same rotation (with an empty
--    fingerprint), so it also moves on to new standards each run.
-- 2. Recommended_Action gains 'remap_mapping': replace one or more existing
--    mappings with better-fitting ones in a single reviewable change.
--
-- Advisory only, same as taxonomy_gap_recommendation: this lives in gear_log,
-- and nothing here ever changes gear_schema (see mcp/db-guard.js).
--
-- Run once per environment, after 2026-11-04_taxonomy_gap_recommendations.sql.

CREATE TABLE IF NOT EXISTS gear_log.taxonomy_mapping_review (
  Entity_Type          VARCHAR(64)  NOT NULL
                        COMMENT 'Technology (obj_technology) - the entity whose TRM mapping set (possibly empty) was reviewed',
  Entity_Id            VARCHAR(64)  NOT NULL
                        COMMENT 'obj_technology.Id',
  Mapping_Fingerprint  VARCHAR(1000) NOT NULL
                        COMMENT 'Sorted, comma-separated target ids (obj_TRM.Technology_Category_Id) mapped at review time. A changed fingerprint makes the entity due for review again.',
  Verdict              ENUM('keep','change','undetermined') NOT NULL
                        COMMENT 'keep: the current mappings fit. change: a recommendation was written. undetermined: the model answer could not be checked against real GEAR data.',
  Confidence           ENUM('low','medium','high') NULL,
  Reasoning            TEXT NULL,
  Recommendation_Id    INT NULL
                        COMMENT 'Soft reference to gear_log.taxonomy_gap_recommendation.Id when Verdict = change',
  Reviewed_DTG         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Entity_Type, Entity_Id),
  INDEX idx_reviewed (Reviewed_DTG)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Rotation state for the taxonomy-gap analyzer re-alignment review of existing mappings.';

ALTER TABLE gear_log.taxonomy_gap_recommendation
  MODIFY COLUMN Recommended_Action
    ENUM('add_node','edit_node','remove_node','add_mapping','remove_mapping','remap_mapping') NOT NULL
    COMMENT 'add_node: create a new TRM category or Business Capability. edit_node: modify an existing node - e.g. improve its Description, move it under a different parent, or change its hierarchy Level - because its current description or positioning does not logically fit. remove_node: delete a redundant/duplicate TRM category or Business Capability; see Child_Node_Handling for how its children (if any) must be addressed so removal never creates orphans. add_mapping: link an existing IT standard<->TRM category or system<->capability pair. remove_mapping: delete an existing link that does not make sense. remap_mapping: replace one or more existing links with better-fitting ones in a single change (new links are inserted before the old ones are deleted, so the entity is never left unmapped).';
