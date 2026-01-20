
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are the "Art Concierge" for Studio Austinn, a luxury art studio in the UAE. 
Your tone is sophisticated, knowledgeable, minimal, and polite. 
You help visitors understand art services, suggest sculptures or paintings for their spaces, and explain the value of custom art installations.
Services we offer: Custom Art Services, Sculptures, Paintings, Artistic Chandeliers, Art Installations.
We feature artists like Véronique Locci (known for concave blown glass mirrors).
Do not be overly wordy. Keep responses elegant and concise.
`;

const LEAD_PROCESSING_INSTRUCTION = `
You are the Lead Management Assistant for Studio Austinn. 
A prospective client has submitted an inquiry. 
Your task is to generate a personalized, ultra-luxurious acknowledgment message (max 60 words).
Acknowledge their specific interest area (e.g., Sculptures, Bespoke Installations).
Mention that a Senior Art Consultant will reach out within 24 hours.
Maintain a tone of "exclusive boutique service".
`;

// Initialize the GoogleGenAI client and create a chat session
export const createChatSession = (): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
};

// Send a message to the Gemini model using an existing chat session
export const sendMessageToGemini = async (chat: Chat, message: string): Promise<string> => {
  try {
    const result: GenerateContentResponse = await chat.sendMessage({ message });
    return result.text || "I apologize, I am contemplating that thought. Could you please rephrase?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// New function to handle lead processing/confirmation
export const processLeadInquiry = async (leadData: { name: string, email: string, interest: string, message: string }): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `
    New Lead Received:
    Name: ${leadData.name}
    Email: ${leadData.email}
    Interest: ${leadData.interest}
    Message: ${leadData.message}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: LEAD_PROCESSING_INSTRUCTION,
      },
    });
    return response.text || "Thank you for your inquiry. Our team will contact you shortly.";
  } catch (error) {
    console.error("Error processing lead:", error);
    return "Thank you for your inquiry. We have received your request and will be in touch shortly.";
  }
};
