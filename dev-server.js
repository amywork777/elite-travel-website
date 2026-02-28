const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  // Index fallback
  if (urlPath === '/') urlPath = '/index.html';

  // Vercel-style rewrites
  if (urlPath === '/tours') urlPath = '/tours.html';
  else if (urlPath === '/admin') urlPath = '/admin.html';
  else if (urlPath.startsWith('/tour/') && !urlPath.includes('.')) urlPath = '/tour-detail.html';

  const filePath = path.join(ROOT, urlPath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try adding .html
      fs.readFile(filePath + '.html', (err2, data2) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data2);
        }
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Elite Travel dev server running at:\n`);
  console.log(`  Home:    http://localhost:${PORT}`);
  console.log(`  Tours:   http://localhost:${PORT}/tours`);
  console.log(`  Admin:   http://localhost:${PORT}/admin`);
  console.log(`\n  Press Ctrl+C to stop.\n`);
});
