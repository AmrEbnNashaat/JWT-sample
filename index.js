const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const cors = require('cors');
const path = require('path');


// Initialize an express app
const app = express();

// Use static files used in the frontend file
app.use(express.static(path.join(__dirname, 'frontend')));

// Use body parser and cors 
app.use(bodyParser.json());
app.use(cors());


// Usage of routes
app.use('/', authRoutes);
app.use('/leads', leadRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});