// Comprobación pura del Content-Type de un POST (RF26, plan §6.4): el tipo de medio debe ser
// application/json (sin distinguir mayúsculas) y el único parámetro admitido es charset=utf-8.

const JSON_MEDIA_TYPE = 'application/json';
const UTF8 = 'utf-8';

function unquote(value: string): string {
  return value.length >= 2 && value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
}

function isUtf8CharsetParam(param: string): boolean {
  const parts = param.split('=');
  if (parts.length !== 2) return false;
  const [name = '', value = ''] = parts;
  return name.trim().toLowerCase() === 'charset' && unquote(value.trim()).toLowerCase() === UTF8;
}

export function isJsonContentType(header: string | undefined): boolean {
  if (header === undefined) return false;
  const [mediaType = '', ...params] = header.split(';');
  if (mediaType.trim().toLowerCase() !== JSON_MEDIA_TYPE) return false;
  if (params.length === 0) return true;
  return params.length === 1 && isUtf8CharsetParam(params[0] ?? '');
}
