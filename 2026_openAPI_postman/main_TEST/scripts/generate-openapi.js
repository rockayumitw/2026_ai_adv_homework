// 【直接複製，不需要修改】
// 把 OpenAPI 規格輸出成實體檔案 openapi.json。
// 驗證失敗會 exit(1)，確保版控裡的 openapi.json 永遠是合法規格。
const fs = require("fs");
const path = require("path");
const SwaggerParser = require("@apidevtools/swagger-parser");
const { buildOpenApiDocument } = require("../src/openapi/document");

const OUTPUT = path.join(__dirname, "..", "openapi.json");

async function main() {
  const doc = buildOpenApiDocument();

  // structuredClone 避免 validate() 的 dereference 把 $ref 展開，影響輸出檔的結構
  await SwaggerParser.validate(structuredClone(doc));

  fs.writeFileSync(OUTPUT, `${JSON.stringify(doc, null, 2)}\n`, "utf8");

  const pathCount = Object.keys(doc.paths || {}).length;
  const schemaCount = Object.keys(doc.components?.schemas || {}).length;
  console.log(
    `✅ 規格驗證通過並已輸出：${path.relative(process.cwd(), OUTPUT)}`
  );
  console.log(`   路徑數：${pathCount}，元件 schema 數：${schemaCount}`);
}

main().catch((err) => {
  console.error("❌ OpenAPI 規格驗證失敗：", err.message);
  process.exit(1);
});
