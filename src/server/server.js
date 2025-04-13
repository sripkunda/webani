const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const http = require('http');
const WebSocket = require('ws');
const config = require('./webpack.config');

const args = process.argv.slice(2);

if (args.length > 0) {
    config.entry.main.import = args[0];
}

const publicDir = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.glsl': 'text/plain',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url);

  // Prevent directory traversal attacks
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end('Access denied');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

const compiler = webpack(config);
let sockets = [];

// WebSocket handling
wss.on('connection', (socket) => {
    sockets.push(socket);
    socket.on('close', () => {
        sockets = sockets.filter(s => s !== socket);
    });
});

// Start server
server.listen(3000, () => {
    console.log('\x1b[36m', '[Log: Server Started at http://localhost:3000]', '\x1b[0m');
    compiler.watch({}, (err, stats) => {
        if (err || stats.hasErrors()) {
            console.error('\x1b[31m', 'A webpack error occurred:', err || stats.toJson().errors, '\x1b[0m');
            return;
        }
    
        sockets.forEach((socket) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send('reload');
            }
        });
    });
});