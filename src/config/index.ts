import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  tencent: {
    secretId: process.env.TENCENT_SECRET_ID || '',
    secretKey: process.env.TENCENT_SECRET_KEY || ''
  },
  cache: {
    dir: path.resolve(process.env.CACHE_DIR || './cache'),
    enabled: process.env.CACHE_ENABLED === 'true'
  },
  tts: {
    defaultVoiceType: parseInt(process.env.DEFAULT_VOICE_TYPE || '301030'),
    defaultSampleRate: parseInt(process.env.DEFAULT_SAMPLE_RATE || '16000'),
    defaultCodec: process.env.DEFAULT_CODEC || 'wav'
  }
};
