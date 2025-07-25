import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import routes from './routes';

const app: Express = express();

// 中间件配置
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API路由
app.use('/api', routes);

// 根路径返回API信息
app.get('/', (req, res) => {
  res.json({
    name: '腾讯云TTS服务API',
    version: '1.0.0',
    description: '提供文本转语音服务，支持本地缓存',
    endpoints: {
      'POST /api/tts': '文本转语音（推荐）',
      'GET /api/tts?text=xxx': '文本转语音（GET方式）',
      'GET /api/cache/:filename': '获取缓存的音频文件',
      'GET /api/voices': '获取支持的音色列表',
      'GET /api/cache/info': '获取缓存信息',
      'DELETE /api/cache': '清理缓存',
      'GET /api/health': '健康检查'
    },
    usage: {
      'POST /api/tts': {
        body: {
          text: '要转换的文本（必填）',
          voiceType: '音色ID（可选，默认301023，支持：301023, 301030, 101040, 101019）',
          sampleRate: '采样率（可选，默认16000）',
          codec: '编码格式（可选，默认wav）'
        }
      }
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

// 全局错误处理
app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: config.server.nodeEnv === 'development' ? error.message : '服务器内部错误'
  });
});

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`🚀 TTS服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📄 API文档: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`💾 缓存目录: ${config.cache.dir}`);
  console.log(`⚙️  环境: ${config.server.nodeEnv}`);
});

export default app;
