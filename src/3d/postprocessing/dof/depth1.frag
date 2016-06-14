
uniform vec2 u_mouse;

uniform sampler2D u_distance;

void main() {

    gl_FragColor = vec4(texture2D( u_distance, (u_mouse + 1.0) * 0.5).a, 0.0, 0.0, 1.0);

}
