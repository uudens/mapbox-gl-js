'use strict';

const ideographicBreakingRegExp = new RegExp([
    '[一-鿌]',
    '[㐀-䶵]',
    // eslint-disable-next-line no-irregular-whitespace
    '[　-〿]',
    '\uD840[\uDC00-\uFFFF]|[\uD841-\uD872]|\uD873[\u0000-\uDEAF]', // '[𠀀-𬺯]'
    '[！-￮]',
    '[ぁ-ゟ]',
    '[゠-ヿ]',
    '[ㇰ-ㇿ]',
    '[ꀀ-꓆]'
].join('|'));

module.exports.allowsIdeographicBreaking = function(input) {
    return input.search(ideographicBreakingRegExp) !== -1;
};

const verticalRegExp = new RegExp([
    '[ᄀ-ᇿ]',
    '[가-힣]',
    '[ㄱ-ㆎ]',
    '[一-鿌]',
    '[㐀-䶵]',
    // eslint-disable-next-line no-irregular-whitespace
    '[　-〿]',
    '\uD840[\uDC00-\uFFFF]|[\uD841-\uD872]|\uD873[\u0000-\uDEAF]', // '[𠀀-𬺯]'
    '[！-￮]',
    '[ぁ-ゟ]',
    '[゠-ヿ]',
    '[ㇰ-ㇿ]',
    '[ꀀ-꓆]',
    '[᠀-ᢪ]'
].join('|'));

module.exports.allowsVerticalWritingMode = function(input) {
    return input.search(verticalRegExp) !== -1;
};
