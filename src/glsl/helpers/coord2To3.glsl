// http://jsfiddle.net/greggman/gSnHZ/

vec3 coord2To3(vec2 texCoord, float size, float slicesPerRow) {
    float numRows = floor((size + slicesPerRow - 1.0) / slicesPerRow);
    float col = texCoord.x * slicesPerRow;
    float row = texCoord.y * numRows;
    return vec3(
        fract(col),
        fract(row),
        (floor(col) + floor(row) * slicesPerRow) / size
    );
}

#pragma glslify: export(coord2To3)
