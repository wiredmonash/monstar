// Module Imports
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Router Imports 
//const (something)Routes = require('./routes/(route)');

// === Middleware ===
app.use(cors());
app.use(express.json());

// === Connect to MongoDB ===
const url = 'mongodb://localhost:27017/unit-review';
async function connect(url) { await mongoose.connect(url); }
connect(url)
    .then(console.log('Connected to MongoDB Database'))
    .catch((error) => console.log(error));

// === Routes ===
//app.use('/api/v1/(someDefaultRoute Here)', (something)Routes);

// === Debugging Root Route ===
app.get('/', (req, res) => {
    return res.status(200).json({ msg : "Hello frontend... From backend." });
});

// === Start Server ===
const PORT = 8080;
app.listen(PORT, (error) => {
    if (error) 
        console.log(error);

    console.log(`Server running on port ${8080}`);
});
