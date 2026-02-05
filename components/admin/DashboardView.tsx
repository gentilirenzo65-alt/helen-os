import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, Repeat, Star, MessageCircle, Calendar, Maximize2, X, Headphones, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const DashboardView: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('popular');
  const [stats, setStats] = useState<any>({ activeUsers: 0, userChange: '0%', userChangePositive: true, topContent: [], revenue: 0, retention: 0, renewal: { m1: 0, m2: 0, m3: 0 }, revenueData: [] });
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Support stats
  const [supportStats, setSupportStats] = useState<any>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    avgResponseTime: '-',
    satisfactionRate: 0,
    chartData: []
  });
  const [supportDateRange, setSupportDateRange] = useState({ start: '', end: '' });
  const [loadingSupport, setLoadingSupport] = useState(true);

  // Fetch main stats
  React.useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setStats(data);
        }
      })
      .catch(err => {
        console.error('Error loading stats:', err);
        setError('Error de conexión al cargar estadísticas');
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch support stats
  const fetchSupportStats = async (start?: string, end?: string) => {
    setLoadingSupport(true);
    try {
      let url = '/api/admin/support/stats';
      if (start && end) {
        url += `?start=${start}&end=${end}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!data.error) {
        setSupportStats(data);
      }
    } catch (err) {
      console.error('Error loading support stats:', err);
    } finally {
      setLoadingSupport(false);
    }
  };

  useEffect(() => {
    fetchSupportStats();
  }, []);

  const handleSupportFilter = () => {
    if (supportDateRange.start && supportDateRange.end) {
      fetchSupportStats(supportDateRange.start, supportDateRange.end);
    }
  };

  const toggleExpand = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
          <span className="text-gray-500 font-medium">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <X size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Error al cargar</h3>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

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
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Detalle de Facturación</h2>
                    <p className="text-gray-500">Análisis detallado de ingresos por suscripciones, renovaciones y upgrades.</p>
                  </div>

                  {/* Custom Date Filter Only in Expanded View */}
                  <div className="flex gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Desde</label>
                      <input
                        type="date"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                        className="bg-white border-gray-200 border rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-black/5 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Hasta</label>
                      <input
                        type="date"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                        className="bg-white border-gray-200 border rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-black/5 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                      Filtrar
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 bg-white rounded-2xl p-6 border border-slate-100 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(stats as any).revenueData || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }}
                        dx={-10}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '16px',
                          border: 'none',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                          padding: '12px 16px',
                          backgroundColor: '#1e293b'
                        }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        cursor={{ fill: '#F8FAFC' }}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#E6B8AF"
                        radius={[6, 6, 0, 0]}
                        barSize={40}
                        activeBar={{ fill: '#dcb5ad' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {expandedSection === 'content' && (
              <div className="h-full flex flex-col bg-white rounded-3xl overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800">Rendimiento Detallado</h2>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {[
                      { key: 'popular', label: 'Populares' },
                      { key: 'recent', label: 'Recientes' },
                      { key: 'lowest', label: 'Menor Rendimiento' }
                    ].map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => setSortBy(filter.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${sortBy === filter.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-6 pt-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setSortBy('title')}>
                          Contenido {sortBy === 'title' && '↓'}
                        </th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setSortBy('popular')}>
                          Likes {sortBy === 'popular' && '↓'}
                        </th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setSortBy('notes')}>
                          Notas {sortBy === 'notes' && '↓'}
                        </th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setSortBy('engagement')}>
                          Engagement Rate {sortBy === 'engagement' && '↓'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        let content = [...(stats.topContent as any[])];
                        // Sorting Logic
                        if (sortBy === 'popular') content.sort((a, b) => b.likes - a.likes);
                        if (sortBy === 'notes') content.sort((a, b) => b.notesCount - a.notesCount);
                        // if (sortBy === 'recent') ... removed as column is removed
                        if (sortBy === 'title') content.sort((a, b) => a.title.localeCompare(b.title));

                        // Engagement Formula: (Likes + Notes) / Active Users
                        if (sortBy === 'engagement') {
                          content.sort((a, b) => {
                            const totalA = a.likes + (a.notesCount || 0);
                            const totalB = b.likes + (b.notesCount || 0);
                            const rateA = stats.activeUsers > 0 ? (totalA / stats.activeUsers) : 0;
                            const rateB = stats.activeUsers > 0 ? (totalB / stats.activeUsers) : 0;
                            return rateB - rateA;
                          });
                        }

                        return content.length > 0 ? content.map((item, idx) => {
                          // Engagement Calculation
                          const totalInteractions = item.likes + (item.notesCount || 0);
                          const engagementRate = stats.activeUsers > 0
                            ? ((totalInteractions / stats.activeUsers) * 100).toFixed(1)
                            : '0.0';
                          const isHigh = parseFloat(engagementRate) > 20;

                          return (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                              <td className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-100">
                                    <img src={item.media[0]?.url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-800 text-sm max-w-[200px] truncate">{item.title}</div>
                                    <div className="text-xs text-gray-400">Día {item.releaseDay}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-bold text-gray-800">{item.likes}</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-bold text-gray-800">{item.notesCount || 0}</span>
                              </td>
                              <td className="p-4 text-right">
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isHigh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {engagementRate}%
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-gray-400">
                              No hay datos para mostrar.
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
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
          value={stats.activeUsers.toString()}
          change={stats.userChange}
          isPositive={stats.userChangePositive}
          icon={Users}
          subtitle="vs ayer"
        />
        <StatCard
          title="Retención > 24h"
          value="-"
          change="-"
          isPositive={true}
          icon={Repeat}
          subtitle="Post-registro"
        />
        <StatCard
          title="Renovación (1 Mes)"
          value={stats.renewal?.m1 ? `${stats.renewal.m1}%` : '-'}
          change="-"
          isPositive={parseInt(stats.renewal?.m1 || '0') > 50}
          icon={Calendar}
          subtitle="Conversión"
        />
        <StatCard
          title="Ingresos Totales"
          value={`$${stats.revenue.toLocaleString()}`}
          change="-"
          isPositive={true}
          icon={Star}
          subtitle="Facturación histórica"
        />
      </div >

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
              {['7d', '14d', '21d'].map((range) => (
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
              {/* Use real revenueData if available, fallback to empty array to avoid crash */}
              <BarChart data={stats.revenueData && stats.revenueData.length > 0 ? stats.revenueData : []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                  itemStyle={{ color: '#E6B8AF', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="amount" fill="#E6B8AF" radius={[4, 4, 0, 0]} barSize={30} activeBar={{ fill: '#dcb5ad' }} />
              </BarChart>
            </ResponsiveContainer>
            {(!stats.revenueData || stats.revenueData.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-white/50">
                Sin datos de facturación aún
              </div>
            )}
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
            {(stats.topContent as any[]) && (stats.topContent as any[]).length > 0 ? (stats.topContent as any[]).slice(0, 4).map((item: any, idx: number) => (
              <div key={item.id} className="flex gap-4 items-start p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {/* Display first image of media array */}
                  <img src={item.media[0]?.url || 'https://via.placeholder.com/150'} alt={item.title} className="w-full h-full object-cover" />
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
            )) : (
              <div className="text-gray-400 text-sm p-4 text-center">Sin interacciones suficientes para ranking.</div>
            )}
          </div>
          <button onClick={() => toggleExpand('content')} className="mt-4 w-full py-2 text-sm text-accent font-medium hover:bg-accent/10 rounded-lg transition-colors">
            Ver métricas detalladas
          </button>
        </div>
      </div >

      {/* Renewal Breakdown Row */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Desglose de Renovaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-3xl font-bold text-gray-800 mb-1">{stats.renewal?.m1 || 0}%</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">1er Mes</div>
            <div className={`mt-2 text-xs flex items-center justify-center gap-1 ${parseInt(stats.renewal?.m1 || '0') > 50 ? 'text-green-600' : 'text-red-500'}`}>
              {parseInt(stats.renewal?.m1 || '0') > 50 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {parseInt(stats.renewal?.m1 || '0') > 50 ? 'Estable' : 'Atención requerida'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-3xl font-bold text-gray-800 mb-1">{stats.renewal?.m2 || 0}%</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">2do Mes</div>
            <div className={`mt-2 text-xs flex items-center justify-center gap-1 ${parseInt(stats.renewal?.m2 || '0') > 40 ? 'text-green-600' : 'text-red-500'}`}>
              {parseInt(stats.renewal?.m2 || '0') > 40 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {parseInt(stats.renewal?.m2 || '0') > 40 ? 'Estable' : 'Critico'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-3xl font-bold text-gray-800 mb-1">{stats.renewal?.m3 || 0}%</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">3er Mes</div>
            <div className={`mt-2 text-xs flex items-center justify-center gap-1 ${parseInt(stats.renewal?.m3 || '0') > 30 ? 'text-green-600' : 'text-red-500'}`}>
              {parseInt(stats.renewal?.m3 || '0') > 30 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {parseInt(stats.renewal?.m3 || '0') > 30 ? 'Estable' : 'Baja Retención'}
            </div>
          </div>
        </div>
      </div>

      {/* Support Metrics Section - At the very end */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Headphones className="text-blue-500" size={20} />
              Métricas de Soporte
            </h2>
            <p className="text-sm text-gray-500">Rendimiento del equipo de atención al cliente</p>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <input
              type="date"
              value={supportDateRange.start}
              onChange={(e) => setSupportDateRange({ ...supportDateRange, start: e.target.value })}
              className="bg-white border text-xs rounded px-2 py-1 outline-none focus:ring-2 ring-blue-500/20"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={supportDateRange.end}
              onChange={(e) => setSupportDateRange({ ...supportDateRange, end: e.target.value })}
              className="bg-white border text-xs rounded px-2 py-1 outline-none focus:ring-2 ring-blue-500/20"
            />
            <button
              onClick={handleSupportFilter}
              className="bg-gray-900 text-white p-1.5 rounded hover:bg-gray-800 transition-colors"
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {loadingSupport ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Key Metrics */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Tiempo Respuesta</p>
                  <p className="text-2xl font-bold text-gray-900">{supportStats.avgResponseTime}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <Clock size={20} />
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Satisfacción</p>
                  <p className="text-2xl font-bold text-gray-900">{supportStats.satisfactionRate}%</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <Star size={20} className="fill-current" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-900">{supportStats.openTickets}</p>
                  <p className="text-xs text-gray-500 font-medium">Abiertos</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-900">{supportStats.closedTickets}</p>
                  <p className="text-xs text-gray-500 font-medium">Cerrados</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="lg:col-span-2 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-4">Tickets por día</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={supportStats.chartData}>
                    <defs>
                      <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="tickets" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
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
