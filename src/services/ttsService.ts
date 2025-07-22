import { Client } from "tencentcloud-sdk-nodejs-tts/tencentcloud/services/tts/v20190823/tts_client";
import { TextToVoiceRequest } from "tencentcloud-sdk-nodejs-tts/tencentcloud/services/tts/v20190823/tts_models";
import { config } from "../config";
import { CacheManager } from "./cacheManager";

export class TTSService {
  private client: Client;
  private cacheManager: CacheManager;

  constructor() {
    this.client = new Client({
      credential: {
        secretId: config.tencent.secretId,
        secretKey: config.tencent.secretKey,
      },
      region: "ap-beijing",
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
      const cachedAudio = await this.cacheManager.get(
        text,
        voiceType,
        sampleRate,
        codec
      );
      if (cachedAudio) {
        console.log("使用缓存音频");
        return { audioData: cachedAudio, cached: true };
      }

      // 如果没有缓存，则调用腾讯云TTS
      console.log("调用腾讯云TTS服务");
      const params: TextToVoiceRequest = {
        Text: text,
        SessionId: this.generateSessionId(),
        VoiceType: voiceType,
        SampleRate: sampleRate,
        Codec: codec,
      };

      const response = await this.client.TextToVoice(params);

      if (!response.Audio) {
        throw new Error("TTS服务返回空音频数据");
      }

      const audioData = response.Audio;

      // 保存到缓存
      await this.cacheManager.set(
        text,
        voiceType,
        sampleRate,
        codec,
        audioData
      );

      console.log("TTS转换完成并已缓存");
      return { audioData, cached: false };
    } catch (error) {
      console.error("TTS服务错误:", error);
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
      {
        id: 301030,
        name: "爱小溪",
        gender: "女",
        language: "中文",
        remarks: "标准女生",
      },
      {
        id: 101040,
        name: "智川",
        gender: "女",
        language: "中文",
        remarks: "四川女声",
      },
      {
        id: 101019,
        name: "智彤",
        gender: "女",
        language: "中文",
        remarks: "粤语女声",
      },
    ];
  }
}
