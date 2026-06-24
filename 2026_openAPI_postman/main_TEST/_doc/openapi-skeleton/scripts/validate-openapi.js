// 【直接複製，不需要修改】
// 只驗證現有的 openapi.json，不重新生成。
// 適合在 CI/CD pipeline 中使用（不需要啟動整個 app）。
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');

const FILE = path.join(__dirname, '..', 'openapi.json');

SwaggerParser.validate(FILE)
  .then(() => console.log('✅ openapi.json 驗證通過'))
  .catch((err) => {
    console.error('❌ 驗證失敗：', err.message);
    process.exit(1);
  });
