import type { AuthSession } from "../data/auth";
import type { ModuleKey, PermissionSet } from "../data/masterData";

const actions: Array<keyof PermissionSet> = ["view", "create", "edit", "delete", "restore"];
const permissionFallbacks: Partial<Record<ModuleKey, ModuleKey[]>> = {
  projectIssues: ["issues"]
};

export function hasPermission(
  session: AuthSession | null | undefined,
  module: ModuleKey,
  action: keyof PermissionSet
) {
  const permission = session?.permissions?.[module];
  if (permission?.[action]) return true;

  const fallbacks = permissionFallbacks[module] ?? [];
  return fallbacks.some((fallbackModule) => Boolean(session?.permissions?.[fallbackModule]?.[action]));
}

export function normalizeSessionPermissions(session: AuthSession): AuthSession {
  if (!session.permissions) return session;

  const normalized = Object.entries(session.permissions).reduce<Partial<Record<ModuleKey, PermissionSet>>>(
    (acc, [moduleKey, permission]) => {
      acc[moduleKey as ModuleKey] = actions.reduce<PermissionSet>(
        (permissionAcc, action) => ({
          ...permissionAcc,
          [action]: Boolean(permission?.[action])
        }),
        { view: false, create: false, edit: false, delete: false, restore: false }
      );
      return acc;
    },
    {}
  );

  return { ...session, permissions: normalized };
}
