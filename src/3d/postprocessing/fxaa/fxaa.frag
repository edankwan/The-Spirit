uniform vec2 u_resolution;
uniform sampler2D u_texture;

#pragma glslify: fxaa = require(glsl-fxaa)

void main() {
    gl_FragColor = fxaa(u_texture, gl_FragCoord.xy, u_resolution);
}
