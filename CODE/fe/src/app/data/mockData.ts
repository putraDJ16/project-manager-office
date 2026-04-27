export const teamMembers = [
  { id: "u1", name: "Andi J.", role: "Lead Developer", avatar: "AJ", color: "bg-indigo-100 text-indigo-700" },
  { id: "u2", name: "Budi S.", role: "QA Engineer", avatar: "BS", color: "bg-emerald-100 text-emerald-700" },
  { id: "u3", name: "Citra W.", role: "UI/UX Designer", avatar: "CW", color: "bg-fuchsia-100 text-fuchsia-700" },
  { id: "u4", name: "Dina M.", role: "Backend Developer", avatar: "DM", color: "bg-amber-100 text-amber-700" },
];

export const projects = [
  { id: "p1", name: "Transformasi Digital Kamsiber", status: "Active" },
  { id: "p2", name: "Security Audit Tahunan", status: "Active" },
  { id: "p3", name: "Migrasi Cloud", status: "Planning" },
];

export const mockTasks = [
  { id: "T-101", title: "Setup UI Repo", status: "Done", priority: "Medium", assignee: "u1", project: "p1" },
  { id: "T-102", title: "Review Desain Login", status: "Review", priority: "High", assignee: "u3", project: "p1" },
  { id: "T-103", title: "Integrasi API Otentikasi", status: "In Progress", priority: "Critical", assignee: "u4", project: "p1" },
  { id: "T-104", title: "Testing E2E Modul User", status: "To Do", priority: "Medium", assignee: "u2", project: "p1" },
];
