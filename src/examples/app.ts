import { Catch, Controller, Use } from 'quantum-flow/core';
import { Port, Server } from 'quantum-flow/http';
import 'reflect-metadata';

import { User } from './controllers/user';

@Controller({ prefix: 'api', controllers: [User] })
export class Root {}

@Server({
  controllers: [Root],
  websocket: { enabled: true },
  interceptor: (data) => data,
  errorHandler: (err) => err,
})
@Port(3000)
@Use((data) => data)
@Use((data) => data)
@Catch((err) => err)
export class App {}
