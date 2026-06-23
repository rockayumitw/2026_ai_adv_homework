// 程式進入點：載入設定、寫入預設資料（seed）、啟動伺服器。

// 必須在所有 require 之前執行：為 Zod 加上 .openapi() 方法
const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
const { z } = require('zod');
extendZodWithOpenApi(z);

const config = require('./config');
const createApp = require('./app');
const seed = require('./data/seed');

// 寫入預設資料到記憶體（預設帳號 + 預設 todos）
seed();

const app = createApp();

app.listen(config.port, () => {
  console.log(`🚀 伺服器已啟動： http://localhost:${config.port}`);
  console.log(`📄 API 文件：      http://localhost:${config.port}/api-docs`);
  console.log(`   環境：${config.nodeEnv}`);
});
