for(var id in Math) {
    exports[id] = Math[id];
}

exports.step = step;
exports.smoothstep = smoothstep;
exports.clamp = clamp;
exports.mix = exports.lerp = mix;
exports.unMix = exports.unLerp = unMix;
exports.unClampedMix = exports.unClampedLerp = unClampedMix;
exports.upClampedUnMix = exports.unClampedUnLerp = upClampedUnMix;
exports.fract = fract;
exports.hash = hash;
exports.hash2 = hash2;
exports.sign = sign;

var PI = Math.PI;
var TAU = exports.TAU = PI * 2;

function step ( edge, val ) {
    return val < edge ? 0 : 1;
}

function smoothstep ( edge0, edge1, val ) {
    val = unMix( edge0, edge1, val );
    return val * val ( 3 - val * 2 );
}

function clamp ( val, min, max ) {
    return val < min ? min : val > max ? max : val;
}

function mix ( min, max, val ) {
    return val <= 0 ? min : val >= 1 ? max : min + ( max - min ) * val;
}

function unMix ( min, max, val ) {
    return val <= min ? 0 : val >= max ? 1 : ( val - min ) / ( max - min );
}

function unClampedMix ( min, max, val ) {
    return min + ( max - min ) * val;
}

function upClampedUnMix ( min, max, val ) {
    return ( val - min ) / ( max - min );
}

function fract ( val ) {
    return val - Math.floor( val );
}

function hash (val) {
    return fract( Math.sin( val ) * 43758.5453123 );
}

function hash2 (val1, val2) {
    return fract( Math.sin( val1 * 12.9898 + val2 * 4.1414 ) * 43758.5453 );
}

function sign (val) {
    return val ? val < 0 ? - 1 : 1 : 0;
}
