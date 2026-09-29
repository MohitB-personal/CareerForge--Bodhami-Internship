const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { testConnection } = require('./src/config/db');
const initDb = require('./src/database/initDb');
const apiRoutes = require('./src/routes');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://careerforge-frontend-2026.s3-website-ap-southeast-2.amazonaws.com',
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Health Check Route at Root
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to CareerForge API Server',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// Mount V1 API Routes
app.use('/api/v1', apiRoutes);

// Catch 404 & Global Errors
app.use(notFoundHandler);
app.use(errorHandler);

// Bootstrap Server & DB Initialization
const bootstrap = async () => {
  console.log('🚀 Bootstrapping CareerForge Backend Server...');

  // Attempt DB Connection & Schema Initialization
  const isDbConnected = await testConnection();
  if (isDbConnected) {
    await initDb();
  } else {
    console.warn('⚠️ Server starting without active DB connection. Connect MySQL to persist candidate & company data.');
  }

  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🔥 CareerForge Server running on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
    console.log(`=================================================`);
  });
};

bootstrap();

module.exports = app;
