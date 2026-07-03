import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 3000);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf"
};

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, "");
  const full = path.join(root, normalized || "index.html");
  if (!full.startsWith(root)) return null;
  return full;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function createVercelResponse(res) {
  let statusCode = 200;
  return {
    setHeader: (name, value) => res.setHeader(name, value),
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      if (!res.headersSent) {
        res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
      }
      res.end(JSON.stringify(payload));
    },
    send(payload) {
      if (!res.headersSent) res.writeHead(statusCode);
      res.end(payload);
    },
    end(payload = "") {
      if (!res.headersSent) res.writeHead(statusCode);
      res.end(payload);
    }
  };
}

async function handleApi(req, res, pathname) {
  const apiName = pathname.replace(/^\/api\//, "").replace(/\.js$/, "");
  const apiFile = path.join(__dirname, "api", `${apiName}.js`);

  try {
    await fs.access(apiFile);
    req.body = await readBody(req);
    const mod = await import(`${pathToFileURL(apiFile).href}?t=${Date.now()}`);
    return mod.default(req, createVercelResponse(res));
  } catch (error) {
    console.error("[server api error]", error);
    if (!res.headersSent) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "application/json; charset=utf-8" });
    }
    res.end(JSON.stringify({ success: false, message: error.code === "ENOENT" ? "API não encontrada" : error.message }));
  }
}

async function handleStatic(req, res, pathname) {
  let filePath = safeJoin(publicDir, pathname === "/" ? "/index.html" : pathname);
  if (!filePath) {
    res.writeHead(403);
    return res.end("Acesso negado");
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!doctype html><meta charset="utf-8"><title>404</title><h1>Página não encontrada</h1><p><a href="/">Voltar para o EventFlow</a></p>`);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url.pathname);
  return handleStatic(req, res, url.pathname);
});

server.listen(port, () => {
  console.log(`EventFlow 2.0 rodando em http://localhost:${port}`);
});
