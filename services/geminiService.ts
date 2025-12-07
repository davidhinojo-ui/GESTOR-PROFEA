

import { GoogleGenAI, Type } from "@google/genai";
import { AIDocAnalysis, AIToolAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Analyze uploaded document
export const analyzeDocumentImage = async (base64Image: string): Promise<AIDocAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: "Analiza este documento de construcción para obras PROFEA. Clasifícalo estrictamente en una de estas categorías: 'Administrativa', 'Documentación de Obra', 'Documentación de Trabajadores', 'Reconocimientos Médicos', 'Documentación Subcontratas', 'Formación de Trabajadores', 'Documentación SAE', 'Contratos de Trabajo'. Extrae la fecha de caducidad si existe (formato YYYY-MM-DD), el nombre del trabajador si aplica, y un resumen breve. Determina si parece un documento válido oficial."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { 
                type: Type.STRING, 
                enum: [
                    "Administrativa", 
                    "Documentación de Obra", 
                    "Documentación de Trabajadores", 
                    "Reconocimientos Médicos", 
                    "Documentación Subcontratas", 
                    "Formación de Trabajadores",
                    "Documentación SAE",
                    "Contratos de Trabajo"
                ] 
            },
            summary: { type: Type.STRING },
            expiryDate: { type: Type.STRING, nullable: true },
            workerName: { type: Type.STRING, nullable: true },
            isValid: { type: Type.BOOLEAN }
          },
          required: ["category", "summary", "isValid"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AIDocAnalysis;

  } catch (error) {
    console.error("Error analyzing document:", error);
    // Fallback in case of error
    return {
      category: "Documentación de Obra",
      summary: "No se pudo analizar automáticamente el documento.",
      expiryDate: null,
      workerName: null,
      isValid: true
    };
  }
};

// Analyze tool image
export const analyzeToolImage = async (base64Image: string): Promise<AIToolAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: "Identifica esta herramienta de construcción. Sugiere un nombre corto, su estado aparente (nuevo, usado, dañado) y observaciones."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            suggestedStatus: { type: Type.STRING },
            conditionAssessment: { type: Type.STRING }
          },
          required: ["name", "conditionAssessment"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AIToolAnalysis;

  } catch (error) {
    console.error("Error analyzing tool:", error);
    return {
      name: "Herramienta Desconocida",
      suggestedStatus: "Disponible",
      conditionAssessment: "Análisis manual requerido"
    };
  }
};