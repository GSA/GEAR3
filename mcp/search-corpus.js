/**
 * Searchable GEAR corpus definition for semantic search.
 *
 * Defines, in one place, exactly which GEAR records participate in semantic
 * search and how each is turned into embeddable text. Coverage intentionally
 * mirrors the entity types in api/controllers/search.controller.js so semantic
 * and keyword search operate over the same universe of records.
 *
 * Identity: every document is keyed by (entityType, entityId). That pair is
 * stable across rebuilds and is what links a vector back to a GEAR record.
 *
 * Change detection: each document carries a SHA-256 hash of its embeddable
 * text. The delta refresh re-embeds only rows whose hash moved. This is used
 * instead of modified-date columns because most GEAR tables have none —
 * only obj_technology and obj_TRM have an auto-updating ChangeDTG, and
 * obj_fisma_archer has no change column at all.
 */

const crypto = require('crypto');

/**
 * One entry per searchable entity type.
 *  - type:        stored entity_type, also the GEAR_Type used by search results
 *  - typeDisplay: human-readable location, mirrors search.controller.js
 *  - sql:         must return Id, Name, Description (Status optional)
 */
const SOURCES = [
  {
    type: 'System',
    typeDisplay: 'Business Systems & Subsystems Report',
    sql: `SELECT \`ex:GEAR_ID\` AS Id,
                 \`ex:System_Name\` AS Name,
                 \`ex:Description\` AS Description,
                 \`ex:Status\` AS Status
          FROM gear_schema.obj_fisma_archer
          WHERE \`ex:SystemLevel\` = 'SubSystem'`,
  },
  {
    type: 'FISMA',
    typeDisplay: 'Security -> FISMA Systems Inventory',
    sql: `SELECT \`ex:GEAR_ID\` AS Id,
                 \`ex:System_Name\` AS Name,
                 \`ex:Description\` AS Description,
                 \`ex:Status\` AS Status
          FROM gear_schema.obj_fisma_archer
          WHERE \`ex:SystemLevel\` = 'System'
            AND \`ex:Status\` <> 'Pending'`,
  },
  {
    type: 'Technology',
    typeDisplay: 'Technologies -> IT Standards List',
    sql: `SELECT tech.Id AS Id,
                 IFNULL(tech.softwareReleaseName, tech.Keyname) AS Name,
                 tech.Description AS Description,
                 status.Keyname AS Status
          FROM gear_schema.obj_technology AS tech
          LEFT JOIN gear_schema.obj_technology_status AS status
                 ON tech.obj_technology_status_Id = status.Id`,
  },
  {
    type: 'Capability',
    typeDisplay: 'GSA Enterprise -> Business Capability List',
    sql: `SELECT capability_Id AS Id,
                 Capability_Name AS Name,
                 Description AS Description,
                 '' AS Status
          FROM gear_schema.obj_capability`,
  },
  {
    type: 'Organization',
    typeDisplay: 'GSA Enterprise -> Organization List',
    sql: `SELECT Organization_Id AS Id,
                 Organization_Id AS Name,
                 Organization_Name AS Description,
                 '' AS Status
          FROM gear_schema.obj_organization`,
  },
  {
    type: 'Investment',
    typeDisplay: 'IT Strategy -> IT Investments',
    sql: `SELECT Investment_Id AS Id,
                 Investment_Name AS Name,
                 Description AS Description,
                 Investment_Status_Name AS Status
          FROM gear_schema.obj_investments`,
  },
  {
    type: 'Website',
    typeDisplay: 'Business Systems -> GSA Websites',
    sql: `SELECT id AS Id,
                 domain AS Name,
                 notes AS Description,
                 production_status AS Status
          FROM gear_schema.obj_websites`,
  },
  {
    type: 'TRM',
    typeDisplay: 'Technology Reference Model',
    sql: `SELECT Technology_Category_Id AS Id,
                 TRM_Name AS Name,
                 Description AS Description,
                 '' AS Status
          FROM gear_schema.obj_TRM`,
  },
];

/** Max description characters kept per document before embedding. */
const MAX_DESCRIPTION_CHARS = 1200;

/**
 * Normalize description text for embedding: strip HTML, collapse pathological
 * character runs, and collapse whitespace.
 *
 * The character-run collapse is not cosmetic. GEAR contains rows such as
 * obj_technology Id 6854, whose description is a 131KB run of apostrophes;
 * Cohere rejects such input with HTTP 400 and, because embeddings are sent in
 * batches, a single bad row otherwise fails every document batched with it.
 */
function cleanText(value) {
  return String(value == null ? '' : value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/(.)\1{4,}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build the text that actually gets embedded. Includes the entity type so
 * semantically similar names in different parts of GEAR stay distinguishable,
 * and leads with the name because it carries the most retrieval signal.
 */
function buildDocumentText(source, row) {
  const name = cleanText(row.Name);
  const description = cleanText(row.Description).slice(0, MAX_DESCRIPTION_CHARS);
  const parts = [`${source.type}: ${name || '(unnamed)'}`];
  if (description) parts.push(description);
  return parts.join('\n');
}

/**
 * True when text has enough lexical content to embed. Cohere rejects inputs
 * with effectively no words, so these rows are skipped rather than sent.
 */
function isEmbeddable(text) {
  return (text.match(/[A-Za-z0-9]/g) || []).length >= 3;
}

/** SHA-256 of the embeddable text — the change-detection signal. */
function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Load every searchable GEAR record as a corpus document.
 *
 * @param {import('mysql2/promise').Pool} pool
 * @returns {Promise<{documents:Array<object>, skipped:number, errors:Array<{type:string,error:string}>}>}
 */
async function loadCorpus(pool) {
  const documents = [];
  const errors = [];
  let skipped = 0;

  for (const source of SOURCES) {
    let rows;
    try {
      [rows] = await pool.query(source.sql);
    } catch (err) {
      // One unavailable table must not abort the whole rebuild.
      errors.push({ type: source.type, error: err.message });
      continue;
    }

    for (const row of rows) {
      if (row.Id == null) continue;
      const text = buildDocumentText(source, row);
      if (!isEmbeddable(text)) {
        skipped++;
        continue;
      }
      documents.push({
        entityType: source.type,
        entityId: String(row.Id),
        name: cleanText(row.Name),
        description: cleanText(row.Description).slice(0, MAX_DESCRIPTION_CHARS),
        status: row.Status == null ? '' : String(row.Status),
        typeDisplay: source.typeDisplay,
        text,
        contentHash: hashText(text),
      });
    }
  }

  return { documents, skipped, errors };
}

module.exports = {
  SOURCES,
  loadCorpus,
  buildDocumentText,
  cleanText,
  hashText,
  isEmbeddable,
  MAX_DESCRIPTION_CHARS,
};
