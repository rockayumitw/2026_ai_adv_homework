// 由 openapi.json 生成 Postman Collection（v2.1）。
// 教學重點：
//   - Collection 不是手刻，而是從「同一份 openapi.json」轉出來的 → 與 API、Swagger 文件同源、不 drift。
//   - request 範例 body、範例回應、依 Tag 分資料夾、bearer 認證，全部來自 OpenAPI 規格本身。
//   - 進一步把整份 collection 變成「可在 Collection Runner 一鍵跑完」的測試流程：
//       每支 request 自動掛上 test（斷言成功狀態碼 + 回應必要欄位，皆取自 OpenAPI），
//       並把登入 token、新建 todo 的 id 串接成環境變數，讓後續 request 接得上。
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

// 從 openapi.json 建立「METHOD 路徑 → 成功狀態碼 / 回應必要欄位」對照表。
// 教學重點：test 要斷言什麼，由 OpenAPI 規格決定 → API 一改、重新生成即同步，不會 drift。
//   - OpenAPI 路徑 /api/todos/{id} 正規化成 Postman 的路徑鍵 api/todos/:id 以利對應。
//   - required 欄位順著 $ref 解析到實際 schema 取得。
function buildSpecIndex(openapi) {
  const requiredOf = (schema) => {
    if (!schema) return [];
    if (schema.$ref) {
      const name = schema.$ref.split('/').pop();
      return requiredOf(openapi.components.schemas[name]);
    }
    return schema.required || [];
  };

  const index = {};
  for (const [p, ops] of Object.entries(openapi.paths)) {
    const pathKey = p.replace(/^\//, '').replace(/\{(\w+)\}/g, ':$1');
    for (const [method, op] of Object.entries(ops)) {
      const successCode = Object.keys(op.responses || {}).find((c) => /^2/.test(c));
      const schema = op.responses?.[successCode]?.content?.['application/json']?.schema;
      index[`${method.toUpperCase()} ${pathKey}`] = {
        successCode: Number(successCode),
        required: requiredOf(schema),
      };
    }
  }
  return index;
}

// 依 OpenAPI spec 產生「斷言成功狀態碼 + 回應必要欄位」的 test 程式碼（逐行字串陣列）。
function buildBaseTest(spec) {
  const lines = [
    `// 斷言取自 OpenAPI：預期狀態 ${spec.successCode}` +
      (spec.required.length ? `、必要欄位 ${spec.required.join('、')}。` : '（此端點無回應主體）。'),
    `pm.test("狀態碼 ${spec.successCode}", function () {`,
    `  pm.response.to.have.status(${spec.successCode});`,
    '});',
  ];
  if (spec.required.length) {
    lines.push('', 'pm.test("回應含必要欄位", function () {', '  const json = pm.response.json();');
    for (const field of spec.required) {
      lines.push(`  pm.expect(json).to.have.property("${field}");`);
    }
    lines.push('});');
  }
  return lines;
}

// 串接用的程式碼片段（會被插在 test 開頭，先存值再斷言）。
const LOGIN_CAPTURE = [
  '// 登入成功就把 token 存進環境變數 bearerToken，後續受保護端點的 Bearer 會自動帶上。',
  'if (pm.response.code === 200) {',
  '  pm.environment.set("bearerToken", pm.response.json().token);',
  '}',
  '',
];
const CREATE_TODO_CAPTURE = [
  '// 建立成功就把新 todo 的 id 存進 todoId，供「取得 / 更新 / 刪除 /:id」串接使用。',
  'if (pm.response.code === 201) {',
  '  pm.environment.set("todoId", pm.response.json().todo.id);',
  '}',
  '',
];
// 註冊的 pre-request：動態產生唯一 email，讓「註冊」可重複執行而不撞已存在的帳號
// （種子帳號 {{email}} 已被 seed 佔用，固定 email 會回 409）。
const REGISTER_PREREQUEST = [
  '// 每次執行都用不同 email，確保註冊穩定回 201、可重複跑。',
  'pm.variables.set("registerEmail", "user_" + Date.now() + "@example.com");',
];

// 設定某 request 的 event（先移除同類型既有的，避免與 converter 產生的空 event 重複）。
function setEvent(item, listen, execLines) {
  item.event = (item.event || []).filter((e) => e.listen !== listen);
  item.event.push({ listen, script: { type: 'text/javascript', exec: execLines } });
}

// 把生成的 collection 串接成「可一鍵跑完」的測試流程。
// 教學重點：
//   - 帳密 / 動態 email 交給變數與 pre-request，不寫死在 collection。
//   - 每支 request 依 OpenAPI 掛 test；登入存 token、建立 todo 存 id，讓 Runner 一路跑得通。
//   - 因為 collection 每次重新生成，這些串接必須寫在腳本裡才可重現；手改 collection.json 會被覆蓋。
function wireCollection(collection, specIndex) {
  forEachRequest(collection.item, (item) => {
    const method = item.request.method;
    const pathKey = (item.request.url?.path || []).join('/');
    const spec = specIndex[`${method} ${pathKey}`];
    if (!spec) return; // 沒有對應 spec 的不動（理論上不會發生）

    const isLogin = method === 'POST' && pathKey === 'api/auth/login';
    const isRegister = method === 'POST' && pathKey === 'api/auth/register';
    const isCreateTodo = method === 'POST' && pathKey === 'api/todos';
    const usesTodoId = pathKey === 'api/todos/:id';

    // 登入 body 改用 {{email}} / {{password}}。
    if (isLogin && item.request.body?.mode === 'raw') {
      item.request.body.raw = JSON.stringify({ email: '{{email}}', password: '{{password}}' }, null, 2);
    }

    // 註冊 body 改用動態 {{registerEmail}}，並掛上產生它的 pre-request。
    if (isRegister && item.request.body?.mode === 'raw') {
      item.request.body.raw = JSON.stringify(
        { name: 'Demo User', email: '{{registerEmail}}', password: '{{password}}' },
        null,
        2
      );
      setEvent(item, 'prerequest', REGISTER_PREREQUEST);
    }

    // /:id 路徑變數改用 {{todoId}}，接上「建立 todo」存下的 id。
    if (usesTodoId) {
      for (const v of item.request.url.variable || []) {
        if (v.key === 'id') v.value = '{{todoId}}';
      }
    }

    // 組 test：（可選的串接 capture）+ 來自 OpenAPI 的斷言。
    const exec = [];
    if (isLogin) exec.push(...LOGIN_CAPTURE);
    if (isCreateTodo) exec.push(...CREATE_TODO_CAPTURE);
    exec.push(...buildBaseTest(spec));
    setEvent(item, 'test', exec);
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
  const specIndex = buildSpecIndex(JSON.parse(openapiString));
  const collection = await convert(openapiString);

  // 串接變數、掛上 test，讓整份 collection 可在 Collection Runner 一鍵跑完。
  wireCollection(collection, specIndex);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');

  console.log(`✅ 已生成 Postman Collection：${path.relative(process.cwd(), OUTPUT)}`);
  console.log(`   集合名稱：${collection.info.name}`);
}

main().catch((err) => {
  console.error('❌ 生成 Postman Collection 失敗：', err.message);
  process.exit(1);
});
