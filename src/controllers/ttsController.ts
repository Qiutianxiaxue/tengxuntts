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
        codec,
        "neutral"
      );

      res.json({
        code: 1,
        data: {
          voiceType,
          sampleRate,
          audioUrl: result.audioUrl,
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
      const codec = (req.query.codec as string) || "wav";

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
        "neutral"
      );
      console.log("TTS转换结果:", result.cached);

      let audioBuffer: Buffer;

      if (result.cached && result.audioUrl) {
        // 如果是缓存文件，从文件系统读取
        const filename = result.audioUrl.split('/').pop();
        if (filename) {
          const filePath = this.ttsService.getCachedAudioPath(filename);
          audioBuffer = require('fs').readFileSync(filePath);
        } else {
          throw new Error("无效的缓存文件路径");
        }
      } else {
        // 如果是新生成的，从base64转换
        audioBuffer = Buffer.from(result.audioData, "base64");
      }

      // 验证音频数据
      if (audioBuffer.length === 0) {
        throw new Error("音频数据为空");
      }

      // 检查MP3文件头（如果是MP3格式）
      if (codec.toLowerCase() === "mp3") {
        const mp3Header = audioBuffer.slice(0, 3);
        if (!this.isValidMp3Header(mp3Header)) {
          console.warn("警告: MP3文件头验证失败，可能影响播放");
        }
      }

      // 设置响应头
      const mimeType = this.getMimeType(codec);
      res.set({
        "Content-Type": mimeType,
        "Content-Length": audioBuffer.length.toString(),
        "Content-Disposition": `attachment; filename="tts_audio_${Date.now()}.${codec}"`,
        "Cache-Control": "public, max-age=360000", // 缓存1小时
        "Accept-Ranges": "bytes",
        "X-Voice-Type": result.voiceType?.toString() || "",
        "X-Sample-Rate": result.sampleRate?.toString() || "",
        "X-EmotionCategory": result.EmotionCategory || "",
        "X-Cached": result.cached?.toString() || "false", // 标识是否来自缓存
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
      wav: "audio/wav",
      mp3: "audio/mp3",
      pcm: "audio/pcm",
    };
    return mimeTypes[codec.toLowerCase()] || "audio/wav";
  }

  // 验证MP3文件头
  private isValidMp3Header(header: Buffer): boolean {
    if (header.length < 3) return false;
    // 检查MP3同步字节 (0xFF, 0xFB/0xFA/0xF3/0xF2)
    return header[0] === 0xff && (header[1] & 0xe0) === 0xe0;
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

  // 获取缓存的音频文件
  async getCachedAudio(req: Request, res: Response): Promise<void> {
    try {
      const filename = req.params.filename;
      
      if (!filename) {
        res.status(400).json({
          code: 0,
          message: "文件名不能为空",
        });
        return;
      }

      // 验证文件名格式（防止路径遍历攻击）
      if (!/^[a-f0-9]{32}\.(mp3|wav|pcm)$/i.test(filename)) {
        res.status(400).json({
          code: 0,
          message: "无效的文件名格式",
        });
        return;
      }

      const filePath = this.ttsService.getCachedAudioPath(filename);
      
      if (!require('fs').existsSync(filePath)) {
        res.status(404).json({
          code: 0,
          message: "音频文件不存在",
        });
        return;
      }

      // 获取文件扩展名来确定MIME类型
      const ext = filename.split('.').pop()?.toLowerCase();
      const mimeType = this.getMimeType(ext || 'wav');
      
      // 设置响应头
      res.set({
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400', // 缓存24小时
        'Accept-Ranges': 'bytes',
      });

      // 发送文件
      res.sendFile(filePath);
    } catch (error) {
      console.error('获取缓存音频失败:', error);
      res.status(500).json({
        code: 0,
        message: error instanceof Error ? error.message : "服务器内部错误",
      });
    }
  }
}
