var undef;
var _prefixes = 'Webkit Moz O ms'.split(' ');
var _dummyStyle = document.createElement('div').style;
var _win = window;
var _doc = document;
var _body = _doc.body;
var _ua = navigator.userAgent.toLowerCase();

function init() {

    exports.videoFormatTestOrders = ['video/mp4','video/webm','video/ogg'];
    exports.audioFormatTestOrders = ['audio/mp3','audio/ogg'];

    _testMediaFormat('video');
    _testMediaFormat('audio');

    exports.isIFrame = _win.self !== _win.top;

    exports.isPhantom = !!_win.callPhantom;

    exports.transitionStyle = _getPropFromIndex('transition', _getPropIndex('transition'));
    exports.transformStyle = _getPropFromIndex('transform', _getPropIndex('transform'));
    exports.transform3dStyle = _getPropFromIndex('transform', _getPropIndex('perspective'));
    exports.transformPerspectiveStyle = _getPropFromIndex('perspective', _getPropIndex('perspective'));
    exports.transformOriginStyle = _getPropFromIndex('transformOrigin', _getPropIndex('transformOrigin'));
    exports.isRetina = _win.devicePixelRatio && _win.devicePixelRatio >= 1.5;
    exports.webkitFilter = _body.style.webkitFilter === undef ? false : 'webkitFilter';
    exports.isSupportOpacity = _doc.documentElement.style.opacity !== undef;

    exports.isChrome = _ua.indexOf('chrome') > -1;
    exports.isStandalone = _win.navigator.standalone;
    exports.isIOS = /iphone|ipod|ipad/.test(_ua);
    exports.isSafari = /safari/.test(_ua);
    exports.isIOSWebView = exports.isIOS && !exports.isStandalone && !exports.isSafari;

    exports.isSupportPreserve3d = !!_getPropFromIndex('transformStyle', _getPropIndex('transformStyle'), 'preserve-3d');

    if(exports.afterInit) {
        exports.afterInit(exports);
    }
}

function _testMediaFormat(type) {
    var dom;
    try {
        switch(type) {
            case 'video':
                dom = new _win.Video();
                break;
            case 'audio':
                dom = new _win.Audio();
                break;
            default:
        }
    }catch(e){
        dom = _doc.createElement(type);
    }
    var orders = exports[type + 'FormatTestOrders'];
    var format;
    for(var i = 0, len = orders.length; i < len; i++) {
        if(dom.canPlayType && dom.canPlayType(orders[i])) {
            format = orders[i].substr(orders[i].indexOf('/') + 1);
            break;
        }
    }
    exports[type + 'Format'] = format;
}

function _getPropIndex( prop ) {
    var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1);
    var i = _prefixes.length;
    while(i--) {
        if(_dummyStyle[_prefixes[i] + ucProp] !== undef ) {
            return i + 2;
        }
    }
    if(_dummyStyle[prop] !== undef) {
        return 1;
    }
    return 0;
}

function _getPropFromIndex(prop, index, testCase) {
    prop = index > 1 ? _prefixes[index - 2] + prop.charAt(0).toUpperCase() + prop.slice(1) : index == 1 ? prop : false;
    if(prop && testCase) {
        _dummyStyle[prop] = testCase;
        if(_dummyStyle[prop] !== testCase) {
            return false;
        }
    }
    return prop;
}

init();
