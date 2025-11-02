import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import comprarIngresso from "./comprar-ingresso.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Importa a rota de compra
app.use("/comprar-ingresso", comprarIngresso);

// Rota raiz
app.get("/", (req, res) => {
  res.send("Servidor ativo 🎟️");
});

// 🔹 Exportação obrigatória para funcionar na Vercel
export default app;
