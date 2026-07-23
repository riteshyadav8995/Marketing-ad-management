import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import utmRoutes from './routes/utm';
import pagesRoutes from './routes/pages';
import experimentsRoutes from './routes/experiments';
import attributionRoutes from './routes/attribution';
import integrationsRoutes from './routes/integrations';
import leadsRoutes from './routes/leads';
import publicRoutes from './routes/public';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/utm-links', utmRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/experiments', experimentsRoutes);
app.use('/api/attribution', attributionRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/public', publicRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
