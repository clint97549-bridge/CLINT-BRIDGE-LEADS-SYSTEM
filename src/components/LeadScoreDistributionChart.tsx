import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle,
  Info,
  Filter,
  Layers,
  MapPin,
  Briefcase,
  X,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { Lead } from '../types';

interface LeadScoreDistributionChartProps {
  leads: Lead[];
  onSelectLead?: (lead: Lead) => void;
}

interface ScoreBucket {
  id: string;
  rangeLabel: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
  leads: Lead[];
  currentMonthCount: number;
  previousMonthCount: number;
  grade: 'A' | 'B' | 'Review';
  color: string;
  accentBorder: string;
  bgGlow: string;
  tierLabel: string;
  description: string;
}

export const LeadScoreDistributionChart: React.FC<LeadScoreDistributionChartProps> = ({
  leads,
  onSelectLead,
}) => {
  const [activeBucketId, setActiveBucketId] = useState<string | null>(null);

  // Filter controls state: Niche and Region / Country
  const [selectedNiche, setSelectedNiche] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  // Trend line toggle state
  const [showTrendLine, setShowTrendLine] = useState<boolean>(true);
  const [activeTrendMetric, setActiveTrendMetric] = useState<'both' | 'current' | 'previous'>('both');

  // Extract unique niches and regions/countries for filter dropdowns
  const { availableNiches, availableRegions } = useMemo(() => {
    const nichesSet = new Set<string>();
    const regionsSet = new Set<string>();

    for (const lead of leads) {
      if (lead.industry && lead.industry.trim() && lead.industry !== 'Unknown') {
        nichesSet.add(lead.industry.trim());
      }
      // Region or Country identifier
      const locKey = lead.region && lead.region !== 'Unknown'
        ? `${lead.region}, ${lead.country}`
        : lead.country || lead.city || 'Unknown';
      if (locKey && locKey !== 'Unknown') {
        regionsSet.add(locKey.trim());
      }
    }

    return {
      availableNiches: Array.from(nichesSet).sort(),
      availableRegions: Array.from(regionsSet).sort(),
    };
  }, [leads]);

  // Apply filter to get the active working leads pool
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (selectedNiche !== 'ALL' && lead.industry?.trim() !== selectedNiche) {
        return false;
      }
      if (selectedRegion !== 'ALL') {
        const locKey = lead.region && lead.region !== 'Unknown'
          ? `${lead.region}, ${lead.country}`
          : lead.country || lead.city || 'Unknown';
        if (locKey.trim() !== selectedRegion) {
          return false;
        }
      }
      return true;
    });
  }, [leads, selectedNiche, selectedRegion]);

  // Determine current month & previous month reference intervals
  // Based on current reference date (from lead timestamps or current system time)
  const { currentMonthLabel, prevMonthLabel, isLeadInCurrentMonth, isLeadInPrevMonth } = useMemo(() => {
    // Collect all valid dates from leads to anchor month intervals
    const now = new Date();
    // Default current month is based on calendar date or latest lead in pool
    const leadDates = leads
      .map((l) => new Date(l.createdAt || l.researchDate || l.updatedAt))
      .filter((d) => !isNaN(d.getTime()));

    const latestDate = leadDates.length > 0
      ? new Date(Math.max(...leadDates.map((d) => d.getTime())))
      : now;

    const currYear = latestDate.getFullYear();
    const currMonth = latestDate.getMonth(); // 0-indexed

    // Previous month
    const prevDate = new Date(currYear, currMonth - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const cLabel = `${monthNames[currMonth]} ${currYear}`;
    const pLabel = `${monthNames[prevMonth]} ${prevYear}`;

    const inCurrent = (lead: Lead) => {
      const d = new Date(lead.createdAt || lead.researchDate || lead.updatedAt);
      if (isNaN(d.getTime())) return true; // fallback to current if unparsed
      return d.getFullYear() === currYear && d.getMonth() === currMonth;
    };

    const inPrev = (lead: Lead) => {
      const d = new Date(lead.createdAt || lead.researchDate || lead.updatedAt);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    };

    return {
      currentMonthLabel: cLabel,
      prevMonthLabel: pLabel,
      isLeadInCurrentMonth: inCurrent,
      isLeadInPrevMonth: inPrev,
    };
  }, [leads]);

  // Compute stats, bucket aggregations, and month comparison trends
  const { buckets, stats, maxBucketCount, monthGrowthOverall } = useMemo(() => {
    const total = filteredLeads.length;
    if (total === 0) {
      return {
        buckets: [],
        stats: {
          total: 0,
          avgScore: 0,
          medianScore: 0,
          minScore: 0,
          maxScore: 0,
          aGradeCount: 0,
          bGradeCount: 0,
          highIntentCount: 0,
          currentMonthTotal: 0,
          prevMonthTotal: 0,
        },
        maxBucketCount: 0,
        monthGrowthOverall: 0,
      };
    }

    const scores = filteredLeads.map((l) => Number(l.leadScore) || 0).sort((a, b) => a - b);
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const avgScore = Math.round(sum / total);
    const medianScore =
      scores.length % 2 === 0
        ? Math.round((scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2)
        : scores[Math.floor(scores.length / 2)];
    const minScore = scores[0];
    const maxScore = scores[scores.length - 1];

    const aGradeCount = filteredLeads.filter((l) => l.leadStrength === 'A').length;
    const bGradeCount = filteredLeads.filter((l) => l.leadStrength === 'B').length;
    const highIntentCount = filteredLeads.filter((l) => (Number(l.leadScore) || 0) >= 80).length;

    // Define 5 standard analytical brackets covering 0 to 100
    const rawBuckets: Omit<ScoreBucket, 'percentage' | 'currentMonthCount' | 'previousMonthCount'>[] = [
      {
        id: 'tier-review',
        rangeLabel: '0–59',
        min: 0,
        max: 59,
        count: 0,
        leads: [],
        grade: 'Review',
        color: '#f43f5e', // rose-500
        accentBorder: 'border-rose-500/40',
        bgGlow: 'bg-rose-500/10',
        tierLabel: 'Needs Verification',
        description: 'Lower composite confidence; incomplete contact or uncorroborated gap',
      },
      {
        id: 'tier-b-standard',
        rangeLabel: '60–69',
        min: 60,
        max: 69,
        count: 0,
        leads: [],
        grade: 'B',
        color: '#38bdf8', // sky-400
        accentBorder: 'border-sky-500/40',
        bgGlow: 'bg-sky-500/10',
        tierLabel: 'Viable Opportunity',
        description: 'Commercial business with observable tech gap; secondary outreach target',
      },
      {
        id: 'tier-b-strong',
        rangeLabel: '70–79',
        min: 70,
        max: 79,
        count: 0,
        leads: [],
        grade: 'B',
        color: '#60a5fa', // blue-400
        accentBorder: 'border-blue-500/40',
        bgGlow: 'bg-blue-500/10',
        tierLabel: 'High Viability',
        description: 'Strong technical gap & verified legitimacy; standard B+ qualification',
      },
      {
        id: 'tier-a-prime',
        rangeLabel: '80–89',
        min: 80,
        max: 89,
        count: 0,
        leads: [],
        grade: 'A',
        color: '#10b981', // emerald-500
        accentBorder: 'border-emerald-500/40',
        bgGlow: 'bg-emerald-500/10',
        tierLabel: 'Prime Target (Grade A)',
        description: 'Direct phone/email verified, verified digital gap, active outreach ready',
      },
      {
        id: 'tier-a-exceptional',
        rangeLabel: '90–100',
        min: 90,
        max: 100,
        count: 0,
        leads: [],
        grade: 'A',
        color: '#34d399', // emerald-400
        accentBorder: 'border-emerald-400/50',
        bgGlow: 'bg-emerald-400/15',
        tierLabel: 'Exceptional (Top Grade A)',
        description: 'Multi-channel contact, critical observed tech gap, highest conversion fit',
      },
    ];

    let currentMonthTotal = 0;
    let prevMonthTotal = 0;

    // Split and assign leads to buckets
    for (const lead of filteredLeads) {
      const s = Number(lead.leadScore) || 0;
      const b = rawBuckets.find((item) => s >= item.min && s <= item.max) || rawBuckets[0];
      b.count += 1;
      b.leads.push(lead);

      if (isLeadInCurrentMonth(lead)) {
        currentMonthTotal += 1;
      } else if (isLeadInPrevMonth(lead)) {
        prevMonthTotal += 1;
      }
    }

    // Compute month counts per bucket
    const calculatedBuckets: ScoreBucket[] = rawBuckets.map((b) => {
      const currCount = b.leads.filter(isLeadInCurrentMonth).length;
      const prevCount = b.leads.filter(isLeadInPrevMonth).length;
      return {
        ...b,
        percentage: total > 0 ? Math.round((b.count / total) * 100) : 0,
        currentMonthCount: currCount,
        previousMonthCount: prevCount,
      };
    });

    const maxCount = Math.max(
      1,
      ...calculatedBuckets.map((b) => Math.max(b.count, b.currentMonthCount, b.previousMonthCount))
    );

    const growth = prevMonthTotal > 0
      ? Math.round(((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100)
      : currentMonthTotal > 0
      ? 100
      : 0;

    return {
      buckets: calculatedBuckets,
      stats: {
        total,
        avgScore,
        medianScore,
        minScore,
        maxScore,
        aGradeCount,
        bGradeCount,
        highIntentCount,
        currentMonthTotal,
        prevMonthTotal,
      },
      maxBucketCount: maxCount,
      monthGrowthOverall: growth,
    };
  }, [filteredLeads, isLeadInCurrentMonth, isLeadInPrevMonth]);

  // Dimensions for D3 SVG chart
  const width = 620;
  const height = 210;
  const margin = { top: 26, right: 30, bottom: 42, left: 42 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // D3 Scales & Trend Line Generators
  const { xScale, yScale, yTicks, currTrendLinePath, prevTrendLinePath, pointsCurr, pointsPrev } = useMemo(() => {
    const x = d3
      .scaleBand<string>()
      .domain(buckets.map((b) => b.rangeLabel))
      .range([0, innerWidth])
      .padding(0.32);

    const maxDomainVal = Math.ceil(maxBucketCount * 1.25) || 5;
    const y = d3
      .scaleLinear()
      .domain([0, maxDomainVal])
      .nice()
      .range([innerHeight, 0]);

    const ticks = y.ticks(4).filter((t) => Number.isInteger(t));

    // Construct coordinates for Trend Lines connecting centers of each score bracket
    const ptsCurr: { x: number; y: number; val: number; label: string }[] = [];
    const ptsPrev: { x: number; y: number; val: number; label: string }[] = [];

    buckets.forEach((b) => {
      const cx = (x(b.rangeLabel) || 0) + x.bandwidth() / 2;
      ptsCurr.push({
        x: cx,
        y: y(b.currentMonthCount),
        val: b.currentMonthCount,
        label: b.rangeLabel,
      });
      ptsPrev.push({
        x: cx,
        y: y(b.previousMonthCount),
        val: b.previousMonthCount,
        label: b.rangeLabel,
      });
    });

    const lineGenerator = d3
      .line<{ x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveMonotoneX);

    const currPath = ptsCurr.length > 0 ? lineGenerator(ptsCurr) || '' : '';
    const prevPath = ptsPrev.length > 0 ? lineGenerator(ptsPrev) || '' : '';

    return {
      xScale: x,
      yScale: y,
      yTicks: ticks,
      currTrendLinePath: currPath,
      prevTrendLinePath: prevPath,
      pointsCurr: ptsCurr,
      pointsPrev: ptsPrev,
    };
  }, [buckets, innerWidth, innerHeight, maxBucketCount]);

  const activeBucket = activeBucketId ? buckets.find((b) => b.id === activeBucketId) : null;

  if (leads.length === 0) {
    return null;
  }

  const hasActiveFilters = selectedNiche !== 'ALL' || selectedRegion !== 'ALL';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-5">
      {/* Header and Filter Controls Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                Lead Score Distribution &amp; Market Growth Trend
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualizes composite qualification scores (0–100) with month-over-month growth trend comparison.
            </p>
          </div>

          {/* Quick Summary Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-xs">
              <span className="text-slate-400">Avg Score:</span>
              <span className="font-mono font-bold text-white">{stats.avgScore}</span>
              <span className="text-[10px] text-slate-500">/ 100</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs">
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-semibold">Grade A:</span>
              <span className="font-mono font-bold text-emerald-200">{stats.aGradeCount}</span>
              <span className="text-[10px] text-emerald-400/70">
                ({Math.round((stats.aGradeCount / Math.max(1, stats.total)) * 100)}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs">
              <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-blue-300 font-semibold">Grade B:</span>
              <span className="font-mono font-bold text-blue-200">{stats.bGradeCount}</span>
              <span className="text-[10px] text-blue-400/70">
                ({Math.round((stats.bGradeCount / Math.max(1, stats.total)) * 100)}%)
              </span>
            </div>

            {/* Growth Pill */}
            <div
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                monthGrowthOverall >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
              title={`Current (${stats.currentMonthTotal}) vs Previous (${stats.prevMonthTotal}) month growth`}
            >
              {monthGrowthOverall >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
              )}
              <span>{monthGrowthOverall >= 0 ? `+${monthGrowthOverall}%` : `${monthGrowthOverall}%`} MoM</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar: Niche, Region, and Trend Line Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mr-1">
              <Filter className="h-3.5 w-3.5 text-blue-400" />
              Filter By:
            </span>

            {/* Niche Dropdown */}
            <div className="relative">
              <select
                value={selectedNiche}
                onChange={(e) => {
                  setSelectedNiche(e.target.value);
                  setActiveBucketId(null);
                }}
                className="appearance-none rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-1.5 pr-8 text-xs font-medium text-slate-200 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Niches ({leads.length})</option>
                {availableNiches.map((niche) => {
                  const count = leads.filter((l) => l.industry?.trim() === niche).length;
                  return (
                    <option key={niche} value={niche}>
                      {niche} ({count})
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Region / Country Dropdown */}
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setActiveBucketId(null);
                }}
                className="appearance-none rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-1.5 pr-8 text-xs font-medium text-slate-200 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Regions / Countries ({leads.length})</option>
                {availableRegions.map((region) => {
                  const count = leads.filter((l) => {
                    const locKey = l.region && l.region !== 'Unknown'
                      ? `${l.region}, ${l.country}`
                      : l.country || l.city || 'Unknown';
                    return locKey.trim() === region;
                  }).length;
                  return (
                    <option key={region} value={region}>
                      {region} ({count})
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedNiche('ALL');
                  setSelectedRegion('ALL');
                  setActiveBucketId(null);
                }}
                className="flex items-center gap-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3 text-slate-400" />
                <span>Reset ({filteredLeads.length}/{leads.length})</span>
              </button>
            )}
          </div>

          {/* Trend Line Visual Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTrendLine(!showTrendLine)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                showTrendLine
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Month-over-Month growth trend curves on chart"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Trend Comparison</span>
            </button>

            {showTrendLine && (
              <div className="hidden sm:flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-[11px]">
                <button
                  onClick={() => setActiveTrendMetric('both')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeTrendMetric === 'both' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Both
                </button>
                <button
                  onClick={() => setActiveTrendMetric('current')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeTrendMetric === 'current' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {currentMonthLabel}
                </button>
                <button
                  onClick={() => setActiveTrendMetric('previous')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeTrendMetric === 'previous' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {prevMonthLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Chart on Left, Detail & Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG Bar Chart + MoM Trend Lines Column */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-300 flex items-center gap-2">
              <span>Score Range Frequency &amp; Growth Curve</span>
              {hasActiveFilters && (
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-800/50 rounded px-1.5 py-0.2">
                  Filtered ({filteredLeads.length} leads)
                </span>
              )}
            </span>
            <span className="text-[11px] text-slate-500">Click a bar to filter prospects</span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none"
              style={{ minWidth: '440px', maxHeight: '250px' }}
            >
              <defs>
                {/* Glow Filter for Current Month Trend Line */}
                <filter id="glowCurr" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Linear gradient for trend line stroke */}
                <linearGradient id="currTrendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="prevTrendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>

              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Horizontal Grid Lines */}
                {yTicks.map((tickVal) => {
                  const yPos = yScale(tickVal);
                  return (
                    <g key={tickVal} className="text-slate-700/60">
                      <line
                        x1={0}
                        x2={innerWidth}
                        y1={yPos}
                        y2={yPos}
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                      <text
                        x={-8}
                        y={yPos + 3}
                        textAnchor="end"
                        fontSize={10}
                        fill="#94a3b8"
                        fontFamily="monospace"
                      >
                        {tickVal}
                      </text>
                    </g>
                  );
                })}

                {/* Baseline Axis Line */}
                <line
                  x1={0}
                  x2={innerWidth}
                  y1={innerHeight}
                  y2={innerHeight}
                  stroke="#334155"
                  strokeWidth={1.5}
                />

                {/* Bars */}
                {buckets.map((bucket) => {
                  const barX = xScale(bucket.rangeLabel) || 0;
                  const barWidth = xScale.bandwidth();
                  const barY = yScale(bucket.count);
                  const barHeight = Math.max(0, innerHeight - barY);
                  const isSelected = activeBucketId === bucket.id;
                  const isHoveredOrActive = isSelected;

                  return (
                    <g
                      key={bucket.id}
                      className="cursor-pointer transition-opacity"
                      onClick={() => setActiveBucketId(isSelected ? null : bucket.id)}
                    >
                      {/* Interactive Background Click Area */}
                      <rect
                        x={barX - 4}
                        y={0}
                        width={barWidth + 8}
                        height={innerHeight}
                        fill="transparent"
                      />

                      {/* Bar Fill with rounded top */}
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        rx={5}
                        ry={5}
                        fill={bucket.color}
                        fillOpacity={isSelected ? 1 : activeBucketId ? 0.35 : 0.82}
                        stroke={isHoveredOrActive ? '#ffffff' : bucket.color}
                        strokeWidth={isHoveredOrActive ? 1.5 : 0}
                        className="transition-all duration-200"
                      />

                      {/* Bar Value Label on Top */}
                      {bucket.count > 0 && (
                        <text
                          x={barX + barWidth / 2}
                          y={Math.max(12, barY - 6)}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight="bold"
                          fill={isSelected ? '#ffffff' : '#cbd5e1'}
                          fontFamily="monospace"
                        >
                          {bucket.count}
                        </text>
                      )}

                      {/* X-Axis Range Label */}
                      <text
                        x={barX + barWidth / 2}
                        y={innerHeight + 16}
                        textAnchor="middle"
                        fontSize={11}
                        fill={isSelected ? '#38bdf8' : '#94a3b8'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {bucket.rangeLabel}
                      </text>

                      {/* Grade Sub-label */}
                      <text
                        x={barX + barWidth / 2}
                        y={innerHeight + 28}
                        textAnchor="middle"
                        fontSize={9}
                        fill={bucket.color}
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {bucket.grade === 'Review' ? 'Review' : `Grade ${bucket.grade}`}
                      </text>
                    </g>
                  );
                })}

                {/* --- TREND LINES: Current Month vs Previous Month Growth --- */}
                {showTrendLine && (
                  <>
                    {/* Previous Month Trend Curve (Dashed Lavender Line) */}
                    {(activeTrendMetric === 'both' || activeTrendMetric === 'previous') && prevTrendLinePath && (
                      <g className="transition-opacity duration-300 pointer-events-none">
                        <path
                          d={prevTrendLinePath}
                          fill="none"
                          stroke="url(#prevTrendGrad)"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          strokeOpacity={0.85}
                        />
                        {/* Data dots for previous month */}
                        {pointsPrev.map((pt, idx) => (
                          <circle
                            key={`prev-dot-${idx}`}
                            cx={pt.x}
                            cy={pt.y}
                            r={3}
                            fill="#818cf8"
                            stroke="#0f172a"
                            strokeWidth={1.5}
                          />
                        ))}
                      </g>
                    )}

                    {/* Current Month Trend Curve (Solid Cyan-Emerald Glowing Line) */}
                    {(activeTrendMetric === 'both' || activeTrendMetric === 'current') && currTrendLinePath && (
                      <g className="transition-opacity duration-300 pointer-events-none">
                        <path
                          d={currTrendLinePath}
                          fill="none"
                          stroke="url(#currTrendGrad)"
                          strokeWidth={2.75}
                          filter="url(#glowCurr)"
                        />
                        {/* Data points for current month */}
                        {pointsCurr.map((pt, idx) => (
                          <circle
                            key={`curr-dot-${idx}`}
                            cx={pt.x}
                            cy={pt.y}
                            r={4}
                            fill="#10b981"
                            stroke="#0f172a"
                            strokeWidth={1.75}
                          />
                        ))}
                      </g>
                    )}
                  </>
                )}
              </g>
            </svg>
          </div>

          {/* Chart Footer Legend with Month Indicators */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>80–100: Grade A Prime</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span>60–79: Grade B Viable</span>
              </span>
              {showTrendLine && (
                <>
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <span className="h-1.5 w-3 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
                    <span>{currentMonthLabel} Trend ({stats.currentMonthTotal})</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <span className="h-1 w-3 border-b border-dashed border-indigo-400" />
                    <span>{prevMonthLabel} ({stats.prevMonthTotal})</span>
                  </span>
                </>
              )}
            </div>
            <span className="font-mono text-slate-500">
              Median Score: <strong className="text-slate-300">{stats.medianScore}</strong>
            </span>
          </div>
        </div>

        {/* Analytical Breakdown & Selected Bucket Column */}
        <div className="lg:col-span-5 space-y-3">
          {/* Market Strength Summary Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                Target Market Opportunity Index
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  stats.avgScore >= 75
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : stats.avgScore >= 65
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {stats.avgScore >= 75
                  ? 'Strong Agency Conversion Fit'
                  : stats.avgScore >= 65
                  ? 'Moderate Digital Expansion Gap'
                  : 'Requires Selective Targeting'}
              </span>
            </div>

            {/* Progress Ratio Bar */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Grade A Prime Leads ({stats.aGradeCount})</span>
                <span className="font-mono text-emerald-400">
                  {Math.round((stats.aGradeCount / Math.max(1, stats.total)) * 100)}% of Pool
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(stats.aGradeCount / Math.max(1, stats.total)) * 100}%` }}
                  title="Grade A"
                />
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(stats.bGradeCount / Math.max(1, stats.total)) * 100}%` }}
                  title="Grade B"
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{
                    width: `${
                      ((stats.total - stats.aGradeCount - stats.bGradeCount) / Math.max(1, stats.total)) *
                      100
                    }%`,
                  }}
                  title="Under 60"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Min: {stats.minScore}</span>
                <span>Avg: {stats.avgScore}</span>
                <span>Max: {stats.maxScore}</span>
              </div>
            </div>

            {/* MoM Performance Commentary */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  <Calendar className="h-3 w-3 text-cyan-400" />
                  Monthly Velocity Comparison
                </span>
                <span className="font-mono text-emerald-400">
                  {stats.currentMonthTotal} vs {stats.prevMonthTotal} leads
                </span>
              </div>
              <p className="text-slate-400 leading-snug">
                {monthGrowthOverall >= 0 ? (
                  <>
                    Research velocity grew by <strong className="text-emerald-300">+{monthGrowthOverall}%</strong> in {currentMonthLabel}. High-scoring prospects ({stats.highIntentCount} leads at 80+) demonstrate active verified contact channels and concrete digital modernization gaps.
                  </>
                ) : (
                  <>
                    Research count reflects selective filtering. Grade B distribution remains healthy across verified local entities.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Interactive Tier Drill-down / Focus View */}
          {activeBucket ? (
            <div className={`rounded-xl border ${activeBucket.accentBorder} ${activeBucket.bgGlow} p-4 space-y-2`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-['Plus_Jakarta_Sans']">
                      Bracket {activeBucket.rangeLabel} ({activeBucket.tierLabel})
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                      {activeBucket.count} leads ({activeBucket.percentage}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">{activeBucket.description}</p>
                </div>
                <button
                  onClick={() => setActiveBucketId(null)}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer shrink-0"
                >
                  Clear filter
                </button>
              </div>

              {/* Bucket Month Breakdown */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span>
                  {currentMonthLabel}: <strong className="text-cyan-300 font-mono">{activeBucket.currentMonthCount}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  {prevMonthLabel}: <strong className="text-indigo-300 font-mono">{activeBucket.previousMonthCount}</strong>
                </span>
              </div>

              {/* Quick List of sample leads in this bucket */}
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {activeBucket.leads.slice(0, 4).map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead && onSelectLead(lead)}
                    className="flex items-center justify-between rounded-lg bg-slate-900/80 border border-slate-800/80 p-2 text-xs hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-semibold text-white truncate text-[11px]">
                        {lead.companyName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {lead.salesOpportunity} &bull; {lead.city}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-cyan-300">
                        {lead.leadScore}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                          lead.leadStrength === 'A'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {lead.leadStrength}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Quick Tier Comparison Table with MoM indicators */
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-[11px]">
              <div className="text-slate-400 font-semibold mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Info className="h-3 w-3 text-blue-400" />
                  Score Category Breakdown
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {currentMonthLabel} vs {prevMonthLabel}
                </span>
              </div>
              <div className="space-y-1.5">
                {buckets.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setActiveBucketId(b.id)}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-900/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: b.color }}
                      />
                      <span className="font-mono text-slate-300 text-[10px]">{b.rangeLabel}</span>
                      <span className="text-slate-400 truncate max-w-[130px] text-[10px] group-hover:text-white">
                        {b.tierLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 font-mono">
                      <span className="text-slate-300 font-semibold">{b.count}</span>
                      <span className="text-slate-500 text-[10px]">({b.percentage}%)</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-800/40">
                        +{b.currentMonthCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
