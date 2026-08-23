import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../src/', import.meta.url);
const visit = (url) =>
  readdirSync(url, { withFileTypes: true }).flatMap((entry) => {
    const next = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, url);
    return entry.isDirectory() ? visit(next) : /\.(?:css|ts|tsx)$/.test(entry.name) ? [next] : [];
  });
const isGrayHex = (token) => {
  const value = token.slice(1);
  const rgb =
    value.length <= 4
      ? value
          .slice(0, 3)
          .split('')
          .map((part) => part + part)
      : [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)];
  return rgb[0] === rgb[1] && rgb[1] === rgb[2];
};
const isGrayRgb = (token) => {
  const values = token.match(/[\d.]+%?/g)?.slice(0, 3) ?? [];
  return values.length === 3 && values[0] === values[1] && values[1] === values[2];
};
export const findMonochromeViolations = (source) => {
  const violations = [];
  for (const token of source.match(/#[0-9a-f]{3,8}\b/gi) ?? [])
    if (![3, 4, 6, 8].includes(token.length - 1) || !isGrayHex(token)) violations.push(token);
  for (const token of source.match(/rgba?\([^)]*\)/gi) ?? [])
    if (!isGrayRgb(token)) violations.push(token);
  for (const token of source.match(/(?:hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)/gi) ?? [])
    violations.push(token);
  for (const token of source.match(/(?:linear|radial|conic)-gradient\([^)]*\)/gi) ?? [])
    violations.push(token);
  for (const token of source.match(
    /\b(?:red|green|blue|yellow|purple|cyan|brown|orange|magenta|lime)\b/gi,
  ) ?? [])
    violations.push(token);
  for (const token of source.match(
    /(?:from\s+['"][^'"]*(?:first|second)\/src|import\s+[^;]*(?:first|second)\/src)[^;]*/gi,
  ) ?? [])
    violations.push(token);
  return violations;
};

const selfCases = [
  ['#0f0', true],
  ['#00ff0088', true],
  ['rgb(0 255 0)', true],
  ['hsl(120 100% 50%)', true],
  ['oklch(70% 0.2 140)', true],
  ['linear-gradient(black, white)', true],
  ['#777', false],
  ['#7778', false],
  ['#777777', false],
  ['#77777788', false],
  ['rgb(119 119 119)', false],
  ['rgba(119, 119, 119, 0.5)', false],
  ['black', false],
  ['white', false],
  ['currentColor', false],
];
for (const [source, shouldFail] of selfCases) {
  if (findMonochromeViolations(source).length > 0 !== shouldFail)
    throw new Error(`Monochrome self-test failed: ${source}`);
}
const violations = findMonochromeViolations(
  visit(root)
    .map((url) => readFileSync(url, 'utf8'))
    .join('\n'),
);
if (violations.length) throw new Error(`Non-monochrome source tokens: ${violations.join(', ')}`);
console.log('Third monochrome check passed, including self-tests.');
