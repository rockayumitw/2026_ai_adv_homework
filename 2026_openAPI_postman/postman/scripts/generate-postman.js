// 由 openapi.json 生成 Postman Collection（v2.1）。
// 教學重點：
//   - Collection 不是手刻，而是從「同一份 openapi.json」轉出來的 → 與 API、Swagger 文件同源、不 drift。
//   - request 範例 body、範例回應、依 Tag 分資料夾、bearer 認證，全部來自 OpenAPI 規格本身。
const fs = require('fs');
const path = require('path');
const Converter = require('openapi-to-postmanv2');

const INPUT = path.join(__dirname, '..', 'openapi.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'postman');
const OUTPUT = path.join(OUTPUT_DIR, 'collection.json');

const options = {
  folderStrategy: 'Tags', // 依 OpenAPI tag 分資料夾（Auth、Todos）
  requestParametersResolution: 'Example', // 用 schema 的 example 產生 request 內容
  exampleParametersResolution: 'Example', // 用 example 產生範例回應
};

// 走訪 collection 樹裡的每個 request（略過資料夾本身）。
function forEachRequest(items, fn) {
  for (const it of items) {
    if (it.item) forEachRequest(it.item, fn);
    else if (it.request) fn(it);
  }
}

// 把生成的 collection 串接環境變數。
// 教學重點：
//   - 登入 request 的 body 改用 {{email}} / {{password}}，帳密交給 environment 管理（不寫死在 collection）。
//   - baseUrl 已是 {{baseUrl}}、protected 端點已帶 bearer {{bearerToken}}（皆由 OpenAPI security 自動產生），故不需再動。
//   - 因為 collection 每次都會重新生成，這類串接必須寫在腳本裡才可重現；手動改 collection.json 會被覆蓋。
function wireEnvironmentVariables(collection) {
  forEachRequest(collection.item, (item) => {
    const pathArr = item.request.url?.path || [];
    const isLogin =
      item.request.method === 'POST' && pathArr.join('/') === 'api/auth/login';
    if (isLogin && item.request.body?.mode === 'raw') {
      item.request.body.raw = JSON.stringify(
        { email: '{{email}}', password: '{{password}}' },
        null,
        2
      );
    }
  });
}

// openapi-to-postmanv2 是 callback 介面，包成 Promise 方便 async/await。
function convert(openapiString) {
  return new Promise((resolve, reject) => {
    Converter.convert(
      { type: 'string', data: openapiString },
      options,
      (err, result) => {
        if (err) return reject(err);
        if (!result.result) return reject(new Error(result.reason || '轉換失敗'));
        return resolve(result.output[0].data);
      }
    );
  });
}

async function main() {
  const openapiString = fs.readFileSync(INPUT, 'utf8');
  const collection = await convert(openapiString);

  // 串接環境變數（登入 body 改用 {{email}}/{{password}}）。
  wireEnvironmentVariables(collection);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');

  console.log(`✅ 已生成 Postman Collection：${path.relative(process.cwd(), OUTPUT)}`);
  console.log(`   集合名稱：${collection.info.name}`);
}

main().catch((err) => {
  console.error('❌ 生成 Postman Collection 失敗：', err.message);
  process.exit(1);
});
