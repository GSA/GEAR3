-- GEAR Assistant logging: provenance + response review
--
-- Why: gear_log.ai_log mixed production traffic with local development and
-- automated test runs, so it could not be used to analyze real chatbot usage.
-- It also had no place to record whether a response was actually correct, which
-- is needed to measure whether prompt/retrieval changes improve answers.
--
-- Applied to the dev database on 2026-10-21. Run once per environment.

-- 1. Provenance and review columns on the existing log table.
ALTER TABLE gear_log.ai_log
  ADD COLUMN Source ENUM('user','developer','test') NOT NULL DEFAULT 'user'
      COMMENT 'Origin of the prompt: user=production traffic, developer=local dev testing, test=automated/agent runs'
      AFTER Tokens_Used,
  ADD COLUMN Correct ENUM('correct','partial','incorrect') NULL
      COMMENT 'Human review verdict for this response; NULL = not yet reviewed'
      AFTER Source,
  ADD COLUMN Review_Notes VARCHAR(500) NULL
      COMMENT 'Why the verdict was given: what was missing, wrong, or invented'
      AFTER Correct,
  ADD COLUMN Reviewed_DTG TIMESTAMP NULL
      COMMENT 'When the review verdict was recorded'
      AFTER Review_Notes,
  ADD INDEX idx_dtg_source (DTG, Source),
  ADD INDEX idx_correct (Correct);

-- 2. FULLTEXT index the prompt cache has always required.
--    Without it the L2 similarity lookup throws and is silently swallowed, so
--    near-duplicate questions never hit cache and always pay for a USAi call.
ALTER TABLE gear_log.ai_log
  ADD FULLTEXT INDEX ft_prompt (Prompt);

-- 3. Gold answers for regression testing: one row per QUESTION.
--    Kept separate from ai_log because ai_log has many rows per question
--    (260 rows / 37 distinct prompts at time of writing), and the expected
--    answer is a property of the question, not of any single response.
CREATE TABLE IF NOT EXISTS gear_log.ai_eval_question (
  Id               INT AUTO_INCREMENT PRIMARY KEY,
  Prompt           VARCHAR(500) NOT NULL COMMENT 'The question as asked (normalized lowercase, no punctuation)',
  Expected_Answer  TEXT         NOT NULL COMMENT 'What a correct reply must contain',
  Expected_Tools   VARCHAR(255)     NULL COMMENT 'Expected tool chain, e.g. find_system>get_system_software',
  Must_Not_Contain VARCHAR(500)     NULL COMMENT 'Known-wrong content, pipe-separated (e.g. Flosum|eOffer)',
  Source_Ref       VARCHAR(255)     NULL COMMENT 'Where the gold answer came from, e.g. /api/trm/get/relatedITStandards/20',
  Notes            VARCHAR(500)     NULL,
  Created_DTG      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Updated_DTG      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_prompt (Prompt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Gold answers for GEAR Assistant regression testing; one row per question';
