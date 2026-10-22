import { homedir } from "node:os";
import { join } from "node:path";

export const VERSION = "1.4.0";
export const DEFAULT_PORT = 10110;
export const HOST = "127.0.0.1";
export const DEEPSEEK_MODELS = Object.freeze([
  // The picker slug carries the upstream version on purpose: the model menu
  // must never show a stale or generic name. Upgrading the model is these two
  // lines (pickerSlug + wireModel) plus a `dscodex sync`; the retired slug goes
  // into LEGACY_DEEPSEEK_MODELS below so resumed tasks keep routing without
  // reappearing in the menu.
  Object.freeze({
    pickerSlug: "deepseek/deepseek-v4.1-flash",
    wireModel: "deepseek-v4.1-flash",
    displayName: "🐳 DeepSeek V4.1 Flash (Go)",
    productName: "DeepSeek V4.1 Flash",
  }),
  // Adding a second OpenCode Go model later is one more frozen entry here:
  // OpenCode Go serves gpt-6-luna on the same Responses wire, e.g.
  // { pickerSlug: "deepseek/gpt-6-luna", wireModel: "gpt-6-luna",
  //   displayName: "🌙 GPT-6 Luna (Go)", productName: "GPT-6 Luna" }
]);

// Keep resumed tasks and user-owned model settings routable after migration.
// Every retired wire name maps onto the current Flash entry, otherwise a stale
// entry in Codex's models_cache.json is treated as a native model and shows up
// as a broken picker item.
const LEGACY_DEEPSEEK_MODELS = new Set([
  "deepseek-v4-flash", "deepseek-v4-pro", "deepseek-v4-flash-vision-exp",
  "deepseek-v4-1-flash", "deepseek-flash", "ark-code-latest",
]);
export const DEEPSEEK_BASE_URL = "https://opencode.ai/zen/go/v1";
// OpenCode Go refuses requests without this header (HTTP 400 MissingSessionID)
// and uses it to pin one conversation to one upstream for prompt-cache warmth.
export const OPENCODE_SESSION_HEADER = "x-opencode-session";
export const CHATGPT_CODEX_BASE_URL = "https://chatgpt.com/backend-api/codex";
export const MANAGED_MARKER = "# DSCodex managed; remove with `dscodex uninstall`";

export function deepSeekModelFor(model) {
  if (typeof model !== "string") return null;
  const wireModel = model.startsWith("deepseek/") ? model.slice("deepseek/".length) : model;
  const exact = DEEPSEEK_MODELS.find((entry) => entry.wireModel === wireModel);
  if (exact) return exact;
  return LEGACY_DEEPSEEK_MODELS.has(wireModel) ? DEEPSEEK_MODELS[0] : null;
}

export function resolveCodexHome(env = process.env) {
  return env.CODEX_HOME?.trim() || join(homedir(), ".codex");
}

// Windows cannot spawn .cmd/.bat directly (CreateProcess needs an .exe), so those
// launchers must go through the command interpreter. POSIX scripts need no shell.
export function needsShellSpawn(executablePath, platform = process.platform) {
  return platform === "win32" && /\.(?:cmd|bat)$/i.test(executablePath);
}

export function pathsFor(codexHome) {
  return {
    config: join(codexHome, "config.toml"),
    cache: join(codexHome, "models_cache.json"),
    catalog: join(codexHome, "dscodex-models.json"),
    backup: join(codexHome, "config.toml.pre-dscodex.bak"),
    stateDir: join(codexHome, "dscodex"),
    keyFile: join(codexHome, "dscodex", "config.json"),
    selectionState: join(codexHome, "dscodex", "model-selections.json"),
    bridgeShim: join(codexHome, "dscodex", "codex-cli-bridge.sh"),
    pid: join(codexHome, "dscodex", "server.pid"),
    log: join(codexHome, "dscodex", "server.log"),
  };
}
