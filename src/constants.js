"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATIC_METADATA_KEY = exports.SSE_SERVICE_KEY = exports.SSE_TOPIC_KEY = exports.SSE_METADATA_KEY = exports.CORS_METADATA = exports.TO_VALIDATE = exports.OK_STATUSES = exports.STOPPED = exports.SANITIZE = exports.CATCH = exports.INTECEPT = exports.WS_SERVICE_KEY = exports.WS_TOPIC_KEY = exports.WS_HANDLER = exports.USE_MIDDLEWARE = exports.SERVER_CONFIG_KEY = exports.OK_METADATA_KEY = exports.ENDPOINT = exports.INTERCEPTOR = exports.CONTROLLERS = exports.MIDDLEWARES = exports.ROUTE_MIDDLEWARES = exports.ROUTE_PREFIX = exports.APP_METADATA_KEY = exports.PARAM_METADATA_KEY = void 0;
exports.PARAM_METADATA_KEY = 'design:parameters';
exports.APP_METADATA_KEY = 'app:configuration';
exports.ROUTE_PREFIX = 'route:prefix';
exports.ROUTE_MIDDLEWARES = 'route:middlewares';
exports.MIDDLEWARES = 'controller:middlewares';
exports.CONTROLLERS = 'app:controllers';
exports.INTERCEPTOR = 'app:interceptors';
exports.ENDPOINT = 'route:endpoints';
exports.OK_METADATA_KEY = 'custom:ok';
exports.SERVER_CONFIG_KEY = 'server:config';
exports.USE_MIDDLEWARE = 'controller:usemiddleware';
exports.WS_HANDLER = 'websocket:handler';
exports.WS_TOPIC_KEY = 'websocket:topic';
exports.WS_SERVICE_KEY = 'websocket:service';
exports.INTECEPT = 'server:intercept';
exports.CATCH = 'server:catch';
exports.SANITIZE = 'action:sanitize';
exports.STOPPED = `
╔════════════════════════════════════════╗
║  👋 Server stopped                      ║
║  📊 Status: STOPPED                      ║
╚════════════════════════════════════════╝
          `;
exports.OK_STATUSES = [200, 201, 202, 203, 204, 205, 206, 207, 208, 226];
exports.TO_VALIDATE = ['headers', 'params', 'multipart', 'query', 'body'];
exports.CORS_METADATA = 'cors:config';
exports.SSE_METADATA_KEY = 'sse:handlers';
exports.SSE_TOPIC_KEY = 'sse:topics';
exports.SSE_SERVICE_KEY = 'sse:service';
exports.STATIC_METADATA_KEY = 'static:config';
//# sourceMappingURL=constants.js.map