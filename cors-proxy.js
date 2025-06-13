// Production-ready CORS proxy
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();

// Enable CORS for your domain
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*', // Replace with your actual domain in Render's environment variables
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
    onProxyRes: (proxyRes) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = process.env.ALLOWED_ORIGIN || '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, HEAD';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
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