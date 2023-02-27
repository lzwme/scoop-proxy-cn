export function semverCompare(a, b, strict = true) {
  if (!strict) {
      a = a.replace('-', '.').replace(/[^\d.]/g, '');
      b = b.replace('-', '.').replace(/[^\d.]/g, '');
  }
  const pa = a.split('.');
  const pb = b.split('.');
  const count = strict ? 3 : Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < count; i++) {
      const na = Number(pa[i]);
      const nb = Number(pb[i]);
      if (na > nb) return 1;
      if (nb > na) return -1;
      if (!Number.isNaN(na) && Number.isNaN(nb)) return 1;
      if (Number.isNaN(na) && !Number.isNaN(nb)) return -1;
  }

  return 0;
}

export function simpleAssign(a, b, options = {}, seen = new Set()) {
  const result = a;

  if (!a || typeof a !== 'object') return result;
  if (typeof b !== 'object' || b instanceof RegExp || Array.isArray(b)) {
      return result;
  }

  seen.add(b);
  for (const [key, value] of Object.entries(b)) {
      if (typeof options.filter === 'function' && !options.filter(value, key))
          continue;
      if (null == value || typeof value !== 'object' || value instanceof RegExp) {
          result[key] = value;
      } else if (Array.isArray(value) || isSet(value) || isMap(value)) {
          result[key] = options.mergeArrayLike ? mergeArrayLike(result[key], value) : value;
      } else {
          if (!result[key])
              result[key] = {};
          if (seen.has(value)) {
              result[key] = value;
          } else {
              seen.add(value);
              simpleAssign(result[key], value, options, seen);
          }
      }
  }
  return result;
}

export function safeJsonParse(str, desc = '') {
  try {
    // todo: require('json5').parse(str);
    str = str.replace(/^ *\/\/.+/mg, '').replace(/ \/\/[^"]+\n/mg, '').trim();
    return JSON.parse(str);
  } catch (error) {
    if (desc) console.error('[JSON.parse][error]', desc, error.message);
    return {};
  }
}
