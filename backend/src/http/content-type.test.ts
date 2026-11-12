// isJsonContentType (RF26): application/json, sin distinguir mayúsculas, y como único
// parámetro admitido charset=utf-8.
import { describe, expect, it } from 'vitest';
import { isJsonContentType } from './content-type';

describe('isJsonContentType (RF26)', () => {
  it.each([
    'application/json',
    'Application/JSON',
    'application/json; charset=utf-8',
    'application/json;charset=utf-8',
    'application/json; charset=UTF-8',
    'APPLICATION/JSON; CHARSET=UTF-8',
    'application/json; charset="utf-8"',
    '  application/json  ;  charset = utf-8  ',
  ])('acepta %j', (header) => {
    expect(isJsonContentType(header)).toBe(true);
  });

  it.each([
    undefined,
    '',
    'text/plain',
    'text/json',
    'application/jsonx',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/x-www-form-urlencoded',
    'multipart/form-data; boundary=x',
    'application/json; charset=latin1',
    'application/json; charset=utf8',
    'application/json; charset=utf-16',
    'application/json; foo=bar',
    'application/json; charset=utf-8; foo=bar',
    'application/json; charset=utf-8; charset=utf-8',
    'application/json;',
    'application/json; charset',
    'application/json; charset=utf-8=x',
    'application/json, text/plain',
  ])('rechaza %j', (header) => {
    expect(isJsonContentType(header)).toBe(false);
  });
});
