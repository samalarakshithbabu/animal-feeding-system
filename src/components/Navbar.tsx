import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  UtensilsCrossed,
  Package,
  BarChart3,
  Bell,
  Menu,
  X,
  PawPrint,
  ChevronDown
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/animals', label: 'Animals', icon: Users },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/feeding', label: 'Feeding Log', icon: UtensilsCrossed },
  { path: '/food', label: 'Inventory', icon: Package },
  { path: '/analysis', label: 'Analysis', icon: BarChart3 },
  { path: '/alerts', label: 'Alerts', icon: Bell },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-gray-900">Feeding System</span>
              <span className="block text-xs text-gray-500 -mt-1">Animal Care Platform</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link group ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                JS
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900">John Smith</p>
                <p className="text-xs text-gray-500">Senior Keeper</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white animate-slideDown">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}