import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Contact2 } from 'lucide-react';

async function fetchLeads() {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/leads`);
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}

async function updateLeadStatus({ id, status, revenue }: { id: string; status: string; revenue?: string }) {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/leads/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, revenue }),
  });
  if (!res.ok) throw new Error('Failed to update lead');
  return res.json();
}

export function CRM() {
  const queryClient = useQueryClient();
  const { data: leads, isLoading } = useQuery({ queryKey: ['leads'], queryFn: fetchLeads });
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [revenueInput, setRevenueInput] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: updateLeadStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsDialogOpen(false);
      setRevenueInput('');
    }
  });

  const handleEnroll = () => {
    if (selectedLead) {
      mutation.mutate({ id: selectedLead.id, status: 'ENROLLED', revenue: revenueInput });
    }
  };

  if (isLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="flex flex-col space-y-8 p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">CRM & Leads</h2>
          <p className="text-text-muted">Manage incoming leads and track sales conversions.</p>
        </div>
      </div>

      <Card className="glass border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-text flex items-center space-x-2">
            <Contact2 className="text-primary" />
            <span>Lead Pipeline</span>
          </CardTitle>
          <CardDescription className="text-text-muted">
            All leads captured from your landing pages and forms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-surface-hover/50">
                <TableRow className="border-border">
                  <TableHead className="text-text-muted">Name</TableHead>
                  <TableHead className="text-text-muted">Email</TableHead>
                  <TableHead className="text-text-muted">Source / Campaign</TableHead>
                  <TableHead className="text-text-muted">Status</TableHead>
                  <TableHead className="text-right text-text-muted">Revenue</TableHead>
                  <TableHead className="text-right text-text-muted">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads?.map((lead: any) => (
                  <TableRow key={lead.id} className="border-border hover:bg-surface-hover/30 transition-colors">
                    <TableCell className="font-medium text-text">{lead.name}</TableCell>
                    <TableCell className="text-text-muted">{lead.email}</TableCell>
                    <TableCell className="text-text-muted">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs uppercase tracking-wider font-semibold text-primary">{lead.source || 'Direct'}</span>
                        {lead.submissions?.[0]?.utmCampaign && (
                          <span className="text-xs text-text-muted opacity-75">{lead.submissions[0].utmCampaign}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        lead.status === 'ENROLLED' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10' :
                        lead.status === 'NEW' ? 'border-amber-500/50 text-amber-500 bg-amber-500/10' :
                        'border-blue-500/50 text-blue-500 bg-blue-500/10'
                      }>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-text font-medium">
                      ₹{lead.revenue?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="text-right">
                      {lead.status !== 'ENROLLED' && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-border hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors" onClick={() => setSelectedLead(lead)}>
                              Mark Enrolled
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass border-border">
                            <DialogHeader>
                              <DialogTitle className="text-text">Enroll Lead: {selectedLead?.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <p className="text-sm text-text-muted">
                                Enrolling this lead will update their status and attribute the revenue to their original acquisition source ({selectedLead?.source || 'Direct'}).
                              </p>
                              <div className="space-y-2">
                                <Label className="text-text">Revenue Amount (₹)</Label>
                                <Input 
                                  type="number" 
                                  placeholder="e.g. 20000" 
                                  value={revenueInput} 
                                  onChange={e => setRevenueInput(e.target.value)}
                                  className="bg-surface border-border text-text"
                                />
                              </div>
                              <Button 
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                                onClick={handleEnroll}
                                disabled={mutation.isPending || !revenueInput}
                              >
                                {mutation.isPending ? 'Processing...' : 'Confirm Enrollment & Revenue'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {leads?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-text-muted">
                      No leads found. Start generating traffic!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
