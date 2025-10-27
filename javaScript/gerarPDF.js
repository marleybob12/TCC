import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

/**
 * Gera PDF do ingresso com QR Code
 * @param {Object} usuario - Dados do usuário (nome, email, id)
 * @param {Object} evento - Dados do evento (titulo, dataInicio, id)
 * @param {Object} lote - Dados do lote (nome, preco, quantidade)
 * @returns {Promise<string>} - Caminho do PDF gerado
 */
export async function gerarPDF(usuario, evento, lote) {
  return new Promise(async (resolve, reject) => {
    try {
      const nomeArquivo = `ingresso_${usuario.nome.replace(/\s+/g, "_")}_${evento.id}.pdf`;
      const pdfPath = path.join(process.cwd(), nomeArquivo);

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // Fundo e título
      doc.rect(0, 0, 595, 842).fill("#eaf6f6");
      doc.fillColor("#000000").fontSize(26).text("INGRESSO EVENTFLOW", { align: "center" });
      doc.moveDown(1);

      // Informações do ingresso
      doc.fontSize(16)
        .text(`Nome: ${usuario.nome}`)
        .text(`Evento: ${evento.titulo}`)
        .text(`Data: ${new Date(evento.dataInicio._seconds * 1000).toLocaleString()}`)
        .text(`Lote: ${lote.nome}`);
      doc.moveDown(1);

      // QR Code
      const qrData = `https://seusite.com/validar?id=${usuario.id}&evento=${evento.id}`;
      const qrImage = await QRCode.toDataURL(qrData);
      doc.image(qrImage, 200, doc.y, { fit: [150, 150], align: "center" });

      // Logo EventFlow
      const logoPath = path.join(process.cwd(), "logo_barra.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 20, 20, { width: 100 });
      }

      doc.end();

      writeStream.on("finish", () => resolve(pdfPath));
      writeStream.on("error", (err) => reject(err));

    } catch (error) {
      reject(error);
    }
  });
}
