(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.TableNumberResolver = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function toStringSafe(value) {
    return typeof value === 'string' ? value : String(value || '');
  }

  function sanitizeTableNumber(value) {
    const s = toStringSafe(value).trim();
    if (!s) return '';
    return s.slice(0, 32);
  }

  function getTableFromSearch(search) {
    try {
      const params = new URLSearchParams(toStringSafe(search));
      return sanitizeTableNumber(params.get('table') || '');
    } catch (_) {
      return '';
    }
  }

  function resolveTableNumber(opts) {
    const search = opts && 'search' in opts ? opts.search : '';
    const stored = opts && 'stored' in opts ? opts.stored : '';
    const fromUrl = getTableFromSearch(search);
    if (fromUrl) return fromUrl;
    return sanitizeTableNumber(stored);
  }

  function formatTableLabel(tableNumber) {
    const t = sanitizeTableNumber(tableNumber);
    return t ? `Table ${t}` : '—';
  }

  return {
    sanitizeTableNumber,
    getTableFromSearch,
    resolveTableNumber,
    formatTableLabel
  };
});
