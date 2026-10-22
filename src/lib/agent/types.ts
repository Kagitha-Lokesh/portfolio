/**
 * LOKI AI Assistant — Shared Server Agent Types
 */

import type { ContactDraft, NavAction, ValidSectionId } from "@/components/agent/types";
import type { ChatMessage, ProviderId, ProviderDiagnostic, ProviderConfig } from "./llm";
import type {
  IntentCategory,
  KnowledgeDomain,
  RetrievedFact,
  ResolvedSubject,
  RetrievalResult,
} from "./offline-retrieval";
import type { ComposedResponse } from "./offline-composer";
import type {
  ExtractedContactDetails,
  ContactFlowStatus,
  ContactFlowResult,
} from "./offline-contact";

export type {
  ContactDraft,
  NavAction,
  ValidSectionId,
  ChatMessage,
  ProviderId,
  ProviderDiagnostic,
  ProviderConfig,
  IntentCategory,
  KnowledgeDomain,
  RetrievedFact,
  ResolvedSubject,
  RetrievalResult,
  ComposedResponse,
  ExtractedContactDetails,
  ContactFlowStatus,
  ContactFlowResult,
};
