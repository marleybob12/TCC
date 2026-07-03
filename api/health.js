export default async function handler(req, res) {
  const allowedOrigin = process.env.FRONTEND_URL || req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.status(200).end();
  return res.status(200).json({
    success: true,
    app: "EventFlow 2.0 Firebase",
    status: "online",
    timestamp: new Date().toISOString()
  });
}
