const express = require('express');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse URL-encoded data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from 'views' directory
app.use(express.static(path.join(__dirname, 'views')));

// Register Handlebars helpers
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// Optional: Register a helper to format numbers as currency
handlebars.registerHelper('formatCurrency', function(value) {
  return parseFloat(value).toFixed(2);
});

// Serve the form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'form.html'));
});
  
// Handle form submission
app.post('/generate', (req, res) => {
  try {
    const templatePath = path.join(__dirname, 'template.html');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const { company, tableBackground, tableColor, clients } = req.body;

    if (!company || !clients) {
      return res.status(400).send('Missing required form data.');
    }

    // Ensure clients is an array
    let clientsData = [];
    if (Array.isArray(clients)) {
      clientsData = clients;
    } else {
      // If only one client is present, it might not be an array
      clientsData.push(clients);
    }

    // Handle case where only one client is present but products are not arrays
    clientsData = clientsData.map(client => {
      let products = [];
      if (Array.isArray(client.products)) {
        products = client.products;
      } else if (client.products) {
        products.push(client.products);
      }
      return { ...client, products };
    });

    clientsData.forEach(client => {
      let subtotal = 0;
      client.products.forEach(product => {
        const quantity = parseFloat(product.quantity) || 0;
        const price = parseFloat(product.price_ttc) || 0;
        subtotal += quantity * price;
      });
      const delivery = parseFloat(client.order_livr) || 0;
      const fiscalStamp = parseFloat(client.order_tbr) || 0;
      client.order_grand_total = (subtotal + delivery + fiscalStamp).toFixed(2);
    });

    const data = {
      company,
      tableBackground,
      tableColor,
      clients: clientsData,
    };


    const finalHtml = template(data);
    res.send(finalHtml);
  } catch (error) {
    console.error('Error generating email:', error);
    res.status(500).send('An error occurred while generating the email.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
