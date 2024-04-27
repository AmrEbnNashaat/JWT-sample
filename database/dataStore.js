let users = [
  { username: '1', password: '1', role: 'admin' },
  { username: 'amr', password: '1', role:'test'}
  // ... other users
];

let leads = [
  { id: 1, companyName: "Company A", contactInfo: "email@companya.com", productInterest: "Odoo" },
  { id: 2, companyName: "Company B", contactInfo: "email@companyb.com", productInterest: "Generic ERP" },
  { id: 3, companyName: "Company C", contactInfo: "email@companyc.com", productInterest: "SAP" },
  { id: 4, companyName: "tst", contactInfo: "tst", productInterest: "tst" }

];

let refreshTokens = [];


module.exports = { users, leads, refreshTokens };
