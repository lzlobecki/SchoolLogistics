require('dotenv').config({ path: '../.env' });
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/getbalance', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const response = await axios.get('https://connect.squareup.com/v2/customers?count=true&sort_order=DESC&sort_field=CREATED_AT', {
      headers: {
        'Square-Version': '2024-11-20',
        'Authorization': `Bearer ${process.env.SQUARE_API_KEY}`,
        'Content-Type': 'application/json',
        'origin': 'http://localhost:3000'
      }
    });
    const data = response.data;
    if (data.customers && Array.isArray(data.customers)) {
      const customer = data.customers.find(customer => customer.email_address === email);
      if (customer) {
        return res.json(customer.reference_id);
      } else {
        return res.status(404).json({ error: 'Customer not found' });
      }
    } else {
      return res.status(500).json({ error: 'Failed to fetch customer data' });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'Failed to fetch customer data' });
  }
});

app.post('/api/addbalance', async (req, res) => {
  const { email, amount } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (amount === undefined || isNaN(amount)) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  try {
    const response = await axios.get('https://connect.squareup.com/v2/customers?count=true&sort_order=DESC&sort_field=CREATED_AT', {
      headers: {
        'Square-Version': '2024-11-20',
        'Authorization': `Bearer ${process.env.SQUARE_API_KEY}`,
        'Content-Type': 'application/json',
        'origin': 'http://localhost:3000'
      }
    });
    const data = response.data;
    if (data.customers && Array.isArray(data.customers)) {
      const customer = data.customers.find(customer => customer.email_address === email);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      const currentBalance = parseFloat(customer.reference_id || '0');
      const newBalance = currentBalance + parseFloat(amount);

      const updatePayload = {
        reference_id: newBalance.toString(),
        version: customer.version
      };

      await axios.put(`https://connect.squareup.com/v2/customers/${customer.id}`, updatePayload, {
        headers: {
          'Square-Version': '2024-11-20',
          'Authorization': `Bearer ${process.env.SQUARE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      return res.json(newBalance.toString());
    } else {
      return res.status(500).json({ error: 'Failed to fetch customer data' });
    }
  } catch (error) {
    console.error('Error updating balance:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Failed to update customer balance' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});