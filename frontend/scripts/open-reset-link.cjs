const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const logPath = path.resolve(
  __dirname,
  "../../dev-logs/password-resets.log"
);

if (!fs.existsSync(logPath)) {
  console.error("No password reset log found.");
  process.exit(1);
}

const lines = fs.readFileSync(logPath, "utf8")
  .split(/\r?\n/)
  .filter(line => line.includes("Reset URL: "));

if (lines.length === 0) {
  console.error("No reset links found.");
  process.exit(1);
}

const url = lines[lines.length - 1]
  .split("Reset URL: ")[1]
  .trim();

const parsed = new URL(url);

if (
  parsed.origin !== "http://localhost:8443" ||
  parsed.pathname !== "/reset-password" ||
  !/^[a-f0-9]{64}$/.test(parsed.searchParams.get("token") || "")
) {
  console.error("Invalid development reset link.");
  process.exit(1);
}

execFileSync("open", [url]);

console.log("Password reset page opened successfully.");
