import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PublicPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    fetch(`http://localhost:5000/api/public/pages/${slug}?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Page not found');
        return res.json();
      })
      .then(data => {
        setPage(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, searchParams]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {page.sections.map((section: any, index: number) => (
        <div key={index} className="w-full">
          {section.type === 'HERO' && (
            <div className="py-24 px-8 text-center bg-gradient-to-br from-indigo-50 to-white border-b border-slate-200">
              <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight max-w-4xl mx-auto">{section.content.heading}</h1>
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">{section.content.subheading}</p>
              <Button 
                size="lg" 
                onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {section.content.ctaText}
              </Button>
            </div>
          )}
          
          {section.type === 'LEAD_FORM' && (
            <div id="lead-form" className="py-20 px-8 flex justify-center bg-slate-50 border-b border-slate-200">
              <Card className="w-full max-w-md shadow-2xl border-none bg-white rounded-2xl overflow-hidden">
                <CardHeader className="text-center bg-slate-900 text-white py-8">
                  <CardTitle className="text-3xl font-bold">{section.content.formTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-8">
                  {submitted ? (
                    <div className="text-center py-8 text-emerald-600 font-bold text-xl">
                      Thank you! Your request has been received.
                    </div>
                  ) : (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                      const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                      const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
                      
                      try {
                        await fetch('http://localhost:5000/api/pages/submit-form', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            fields: { name, email, phone },
                            utm: {
                              source: searchParams.get('utm_source'),
                              medium: searchParams.get('utm_medium'),
                              campaign: searchParams.get('utm_campaign'),
                              content: searchParams.get('utm_content'),
                              variantId: searchParams.get('variantId')
                            }
                          })
                        });
                        setSubmitted(true);
                      } catch (err) {
                        alert("Failed to submit form.");
                      }
                    }}>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold">Full Name</Label>
                        <Input name="name" className="bg-slate-50 border-slate-200 h-12" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold">Email Address</Label>
                        <Input name="email" type="email" className="bg-slate-50 border-slate-200 h-12" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold">Phone Number</Label>
                        <Input name="phone" type="tel" className="bg-slate-50 border-slate-200 h-12" />
                      </div>
                      <Button type="submit" className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white mt-6 rounded-xl">
                        {section.content.buttonText}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
