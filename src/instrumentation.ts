export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const { validateProductionEnv } = await import("@/lib/ops/env-validation");
  const { logOpsEvent } = await import("@/lib/ops/operational-events");

  const result = validateProductionEnv();
  if (!result.ok) {
    logOpsEvent("startup_env_missing", {
      missingCount: result.missing.length,
      keys: result.missing.join(","),
    });
  }
}
