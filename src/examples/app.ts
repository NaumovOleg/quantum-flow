import { Catch, Controller, CORS, Use } from 'quantum-flow/core';
import { Port, Server } from 'quantum-flow/http';
import 'reflect-metadata';

import { User } from './controllers/user';

@Controller({ prefix: 'api', controllers: [User] })
@CORS({ origin: '*' })
export class Root {}

@Server({
  controllers: [Root],
  websocket: { enabled: true },
  interceptor: (data) => data,
  errorHandler: (err) => err,
  cors: { origin: '*' },
})
@Port(3000)
@Use((data) => {
  return data;
})
@Use((data) => {
  return data;
})
@Catch((err) => err)
export class App {}
