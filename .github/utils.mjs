import JSON5 from 'json5';

export function safeJsonParse(str, desc = '', silent = false) {
  try {
    str = str
      .replace(/^ *\/\/.*/gm, '')
      .replace(/ \/\/[^"]+\n/gm, '')
      .trim();
    return JSON5.parse(str.trim());
  } catch (error) {
    if (!silent) console.error('[JSON.parse][error]', desc, error.message);
    return {};
  }
}
