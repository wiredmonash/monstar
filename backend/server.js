// Module Imports
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const cors = require('cors');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const tagManager = require('./services/tagManager.service');
require('dotenv').config();

// Router Imports 
const UnitRouter = require('./routes/units');
const ReviewRouter = require('./routes/reviews');
const AuthRouter = require('./routes/auth');

// === Middleware ===
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

// === Routes ===
app.use('/api/v1/units', UnitRouter);
app.use('/api/v1/reviews', ReviewRouter);
app.use('/api/v1/auth', AuthRouter);

// === Serving Static Files ===
app.use(express.static(path.join(__dirname, '../frontend/dist/frontend/browser')));

// === Connect to MongoDB ===
const url = process.env.MONGODB_CONN_STRING;
async function connect(url) { 
    await mongoose.connect(url); 
}
connect(url)
    .then(() => { 
        console.log('Connected to MongoDB Database')
        tagManager.updateMostReviewsTag(1);
    })
    .catch((error) => console.log(error));

// === Services ===
cron.schedule('0 * * * *', async function() {
    await tagManager.updateMostReviewsTag(1);
})

// === Catch all route ===
app.get('*', (req, res) => {
    return res.sendFile(path.join(__dirname, '../frontend/dist/frontend/browser/index.html'));
});

// === Start Server ===
const PORT = process.env.PORT || 8080;                                          // Default to 8080 if no port specified
app.listen(PORT, (error) => {
    if (error)
        console.log(error);

    console.log(`Server running on port ${PORT}`);
});
