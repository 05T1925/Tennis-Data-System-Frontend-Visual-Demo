import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const cssFiles = async (dir) => {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) files.push(...(await cssFiles(join(dir, entry.name))));
    else if (entry.name.endsWith('.css')) files.push(join(dir, entry.name));
  }
  return files;
};
const files = await cssFiles(fileURLToPath(new URL('../src', import.meta.url)));
const forbidden =
  /#[0-9a-f]{6}\b|(?:rgb|rgba|hsl|hsla)\(|\b(?:green|blue|red|teal|cyan|purple|orange|brown)\b|(?:linear|radial)-gradient|first\//i;
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const value of text.match(/#[0-9a-f]{6}\b/gi) ?? []) {
    if (!(
      value[1] === value[2] &&
      value[2] === value[3] &&
      value[4] === value[5] &&
      value[5] === value[6]
    ))
      throw new Error(`non-monochrome ${value} in ${file}`);
  }
  if (forbidden.test(text.replace(/#[0-9a-f]{6}\b/gi, '')))
    throw new Error(`forbidden monochrome token in ${file}`);
}
console.log(`monochrome check passed: ${files.length} CSS files`);
