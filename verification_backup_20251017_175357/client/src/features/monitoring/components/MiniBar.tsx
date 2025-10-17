
interface MiniBarProps {
  data: Array<{ timestamp: number; count: number }>;
  color?: string;
  height?: number;
}

export function MiniBar({ data, color = 'var(--c-primary)', height = 60 }: MiniBarProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="w-full bg-[color:var(--c-border)] rounded flex items-center justify-center text-[color:var(--c-muted)] text-sm"
        style={{ height }}
      >
        بدون داده
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const barWidth = 100 / data.length;

  return (
    <svg
      width="100%"
      height={height}
      className="overflow-visible"
      role="img"
      aria-label="نمودار میله‌ای"
    >
      {data.map((item, index) => {
        const barHeight = (item.count / maxValue) * (height - 10);
        const x = index * barWidth;
        const y = height - barHeight - 5;

        return (
          <g key={index}>
            <rect
              x={`${x}%`}
              y={y}
              width={`${barWidth * 0.8}%`}
              height={barHeight}
              fill={color}
              opacity={0.8}
              rx={2}
            >
              <title>{`${item.count} درخواست`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

interface MiniLineProps {
  data: Array<{ timestamp: number; count: number }>;
  color?: string;
  height?: number;
}

export function MiniLine({ data, color = 'var(--c-primary)', height = 60 }: MiniLineProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="w-full bg-[color:var(--c-border)] rounded flex items-center justify-center text-[color:var(--c-muted)] text-sm"
        style={{ height }}
      >
        بدون داده
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = height - (item.count / maxValue) * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width="100%"
      height={height}
      className="overflow-visible"
      role="img"
      aria-label="نمودار خطی"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((item, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = height - (item.count / maxValue) * (height - 10) - 5;
        return (
          <circle key={index} cx={`${x}%`} cy={y} r={3} fill={color}>
            <title>{`${item.count} درخواست`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

