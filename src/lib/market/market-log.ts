import type { LogEntryType, LogPriority, OpLogMessage, OperationalLogEntry } from "@/lib/simulation/cognition-types";

let serial = 0;

function nid(): string {
  serial += 1;
  return `mkt-${Date.now()}-${serial}`;
}

function clock(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function marketEntry(args: {
  entryType: LogEntryType;
  priority: LogPriority;
  headline: string;
  summary: string;
  whyMatters?: string;
  message?: OpLogMessage;
}): OperationalLogEntry {
  return {
    id: nid(),
    simTick: 0,
    simulatedClockLabel: `LIVE ${clock()}`,
    entryType: args.entryType,
    priority: args.priority,
    headline: args.headline,
    summary: args.summary,
    whyMatters: args.whyMatters,
    message: args.message,
  };
}

