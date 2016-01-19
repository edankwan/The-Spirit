// http://jsfiddle.net/greggman/gSnHZ/

// vec2 computeSliceOffset(float slice, float slicesPerRow, vec2 sliceSize) {
//  return sliceSize * vec2(mod(slice, slicesPerRow), floor(slice / slicesPerRow));
// }

vec2 computeSliceOffset(float slice, vec4 sliceInfo) {
    return sliceInfo.zw * vec2(mod(slice, sliceInfo.y), floor(slice * sliceInfo.z));
}


// sliceInfo.x = size aka volumeSliceColumn * volumeSliceRow
// sliceInfo.y = slicesPerRow
// sliceInfo.z = 1.0 / slicesPerRow
// sliceInfo.w = 1.0 / floor((sliceInfo.x + sliceInfo.y - 1.0) * sliceInfo.z);

vec4 sampleAs3DTexture(sampler2D tex, vec3 texCoord, vec4 sliceInfo) {
    // vec4 sampleAs3DTexture(sampler2D tex, vec3 texCoord, float size, float slicesPerRow, vec2 sliceSize) {
    // float numRows = floor((size + slicesPerRow - 1.0) / slicesPerRow);
    float slice = texCoord.z * sliceInfo.x;
    float sliceZ = floor(slice);

    // vec2 sliceSize = vec2(1.0 / slicesPerRow, 1.0 / numRows);

    vec2 slice0Offset = computeSliceOffset(sliceZ, sliceInfo);
    vec2 slice1Offset = computeSliceOffset(sliceZ + 1.0, sliceInfo);

    vec2 slicePixelSize = sliceInfo.zw / sliceInfo.x;

    vec2 uv = slicePixelSize * 0.5 + texCoord.xy * (sliceInfo.zw - slicePixelSize);
    vec4 slice0Color = texture2D(tex, slice0Offset + uv);
    vec4 slice1Color = texture2D(tex, slice1Offset + uv);
    return mix(slice0Color, slice1Color, fract(slice));
}

#pragma glslify: export(sampleAs3DTexture)
