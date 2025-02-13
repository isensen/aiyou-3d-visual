import {
    Group, Shape, Layers, ShapeBufferGeometry, SphereBufferGeometry,
    MeshBasicMaterial, Mesh, CylinderBufferGeometry, BufferGeometry, LineBasicMaterial,
    LineSegments, EdgesGeometry, Line, Vector3, CurvePath, LineCurve3, TubeGeometry, TextBufferGeometry,
    Font, CanvasTexture, SpriteMaterial, Sprite, ExtrudeGeometry, RepeatWrapping, DoubleSide, NearestFilter,
    BoxBufferGeometry
} from 'three'

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader'

import * as html2canvas from 'html2canvas'
import { BASE_PATH, computeUV, mergeImage, textureLoader } from './util'

// 对传入的conf初始化
export function initConfig(mesh, conf?) {
    if (conf) {
        const { position, rotation, scale, repeat } = conf;
        if (position) {
            const { x, y, z } = position;
            typeof x !== 'undefined' ? (mesh.position.x = x) : null;
            typeof y !== 'undefined' ? (mesh.position.y = y) : null;
            typeof z !== 'undefined' ? (mesh.position.z = z) : null;
        }
        if (rotation) {
            const { x, y, z } = rotation;
            typeof x !== 'undefined' ? (mesh.rotation.x = x) : null;
            typeof y !== 'undefined' ? (mesh.rotation.y = y) : null;
            typeof z !== 'undefined' ? (mesh.rotation.z = z) : null;
        }
        if (scale) {
            const { x, y, z } = scale;
            typeof x !== 'undefined' ? (mesh.scale.x = x) : null;
            typeof y !== 'undefined' ? (mesh.scale.y = y) : null;
            typeof z !== 'undefined' ? (mesh.scale.z = z) : null;
        }
        if (repeat) {
            const { x, y } = repeat;
            if (typeof x !== 'undefined') {
                // 设置x方向的重复数
                mesh.wrapS = RepeatWrapping;
                mesh.repeat.x = x;
            }
            if (typeof y !== 'undefined') {
                // 设置y方向的重复数
                mesh.wrapT = RepeatWrapping;
                mesh.repeat.y = y;
            }
        }
    }
}
// 创建一个分组group
export function createGroup(...arr) {
    const group = new Group();
    arr.forEach((item) => group.add(item));
    return group;
}
// 创建一个Layer，用于实现局部辉光
export function createLayer(num) {
    const layer = new Layers();
    layer.set(num);
    return layer;
}
// 创建一个克隆体
export function createClone(mesh, conf) {
    const newMesh = mesh.clone();
    initConfig(newMesh, conf);
    return newMesh;
}
// 创建一个导入的模型
export function createImportModel(path, conf) {
    return new Promise((res) => {
        const dracoLoader = new DRACOLoader().setDecoderPath("./js/draco/");
        const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
        loader.load(path, function (gltf) {
            const colorArr = [
                "#999",
                "rgb(110, 105, 112)",
                "#7fffd4",
                "#ffe4c4",
                "#faebd7",
                "#a9a9a9",
                "#5f9ea0",
                "#6495ed",
            ];
            gltf.scene.traverse(function (child) {
                if (child instanceof Mesh) {
                    //为几何体每个部件添加不同颜色材质
                    child.material = new MeshBasicMaterial({
                        color: colorArr.pop(),
                    });
                    // 为几何体添加线框，更逼真
                    if (colorArr.length === 1) {
                        const material = new LineBasicMaterial({ color: "#dcdcdc" });
                        // material.depthTest = false;// 深度测试，若开启则是边框透明的效果
                        const mesh = new LineSegments(
                            new EdgesGeometry(child.geometry),
                            material
                        );
                        child.add(mesh); // 往mesh里再加入一个线框mesh
                    }
                }
            });
            initConfig(gltf.scene, conf);
            res(gltf.scene);
        });
    });
}
// 创建一个地球（球体）
export function createEarth(conf) {
    const geometry = new SphereBufferGeometry(5, 64, 64);
    const texture = textureLoader.load(BASE_PATH + "/img/earth.png");
    const material = new MeshBasicMaterial({ map: texture });
    const mesh = new Mesh(geometry, material);
    initConfig(mesh, conf);
    mesh.layers.enable(1);
    return mesh;
}
// 创建一台机器（圆柱）
export function createMachine(path, conf) {
    const geometry = new CylinderBufferGeometry(5, 5, 2, 64);
    const texture = createTexture(path);
    const bottomMaterial = new MeshBasicMaterial({
        // color: "#1296DB",
        map: texture,
    });
    const sideMaterial = new MeshBasicMaterial({
        color: "#1296DB",
    });
    const materials = [sideMaterial, bottomMaterial, bottomMaterial];
    const mesh = new Mesh(geometry, materials);
    initConfig(mesh, conf);
    return mesh;
}
// 创建一台机器（立方体）
export function createComputer(width, height, depth, conf) {
    const geometry = new BoxBufferGeometry(
        width,
        height,
        depth,
        64,
        64,
        64
    );
    const texture = createTexture("./img/fan_grid.jpg");
    const material = new MeshBasicMaterial({
        color: "#1296DB",
        map: texture,
        side: DoubleSide,
    });
    const mesh1 = new Mesh(geometry, material);
    const mesh2 = new Mesh(geometry, material);
    mesh2.position.x = 5;
    mesh2.position.z = 3;
    const mesh = createGroup(mesh1, mesh2);
    initConfig(mesh, conf);
    return mesh;
}
// 创建一个弧角矩形
export function createArcRect(width, height, arc) {
    const shape = new Shape();
    const w = width - arc;
    const h = height - arc;
    shape.moveTo(w, height);
    shape.arc(0, -1 * arc, arc, Math.PI / 2, 0, true);
    shape.lineTo(width, arc);
    shape.arc(-1 * arc, 0, arc, 0, (3 * Math.PI) / 2, true);
    shape.lineTo(arc, 0);
    shape.arc(0, arc, arc, (3 * Math.PI) / 2, Math.PI, true);
    shape.lineTo(0, h);
    shape.arc(arc, 0, arc, Math.PI, Math.PI / 2, true);
    shape.lineTo(w, height);
    return shape;
}
// 创建一个平面
export function createFace(width, height, arc, conf) {
    const shape = createArcRect(width, height, arc);
    const geometry = new ShapeBufferGeometry(shape, 64);
    const material = new MeshBasicMaterial({
        color: "rgb(159, 161, 162)",
        side: DoubleSide,
        transparent: true,
        opacity: 1,
    });
    const mesh = new Mesh(geometry, material);
    initConfig(mesh, conf);
    // mesh.receiveShadow = true; // 使该物体能接受阴影
    return mesh;
}
// 创建一条线，可以是曲线，传入一组点
export function createLine(pointsArr) {
    pointsArr = pointsArr.map((point) => new Vector3(...point));
    const geometry = new BufferGeometry().setFromPoints(pointsArr);
    const material = new LineBasicMaterial({ color: 0x0000ff });
    const line = new Line(geometry, material);
    return line;
}
// 创建一条路径，可以是三维路径，传入一组点
export function createPath(pointsArr) {
    pointsArr = pointsArr.map((point) => new Vector3(...point));

    // 方法一：自定义三维路径
    const path = new CurvePath<Vector3>();
    for (let i = 0; i < pointsArr.length - 1; i++) {
        const lineCurve = new LineCurve3(pointsArr[i], pointsArr[i + 1]);
        path.curves.push(lineCurve);
    }
    // 方法二：利用CatmullRomCurve3 创建三位路径，不过是平滑的三维样条曲线
    // const path = new THREE.CatmullRomCurve3(pointsArr);

    return path;
}
// 创建一种纹理（此处用来模拟管线动画）
export function createTexture(path, conf?) {
    const texture = textureLoader.load(path);
    initConfig(texture, conf);
    return texture;
}
// 创建一条管道（自己模拟TubeGeometry实现的管线）
export async function createMyTube(pointsArr) {
    // shape为圆形，可以设置管道半径
    const shape = new Shape();
    shape.absarc(0, 0, 0.3, 0, Math.PI * 2, true);

    // 自定义管道路径
    const path = createPath(pointsArr);
    const extrudeSettings = {
        bevelEnabled: false,
        steps: 1, // step设置为1，保证侧面只有一个平面，如果想更高，可以通过scale放大
        extrudePath: path, // extrudePath需要是THREE.Curve对象
        // curve是基类，表示曲线，子类有lineCurve二维直线，lineCurve3三维直线
        // curvePath是一组curve构成的路径，可以算是curve的子类，子类path二维路径，shape是path的子类
    };
    const geometry = new ExtrudeGeometry(shape, extrudeSettings as unknown);

    // 模拟管线运动动画
    const base64 = await mergeImage(BASE_PATH + "/img/1.png", BASE_PATH + "/img/2.png", 1, 10);
    const texture = createTexture(base64, { repeat: { x: 1 } });
    const material = new MeshBasicMaterial({
        map: texture,
        transparent: true,
    });
    const mesh = new Mesh(geometry, material);
    mesh.scale.z = 64;
    return { texture, mesh };
}
// 创建一条管道利用 TubeGeometry
export async function createTube(...pointsArr) {
    const path = createPath(pointsArr);
    const geometry = new TubeGeometry(path, 64, 0.3);

    // 模拟管线运动动画，将两个素材图按比例合并，然后生成贴图texture
    const base64 = await mergeImage(BASE_PATH + "/img/2.png", BASE_PATH + "/img/1.png", 1, 7);

    const texture = createTexture(base64, { repeat: { x: 1 } });
    const material = new MeshBasicMaterial({
        map: texture,
        transparent: true,
    });
    const mesh = new Mesh(geometry, material);
    return { texture, mesh };
}
// 创建立体3D文字
export function createText(text, color, conf) {
    return new Promise((res) => {
        // new THREE.FontLoader().load("./font/simhei.min.json", function (font) {
        new TTFLoader().load(BASE_PATH + "/font/msyhbd.ttf", function (data) {
            const font = new Font(data);
            const geometry = new TextBufferGeometry(text, {
                font,
                size: 3,
                height: 1,
                curveSegments: 64,
            });
            geometry.center();
            const material = new MeshBasicMaterial({ color });
            const mesh = new Mesh(geometry, material);
            initConfig(mesh, conf);
            res(mesh);
        });
    });
}
// 创建文字画布
export function createTextCanvas(text) {
    const canvas = document.createElement("canvas");
    // 画布最合适的适配尺寸
    canvas.height = 300;
    canvas.width = 300;
    canvas.style.border = "1px solid red";
    canvas.style.borderRadius = "35px";
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(163, 92, 48, 1)";
    // ctx.fillRect(0, 0, 300, 300);
    ctx.fillRect(50, 50, 200, 200);
    ctx.font = "80px Microsoft YaHei";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "green";
    ctx.fillText(text, 150, 150);
    return canvas;
}
// 创建永远朝向自己这一面的文字
export async function createSpriteText(selcetor, conf) {
    const elem = document.querySelector(selcetor);
    const canvas = await html2canvas(elem, {
        x: elem.offsetLeft, // 加入x、y配置，防止画布偏移 产生部分空白
        y: elem.offsetTop,
    });
    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const texture = new CanvasTexture(canvas);
    texture.magFilter = NearestFilter; // 提高清晰度
    texture.minFilter = NearestFilter;
    const spriteMaterial = new SpriteMaterial({
        map: texture,
        opacity: 0.8,
    });
    const sprite = new Sprite(spriteMaterial);
    const shape = createArcRect((15 * canvasW) / canvasH, 15, 2.5);
    const geometry = new ShapeBufferGeometry(shape, 64);
    computeUV(geometry);
    sprite.geometry = geometry;
    initConfig(sprite, conf);
    return { spriteMaterial, sprite };
}
// 创建围绕物体的辉光效果
export function createLightBeam(width, height, arc, color, conf) {
    const shape = createArcRect(width, height, arc);
    const extrudeSettings = {
        steps: 64,
        depth: 1, // step设置为1，保证侧面只有一个平面，如果想更高，可以通过scale放大
        bevelEnabled: false,
    };
    const geometry = new ExtrudeGeometry(shape, extrudeSettings);
    const bottomMaterial = new MeshBasicMaterial({
        visible: false,
    });
    const texture = createTexture(BASE_PATH + "/img/gradient.png");
    const sideMaterial = new MeshBasicMaterial({
        map: texture,
        side: DoubleSide,
        transparent: true,
        opacity: 1,
        depthWrite: true,
        color,
    });
    const mesh = new Mesh(geometry, [bottomMaterial, sideMaterial]);
    initConfig(mesh, conf);
    return mesh;
}