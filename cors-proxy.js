// Production-ready CORS proxy
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();

// Enable CORS for your domain
app.use(cors({
    origin: 'http://training.pacificescience.com',
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type',
        'Accept',
        'Accept-Encoding',
        'Accept-Language',
        'Origin',
        'Referer',
        'Sec-Ch-Ua',
        'Sec-Ch-Ua-Mobile',
        'Sec-Ch-Ua-Platform',
        'User-Agent',
        'Sec-Fetch-Dest',
        'Sec-Fetch-Mode',
        'Sec-Fetch-Site'
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: false
}));

// Handle preflight requests
app.options('*', cors());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Proxy middleware configuration
const proxyOptions = {
    target: 'https://api.bls.gov',
    changeOrigin: true,
    secure: true,
    onProxyReq: (proxyReq, req, res) => {
        // Copy original headers
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
        proxyReq.setHeader('Origin', 'http://training.pacificescience.com');
        
        if (req.body) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        // Set CORS headers
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://training.pacificescience.com';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, HEAD';
        proxyRes.headers['Access-Control-Allow-Headers'] = [
            'Content-Type',
            'Accept',
            'Accept-Encoding',
            'Accept-Language',
            'Origin',
            'Referer',
            'Sec-Ch-Ua',
            'Sec-Ch-Ua-Mobile',
            'Sec-Ch-Ua-Platform',
            'User-Agent',
            'Sec-Fetch-Dest',
            'Sec-Fetch-Mode',
            'Sec-Fetch-Site'
        ].join(', ');
        
        // Remove headers that might cause issues
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['strict-transport-security'];
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({
            error: 'Proxy Error',
            message: err.message
        });
    }
};

// Apply proxy to all routes
app.use('/', createProxyMiddleware(proxyOptions));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`CORS proxy server running on port ${PORT}`);
}); 
