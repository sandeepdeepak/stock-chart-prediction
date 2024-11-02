const { symbolTokens } = require('./symbolTokens');

const filteredTokens = symbolTokens.filter(s => s.exch_seg === 'NSE' && s.expiry === '');
console.log(filteredTokens);