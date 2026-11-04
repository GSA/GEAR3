-- Taxonomy gap recommendations: AI-identified gaps in the TRM / Business
-- Capability taxonomies, or in their mappings to IT standards / business
-- systems, surfaced while answering chat questions or auditing the
-- inventories.
--
-- Why: the GEAR Assistant (mcp/chat-orchestrator.js, mcp/gear-tools.js) can
-- notice that a searched product or capability doesn't fit any existing TRM
-- category / Business Capability node, or that a technology<->TRM or
-- system<->capability mapping looks missing or wrong. There was previously no
-- place to record that observation for a human to review.
--
-- IMPORTANT - this table is advisory only:
--   * Proposed_SQL is a DRAFT script against gear_schema, written for a human
--     GEAR Manager admin to review and run through GEAR's authenticated,
--     audited path. It is NEVER executed by the AI layer.
--   * The AI layer may only write to gear_log (this schema) - see
--     mcp/db-guard.js, which actively blocks any statement the AI layer issues
--     against gear_schema or gear_acl, regardless of what Proposed_SQL says.
--   * This table itself lives in gear_log for exactly that reason: recording
--     a *recommendation* about gear_schema is a gear_log write; actually
--     applying it is a gear_schema write, which only GEAR Manager may do.
--
-- Run once per environment, same as 2026-10-21_ai_log_review_columns.sql.

CREATE TABLE IF NOT EXISTS gear_log.taxonomy_gap_recommendation (
  Id                      INT AUTO_INCREMENT PRIMARY KEY,
  Created_DTG             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  Source                  ENUM('user','developer','test') NOT NULL DEFAULT 'user'
                           COMMENT 'Same provenance tagging as ai_log: where the analysis that produced this recommendation ran',
  Related_Ai_Log_Id       INT NULL
                           COMMENT 'Soft reference to gear_log.ai_log.Id - the chat turn whose analysis produced this row, if any. Not a FOREIGN KEY: ai_log rows may be pruned independently.',

  Gap_Type                ENUM(
                             'trm_category',
                             'business_capability',
                             'technology_trm_mapping',
                             'system_capability_mapping'
                           ) NOT NULL
                           COMMENT 'trm_category/business_capability = a taxonomy node gap. technology_trm_mapping/system_capability_mapping = a mapping gap between an IT standard and a TRM category, or a business system and a capability.',

  Recommended_Action      ENUM('add_node','edit_node','remove_node','add_mapping','remove_mapping') NOT NULL
                           COMMENT 'add_node: create a new TRM category or Business Capability. edit_node: modify an existing node - e.g. improve its Description, move it under a different parent, or change its hierarchy Level - because its current description or positioning does not logically fit. remove_node: delete a redundant/duplicate TRM category or Business Capability; see Child_Node_Handling for how its children (if any) must be addressed so removal never creates orphans. add_mapping: link an existing IT standard<->TRM category or system<->capability pair. remove_mapping: delete an existing link that does not make sense.',

  Situation_Analyzed      TEXT NOT NULL
                           COMMENT 'What prompted this analysis - the user question asked, or the comparison performed (e.g. "comparing obj_capability against obj_systems_subsystems for orphaned systems")',
  Gap_Description         TEXT NOT NULL
                           COMMENT 'The specific gap or mismatch observed in the taxonomy or mapping',
  Recommended_Addition    TEXT NOT NULL
                           COMMENT 'Plain-language description of the recommended fix, for a human reviewer who will not read Proposed_SQL line by line',

  Affected_Entity_Type    VARCHAR(64) NULL
                           COMMENT 'e.g. Technology, System, TRM, Capability - the existing GEAR record this recommendation concerns, if any',
  Affected_Entity_Id      VARCHAR(64) NULL
                           COMMENT 'GEAR Id of the affected entity (obj_technology.Id, obj_systems_subsystems GEAR_ID, obj_TRM.Technology_Category_Id, or obj_capability.capability_Id)',
  Affected_Entity_Name    VARCHAR(255) NULL,

  Proposed_Parent_Name    VARCHAR(255) NULL
                           COMMENT 'For add_node: the parent TRM category/Capability the new node attaches to, so it is never created as an orphan. For edit_node when the fix is to re-parent the node: the NEW parent it should move under.',
  Proposed_Parent_Exists  TINYINT(1) NULL
                           COMMENT 'Whether Proposed_Parent_Name already exists in gear_schema. If 0, Proposed_SQL must create that parent first (e.g. via LAST_INSERT_ID()) before creating/re-parenting the child node.',

  Child_Node_Handling     TEXT NULL
                           COMMENT 'Required when Recommended_Action = remove_node and the node has children in the taxonomy: explains what happens to each child (e.g. re-parent to the grandparent, re-parent to a named sibling, or remove as well) so Proposed_SQL never leaves orphaned children. NULL/blank implies the node has no children.',

  Proposed_SQL            TEXT NOT NULL
                           COMMENT 'DRAFT SQL against gear_schema implementing this recommendation. For add_node: parent creation first (if needed), using LAST_INSERT_ID() to link the child, then the INSERT. For edit_node: an UPDATE of Description/Parent_Id/Level as applicable. For remove_node: statements handling every child per Child_Node_Handling BEFORE the DELETE of the node itself, so nothing is left orphaned. May be multiple ;-separated statements. Advisory only - never executed by the AI layer; db-guard.js blocks the AI layer from writing to gear_schema regardless.',

  Confidence              ENUM('low','medium','high') NOT NULL DEFAULT 'medium'
                           COMMENT 'How confident the analysis is that this is a genuine gap rather than a one-off or edge case',

  Status                  ENUM('pending','approved','rejected','applied') NOT NULL DEFAULT 'pending',
  Reviewed_By             VARCHAR(255) NULL,
  Reviewed_DTG            TIMESTAMP NULL,
  Review_Notes            VARCHAR(1000) NULL,

  INDEX idx_gap_type (Gap_Type),
  INDEX idx_status (Status),
  INDEX idx_affected_entity (Affected_Entity_Type, Affected_Entity_Id),
  INDEX idx_created (Created_DTG)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='AI-identified gaps in the TRM / Business Capability taxonomies or their mappings to IT standards / business systems. Proposed_SQL is a draft suggestion only - gear_schema changes always require human review and manual execution by an authorized GEAR Manager admin; the AI layer is never permitted to run it (see mcp/db-guard.js).';
