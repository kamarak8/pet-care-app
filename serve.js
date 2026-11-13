// A tiny web server for trying the app on this computer.
// Run:  node serve.js   then open http://localhost:5173
// It only serves the files in this folder and is only reachable from this computer.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;
const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json',
	'.webmanifest': 'application/manifest+json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
};

http.createServer((req, res) => {
	const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
	const filePath = path.normalize(path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
	if (!filePath.startsWith(ROOT + path.sep)) {
		res.writeHead(403).end('Forbidden');
		return;
	}
	fs.readFile(filePath, (err, data) => {
		if (err) {
			res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
			return;
		}
		res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
		res.end(data);
	});
}).listen(PORT, '127.0.0.1', () => {
	console.log(`PawFile is running at http://localhost:${PORT}  (press Ctrl+C to stop)`);
});
