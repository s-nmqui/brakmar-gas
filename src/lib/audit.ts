import { getDb } from "./db";

export interface AuditEntry {
  actor: string;
  action: string;
  entityType?: string;
  entityId?: number | null;
  details?: string;
}

export function logAudit(entry: AuditEntry): void {
  const db = getDb();
  try {
    db.prepare(
      `INSERT INTO audit_log (actor, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      entry.actor,
      entry.action,
      entry.entityType ?? "",
      entry.entityId ?? null,
      entry.details ?? "",
    );
  } catch {
    // La auditoría nunca debe romper la operación principal.
  }
}