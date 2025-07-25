export interface TTSRequest {
  text: string;
  voiceType?: number;
  sampleRate?: number;
  codec?: string;
}

export interface TTSResponse {
  code: number;
  data?: {
    voiceType?: number;
    sampleRate?: number;
    audioUrl?: string;
    audioBase64?: string;
    cached: boolean;
  };
  message?: string;
}
