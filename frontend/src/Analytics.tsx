import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PieChart, FlaskConical, Target, ActivitySquare } from 'lucide-react';

export function Analytics() {
  const queryClient = useQueryClient();
  const [newExp, setNewExp] = useState({ name: '', hypothesis: '', metric: 'leads' });

  const { data: attribution, isLoading: loadingAttr } = useQuery({
    queryKey: ['attribution'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/attribution/funnel`);
      return res.json();
    }
  });

  const { data: pages } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/pages`);
      return res.json();
    }
  });

  const { data: experiments, isLoading: loadingExp } = useQuery({
    queryKey: ['experiments'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/experiments`);
      return res.json();
    }
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newExp.name, 
          variants: [
            { name: 'Variant A', landingPageId: (newExp as any).variantAPage, trafficWeight: 50 },
            { name: 'Variant B', landingPageId: (newExp as any).variantBPage, trafficWeight: 50 }
          ]
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || 'Failed to create experiment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      setNewExp({ name: '', hypothesis: '', metric: 'leads' });
      alert("Experiment created successfully!");
    },
    onError: (err: any) => {
      alert(`Error creating experiment: ${err.message || 'Unknown error'}`);
    }
  });

  return (
    <div className="flex flex-col space-y-8 p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col space-y-1">
        <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Analytics & A/B Testing</h2>
        <p className="text-text-muted">Analyze attribution models and manage experiments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
        {/* Attribution Section */}
        <Card className="glass border-none shadow-xl">
          <CardHeader className="border-b border-border/50 pb-6">
            <CardTitle className="text-text flex items-center space-x-2">
              <PieChart className="text-primary" size={24} />
              <span>Attribution Modeling</span>
            </CardTitle>
            <CardDescription className="text-text-muted">Compare how channels perform based on attribution rules.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingAttr ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-surface/50 rounded-xl p-4 border border-border shadow-sm">
                  <h4 className="font-semibold mb-4 text-primary flex items-center space-x-2">
                    <Target size={18} />
                    <span>First-Touch Revenue</span>
                  </h4>
                  <div className="rounded-lg overflow-hidden border border-border">
                    <Table>
                      <TableHeader className="bg-surface-hover/50">
                        <TableRow className="border-border">
                          <TableHead className="text-text-muted">Channel</TableHead>
                          <TableHead className="text-right text-text-muted">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(attribution?.firstTouch || {}).map(([channel, metrics]: any) => (
                          <TableRow key={channel} className="border-border hover:bg-surface-hover/30">
                            <TableCell className="font-medium text-text">{channel}</TableCell>
                            <TableCell className="text-right text-text">₹{metrics.revenue.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="bg-surface/50 rounded-xl p-4 border border-border shadow-sm">
                  <h4 className="font-semibold mb-4 text-secondary flex items-center space-x-2">
                    <ActivitySquare size={18} />
                    <span>Last-Touch Revenue</span>
                  </h4>
                  <div className="rounded-lg overflow-hidden border border-border">
                    <Table>
                      <TableHeader className="bg-surface-hover/50">
                        <TableRow className="border-border">
                          <TableHead className="text-text-muted">Channel</TableHead>
                          <TableHead className="text-right text-text-muted">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(attribution?.lastTouch || {}).map(([channel, metrics]: any) => (
                          <TableRow key={channel} className="border-border hover:bg-surface-hover/30">
                            <TableCell className="font-medium text-text">{channel}</TableCell>
                            <TableCell className="text-right text-text">₹{metrics.revenue.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* A/B Testing Section */}
        <div className="space-y-8">
          <Card className="glass border-none shadow-xl">
            <CardHeader className="border-b border-border/50 pb-6">
              <CardTitle className="text-text flex items-center space-x-2">
                <FlaskConical className="text-accent" size={24} />
                <span>Create A/B Test</span>
              </CardTitle>
              <CardDescription className="text-text-muted">Setup a new conversion rate optimization experiment.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-1">
                <Label className="text-text font-medium">Experiment Name</Label>
                <Input className="bg-surface/50 border-border text-text focus:ring-accent/50 transition-all" value={newExp.name} onChange={e => setNewExp({ ...newExp, name: e.target.value })} placeholder="e.g. Hero Redesign Q3" />
              </div>
              <div className="space-y-1">
                <Label className="text-text font-medium">Hypothesis</Label>
                <Input className="bg-surface/50 border-border text-text focus:ring-accent/50 transition-all" value={newExp.hypothesis} onChange={e => setNewExp({ ...newExp, hypothesis: e.target.value })} placeholder="Changing CTA color will increase leads" />
              </div>
              <div className="space-y-1">
                <Label className="text-text font-medium">Variant A Landing Page</Label>
                <Select value={(newExp as any).variantAPage || ''} onValueChange={v => setNewExp({ ...newExp, variantAPage: v } as any)}>
                  <SelectTrigger className="bg-surface/50 border-border text-text"><SelectValue placeholder="Select Page" /></SelectTrigger>
                  <SelectContent className="bg-surface border-border text-text">
                    {pages?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title} ({p.slug})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-text font-medium">Variant B Landing Page</Label>
                <Select value={(newExp as any).variantBPage || ''} onValueChange={v => setNewExp({ ...newExp, variantBPage: v } as any)}>
                  <SelectTrigger className="bg-surface/50 border-border text-text"><SelectValue placeholder="Select Page" /></SelectTrigger>
                  <SelectContent className="bg-surface border-border text-text">
                    {pages?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title} ({p.slug})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => mutation.mutate()} 
                disabled={mutation.isPending || !newExp.name}
                className="w-full bg-gradient-to-r from-accent to-orange-400 text-white hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 py-6 font-semibold rounded-xl"
              >
                Launch Experiment
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-none shadow-xl">
            <CardHeader className="border-b border-border/50 pb-6">
              <CardTitle className="text-text">Active Experiments</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingExp ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {experiments?.map((exp: any) => (
                    <div key={exp.id} className="p-5 border border-border bg-surface/30 rounded-xl hover:border-accent/30 transition-colors shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-text text-lg">{exp.name}</h4>
                        <span className="text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">{exp.status}</span>
                      </div>
                      <p className="text-sm text-text-muted mb-4 bg-surface p-3 rounded-lg border border-border/50 font-medium italic">"{exp.hypothesis}"</p>
                      
                      <div className="rounded-lg overflow-hidden border border-border bg-surface">
                        <Table>
                          <TableHeader className="bg-surface-hover/50">
                            <TableRow className="border-border">
                              <TableHead className="text-text-muted">Variant</TableHead>
                              <TableHead className="text-right text-text-muted">Visits</TableHead>
                              <TableHead className="text-right text-text-muted">Conversions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {exp.variants?.map((v: any, i: number) => (
                              <TableRow key={i} className="border-border hover:bg-surface-hover/30">
                                <TableCell className="font-medium text-text flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-accent'}`} />
                                  <span>{v.name}</span>
                                </TableCell>
                                <TableCell className="text-right text-text">{v._count?.visits?.toLocaleString() || '0'}</TableCell>
                                <TableCell className="text-right text-text font-bold">{v._count?.leads?.toLocaleString() || '0'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                  {experiments?.length === 0 && (
                    <div className="text-center py-8 bg-surface/30 rounded-xl border border-border border-dashed">
                      <FlaskConical size={32} className="mx-auto text-text-muted mb-3 opacity-50" />
                      <p className="text-sm font-medium text-text-muted">No active experiments running.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
