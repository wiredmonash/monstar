// Module Imports
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();

// Router Imports 
const UnitRouter = require('./routes/units');
const ReviewRouter = require('./routes/reviews');

// === Middleware ===
app.use(cors());
app.use(express.json());

// === Connect to MongoDB ===
const url = process.env.MONGODB_CONN_STRING;
async function connect(url) { await mongoose.connect(url); }
connect(url)
    .then(console.log('Connected to MongoDB Database'))
    .catch((error) => console.log(error));

// === Routes ===
app.use('/api/v1/units', UnitRouter);
app.use('/api/v1/reviews', ReviewRouter);

// === Debugging Root Route ===
// app.get('/', (req, res) => {
//     return res.status(200).json({ msg : "Hello frontend... From backend." });
// });

// === Start Server ===
const PORT = 8080;
app.listen(PORT, (error) => {
    if (error) 
        console.log(error);

    console.log(`Server running on port ${8080}`);
});
