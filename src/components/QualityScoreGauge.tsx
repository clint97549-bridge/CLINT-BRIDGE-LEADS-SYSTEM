/**
 * QualityScoreGauge.tsx
 * D3-powered SVG radial gauge / progress ring component.
 * Visually represents the lead's transparent quality score (0 - 100) and A/B grade.
 */

import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { LeadStrength } from '../types';

interface QualityScoreGaugeProps {
  score: number;
  strength: LeadStrength;
  size?: number;
  showBreakdownHint?: boolean;
}

export const QualityScoreGauge: React.FC<QualityScoreGaugeProps> = ({
  score,
  strength,
  size = 170,
  showBreakdownHint = true,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  // Gauge angles (260 degree arc)
  const startAngle = -0.72 * Math.PI; // -130 degrees
  const endAngle = 0.72 * Math.PI;   // +130 degrees
  const totalAngle = endAngle - startAngle;

  const currentAngle = startAngle + (clampedScore / 100) * totalAngle;

  const radius = size / 2 - 12;
  const thickness = 11;
  const innerRadius = radius - thickness;

  // D3 arc generator for background track
  const backgroundArcPath = useMemo(() => {
    const arcGen = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(6);
    return arcGen({} as any) || '';
  }, [innerRadius, radius, startAngle, endAngle]);

  // D3 arc generator for active progress arc
  const progressArcPath = useMemo(() => {
    if (clampedScore <= 0) return '';
    const arcGen = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(currentAngle)
      .cornerRadius(6);
    return arcGen({} as any) || '';
  }, [innerRadius, radius, startAngle, currentAngle, clampedScore]);

  // Generate tick markers using D3 angle math
  const ticks = useMemo(() => {
    const tickValues = [0, 25, 50, 75, 100];
    return tickValues.map((val) => {
      const angle = startAngle + (val / 100) * totalAngle - Math.PI / 2;
      const r1 = radius + 3;
      const r2 = radius + 7;
      const x1 = Math.cos(angle) * r1;
      const y1 = Math.sin(angle) * r1;
      const x2 = Math.cos(angle) * r2;
      const y2 = Math.sin(angle) * r2;
      return { val, x1, y1, x2, y2 };
    });
  }, [startAngle, totalAngle, radius]);

  // Color theme based on score & grade
  const colorTheme = useMemo(() => {
    if (strength === 'A' || clampedScore >= 75) {
      return {
        gradientStart: '#10b981', // emerald-500
        gradientEnd: '#06b6d4',   // cyan-500
        glowColor: 'rgba(16, 185, 129, 0.25)',
        textColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        statusLabel: 'Prime Opportunity',
      };
    } else if (clampedScore >= 60) {
      return {
        gradientStart: '#06b6d4', // cyan-500
        gradientEnd: '#3b82f6',   // blue-500
        glowColor: 'rgba(6, 182, 212, 0.25)',
        textColor: 'text-cyan-400',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        statusLabel: 'Viable Prospect',
      };
    } else {
      return {
        gradientStart: '#f59e0b', // amber-500
        gradientEnd: '#f97316',   // orange-500
        glowColor: 'rgba(245, 158, 11, 0.25)',
        textColor: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        statusLabel: 'Moderate Fit',
      };
    }
  }, [clampedScore, strength]);

  const uniqueId = useMemo(() => `gauge-grad-${Math.random().toString(36).substring(2, 7)}`, []);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative" style={{ width: size, height: size * 0.95 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible drop-shadow-md"
        >
          <defs>
            <linearGradient id={uniqueId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colorTheme.gradientStart} />
              <stop offset="100%" stopColor={colorTheme.gradientEnd} />
            </linearGradient>
            <filter id={`glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="4"
                floodColor={colorTheme.gradientStart}
                floodOpacity="0.4"
              />
            </filter>
          </defs>

          {/* Group centered in SVG */}
          <g transform={`translate(${size / 2}, ${size / 2 + 4})`}>
            {/* Background track arc */}
            <path
              d={backgroundArcPath}
              fill="#1e293b" // slate-800
              className="opacity-70"
            />

            {/* Subtle inner track glow */}
            <circle
              r={innerRadius - 4}
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
              className="opacity-50"
            />

            {/* D3 Ticks */}
            {ticks.map((t) => (
              <line
                key={t.val}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="#475569" // slate-600
                strokeWidth={t.val === 0 || t.val === 100 || t.val === 50 ? 1.5 : 1}
                strokeLinecap="round"
              />
            ))}

            {/* Active progress arc */}
            {progressArcPath && (
              <path
                d={progressArcPath}
                fill={`url(#${uniqueId})`}
                filter={`url(#glow-${uniqueId})`}
                className="transition-all duration-700 ease-out"
              />
            )}
          </g>
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {clampedScore}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 font-mono">/100</span>
          </div>

          <div className="mt-1 flex items-center gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${colorTheme.badgeBg}`}
            >
              Grade {strength}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 mt-1 font-medium text-center">
            {colorTheme.statusLabel}
          </span>
        </div>
      </div>

      {showBreakdownHint && (
        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
          <span>D3 Radial Engine</span>
          <span>&bull;</span>
          <span className={colorTheme.textColor}>Verified Score</span>
        </div>
      )}
    </div>
  );
};
