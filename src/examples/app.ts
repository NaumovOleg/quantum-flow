import { Controller } from 'quantum-flow/core';
import { Server } from 'quantum-flow/http';
import { Socket } from './controllers/socket';
import { User } from './controllers/user';

@Controller({
  prefix: 'api',
  controllers: [User, Socket],
  middlewares: [function Global(req, res, next) {}],
})
export class Root {}

@Server({
  controllers: [Root],
  sse: { enabled: true },
})
export class App {}
