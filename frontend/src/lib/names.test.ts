// RF9, RF19: nombres en español con Intl.DisplayNames; si no se conoce, el propio código.
import { CURRENCIES } from '@saas-o-matic/shared';
import { describe, expect, it } from 'vitest';
import { countryName } from './country-names';
import { currencyName } from './currency-names';

describe('currencyName', () => {
  it('todas las divisas de la lista tienen un nombre no vacío', () => {
    for (const code of CURRENCIES) expect(currencyName(code).length).toBeGreaterThan(0);
  });

  it('un código inválido no lanza y se devuelve tal cual', () => {
    expect(currencyName('no-valido!')).toBe('no-valido!');
  });
});

describe('countryName', () => {
  it('da el nombre en español', () => {
    expect(countryName('ES')).toBe('España');
    expect(countryName('GB')).toBe('Reino Unido');
  });

  it('un código inválido devuelve el código y uno desconocido no queda vacío', () => {
    expect(countryName('ZZ').length).toBeGreaterThan(0);
    expect(countryName('e1')).toBe('e1');
  });
});
