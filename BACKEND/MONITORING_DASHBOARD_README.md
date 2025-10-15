# 🎨 Monitoring Dashboard - Persian TTS/AI Platform

## 📋 Overview

Beautiful, real-time monitoring dashboard that visualizes system health, performance metrics, and API analytics.

## ✨ Features

### 1. **Real-Time Monitoring**
- Auto-refresh every 10 seconds
- Live system metrics
- Real-time API analytics
- Performance tracking

### 2. **Health Checks**
Four comprehensive health check cards:
- 🗄️ **Database** - Status, response time
- 📁 **Filesystem** - Status, response time
- 💾 **Memory** - Status, usage percentage
- 💿 **Disk** - Status

### 3. **System Metrics**
- 🖥️ **CPU Usage** - Current percentage, number of cores, progress bar
- 💾 **Memory Usage** - Used/Total GB, usage percentage, progress bar
- ⏱️ **Uptime** - Days, hours, minutes since start

### 4. **API Analytics**
- 📊 Total Requests (last 5 minutes)
- ✅ Success Rate (with progress bar)
- ❌ Error Rate (percentage)
- 📈 Average Response Time (milliseconds)
- 📋 Top 5 Endpoints Table (endpoint, count, success rate)

### 5. **Performance Metrics**
Detailed table showing all operations:
- Operation name
- Request count
- Average duration
- Min/Max duration
- Performance status (Fast/Medium/Slow)

## 🎨 Design Features

### Modern Dark Theme
- Beautiful slate-900 background (#0f172a)
- Card-based layout with slate-800 (#1e293b)
- Gradient accents (blue to green)
- Smooth animations and transitions

### Responsive Design
- **Desktop**: 3-column grid
- **Tablet**: 2-column grid
- **Mobile**: Single column stack

### Animations
- ✓ Fade-in on page load
- ✓ Smooth card hover effects
- ✓ Progress bar animations
- ✓ Pulse effect on status badges
- ✓ Shimmer effect on progress bars
- ✓ Loading skeleton states

### Interactive Elements
- Real-time clock (updates every second)
- Auto-refresh toggle (⏸️ Pause / ▶️ Resume)
- Color-coded status badges (🟢 Healthy / 🟡 Degraded / 🔴 Unhealthy)
- Progress bars for percentages
- Hover effects on cards and tables

## 🚀 Getting Started

### 1. Start the Backend

```bash
cd BACKEND
npm run dev
```

The backend will start on `http://localhost:3001`

### 2. Access the Dashboard

Open your browser and navigate to:

```
http://localhost:3001/monitoring-dashboard.html
```

That's it! The dashboard will immediately start fetching and displaying real-time data.

## 📡 API Endpoints Used

The dashboard connects to these monitoring APIs:

1. **Health Check**: `GET /health/detailed`
   - Overall system health
   - Database, filesystem, memory, disk status
   - System metrics (CPU, memory, uptime)

2. **System Metrics**: `GET /api/monitoring/system`
   - Real-time CPU usage
   - Memory consumption
   - System uptime

3. **API Analytics**: `GET /api/monitoring/analytics`
   - Request counts
   - Success/error rates
   - Average response times
   - Top endpoints

4. **Performance Metrics**: `GET /api/monitoring/performance`
   - Operation performance data
   - Duration statistics
   - Performance indicators

## 🎯 Features in Detail

### Auto-Refresh
- Automatically fetches new data every 10 seconds
- Toggle on/off with the Pause/Resume button
- Shows last refresh timestamp

### Error Handling
- Displays error banners for failed API calls
- Graceful degradation when data is unavailable
- Clear error messages

### Real-Time Updates
- Clock updates every second
- Metrics refresh every 10 seconds
- Smooth transitions between values

### Performance
- Parallel API calls for fast loading
- Minimal DOM manipulation
- Optimized animations

## 🎨 Color Palette

```css
Background:
- Primary: #0f172a (slate-900)
- Secondary: #1e293b (slate-800)
- Tertiary: #334155 (slate-700)

Text:
- Primary: #f1f5f9 (slate-100)
- Secondary: #cbd5e1 (slate-300)
- Tertiary: #94a3b8 (slate-400)

Status:
- Success: #10b981 (green-500)
- Warning: #f59e0b (amber-500)
- Error: #ef4444 (red-500)
- Info: #3b82f6 (blue-500)
```

## 📱 Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 481px - 768px
- **Desktop**: > 768px

## 🔧 Troubleshooting

### Dashboard not loading data?

1. **Check if backend is running**:
   ```bash
   curl http://localhost:3001/health/detailed
   ```

2. **Check browser console** for errors

3. **Verify CORS settings** - Dashboard uses `http://localhost:3001`

### Metrics showing as 0 or "No data available"?

- Some metrics require actual API activity
- Make a few API requests to generate data
- Wait for the 10-second auto-refresh cycle

### Auto-refresh not working?

- Check if you accidentally clicked Pause
- Look for the ▶️ Resume button
- Refresh the page to reset

## 🎉 Success Indicators

✅ Dashboard loads without errors
✅ All sections display data
✅ Auto-refresh updates timestamp every 10 seconds
✅ Status badge shows correct health (🟢/🟡/🔴)
✅ Progress bars animate smoothly
✅ Cards have hover effects
✅ Responsive on mobile devices
✅ No console errors
✅ Real-time clock updates every second

## 📝 Technical Details

- **Single HTML file** - No external dependencies
- **Pure JavaScript** - No frameworks required
- **Embedded CSS** - All styles inline
- **No build process** - Ready to use
- **Real API integration** - No mock data

## 🎯 Use Cases

1. **Development**: Monitor local backend during development
2. **Production**: Real-time system health monitoring
3. **Debugging**: Quick overview of system performance
4. **Demos**: Beautiful visualization for presentations
5. **Operations**: Dashboard for DevOps monitoring

## 🚀 Future Enhancements

Potential improvements:
- [ ] Add charts/graphs for historical data
- [ ] Export metrics as CSV/JSON
- [ ] Customizable refresh intervals
- [ ] Alert thresholds
- [ ] Dark/light theme toggle
- [ ] Multi-language support (Persian/English)
- [ ] Filtering and search
- [ ] Custom metric widgets

## 📄 License

Part of the Persian TTS/AI Platform project.

---

**Enjoy your beautiful monitoring dashboard! 🎨✨**

For questions or issues, check the backend logs or API endpoints documentation.
