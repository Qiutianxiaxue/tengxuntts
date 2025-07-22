# 腾讯云TTS服务API

这是一个基于 Node.js 和 TypeScript 开发的腾讯云文本转语音（TTS）服务API，支持本地缓存功能。

## 功能特性

- 🎯 **文本转语音**: 支持中英文文本转换为语音
- 💾 **本地缓存**: 自动缓存生成的语音文件，相同文本直接返回缓存
- 🎵 **多种音色**: 支持多种音色选择
- 🔧 **灵活配置**: 支持采样率、编码格式等参数配置
- 📊 **缓存管理**: 提供缓存信息查询和清理功能
- 🔍 **健康检查**: 提供服务状态监控接口
- 🌐 **RESTful API**: 标准的REST API设计

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并填入您的腾讯云密钥：

```bash
# 腾讯云配置
TENCENT_SECRET_ID=your_secret_id_here
TENCENT_SECRET_KEY=your_secret_key_here

# 服务器配置
PORT=3000
NODE_ENV=development

# 缓存配置
CACHE_DIR=./cache
CACHE_ENABLED=true

# TTS配置
DEFAULT_VOICE_TYPE=0
DEFAULT_SAMPLE_RATE=16000
DEFAULT_CODEC=wav
```

### 3. 获取腾讯云密钥

1. 访问 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 **访问管理** > **API密钥管理**
3. 创建新的密钥或使用现有密钥
4. 将 `SecretId` 和 `SecretKey` 填入 `.env` 文件

### 4. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

监听模式（文件变化自动重启）：
```bash
npm run watch
```

## API接口文档

### 基础信息

- **服务地址**: `http://localhost:3000`
- **API前缀**: `/api`

### 接口列表

#### 1. 文本转语音 (推荐)

**POST** `/api/tts`

请求体：
```json
{
  "text": "你好，这是一个测试文本",
  "voiceType": 0,
  "sampleRate": 16000,
  "codec": "wav"
}
```

参数说明：
- `text` (必填): 要转换的文本，最大长度2000字符
- `voiceType` (可选): 音色ID，默认0
- `sampleRate` (可选): 采样率，默认16000
- `codec` (可选): 编码格式，默认wav

响应：
```json
{
  "success": true,
  "data": {
    "audioBase64": "base64编码的音频数据",
    "cached": false
  }
}
```

#### 2. 文本转语音 (GET方式)

**GET** `/api/tts?text=你好`

查询参数：
- `text`: 要转换的文本
- `voiceType`: 音色ID
- `sampleRate`: 采样率
- `codec`: 编码格式

#### 3. 获取音色列表

**GET** `/api/voices`

响应：
```json
{
  "success": true,
  "data": [
    {
      "id": 0,
      "name": "云小宁",
      "gender": "女",
      "language": "中文"
    }
  ]
}
```

#### 4. 获取缓存信息

**GET** `/api/cache/info`

响应：
```json
{
  "success": true,
  "data": {
    "count": 10,
    "size": "5.2 MB"
  }
}
```

#### 5. 清理缓存

**DELETE** `/api/cache`

响应：
```json
{
  "success": true,
  "data": {
    "message": "缓存清理完成"
  }
}
```

#### 6. 健康检查

**GET** `/api/health`

响应：
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0"
  }
}
```

## 支持的音色

| ID | 名称 | 性别 | 语言 |
|----|------|------|------|
| 0 | 云小宁 | 女 | 中文 |
| 1 | 云小奇 | 男 | 中文 |
| 2 | 云小晚 | 女 | 中文 |
| 4 | 云小叶 | 女 | 中文 |
| 5 | 云小欣 | 女 | 中文 |
| 6 | 云小龙 | 男 | 中文 |
| 7 | 云小曼 | 女 | 中文 |
| 1001 | 智逍遥 | 男 | 中文 |
| 1002 | 智聆 | 女 | 中文 |
| 1003 | 智美 | 女 | 中文 |
| 1050 | WeJack | 男 | 英文 |
| 1051 | WeRose | 女 | 英文 |

## 使用示例

### Node.js/JavaScript 调用示例

```javascript
const axios = require('axios');

