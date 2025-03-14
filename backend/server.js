// Module Imports
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const tagManager = require('./services/tagManager.service');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

// Router Imports 
const UnitRouter = require('./routes/units');
const ReviewRouter = require('./routes/reviews');
const AuthRouter = require('./routes/auth');
const NotificationRouter = require('./routes/notifications');

// === Middleware ===
app.use(cors({ 
        origin: 'http://localhost:4200',
        credentials: true 
    })
);
app.use(express.json({ limit: '50mb' }));                                       // Increased payload limit for JSON requests.
app.use(express.urlencoded({ limit: '50mb', extended: true }));                 // Increased payload limit for URL-encoded requests.
app.use(cookieParser());

// Response handler middlware
app.use((obj, req, res, next) => {
    const statusCode = obj.status || 500;
    const message = obj.message || "Internal server error";
    return res.status(statusCode, {
        success: [200, 201, 204].some(a => a === obj.status) ? true : false,
        status: statusCode,
        message: message,
        data: obj.data
    })
});

// === Connect to MongoDB ===
const url = process.env.MONGODB_CONN_STRING;
async function connect(url) { await mongoose.connect(url); }
connect(url)
    .then(() => { 
        console.log('Connected to MongoDB Database')
        tagManager.updateMostReviewsTag(1);
    })
    .catch((error) => console.log(error));

// === Routes ===
app.use('/api/v1/units', UnitRouter);
app.use('/api/v1/reviews', ReviewRouter);
app.use('/api/v1/auth', AuthRouter);
app.use('/api/v1/notifications', NotificationRouter);

// === Services ===
// Update the most reviews tag every hour
cron.schedule('0 * * * *', async function() {
    await tagManager.updateMostReviewsTag(1);
});

// Generate sitemaps daily at 3:00 AM
cron.schedule('0 3 * * *', function() {
    console.log('Running daily sitemap generation...');
    
    // Path to the sitemap generator script
    const scriptPath = path.join(__dirname, 'utils', 'generate-sitemap.js');
    
    // Use Node to execute the script
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Sitemap generation error: ${error.message}`);
            return;
        }
        
        if (stderr) {
            console.error(`Sitemap stderr: ${stderr}`);
            return;
        }
        
        console.log(`Sitemap generation complete: ${stdout}`);
    });
});

// === Start Server ===
const PORT = process.env.PORT || 8080;                                          // Default to 8080 if no port specified
app.listen(PORT, (error) => {
    if (error)
        console.log(error);

    console.log(`Server running on port ${PORT}`);
});