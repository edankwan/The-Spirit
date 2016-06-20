var dat = require('dat-gui');
var Stats = require('stats.js');
var css = require('dom-css');
var raf = require('raf');

var THREE = require('three');

var OrbitControls = require('./controls/OrbitControls');
var settings = require('./core/settings');

var math = require('./utils/math');
var ease = require('./utils/ease');
var mobile = require('./fallback/mobile');
var encode = require('mout/queryString/encode');

var postprocessing = require('./3d/postprocessing/postprocessing');
var motionBlur = require('./3d/postprocessing/motionBlur/motionBlur');
var fxaa = require('./3d/postprocessing/fxaa/fxaa');
var bloom = require('./3d/postprocessing/bloom/bloom');
var fboHelper = require('./3d/fboHelper');
var simulator = require('./3d/simulator');
var particles = require('./3d/particles');
var lights = require('./3d/lights');
var floor = require('./3d/floor');


var undef;
var _gui;
var _stats;

var _width = 0;
var _height = 0;

var _control;
var _camera;
var _scene;
var _renderer;

var _time = 0;
var _ray = new THREE.Ray();

var _initAnimation = 0;

var _bgColor;
var _logo;
var _instruction;
var _footerItems;

function init() {

    if(settings.useStats) {
        _stats = new Stats();
        css(_stats.domElement, {
            position : 'absolute',
            left : '0px',
            top : '0px',
            zIndex : 2048
        });

        document.body.appendChild( _stats.domElement );
    }

    _bgColor = new THREE.Color(settings.bgColor);
    settings.mouse = new THREE.Vector2(0,0);
    settings.mouse3d = _ray.origin;

    _renderer = new THREE.WebGLRenderer({
        // transparent : true,
        // premultipliedAlpha : false,
        antialias : true
    });
    _renderer.setClearColor(settings.bgColor);
    _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    _renderer.shadowMap.enabled = true;
    document.body.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.fog = new THREE.FogExp2( settings.bgColor, 0.001 );

    _camera = new THREE.PerspectiveCamera( 45, 1, 10, 3000);
    _camera.position.set(300, 60, 300).normalize().multiplyScalar(1000);
    settings.camera = _camera;
    settings.cameraPosition = _camera.position;

    fboHelper.init(_renderer);
    postprocessing.init(_renderer, _scene, _camera);

    simulator.init(_renderer);
    particles.init(_renderer);
    _scene.add(particles.container);

    lights.init(_renderer);
    _scene.add(lights.mesh);

    floor.init(_renderer);
    floor.mesh.position.y = -100;
    _scene.add(floor.mesh);

    _control = new OrbitControls( _camera, _renderer.domElement );
    _control.target.y = 50;
    _control.maxDistance = 1000;
    _control.minPolarAngle = 0.3;
    _control.maxPolarAngle = Math.PI / 2 - 0.1;
    _control.noPan = true;
    _control.update();

    _gui = new dat.GUI();

    if(settings.isMobile) {
        _gui.close();
        _control.enabled = false;
    }

    var simulatorGui = _gui.addFolder('Simulator');
    simulatorGui.add(settings.query, 'amount', settings.amountList).onChange(function(){
        if (confirm('It will restart the demo')) {
            window.location.href = window.location.href.split('#')[0] + encode(settings.query).replace('?', '#');
            window.location.reload();
        }
    });
    simulatorGui.add(settings, 'speed', 0, 3).listen();
    simulatorGui.add(settings, 'dieSpeed', 0.0005, 0.05).listen();
    simulatorGui.add(settings, 'radius', 0.2, 3);
    simulatorGui.add(settings, 'curlSize', 0.001, 0.05).listen();
    simulatorGui.add(settings, 'attraction', -2, 2);
    simulatorGui.add(settings, 'followMouse').name('follow mouse');
    simulatorGui.open();

    var renderingGui = _gui.addFolder('Rendering');
    renderingGui.add(settings, 'shadowDarkness', 0, 1).name('shadow');
    renderingGui.add(settings, 'useTriangleParticles').name('new particle');
    renderingGui.addColor(settings, 'color1').name('base Color');
    renderingGui.addColor(settings, 'color2').name('fade Color');
    renderingGui.addColor(settings, 'bgColor').name('background Color');
    renderingGui.open();


    var postprocessingGui = _gui.addFolder('Post-Processing');
    postprocessingGui.add(settings, 'fxaa').listen();
    motionBlur.maxDistance = 120;
    motionBlur.motionMultiplier = 7 ;
    motionBlur.linesRenderTargetScale = settings.motionBlurQualityMap[settings.query.motionBlurQuality];
    var motionBlurControl = postprocessingGui.add(settings, 'motionBlur');
    var motionMaxDistance = postprocessingGui.add(motionBlur, 'maxDistance', 1, 300).name('motion distance').listen();
    var motionMultiplier = postprocessingGui.add(motionBlur, 'motionMultiplier', 0.1, 15).name('motion multiplier').listen();
    var motionQuality = postprocessingGui.add(settings.query, 'motionBlurQuality', settings.motionBlurQualityList).name('motion quality').onChange(function(val){
        motionBlur.linesRenderTargetScale = settings.motionBlurQualityMap[val];
        motionBlur.resize();
    });
    var controlList = [motionMaxDistance, motionMultiplier, motionQuality];
    motionBlurControl.onChange(enableGuiControl.bind(this, controlList));
    enableGuiControl(controlList, settings.motionBlur);

    var bloomControl = postprocessingGui.add(settings, 'bloom');
    var bloomRadiusControl = postprocessingGui.add(bloom, 'blurRadius', 0, 3).name('bloom radius');
    var bloomAmountControl = postprocessingGui.add(bloom, 'amount', 0, 3).name('bloom amount');
    controlList = [bloomRadiusControl, bloomAmountControl];
    bloomControl.onChange(enableGuiControl.bind(this, controlList));
    enableGuiControl(controlList, settings.bloom);
    postprocessingGui.open();

    function enableGuiControl(controls, flag) {
        controls = controls.length ? controls : [controls];
        var control;
        for(var i = 0, len = controls.length; i < len; i++) {
            control = controls[i];
            control.__li.style.pointerEvents = flag ? 'auto' : 'none';
            control.domElement.parentNode.style.opacity = flag ? 1 : 0.1;
        }
    }

    var preventDefault = function(evt){evt.preventDefault();this.blur();};
    Array.prototype.forEach.call(_gui.domElement.querySelectorAll('input[type="checkbox"],select'), function(elem){
        elem.onkeyup = elem.onkeydown = preventDefault;
        elem.style.color = '#000';
    });

    _logo = document.querySelector('.logo');
    _instruction = document.querySelector('.instruction');
    document.querySelector('.footer').style.display = 'block';
    _footerItems = document.querySelectorAll('.footer span');

    window.addEventListener('resize', _onResize);
    window.addEventListener('mousemove', _onMove);
    window.addEventListener('touchmove', _bindTouch(_onMove));
    window.addEventListener('keyup', _onKeyUp);

    _time = Date.now();
    _onResize();
    _loop();

}

