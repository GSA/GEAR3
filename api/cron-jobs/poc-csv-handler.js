const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const { JobLogger } = require("../cron-jobs/job-logger.js");
const JobStatus = require("../enums/job-status.js");
const cronJobDbUtilService = require("../cron-jobs/cron-job-db-util.service.js");
const { formatDateTime } = require("../util/date-time-format-service.js");

const jobType = "POC-CSV-JOB";
const jobName = "CRON JOB: POC CSV Creation Job";

// Minimum acceptable CSV size, in KB
const MIN_CSV_SIZE_KB = 1500;

// Absolute path to the PowerShell script
const scriptPath = path.resolve(
  __dirname,
  "../../scripts/pocs/get_gsa_pocs.ps1"
);

// Absolute path to the CSV the PowerShell script generates
const csvPath = path.resolve(
  __dirname,
  "../../scripts/pocs/GSA_Pocs.csv"
);

/**
 * Runs the POC CSV creation job. Executes the PowerShell script,
 * validates the resulting CSV file, and logs execution details and
 * job status into the database.
 */
const runPocCsvJob = async () => {
  const jobLogger = new JobLogger();
  let jobId;

  try {
    jobLogger.log(`${jobName} - Execution start`);

    // Check for any pending job
    const pendingJobId = await cronJobDbUtilService.getAnyPendingJob(jobType);
    if (pendingJobId) {
      jobLogger.log(`Active Job '${pendingJobId}' is Running. Aborting the job now.`);
      jobId = await cronJobDbUtilService.insertDbData({
        jobType,
        startTime: formatDateTime(new Date()),
        jobLogs: jobLogger.getLogs(),
        jobStatus: JobStatus.CANCELLED
      });
      return;
    }

    // Insert new job record
    jobId = await cronJobDbUtilService.insertDbData({
      jobType,
      startTime: formatDateTime(new Date()),
      jobLogs: "",
      jobStatus: JobStatus.PENDING
    });
    console.log(`Cron job id: ${jobId} - start`);

    // Run the PowerShell script to generate the CSV
    jobLogger.log(`Running PowerShell script: ${scriptPath}`);
    const psResult = await runPowerShellScript(jobLogger);
    jobLogger.log(`PowerShell script completed with exit code ${psResult.code}.`);

    // Validate the resulting CSV file
    const validation = validateCsvFile(jobLogger);

    // Hard failure: file was never created
    if (!validation.exists) {
      jobLogger.log(`*WARNING* - CSV file was not created at: ${csvPath}`);
      jobLogger.log("Result: FAILURE - CSV file is missing.");
      await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
      return;
    }

    // Hard failure: file exists but is completely empty
    if (validation.sizeKb === 0) {
      jobLogger.log(`*WARNING* - CSV file is 0 KB (empty data set): ${csvPath}`);
      jobLogger.log("Result: FAILURE - CSV file contains no data.");
      await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
      return;
    }

    // Soft warning: file was created, but is smaller than expected
    if (validation.sizeKb < MIN_CSV_SIZE_KB) {
      jobLogger.log(
        `*WARNING* - CSV file size (${validation.sizeKb.toFixed(2)} KB) is below the expected minimum of ${MIN_CSV_SIZE_KB} KB: ${csvPath}`
      );
      jobLogger.log(
        "Result: WARNING - CSV file was created but is suspiciously small. Manual review recommended."
      );
      await postprocesJobExecution(jobId, jobLogger, JobStatus.WARNING);
      return;
    }

    // Success: file exists and meets the size threshold
    jobLogger.log(
      `CSV file created successfully (${validation.sizeKb.toFixed(2)} KB): ${csvPath}`
    );
    jobLogger.log("Result: SUCCESS - CSV file created and meets the size threshold.");
    await postprocesJobExecution(jobId, jobLogger, JobStatus.SUCCESS);
  } catch (error) {
    const status = `Error occurred while running: \n${error}`;
    if (jobId) {
      jobLogger.log(`${jobName} - ${status}`);
      jobLogger.log(error.stack);
      await postprocesJobExecution(jobId, jobLogger, JobStatus.FAILURE);
    } else {
      jobLogger.log(error);
      jobLogger.log(error.stack);
      console.log(jobLogger.getLogs());
    }
  } finally {
    console.log(`Cron job id: ${jobId} - end`);
  }
};

/**
 * Executes the PowerShell script that generates the CSV file.
 *
 * @param {JobLogger} jobLogger - The JobLogger instance for capturing output.
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
const runPowerShellScript = (jobLogger) => {
  return new Promise((resolve, reject) => {
    const ps = spawn("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath
    ], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    ps.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      console.log(`[PowerShell stdout] ${text}`);
    });

    ps.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      console.error(`[PowerShell stderr] ${text}`);
    });

    ps.on("error", (err) => {
      reject(err);
    });

    ps.on("close", (code) => {
      if (stderr.trim().length > 0) {
        jobLogger.log(`PowerShell stderr output: ${stderr.trim()}`);
      }

      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        reject(
          new Error(`PowerShell script exited with code ${code}. STDERR: ${stderr}`)
        );
      }
    });

    /**
     * If the PowerShell script still requires typing "A" + Enter,
     * this sends that input shortly after launch.
     * Remove if the script is made fully non-interactive.
     */
    setTimeout(() => {
      ps.stdin.write("A\r\n");
      ps.stdin.end();
    }, 1000);
  });
};

/**
 * Validates the generated CSV file's existence and size.
 *
 * @param {JobLogger} jobLogger - The JobLogger instance for capturing output.
 * @returns {{exists: boolean, sizeKb: number}}
 */
const validateCsvFile = (jobLogger) => {
  if (!fs.existsSync(csvPath)) {
    return { exists: false, sizeKb: 0 };
  }

  const stats = fs.statSync(csvPath);
  const sizeKb = stats.size / 1024;

  jobLogger.log(`CSV file found. Size: ${sizeKb.toFixed(2)} KB.`);

  return { exists: true, sizeKb };
};

/**
 * Finalizes the job execution by updating the job status and logs in the database.
 *
 * @param {number} jobId - The ID of the job to be updated.
 * @param {JobLogger} jobLogger - The JobLogger instance containing the job logs.
 * @param {string} jobStatus - The status to update the job with (e.g., SUCCESS, WARNING, FAILURE).
 * @returns {Promise<void>}
 */
const postprocesJobExecution = async (jobId, jobLogger, jobStatus) => {
  jobLogger.log(`Cron job id: ${jobId} - end`);
  await cronJobDbUtilService.updateDbData({
    jobStatus: jobStatus,
    endTime: formatDateTime(new Date()),
    jobLogs: jobLogger.getLogs(),
    jobId: jobId
  });
};

module.exports = {
  runPocCsvJob
};
