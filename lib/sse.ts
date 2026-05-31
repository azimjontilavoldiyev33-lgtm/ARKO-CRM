// lib/sse.ts
const clients = new Map<string, ReadableStreamDefaultController>();

export function addClient(id: string, controller: ReadableStreamDefaultController) {
  clients.set(id, controller);
}

export function removeClient(id: string) {
  clients.delete(id);
}

export function notifyAll() {
  const msg = `data: ${JSON.stringify({ type: 'refresh' })}\n\n`;
  for (const [id, controller] of clients.entries()) {
    try {
      controller.enqueue(msg);
    } catch {
      clients.delete(id);
    }
  }
}