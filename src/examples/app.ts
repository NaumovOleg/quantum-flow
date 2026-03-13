import path from 'path';
import { Controller, USE } from 'quantum-flow/core';
import { Server } from 'quantum-flow/http';
import { Socket } from './controllers/socket';
import { User } from './controllers/user';

@Controller({
  prefix: 'api',
  controllers: [User, Socket],
  middlewares: [function Global(req, res, next) {}],
})
export class Root {
  @USE()
  use() {
    return 'default';
  }
}

@Server({
  controllers: [Root, Socket],
  statics: [
    {
      path: path.join(__dirname, '../../'),
      options: { index: 'index.html' },
    },
  ],
  sse: { enabled: true },
})
export class App {}
