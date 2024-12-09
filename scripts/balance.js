document.addEventListener('DOMContentLoaded', () => {
  const clientEmail = window.localStorage.getItem('ClientEmail');
  if (clientEmail) {
    fetch('http://localhost:3000/api/customer-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: clientEmail })
    })
    .then(response => response.json())
    .then(customer => {
      if (customer.error) {
        console.error(customer.error);
      } else {
        // From Square API: https://developer.squareup.com/reference/square/customers-api/retrieve-customer#response__property-customer
        const customerInfoDiv = document.getElementById('customer-info');
        customerInfoDiv.innerHTML = `
          <h4>${customer.given_name} ${customer.family_name}</h4>
          <p>Email: ${customer.email_address}</p>
          <p>Balance: ${customer.reference_id}</p>
        `;
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  } else {
    console.error('ClientEmail not found in localStorage');
  }
});



