const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

const authenticate = async (req, res, next) => {
  const idToken = req.cookies.__session;

  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = await admin.auth().verifySessionCookie(idToken, true);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/sessionLogin', async (req, res) => {
  const idToken = req.body.token;
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    const options = { maxAge: expiresIn, httpOnly: true, secure: true };
    res.cookie('__session', sessionCookie, options);
    res.status(200).send({ status: 'success' });
  } catch (error) {
    res.status(401).send('Unauthorized');
  }
});

app.post('/api/customer-info', authenticate, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const response = await axios.get('https://connect.squareup.com/v2/customers?count=true&sort_order=DESC&sort_field=CREATED_AT', {
      headers: {
        'Square-Version': '2024-11-20',
        'Authorization': 'Bearer EAAAls_rU9T80oS74IQZGcq_DHqGWefHeyqA56SQiBNzip03qhBXSGjR2AlQQD-9',
        'Content-Type': 'application/json',
        'origin': 'http://localhost:3000'
      }
    });
    const data = response.data;
    if (data.customers && Array.isArray(data.customers)) {
      const customer = data.customers.find(customer => customer.email_address === email);
      if (customer) {
        res.status(200).json({ customer });
      } else {
        res.status(404).json({ error: 'Customer not found' });
      }
    } else {
      return res.status(500).json({ error: 'Failed to fetch customer data' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Unknown Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});