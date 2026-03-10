import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export async function generateMCQs(
  subject: string, 
  chapter: string, 
  count: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<MCQ[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate ${count} high-quality medical MCQs for MBBS students on the topic: ${subject} - ${chapter}. 
    Difficulty level: ${difficulty}.
    
    Include a diverse mix of the following question types:
    1. Clinical Case-Based: Scenarios involving patient presentation, diagnosis, and management.
    2. Conceptual: Testing deep understanding of physiological or pathological mechanisms.
    3. Critical Thinking: Requiring integration of multiple concepts to arrive at the answer.
    4. Experimental/Research-Based: Questions based on laboratory findings or clinical trials.
    5. Image-Based Description: Describing a finding and asking for its significance (text-only).

    Each question must have:
    - A clear, challenging stem.
    - 4 plausible options (A, B, C, D).
    - A correct answer index (0-3).
    - A detailed, educational explanation that explains why the correct answer is right and why the distractors are wrong.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              minItems: 4,
              maxItems: 4
            },
            correctAnswer: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateFlashcards(subject: string, chapter: string, count: number = 10): Promise<Flashcard[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate ${count} concise medical flashcards for MBBS students on the topic: ${subject} - ${chapter}. 
    Each flashcard should have a 'front' (question or term) and a 'back' (answer or definition).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ["front", "back"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}
