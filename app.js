const express = require('express');
const client = require('prom-client');

const app = express();
const port = process.env.PORT || 3000;

// Enable collection of default metrics (CPU, RAM, event loop lag, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Custom Counter (example)
const requestCounter = new client.Counter({
    name: 'app_requests_total',
    help: 'Total number of requests received',
    labelNames: ['method', 'route']
});

// Root endpoint
app.get('/', (req, res) => {
    requestCounter.inc({ method: 'GET', route: '/' });
    res.send('Hello from Node.js Dockerized App with Metrics!');
});

// A sample GET API endpoint
app.get('/hello', (req, res) => {
    requestCounter.inc({ method: 'GET', route: '/hello' });
    res.json({ message: 'Hello API Works!' });
});

// A sample POST API endpoint
app.post('/data', express.json(), (req, res) => {
    requestCounter.inc({ method: 'POST', route: '/data' });
    res.json({ received: req.body });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
