const loginForm = document.getElementById('loginForm');
const leadsSection = document.getElementById('leadsSection');
const addLeadSection = document.getElementById('addLeadSection');
const leadsTableBody = document.getElementById('leadsTableBody');
const addLeadForm = document.getElementById('addLeadForm');
const loginError = document.getElementById('loginError');
const leadsError = document.getElementById('leadsError');
const addLeadError = document.getElementById('addLeadError');
const logoutButton = document.getElementById('logoutButton');

let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');
let globalLeads = [];
let hostedOnLive = false;
let URL = ""

if (hostedOnLive) {
	URL = "https://jwt-sample.onrender.com"
} else {
	URL = "http://localhost:3000"
}

// If we both the access token and refresh token are grabbed from localStorage, display the login form and remove the leadsSection
// Then fetch all leads, and run showAddLeadForm (checks user role first)
document.addEventListener('DOMContentLoaded', () => {
	if (accessToken && refreshToken) {
		loginForm.style.display = 'none';
		leadsSection.style.display = 'block';
		fetchLeads();
		showAddLeadForm();
	}
});

loginForm.addEventListener('submit', function(e) {
	e.preventDefault();
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	console.log("URL HERE IS: ", `${URL}/`)
	axios.post(`${URL}/login`, { username, password })
		.then(response => {
			// If successful, we grab tokens, set them to localStorage, remove the loginForm and loginError
			// Display the leads section, and call fetchLeads to get all leads, and show Lead form (handles roles)
			accessToken = response.data.accessToken;
			refreshToken = response.data.refreshToken;
			localStorage.setItem('accessToken', accessToken);
			localStorage.setItem('refreshToken', refreshToken);
			loginForm.style.display = 'none';
			loginError.style.display = 'none';
			leadsSection.style.display = 'block';
			fetchLeads();
			showAddLeadForm();
		})
		.catch(error => {
			console.error('Authentication failed:', error.response.data);
			loginError.textContent = `Failed to Login: ${error.response.data.message}`
		});
});

//Script to handle logout logic
logoutButton.addEventListener('click', function(e) {
	e.preventDefault();
	axios.post(`${URL}/logout`, { token: refreshToken })
		.then(response => {
			// If no error occurs, we remove everything from the localStorage
			// display login form
			// remove leadsSection and addLeadSection (this will be shown for admin users)
			console.log('Logout successful');
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			accessToken = null;
			refreshToken = null;
			loginForm.style.display = 'block';
			leadsSection.style.display = 'none';
			addLeadSection.style.display = 'none';
		})
		.catch(error => {
			console.error('Logout failed:', error);
			leadsError.textContent = `Failed to Logout: ${error.response.data.message}`
			//In case we get an error, we display it here
			//leadsError.textContent = 'Failed to logout: ' + (error.response ? error.response.data : 'Server error');
		});
});

function fetchLeads() {
	axios.get(`${URL}/leads`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		})
		.then(response => {
			const user = jwt_decode(accessToken);
			globalLeads = response.data;
			const leads = response.data;
			const leadsTableBody = document.getElementById('leadsTableBody');
			leadsTableBody.innerHTML = ''; // Clear existing entries
			leads.forEach(lead => {
				const row = `<tr>
                <td>${lead.companyName}</td>
                <td>${lead.contactInfo}</td>
                <td>${lead.productInterest}</td>
                ${user.role === 'admin' ? `<td><button onclick="editLead(${lead.id})">Edit</button> <button onclick="deleteLead(${lead.id})">Delete</button></td>` : ''}
            </tr>`;
				leadsTableBody.innerHTML += row;
			});

		})
		.catch(error => {
			console.error('Failed to fetch leads:', error);
			if (error.response && error.response.status === 403) {
				refreshTokenRequest();
			} else {
				leadsError.textContent = `Failed to Fetch Leads: ${error.response.data.message}`
			}
		});
}


// to delete a specific lead from view and call the backend endpoint
function deleteLead(id) {
	if (confirm('Are you sure you want to delete this lead?')) {
		axios.delete(`${URL}/leads/${id}`, {
				headers: { Authorization: `Bearer ${accessToken}` }
			})
			.then(response => {
				// Here we just reload the leads to refresh the view
				fetchLeads();
			})
			.catch(error => {
				console.error('Failed to delete lead:', error);
				leadsError.textContent = `Failed to Delete Lead: ${error.response.data.message}`
			});
	}
}



