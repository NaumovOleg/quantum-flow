import path from 'path';
import { ANY, Controller, Response } from 'quantum-flow/core';
import { Server } from 'quantum-flow/http';

import { GraphQlController } from './controllers/graphql';
import { Socket } from './controllers/socket';
import { User } from './controllers/user';

@Controller({
  prefix: 'api',
  controllers: [User, Socket],
  middlewares: [function Global(req, res, next) {}],
})
export class Root {
  @ANY()
  use() {
    return 'default';
  }
}

@Controller({ prefix: 'metric', controllers: [] })
export class MetricsController {
  @ANY()
  async any(@Response() resp: any) {}
}

@Server({
  controllers: [Root, Socket, MetricsController, GraphQlController],
  statics: [
    {
      path: path.join(__dirname, '../../'),
      options: { index: 'index.html' },
    },
  ],
  graphql: { enabled: true },
  sse: { enabled: true },
})
export class App {}
