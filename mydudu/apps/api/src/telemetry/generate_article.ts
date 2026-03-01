import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// System prompt strictly follows the required ai_education_prompt.md guidelines.
const SYSTEM_PROMPT = `Anda adalah seorang dokter spesialis anak dan ahli nutrisi pediatrik dari Indonesia yang ramah, empatik, dan suportif. 
Tugas Anda adalah menulis artikel edukasi atau panduan langkah-demi-langkah singkat untuk orang tua berdasarkan status klinis dan pengukuran antropometri (Z-Score) anak terkini.

ATURAN KETAT:
1. Gunakan Bahasa Indonesia yang baik, mudah dipahami, tidak kaku, dan bernada menyemangati (suportif).
2. Jangan mendiagnosis secara mutlak, selalu sarankan konsultasi dengan dokter medis atau posyandu jika ada status bahaya.
3. Artikel HARUS memiliki judul yang SPESIFIK, JELAS, dan TERARAH sesuai kondisi anak (misalnya: "Atasi Berat Kurang di Usia 2 Tahun" atau "Nutrisi Penambah Tinggi untuk Cegah Stunting"). JANGAN gunakan judul generik/basa-basi seperti "Fokus Tumbuh Kembang" atau "Si Kecil Hebat".
4. Anda HARUS menghemat token. Batasi description maksimal 20 kata.
5. Anda HARUS menyertakan persis 1 link referensi/sumber artikel medis atau kesehatan terpercaya dari Indonesia (misal: IDAI, Kemenkes, Alodokter, Halodoc, dsb) yang relevan dan memastikan URL-nya valid.
6. Berikan nilai string statis berupa keyword gambar pada "image". Misalnya: "stunting_care", "healthy_food", atau "posyandu_visit".
7. Anda hanya boleh membalas dengan format JSON murni.`;

const JSON_SCHEMA = {
    type: "object",
    properties: {
        title: {
            type: "string",
            description: "Judul artikel pendek yang menarik (Maksimal 6 kata)."
        },
        description: {
            type: "string",
            description: "Satu kalimat penjelasan ringkas dan suportif tentang kondisi medis (Maksimal 20 kata)."
        },
        link: {
            type: "string",
            description: "URL referensi asli yang valid dari sumber terpercaya (Misal: Kemenkes, IDAI)."
        },
        image: {
            type: "string",
            description: "Keyword gambar. Misalnya: 'stunting_care', 'healthy_food', atau 'posyandu_visit'."
        }
    },
    required: ["title", "description", "link", "image"]
};

// Represents the input payload
export interface ChildHealthContext {
    childName: string;
    age: string;
    gender: string;
    clinicalStatus: {
        overall: string;
        details: {
            weightKg?: number | null;
            heightCm?: number | null;
            bbU?: string | null;
            tbU?: string | null;
            bbTb?: string | null;
            temperature?: number | null;
            heartRate?: number | null;
        }
    };
    context: string;
}

export async function generateEducationalArticle(context: ChildHealthContext) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        const payloadString = JSON.stringify(context, null, 2);

        // Use gemini-2.5-flash as it is fast, cheap, and obeys JSON schemas well
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: payloadString,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: JSON_SCHEMA,
                temperature: 0.7
            }
        });

        if (!response.text) {
            throw new Error("AI returned empty response");
        }

        // Attempt to parse JSON strictly
        const article = JSON.parse(response.text);

        // Extract usage metadata
        const usage: any = response.usageMetadata;

        if (usage) {
            try {
                // Log token usage for admin dashboard without blocking the main response
                await prisma.aITokenLog.create({
                    data: {
                        operation: 'generate_article',
                        promptTokens: usage.promptTokenCount || 0,
                        completionTokens: usage.candidatesTokenCount || 0,
                        totalTokens: usage.totalTokenCount || 0
                    }
                });
            } catch (logErr) {
                console.error("Failed to log token usage:", logErr);
            }
        }

        return article;
    } catch (error) {
        console.error("Failed to generate educational article:", error);
        throw error;
    }
}
