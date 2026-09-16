import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { ClinicalNote, ClinicalNoteCreateRequest } from "@/features/emergency/care/clinicalNote/types";

const CLINICAL_NOTE_PATH = "/api/emergency/care/records";

export async function getClinicalNotes(receptionId: string): Promise<ClinicalNote[]> {
  const { data } = await apiClient.get<ApiResponse<ClinicalNote[]>>(CLINICAL_NOTE_PATH, {
    params: { receptionId },
  });
  return data.data;
}

export async function createClinicalNote(request: ClinicalNoteCreateRequest): Promise<ClinicalNote> {
  const { data } = await apiClient.post<ApiResponse<ClinicalNote>>(CLINICAL_NOTE_PATH, request);
  return data.data;
}
