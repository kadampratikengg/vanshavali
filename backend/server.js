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
const familyRoutes = require('./routes/family');
const { errorHandler, multerErrorHandler } = require('./middleware/error');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure Uploads Directory Exists
const uploadPath = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
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

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});

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

// Connect to MongoDB and start server only after successful connection
async function startServer() {
  try {
    await connectDB();
    console.log('MongoDB connected successfully');

    // Routes
    app.get('/', (req, res) => {
      res.status(200).json({ message: '✅ Backend is running' });
    });
    app.use('/', authRoutes);
    app.use('/identity', identityRoutes);
    app.use('/property', upload.any(), propertyRoutes);
    app.use('/financial', upload.any(), financialRoutes);
    app.use('/family', upload.any(), familyRoutes);

    // Verify route registration
    console.log('Registered routes:');
    app._router.stack.forEach((r) => {
      if (r.route && r.route.path) {
        console.log(`  ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
      } else if (r.name === 'router' && r.regexp) {
        const prefix = r.regexp.toString().replace(/\/\^\\\/(.*?)\\\//, '$1') || '';
        console.log(`  Router: /${prefix}`);
      }
    });

    // Serve uploaded files
    app.use('/Uploads', express.static(uploadPath));

    // Handle 404 errors
    app.use((req, res, next) => {
      console.error(`404 Error: Route ${req.originalUrl} not found`);
      res.status(404).json({ message: `Route ${req.originalUrl} not found` });
    });

    // Global error handler with detailed logging
    app.use((err, req, res, next) => {
      console.error('Global Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
      });
      errorHandler(err, req, res, next);
    });

    // Start Server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

startServer();