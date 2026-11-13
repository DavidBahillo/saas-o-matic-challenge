// URL de las banderas (RF18, RF21): solo se construye con un código ya validado (^[A-Z]{2}$).
export const FLAG_CDN_BASE = 'https://flagcdn.com';

const FLAG_CODE = /^[A-Z]{2}$/;

export function isFlagCode(code: string): boolean {
  return FLAG_CODE.test(code);
}

export function flagSources(code: string): { src: string; srcSet: string } {
  const lower = code.toLowerCase();
  return {
    src: `${FLAG_CDN_BASE}/w20/${lower}.png`,
    srcSet: `${FLAG_CDN_BASE}/w40/${lower}.png 2x`,
  };
}
