import { Request } from '@types';
import { Application, Catch, Host, Port, Server, Use } from './src/app/http';
import { Body, Controller, Query, Status, USE } from './src/controllers';

import { IsString } from 'class-validator';

class DTO {
  @IsString()
  name: string;
}

const auth = (req: Request) => {
  req.body = 'name';

  return req;
};
const auth2 = (resp: any) => {
  resp = { hello: 'world' };

  return resp;
};

@Controller({
  prefix: 'base',
  responseInterceprors: auth2,
  requestInterceptors: [auth],
  middlewares: [auth],
})
// @Validate('body', DTO)
export class Controllera {
  // @Validate('body', DTO)
  @Status(300)
  @USE('/:nane', [auth])
  async test(@Body() body: any, @Query() query: any) {
    console.log(query);
    throw 'Test';
  }
}

@Controller({
  prefix: 'api',
  controllers: [Controllera],
  responseInterceprors: [
    (resp) => {
      console.log('base responseInterceprors', resp);
      return '=-----a-a-a-a-a-a-a-a--a-a-a-a';
    },
  ],
})
class Root {}

@Server({
  controllers: [Root],
})
@Port(3000)
@Host('localhost')
@Use(auth)
@Catch((r: any) => {})
class App {}

const server = new Application(App);

server.listen().catch(console.error);
