const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const riskRoutes = require('./routes/risks');
const soaRoutes = require('./routes/soa');
const auditRoutes = require('./routes/audits');
const policyRoutes = require('./routes/policies');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const securityRoutes = require('./routes/security');

const app = express();

app.set('trust proxy', 1);

app.use(compression());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.round(15 * 60 * 1000 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: Math.round(15 * 60 * 1000 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

// CORS must be applied before rate limiting
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400
}));

// Apply rate limiting after CORS
app.use('/api/auth', authLimiter);
app.use(generalLimiter);

app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb',
  parameterLimit: 20
}));

app.use(mongoSanitize());

app.use(xss());

app.use(hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'filter']
}));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/soa', soaRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/security', securityRoutes);

app.use('/uploads', express.static('uploads'));

app.use('/uploads', (req, res, next) => {
  if (req.path.includes('..') || req.path.includes('~')) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}, express.static('uploads', {
  maxAge: '1d',
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

app.use((err, req, res, next) => {
  if (err.status === 401 || err.status === 403 || err.message.includes('CORS')) {
    console.warn('Security error:', {
      error: err.message,
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
  } else {
    console.error('Application error:', err.stack);
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    error: isDevelopment ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  console.warn('404 - Route not found:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date()
  });
  
  res.status(404).json({ 
    message: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 CyberNexus ISMS Server running on port ${PORT}`);
  console.log(`🔒 Security features enabled: ${process.env.NODE_ENV} mode`);
  console.log(`📊 Security dashboard: http://localhost:${PORT}/api/security/dashboard`);
});
