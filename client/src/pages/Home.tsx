import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mic, 
  Activity, 
  Database, 
  Cpu, 
  Globe, 
  Shield, 
  Zap, 
  BarChart3,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: 'Persian TTS',
      description: 'High-quality Persian text-to-speech synthesis using state-of-the-art AI models',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Real-time Monitoring',
      description: 'Live system health monitoring with detailed performance metrics',
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'HuggingFace Integration',
      description: 'Seamless integration with HuggingFace models and datasets',
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'High Performance',
      description: 'Optimized for speed with efficient resource utilization',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with comprehensive error tracking',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics Dashboard',
      description: 'Detailed insights into usage patterns and system performance',
    },
  ];

  const stats = [
    { label: 'API Uptime', value: '99.9%' },
    { label: 'Models Available', value: '50+' },
    { label: 'Average Response', value: '<200ms' },
    { label: 'Languages', value: 'Persian' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Mic className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Persian TTS/AI Platform</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Production Ready</span>
          </div>
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
            Advanced Persian AI Platform
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive platform for Persian text-to-speech synthesis, AI model management, 
            and real-time system monitoring. Built with modern technologies for exceptional performance.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/dashboard" 
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>View Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="https://github.com/yourusername/persian-tts" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-white text-gray-700 rounded-lg font-medium border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center space-x-2"
            >
              <Globe className="w-5 h-5" />
              <span>Documentation</span>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white/50 rounded-3xl">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h3>
          <p className="text-lg text-gray-600">
            Everything you need for professional Persian AI applications
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                {feature.icon}
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h4>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Built with Modern Technologies
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Backend</h4>
            <ul className="space-y-3">
              {['Node.js + TypeScript', 'Express.js', 'PostgreSQL', 'HuggingFace API', 'Docker'].map((tech, i) => (
                <li key={i} className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">{tech}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl">
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Frontend</h4>
            <ul className="space-y-3">
              {['React 18 + TypeScript', 'Vite', 'Tailwind CSS', 'Recharts', 'React Router'].map((tech, i) => (
                <li key={i} className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">{tech}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Explore the platform and see what it can do for you
          </p>
          <Link 
            to="/dashboard"
            className="inline-flex items-center space-x-2 px-8 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Mic className="w-6 h-6" />
                <span className="font-bold text-lg">Persian TTS/AI</span>
              </div>
              <p className="text-gray-400 text-sm">
                Advanced Persian AI Platform for text-to-speech and language processing.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Links</h5>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API Reference</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Platform</h5>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Version 1.0.0</li>
                <li>Node.js {process.version}</li>
                <li>Built with ❤️ for Persian AI</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Persian TTS/AI Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
