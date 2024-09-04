const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ==== Express Setup ====
const app = express();
const PORT_NUMBER = 8080;
app.listen(PORT_NUMBER, (error) => {
    if (error) { console.log(error); return; }
    console.log(`Listening on port: ${PORT_NUMBER}`)
});
// ==== Middleware ====
app.use(cors());
app.use(express.json());


// ==== MongoDB Setup ====
const url = 'mongodb://localhost:27017/unit-review';
async function connect(url) {
    await mongoose.connect(url);
}
connect(url).then(console.log).catch((error) => console.log(error));    

// ==== GET Home Page ====
app.get('/', (req, res) => {
    res.send('Test home page API is working')
});