async function textToSpeech(text) {
  try {
    const response = await axios.post('http://localhost:3000/api/tts', {
      text: text,
      voiceType: 0,
      sampleRate: 16000,
      codec: 'wav'
    });
    
    if (response.data.success) {
      const audioBase64 = response.data.data.audioBase64;
      const isFromCache = response.data.data.cached;
      
      console.log('转换成功！');
      console.log('是否来自缓存:', isFromCache);
      
      // 将Base64转为音频文件
      const fs = require('fs');
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      fs.writeFileSync('output.wav', audioBuffer);
      
      return audioBase64;
    }
  } catch (error) {
    console.error('调用失败:', error.response?.data || error.message);
  }
}

// 使用示例
textToSpeech('你好，欢迎使用腾讯云TTS服务！');
```

### Python 调用示例

```python
import requests
import base64

def text_to_speech(text):
    url = 'http://localhost:3000/api/tts'
    data = {
        'text': text,
        'voiceType': 0,
        'sampleRate': 16000,
        'codec': 'wav'
    }
    
    try:
        response = requests.post(url, json=data)
        result = response.json()
        
        if result['success']:
            audio_base64 = result['data']['audioBase64']
            is_cached = result['data']['cached']
            
            print(f'转换成功！是否来自缓存: {is_cached}')
            
            # 保存音频文件
            audio_data = base64.b64decode(audio_base64)
            with open('output.wav', 'wb') as f:
                f.write(audio_data)
                
            return audio_base64
        else:
            print(f'转换失败: {result["error"]}')
            
    except Exception as e:
        print(f'请求失败: {e}')

# 使用示例
text_to_speech('你好，欢迎使用腾讯云TTS服务！')
```

### cURL 调用示例

```bash
# POST 方式
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，欢迎使用腾讯云TTS服务！",
    "voiceType": 0,
    "sampleRate": 16000,
    "codec": "wav"
  }'

# GET 方式
curl "http://localhost:3000/api/tts?text=你好世界&voiceType=0"

# 获取音色列表
curl http://localhost:3000/api/voices

# 获取缓存信息
curl http://localhost:3000/api/cache/info

# 清理缓存
curl -X DELETE http://localhost:3000/api/cache
```

## 项目结构

```
tengxuntts/
├── src/
│   ├── config/           # 配置文件
│   ├── controllers/      # 控制器
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑服务
│   ├── types/           # TypeScript 类型定义
│   └── app.ts           # 主应用入口
├── cache/               # 缓存目录
├── dist/                # 编译后的 JavaScript 文件
├── .env                 # 环境变量配置
├── .gitignore          # Git 忽略文件
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript 配置
└── README.md           # 项目说明
```

## 配置说明

### 环境变量

- `TENCENT_SECRET_ID`: 腾讯云 SecretId
- `TENCENT_SECRET_KEY`: 腾讯云 SecretKey
- `PORT`: 服务端口，默认3000
- `NODE_ENV`: 运行环境，development/production
- `CACHE_DIR`: 缓存目录路径
- `CACHE_ENABLED`: 是否启用缓存，true/false
- `DEFAULT_VOICE_TYPE`: 默认音色ID
- `DEFAULT_SAMPLE_RATE`: 默认采样率
- `DEFAULT_CODEC`: 默认编码格式

### 缓存机制

- 缓存基于文本内容、音色、采样率、编码格式的组合生成MD5哈希
- 缓存文件存储在配置的缓存目录中
- 支持查询缓存统计信息和手动清理缓存

## 故障排除

### 常见问题

1. **启动失败**: 检查端口是否被占用
2. **TTS调用失败**: 验证腾讯云密钥是否正确
3. **缓存问题**: 检查缓存目录权限
4. **依赖安装失败**: 尝试清理 node_modules 重新安装

### 日志查看

服务运行时会在控制台输出详细日志，包括：
- API请求日志
- TTS调用状态
- 缓存操作信息
- 错误信息

## 开发说明

### 脚本命令

- `npm run build`: 编译 TypeScript 代码
- `npm start`: 启动生产环境服务
- `npm run dev`: 启动开发环境服务
- `npm run watch`: 启动监听模式（文件变化自动重启）

### 技术栈

- **Node.js**: JavaScript 运行时
- **TypeScript**: 类型安全的 JavaScript
- **Express**: Web 应用框架
- **腾讯云SDK**: TTS服务调用
- **fs-extra**: 文件系统操作
- **其他**: CORS、Helmet、dotenv 等

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 联系方式

如有问题，请通过 GitHub Issues 联系。
