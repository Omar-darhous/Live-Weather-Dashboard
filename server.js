import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
http.createServer(async (req,res) => {
  try {
    const name = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(root + path.sep) || !['.html','.css','.js','.svg'].includes(path.extname(file))) {res.writeHead(403);res.end();return;}
    res.writeHead(200, {'Content-Type':mime[path.extname(file)]});res.end(await readFile(file));
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(5173,'127.0.0.1',()=>console.log('Weather dashboard: http://localhost:5173'));
