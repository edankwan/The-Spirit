// http://jsfiddle.net/greggman/gSnHZ/

// sliceInfo.x = size aka volumeSliceColumn * volumeSliceRow
// sliceInfo.y = slicesPerRow
// sliceInfo.z = 1.0 / slicesPerRow
// sliceInfo.w = 1.0 / floor((sliceInfo.x + sliceInfo.y - 1.0) * sliceInfo.z);
vec2 coord3To2(vec3 texCoord, vec4 sliceInfo) {
    float sliceZ = floor(texCoord.z * sliceInfo.x);
    vec2 slicePixelSize = sliceInfo.zw / sliceInfo.x;
    return sliceInfo.zw * vec2(mod(sliceZ, sliceInfo.y), floor(sliceZ * sliceInfo.z)) + slicePixelSize * 0.5 + texCoord.xy * (sliceInfo.zw - slicePixelSize);
}

#pragma glslify: export(coord3To2)
