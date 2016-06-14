var THREE = require('three');
var fboHelper = require('../fboHelper');
var merge = require('mout/object/merge');

var undef;

exports.init = init;
exports.resize = resize;
exports.renderQueue = renderQueue;
exports.renderScene = renderScene;
exports.render = render;
exports.swapRenderTarget = swapRenderTarget;
exports.getRenderTarget = getRenderTarget;
exports.releaseRenderTarget = releaseRenderTarget;

exports.resolution = undef;

var queue = exports.queue = [];
var fromRenderTarget = exports.fromRenderTarget = undef;
var toRenderTarget = exports.toRenderTarget = undef;
var resolution = exports.resolution = undef;
var _renderTargetLists = {};
var _renderTargetCounts = {};
var _renderTargetDefaultState = {
    depthBuffer : false,
    texture: {
        generateMipmaps : false
    }
};

exports.renderer = undef;
exports.scene = undef;
exports.camera = undef;

function init(renderer, scene, camera) {

    fromRenderTarget = exports.fromRenderTarget = fboHelper.createRenderTarget();
    toRenderTarget = exports.toRenderTarget = fboHelper.createRenderTarget();

    resolution = exports.resolution = new THREE.Vector2();

    exports.renderer = renderer;
    exports.scene = scene;
    exports.camera = camera;

}

function resize(width, height) {
    resolution.set(width, height);

    fromRenderTarget.setSize(width, height);
    toRenderTarget.setSize(width, height);

    exports.camera.aspect = width / height;
    exports.camera.updateProjectionMatrix();
    exports.renderer.setSize(width, height);

    for(var i = 0, len = queue.length; i < len; i++) {
        queue[i].resize(width, height);
    }
}

function _filterQueue(effect) {
    return effect.enabled;
}

function renderQueue(dt) {
    var renderableQueue = queue.filter(_filterQueue);

    if(renderableQueue.length) {


        toRenderTarget.depthBuffer = true;
        toRenderTarget.stencilBuffer = true;
        exports.renderer.render( exports.scene, exports.camera, toRenderTarget );
        // toRenderTarget.depthBuffer = false;
        // toRenderTarget.stencilBuffer = false;
        swapRenderTarget();

        var effect;
        for(var i = 0, len = renderableQueue.length; i < len; i++) {
            effect = renderableQueue[i];
            effect.render(dt, fromRenderTarget, i === len - 1);
        }

    } else {
        exports.renderer.render( exports.scene, exports.camera );
    }

}

function renderScene(renderTarget, scene, camera) {
    scene = scene || exports.scene;
    camera = camera || exports.camera;
    if(renderTarget) {
        exports.renderer.render( scene, camera, renderTarget );
    } else {
        exports.renderer.render( scene, camera );
    }
}

function render(material, toScreen) {
    fboHelper.render(material, toScreen ? undef : toRenderTarget);
    swapRenderTarget();
    return fromRenderTarget;
}

function swapRenderTarget() {
    var tmp = toRenderTarget;
    toRenderTarget = exports.toRenderTarget = fromRenderTarget;
    fromRenderTarget = exports.fromRenderTarget = tmp;
}


function getRenderTarget(bitShift, isRGBA) {
    bitShift = bitShift || 0;
    isRGBA = +(isRGBA || 0);

    var width = resolution.x >> bitShift;
    var height = resolution.y >> bitShift;
    var id = bitShift + '_' + isRGBA;
    var list = _getRenderTargetList(id);
    var renderTarget;
    if(list.length) {
        renderTarget = list.pop();
        merge(renderTarget, _renderTargetDefaultState);
    } else {
        renderTarget = fboHelper.createRenderTarget(width, height, isRGBA ? THREE.RGBAFormat : THREE.RGBFormat);
        renderTarget._listId = id;
        _renderTargetCounts[id] = _renderTargetCounts[id] || 0;
    }
    _renderTargetCounts[id]++;

    if((renderTarget.width !== width) || (renderTarget.height !== height)) {
        renderTarget.setSize(width, height);
    }

    return renderTarget;
}

function releaseRenderTarget(renderTarget) {
    var renderTargets = arguments;
    var found, j, jlen, id, list;

    for(var i = 0, len = renderTargets.length; i < len; i++) {
        renderTarget = renderTargets[i];
        id = renderTarget._listId;
        list = _getRenderTargetList(id);
        found = false;
        _renderTargetCounts[id]--;
        for(j = 0, jlen = list.length; j < jlen; j++) {
            if(list[j] === renderTarget) {
                found = true;
                break;
            }
        }
        if(!found) {
            list.push(renderTarget);
        }
    }
}

function _getRenderTargetList(id) {
    return _renderTargetLists[id] || (_renderTargetLists[id] = []);
}
