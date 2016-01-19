var THREE = require('three');

var threeChunkReplaceRegExp = /\/\/\s?chunk_replace\s(.+)([\d\D]+)\/\/\s?end_chunk_replace/gm;
var threeChunkRegExp = /\/\/\s?chunk\(\s?(\w+)\s?\);/g;
// var glslifyBugFixRegExp = /(_\d+_\d+)(_\d+_\d+)+/g;
// var glslifyGlobalRegExp = /GLOBAL_VAR_([^_\.\)\;\,\s]+)(_\d+_\d+)?/g;
var glslifyGlobalRegExp = /GLOBAL_VAR_([^_\.\)\;\,\s]+)(_\d+)?/g;

var _chunkReplaceObj;

function _storeChunkReplaceParse(shader) {
    _chunkReplaceObj = {};
    return shader.replace(threeChunkReplaceRegExp, _storeChunkReplaceFunc);
}

function _threeChunkParse(shader) {
    return shader.replace(threeChunkRegExp, _replaceThreeChunkFunc);
}

// function _glslifyBugFixParse(shader) {
//     return shader.replace(glslifyBugFixRegExp, _returnFirst);
// }

function _glslifyGlobalParse(shader) {
    return shader.replace(glslifyGlobalRegExp, _returnFirst);
}

function _storeChunkReplaceFunc(a, b, c) {
    _chunkReplaceObj[b.trim()] = c;
    return '';
}

function _replaceThreeChunkFunc(a, b) {
    var str = THREE.ShaderChunk[b] + '\n';
    for(var id in _chunkReplaceObj) {
        str = str.replace(id, _chunkReplaceObj[id]);
    }
    return str;
}

function _returnFirst(a, b) {
    return b;
}

function parse(shader) {
    shader = _storeChunkReplaceParse(shader);
    shader = _threeChunkParse(shader);
    // shader = _glslifyBugFixParse(shader);
    return _glslifyGlobalParse(shader);
}

module.exports = parse;
