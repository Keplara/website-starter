const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Set up Multer for file uploads (store files in memory for simplicity)
const upload = multer({ dest: 'uploads/' });

const authorizationServerURL = "http://localhost:8084";
const credsFilePath = path.join(__dirname, 'client-credentials', 'creds.json');

// Make request to authserver to retrieve client creds if creds flie doesn;t exist

// Simple health check route
app.get('/health-check', (req, res) => {
  res.status(200).json({ message: 'Server is healthy!' });
});

// Function to read credentials from file or fetch from server if not present
async function getClientCredentials() {
    if (fs.existsSync(credsFilePath)) {
      // If credentials file exists, read and return its content
      const creds = JSON.parse(fs.readFileSync(credsFilePath, 'utf-8'));
      return creds;
    } else {
      // If credentials file doesn't exist, fetch from authorization server
      const creds = await fetchClientCredentials();
      
      // Save the credentials to the file for future use
      fs.writeFileSync(credsFilePath, JSON.stringify(creds), 'utf-8');
      return creds;
    }
  }
  

// Middleware to protect routes based on JWT and scope
async function introspectToken(token) {
    const introspectionUrl = `${authorizationServerURL}/oauth/introspect`; // Replace with your introspection endpoint URL
    const clientId = process.env.clientId; // Replace with your client ID
    const clientSecret = process.env.clientSecret; // Replace with your client secret
  
    try {
      const response = await axios.post(
        introspectionUrl,
        `token=${token}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          auth: {
            username: clientId,
            password: clientSecret,
          },
        }
      );
      
      return response.data; // This will contain the token's status and scopes
    } catch (error) {
      throw new Error('Error during token introspection: ' + error.message);
    }
  }

// Upload product route (protected, requires 'product.create' scope)
app.post('/upload-product', checkScope('product.create'), upload.single('productFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Handle the uploaded file here
  res.status(200).json({
    message: 'Product file uploaded successfully',
    file: req.file,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});