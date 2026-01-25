import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

interface XPChartProps {
    data: Array<{ date: string; xp: number }>;
    height?: number;
}

export const XPChart: React.FC<XPChartProps> = ({ data, height = 120 }) => {
    const chartData = useMemo(() => {
        if (data.length === 0) return { points: '', maxXP: 0, minXP: 0 };

        const maxXP = Math.max(...data.map(d => d.xp), 1);
        const minXP = Math.min(...data.map(d => d.xp), 0);
        const range = maxXP - minXP || 1;

        const padding = 10;
        const chartWidth = 100; // percentage
        const chartHeight = height - padding * 2;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * (chartWidth);
            const y = chartHeight - ((d.xp - minXP) / range) * chartHeight + padding;
            return `${x},${y}`;
        }).join(' ');

        return { points, maxXP, minXP };
    }, [data, height]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
                Sem dados de XP ainda
            </div>
        );
    }

    const totalXP = data.reduce((sum, d) => sum + d.xp, 0);
    const avgXP = Math.round(totalXP / data.length);

    return (
        <div className="bg-black/30 rounded-lg p-3 border border-gray-700/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-yellow-100">
                    <TrendingUp size={18} />
                    <span className="font-rpg text-sm">Progresso de XP</span>
                </div>
                <div className="text-xs text-gray-400">
                    Últimos {data.length} dias
                </div>
            </div>

            {/* Chart */}
            <div className="relative" style={{ height: `${height}px` }}>
                <svg
                    viewBox={`0 0 100 ${height}`}
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    {/* Grid lines */}
                    <line x1="0" y1="25%" x2="100" y2="25%" stroke="rgba(255,255,255,0.1)" strokeDasharray="2,2" />
                    <line x1="0" y1="50%" x2="100" y2="50%" stroke="rgba(255,255,255,0.1)" strokeDasharray="2,2" />
                    <line x1="0" y1="75%" x2="100" y2="75%" stroke="rgba(255,255,255,0.1)" strokeDasharray="2,2" />

                    {/* Area fill */}
                    <polygon
                        points={`0,${height} ${chartData.points} 100,${height}`}
                        fill="url(#xpGradient)"
                        opacity="0.3"
                    />

                    {/* Line */}
                    <polyline
                        points={chartData.points}
                        fill="none"
                        stroke="url(#xpLineGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Gradients */}
                    <defs>
                        <linearGradient id="xpGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="xpLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Data points */}
                {data.length <= 7 && data.map((d, i) => {
                    const x = (i / (data.length - 1 || 1)) * 100;
                    const y = (height - 20) - ((d.xp - chartData.minXP) / (chartData.maxXP - chartData.minXP || 1)) * (height - 40) + 10;
                    return (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-yellow-400 rounded-full border border-yellow-600 transform -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${x}%`, top: `${y}px` }}
                            title={`${d.date}: ${d.xp} XP`}
                        />
                    );
                })}
            </div>

            {/* Stats */}
            <div className="flex justify-between mt-3 text-xs">
                <div className="text-gray-400">
                    <span className="text-yellow-400 font-bold">{totalXP.toLocaleString()}</span> XP total
                </div>
                <div className="text-gray-400">
                    Média: <span className="text-yellow-400 font-bold">{avgXP.toLocaleString()}</span>/dia
                </div>
            </div>
        </div>
    );
};

// Simple bar chart alternative
export const XPBarChart: React.FC<{ data: Array<{ label: string; value: number; color?: string }> }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="space-y-2">
            {data.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16 truncate">{item.label}</span>
                    <div className="flex-1 h-4 bg-black/30 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(item.value / maxValue) * 100}%`,
                                backgroundColor: item.color || '#fbbf24'
                            }}
                        />
                    </div>
                    <span className="text-xs text-yellow-400 w-12 text-right">{item.value}</span>
                </div>
            ))}
        </div>
    );
};
