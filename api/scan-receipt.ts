import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, mimeType } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return res.status(400).json({
        error: "Gemini API Key belum dikonfigurasi di Environment Variables Vercel (GEMINI_API_KEY)."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

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
    return res.status(200).json({ success: true, data: parsedResult });
  } catch (err: any) {
    console.error("Receipt scanning error:", err);
    return res.status(500).json({ error: err.message || "Failed to scan receipt" });
  }
}
