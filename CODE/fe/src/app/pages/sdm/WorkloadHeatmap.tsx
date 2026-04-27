import { CalendarDays, RefreshCw, Info } from "lucide-react";
import { teamMembers } from "../../data/mockData";
import { useState } from "react";

export function WorkloadHeatmap() {
  const [simulationMode, setSimulationMode] = useState(false);

  const days = ["Sen", "Sel", "Rab", "Kam", "Jum"];
  const getCapacityColor = (hours: number) => {
    if (hours === 0) return "bg-slate-100 hover:bg-slate-200 border-slate-200";
    if (hours > 0 && hours <= 6) return "bg-emerald-100 hover:bg-emerald-200 border-emerald-200 text-emerald-800";
    if (hours > 6 && hours <= 8) return "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-800";
    return "bg-red-400 hover:bg-red-500 border-red-500 text-white shadow-sm font-bold animate-pulse";
  };

  const mockWeeklyData = [
    { id: "u1", loads: [8, 10, 4, 6, 8] },
    { id: "u2", loads: [4, 4, 0, 8, 2] },
    { id: "u3", loads: [8, 8, 8, 8, 8] },
    { id: "u4", loads: [2, 12, 10, 0, 4] },
  ];

  return (
    <div className={`h-full flex flex-col bg-white transition-all ${simulationMode ? "ring-4 ring-orange-400" : ""}`}>
      {/* Simulation Banner */}
      {simulationMode && (
        <div className="bg-orange-50 px-6 py-2 border-b border-orange-200 flex items-center justify-between">
          <div className="flex items-center text-orange-800 text-sm font-bold">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin-slow" /> 
            MODE SIMULASI (WHAT-IF) AKTIF
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSimulationMode(false)} className="text-xs px-3 py-1 font-medium text-slate-600 hover:bg-orange-100 rounded">Batalkan</button>
            <button onClick={() => setSimulationMode(false)} className="text-xs px-3 py-1 font-medium bg-orange-600 text-white rounded hover:bg-orange-700">Terapkan Perubahan</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kapasitas & Beban Kerja (Heatmap)</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau utilisasi dan hindari burnout pada tim Anda.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSimulationMode(!simulationMode)}
            className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${simulationMode ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> 
            {simulationMode ? "Tutup Simulasi" : "Simulasi Drag & Drop"}
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
        <button className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
          <CalendarDays className="w-4 h-4 mr-2" /> Minggu Ini (10-14 Nov)
        </button>
        
        <select className="border border-slate-300 rounded-md py-1.5 px-3 text-sm text-slate-700 bg-white shadow-sm focus:outline-none focus:border-indigo-500">
          <option>Departemen: Semua</option>
          <option>Engineering</option>
          <option>Design</option>
        </select>

        <div className="ml-auto flex items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 inline-block mr-1"></span> Optimal</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block mr-1"></span> Padat</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded bg-red-400 border border-red-500 inline-block mr-1"></span> Over-allocated</div>
        </div>
      </div>

      {/* Main Heatmap Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-[700px]">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-1/4 px-6 py-4 font-semibold text-slate-700">Anggota Tim</th>
                {days.map(day => (
                  <th key={day} className="px-2 py-4 font-semibold text-slate-700 text-center border-l border-slate-200">
                    {day}<br/><span className="text-xs font-normal text-slate-400">Nov</span>
                  </th>
                ))}
                <th className="w-24 px-4 py-4 font-semibold text-slate-700 text-right border-l border-slate-200">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockWeeklyData.map(data => {
                const user = teamMembers.find(u => u.id === data.id)!;
                const total = data.loads.reduce((a, b) => a + b, 0);
                
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex flex-shrink-0 flex items-center justify-center text-xs font-bold mr-3 ${user.color}`}>{user.avatar}</div>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.role}</div>
                        </div>
                      </div>
                    </td>
                    
                    {data.loads.map((hours, idx) => (
                      <td key={idx} className="p-2 border-l border-slate-100 text-center">
                        <div className={`w-full h-12 rounded border flex flex-col items-center justify-center cursor-pointer transition-all ${getCapacityColor(hours)} ${simulationMode ? 'hover:scale-105 shadow hover:ring-2 ring-indigo-400' : ''}`}>
                          <span className="font-semibold">{hours}h</span>
                          {hours > 8 && <span className="text-[10px] opacity-90"><Info className="inline w-3 h-3" /> Over</span>}
                        </div>
                      </td>
                    ))}

                    <td className="px-4 py-4 text-right border-l border-slate-100">
                      <span className={`font-bold ${total > 40 ? 'text-red-600' : 'text-slate-700'}`}>{total}h</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

