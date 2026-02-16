/**
 * Dev orchestrator: starts ngrok + server + vite with the correct BASE_URL.
 *
 * Usage:
 *   bun run dev         (uses ngrok tunnel)
 *   bun run dev:local   (localhost only, no ngrok)
 */

const USE_NGROK = !process.argv.includes("--local");
const PORT = process.env.PORT ?? "3000";

let baseUrl = `http://localhost:${PORT}`;
let ngrokProc: ReturnType<typeof Bun.spawn> | null = null;
let ngrokOwned = false; // true if we started ngrok (so we kill it on exit)

async function getNgrokUrl(): Promise<string | null> {
  try {
    const res = await fetch("http://127.0.0.1:4040/api/tunnels");
    const data = (await res.json()) as { tunnels: Array<{ public_url: string }> };
    const tunnel = data.tunnels.find((t) => t.public_url.startsWith("https://"));
    return tunnel?.public_url ?? null;
  } catch {
    return null;
  }
}

if (USE_NGROK) {
  // Check if ngrok is already running
  const existingUrl = await getNgrokUrl();
  if (existingUrl) {
    baseUrl = existingUrl;
    console.log(`[dev] Found existing ngrok tunnel: ${baseUrl}`);
  } else {
    console.log("[dev] Starting ngrok tunnel...");
    ngrokProc = Bun.spawn(["ngrok", "http", PORT, "--log", "stdout", "--log-level", "warn"], {
      stdout: "pipe",
      stderr: "inherit",
    });
    ngrokOwned = true;

    // Wait for ngrok to be ready
    for (let i = 0; i < 30; i++) {
      await Bun.sleep(500);
      const url = await getNgrokUrl();
      if (url) {
        baseUrl = url;
        break;
      }
      // Check if ngrok exited early (auth error, etc.)
      if (ngrokProc.exitCode !== null) {
        console.error("[dev] ngrok exited unexpectedly. Is another ngrok session running?");
        console.error("  Kill it with: pkill ngrok");
        process.exit(1);
      }
    }

    if (baseUrl.includes("localhost")) {
      console.error("[dev] Failed to get ngrok URL after 15s.");
      ngrokProc.kill();
      process.exit(1);
    }

    console.log(`[dev] ngrok URL: ${baseUrl}`);
  }
}

// Set BASE_URL for child processes
const env = { ...process.env, BASE_URL: baseUrl };

console.log(`[dev] BASE_URL=${baseUrl}`);
console.log("[dev] Starting server + vite...\n");

// Start server (hot reload)
const serverProc = Bun.spawn(["bun", "run", "--watch", "src/server/index.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env,
});

// Start vite dev server
const viteProc = Bun.spawn(["bun", "vite", "dev", "--config", "vite.config.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env,
});

// Cleanup on exit
function cleanup() {
  console.log("\n[dev] Shutting down...");
  serverProc.kill();
  viteProc.kill();
  if (ngrokOwned && ngrokProc) ngrokProc.kill();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Wait for server or vite to exit (ignore ngrok exits — tunnel may persist)
await Promise.race([serverProc.exited, viteProc.exited]);
cleanup();
