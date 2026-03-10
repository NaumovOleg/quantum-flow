import { IsString } from 'class-validator';
import { Body, Controller, GET, Params, POST } from 'quantum-flow/core';

class DTO {
  constructor() {}
  @IsString()
  meta: string;
}

@Controller({ prefix: 'metadata' })
export class UserMetadata {
  @GET('/:meta')
  async getUserMetadata(@Params(DTO, 'meta') params: any) {
    return params;
  }
  @POST('/:meta')
  async createMeta(@Body() body: any, @Params(DTO, 'meta') params: any) {
    return { body, params };
  }
}
