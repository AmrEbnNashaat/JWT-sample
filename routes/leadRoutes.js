const express = require('express');
const { leads } = require('../database/dataStore');
const { authenticateToken, isAdmin, validateLeadUpdate } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all leads endpoint
router.get('/', authenticateToken, (req, res) => {
    res.json(leads);
});

// Get single lead endpoint
router.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const lead = leads.find(lead => lead.id.toString() === id);
    if (lead) {
        res.json(lead);
    } else {
        res.status(404).send('Lead not found');
    }
});

// Create lead endpoint
router.post('/', authenticateToken, isAdmin, (req, res) => {
    const { companyName, contactInfo, productInterest } = req.body;
    const newLead = { id: leads.length + 1, companyName, contactInfo, productInterest };
    leads.push(newLead);
    res.status(201).send(newLead);
});

// Update lead endpoint
router.put('/:id', authenticateToken, isAdmin, validateLeadUpdate, (req, res) => {
    const { id } = req.params;
    const { companyName, contactInfo, productInterest } = req.body;
    const leadIndex = leads.findIndex(lead => lead.id === parseInt(id));

    if (leadIndex !== -1) {
        leads[leadIndex] = { ...leads[leadIndex], companyName, contactInfo, productInterest };
        res.json(leads[leadIndex]);
    } else {
        res.status(404).send('Lead not found');
    }
});

module.exports = router;
