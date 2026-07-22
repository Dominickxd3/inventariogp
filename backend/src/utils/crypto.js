import crypto from 'crypto';
import fs from 'fs';

export function generarToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashSHA256(texto) {
  return crypto.createHash('sha256').update(texto, 'utf8').digest('hex');
}

export function hashFile(rutaArchivo) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(rutaArchivo);
    const hash = crypto.createHash('sha256');
    stream.on('data', (d) => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}
