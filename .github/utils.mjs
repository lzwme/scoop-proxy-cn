import JSON5 from 'json5';

export function safeJsonParse(str, desc = '', silent = false) {
  try {
    return JSON5.parse(str.trim());
  } catch {
    try {
      str = str
        .replace(/^[ \t]*\/\/.*/gm, '')
        .replace(/[ \t]+\/\/[^"]+\n/gm, '')
        // .replace(/ *(".+" *: *(".*",|\d+|true|false),?)[ \t]*\/\/[^"]+\n/gm, '$1')
        .trim();
      return JSON5.parse(str);
    } catch (error) {
      if (!silent) console.error('[JSON.parse][error]', desc, error.message);
      return {};
    }
  }
}
