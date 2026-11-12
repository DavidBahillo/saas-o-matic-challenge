import { describe, expect, it } from 'vitest';
import { toSearchKey } from './search-key';

const NFC_IBERICA = 'Ibérica';
const NFD_IBERICA = 'Ibe\u0301rica';

describe('toSearchKey (RF23)', () => {
  it('pasa a minúsculas conservando las tildes', () => {
    expect(toSearchKey('Acme Ibérica SL')).toBe('acme ibérica sl');
  });

  it('normaliza a NFC: la forma NFD de Ibérica da la misma clave que la NFC', () => {
    expect(toSearchKey(NFD_IBERICA)).toBe('ibérica');
    expect(toSearchKey(NFD_IBERICA)).toBe(toSearchKey(NFC_IBERICA));
  });

  it('IBÉRICA (NFC y NFD) da la misma clave que Ibérica', () => {
    expect(toSearchKey('IBÉRICA')).toBe(toSearchKey(NFC_IBERICA));
    expect(toSearchKey('IBE\u0301RICA')).toBe(toSearchKey(NFC_IBERICA));
  });

  it('no ignora tildes: iberica no está contenido en la clave de Ibérica', () => {
    expect(toSearchKey('Acme Ibérica SL').includes(toSearchKey('iberica'))).toBe(false);
  });

  it('Straße no pasa a ss (sin case folding)', () => {
    expect(toSearchKey('Straße GmbH')).toBe('straße gmbh');
    expect(toSearchKey('Straße GmbH').includes(toSearchKey('STRASSE'))).toBe(false);
  });

  it('\u0130 (U+0130) se convierte en i simple, sin punto combinante', () => {
    expect(toSearchKey('\u0130')).toBe('i');
    expect(toSearchKey('\u0130stanbul')).toBe('istanbul');
  });

  it('convierte carácter a carácter (Σ final → σ, sin regla contextual)', () => {
    expect(toSearchKey('ΟΔΟΣ')).toBe('οδοσ');
  });

  it('conserva la ñ y los caracteres no alfabéticos', () => {
    expect(toSearchKey('ÑANDÚ 100% _x_')).toBe('ñandú 100% _x_');
  });
});
