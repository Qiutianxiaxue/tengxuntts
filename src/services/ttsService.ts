import { Client } from 'tencentcloud-sdk-nodejs-tts/tencentcloud/services/tts/v20190823/tts_client';
import { TextToVoiceRequest } from 'tencentcloud-sdk-nodejs-tts/tencentcloud/services/tts/v20190823/tts_models';
import { config } from '../config';
import { CacheManager } from './cacheManager';

export class TTSService {
  private client: Client;
  private cacheManager: CacheManager;

  constructor() {
    this.client = new Client({
      credential: {
        secretId: config.tencent.secretId,
        secretKey: config.tencent.secretKey,
      },
      region: 'ap-beijing',
    });
    this.cacheManager = new CacheManager();
  }

  async textToSpeech(
    text: string,
    voiceType: number = config.tts.defaultVoiceType,
    sampleRate: number = config.tts.defaultSampleRate,
    codec: string = config.tts.defaultCodec
  ): Promise<{ audioData: string; cached: boolean }> {
    try {
      // 首先检查缓存
      const cachedAudio = await this.cacheManager.get(text, voiceType, sampleRate, codec);
      if (cachedAudio) {
        console.log('使用缓存音频');
        return { audioData: cachedAudio, cached: true };
      }

      // 如果没有缓存，则调用腾讯云TTS
      console.log('调用腾讯云TTS服务');
      const params: TextToVoiceRequest = {
        Text: text,
        SessionId: this.generateSessionId(),
        VoiceType: voiceType,
        SampleRate: sampleRate,
        Codec: codec,
      };

    console.log('发送到腾讯云TTS的参数:', params);
    const response = await this.client.TextToVoice(params);
    console.log('腾讯云TTS返回的数据:', response);
      
      if (!response.Audio) {
        throw new Error('TTS服务返回空音频数据');
      }

      const audioData = response.Audio;
      
      // 保存到缓存
      await this.cacheManager.set(text, voiceType, sampleRate, codec, audioData);
      
      console.log('TTS转换完成并已缓存');
      return { audioData, cached: false };
    } catch (error) {
      console.error('TTS服务错误:', error);
      throw error;
    }
  }

  private generateSessionId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  }

  async getCacheInfo() {
    return await this.cacheManager.getCacheInfo();
  }

  async clearCache() {
    return await this.cacheManager.clear();
  }

  // 获取支持的音色列表
  getSupportedVoices() {
    return [
      { id: 0, name: '云小宁', gender: '女', language: '中文' },
      { id: 1, name: '云小奇', gender: '男', language: '中文' },
      { id: 2, name: '云小晚', gender: '女', language: '中文' },
      { id: 4, name: '云小叶', gender: '女', language: '中文' },
      { id: 5, name: '云小欣', gender: '女', language: '中文' },
      { id: 6, name: '云小龙', gender: '男', language: '中文' },
      { id: 7, name: '云小曼', gender: '女', language: '中文' },
      { id: 1001, name: '智逍遥', gender: '男', language: '中文' },
      { id: 1002, name: '智聆', gender: '女', language: '中文' },
      { id: 1003, name: '智美', gender: '女', language: '中文' },
      { id: 1050, name: 'WeJack', gender: '男', language: '英文' },
      { id: 1051, name: 'WeRose', gender: '女', language: '英文' }
    ];
  }
}
