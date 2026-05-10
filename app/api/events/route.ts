export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(async () => {
        const data = `data: ${JSON.stringify({ time: Date.now() })}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      }, 30000);

      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}