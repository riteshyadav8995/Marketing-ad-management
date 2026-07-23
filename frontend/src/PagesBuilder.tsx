import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2, LayoutTemplate } from 'lucide-react';

type Section = {
  id: string;
  type: 'HERO' | 'LEAD_FORM';
  content: any;
};

export function PagesBuilder() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('New Campaign Page');
  const [sections, setSections] = useState<Section[]>([]);
  
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sections }),
      });
      if (!res.ok) throw new Error('Failed to save page');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setTitle('New Campaign Page');
      setSections([]);
      alert(`Page published successfully! Live URL: ${window.location.origin}/p/${data.slug}`);
    }
  });

  const addHero = () => {
    setSections([...sections, {
      id: Math.random().toString(),
      type: 'HERO',
      content: { heading: 'Welcome to our Offer', subheading: 'Sign up today to get 50% off.', ctaText: 'Get Started' }
    }]);
  };

  const addLeadForm = () => {
    setSections([...sections, {
      id: Math.random().toString(),
      type: 'LEAD_FORM',
      content: { formTitle: 'Request a Demo', buttonText: 'Submit' }
    }]);
  };

  const updateSection = (id: string, key: string, value: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, content: { ...s.content, [key]: value } } : s));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full space-y-6 p-8 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Landing Page Builder</h2>
          <p className="text-text-muted">Design high-converting pages visually.</p>
        </div>
        <Button 
          onClick={() => mutation.mutate()} 
          disabled={mutation.isPending}
          className="bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 px-8 rounded-full font-semibold"
        >
          {mutation.isPending ? 'Saving...' : 'Save & Publish Page'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 animate-slide-up">
        
        {/* Left: Editor */}
        <Card className="lg:col-span-4 glass border-none shadow-xl overflow-hidden flex flex-col h-[75vh]">
          <CardHeader className="bg-surface/50 border-b border-border pb-4">
            <CardTitle className="text-text flex items-center space-x-2">
              <LayoutTemplate size={20} className="text-primary" />
              <span>Editor</span>
            </CardTitle>
            <CardDescription className="text-text-muted">Configure your landing page elements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 overflow-y-auto p-6 flex-1 scrollbar-thin">
            <div className="space-y-2">
              <Label className="text-text font-semibold">Page Title</Label>
              <Input className="bg-surface border-border text-text focus:ring-primary/50 transition-all font-medium text-lg" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border mt-4">
              <Button variant="outline" className="border-border text-text hover:bg-surface-hover hover:border-primary/50 transition-all flex flex-col h-auto py-4 space-y-2 group" onClick={addHero}>
                <PlusCircle size={24} className="text-primary group-hover:scale-110 transition-transform" />
                <span>Hero Section</span>
              </Button>
              <Button variant="outline" className="border-border text-text hover:bg-surface-hover hover:border-secondary/50 transition-all flex flex-col h-auto py-4 space-y-2 group" onClick={addLeadForm}>
                <PlusCircle size={24} className="text-secondary group-hover:scale-110 transition-transform" />
                <span>Lead Form</span>
              </Button>
            </div>

            <div className="space-y-4 mt-6">
              {sections.map((section, index) => (
                <div key={section.id} className="p-5 border border-border rounded-xl relative bg-surface shadow-sm group hover:border-primary/30 transition-colors animate-fade-in">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-secondary rounded-l-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-text-muted hover:text-accent hover:bg-accent/10 transition-colors" onClick={() => removeSection(section.id)}>
                    <Trash2 size={16} />
                  </Button>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center text-xs font-bold text-text-muted">{index + 1}</span>
                    <h4 className="font-bold text-text">{section.type === 'HERO' ? 'Hero Banner' : 'Lead Capture Form'}</h4>
                  </div>
                  
                  {section.type === 'HERO' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-text-muted text-xs uppercase tracking-wider">Heading</Label>
                        <Input className="bg-surface/50 border-border text-text" value={section.content.heading} onChange={e => updateSection(section.id, 'heading', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-text-muted text-xs uppercase tracking-wider">Subheading</Label>
                        <Input className="bg-surface/50 border-border text-text" value={section.content.subheading} onChange={e => updateSection(section.id, 'subheading', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-text-muted text-xs uppercase tracking-wider">Call to Action</Label>
                        <Input className="bg-surface/50 border-border text-text" value={section.content.ctaText} onChange={e => updateSection(section.id, 'ctaText', e.target.value)} />
                      </div>
                    </div>
                  )}

                  {section.type === 'LEAD_FORM' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-text-muted text-xs uppercase tracking-wider">Form Title</Label>
                        <Input className="bg-surface/50 border-border text-text" value={section.content.formTitle} onChange={e => updateSection(section.id, 'formTitle', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-text-muted text-xs uppercase tracking-wider">Submit Button Text</Label>
                        <Input className="bg-surface/50 border-border text-text" value={section.content.buttonText} onChange={e => updateSection(section.id, 'buttonText', e.target.value)} />
                      </div>
                      <div className="p-3 bg-surface-hover rounded-lg border border-border/50">
                        <p className="text-xs text-text-muted flex flex-wrap gap-2">
                          <span>Includes fields:</span>
                          <span className="px-2 py-0.5 bg-surface rounded-md border border-border">Name</span>
                          <span className="px-2 py-0.5 bg-surface rounded-md border border-border">Email</span>
                          <span className="px-2 py-0.5 bg-surface rounded-md border border-border">Phone</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {sections.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-text-muted border-2 border-dashed border-border rounded-xl bg-surface/30">
                  <LayoutTemplate size={32} className="mb-2 opacity-50" />
                  <p className="text-sm font-medium">No sections added yet.</p>
                  <p className="text-xs text-center mt-1">Click the buttons above to build your page.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Live Preview */}
        <Card className="lg:col-span-8 glass border-none shadow-xl flex flex-col h-[75vh]">
          <CardHeader className="bg-surface/50 border-b border-border pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-text flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Preview</span>
              </CardTitle>
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto bg-[#ffffff]">
            <div className="min-h-full flex flex-col">
              {sections.length === 0 ? (
                <div className="flex items-center justify-center flex-1 text-slate-400">
                  <div className="text-center">
                    <p className="text-xl font-semibold mb-2">Live Canvas</p>
                    <p className="text-sm">Your page design will appear here</p>
                  </div>
                </div>
              ) : (
                sections.map((section, index) => (
                  <div key={section.id} className="w-full relative group">
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      Section {index + 1}
                    </div>
                    {section.type === 'HERO' && (
                      <div className="py-24 px-8 text-center bg-gradient-to-br from-indigo-50 to-white border-b border-slate-200">
                        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight max-w-4xl mx-auto">{section.content.heading}</h1>
                        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">{section.content.subheading}</p>
                        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">{section.content.ctaText}</Button>
                      </div>
                    )}
                    {section.type === 'LEAD_FORM' && (
                      <div className="py-20 px-8 flex justify-center bg-slate-50 border-b border-slate-200">
                        <Card className="w-full max-w-md shadow-2xl border-none bg-white rounded-2xl overflow-hidden">
                          <CardHeader className="text-center bg-slate-900 text-white py-8">
                             <CardTitle className="text-3xl font-bold">{section.content.formTitle}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-5 p-8">
                            <div className="space-y-2">
                              <Label className="text-slate-700 font-semibold">Full Name</Label>
                              <Input className="bg-slate-50 border-slate-200 h-12" id="sim-name" defaultValue="Rahul Kumar" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-700 font-semibold">Email Address</Label>
                              <Input className="bg-slate-50 border-slate-200 h-12" type="email" id="sim-email" defaultValue="rahul@example.com" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-700 font-semibold">Phone Number</Label>
                              <Input className="bg-slate-50 border-slate-200 h-12" type="tel" id="sim-phone" defaultValue="9876543210" />
                            </div>
                            <Button 
                              className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white mt-6 rounded-xl"
                              onClick={async () => {
                                const name = (document.getElementById('sim-name') as HTMLInputElement)?.value;
                                const email = (document.getElementById('sim-email') as HTMLInputElement)?.value;
                                const phone = (document.getElementById('sim-phone') as HTMLInputElement)?.value;
                                
                                try {
                                  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/pages/submit-form`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      fields: { name, email, phone },
                                      utm: { source: 'facebook', medium: 'paid_social', campaign: 'data_analytics_july_2026' }
                                    })
                                  });
                                  if (res.ok) {
                                    alert('Lead submitted! Check the CRM page.');
                                  } else {
                                    alert('Failed to submit lead.');
                                  }
                                } catch (e) {
                                  alert('Error submitting lead.');
                                }
                              }}
                            >
                              {section.content.buttonText}
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
