export interface ContactDraft {
  name: string;
  email: string;
  message: string;
}

export type ValidSectionId =
  | "work"
  | "skills"
  | "experience"
  | "freelance"
  | "certifications"
  | "about"
  | "contact";

export interface NavAction {
  section: ValidSectionId;
  label: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  contactDraft?: ContactDraft | null;
  navAction?: NavAction | null;
  isStreaming?: boolean;
}

export const INITIAL_ASSISTANT_MESSAGE: Message = {
  id: "msg-welcome",
  role: "assistant",
  content:
    "Hey — I'm LOKI, Lokesh's personal AI assistant. Ask me about his projects, skills, or experience, or I can help you get in touch with him.",
};
