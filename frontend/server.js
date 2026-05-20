import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD_DIR = process.env.BUILD_DIR || 'dist';

// Serve static files with caching
app.use(express.static(join(__dirname, BUILD_DIR), {
  maxAge: '7d',
  etag: false
}));

// SPA fallback: serve index.html for all non-file routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, BUILD_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Serving from ${BUILD_DIR}`);
});
