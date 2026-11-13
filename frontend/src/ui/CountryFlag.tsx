// Bandera del país (RF18 a RF21): imagen de flagcdn.com con el código visible. Falla solo por `error`.
import { useState } from 'react';
import { countryName } from '../lib/country-names';
import { flagSources, isFlagCode } from '../lib/flag-url';

const WIDTH = 20;
const HEIGHT = 15;

export function CountryFlag({ code }: { code: string }) {
  const [failedCode, setFailedCode] = useState<string | undefined>(undefined);
  // El fallo es del código que falló: si cambia `code`, se vuelve a intentar.
  if (!isFlagCode(code) || failedCode === code) return <span className="country">{code}</span>;
  const { src, srcSet } = flagSources(code);
  return (
    <span className="country">
      <img
        className="country__flag"
        src={src}
        srcSet={srcSet}
        width={WIDTH}
        height={HEIGHT}
        loading="lazy"
        alt={countryName(code)}
        onError={() => { setFailedCode(code); }}
      />
      <span>{code}</span>
    </span>
  );
}
