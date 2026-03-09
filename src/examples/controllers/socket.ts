import { Controller, OnConnection, OnMessage, Subscribe } from 'quantum-flow/core';

import { WebSocketEvent } from 'quantum-flow/core';

@Controller('socket')
export class Socket {
  @OnConnection()
  onConnection(event: WebSocketEvent) {
    event.client.socket.send(JSON.stringify({ type: 'welcome', data: { message: 'welcome' } }));
  }

  @Subscribe('chat')
  onChatMessage(event: WebSocketEvent) {
    const msg = event.message?.data;

    if (msg?.text.includes('bad')) {
      return;
    }
  }

  @Subscribe('news')
  onNewsMessage(event: WebSocketEvent) {}

  @OnMessage('ping')
  onPing(event: WebSocketEvent) {
    event.client.socket.send(JSON.stringify({ type: 'pong', data: { time: Date.now() } }));
  }

  @OnMessage('subscribe')
  onSubscribe(event: WebSocketEvent) {
    const topic = event.message?.data.topic;
    event.client.socket.send(
      JSON.stringify({ type: 'subscribed', topic, data: { success: true } }),
    );
  }
}
