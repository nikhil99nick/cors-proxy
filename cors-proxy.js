// Production-ready CORS proxy
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();

// Enable CORS for your domain
app.use(cors({
    origin: 'http://training.pacificescience.com',
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: false,
    maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

// Special route to handle HEAD requests for availability checks
app.head('/publicAPI/v2/timeseries/data/', (req, res) => {
    console.log('HEAD request received for API availability check');
    res.status(200).end();
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Proxy for BLS API
app.use('/', createProxyMiddleware({
    target: 'https://api.bls.gov',
    changeOrigin: true,
    secure: true,
    onProxyReq: (proxyReq, req, res) => {
        // Add any necessary headers to the proxied request
        proxyReq.setHeader('Origin', 'https://api.bls.gov');
    },
    onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers to the proxied response
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://training.pacificescience.com';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, HEAD, PUT, DELETE, PATCH';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Origin, Accept, X-Requested-With';
        proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Range, X-Content-Range';
        proxyRes.headers['Access-Control-Max-Age'] = '86400';
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['strict-transport-security'];
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy Error');
    }
}));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`CORS proxy server running on port ${PORT}`);
}); 
