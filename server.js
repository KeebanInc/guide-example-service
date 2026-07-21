'use strict';

const http = require('node:http');

const PORT = process.env.PORT || 8080;

// 다운스트림 인증에 쓰는 서비스 토큰의 수명(ms). 갱신된 토큰은 이만큼 유효해야 한다.
const TOKEN_TTL_MS = Number(process.env.SERVICE_TOKEN_TTL_MS) || 300000;
// 토큰이 발급된 시각(epoch ms). 배포 시 고정 시각을 주입할 수 있고, 주입이 없으면 부팅 시각을 쓴다.
const issuedAtEnv = Number(process.env.SERVICE_TOKEN_ISSUED_AT);
const TOKEN_ISSUED_AT = Number.isFinite(issuedAtEnv) && issuedAtEnv > 0 ? issuedAtEnv : Date.now();
// 백그라운드 하트비트/갱신 주기(ms).
const HEARTBEAT_INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS) || 5000;
const REFRESH_INTERVAL_MS = Number(process.env.TOKEN_REFRESH_INTERVAL_MS) || 60000;

// 새 서비스 토큰을 발급한다. 새 토큰은 발급 시점부터 TOKEN_TTL_MS 동안 유효하다.
function mintServiceToken() {
  const issuedAt = TOKEN_ISSUED_AT;
  return {
    value: `svc-${issuedAt}`,
    issuedAt,
    expiresAt: issuedAt + TOKEN_TTL_MS,
  };
}

// 다운스트림 호출에 사용할 현재 서비스 토큰. 만료 전에 주기적으로 갱신한다.
let serviceToken = mintServiceToken();

// 다운스트림 하트비트. 만료된 토큰이면 인증이 거부된다.
async function callDownstream(token) {
  if (Date.now() >= token.expiresAt) {
    throw new Error(
      `downstream auth rejected: service token expired at ${new Date(token.expiresAt).toISOString()}`,
    );
  }
  return { ok: true };
}

// 백그라운드 하트비트 — 다운스트림 연결을 유지한다.
setInterval(async () => {
  await callDownstream(serviceToken);
}, HEARTBEAT_INTERVAL_MS);

// 토큰 갱신 루프 — 만료되기 전에 새 토큰으로 교체한다.
setInterval(() => {
  serviceToken = mintServiceToken();
  console.log(`[token] refreshed, expiresAt=${new Date(serviceToken.expiresAt).toISOString()}`);
}, REFRESH_INTERVAL_MS);

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok\n');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Hello from KEEBAN\n');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`guide-example-service listening on :${PORT}`);
  console.log(`[token] initial expiresAt=${new Date(serviceToken.expiresAt).toISOString()}`);
});
