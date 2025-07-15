require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const identityRoutes = require('./routes/identity');
const propertyRoutes = require('./routes/property');
const financialRoutes = require('./routes/financial');
const { errorHandler, multerErrorHandler } = require('./middleware/error');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure Uploads Directory Exists
const uploadPath = './Uploads';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// Multer Configuration
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(multerErrorHandler);

// Verify Environment Variables
if (!process.env.MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in .env file');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET is not defined in .env file');
  process.exit(1);
}
if (!process.env.UPLOADCARE_PUBLIC_KEY) {
  console.error('Error: UPLOADCARE_PUBLIC_KEY is not defined in .env file');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: '✅ Backend is running' });
});
app.use('/', authRoutes);
app.use('/identity', upload.any(), identityRoutes);
app.use('/property', upload.any(), propertyRoutes);
app.use('/financial', upload.any(), financialRoutes);

// Serve uploaded files
app.use('/Uploads', express.static('Uploads'));

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});