// to call the backend endpoint of updating a lead
function editLead(id) {
	axios.get(`${URL}/leads/${id}`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		})
		.then(response => {
            // 
			const lead = response.data;
			document.getElementById('editId').value = lead.id;
			document.getElementById('editCompanyName').value = lead.companyName;
			document.getElementById('editContactInfo').value = lead.contactInfo;
			document.getElementById('editProductInterest').value = lead.productInterest;
			document.getElementById('editLeadModal').style.display = 'flex';
		})
		.catch(error => {
			console.error('Failed to fetch lead details:', error);
			// If we fail here because of 403 (forbidden) just refresh the token, else just log show the user the reason
			if (error.response && error.response.status === 403) {
				refreshTokenRequest();
			} else {
				leadsError.textContent = `Failed to Edit Lead: ${error.response.data.message}`
			}
		});
}


document.getElementById('editLeadForm').addEventListener('submit', function(e) {
	e.preventDefault();
	const id = document.getElementById('editId').value;
	const companyName = document.getElementById('editCompanyName').value;
	const contactInfo = document.getElementById('editContactInfo').value;
	const productInterest = document.getElementById('editProductInterest').value;

	axios.put(`${URL}/leads/${id}`, {
			companyName,
			contactInfo,
			productInterest
		}, {
			headers: { Authorization: `Bearer ${accessToken}` }
		})
		.then(response => {
			closeEditModal();
			fetchLeads(); // Reload the leads to reflect the update
		})
		.catch(error => {
			console.error('Failed to update lead:', error);
			if (error.response && error.response.status === 403) {
				//If its forbidden, just grab another token using the refresh token
				refreshTokenRequest();
			} else {
				leadsError.textContent = `Failed to Fetch Leads: ${error.response.data.message}`

			}
		});
});

// Function to close the editing wizard
function closeEditModal() {
	document.getElementById('editLeadModal').style.display = 'none';
}


// Function to request another token using the refresh token from the backend
function refreshTokenRequest() {
	console.log("Refresh Toke: ", refreshToken)
	axios.post(`${URL}/token`, { token: refreshToken })
		.then(response => {
			accessToken = response.data.accessToken;
			localStorage.setItem('accessToken', accessToken);
			fetchLeads();
			showAddLeadForm();
		})
		.catch(error => {
			console.error('Failed to refresh token:', error);
			// If this fails, we just log out the user. So that the user logs back in
			logoutUser();
		});
}

// Log out the user, remove user's tokens from the localStorage, set them to null, and return back to loginForm
function logoutUser() {
	console.log('Session expired or token invalid, logging out.');
	localStorage.removeItem('accessToken');
	localStorage.removeItem('refreshToken');
	accessToken = null;
	refreshToken = null;
	loginForm.style.display = 'block';
	leadsSection.style.display = 'none';
	addLeadSection.style.display = 'none';
}


//Decodes user's access token, if the user is an admin, we show it, if not, we dont.
function showAddLeadForm() {
	const user = jwt_decode(accessToken);
	if (user.role === 'admin') {
		addLeadSection.style.display = 'block';
	} else {
		addLeadSection.style.display = 'none';
	}
}

function showEditLeadForm() {

}

//This handles the Submit form for creating a new lead
addLeadForm.addEventListener('submit', function(e) {
	e.preventDefault();

	//Getting the required data to create a new lead
	const companyName = document.getElementById('companyName').value;
	const contactInfo = document.getElementById('contactInfo').value;
	const productInterest = document.getElementById('productInterest').value;

	// Calling the endpoint that handles creation of a new lead
	axios.post(`${URL}/leads`, { companyName, contactInfo, productInterest }, {
			headers: { Authorization: `Bearer ${accessToken}` }
		})
		.then(response => {
			fetchLeads(); // Refresh the leads list
			addLeadForm.reset(); // Reset the form fields
			leadsError.textContent = "";
		})
		.catch(error => {

			//Check if error is because the token expired, if yes, then request a new one using the refresh token
			if (error.response && error.response.status === 403) {
				refreshTokenRequest();
			} else {
				console.log("Error Object: ", error.response.data.message)
				leadsError.textContent = `Failed to Create a new Lead: ${error.response.data.message}`
			}
		});
});