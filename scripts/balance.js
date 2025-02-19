document.addEventListener('DOMContentLoaded', () => {
  const clientEmail = window.localStorage.getItem('ClientEmail');
  if (clientEmail) {
    fetch('http://127.0.0.1:4000/api/customer-info', {
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
          <p>Balance: ${customer}</p>
        `;
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
});