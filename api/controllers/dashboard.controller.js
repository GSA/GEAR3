const { promisePool } = require('../db.js');

/**
 * GET /api/dashboard_summary
 * Runs all dashboard metric queries in parallel and returns a single aggregated response.
 * Replaces 9 separate API calls made by the dashboard component on load.
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    const [
      fismaExpiringQuarter,
      fismaExpiringWeek,
      fismaPastDue,
      itsExpiringQuarter,
      itsExpiringWeek,
      itsPastDue,
      decommissionedTotals,
      retiredTotals,
      cloudAdoptionRate,
    ] = await Promise.all([
      promisePool.query(`
        SELECT COUNT(*) AS Total
        FROM obj_fisma_archer AS fisma
        WHERE fisma.\`ex:ATO_Expiration_Date\` >= CURDATE()
          AND fisma.\`ex:ATO_Expiration_Date\` <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
          AND fisma.\`ex:SystemLevel\` = 'System'
          AND (fisma.\`ex:Status\` = 'Active' OR fisma.\`ex:Status\` = 'Pending')`),

      promisePool.query(`
        SELECT COUNT(*) AS Total
        FROM obj_fisma_archer AS fisma
        WHERE fisma.\`ex:ATO_Expiration_Date\` >= CURDATE()
          AND fisma.\`ex:ATO_Expiration_Date\` <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          AND fisma.\`ex:SystemLevel\` = 'System'
          AND (fisma.\`ex:Status\` = 'Active' OR fisma.\`ex:Status\` = 'Pending')`),

      promisePool.query(`
        SELECT COUNT(*) AS Total
        FROM obj_fisma_archer AS fisma
        WHERE fisma.\`ex:ATO_Expiration_Date\` < CURDATE()
          AND fisma.\`ex:SystemLevel\` = 'System'
          AND (fisma.\`ex:Status\` = 'Active' OR fisma.\`ex:Status\` = 'Pending')`),

      promisePool.query(`
        SELECT COUNT(*) AS Total
        FROM obj_technology AS tech
        LEFT JOIN obj_standard_type ON tech.obj_standard_type_Id = obj_standard_type.Id
        WHERE tech.Approved_Status_Expiration_Date >= CURDATE()
          AND tech.Approved_Status_Expiration_Date <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
          AND obj_standard_type.Keyname LIKE 'Software'
          AND (tech.obj_technology_status_Id = 11 OR tech.obj_technology_status_Id = 2
            OR tech.obj_technology_status_Id = 6 OR tech.obj_technology_status_Id = 9)`),

      promisePool.query(`
        SELECT COUNT(*) AS Total
        FROM obj_technology AS tech
        LEFT JOIN obj_standard_type ON tech.obj_standard_type_Id = obj_standard_type.Id
        WHERE tech.Approved_Status_Expiration_Date >= CURDATE()
          AND tech.Approved_Status_Expiration_Date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          AND obj_standard_type.Keyname LIKE 'Software'
          AND (tech.obj_technology_status_Id = 11 OR tech.obj_technology_status_Id = 2
            OR tech.obj_technology_status_Id = 6 OR tech.obj_technology_status_Id = 9)`),

      promisePool.query(`
        SELECT COUNT(*) AS Total
        FROM obj_technology AS tech
        LEFT JOIN obj_standard_type ON tech.obj_standard_type_Id = obj_standard_type.Id
        WHERE tech.Approved_Status_Expiration_Date < CURDATE()
          AND obj_standard_type.Keyname LIKE 'Software'
          AND (tech.obj_technology_status_Id = 11 OR tech.obj_technology_status_Id = 2
            OR tech.obj_technology_status_Id = 6 OR tech.obj_technology_status_Id = 9)`),

      promisePool.query(`
        SELECT
          COUNT(CASE WHEN systems.\`ex:Status\` = 'Inactive' AND systems.\`ex:BusinessApplication\` = 'Yes'
            AND (systems.\`ex:Inactive_Date\` <= CURDATE() AND systems.\`ex:Inactive_Date\` >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            THEN 1 ELSE NULL END) AS DecommissionedSystemsLastMonth,
          COUNT(CASE WHEN (systems.\`ex:Status\` = 'Inactive' AND systems.\`ex:BusinessApplication\` = 'Yes'
            AND systems.\`ex:Inactive_Date\` <= CURDATE() AND systems.\`ex:Inactive_Date\` >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
            THEN 1 ELSE NULL END) AS DecommissionedSystemsLastSixMonths
        FROM gear_schema.obj_fisma_archer AS systems`),

      promisePool.query(`
        SELECT
          COUNT(CASE WHEN tech.obj_technology_status_Id = 13
            AND (tech.Approved_Status_Expiration_Date BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE())
            THEN 1 ELSE NULL END) AS RetiredStandardsLastWeek,
          COUNT(CASE WHEN tech.obj_technology_status_Id = 13
            AND (tech.Approved_Status_Expiration_Date BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 MONTH) AND CURDATE())
            THEN 1 ELSE NULL END) AS RetiredStandardsLastSixMonths
        FROM gear_schema.obj_technology AS tech`),

      promisePool.query(`
        SELECT
          Id AS Id,
          BusSysCloudAdoptionRate AS CloudAdoptionRate,
          ActiveBusSystemsCount AS BusSystemsCount,
          CloudActiveBusSystemsCount AS CloudBusSystemsCount,
          DTG AS DTG
        FROM obj_cloud_adoption_rate
        ORDER BY DTG DESC LIMIT 1`),
    ]);

    res.json({
      fismaExpiringThisQuarter:        fismaExpiringQuarter[0][0]?.Total ?? 0,
      fismaExpiringThisWeek:           fismaExpiringWeek[0][0]?.Total ?? 0,
      fismaPastDue:                    fismaPastDue[0][0]?.Total ?? 0,
      standardsExpiringThisQuarter:    itsExpiringQuarter[0][0]?.Total ?? 0,
      standardsExpiringThisWeek:       itsExpiringWeek[0][0]?.Total ?? 0,
      standardsPastDue:                itsPastDue[0][0]?.Total ?? 0,
      decommissionedSystemsLastMonth:  decommissionedTotals[0][0]?.DecommissionedSystemsLastMonth ?? 0,
      decommissionedSystemsLast6Months: decommissionedTotals[0][0]?.DecommissionedSystemsLastSixMonths ?? 0,
      retiredStandardsLastWeek:        retiredTotals[0][0]?.RetiredStandardsLastWeek ?? 0,
      retiredStandardsLast6Months:     retiredTotals[0][0]?.RetiredStandardsLastSixMonths ?? 0,
      cloudAdoptionRate:               cloudAdoptionRate[0][0] ?? null,
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ message: err.message || 'Error fetching dashboard summary' });
  }
};

/**
 * GET /api/dashboard_summary/hosting_platforms
 * Returns aggregated hosting platform counts for active business systems.
 * Replaces the full GET /api/systems call (1.98MB) used by the dashboard chart.
 */
exports.getHostingPlatforms = async (req, res) => {
  try {
    const [rows] = await promisePool.query(`
      SELECT
        TRIM(systems.\`ex:Hosting_Provider\`) AS CSP,
        COUNT(*) AS count
      FROM gear_schema.obj_fisma_archer AS systems
      WHERE systems.\`ex:Status\` = 'Active'
        AND systems.\`ex:BusinessApplication\` = 'Yes'
        AND systems.\`ex:Hosting_Provider\` IS NOT NULL
        AND TRIM(systems.\`ex:Hosting_Provider\`) != ''
      GROUP BY TRIM(systems.\`ex:Hosting_Provider\`)
      ORDER BY count DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('Hosting platforms error:', err);
    res.status(500).json({ message: err.message || 'Error fetching hosting platforms' });
  }
};
