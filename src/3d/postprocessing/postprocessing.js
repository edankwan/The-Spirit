var effectComposer = require('./effectComposer');
var fxaa = require('./fxaa/fxaa');
var bloom = require('./bloom/bloom');
var motionBlur = require('./motionBlur/motionBlur');
var fboHelper = require('../fboHelper');

var undef;

exports.init = init;
exports.resize = resize;
exports.render = render;
exports.visualizeTarget = undef;

var _renderer;
var _scene;
var _camera;

function init(renderer, scene, camera) {

    _renderer = renderer;
    _scene = scene;
    _camera = _camera;

    effectComposer.init(renderer, scene, camera);

    // for less power machine, pass true
    // fxaa.init(true);

    fxaa.init();
    effectComposer.queue.push(fxaa);

    motionBlur.init();
    effectComposer.queue.push(motionBlur);

    bloom.init();
    effectComposer.queue.push(bloom);

}

function resize(width, height) {
    effectComposer.resize(width, height);
}


function render(dt) {

    effectComposer.renderQueue(dt);

    if(exports.visualizeTarget) {
        fboHelper.copy(exports.visualizeTarget);
    }

}
