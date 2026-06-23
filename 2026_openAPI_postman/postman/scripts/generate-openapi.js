// 把 OpenAPI 規格輸出成實體檔案 openapi.json。
// 教學重點：
//   - /openapi.json 端點是「即時產生」給程式即時讀取；
//   - 這支腳本是把「同一份規格」輸出成檔案，方便交給 Postman、版控、CI 使用。
//   - 兩者都呼叫 buildOpenApiDocument()，來源相同、不會分歧。
//   - 輸出前先用 swagger-parser 驗證規格合法性，不合法就讓指令失敗（exit 1）。
const fs = require('fs');
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');
const { buildOpenApiDocument } = require('../src/openapi/document');

const OUTPUT = path.join(__dirname, '..', 'openapi.json');

async function main() {
  const doc = buildOpenApiDocument();

  // 驗證規格是否為合法的 OpenAPI 文件。
  // 注意：validate() 會 dereference（把 $ref 展開），故傳入 clone，避免影響輸出檔保留 $ref。
  await SwaggerParser.validate(structuredClone(doc));

  fs.writeFileSync(OUTPUT, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');

  const pathCount = Object.keys(doc.paths || {}).length;
  const schemaCount = Object.keys(doc.components?.schemas || {}).length;
  console.log(`✅ 規格驗證通過並已輸出：${path.relative(process.cwd(), OUTPUT)}`);
  console.log(`   路徑數：${pathCount}，元件 schema 數：${schemaCount}`);
}

main().catch((err) => {
  console.error('❌ OpenAPI 規格驗證失敗：', err.message);
  process.exit(1);
});
