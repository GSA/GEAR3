SELECT
  job_id                          AS jobId,
  job_type                        AS jobType,
  start_time                      AS startTime,
  end_time                        AS endTime,
  job_status                      AS jobStatus
FROM cron_job
WHERE job_type = ? and job_status=3
ORDER BY start_time DESC limit 1