import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plug, PowerOff, Loader2, CheckCircle2 } from 'lucide-react';

export function Integrations() {
  const queryClient = useQueryClient();
  
  const { data: connections, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/integrations`);
      if (!res.ok) throw new Error('Failed to fetch integrations');
      return res.json();
    }
  });

  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/integrations/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });
      if (!res.ok) throw new Error('Failed to connect');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/integrations/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/integrations/sync`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to sync');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      alert('Sync successful! Dashboard updated.');
    }
  });

  if (isLoading) return <div className="p-8 text-center text-text-muted">Loading integrations...</div>;

  const getPlatformData = (platform: string) => {
    return connections?.find((c: any) => c.platform === platform && c.status === 'CONNECTED');
  };

  const googleData = getPlatformData('GOOGLE');
  const metaData = getPlatformData('META');

  return (
    <div className="flex flex-col space-y-8 p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col space-y-2">
          <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Integrations</h2>
          <p className="text-text-muted text-lg">Connect your ad platforms to automatically sync spend, clicks, and impressions.</p>
        </div>
        <Button 
          onClick={() => syncMutation.mutate()} 
          disabled={syncMutation.isPending || (!googleData && !metaData)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {syncMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}
          Sync Live Metrics
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Google Ads Card */}
        <Card className="glass border-none shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" fill="#4285F4"/>
                  <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44v3.52c5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" fill="#34A853"/>
                  <path d="M5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12h2.97Z" fill="#EA4335"/>
                  <path d="M5 12c0 5.05 4.13 10 10.22 10v-3.52c-3 0-6.17-1.63-6.5-5.44H5V12Z" fill="#FBBC05"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-2xl text-text">Google Ads</CardTitle>
                <CardDescription className="text-text-muted">Sync search & display ad data</CardDescription>
              </div>
            </div>
            {googleData ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/50 px-3 py-1 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-text-muted px-3 py-1 text-sm">Disconnected</Badge>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {googleData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface p-4 rounded-xl border border-border">
                    <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">Active Accounts</p>
                    <p className="text-lg font-bold text-text">{googleData.adAccounts?.length || 0}</p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-border">
                    <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">Last Sync</p>
                    <p className="text-lg font-bold text-text">{new Date(googleData.lastSync).toLocaleTimeString()}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20 transition-all font-semibold"
                  onClick={() => disconnectMutation.mutate(googleData.id)}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PowerOff className="mr-2 h-5 w-5" />}
                  Disconnect Google Ads
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-text-muted">Connect your Google Ads account to automatically import campaign performance metrics directly into your Command Center dashboard.</p>
                <Button 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-all shadow-md hover:shadow-lg"
                  onClick={() => connectMutation.mutate('GOOGLE')}
                  disabled={connectMutation.isPending}
                >
                  {connectMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plug className="mr-2 h-5 w-5" />}
                  Connect Google Ads
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meta Ads Card */}
        <Card className="glass border-none shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 12.062a3.003 3.003 0 011.66-2.695 2.998 2.998 0 013.238.354 3 3 0 011.085 2.378V18h-1.5v-5.938a1.5 1.5 0 00-2.316-1.258 1.502 1.502 0 00-.684 1.258V24h-1.5V12.062z" fill="#0064E0"/>
                  <path d="M21 12.062a3.003 3.003 0 011.66-2.695 2.998 2.998 0 013.238.354 3 3 0 011.085 2.378V18h-1.5v-5.938a1.5 1.5 0 00-2.316-1.258 1.502 1.502 0 00-.684 1.258V24h-1.5V12.062z" fill="#0064E0"/>
                  <path d="M27 12.062a3.003 3.003 0 011.66-2.695 2.998 2.998 0 013.238.354 3 3 0 011.085 2.378V18h-1.5v-5.938a1.5 1.5 0 00-2.316-1.258 1.502 1.502 0 00-.684 1.258V24h-1.5V12.062z" fill="#0064E0"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M18 36c9.941 0 18-8.059 18-18S27.941 0 18 0 0 8.059 0 18s8.059 18 18 18zm8.684-21.785a4.498 4.498 0 00-3.37-3.21c-2.835-.615-5.59 1.157-6.19 3.963l-.004.015a4.5 4.5 0 00-.091 1.705l-3.327 3.328a4.5 4.5 0 00-4.088 1.341c-1.758 1.758-1.758 4.607 0 6.365 1.757 1.757 4.607 1.757 6.364 0a4.499 4.499 0 001.34-4.087l3.329-3.33a4.502 4.502 0 001.704-.09l.016-.004c2.805-.601 4.577-3.355 3.963-6.191l-.005-.02a4.497 4.497 0 00-3.141-3.385l-.014-.004zM16.485 21.03l-3.329 3.33a3 3 0 01-4.242-4.243l3.33-3.329a3.001 3.001 0 014.241 4.243zM21 16.5l3.33-3.33a3.001 3.001 0 00-4.243-4.242l-3.33 3.33a3 3 0 004.243 4.242z" fill="#0064E0"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-2xl text-text">Meta Ads</CardTitle>
                <CardDescription className="text-text-muted">Sync Facebook & Instagram ads</CardDescription>
              </div>
            </div>
            {metaData ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/50 px-3 py-1 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-text-muted px-3 py-1 text-sm">Disconnected</Badge>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {metaData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface p-4 rounded-xl border border-border">
                    <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">Active Accounts</p>
                    <p className="text-lg font-bold text-text">{metaData.adAccounts?.length || 0}</p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-border">
                    <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">Last Sync</p>
                    <p className="text-lg font-bold text-text">{new Date(metaData.lastSync).toLocaleTimeString()}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20 transition-all font-semibold"
                  onClick={() => disconnectMutation.mutate(metaData.id)}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PowerOff className="mr-2 h-5 w-5" />}
                  Disconnect Meta Ads
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-text-muted">Connect your Meta Business Manager to sync Instagram and Facebook ad performance directly to your dashboard.</p>
                <Button 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg transition-all shadow-md hover:shadow-lg"
                  onClick={() => connectMutation.mutate('META')}
                  disabled={connectMutation.isPending}
                >
                  {connectMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plug className="mr-2 h-5 w-5" />}
                  Connect Meta Ads
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
