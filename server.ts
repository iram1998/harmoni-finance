import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits to handle large receipt photos (base64)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Initialize Gemini client as server-side only
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint for receipt scanning
app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API Key is not configured in the environment" });
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: image,
      },
    };

    const textPart = {
      text: `Analisislah gambar struk belanja ini dan ekstrak informasi transaksi pengeluaran.
Pilihlah kategori yang paling cocok dari daftar kategori pengeluaran ini atau buat kategori baru yang sangat relevan:
- 'Belanja Supermarket' (untuk belanja kebutuhan harian/bulanan di supermarket/minimarket)
- 'Makan & Minum' (untuk restoran, kafe, warung makan, kuliner)
- 'Transportasi' (untuk bensin, parkir, tol, tiket transportasi)
- 'Tagihan & Utilitas' (untuk listrik, air, pulsa, internet, tv kabel)
- 'Kesehatan' (untuk obat, apotek, rumah sakit, klinik)
- 'Hobi & Hiburan' (untuk bioskop, rekreasi, hobi, olahraga)
- 'Pendidikan' (untuk buku, sekolah, bimbel, alat tulis)
- 'Lainnya' (kategori umum jika tidak cocok dengan yang lain)

Ekstrak total nominal akhir yang dibayarkan, tanggal transaksi (dalam format YYYY-MM-DD), deskripsi singkat (nama toko/merchant dan item utama yang dibeli), dan kategorinya.
Pastikan tanggal dalam format YYYY-MM-DD. Jika tahun atau tanggal tidak terlihat jelas atau tidak ada, gunakan tanggal hari ini atau tahun 2026 sebagai default.
Pastikan jumlah nominal adalah angka bulat positif.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: "Anda adalah asisten keuangan pintar untuk aplikasi Harmoni Finansial. Ekstrak data nominal belanja (total), kategori, deskripsi singkat (nama merchant/toko dan ringkasan singkat), dan tanggal transaksi dari foto struk belanja yang diunggah. Berikan hasil dalam format JSON yang valid.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: {
              type: Type.INTEGER,
              description: "Total nominal akhir yang dibayarkan pada struk sebagai angka bulat positif (IDR)."
            },
            category: {
              type: Type.STRING,
              description: "Kategori pengeluaran yang paling cocok."
            },
            description: {
              type: Type.STRING,
              description: "Deskripsi singkat berisi nama merchant dan ringkasan item (misalnya: 'Alfamart - Pembelian Camilan & Susu')."
            },
            date: {
              type: Type.STRING,
              description: "Tanggal transaksi di struk dalam format YYYY-MM-DD."
            }
          },
          required: ["amount", "category", "description", "date"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini");
    }

    const parsedResult = JSON.parse(resultText.trim());
    return res.json({ success: true, data: parsedResult });
  } catch (err: any) {
    console.error("Receipt scanning error:", err);
    return res.status(500).json({ error: err.message || "Failed to scan receipt" });
  }
});

// Set up Vite as dev middleware or serve production static assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
