import { HomeDashboard } from "./pages/HomeDashboard";
import { DesignSystemTest } from "./pages/DesignSystemTest";
import { IssueList } from "./pages/isu/IssueList";
import { IssueDetailPage } from "./pages/isu/IssueDetailPage";
import { MyTasksPage } from "./pages/tugas/MyTasksPage";
import { WorkloadHeatmap } from "./pages/sdm/WorkloadHeatmap";
import { ProjectList } from "./pages/proyek/ProjectList";
import { ProjectDetail } from "./pages/proyek/ProjectDetail";
import { ProjectMonitoring } from "./pages/proyek/ProjectMonitoring";
import { EmployeeMaster } from "./pages/master/EmployeeMaster";
import { RoleMaster } from "./pages/master/RoleMaster";
import { OrganizationMaster } from "./pages/master/OrganizationMaster";
import { OrganizationUnitMaster } from "./pages/master/OrganizationUnitMaster";
import { PositionMaster } from "./pages/master/PositionMaster";
import { NotificationsPage } from "./pages/kustomisasi/NotificationsPage";
import { ProfilePage } from "./pages/kustomisasi/ProfilePage";
import { SettingsPlaceholder } from "./pages/kustomisasi/SettingsPlaceholder";
import { EmailPreferencesPage } from "./pages/profile/EmailPreferencesPage";
import { EmailOutboxPage } from "./pages/admin/EmailOutboxPage";
import type { ModuleKey } from "./data/masterData";
import type { ComponentType } from "react";

export type AppRoute = {
  index?: boolean;
  path: string;
  component: ComponentType;
  module?: ModuleKey | ModuleKey[];
};

export const routes: AppRoute[] = [
  { index: true, path: "/", component: HomeDashboard, module: "dashboard" },
  { path: "/design-system-test", component: DesignSystemTest },
  { path: "/tugas-saya", component: MyTasksPage, module: "tasks" },
  { path: "/isu/list", component: IssueList, module: "issues" },
  { path: "/isu/:issueId", component: IssueDetailPage, module: ["issues", "projectIssues"] },
  { path: "/sdm/workload", component: WorkloadHeatmap, module: "workload" },
  { path: "/proyek/list", component: ProjectList, module: ["masterProjects", "projectMembers", "projectTasks", "projectGantt", "projectTimesheets", "projectAttachments", "projectMeetings"] },
  { path: "/proyek/monitoring", component: ProjectMonitoring, module: "calendar" },
  { path: "/proyek/:id", component: ProjectDetail, module: ["masterProjects", "projectMembers", "projectTasks", "projectGantt", "projectTimesheets", "projectAttachments", "projectMeetings"] },
  { path: "/master/pegawai", component: EmployeeMaster, module: "masterEmployees" },
  { path: "/master/role", component: RoleMaster, module: "masterRoles" },
  { path: "/master/organisasi", component: OrganizationMaster, module: "masterOrganizations" },
  { path: "/master/unit-organisasi", component: OrganizationUnitMaster, module: "masterOrganizationUnits" },
  { path: "/master/jabatan", component: PositionMaster, module: "masterPositions" },
  { path: "/notifications", component: NotificationsPage },
  { path: "/profile", component: ProfilePage },
  { path: "/pengaturan/email", component: EmailPreferencesPage, module: "emailPreferences" },
  { path: "/admin/email-log", component: EmailOutboxPage, module: "adminEmailLogs" },
  { path: "/settings", component: SettingsPlaceholder }
];
