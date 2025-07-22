import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';
import { CacheItem } from '../types';

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

  private generateHash(text: string, voiceType: number, sampleRate: number, codec: string): string {
    const data = `${text}_${voiceType}_${sampleRate}_${codec}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  private getCacheFilePath(hash: string): string {
    return path.join(this.cacheDir, `${hash}.json`);
  }

  async get(text: string, voiceType: number, sampleRate: number, codec: string): Promise<string | null> {
    if (!config.cache.enabled) {
      return null;
    }

    try {
      const hash = this.generateHash(text, voiceType, sampleRate, codec);
      const cacheFilePath = this.getCacheFilePath(hash);

      if (!fs.existsSync(cacheFilePath)) {
        return null;
      }

      const cacheItem: CacheItem = await fs.readJson(cacheFilePath);
      return cacheItem.audioData;
    } catch (error) {
      console.error('读取缓存失败:', error);
      return null;
    }
  }

  async set(text: string, voiceType: number, sampleRate: number, codec: string, audioData: string): Promise<void> {
    if (!config.cache.enabled) {
      return;
    }

    try {
      const hash = this.generateHash(text, voiceType, sampleRate, codec);
      const cacheFilePath = this.getCacheFilePath(hash);

      const cacheItem: CacheItem = {
        audioData,
        createdAt: new Date(),
        hash
      };

      await fs.writeJson(cacheFilePath, cacheItem);
    } catch (error) {
      console.error('写入缓存失败:', error);
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
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      let totalSize = 0;
      for (const file of jsonFiles) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      return {
        count: jsonFiles.length,
        size: `${sizeInMB} MB`
      };
    } catch (error) {
      console.error('获取缓存信息失败:', error);
      return { count: 0, size: '0 MB' };
    }
  }
}
