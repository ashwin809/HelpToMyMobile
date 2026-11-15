// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const net = require('net');
const http = require('http');
const { spawn } = require('child_process');

// Auto-start HelpToYou backend API server on port 4000 if not already running
let serverStarted = false;
function ensureApiServer() {
  if (serverStarted) return;
  const socket = new net.Socket();
  socket.setTimeout(400);

  const startServer = () => {
    if (serverStarted) return;
    serverStarted = true;
    try {
      const serverDir = path.resolve(__dirname, 'server');
      const child = spawn(process.execPath, [path.resolve(serverDir, 'src/index.js')], {
        cwd: serverDir,
        stdio: 'inherit',
        env: process.env,
        detached: false,
      });

      child.on('error', (err) => {
        console.warn('[API Server] Could not auto-start:', err.message);
      });

      const cleanup = () => {
        try {
          if (!child.killed) child.kill();
        } catch {}
      };
      process.on('exit', cleanup);
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    } catch (err) {
      console.warn('[API Server] Auto-start error:', err);
    }
  };

  socket.on('connect', () => {
    socket.destroy();
  });

  socket.on('error', () => {
    socket.destroy();
    startServer();
  });

  socket.on('timeout', () => {
    socket.destroy();
    startServer();
  });

  socket.connect(4000, '127.0.0.1');
}

ensureApiServer();

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// OneDrive may leave a broken reparse-point backup under .expo. Metro's file
// crawler must not inspect that generated directory; doing so can fail the
// haste map build and surface the misleading DependencyGraph map.get error.
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const oneDriveBackupPath = path.resolve(__dirname, '.expo', 'node_modules-onedrive-backup');
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  new RegExp(`^${escapeRegExp(oneDriveBackupPath)}[\\\\/]`),
];

// Proxy development API requests through Metro's already reachable port. This
// lets a physical device use the app even when Windows blocks port 4000.
const apiProxy = (req, res, next) => {
  const requestPath = req.url || '';
  if (!requestPath.startsWith('/api/v1/') && requestPath !== '/health' && requestPath !== '/api/v1/health') {
    return next();
  }

  const upstream = http.request({
    hostname: '127.0.0.1',
    port: 4000,
    path: requestPath,
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:4000' },
  }, (upstreamResponse) => {
    res.statusCode = upstreamResponse.statusCode || 502;
    for (const [name, value] of Object.entries(upstreamResponse.headers)) {
      if (value !== undefined) res.setHeader(name, value);
    }
    upstreamResponse.pipe(res);
  });

  upstream.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json');
    }
    res.end(JSON.stringify({ error: 'The local HelpToYou API is not running on port 4000.' }));
  });
  req.pipe(upstream);
};

const defaultEnhanceMiddleware = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, metroServer) => {
    const enhancedMiddleware = defaultEnhanceMiddleware
      ? defaultEnhanceMiddleware(metroMiddleware, metroServer)
      : metroMiddleware;
    return (req, res, next) => apiProxy(req, res, () => enhancedMiddleware(req, res, next));
  },
};

const mockTopicSubscriptionModule = path.resolve(__dirname, 'src/mocks/TopicSubscriptionModule.js');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@ungap/structured-clone': path.resolve(__dirname, 'node_modules/@ungap/structured-clone'),
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.endsWith('TopicSubscriptionModule') ||
    moduleName.endsWith('TopicSubscriptionModule.android') ||
    moduleName.includes('TopicSubscriptionModule')
  ) {
    return {
      filePath: mockTopicSubscriptionModule,
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
