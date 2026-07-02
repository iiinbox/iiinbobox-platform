#!/usr/bin/env node
const http = require("http");
const crypto = require("crypto");
const { spawn } = require("child_process");
const path = require("path");

const SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";
const PORT = 9001;
const SCRIPT = path.join(__dirname, "deploy-web.sh");

let deploying = false;

http
  .createServer((req, res) => {
    if (req.method === "GET") {
      res.writeHead(200);
      res.end("iiinbox deploy webhook running");
      return;
    }
    if (req.method !== "POST" || req.url !== "/deploy") {
      res.writeHead(404);
      res.end();
      return;
    }

    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (SECRET) {
        const sig = req.headers["x-hub-signature-256"] || "";
        const expected =
          "sha256=" +
          crypto.createHmac("sha256", SECRET).update(body).digest("hex");
        try {
          if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
            res.writeHead(401);
            res.end("Unauthorized");
            return;
          }
        } catch {
          res.writeHead(401);
          res.end("Unauthorized");
          return;
        }
      }

      const event = req.headers["x-github-event"];
      let payload;
      try { payload = JSON.parse(body); } catch { payload = {}; }

      if (event !== "push" || payload.ref !== "refs/heads/main") {
        res.writeHead(200);
        res.end("Skipped");
        return;
      }

      res.writeHead(200);
      res.end("Deploy started");

      if (deploying) {
        console.log("[webhook] Deploy already running — skipping");
        return;
      }

      deploying = true;
      console.log(`[webhook] Deploy triggered at ${new Date().toISOString()}`);

      const proc = spawn("bash", [SCRIPT], {
        cwd: "/opt/iiiiibox",
        env: { ...process.env },
        stdio: "inherit",
      });

      proc.on("close", (code) => {
        deploying = false;
        console.log(`[webhook] Deploy finished (code ${code}) at ${new Date().toISOString()}`);
      });
    });
  })
  .listen(PORT, () => console.log(`[webhook] Listening on port ${PORT}`));
