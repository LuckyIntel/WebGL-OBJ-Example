/*
    This script includes basic shader vertex and fragment files.
*/

const shaderVert = [
    "#version 300 es",
    "precision mediump float;",
    "in vec3 position;",
    "uniform vec3 scale;",
    "void main() {",
    "gl_Position = vec4(position * scale, 1.0);}"
].join("\n");

const shaderFrag = [
    "#version 300 es",
    "precision mediump float;",
    "out vec4 FragColor;",
    "void main() {",
    "FragColor = vec4(0.7, 0.7, 0.7, 1.0);}"
].join("\n");