import { HomeDashboard } from "./pages/HomeDashboard";
import { TaskList } from "./pages/tugas/TaskList";
import { IssueList } from "./pages/isu/IssueList";
import { WorkloadHeatmap } from "./pages/sdm/WorkloadHeatmap";
import { ProjectList } from "./pages/proyek/ProjectList";
import { ProjectDetail } from "./pages/proyek/ProjectDetail";
import { EmployeeMaster } from "./pages/master/EmployeeMaster";
import { RoleMaster } from "./pages/master/RoleMaster";
import { ProfilePage } from "./pages/kustomisasi/ProfilePage";
import { SettingsPlaceholder } from "./pages/kustomisasi/SettingsPlaceholder";

export const routes = [
  { index: true, path: "/", component: HomeDashboard },
  { path: "/tugas/list", component: TaskList },
  { path: "/isu/list", component: IssueList },
  { path: "/sdm/workload", component: WorkloadHeatmap },
  { path: "/proyek/list", component: ProjectList },
  { path: "/proyek/:id", component: ProjectDetail },
  { path: "/master/pegawai", component: EmployeeMaster },
  { path: "/master/role", component: RoleMaster },
  { path: "/profile", component: ProfilePage },
  { path: "/settings", component: SettingsPlaceholder }
];
