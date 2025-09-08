import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Example API endpoint
app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

// Set the port to environment variable PORT or 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
