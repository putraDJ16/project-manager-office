import { HomeDashboard } from "./pages/HomeDashboard";
import { IssueList } from "./pages/isu/IssueList";
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
import type { ModuleKey } from "./data/masterData";
import type { ComponentType } from "react";

export type AppRoute = {
  index?: boolean;
  path: string;
  component: ComponentType;
  module?: ModuleKey;
};

export const routes: AppRoute[] = [
  { index: true, path: "/", component: HomeDashboard, module: "dashboard" },
  { path: "/tugas-saya", component: MyTasksPage },
  { path: "/isu/list", component: IssueList, module: "projectIssues" },
  { path: "/sdm/workload", component: WorkloadHeatmap, module: "workload" },
  { path: "/proyek/list", component: ProjectList, module: "masterProjects" },
  { path: "/proyek/monitoring", component: ProjectMonitoring, module: "masterProjects" },
  { path: "/proyek/:id", component: ProjectDetail, module: "masterProjects" },
  { path: "/master/pegawai", component: EmployeeMaster, module: "masterEmployees" },
  { path: "/master/role", component: RoleMaster, module: "masterRoles" },
  { path: "/master/organisasi", component: OrganizationMaster, module: "masterOrganizations" },
  { path: "/master/unit-organisasi", component: OrganizationUnitMaster, module: "masterOrganizationUnits" },
  { path: "/master/jabatan", component: PositionMaster, module: "masterPositions" },
  { path: "/notifications", component: NotificationsPage },
  { path: "/profile", component: ProfilePage },
  { path: "/settings", component: SettingsPlaceholder }
];
