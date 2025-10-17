# 📊 Dashboard Components Documentation

## Overview
This directory contains all components for the Monitoring Dashboard. Each component is designed to be reusable, performant, and type-safe.

---

## 📁 Component Structure

```
dashboard/
├── StatusBadge.tsx        # Status indicator with colors
├── MetricCard.tsx         # Animated metric display card
├── ProgressBar.tsx        # Animated progress bar
├── CPUChart.tsx          # Real-time CPU line chart
├── MemoryChart.tsx       # Memory usage pie chart
├── HealthChecks.tsx      # System health check grid
├── ApiAnalytics.tsx      # API statistics section
└── PerformanceTable.tsx  # Performance metrics table
```

---

## 🧩 Component Details

### 1. StatusBadge
**Purpose:** Display status indicators with appropriate colors and icons

**Props:**
```typescript
interface StatusBadgeProps {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'pass' | 'fail';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
}
```

**Usage:**
```tsx
<StatusBadge status="healthy" size="md" pulse />
<StatusBadge status="fail" size="sm" showIcon={false} />
```

**Features:**
- Auto color mapping (green/yellow/red)
- Auto icon selection (✅/⚠️/❌)
- Optional pulse animation
- 3 size variants

---

### 2. MetricCard
**Purpose:** Display key metrics with animations and optional trends

**Props:**
```typescript
interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'emerald' | 'purple' | 'amber';
  delay?: number;
}
```

**Usage:**
```tsx
<MetricCard
  icon={<CpuChipIcon className="w-6 h-6" />}
  title="CPU Usage"
  value="45.2%"
  subtitle="8 cores"
  color="blue"
  trend="up"
  trendValue="+5%"
  delay={0.1}
/>
```

**Features:**
- Framer Motion entrance animations
- Hover effects (scale + shadow)
- 4 color themes
- Optional trend indicators
- Staggered delays for multiple cards

---

### 3. ProgressBar
**Purpose:** Animated progress/usage indicator

**Props:**
```typescript
interface ProgressBarProps {
  value: number;        // Current value
  max?: number;         // Maximum value (default: 100)
  showLabel?: boolean;  // Show percentage label
  color?: 'blue' | 'emerald' | 'amber' | 'red';
  height?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}
```

**Usage:**
```tsx
<ProgressBar value={75} max={100} color="emerald" />
<ProgressBar value={90} color="red" showLabel />
```

**Features:**
- Smooth fill animation
- 4 gradient color themes
- 3 height variants
- Optional percentage label

---

### 4. CPUChart
**Purpose:** Real-time CPU usage line chart with statistics

**Props:**
```typescript
interface CPUChartProps {
  currentUsage: number;  // Current CPU percentage (0-100)
}
```

**Usage:**
```tsx
<CPUChart currentUsage={systemMetrics.cpu.usage} />
```

**Features:**
- Real-time data accumulation (last 20 points)
- Line chart with time-based X-axis
- Statistics: Current, Average, Peak
- Responsive container
- Custom tooltip styling

**Data Management:**
```typescript
// Automatically maintains last 20 data points
// Updates every 10 seconds with auto-refresh
// X-axis shows time in HH:MM:SS format
```

---

### 5. MemoryChart
**Purpose:** Memory usage visualization with pie/doughnut chart

**Props:**
```typescript
interface MemoryChartProps {
  used: number;   // Used memory in bytes
  total: number;  // Total memory in bytes
}
```

**Usage:**
```tsx
<MemoryChart 
  used={data.system.memory.used}
  total={data.system.memory.total}
/>
```

**Features:**
- Doughnut/pie chart visualization
- Auto-calculates free memory
- Used vs Free breakdown
- Formatted byte display (GB/MB/KB)
- Usage percentage
- Interactive legend

