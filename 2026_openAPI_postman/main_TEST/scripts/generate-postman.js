const fs = require('fs');
const path = require('path');
const Converter = require('openapi-to-postmanv2');

const INPUT = path.join(__dirname, '..', 'openapi.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'postman');
const OUTPUT = path.join(OUTPUT_DIR, 'collection.json');

const options = {
  folderStrategy: 'Tags',
  requestParametersResolution: 'Example',
  exampleParametersResolution: 'Example',
};

function forEachRequest(items, fn) {
  for (const it of items) {
    if (it.item) forEachRequest(it.item, fn);
    else if (it.request) fn(it);
  }
}

function wireEnvironmentVariables(collection) {
  forEachRequest(collection.item, (item) => {
    const pathArr = item.request.url?.path || [];
    const isLogin = item.request.method === 'POST' && pathArr.join('/') === 'api/auth/login';
    if (isLogin && item.request.body?.mode === 'raw') {
      item.request.body.raw = JSON.stringify({ email: '{{email}}', password: '{{password}}' }, null, 2);
    }
  });
}

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

  wireEnvironmentVariables(collection);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');
  console.log(`✅ 已生成 Postman Collection：postman/collection.json`);
  console.log(`   集合名稱：${collection.info.name}`);
}

main().catch((err) => {
  console.error('❌ 生成 Postman Collection 失敗：', err.message);
  process.exit(1);
});
