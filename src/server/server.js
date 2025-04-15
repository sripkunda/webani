import { readFile } from 'fs';
import { fileURLToPath } from 'url';
import { join, extname, dirname } from 'path';
import webpack from 'webpack';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import config from './webpack.config.cjs';

const args = process.argv.slice(2);

if (args.length > 0) {
    config.entry.main.import = args[0];
}

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const publicDir = join(_dirname, 'dist');

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

const server = createServer((req, res) => {
  let filePath = join(publicDir, req.url === '/' ? 'index.html' : req.url);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end('Access denied');
  }

  readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('404 Not Found');
    }

    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

const compiler = webpack(config);
let sockets = [];

// WebSocket handling
wss.on('connection', (socket) => {
  sockets.push(socket);
  socket.on('close', () => {
    sockets = sockets.filter(s => s !== socket);
  });
});

function isPortAvailable(port, callback) {
  const tester = createServer()
    .once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        callback(false); // Port is in use
      } else {
        callback(true); // Some other error
      }
    })
    .once('listening', () => {
      tester.once('close', () => callback(true)); // Port is available
      tester.close();
    })
    .listen(port);
}

function findAvailablePort(startingPort) {
  let portToTry = startingPort;
  isPortAvailable(portToTry, (available) => {
    if (available) {
      startServerOnPort(portToTry);
    } else {
      portToTry++; // Increment port and check again
      findAvailablePort(portToTry); // Fix: pass new value
    }
  });
}

function startServerOnPort(port) {
  server.listen(port, () => {
    console.log('\x1b[36m', `[Log: Server Started at http://localhost:${port}]`, '\x1b[0m');

    compiler.watch({}, (err, stats) => {
      if (err || stats.hasErrors()) {
        console.error('\x1b[31m', 'A webpack error occurred:', err || stats.toJson().errors, '\x1b[0m');
        return;
      }

      sockets.forEach((socket) => {
        if (socket.readyState === socket.OPEN) { // Correct way to access `OPEN`
          socket.send('reload');
        }
      });
    });
  });
}

findAvailablePort(3000);