**Color Scheme:**
- Used: Purple (#8b5cf6)
- Free: Dark gray (#334155)

---

### 6. HealthChecks
**Purpose:** Display system health check statuses

**Props:**
```typescript
interface HealthChecksProps {
  checks: HealthChecks;  // Health check results
}

interface HealthChecks {
  database: HealthCheckResult;
  filesystem: HealthCheckResult;
  memory: HealthCheckResult;
  disk: HealthCheckResult;
}
```

**Usage:**
```tsx
<HealthChecks checks={data.health.checks} />
```

**Features:**
- 4 check categories with icons
- Status badges (pass/fail)
- Response time display
- Optional messages
- Grid layout (responsive)
- Staggered entrance animations

**Health Check Icons:**
- Database: 🗄️
- Filesystem: 📁
- Memory: 💾
- Disk: 💿

---

### 7. ApiAnalytics
**Purpose:** Display API usage statistics and endpoint breakdown

**Props:**
```typescript
interface ApiAnalyticsProps {
  analytics: ApiAnalytics;
}

interface ApiAnalytics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  avgDuration: number;
  endpoints: EndpointStat[];
}
```

**Usage:**
```tsx
<ApiAnalytics analytics={data.analytics} />
```

**Features:**
- 4 stat cards: Successful, Failed, Success Rate, Avg Duration
- Bar chart: Top 10 endpoints by count
- Full endpoint table with percentages
- Color-coded stats
- Responsive chart with angled labels

**Sections:**
1. **Stats Grid** - Quick overview
2. **Bar Chart** - Visual endpoint comparison
3. **Table** - Complete endpoint list

---

### 8. PerformanceTable
**Purpose:** Display operation performance metrics

**Props:**
```typescript
interface PerformanceTableProps {
  performance: PerformanceMetrics;
}

type PerformanceMetrics = OperationStats[];

interface OperationStats {
  operation: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
}
```

**Usage:**
```tsx
<PerformanceTable performance={data.performance} />
```

**Features:**
- Sortable table (by count descending)
- Performance status badges:
  - Fast: < 100ms (green)
  - Normal: 100-1000ms (blue)
  - Slow: > 1000ms (red)
- Duration formatting (ms/s/m)
- Summary statistics
- Hover row highlighting

**Table Columns:**
1. Operation name
2. Request count
3. Average duration
4. Min duration
5. Max duration
6. Status badge

---

## 🎨 Design Patterns

### Color System
All components use consistent Tailwind classes:

```typescript
// Backgrounds
'bg-slate-800/50'           // Card background
'bg-slate-700/30'           // Secondary backgrounds

// Text
'text-slate-50'             // Primary text
'text-slate-300'            // Secondary text
'text-slate-400'            // Muted text

// Status Colors
'text-emerald-400'          // Success/Healthy
'text-amber-400'            // Warning/Degraded
'text-red-400'              // Error/Unhealthy
'text-blue-400'             // Info/Neutral

// Borders
'border-slate-700/50'       // Card borders
'border-slate-600/50'       // Hover borders
```

### Animation Patterns
```typescript
// Entrance Animations (Framer Motion)
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: index * 0.1 }}

// Hover Effects
className="hover:bg-slate-800/70 hover:-translate-y-1 
           hover:shadow-2xl transition-all duration-300"

// Progress Animations
animate={{ width: `${percentage}%` }}
transition={{ duration: 1, ease: 'easeOut' }}
```

### Responsive Patterns
```typescript
// Grid Layouts
'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4'

// Card Padding
'p-4 sm:p-6'

// Font Sizes
'text-sm sm:text-base lg:text-lg'

// Gaps
'gap-4 sm:gap-6'
```

---

## 🔧 Customization Guide

### Adding New Status Types
```typescript
// In formatters.ts
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    healthy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    custom: 'text-purple-400 bg-purple-500/10 border-purple-500/20', // Add new
  };
  return colors[status.toLowerCase()] || colors.info;
}
```

### Creating New Metric Card Colors
```typescript
// In MetricCard.tsx
const colorClasses = {
  blue: 'bg-blue-500/10 text-blue-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  purple: 'bg-purple-500/10 text-purple-400',
  amber: 'bg-amber-500/10 text-amber-400',
  cyan: 'bg-cyan-500/10 text-cyan-400', // Add new
};
```

### Extending Chart Components
```typescript
// To add new chart types, use Recharts components:
import { BarChart, AreaChart, RadarChart } from 'recharts';

// Example: Area Chart
<AreaChart data={data}>
  <Area 
    type="monotone" 
    dataKey="value" 
    stroke="#3b82f6" 
    fill="url(#colorGradient)" 
  />
</AreaChart>
```

---

## 🧪 Testing Components

### Unit Testing Example
```typescript
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

test('renders healthy status', () => {
  render(<StatusBadge status="healthy" />);
  expect(screen.getByText('healthy')).toBeInTheDocument();
  expect(screen.getByText('✅')).toBeInTheDocument();
});
```

### Integration Testing
```typescript
test('CPUChart updates with new data', async () => {
  const { rerender } = render(<CPUChart currentUsage={50} />);
  
  // Wait for initial render
  await waitFor(() => {
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });
  
  // Update with new data
  rerender(<CPUChart currentUsage={75} />);
  
  // Verify update
  await waitFor(() => {
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });
});
```

---

## 📚 Additional Resources

### Dependencies
- **recharts**: Charts library
- **framer-motion**: Animation library
- **@heroicons/react**: Icon library
- **tailwindcss**: Styling

### Related Files
- `@/hooks/useMonitoring.ts` - Data fetching hook
- `@/types/monitoring.types.ts` - TypeScript types
- `@/utils/formatters.ts` - Formatting utilities

### Best Practices
1. Always use TypeScript interfaces
2. Memoize expensive calculations with useMemo
3. Use React.memo for pure components
4. Clean up effects and subscriptions
5. Handle loading and error states
6. Make components responsive by default
7. Follow accessibility guidelines (ARIA labels, keyboard nav)

---

**Created with ❤️ for the Monitoring Dashboard**
