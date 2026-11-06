-- Taxonomy gap signals: lightweight, zero-latency observations captured
-- inline while the GEAR Assistant answers chat questions.
--
-- Why a separate table from gear_log.taxonomy_gap_recommendation: this table
-- is written SYNCHRONOUSLY FROM THE REQUEST PATH (fire-and-forget, never
-- awaited - see mcp/taxonomy-gap-signals.js), so every column here must stay
-- cheap to populate from data the chat turn already has in hand. No lookups,
-- no reasoning, no SQL drafting happens before this INSERT fires - that is
-- deliberately left to the nightly batch job (mcp/taxonomy-gap-analyzer.js),
-- which reads unprocessed rows from this table, does the real analysis
-- (including USAi calls), and writes finished rows to
-- gear_log.taxonomy_gap_recommendation. This two-tier split is what keeps
-- taxonomy-gap analysis at ZERO added latency for the user: nothing in this
-- table's write path blocks or can fail a chat response.
--
-- Advisory/write-boundary notes are the same as taxonomy_gap_recommendation:
-- this table lives in gear_log because recording an observation about
-- gear_schema is a gear_log write; it never reads or writes gear_schema
-- itself. See mcp/db-guard.js.
--
-- Run once per environment, same as 2026-10-21_ai_log_review_columns.sql and
-- 2026-11-04_taxonomy_gap_recommendations.sql.

CREATE TABLE IF NOT EXISTS gear_log.taxonomy_gap_signal (
  Id                 INT AUTO_INCREMENT PRIMARY KEY,
  Created_DTG        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  Signal_Type        ENUM(
                        'technology_not_in_inventory',
                        'technology_incomplete_trm_mapping',
                        'trm_category_not_found_for_query',
                        'system_no_capability_mapping',
                        'system_incomplete_capability_mapping'
                      ) NOT NULL
                      COMMENT 'What the chat turn observed. technology_not_in_inventory: searched product absent entirely. technology_incomplete_trm_mapping: product exists but has zero, or possibly insufficient, TRM category mapping(s). trm_category_not_found_for_query: a "what <type> software" question resolved to no TRM category at all. system_no_capability_mapping/system_incomplete_capability_mapping: a business system has zero, or possibly insufficient, Business Capability mapping(s).',

  Source             ENUM('user','developer','test') NOT NULL DEFAULT 'user'
                      COMMENT 'Same provenance tagging as ai_log',
  Related_Ai_Log_Id  INT NULL
                      COMMENT 'Soft reference to gear_log.ai_log.Id - the chat turn that observed this signal. Not a FOREIGN KEY: ai_log rows may be pruned independently.',

  Query_Text         VARCHAR(500) NULL
                      COMMENT 'The user question or search term that triggered this observation',
  Entity_Type        VARCHAR(64)  NULL
                      COMMENT 'e.g. Technology, System, TRM - the existing GEAR record this signal concerns, if any',
  Entity_Id          VARCHAR(64)  NULL
                      COMMENT 'GEAR Id of the affected entity, if any (obj_technology.Id or obj_systems_subsystems GEAR_ID)',
  Entity_Name        VARCHAR(255) NULL,

  Context_Json       TEXT NULL
                      COMMENT 'Small JSON blob of whatever the chat turn already had in hand (e.g. categories/capabilities found, if any) - cheap to serialize, no extra lookups performed before this write',

  Processed          TINYINT(1) NOT NULL DEFAULT 0
                      COMMENT 'Set by the nightly batch job once it has reasoned about this signal (whether or not a recommendation was produced)',
  Processed_DTG       TIMESTAMP NULL,
  Recommendation_Id   INT NULL
                      COMMENT 'Soft reference to gear_log.taxonomy_gap_recommendation.Id, if this signal resulted in a recommendation',

  INDEX idx_processed (Processed, Created_DTG),
  INDEX idx_signal_type (Signal_Type),
  INDEX idx_entity (Entity_Type, Entity_Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Zero-latency, fire-and-forget taxonomy-gap observations captured inline during chat. Read and reasoned about only by the nightly mcp/taxonomy-gap-analyzer.js batch job, which drafts actual gear_log.taxonomy_gap_recommendation rows - never read or written synchronously as part of answering a user.';
