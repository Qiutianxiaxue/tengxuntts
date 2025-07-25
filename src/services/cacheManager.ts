import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';

export class CacheManager {
  private cacheDir: string;

  constructor() {
    this.cacheDir = config.cache.dir;
    this.ensureCacheDirectory();
  }

  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private generateHash(text: string, voiceType: number, sampleRate: number, codec: string, EmotionCategory: string): string {
    const data = `${text}_${voiceType}_${sampleRate}_${codec}_${EmotionCategory}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  private getCacheFilePath(hash: string, codec: string): string {
    return path.join(this.cacheDir, `${hash}.${codec}`);
  }

  async get(text: string, voiceType: number, sampleRate: number, codec: string, EmotionCategory: string): Promise<string | null> {
    if (!config.cache.enabled) {
      return null;
    }

    try {
      const hash = this.generateHash(text, voiceType, sampleRate, codec, EmotionCategory);
      console.log(`尝试从缓存中获取音频: ${hash}`);
      const cacheFilePath = this.getCacheFilePath(hash, codec);
      console.log(`cacheFilePath: ${cacheFilePath}`);

      if (!fs.existsSync(cacheFilePath)) {
        return null;
      }

      // 返回相对于cache目录的文件路径，用于生成URL
      return `${hash}.${codec}`;
    } catch (error) {
      console.error('读取缓存失败:', error);
      return null;
    }
  }

  async set(text: string, voiceType: number, sampleRate: number, codec: string, EmotionCategory: string, audioData: string): Promise<string> {
    if (!config.cache.enabled) {
      return '';
    }

    try {
      const hash = this.generateHash(text, voiceType, sampleRate, codec, EmotionCategory);
      const cacheFilePath = this.getCacheFilePath(hash, codec);

      // 将base64音频数据直接写入文件
      const audioBuffer = Buffer.from(audioData, 'base64');
      await fs.writeFile(cacheFilePath, audioBuffer);
      
      console.log(`音频文件已缓存: ${cacheFilePath}`);
      return `${hash}.${codec}`;
    } catch (error) {
      console.error('写入缓存失败:', error);
      return '';
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.emptyDir(this.cacheDir);
      console.log('缓存清理完成');
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  async getCacheInfo(): Promise<{ count: number; size: string }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      // 排除JSON文件，只统计音频文件
      const audioFiles = files.filter(file => 
        file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.pcm')
      );
      
      let totalSize = 0;
      for (const file of audioFiles) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      return {
        count: audioFiles.length,
        size: `${sizeInMB} MB`
      };
    } catch (error) {
      console.error('获取缓存信息失败:', error);
      return { count: 0, size: '0 MB' };
    }
  }

  // 获取音频文件的完整路径
  getAudioFilePath(filename: string): string {
    return path.join(this.cacheDir, filename);
  }
}
