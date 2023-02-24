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
      if (na > nb)
          return 1;
      if (nb > na)
          return -1;
      if (!Number.isNaN(na) && Number.isNaN(nb))
          return 1;
      if (Number.isNaN(na) && !Number.isNaN(nb))
          return -1;
  }
  return 0;
}
