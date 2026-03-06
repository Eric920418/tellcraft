import { io } from 'socket.io-client';

const target = process.env.TARGET || 'http://54.238.4.117:8080';
const total = Number(process.env.TOTAL || 100);
const spreadMs = Number(process.env.SPREAD_MS || 8000);
const holdMs = Number(process.env.HOLD_MS || 20000);
const timeoutMs = Number(process.env.TIMEOUT_MS || 10000);

const sockets = [];
let connected = 0;
let connectErrors = 0;
let disconnects = 0;
let currentConnected = 0;
let maxConnected = 0;
const connectErrorReasons = new Map();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSocket(i) {
  return new Promise((resolve) => {
    const socket = io(target, {
      transports: ['websocket'],
      auth: { anonymousId: `loadtest_socket_${i}` },
      reconnection: false,
      timeout: timeoutMs,
      forceNew: true,
      extraHeaders: {
        Origin: 'https://tellcraft.com',
      },
    });

    let settled = false;

    socket.on('connect', () => {
      connected += 1;
      currentConnected += 1;
      if (currentConnected > maxConnected) {
        maxConnected = currentConnected;
      }
      if (!settled) {
        settled = true;
        resolve();
      }
    });

    socket.on('connect_error', (err) => {
      connectErrors += 1;
      const reason = err?.message || 'connect_error';
      connectErrorReasons.set(reason, (connectErrorReasons.get(reason) || 0) + 1);
      if (!settled) {
        settled = true;
        resolve();
      }
    });

    socket.on('disconnect', () => {
      disconnects += 1;
      if (currentConnected > 0) {
        currentConnected -= 1;
      }
    });

    sockets.push(socket);

    setTimeout(() => {
      if (!settled) {
        settled = true;
        connectErrors += 1;
        const reason = 'timeout';
        connectErrorReasons.set(reason, (connectErrorReasons.get(reason) || 0) + 1);
        try {
          socket.close();
        } catch {}
        resolve();
      }
    }, timeoutMs + 1000);
  });
}

async function main() {
  const start = Date.now();

  const tasks = [];
  for (let i = 0; i < total; i += 1) {
    const offset = Math.floor((i * spreadMs) / Math.max(total, 1));
    tasks.push(
      (async () => {
        await delay(offset);
        await createSocket(i + 1);
      })()
    );
  }

  await Promise.all(tasks);
  const setupDone = Date.now();

  await delay(holdMs);

  const aliveBeforeClose = sockets.filter((s) => s.connected).length;

  for (const s of sockets) {
    try {
      s.close();
    } catch {}
  }

  await delay(1000);

  const end = Date.now();

  const result = {
    target,
    totalAttempted: total,
    connected,
    maxConnected,
    aliveBeforeClose,
    connectErrors,
    disconnects,
    connectErrorBreakdown: Object.fromEntries(connectErrorReasons),
    connectSuccessRate: Number(((connected / Math.max(total, 1)) * 100).toFixed(2)),
    testDurationSec: Number(((end - start) / 1000).toFixed(2)),
    setupDurationSec: Number(((setupDone - start) / 1000).toFixed(2)),
  };

  console.log(JSON.stringify(result));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
