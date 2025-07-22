export interface TTSRequest {
  text: string;
  voiceType?: number;
  sampleRate?: number;
  codec?: string;
}

export interface TTSResponse {
  code: number;
  data?: {
    audioUrl?: string;
    audioBase64?: string;
    cached: boolean;
  };
  message?: string;
}

export interface CacheItem {
  audioData: string;
  createdAt: Date;
  hash: string;
}
