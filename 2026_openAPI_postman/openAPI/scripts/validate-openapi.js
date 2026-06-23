// 獨立驗證已產出的 openapi.json 是否為合法的 OpenAPI 文件。
// 教學重點：可在 CI 或交付前單獨驗證「版控裡的規格檔」，與產生流程解耦。
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');

const OUTPUT = path.join(__dirname, '..', 'openapi.json');

SwaggerParser.validate(OUTPUT)
  .then((api) => {
    console.log(`✅ openapi.json 合法：${api.info.title} v${api.info.version}`);
    console.log(`   路徑數：${Object.keys(api.paths).length}`);
  })
  .catch((err) => {
    console.error('❌ openapi.json 驗證失敗：', err.message);
    process.exit(1);
  });
