/*
    This code is written by LuckyIntel, a github user.
    This is my first time using WebGL so there
    can be something wrong in the code.In this
    code you just choose an OBJ file you want
    then this code loads that OBJ file, gets it's vertices
    and indices then creates meshes with it.Make sure your model
    is triangulated while exported as .obj file.Or else it won't work.
*/

const version = 0.1;

const Canvas = document.createElement("canvas");
Canvas.width = 500;
Canvas.height = 500;
document.body.append(Canvas); // Default website has no canvas.So we create one and append to body.

const gl = Canvas.getContext("webgl2");
let supported = true;
let model = null;

if (gl === null) { alert("WebGL 2 is not supported."); supported = false; }; // Compatibility check.

function RGB(R, G, B) { return {r: R / 255, g: G / 255, b: B / 255}; }

function render(Color)
{
    gl.clearColor(Color.r, Color.g, Color.b, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
};

function vec3(f1 = null, f2 = null, f3 = null)
{
    /* 
        Creates a vector value with 3 variables : (f1, f2, f3) 
    */
    if (f1 != null && f2 == null && f3 == null) f3 = f2 = f1;

    this.x = f1;
    this.y = f2;
    this.z = f3;
};

class Shader
{
    /*
        We create a shader program here.
    */
    // Create vertex and fragment shaders.
    #vShader = gl.createShader(gl.VERTEX_SHADER);
    #fShader = gl.createShader(gl.FRAGMENT_SHADER);
    constructor(vertexSource, fragmentSource)
    {
        // Sourcing and compiling of shaders.
        gl.shaderSource(this.#vShader, vertexSource);
        gl.shaderSource(this.#fShader, fragmentSource);
        gl.compileShader(this.#vShader);
        gl.compileShader(this.#fShader);
        
        // Debugging shader compiling.
        if (gl.getShaderParameter(this.#vShader, gl.COMPILE_STATUS) == false)
        {
            console.error(`An error occured while compiling vertex shader : ${gl.getShaderInfoLog(this.#vShader)}`);
        };
        if (gl.getShaderParameter(this.#fShader, gl.COMPILE_STATUS) == false)
        {
            console.error(`An error occured while compiling fragment shader : ${gl.getShaderInfoLog(this.#fShader)}`);
        };

        // Creating of shader program, attaching shaders to it and linking our program.
        this.id = gl.createProgram();
        gl.attachShader(this.id, this.#vShader);
        gl.attachShader(this.id, this.#fShader);
        gl.linkProgram(this.id);

        // Debugging program linking.
        if (gl.getProgramParameter(this.id, gl.LINK_STATUS) == false)
        {
            console.error(`An error occured while linking fragment shader : ${gl.getProgramInfoLog(this.id)}`);
        };

        // Delete shaders after linking.They are useless now.
        gl.deleteShader(this.#vShader);
        gl.deleteShader(this.#fShader);
    };
    findUniform(uniString)
    {
        return gl.getUniformLocation(this.id, uniString); // Finds the location of an uniform.
    };
    use() 
    {
        gl.useProgram(this.id); // Uses the shader program;
    };
};

class Mesh
{
    /*
        We create our mesh here, it uses VAOs, VBOs and EBOs to create
        something renderable in our screen.
    */
    // Creating a vertex array object then creating 2 buffer objects one for vertices(VBO) and one for indices/elements(EBO)
    #VAO = gl.createVertexArray(); // Same purpose as glGenVertexArrays()
    #VBO = gl.createBuffer(); // Same purpose as glGenBuffers()
    #EBO = gl.createBuffer(); // Same purpose as glGenBuffers()
    #indices = null;
    constructor(meshVertices, meshIndices)
    {
        this.#indices = meshIndices;
        // Bind our VAO, VBO and EBO.Then give both of the buffer objects their data.
        gl.bindVertexArray(this.#VAO);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.#VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshVertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#EBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(meshIndices), gl.STATIC_DRAW);
        
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(0);
        
        gl.bindVertexArray(null);
    };
    render(meshShader, scale)
    {
        gl.uniform3f(meshShader.findUniform("scale"), scale.x, scale.y, scale.z);
        // Bind VAO, draw and then unbind the VAO so we wrongly don't mess it up.
        gl.bindVertexArray(this.#VAO);
        gl.drawElements(gl.TRIANGLES, this.#indices.length, gl.UNSIGNED_INT, null);
        gl.bindVertexArray(null);
    };
};

class Model
{
    /*
        This is our Model class, in this class
        we basically load an OBJ file, then get it's vertices and indices
        to create meshes.Also this class saves created meshes in an array
        to easily render all of the meshes with just one function.
    */
    #meshes = new Array(); // An array that stores our meshes
    constructor(fileSource)
    {
        this.scale = new vec3(0.5);
        this.#parseFile(fileSource);
    };
    #parseFile(src)
    {
        /*
            This function just gets the source code of the OBJ file,
            splits into arrays, checks every line for a prefix,
            and creates vertices and indices for each object.
        */
        let seperated = src.split("\n");
        let lastObject = null;
        let verticesList = new Array();
        let indicesList = new Array();
        
        //let vCount = 0, fCount = 0;
        for (let i = 0; i < seperated.length; i++)
        {
            switch (seperated[i][0])
            {
                case "o":
                    if (lastObject !== null)
                    {
                        this.#createMesh(verticesList, indicesList);
                        verticesList = new Array();
                        indicesList = new Array();
                    };
                    lastObject = seperated[i].replace("o ", "");
                    //console.log(lastObject);
                    break;
                case "v":
                    if (seperated[i][1] == "n" || seperated[i][1] == "t") break; // Ignore if second letter is n(normal) or t(texture)
                    let vertex = seperated[i]
                    .replace("v ", "")
                    .split(" ");
                    vertex.forEach((e) => {
                        verticesList.push(parseFloat(e));
                    });
                    //vCount++;
                    break;
                case "f":
                    let indexList = seperated[i]
                    .replace("f ", "")
                    .split(" ");
                    indexList.forEach((e) => {
                        indexList[indexList.indexOf(e)] = e.split("/");
                    });
                    indexList.forEach((e) => {
                        indicesList.push(
                            parseInt(indexList[indexList.indexOf(e)][0]) - 1 // Just get the vertex indices.
                        );
                    });
                    //fCount++;
                    break;
                default:
                    break;
            };
            if (i == seperated.length - 1) this.#createMesh(verticesList, indicesList);
        };
        //console.log(`${vCount} | ${fCount}`);
    };
    #createMesh(meshVertices, meshIndices)
    {
        /*
            Create a mesh and add it to the meshes list.
        */
        //console.log(meshVertices, meshIndices);
        this.#meshes.push(new Mesh(meshVertices, meshIndices));
    };
    render(modelShader)
    {
        /*
            Render every mesh in the meshes list.
        */
        for (let i = 0; i < this.#meshes.length; i++)
        {
            this.#meshes[i].render(modelShader, this.scale);
        };
    };
};

function loadOBJ(file)
{
    /*
        Loads OBJ file on the click of the input button.
    */
    file = file.target.files[0];
    if (!file) return;
    let filestream = new FileReader();
    filestream.onload = (e) => 
    {
        model = new Model(e.target.result);
    };
    filestream.readAsText(file);
};

let shader = new Shader(shaderVert, shaderFrag);

gl.enable(gl.CULL_FACE); // Does what it says.
gl.enable(gl.DEPTH_TEST); // Also does what it says.
gl.cullFace(gl.BACK); // We need this because we don't want to render back vertices since we don't even see them.
gl.viewport(0, 0, Canvas.width, Canvas.height);

console.log(`WebGL OBJ Example V${version}`);

function animate()
{
    /*
        Rendering loop.
    */
    requestAnimationFrame(animate);
    render(RGB(43, 153, 201));
    shader.use();
    if (model) 
    {
        model.render(shader); // Render model if ready.
    };
};
if (supported) animate();