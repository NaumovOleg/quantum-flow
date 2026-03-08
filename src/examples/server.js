"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("quantum-flow/core");
const http_1 = require("quantum-flow/http");
require("reflect-metadata");
const socket_1 = require("./controllers/socket");
const user_1 = require("./controllers/user");
let Root = class Root {
};
Root = __decorate([
    (0, core_1.Controller)({
        prefix: 'api',
        controllers: [user_1.User, socket_1.Socket],
        interceptors: [
            (resp) => {
                return resp;
            },
        ],
    })
], Root);
let App = class App {
};
App = __decorate([
    (0, http_1.Server)({
        controllers: [Root],
        websocket: {
            enabled: true,
        },
    }),
    (0, http_1.Port)(3000),
    (0, http_1.Host)('localhost'),
    (0, http_1.Use)((res) => res),
    (0, http_1.Intercept)((data, req, res) => {
        console.log(data, 'aaaaa', req);
        return data;
    }),
    (0, http_1.Catch)((r) => {
        return r;
    })
], App);
const server = new http_1.HttpServer(App);
server.listen().catch(console.error);
