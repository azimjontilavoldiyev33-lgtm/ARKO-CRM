import { NextRequest } from 'next/server';
import { addClient, removeClient } from '@/lib/sse';

export function GET(req: NextRequest) {
  const department = req.nextUrl.searchParams.get('department') ?? 'all';

  const stream = new ReadableStream({
    start(controller) {
      const id = `${department}_${Date.now()}_${Math.random()}`;
      addClient(id, controller);
      controller.enqueue(`data: connected\n\n`);
      req.signal.addEventListener('abort', () => removeClient(id));
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}