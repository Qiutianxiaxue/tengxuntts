import { Request, Response } from "express";
import { TTSService } from "../services/ttsService";
import { TTSRequest, TTSResponse } from "../types";

export class TTSController {
  private ttsService: TTSService;

  constructor() {
    this.ttsService = new TTSService();
  }

  // 文本转语音接口
  async textToSpeech(req: Request, res: Response): Promise<void> {
    try {
      const { text, voiceType, sampleRate, codec }: TTSRequest = req.body;

      if (!text || typeof text !== "string" || text.trim() === "") {
        res.status(400).json({
          code: 0,
          message: "文本内容不能为空",
        } as TTSResponse);
        return;
      }
      const supportedVoices = this.ttsService.getSupportedVoices();
      if (
        voiceType !== undefined &&
        !supportedVoices.some((voice) => voice.id === voiceType)
      ) {
        res.status(400).json({
          code: 0,
          message: "无效的音色类型",
        } as TTSResponse);
        return;
      }

      if (text.length > 150) {
        res.status(400).json({
          code: 0,
          message: "文本长度不能超过150个字符",
        } as TTSResponse);
        return;
      }

      const result = await this.ttsService.textToSpeech(
        text.trim(),
        voiceType,
        sampleRate,
        codec
      );

      res.json({
        code: 1,
        data: {
          voiceType,
          sampleRate,
          audioBase64: result.audioData,
          cached: result.cached,
        },
      } as TTSResponse);
    } catch (error) {
      console.error("TTS转换失败:", error);
      res.status(500).json({
        code: 0,
        message: error instanceof Error ? error.message : "服务器内部错误",
      } as TTSResponse);
    }
  }

  // GET方式的简单接口 - 直接返回音频二进制数据
  async textToSpeechGet(req: Request, res: Response): Promise<void> {
    try {
      const text = req.query.text as string;
      const voiceType = req.query.voiceType
        ? parseInt(req.query.voiceType as string)
        : undefined;
      const sampleRate = req.query.sampleRate
        ? parseInt(req.query.sampleRate as string)
        : undefined;
      const codec = req.query.codec as string || 'wav';

      if (!text || typeof text !== "string" || text.trim() === "") {
        res.status(400).json({
          code: 0,
          message: "文本内容不能为空",
        });
        return;
      }

      if (text.length > 150) {
        res.status(400).json({
          code: 0,
          message: "文本长度不能超过150个字符",
        });
        return;
      }

      const result = await this.ttsService.textToSpeech(
        text.trim(),
        voiceType,
        sampleRate,
        codec,
        'neutral'
      );

      // 将Base64转换为二进制数据
      const audioBuffer = Buffer.from(result.audioData, 'base64');
      
      // 设置响应头
      const mimeType = this.getMimeType(codec);
      res.set({
        'Content-Type': mimeType,
        'Content-Length': audioBuffer.length.toString(),
        'Content-Disposition': `inline; filename="tts_audio.${codec}"`,
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
        'X-Voice-Type': result.voiceType,
        'X-Sample-Rate': result.sampleRate,
        'X-EmotionCategory': result.EmotionCategory,
        'X-Cached': result.cached, // 标识是否来自缓存
      });

      // 直接发送二进制音频数据
      res.send(audioBuffer);
      
    } catch (error) {
      console.error("TTS转换失败:", error);
      res.status(500).json({
        code: 0,
        message: error instanceof Error ? error.message : "服务器内部错误",
      });
    }
  }

  // 获取音频文件的MIME类型
  private getMimeType(codec: string): string {
    const mimeTypes: { [key: string]: string } = {
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'pcm': 'audio/pcm',
    };
    return mimeTypes[codec.toLowerCase()] || 'audio/wav';
  }

  // 获取支持的音色列表
  async getVoices(req: Request, res: Response): Promise<void> {
    try {
      const voices = this.ttsService.getSupportedVoices();
      res.json({
        success: true,
        data: voices,
      });
    } catch (error) {
      console.error("获取音色列表失败:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "服务器内部错误",
      });
    }
  }

  // 获取缓存信息
  async getCacheInfo(req: Request, res: Response): Promise<void> {
    try {
      const cacheInfo = await this.ttsService.getCacheInfo();
      res.json({
        success: true,
        data: cacheInfo,
      });
    } catch (error) {
      console.error("获取缓存信息失败:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "服务器内部错误",
      });
    }
  }

  // 清理缓存
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      await this.ttsService.clearCache();
      res.json({
        success: true,
        data: { message: "缓存清理完成" },
      });
    } catch (error) {
      console.error("清理缓存失败:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "服务器内部错误",
      });
    }
  }

  // 健康检查
  async health(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    });
  }
}
