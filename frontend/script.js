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
                ${user.role === 'admin' ? `<td><button onclick="editLead(${lead.id})">Edit</button></td>` : ''}
            </tr>`;
            leadsTableBody.innerHTML += row;
        });
    })
    .catch(error => {
        console.error('Failed to fetch leads:', error);
        const leadsError = document.getElementById('leadsError');
        if (error.response && error.response.status === 403) {
            refreshTokenRequest();
        } else {
            leadsError.textContent = 'Failed to fetch leads: ' + (error.response ? error.response.data : 'Server error');
        }
    });
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
        const leadsError = document.getElementById('leadsError');
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
        const leadsError = document.getElementById('leadsError');
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

addLeadForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const companyName = document.getElementById('companyName').value;
    const contactInfo = document.getElementById('contactInfo').value;
    const productInterest = document.getElementById('productInterest').value;

    axios.post('http://localhost:3000/leads', { companyName, contactInfo, productInterest }, {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(response => {
        fetchLeads(); // Refresh the leads list
        addLeadForm.reset(); // Reset the form fields
    })
    .catch(error => {
        console.log("Error: ", error)
        console.error('Failed to add lead:', error);
        const leadsError = document.getElementById('leadsError');
        console.log("Error Response: ", error.response)
        console.log("Error Code: ", error.response.status)
        if (error.response && error.response.status === 403) {
            console.log("IM HERE")
            refreshTokenRequest();
        } else {
            leadsError.textContent = 'Failed to fetch leads: ' + (error.response ? error.response.data : 'Server error');
        }
    });
});
