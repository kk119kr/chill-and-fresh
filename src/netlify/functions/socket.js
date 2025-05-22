// src/netlify/functions/socket.js
const { Server } = require("socket.io");
const { createServer } = require("http");
exports.handler = async function(event, context) {
  if (!context.clientContext) return { statusCode: 500 };
  
  // Netlify Functions에서는 HTTP 서버를 직접 가져와야 합니다
  const server = createServer((req, res) => res.end());
  const io = new Server(server, {
    path: "/socket.io/",
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("New socket:", socket.id);
    // …이벤트 핸들러 등록…
  });

  // Functions가 종료되지 않게
  context.callbackWaitsForEmptyEventLoop = false;

  return {
    statusCode: 200,
    body: "",
    // raw HTTP server 로 업그레이드
    isBase64Encoded: false,
  };
};
