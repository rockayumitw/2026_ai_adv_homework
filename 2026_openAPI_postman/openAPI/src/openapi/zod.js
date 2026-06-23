// 共用的 zod 實例。
// 教學重點：
//   - 整個專案只在這裡用 extendZodWithOpenApi() 擴充 zod 一次，
//     讓所有 schema 都能用 .openapi() 標註（範例值、元件名稱…）。
//   - 其餘檔案一律從這裡 require { z }，確保 .openapi() 到處可用、且只擴充一次。
const { z } = require('zod');
const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');

extendZodWithOpenApi(z);

module.exports = { z };
