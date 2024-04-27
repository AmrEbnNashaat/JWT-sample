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
let hostedOnLive = true;
let URL = ""

if(hostedOnLive) {
  URL = "https://jwt-sample.onrender.com"
} else {
  URL = "http://localhost:3000"
}

document.addEventListener('DOMContentLoaded', () => {
    if (accessToken && refreshToken) {
        loginForm.style.display = 'none';
        leadsSection.style.display = 'block';
        fetchLeads();
        showAddLeadForm();
    }
});

loginForm.addEventListener('submit', function (e) {
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
            loginError.textContent = 'Failed to login: ' + (error.response ? error.response.data : 'Server error');
        });
});

//Script to handle logout logic
logoutButton.addEventListener('click', function (e) {
    e.preventDefault();
    axios.post(`${URL}/logout`, 
        { token: refreshToken }
    )
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
            leadsError.textContent = 'Failed to fetch leads: ' + (error.response ? error.response.data : 'Server error');
        }
    });
}


function deleteLead(id) {
    if (confirm('Are you sure you want to delete this lead?')) {
        axios.delete(`${URL}/leads/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        .then(response => {
            fetchLeads(); // Reload the leads to reflect the deletion
        })
        .catch(error => {
            console.error('Failed to delete lead:', error);
            leadsError.textContent = 'Failed to delete lead: ' + (error.response ? error.response.data : 'Server error');
        });
    }
}



function editLead(id) {
    axios.get(`${URL}/leads/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(response => {
        const lead = response.data;
        document.getElementById('editId').value = lead.id;
        document.getElementById('editCompanyName').value = lead.companyName;
        document.getElementById('editContactInfo').value = lead.contactInfo;
        document.getElementById('editProductInterest').value = lead.productInterest;
        document.getElementById('editLeadModal').style.display = 'flex';  // Show the modal
    })
    .catch(error => {
        console.error('Failed to fetch lead details:', error);
        // Handle error here
        if (error.response && error.response.status === 403) {
            refreshTokenRequest();
        } else {
            leadsError.textContent = 'Failed to edit lead: ' + (error.response ? error.response.data : 'Server error');
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
        companyName, contactInfo, productInterest
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
            refreshTokenRequest();
        } else {
            leadsError.textContent = 'Failed to fetch leads: ' + (error.response ? error.response.data : 'Server error');
            //logoutUser();
        }
    });
});

function closeEditModal() {
    document.getElementById('editLeadModal').style.display = 'none';
}



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
            // When refresh fails, clear tokens and log out the user
            logoutUser(); // Call logoutUser function to handle user logout
        });
}

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
addLeadForm.addEventListener('submit', function (e) {
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
            //leadsError.textContent = 'Failed to fetch leads: ' + (error.response ? error.response.data : 'Server error');
        }
    });
});
