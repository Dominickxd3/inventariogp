const clients = new Set();

function broadcast(event, data = {}) {
  const payload = `data: ${JSON.stringify({ tipo: event, ...data })}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}

export const EventsService = {
  subscribe(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(`retry: 5000\n\n`);

    clients.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {}
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(res);
    });
  },

  emit: broadcast,
};