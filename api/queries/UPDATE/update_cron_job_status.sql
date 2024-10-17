UPDATE cron_job SET
job_status = ?,
end_time= ?,
job_logs = ?
WHERE job_id = ?