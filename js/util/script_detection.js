'use strict';

const isVerticalWritingModeRegExp = new RegExp([
    '[\u1100-\u11FF]',
    '[\uAC00-\uD7A3]',
    '[\u3131-\u318E]',
    '[\u4E00-\u9FCC]',
    '[\u3400-\u4DB5]',
    '[\u3000-\u303F]',
    '[\uFF01-\uFFEE]',
    '[\u3041-\u309F]',
    '[\u30A0-\u30FF]',
    '[\u31F0-\u31FF]',
    '[\uA000-\uA4C6]',
    '[\u1800-\u18AA]',
    '\uD840[\uDC00-\uFFFF]',
    '[\uD841-\uD872]',
    '\uD873[\u0000-\uDEAF]'
].join('|'));

module.exports.allowsVerticalWritingMode = function(input) {
    return input.search(isVerticalWritingModeRegExp) !== -1;
};
