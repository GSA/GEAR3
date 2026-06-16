const { spawn } = require("child_process");
const path = require("path");

function runPocCsvJob() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(
      __dirname,
      "../../scripts/pocs/get_gsa_pocs.ps1"
    );

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

    ps.stdout.on("data", data => {
      stdout += data.toString();
      console.log(data.toString());
    });

    ps.stderr.on("data", data => {
      stderr += data.toString();
      console.error(data.toString());
    });

    ps.on("error", err => {
      reject(err);
    });

    ps.on("close", code => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`PowerShell exited with code ${code}: ${stderr}`));
      }
    });

    setTimeout(() => {
      ps.stdin.write("A\r\n");
      ps.stdin.end();
    }, 1000);
  });
}

module.exports = {
  runPocCsvJob
};
