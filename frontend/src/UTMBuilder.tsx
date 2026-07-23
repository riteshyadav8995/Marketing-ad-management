import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Copy, Check } from 'lucide-react';

const CopyableLink = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div 
      className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-surface transition-colors cursor-pointer group"
      onClick={handleCopy}
      title="Click to copy"
    >
      <div className="truncate max-w-[150px] text-xs text-text-muted">{text}</div>
      {copied ? <Check size={14} className="text-emerald-500 shrink-0" /> : <Copy size={14} className="text-text-muted opacity-0 group-hover:opacity-100 shrink-0" />}
    </div>
  );
};

const formSchema = z.object({
  destinationUrl: z.string().url({ message: "Must be a valid URL" }),
  utm_source: z.string().min(1, { message: "Required" }),
  utm_medium: z.string().min(1, { message: "Required" }),
  utm_campaign: z.string().min(1, { message: "Required" }).regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

export function UTMBuilder() {
  const queryClient = useQueryClient();
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinationUrl: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      utm_term: "",
    },
  });

  const { data: links, isLoading } = useQuery({
    queryKey: ['utmLinks'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/utm-links`);
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

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/utm-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to create link');
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedUrl(data.finalUrl);
      queryClient.invalidateQueries({ queryKey: ['utmLinks'] });
      form.reset();
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="flex flex-col space-y-8 p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col space-y-1">
        <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">UTM Builder</h2>
        <p className="text-text-muted">Standardize your tracking links across all platforms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
        <Card className="glass border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-text">Create New Link</CardTitle>
            <CardDescription className="text-text-muted">Generate standardized UTM tracking links.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-text">Select Published Page (Optional)</Label>
                    <Select onValueChange={(val) => {
                      const selectedPage = pages?.find((p: any) => p.id === val);
                      if (selectedPage) {
                        form.setValue('destinationUrl', `${window.location.origin}/p/${selectedPage.slug}`);
                      }
                    }}>
                      <SelectTrigger className="bg-surface/50 border-border text-text">
                        <SelectValue placeholder="Select a landing page..." />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-border text-text z-50">
                        {pages?.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={form.control}
                    name="destinationUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-text">Destination URL <span className="text-accent">*</span></FormLabel>
                        <FormControl>
                          <Input className="bg-surface/50 border-border text-text focus:ring-primary/50 transition-all" placeholder={`${window.location.origin}/p/your-campaign`} {...field} />
                        </FormControl>
                        <FormMessage className="text-accent" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="utm_source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-text">Source <span className="text-accent">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-surface/50 border-border text-text">
                              <SelectValue placeholder="Select a source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface border-border text-text">
                            <SelectItem value="google">Google</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-accent" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="utm_medium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-text">Medium <span className="text-accent">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-surface/50 border-border text-text">
                              <SelectValue placeholder="Select a medium" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface border-border text-text">
                            <SelectItem value="paid_social">paid_social</SelectItem>
                            <SelectItem value="paid_search">paid_search</SelectItem>
                            <SelectItem value="organic">organic</SelectItem>
                            <SelectItem value="email">email</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-accent" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="utm_campaign"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text">Campaign Name <span className="text-accent">*</span> <span className="text-text-muted text-xs font-normal">(snake_case)</span></FormLabel>
                      <FormControl>
                        <Input className="bg-surface/50 border-border text-text focus:ring-primary/50 transition-all" placeholder="data_analytics_july_2026" {...field} />
                      </FormControl>
                      <FormMessage className="text-accent" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="utm_content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-text">Content <span className="text-text-muted text-xs font-normal">(Optional)</span></FormLabel>
                        <FormControl>
                          <Input className="bg-surface/50 border-border text-text focus:ring-primary/50 transition-all" placeholder="video_ad_b" {...field} />
                        </FormControl>
                        <FormMessage className="text-accent" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="utm_term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-text">Term <span className="text-text-muted text-xs font-normal">(Optional)</span></FormLabel>
                        <FormControl>
                          <Input className="bg-surface/50 border-border text-text focus:ring-primary/50 transition-all" placeholder="data analytics course" {...field} />
                        </FormControl>
                        <FormMessage className="text-accent" />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 py-6 font-semibold"
                >
                  {mutation.isPending ? 'Generating...' : 'Generate Standardized URL'}
                </Button>
              </form>
            </Form>

            {generatedUrl && (
              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-slide-up">
                <p className="text-sm font-semibold text-emerald-500 mb-2">Generated URL successfully:</p>
                <code className="block text-xs break-all text-text-muted bg-surface/50 p-3 rounded-lg border border-border">
                  {generatedUrl}
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-text">Recent Links</CardTitle>
            <CardDescription className="text-text-muted">History of generated tracking parameters.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader className="bg-surface-hover/50">
                    <TableRow className="border-border">
                      <TableHead className="text-text-muted">Campaign</TableHead>
                      <TableHead className="text-text-muted">Source / Medium</TableHead>
                      <TableHead className="text-text-muted">Final URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links?.map((link: any) => (
                      <TableRow key={link.id} className="border-border hover:bg-surface-hover/30 transition-colors">
                        <TableCell className="font-medium text-text">{link.utm_campaign}</TableCell>
                        <TableCell className="text-text-muted">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mr-1">
                            {link.utm_source}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary/10 text-secondary">
                            {link.utm_medium}
                          </span>
                        </TableCell>
                        <TableCell>
                          <CopyableLink text={link.finalUrl} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
