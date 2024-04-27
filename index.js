const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const cors = require('cors');
const path = require('path');

let refreshTokens = []; // Store refresh tokens


const app = express();
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.json());
app.use(cors());



app.use('/', authRoutes);
app.use('/leads', leadRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
