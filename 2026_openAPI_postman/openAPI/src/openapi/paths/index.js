// 端點註冊入口：require 此檔即會把所有路由註冊進 registry。
// 各資源的端點定義放在同目錄下，在此集中載入（載入時自我註冊）。
require('./auth.paths');
require('./todo.paths');

module.exports = {};
