import { Controller } from 'quantum-flow/core';
import { Catch, Host, HttpServer, Intercept, Port, Server, Use } from 'quantum-flow/http';
import 'reflect-metadata';

import { Socket } from './controllers/socket';
import { User } from './controllers/user';

@Controller({
  prefix: 'api',
  controllers: [User, Socket],
  interceptors: [
    (resp: any) => {
      return resp;
    },
  ],
})
class Root {}

@Server({
  controllers: [Root],
  websocket: {
    enabled: true,
  },
})
@Port(3000)
@Host('localhost')
@Use((res: any) => res)
@Intercept((data: any, req, res) => {
  console.log(data, 'aaaaa', req);
  return data;
})
@Catch((r: any) => {
  return r;
})
class App {}

const server = new HttpServer(App);

server.listen().catch(console.error);
