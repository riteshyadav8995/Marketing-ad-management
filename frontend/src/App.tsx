import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, Users, MousePointerClick, TrendingUp, LayoutDashboard, Link as LinkIcon, AppWindow, BarChart, Sun, Moon, Plug } from 'lucide-react';
import { UTMBuilder } from './UTMBuilder';
import { PagesBuilder } from './PagesBuilder';
import { CRM } from './CRM';
import { Analytics } from './Analytics';
import { Integrations } from './Integrations';
import { PublicPage } from './PublicPage';
import { useState, useEffect, createContext, useContext } from 'react';

const queryClient = new QueryClient();

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard`;

async function fetchSummary() {
  const res = await fetch(`${API_BASE}/summary`);
  return res.json();
}

async function fetchPlatformComparison() {
  const res = await fetch(`${API_BASE}/platform-comparison`);
  return res.json();
}

async function fetchDailyMetrics() {
  const res = await fetch(`${API_BASE}/daily-metrics`);
  return res.json();
}

// Authentication Context
interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function MetricCard({ title, value, icon: Icon, description, trend }: { title: string, value: string | number, icon: any, description?: string, trend?: string }) {
  return (
    <Card className="glass border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-text-muted">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-text">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-text-muted mt-2 flex items-center space-x-1">
            {trend && <span className="text-emerald-500 font-medium">{trend}</span>}
            <span>{description}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useQuery({ queryKey: ['summary'], queryFn: fetchSummary });
  const { data: platforms, isLoading: loadingPlatforms } = useQuery({ queryKey: ['platforms'], queryFn: fetchPlatformComparison });
  const { data: dailyMetrics, isLoading: loadingDaily } = useQuery({ queryKey: ['dailyMetrics'], queryFn: fetchDailyMetrics });

  if (loadingSummary || loadingPlatforms || loadingDaily) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col space-y-1">
        <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Command Center</h2>
        <p className="text-text-muted">Monitor your cross-platform digital marketing performance in real-time.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
        <MetricCard title="Total Spend" value={`₹${summary?.spend.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Total Revenue" value={`₹${summary?.revenue.toLocaleString()}`} icon={TrendingUp} />
        <MetricCard title="Total Leads" value={summary?.leads.toLocaleString()} icon={Users} />
        <MetricCard title="Total Clicks" value={summary?.clicks.toLocaleString()} icon={MousePointerClick} />
        
        <MetricCard title="ROAS" value={`${summary?.roas.toFixed(2)}x`} icon={Activity} />
        <MetricCard title="CPA" value={`₹${summary?.cpa.toFixed(2)}`} icon={DollarSign} />
        <MetricCard title="CPL" value={`₹${summary?.cpl.toFixed(2)}`} icon={DollarSign} />
        <MetricCard title="Customers" value={summary?.customers.toLocaleString()} icon={Users} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <Card className="col-span-4 glass border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-text">Revenue vs Spend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              {dailyMetrics?.length === 0 ? (
                <div className="h-full flex items-center justify-center text-text-muted">
                  No data available for the last 30 days. Start running campaigns!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                      itemStyle={{ color: 'var(--text)' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} activeDot={{ r: 8 }} dot={false} />
                    <Line type="monotone" dataKey="spend" stroke="var(--color-accent)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 glass border-none shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="text-text">Platform Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader className="bg-surface-hover/50">
                  <TableRow className="border-border">
                    <TableHead className="text-text-muted">Platform</TableHead>
                    <TableHead className="text-right text-text-muted">Spend</TableHead>
                    <TableHead className="text-right text-text-muted">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platforms?.map((p: any) => (
                    <TableRow key={p.platform} className="border-border hover:bg-surface-hover/30 transition-colors">
                      <TableCell className="font-medium text-text flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${p.platform === 'Google' ? 'bg-secondary' : 'bg-primary'}`} />
                        <span>{p.platform}</span>
                      </TableCell>
                      <TableCell className="text-right text-text">₹{p.spend.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-emerald-500 font-bold">{p.roas.toFixed(2)}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Layout({ children, toggleTheme, isDark }: { children: React.ReactNode, toggleTheme: () => void, isDark: boolean }) {
  const location = useLocation();
  
  return (
    <div className="h-screen overflow-hidden flex bg-background font-sans transition-colors duration-300">
      {/* Background decoration */}
      <div className="flex h-screen bg-background bg-grid-pattern font-sans overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <div className="w-64 sidebar-dark shadow-xl z-10 flex flex-col m-4 rounded-2xl overflow-hidden border">
        <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto scrollbar-thin">
          
          <nav className="flex flex-col space-y-2">
            {[
              { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { path: '/utm-builder', icon: LinkIcon, label: 'UTM Builder' },
              { path: '/pages-builder', icon: AppWindow, label: 'Pages & Forms' },
              { path: '/crm', icon: Users, label: 'CRM / Leads' },
              { path: '/analytics', icon: BarChart, label: 'Analytics & Tests' },
              { path: '/integrations', icon: Plug, label: 'Integrations' }
            ].map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:scale-[1.02]'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <button 
            onClick={toggleTheme}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-300 text-slate-300 hover:bg-slate-800 hover:text-white hover:scale-[1.02] group"
          >
            <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700 shadow-sm group-hover:border-primary/50 transition-colors">
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-400" />}
            </div>
            <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto z-10 relative">
        <header className="h-20 flex items-center justify-between px-8 m-4 rounded-2xl bg-surface shadow-md border border-border sticky top-4 z-50">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30">
                A
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-text to-text-muted tracking-tight">Ad Platform</h1>
            </div>
            <div className="h-6 w-px bg-border hidden sm:block"></div>
            <div className="text-sm font-medium text-text-muted uppercase tracking-wider hidden sm:block">
              {location.pathname.replace('/', '').replace('-', ' ')}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-surface hover:bg-surface-hover transition-colors px-4 py-2 rounded-full border border-border shadow-sm cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-orange-400 border-2 border-surface" />
              <span className="text-sm font-medium text-text">Admin User</span>
            </div>
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to logout?")) {
                  const event = new CustomEvent('app-logout');
                  window.dispatchEvent(event);
                }
              }}
              className="text-text-muted hover:text-red-500 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-md glass border-border shadow-2xl p-6 rounded-2xl z-10 animate-fade-in">
        <CardHeader className="text-center pb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/30 mx-auto mb-4">
            A
          </div>
          <CardTitle className="text-2xl font-bold text-text">Welcome Back</CardTitle>
          <p className="text-text-muted mt-2">Sign in to your premium command center</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl p-3 text-text focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="admin@gmail.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl p-3 text-text focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-medium py-3 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 text-center mt-2 disabled:opacity-70"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AppRoutes({ isDark, toggleTheme }: { isDark: boolean, toggleTheme: () => void }) {
  const { token, logout } = useAuth();
  
  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('app-logout', handleLogout);
    return () => window.removeEventListener('app-logout', handleLogout);
  }, [logout]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/p/:slug" element={<PublicPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard/*" element={<ProtectedRoute><Layout toggleTheme={toggleTheme} isDark={isDark}><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/utm-builder/*" element={<ProtectedRoute><Layout toggleTheme={toggleTheme} isDark={isDark}><UTMBuilder /></Layout></ProtectedRoute>} />
      <Route path="/pages-builder/*" element={<ProtectedRoute><Layout toggleTheme={toggleTheme} isDark={isDark}><PagesBuilder /></Layout></ProtectedRoute>} />
      <Route path="/crm/*" element={<ProtectedRoute><Layout toggleTheme={toggleTheme} isDark={isDark}><CRM /></Layout></ProtectedRoute>} />
      <Route path="/analytics/*" element={<ProtectedRoute><Layout toggleTheme={toggleTheme} isDark={isDark}><Analytics /></Layout></ProtectedRoute>} />
      <Route path="/integrations/*" element={<ProtectedRoute><Layout toggleTheme={toggleTheme} isDark={isDark}><Integrations /></Layout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App;
