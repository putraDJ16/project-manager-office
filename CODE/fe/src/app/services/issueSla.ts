import { type Issue, type IssueSeverity, type SlaConfig, type SlaRule } from "../domain/issues";

export type SlaIndicatorTone = "safe" | "warning" | "breached" | "resolved";

export type SlaIndicator = {
  label: string;
  tone: SlaIndicatorTone;
  remainingMs: number;
};

export function getRuleBySeverity(config: SlaConfig, severity: IssueSeverity): SlaRule {
  return config.rules.find((rule) => rule.severity === severity) ?? config.rules[0];
}

export function getSlaIndicator(issue: Issue, config: SlaConfig, nowMs: number = Date.now()): SlaIndicator {
  if (issue.status === "Resolved") {
    return {
      label: "Selesai",
      tone: "resolved",
      remainingMs: 0
    };
  }

  const rule = getRuleBySeverity(config, issue.severity);
  const deadlineMs = new Date(issue.createdAt).getTime() + rule.targetHours * 60 * 60 * 1000;
  const remainingMs = deadlineMs - nowMs;

  if (remainingMs <= 0) {
    return {
      label: `Lewat ${formatDuration(Math.abs(remainingMs))}`,
      tone: "breached",
      remainingMs
    };
  }

  if (remainingMs <= 60 * 60 * 1000) {
    return {
      label: `Sisa ${formatDuration(remainingMs)}`,
      tone: "warning",
      remainingMs
    };
  }

  return {
    label: `Sisa ${formatDuration(remainingMs)}`,
    tone: "safe",
    remainingMs
  };
}

export function shouldAutoEscalate(issue: Issue, config: SlaConfig, nowMs: number = Date.now()) {
  if (issue.status === "Escalated" || issue.status === "Resolved") {
    return false;
  }

  const rule = getRuleBySeverity(config, issue.severity);
  if (!rule.autoEscalate) {
    return false;
  }

  const createdMs = new Date(issue.createdAt).getTime();
  const escalationTriggerMs =
    createdMs + rule.targetHours * 60 * 60 * 1000 + rule.escalationDelayMinutes * 60 * 1000;

  return nowMs >= escalationTriggerMs;
}

function formatDuration(durationMs: number) {
  const totalMinutes = Math.max(0, Math.round(durationMs / (1000 * 60)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}j`;
  return `${hours}j ${minutes}m`;
}
