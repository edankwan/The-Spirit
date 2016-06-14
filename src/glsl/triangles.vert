uniform sampler2D texturePosition;

// chunk(shadowmap_pars_vertex);

varying float vLife;
attribute vec3 positionFlip;
attribute vec2 fboUV;

uniform float flipRatio;
uniform mat4 cameraMatrix;

void main() {

    vec4 positionInfo = texture2D( texturePosition, fboUV );
    vec3 pos = positionInfo.xyz;

    vec4 worldPosition = modelMatrix * vec4( pos, 1.0 );
    vec4 mvPosition = viewMatrix * worldPosition;

    vLife = positionInfo.w;

    mvPosition += vec4((position + (positionFlip - position) * flipRatio) * smoothstep(0.0, 0.2, positionInfo.w), 0.0);
    gl_Position = projectionMatrix * mvPosition;
    worldPosition = cameraMatrix * mvPosition;

    // chunk(shadowmap_vertex);

}
