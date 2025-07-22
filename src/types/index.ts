export interface TTSRequest {
  text: string;
  voiceType?: number;
  sampleRate?: number;
  codec?: string;
}

export interface TTSResponse {
  success: boolean;
  data?: {
    audioUrl?: string;
    audioBase64?: string;
    cached: boolean;
  };
  error?: string;
}

export interface CacheItem {
  audioData: string;
  createdAt: Date;
  hash: string;
}
