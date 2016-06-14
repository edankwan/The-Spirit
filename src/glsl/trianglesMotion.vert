uniform sampler2D texturePosition;
uniform sampler2D texturePrevPosition;

attribute vec3 positionFlip;
attribute vec2 fboUV;

uniform float flipRatio;
uniform mat4 u_prevModelViewMatrix;

varying vec2 v_motion;

void main() {

    vec4 positionInfo = texture2D( texturePosition, fboUV );
    vec4 prevPositionInfo = texture2D( texturePrevPosition, fboUV );
    gl_Position = projectionMatrix * modelViewMatrix * vec4(positionInfo.xyz + (position + (positionFlip - position) * flipRatio) * smoothstep(0.0, 0.2, positionInfo.w), 1.0);

    vec4 pos = projectionMatrix * modelViewMatrix * vec4(positionInfo.xyz, 1.0);
    vec4 prevPos = projectionMatrix * u_prevModelViewMatrix * vec4(prevPositionInfo.xyz, 1.0);
    v_motion = (pos.xy / pos.w - prevPos.xy / prevPos.w) * 0.5 * step(positionInfo.w, prevPositionInfo.w);

}
