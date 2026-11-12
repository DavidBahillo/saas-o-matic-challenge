// Petición HTTP/1.1 escrita a mano sobre un socket. Sirve para casos que los clientes HTTP de
// Node no permiten, como un POST sin Content-Length ni Transfer-Encoding (req.body undefined), o
// para enviar bytes exactos (UTF-8 no válido, BOM). El servidor se cierra siempre, también si
// la petición falla (finally).
import { connect } from 'node:net';
import type { Server } from 'node:http';
import type { Express } from 'express';

export interface RawResponse {
  status: number;
  body: unknown;
}

function parseRaw(raw: string): RawResponse {
  const [head = '', body = ''] = raw.split('\r\n\r\n');
  const status = Number(head.split(' ')[1]);
  const parsed: unknown = JSON.parse(body);
  return { status, body: parsed };
}

function listen(app: Express): Promise<{ server: Server; port: number }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') reject(new Error('Dirección inesperada'));
      else resolve({ server, port: address.port });
    });
    server.on('error', reject);
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
}

function exchange(port: number, request: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const socket = connect(port, '127.0.0.1', () => socket.end(request));
    socket.on('data', (chunk: Buffer) => chunks.push(chunk));
    socket.on('error', reject);
    socket.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
}

/** POST /customers con exactamente las cabeceras indicadas (más Host y Connection) y `body`. */
export async function rawPostCustomers(
  app: Express,
  headers: readonly string[],
  body: string | Buffer = '',
): Promise<RawResponse> {
  const head = ['POST /customers HTTP/1.1', 'Host: localhost', ...headers, 'Connection: close'].join('\r\n');
  const bytes = typeof body === 'string' ? Buffer.from(body, 'utf8') : body;
  const { server, port } = await listen(app);
  try {
    return parseRaw(await exchange(port, Buffer.concat([Buffer.from(`${head}\r\n\r\n`), bytes])));
  } finally {
    await closeServer(server);
  }
}
