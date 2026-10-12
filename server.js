import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 8080;

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  let filePath = path.join(process.cwd(), reqUrl === '/' ? 'demo.html' : reqUrl);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath);
    let mime = 'text/plain';
    if (ext === '.html') mime = 'text/html';
    else if (ext === '.js') mime = 'text/javascript';
    else if (ext === '.json') mime = 'application/json';
    else if (ext === '.css') mime = 'text/css';

    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Demo server running at http://localhost:${PORT}/demo.html`);
});
