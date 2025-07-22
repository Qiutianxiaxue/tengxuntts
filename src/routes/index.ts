import { Router } from 'express';
import { TTSController } from '../controllers/ttsController';

const router = Router();
const ttsController = new TTSController();

// TTS相关路由
router.post('/tts', ttsController.textToSpeech.bind(ttsController));
router.get('/tts', ttsController.textToSpeechGet.bind(ttsController));

// 音色列表
router.get('/voices', ttsController.getVoices.bind(ttsController));

// 缓存管理
router.get('/cache/info', ttsController.getCacheInfo.bind(ttsController));
router.delete('/cache', ttsController.clearCache.bind(ttsController));

// 健康检查
router.get('/health', ttsController.health.bind(ttsController));

export default router;
