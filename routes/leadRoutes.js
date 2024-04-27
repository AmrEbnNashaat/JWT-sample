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
		res.status(404).send({ message: 'Lead not found' });
	}
});

// Create lead endpoint
router.post('/', authenticateToken, isAdmin, (req, res) => {
	const { companyName, contactInfo, productInterest } = req.body;

	// Check for existing lead
	const existingLead = leads.find(lead =>
		lead.companyName === companyName &&
		lead.contactInfo === contactInfo &&
		lead.productInterest === productInterest
	);

	// If lead already exists, don't add it and send a conflict response
	if (existingLead) {
		console.log("Exists")
		return res.status(409).send({ message: 'A lead with the provided details already exists.' });
	}

	// If lead does not exist, add it
	const newLead = { id: leads.length + 1, companyName, contactInfo, productInterest };
	leads.push(newLead);
	res.status(201).send(newLead);
});


// Update lead endpoint
router.put('/:id', authenticateToken, isAdmin, validateLeadUpdate, (req, res) => {
	const { id } = req.params;
	const { companyName, contactInfo, productInterest } = req.body;

    // Get that specific lead's index
	const leadIndex = leads.findIndex(lead => lead.id === parseInt(id));

    // If it does exist, assign the leads array with that index with the new data grabbed
	if (leadIndex !== -1) {
		leads[leadIndex] = { ...leads[leadIndex], companyName, contactInfo, productInterest };
		res.json(leads[leadIndex]);
	} else {
    // Else, return errorm essage
		res.status(404).send({ message: 'Lead not found' });
	}
});

router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
	const { id } = req.params;
    // Find the lead's index
	const leadIndex = leads.findIndex(lead => lead.id == id);

    //If lead is found, splice it from the array
	if (leadIndex !== -1) {
		leads.splice(leadIndex, 1);
		res.status(200).send({ message: 'Lead successfully deleted' });
	} else {
		// If not found, return a 404 not found response
		res.status(404).send({ message: 'Lead not found' });
	}
})

module.exports = router;