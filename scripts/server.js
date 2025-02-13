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

      const Payload = {
        reference_id: newBalance.toString(),
        version: customer.version
      };

      await axios.put(`https://connect.squareup.com/v2/customers/${customer.id}`, Payload, {
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

app.post('/api/deposit', async (req, res) => {
  const { amount, customer_id } = req.body;
  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }
  if (!customer_id) {
    return res.status(400).json({ error: 'Customer id is required' });
  }
  
  const LocationId = "L8YZ8F6VBGK7W";
  const cents = parseInt(parseFloat(amount) * 100, 10);

  const payload = {
    checkout_options: {
      allow_tipping: false,
      ask_for_shipping_address: false,
      enable_coupon: false,
      enable_loyalty: false,
      accepted_payment_methods: {},
      custom_fields: [],
      redirect_url: "http://127.0.0.1:3000/success"
    },
    order: {
      location_id: LocationId,
      customer_id,
      line_items: [
        {
          quantity: "1",
          item_type: "CUSTOM_AMOUNT",
          base_price_money: {
            currency: "USD",
            amount: cents
          },
          note: `On-site Balance: $${amount}`
        }
      ]
    }
  };

  try {
    const linkResponse = await axios.post('https://connect.squareup.com/v2/online-checkout/payment-links', payload, {
      headers: {
        'Square-Version': '2024-11-20',
        'Authorization': `Bearer ${process.env.SQUARE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const orderId = linkResponse.data.payment_link.order_id;

    const Payload = {
      order: {
        state: "OPEN",
        version: 1
      }
    };

    const updateResponse = await axios.put(`https://connect.squareup.com/v2/orders/${orderId}`, Payload, {
      headers: {
        'Square-Version': '2024-11-20',
        'Authorization': `Bearer ${process.env.SQUARE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return res.json(updateResponse.data.order.id);
  } catch (error) {
    console.error('Error processing deposit:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Failed to create deposit order' });
  }
});

app.get('/api/success', async (req, res) => {
  const { order_id, email } = req.query;
  if (!order_id) {
    return res.status(400).json({ error: 'Order id is required' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const orderResponse = await axios.get(`https://connect.squareup.com/v2/orders/${order_id}`, {
      headers: {
        'Square-Version': '2024-11-20',
        'Authorization': `Bearer ${process.env.SQUARE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const order = orderResponse.data.order;
    const state = order?.state || 'Unknown';

    if (state === 'OPEN') {
      const lineItem = order.line_items && order.line_items[0];
      if (!lineItem || !lineItem.base_price_money?.amount) {
        return res.status(500).json({ error: 'Deposit amount not found in order details' });
      }
      const cents = parseInt(lineItem.base_price_money.amount, 10);
      const depositAmount = cents / 100;

      const addBalanceResponse = await axios.post(`http://localhost:${port}/api/addbalance`, { email, amount: depositAmount });
      
      return res.json({ message: 'Deposit successful and balance updated', newBalance: addBalanceResponse.data });
    } else {
      return res.json({ message: `Deposit state: ${state}` });
    }
  } catch (error) {
    console.error('Error processing success endpoint:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Failed to process success endpoint' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});