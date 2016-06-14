uniform sampler2D texturePosition;
uniform sampler2D texturePrevPosition;

uniform mat4 u_prevModelViewMatrix;

varying vec2 v_motion;

void main() {

    vec4 positionInfo = texture2D( texturePosition, position.xy );
    vec4 prevPositionInfo = texture2D( texturePrevPosition, position.xy );


    vec4 mvPosition = modelViewMatrix * vec4( positionInfo.xyz, 1.0 );
    gl_PointSize = 1300.0 / length( mvPosition.xyz ) * smoothstep(0.0, 0.2, positionInfo.w);

    vec4 pos = projectionMatrix * mvPosition;
    vec4 prevPos = projectionMatrix * u_prevModelViewMatrix * vec4(prevPositionInfo.xyz, 1.0);
    v_motion = (pos.xy / pos.w - prevPos.xy / prevPos.w) * 0.5 * step(positionInfo.w, prevPositionInfo.w);

    gl_Position = pos;

}
