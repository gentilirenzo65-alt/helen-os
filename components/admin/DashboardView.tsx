import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, Repeat, Star, MessageCircle, Calendar, Maximize2, X } from 'lucide-react';
import { MOCK_REVENUE_DATA, MOCK_CONTENT } from '@/lib/admin/constants';

const DashboardView: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleExpand = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in relative">
      {/* Modal Overlay for Expanded View */}
      {expandedSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-white w-full h-full max-w-6xl max-h-[90vh] rounded-3xl p-8 flex flex-col shadow-2xl overflow-hidden relative animate-scale-up">
            <button
              onClick={() => setExpandedSection(null)}
              className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            {expandedSection === 'revenue' && (
              <div className="h-full flex flex-col">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Detalle de Facturación</h2>
                <p className="text-gray-500 mb-8">Análisis detallado de ingresos por suscripciones, renovaciones y upgrades.</p>
                <div className="flex-1 min-h-0 bg-gray-50 rounded-2xl p-6 border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...MOCK_REVENUE_DATA, ...MOCK_REVENUE_DATA, ...MOCK_REVENUE_DATA]}>
                      {/* Mocking more data for expanded view */}
                      <defs>
                        <linearGradient id="colorRevenueExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E6B8AF" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#E6B8AF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 14 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 14 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="amount" stroke="#E6B8AF" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenueExp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {expandedSection === 'content' && (
              <div className="h-full flex flex-col">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Rendimiento de Contenido Detallado</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pr-2">
                  {MOCK_CONTENT.concat(MOCK_CONTENT).map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col">
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                        <img src={item.media[0].url} className="w-full h-full object-cover" alt="" />
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                          {item.likes} Likes
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-800">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">Día {item.releaseDay}</p>
                      <div className="mt-auto pt-4 flex gap-2 text-xs">
                        <span className="bg-white px-2 py-1 rounded border border-gray-200">Comentarios: {item.commentsCount}</span>
                        <span className="bg-white px-2 py-1 rounded border border-gray-200">Guardados: {Math.floor(item.likes * 0.4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Usuarios Activos"
          value="2,543"
          change="+12%"
          isPositive={true}
          icon={Users}
          subtitle="Suscripción activa"
        />
        <StatCard
          title="Retención > 24h"
          value="89%"
          change="+2.4%"
          isPositive={true}
          icon={Repeat}
          subtitle="Post-registro"
        />
        <StatCard
          title="Renovación (1 Mes)"
          value="64%"
          change="-1.2%"
          isPositive={false}
          icon={Calendar}
          subtitle="Conversión"
        />
        <StatCard
          title="Ingresos (Hoy)"
          value="$1,240"
          change="+8%"
          isPositive={true}
          icon={Star}
          subtitle="Facturación diaria"
        />
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group">
          <button
            onClick={() => toggleExpand('revenue')}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            title="Expandir vista"
          >
            <Maximize2 size={20} />
          </button>

          <div className="flex items-center justify-between mb-6 pr-12">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Facturación</h2>
              <p className="text-sm text-gray-500">Ingresos brutos por suscripciones</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {['7d', '14d', '30d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${timeRange === range ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E6B8AF" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#E6B8AF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#E6B8AF" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Content Side Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative group">
          <button
            onClick={() => toggleExpand('content')}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            title="Expandir vista"
          >
            <Maximize2 size={20} />
          </button>

          <h2 className="text-lg font-bold text-gray-800 mb-4">Contenido Top</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {MOCK_CONTENT.sort((a, b) => b.likes - a.likes).slice(0, 4).map((item, idx) => (
              <div key={item.id} className="flex gap-4 items-start p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {/* Display first image of media array */}
                  <img src={item.media[0].url} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 bg-black/40 w-full h-full flex items-center justify-center text-white font-bold text-xs">
                    #{idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">{item.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" /> {item.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} /> {item.commentsCount}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 italic truncate">"{item.topComment}"</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => toggleExpand('content')} className="mt-4 w-full py-2 text-sm text-accent font-medium hover:bg-accent/10 rounded-lg transition-colors">
            Ver métricas detalladas
          </button>
        </div>
      </div>

      {/* Renewal Breakdown Row */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Desglose de Renovaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-3xl font-bold text-gray-800 mb-1">64%</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">1er Mes</div>
            <div className="mt-2 text-xs text-green-600 flex items-center justify-center gap-1">
              <ArrowUpRight size={14} /> Estable
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-3xl font-bold text-gray-800 mb-1">42%</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">2do Mes</div>
            <div className="mt-2 text-xs text-red-500 flex items-center justify-center gap-1">
              <ArrowDownRight size={14} /> -3% vs mes pasado
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-3xl font-bold text-gray-800 mb-1">35%</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">3er Mes</div>
            <div className="mt-2 text-xs text-green-600 flex items-center justify-center gap-1">
              <ArrowUpRight size={14} /> +1% vs mes pasado
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Sub-component
const StatCard = ({ title, value, change, isPositive, icon: Icon, subtitle }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 mb-1">{value}</h3>
      <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
        {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
        {change}
      </div>
      <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
    </div>
    <div className="p-3 bg-sidebar rounded-xl text-white">
      <Icon size={20} />
    </div>
  </div>
);

export default DashboardView;
