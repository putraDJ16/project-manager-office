import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertOctagon, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const burndownData = [
  { day: 'H1', expected: 100, actual: 100 },
  { day: 'H2', expected: 85, actual: 95 },
  { day: 'H3', expected: 70, actual: 75 },
  { day: 'H4', expected: 55, actual: 60 },
  { day: 'H5', expected: 40, actual: 45 },
  { day: 'H6', expected: 25, actual: 20 },
  { day: 'H7', expected: 10, actual: 10 },
];

const capacityData = [
  { name: 'Andi J.', role: 'Lead Dev', load: 85, color: 'bg-amber-500', barState: 'bg-amber-100' },
  { name: 'Budi S.', role: 'QA', load: 60, color: 'bg-emerald-500', barState: 'bg-emerald-100' },
  { name: 'Citra W.', role: 'UI/UX', load: 40, color: 'bg-emerald-500', barState: 'bg-emerald-100' },
  { name: 'Dina M.', role: 'Backend', load: 95, color: 'bg-red-500', barState: 'bg-red-100' },
];

export function HomeDashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Halo, Manajer Proyek! ðŸ‘‹</h1>
          <p className="text-slate-500 mt-1">Berikut adalah ringkasan kesehatan proyek dan prioritas Anda hari ini.</p>
        </div>
        <div>
          <select className="border border-slate-300 rounded-md py-1.5 px-3 text-sm font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>Semua Proyek (Global Scope)</option>
            <option>Proyek Transformasi Digital</option>
            <option>Proyek Security Audit</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Tugas Aktif Hari Ini" value="12" icon={<CheckCircle2 className="text-indigo-500 w-5 h-5" />} trend="+2 dari kemarin" trendUp={true} />
        <KPICard title="Tugas Overdue" value="3" icon={<Clock className="text-amber-500 w-5 h-5" />} trend="-1 minggu ini" trendUp={true} />
        <KPICard title="Bugs Kritis (Eskalasi)" value="1" icon={<AlertOctagon className="text-red-500 w-5 h-5" />} trend="+1 darurat baru" trendUp={false} />
        <KPICard title="Sisa Waktu Sprint" value="4 Hari" icon={<Activity className="text-emerald-500 w-5 h-5" />} trend="On-Track" trendUp={true} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Sprint Burn-down & Progress</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burndownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                  labelStyle={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="expected" stroke="#94a3b8" strokeDasharray="5 5" fill="none" strokeWidth={2} name="Ideal Burndown" />
                <Area type="monotone" dataKey="actual" stroke="#4f46e5" fillOpacity={1} fill="url(#colorActual)" strokeWidth={3} name="Sisa Tugas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Kesehatan Kapasitas Tim</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-5">
            {capacityData.map((member, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 leading-none">{member.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{member.role}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${member.load >= 90 ? 'text-red-600' : member.load >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{member.load}%</span>
                </div>
                <div className={`h-2.5 w-full rounded-full ${member.barState}`}>
                  <div className={`h-full rounded-full ${member.color}`} style={{ width: `${member.load}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-slate-800">Tindak Lanjut Mendesak (My Priorities)</h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Lihat Semua</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Prioritas/SLA</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Tenggat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">Perbaikan Navbar Error</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-700">Blocker</span></td>
                  <td className="px-4 py-3 text-slate-600">Investigating</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">Batas: 1 Jam</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">Desain API Gateway</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md bg-amber-100 text-amber-700">High</span></td>
                  <td className="px-4 py-3 text-slate-600">In Progress</td>
                  <td className="px-4 py-3 text-right text-amber-600 font-medium">Hari Ini</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">Review PR Modul Tim</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-700">Medium</span></td>
                  <td className="px-4 py-3 text-slate-600">Review</td>
                  <td className="px-4 py-3 text-right text-slate-500">Besok</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Activity Feed</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-700">AJ</div>
              <div>
                <p className="text-sm text-slate-800"><span className="font-semibold">Andi J.</span> menyelesaikan tugas <span className="font-medium">Setup Recharts</span></p>
                <p className="text-xs text-slate-500 mt-0.5">15 menit yang lalu</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-red-700">SYS</div>
              <div>
                <p className="text-sm text-slate-800"><span className="font-semibold">System</span> mengeskalasi Bug #404 karena melebihi SLA</p>
                <p className="text-xs text-slate-500 mt-0.5">1 jam yang lalu</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

function KPICard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <div className={`flex items-center text-xs font-medium mt-1 ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {trend}
        </div>
      </div>
    </div>
  )
}

