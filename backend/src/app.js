import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { checkCountry } from './middleware/checkCountry.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', checkCountry, (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is running',
    detectedCountry: req.country,
    clientIp: req.clientIp,
    geo: req.geo,
  });
});

app.use('/api', routes);

export default app;
