import admin from "firebase-admin";

function getServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (json) return JSON.parse(json);
  if (base64) return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
  return null;
}

export function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app();

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT ou FIREBASE_SERVICE_ACCOUNT_BASE64 não configurado no backend.");
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export function getDb() {
  initFirebaseAdmin();
  return admin.firestore();
}

export function applyCors(req, res, methods = "GET,POST,OPTIONS") {
  const allowedOrigin = process.env.FRONTEND_URL || req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

export function handleOptions(req, res, methods) {
  applyCors(req, res, methods);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

export function formatarData(valor) {
  if (!valor) return "A definir";
  if (valor.toDate) return valor.toDate().toLocaleString("pt-BR");
  if (valor._seconds) return new Date(valor._seconds * 1000).toLocaleString("pt-BR");
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "A definir" : data.toLocaleString("pt-BR");
}

export function toDateOrNull(valor) {
  if (!valor) return null;
  if (valor.toDate) return valor.toDate();
  if (valor._seconds) return new Date(valor._seconds * 1000);
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

export { admin };
