import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

const utmSchema = z.object({
  destinationUrl: z.string().url(),
  utm_source: z.string().min(1),
  utm_medium: z.string().min(1),
  utm_campaign: z.string().min(1),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

// Mocked storage
const storedLinks: any[] = [];

function generateUTMString(params: Record<string, string | undefined>) {
  const url = new URL(params.destinationUrl as string);
  Object.keys(params).forEach(key => {
    if (key !== 'destinationUrl' && params[key]) {
      const formattedKey = key;
      const formattedValue = params[key]!.toLowerCase().replace(/\s+/g, '_');
      url.searchParams.append(formattedKey, formattedValue);
    }
  });
  return url.toString();
}

router.post('/', (req: Request, res: Response): void => {
  try {
    const validatedData = utmSchema.parse(req.body);
    const finalUrl = generateUTMString(validatedData);
    
    const newLink = {
      id: Math.random().toString(36).substring(7),
      ...validatedData,
      finalUrl,
      createdAt: new Date().toISOString()
    };
    
    storedLinks.push(newLink);
    res.status(201).json(newLink);
  } catch (error) {
    res.status(400).json({ error: 'Validation failed', details: error });
  }
});

router.get('/', (req: Request, res: Response) => {
  res.json(storedLinks);
});

export default router;