function _onKeyUp(evt) {
    if(evt.keyCode === 32) {
        settings.speed = settings.speed === 0 ? 1 : 0;
        settings.dieSpeed = settings.dieSpeed === 0 ? 0.015 : 0;
    }
}

function _bindTouch(func) {
    return function (evt) {
        if(settings.isMobile && evt.preventDefault) {
            evt.preventDefault();
        }
        func(evt.changedTouches[0]);
    };
}

function _onMove(evt) {
    settings.mouse.x = (evt.pageX / _width) * 2 - 1;
    settings.mouse.y = -(evt.pageY / _height) * 2 + 1;
}

function _onResize() {
    _width = window.innerWidth;
    _height = window.innerHeight;

    postprocessing.resize(_width, _height);

}

function _loop() {
    var newTime = Date.now();
    raf(_loop);
    if(settings.useStats) _stats.begin();
    _render(newTime - _time, newTime);
    if(settings.useStats) _stats.end();
    _time = newTime;
}


function _render(dt, newTime) {

    motionBlur.skipMatrixUpdate = !(settings.dieSpeed || settings.speed) && settings.motionBlurPause;

    var ratio;
    _bgColor.setStyle(settings.bgColor);
    var tmpColor = floor.mesh.material.color;
    tmpColor.lerp(_bgColor, 0.05);
    _scene.fog.color.copy(tmpColor);
    _renderer.setClearColor(tmpColor.getHex());

    _initAnimation = Math.min(_initAnimation + dt * 0.00025, 1);
    simulator.initAnimation = _initAnimation;

    _control.maxDistance = _initAnimation === 1 ? 1000 : math.lerp(1000, 450, ease.easeOutCubic(_initAnimation));
    _control.update();
    lights.update(dt, _camera);

    // update mouse3d
    _camera.updateMatrixWorld();
    _ray.origin.setFromMatrixPosition( _camera.matrixWorld );
    _ray.direction.set( settings.mouse.x, settings.mouse.y, 0.5 ).unproject( _camera ).sub( _ray.origin ).normalize();
    var distance = _ray.origin.length() / Math.cos(Math.PI - _ray.direction.angleTo(_ray.origin));
    _ray.origin.add( _ray.direction.multiplyScalar(distance * 1.0));
    simulator.update(dt);
    particles.update(dt);

    ratio = Math.min((1 - Math.abs(_initAnimation - 0.5) * 2) * 1.2, 1);
    var blur = (1 - ratio) * 10;
    _logo.style.display = ratio ? 'block' : 'none';
    if(ratio) {
        _logo.style.opacity = ratio;
        _logo.style.webkitFilter = 'blur(' + blur + 'px)';
        ratio = (0.8 + Math.pow(_initAnimation, 1.5) * 0.5);
        if(_width < 580) ratio *= 0.5;
        _logo.style.transform = 'scale3d(' + ratio + ',' + ratio + ',1)';
    }

    for(var i = 0, len = _footerItems.length; i < len; i++) {
        ratio = math.unLerp(0.5 + i * 0.01, 0.6 + i * 0.01, _initAnimation);
        _footerItems[i].style.transform = 'translate3d(0,' + ((1 - Math.pow(ratio, 3)) * 50) + 'px,0)';
    }

    ratio = math.unLerp(0.5, 0.6, _initAnimation);
    if(!settings.isMobile) {
        _instruction.style.display = ratio ? 'block' : 'none';
        _instruction.style.transform = 'translate3d(0,' + ((1 - ratio * ratio) * 50) + 'px,0)';
    }

    fxaa.enabled = !!settings.fxaa;
    motionBlur.enabled = !!settings.motionBlur;
    bloom.enabled = !!settings.bloom;

    // _renderer.render(_scene, _camera);
    postprocessing.render(dt, newTime);

}

mobile.pass(init);
