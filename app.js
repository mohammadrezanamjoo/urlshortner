const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost/urlshortener', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
});

const Url = mongoose.model('Url', urlSchema);

app.use(express.json());

app.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;

  if (!isValidUrl(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    // Check if the URL is already in the database
    let url = await Url.findOne({ originalUrl });

    if (!url) {
      const shortUrl = shortid.generate();

      url = new Url({ originalUrl, shortUrl });
      await url.save();
    }

    res.json({ shortUrl: url.shortUrl });
  } catch (error) {
    console.error('Error shortening URL:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await Url.findOne({ shortUrl });

    if (url) {
      res.redirect(url.originalUrl);
    } else {
      res.status(404).json({ error: 'Short URL not found' });
    }
  } catch (error) {
    console.error('Error expanding URL:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
