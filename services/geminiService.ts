// src/services/geminiService.ts
import { Language } from "../types";

/**
 * A lightweight client-side chat session that mirrors what you need:
 * - keeps lang
 * - keeps history
 * - provides sendMessage({ message }) similar to the previous usage
 */
export type ChatSession = {
  lang: Language;
  history: { role: "user" | "model"; text: string }[];
  sendMessage: (args: { message: string }) => Promise<{ text: string }>;
};

export const createChatSession = (lang: Language): ChatSession => {
  const session: ChatSession = {
    lang,
    history: [],
    sendMessage: async ({ message }: { message: string }) => {
      const resp = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          lang,
          message,
          history: session.history,
        }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        console.error("Chat API error:", { status: resp.status, data });
        return {
          text:
            lang === "ar"
              ? "عذراً، حدث خطأ مؤقت. هل يمكنك إعادة المحاولة بعد قليل؟"
              : "Sorry — something went wrong. Please try again in a moment.",
        };
      }

      const text =
        typeof data?.text === "string" && data.text.trim().length > 0
          ? data.text.trim()
          : lang === "ar"
          ? "عذراً، لم أفهم تماماً. هل يمكنك إعادة صياغة سؤالك؟"
          : "I apologize — could you please rephrase?";

      // Update local session history
      session.history.push({ role: "user", text: message });
      session.history.push({ role: "model", text });

      // Keep history bounded
      if (session.history.length > 20) {
        session.history = session.history.slice(session.history.length - 20);
      }

      return { text };
    },
  };

  return session;
};

export const sendMessageToGemini = async (
  chat: ChatSession,
  message: string
): Promise<string> => {
  try {
    const result = await chat.sendMessage({ message });
    return (
      result.text ||
      (chat.lang === "ar"
        ? "عذراً، لم أفهم تماماً. هل يمكنك إعادة صياغة سؤالك؟"
        : "I apologize, I am contemplating that thought. Could you please rephrase?")
    );
  } catch (error) {
    console.error("Chat send error:", error);
    return chat.lang === "ar"
      ? "عذراً، حدث خطأ مؤقت. هل يمكنك إعادة المحاولة بعد قليل؟"
      : "Sorry — something went wrong. Please try again in a moment.";
  }
};

// Lead processing / confirmation (still via /api/gemini)
export const processLeadInquiry = async (
  lang: Language,
  leadData: { name: string; email: string; interest: string; message: string }
): Promise<string> => {
  try {
    const resp = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "lead",
        lang,
        name: leadData.name,
        email: leadData.email,
        interest: leadData.interest,
        message: leadData.message,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    console.log("LEAD API response:", { ok: resp.ok, status: resp.status, data });

    if (!resp.ok) {
      console.error("Lead API error:", { status: resp.status, data });
      return lang === "ar"
        ? "شكراً لتواصلك. لقد استلمنا طلبك وسنعاود التواصل معك قريباً."
        : "Thank you for your inquiry. We have received your request and will be in touch shortly.";
    }

    const text =
      typeof data?.text === "string" && data.text.trim().length > 0
        ? data.text.trim()
        : null;

    return (
      text ||
      (lang === "ar"
        ? "شكراً لتواصلك. لقد استلمنا طلبك، وسيتواصل فريقنا معك قريباً."
        : "Thank you for your inquiry. Our team will contact you shortly.")
    );
  } catch (error) {
    console.error("Error processing lead:", error);
    return lang === "ar"
      ? "شكراً لتواصلك. لقد استلمنا طلبك وسنعاود التواصل معك قريباً."
      : "Thank you for your inquiry. We have received your request and will be in touch shortly.";
  }
};
