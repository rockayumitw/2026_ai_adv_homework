// 【直接複製，不需要修改】
// 這個檔案只做一件事：讓 zod 的所有型別支援 .openapi() 方法。
// schemas 都從這裡 require z，不從 'zod' 直接 require，
// 這樣不管是從 server.js 還是 scripts/ 跑，.openapi() 都一定可用。
const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
const { z } = require('zod');
extendZodWithOpenApi(z);
module.exports = { z };
