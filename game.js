import * as THREE from "https://esm.sh/three@0.160.0";

import {
  GLTFLoader
} from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

import {
  FBXLoader
} from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";

import {
  OBJLoader
} from "https://esm.sh/three@0.160.0/examples/jsm/loaders/OBJLoader.js";

import {
  MTLLoader
} from "https://esm.sh/three@0.160.0/examples/jsm/loaders/MTLLoader.js";

import {
  STLLoader
} from "https://esm.sh/three@0.160.0/examples/jsm/loaders/STLLoader.js";

import {
  clone as cloneSkinned
} from "https://esm.sh/three@0.160.0/examples/jsm/utils/SkeletonUtils.js";


const $ = (selector, root = document) =>
  root.querySelector(selector);

const clamp = (number, min, max) =>
  Math.max(min, Math.min(max, number));

const rand = (min, max) =>
  min + Math.random() * (max - min);

const pick = array =>
  array[Math.floor(Math.random() * array.length)];


const SAVE_KEY =
  "galaxy-pals-mixed-models-v1";


/* =========================================================
   PAL LIBRARY
========================================================= */

const PAL_LIBRARY = [

  {
    id: "anubis",
    name: "Anubis",
    element: "Ground",

    files: [
      "assets/pals/anubis.glb",
      "assets/pals/anubis.fbx"
    ],

    height: 2.4,
    hp: 230,
    speed: 4.5,
    rarity: 4,
    mount: "ground"
  },

  {
    id: "astegon",
    name: "Astegon",
    element: "Dragon",

    files: [
      "assets/pals/astegon.glb",
      "assets/pals/astegon.obj"
    ],

    height: 3.2,
    hp: 320,
    speed: 3.5,
    rarity: 5,
    mount: "flying"
  },

  {
    id: "chikipi",
    name: "Chikipi",
    element: "Neutral",

    files: [
      "assets/pals/chikipi.glb"
    ],

    height: 1.05,
    hp: 80,
    speed: 3,
    rarity: 1
  },

  {
    id: "chillet",
    name: "Chillet",
    element: "Ice",

    files: [
      "assets/pals/chillet.glb",
      "assets/pals/chillet.fbx"
    ],

    height: 2.2,
    hp: 170,
    speed: 4.6,
    rarity: 3,
    mount: "ground"
  },

  {
    id: "direhowl",
    name: "Direhowl",
    element: "Neutral",

    files: [
      "assets/pals/direhowl.glb",
      "assets/pals/direhowl.fbx"
    ],

    height: 1.55,
    hp: 145,
    speed: 5.4,
    rarity: 2,
    mount: "ground"
  },

  {
    id: "dupin",
    name: "Dupin",
    element: "Neutral",

    files: [
      "assets/pals/dupin.glb"
    ],

    height: 1.7,
    hp: 135,
    speed: 4,
    rarity: 2
  },

  {
    id: "fenglope",
    name: "Fenglope",
    element: "Neutral",

    files: [
      "assets/pals/fenglope.glb",
      "assets/pals/fenglope.fbx"
    ],

    height: 2,
    hp: 180,
    speed: 5.8,
    rarity: 4,
    mount: "ground"
  },

  {
    id: "foxparks",
    name: "Foxparks",
    element: "Fire",

    files: [
      "assets/pals/foxparks.glb",
      "assets/pals/foxparks.fbx"
    ],

    height: 1.25,
    hp: 110,
    speed: 4.4,
    rarity: 2
  },

  {
    id: "grizzbolt",
    name: "Grizzbolt",
    element: "Electric",

    files: [
      "assets/pals/grizzbolt.glb",
      "assets/pals/grizzbolt.fbx"
    ],

    height: 2.8,
    hp: 310,
    speed: 3.7,
    rarity: 5,
    mount: "ground"
  },

  {
    id: "jetragon",
    name: "Jetragon",
    element: "Dragon",

    files: [
      "assets/pals/jetragon.glb",
      "assets/pals/jetragon.fbx",
      "assets/pals/jetragon.stl"
    ],

    height: 3.2,
    hp: 650,
    speed: 6.4,
    rarity: 5,
    mount: "flying",
    boss: true
  },

  {
    id: "katress",
    name: "Katress",
    element: "Dark",

    files: [
      "assets/pals/katress.glb",
      "assets/pals/katress.fbx"
    ],

    height: 1.8,
    hp: 165,
    speed: 4.2,
    rarity: 3
  },

  {
    id: "kitsun",
    name: "Kitsun",
    element: "Fire",

    files: [
      "assets/pals/kitsun.glb",
      "assets/pals/kitsun.fbx",
      "assets/pals/kitsun.stl"
    ],

    height: 1.45,
    hp: 155,
    speed: 5.1,
    rarity: 4,
    mount: "ground"
  },

  {
    id: "leezpunk",
    name: "Leezpunk",
    element: "Dark",

    files: [
      "assets/pals/leezpunk.glb",
      "assets/pals/leezpunk.fbx"
    ],

    height: 1.55,
    hp: 140,
    speed: 4.1,
    rarity: 2
  },

  {
    id: "lily-everhart",
    name: "Lily Everhart",
    element: "Grass",

    files: [
      "assets/pals/lily-everhart.glb",
      "assets/pals/lily-everhart.fbx"
    ],

    height: 1.85,
    hp: 230,
    speed: 4,
    rarity: 4
  },

  {
    id: "lovander",
    name: "Lovander",
    element: "Neutral",

    files: [
      "assets/pals/lovander.glb",
      "assets/pals/lovander.fbx"
    ],

    height: 2,
    hp: 175,
    speed: 4.2,
    rarity: 3
  },

  {
    id: "lunaris",
    name: "Lunaris",
    element: "Neutral",

    files: [
      "assets/pals/lunaris.glb",
      "assets/pals/lunaris.fbx"
    ],

    height: 1.65,
    hp: 150,
    speed: 4.4,
    rarity: 3
  },

  {
    id: "mammorest",
    name: "Mammorest",
    element: "Grass",

    files: [
      "assets/pals/mammorest.glb",
      "assets/pals/mammorest.fbx"
    ],

    height: 3.6,
    hp: 480,
    speed: 2.8,
    rarity: 4,
    mount: "ground"
  },

  {
    id: "mau",
    name: "Mau",
    element: "Dark",

    files: [
      "assets/pals/mau.glb",
      "assets/pals/mau.obj"
    ],

    height: 1.1,
    hp: 95,
    speed: 4,
    rarity: 2
  },

  {
    id: "mossanda",
    name: "Mossanda",
    element: "Grass",

    files: [
      "assets/pals/mossanda.glb",
      "assets/pals/mossanda.fbx"
    ],

    height: 2.6,
    hp: 280,
    speed: 3.3,
    rarity: 4,
    mount: "ground"
  }

];


/* =========================================================
   SPHERES
========================================================= */

const SPHERES = [

  {
    name: "Basic Sphere",
    bonus: 1,
    color: 0x4da7ff
  },

  {
    name: "Mega Sphere",
    bonus: 1.35,
    color: 0x54d878
  },

  {
    name: "Giga Sphere",
    bonus: 1.75,
    color: 0xe0c74c
  },

  {
    name: "Hyper Sphere",
    bonus: 2.2,
    color: 0x9e6bea,
    model: "assets/items/hyper-sphere.glb"
  },

  {
    name: "Ultra Sphere",
    bonus: 2.8,
    color: 0xff9f43
  }

];


/* =========================================================
   SAVE
========================================================= */

const DEFAULT_SAVE = {

  level: 1,
  xp: 0,

  hp: 100,
  stamina: 100,
  hunger: 100,

  x: 0,
  y: 0,
  z: 8,

  selectedSphere: 0,

  spheres: [
    25,
    10,
    5,
    2,
    1
  ],

  party: [],
  box: []

};


function loadSave() {

  try {

    return {

      ...DEFAULT_SAVE,

      ...(
        JSON.parse(
          localStorage.getItem(
            SAVE_KEY
          )
        ) || {}
      )

    };

  } catch {

    return {
      ...DEFAULT_SAVE
    };

  }

}


const state = {

  save: loadSave(),

  keys: new Set(),

  creatures: [],
  mixers: [],
  cache: new Map(),

  target: null,

  companion: null,

  mounted: false,

  projectiles: [],

  heldSphere: null,

  charging: false,

  chargeStart: 0,

  feed: [],

  worldTime: 8,

  lastSave:
    performance.now(),

  player: null,

  sphereModel: null

};


const canvas =
  $("#gameCanvas");

const host =
  $("#gameShell");

const loading =
  $("#loading");


if (
  !canvas ||
  !host
) {

  throw new Error(
    "GALAXY PALS: index.html is missing the game canvas."
  );

}


/* =========================================================
   THREE WORLD
========================================================= */

const scene =
  new THREE.Scene();


scene.background =
  new THREE.Color(
    0x91cbea
  );


scene.fog =
  new THREE.FogExp2(
    0xa5d0df,
    0.0054
  );


const camera =
  new THREE.PerspectiveCamera(
    66,
    1,
    0.1,
    500
  );


const renderer =
  new THREE.WebGLRenderer({

    canvas,

    antialias: true

  });


renderer.shadowMap.enabled =
  true;


renderer.shadowMap.type =
  THREE.PCFSoftShadowMap;


renderer.outputColorSpace =
  THREE.SRGBColorSpace;


renderer.toneMapping =
  THREE.ACESFilmicToneMapping;


renderer.toneMappingExposure =
  1.05;


/* =========================================================
   LIGHTING
========================================================= */

const hemi =
  new THREE.HemisphereLight(
    0xeaf7ff,
    0x405537,
    1.5
  );


scene.add(
  hemi
);


const sun =
  new THREE.DirectionalLight(
    0xffefd2,
    2.2
  );


sun.position.set(
  45,
  70,
  30
);


sun.castShadow =
  true;


sun.shadow.mapSize.set(
  2048,
  2048
);


sun.shadow.camera.left =
  -120;

sun.shadow.camera.right =
  120;

sun.shadow.camera.top =
  120;

sun.shadow.camera.bottom =
  -120;


scene.add(
  sun
);


const world =
  new THREE.Group();


scene.add(
  world
);


/* =========================================================
   LOADERS
========================================================= */

const gltfLoader =
  new GLTFLoader();

const fbxLoader =
  new FBXLoader();

const objLoader =
  new OBJLoader();

const mtlLoader =
  new MTLLoader();

const stlLoader =
  new STLLoader();


/* =========================================================
   BASIC UTILITIES
========================================================= */

function msg(text) {

  state.feed.unshift({

    text,

    time:
      performance.now()

  });


  state.feed =
    state.feed.slice(
      0,
      5
    );

}


function saveGame() {

  if (
    !state.player
  ) {

    return;

  }


  Object.assign(

    state.save,

    {

      x:
        state.player.x,

      y:
        state.player.y,

      z:
        state.player.z,

      hp:
        state.player.hp,

      stamina:
        state.player.stamina,

      hunger:
        state.player.hunger

    }

  );


  localStorage.setItem(

    SAVE_KEY,

    JSON.stringify(
      state.save
    )

  );

}


/* =========================================================
   RESIZE
========================================================= */

function resize() {

  const width =
    window.innerWidth;

  const height =
    window.innerHeight;


  renderer.setPixelRatio(

    Math.min(
      window.devicePixelRatio || 1,
      1.6
    )

  );


  renderer.setSize(
    width,
    height,
    false
  );


  camera.aspect =
    width /
    Math.max(
      1,
      height
    );


  camera.updateProjectionMatrix();

}


window.addEventListener(
  "resize",
  resize
);


resize();


/* =========================================================
   WORLD
========================================================= */

function makeWorld() {

  const ground =
    new THREE.Mesh(

      new THREE.CircleGeometry(
        220,
        80
      ),

      new THREE.MeshStandardMaterial({

        color:
          0x5e9e55,

        roughness:
          0.95

      })

    );


  ground.rotation.x =
    -Math.PI / 2;


  ground.receiveShadow =
    true;


  world.add(
    ground
  );


  const hillMaterial =
    new THREE.MeshStandardMaterial({

      color:
        0x6ca760,

      roughness:
        1

    });


  for (
    let i = 0;
    i < 45;
    i++
  ) {

    const hill =
      new THREE.Mesh(

        new THREE.ConeGeometry(

          rand(
            4,
            13
          ),

          rand(
            3,
            9
          ),

          8

        ),

        hillMaterial

      );


    const angle =
      Math.random() *
      Math.PI *
      2;


    const radius =
      rand(
        55,
        185
      );


    hill.position.set(

      Math.cos(angle) *
      radius,

      0,

      Math.sin(angle) *
      radius

    );


    hill.castShadow =
      true;

    hill.receiveShadow =
      true;


    world.add(
      hill
    );

  }


  const trunkMaterial =
    new THREE.MeshStandardMaterial({

      color:
        0x6b4833

    });


  const leafMaterial =
    new THREE.MeshStandardMaterial({

      color:
        0x397f42,

      roughness:
        0.9

    });


  for (
    let i = 0;
    i < 90;
    i++
  ) {

    const tree =
      new THREE.Group();


    const trunk =
      new THREE.Mesh(

        new THREE.CylinderGeometry(
          0.2,
          0.32,
          rand(
            2.5,
            4.5
          ),
          8
        ),

        trunkMaterial

      );


    trunk.position.y =
      1.5;


    trunk.castShadow =
      true;


    tree.add(
      trunk
    );


    const leaves =
      new THREE.Mesh(

        new THREE.SphereGeometry(

          rand(
            1.3,
            2.3
          ),

          10,
          8

        ),

        leafMaterial

      );


    leaves.position.y =
      rand(
        3.4,
        4.5
      );


    leaves.scale.y =
      1.2;


    leaves.castShadow =
      true;


    tree.add(
      leaves
    );


    const angle =
      Math.random() *
      Math.PI *
      2;


    const radius =
      rand(
        25,
        195
      );


    tree.position.set(

      Math.cos(angle) *
      radius,

      0,

      Math.sin(angle) *
      radius

    );


    world.add(
      tree
    );

  }


  const rockMaterial =
    new THREE.MeshStandardMaterial({

      color:
        0x78838a,

      roughness:
        1

    });


  for (
    let i = 0;
    i < 60;
    i++
  ) {

    const rock =
      new THREE.Mesh(

        new THREE.DodecahedronGeometry(

          rand(
            0.4,
            1.8
          ),

          0

        ),

        rockMaterial

      );


    rock.scale.y =
      rand(
        0.6,
        1.4
      );


    rock.position.set(

      rand(
        -190,
        190
      ),

      0.4,

      rand(
        -190,
        190
      )

    );


    rock.rotation.set(

      rand(
        0,
        2
      ),

      rand(
        0,
        2
      ),

      rand(
        0,
        2
      )

    );


    rock.castShadow =
      true;


    rock.receiveShadow =
      true;


    world.add(
      rock
    );

  }

}


makeWorld();


/* =========================================================
   MODEL NORMALIZE
========================================================= */

function normalizeModel(
  model,
  targetHeight = 2
) {

  model.updateMatrixWorld(
    true
  );


  const box =
    new THREE.Box3()
      .setFromObject(
        model
      );


  const size =
    new THREE.Vector3();


  box.getSize(
    size
  );


  if (
    size.y >
    0
  ) {

    const scale =
      targetHeight /
      size.y;


    model.scale.multiplyScalar(
      scale
    );

  }


  model.updateMatrixWorld(
    true
  );


  const correctedBox =
    new THREE.Box3()
      .setFromObject(
        model
      );


  model.position.y -=
    correctedBox.min.y;


  model.traverse(
    object => {

      if (
        object.isMesh
      ) {

        object.castShadow =
          true;

        object.receiveShadow =
          true;

      }

    }
  );


  return model;

}


/* =========================================================
   FILE EXTENSION
========================================================= */

function extension(path) {

  const clean =
    path
      .split("?")[0]
      .toLowerCase();


  return clean
    .slice(
      clean.lastIndexOf(".") +
      1
    );

}


/* =========================================================
   LOAD MODEL
========================================================= */

function loadOne(path) {

  const ext =
    extension(
      path
    );


  return new Promise(

    async (
      resolve,
      reject
    ) => {

      try {

        if (
          ext === "glb" ||
          ext === "gltf"
        ) {

          gltfLoader.load(

            path,

            gltf => {

              resolve({

                scene:
                  gltf.scene,

                clips:
                  gltf.animations || []

              });

            },

            undefined,

            reject

          );


          return;

        }


        if (
          ext === "fbx"
        ) {

          fbxLoader.load(

            path,

            object => {

              resolve({

                scene:
                  object,

                clips:
                  object.animations || []

              });

            },

            undefined,

            reject

          );


          return;

        }


        if (
          ext === "obj"
        ) {

          const mtlPath =
            path.replace(
              /\.obj$/i,
              ".mtl"
            );


          try {

            const materials =
              await new Promise(

                (
                  resolveMaterials,
                  rejectMaterials
                ) => {

                  mtlLoader.load(

                    mtlPath,

                    resolveMaterials,

                    undefined,

                    rejectMaterials

                  );

                }

              );


            materials.preload();


            objLoader.setMaterials(
              materials
            );

          } catch {}


          objLoader.load(

            path,

            object => {

              resolve({

                scene:
                  object,

                clips: []

              });

            },

            undefined,

            reject

          );


          return;

        }


        if (
          ext === "stl"
        ) {

          stlLoader.load(

            path,

            geometry => {

              geometry.computeVertexNormals();


              const mesh =
                new THREE.Mesh(

                  geometry,

                  new THREE.MeshStandardMaterial({

                    color:
                      0xaaaaaa,

                    roughness:
                      0.8

                  })

                );


              resolve({

                scene:
                  mesh,

                clips: []

              });

            },

            undefined,

            reject

          );


          return;

        }


        reject(
          new Error(
            `Unsupported model format: ${ext}`
          )
        );

      } catch (
        error
      ) {

        reject(
          error
        );

      }

    }

  );

}


/* =========================================================
   TRY MODEL CANDIDATES
========================================================= */

async function tryCandidates(
  definition
) {

  for (
    const file of
    definition.files
  ) {

    try {

      const asset =
        await loadOne(
          file
        );


      return {

        ...asset,

        file

      };

    } catch {}

  }


  return null;

}


/* =========================================================
   ANIMATIONS
========================================================= */

function makeMixer(
  entity,
  clips
) {

  entity.clips =
    clips || [];


  if (
    !entity.clips.length
  ) {

    return;

  }


  entity.mixer =
    new THREE.AnimationMixer(
      entity.model
    );


  state.mixers.push(
    entity.mixer
  );

}


function findClip(
  entity,
  names
) {

  if (
    !entity.clips?.length
  ) {

    return null;

  }


  for (
    const name of
    names
  ) {

    const clip =
      entity.clips.find(

        animation =>
          animation.name
            .toLowerCase()
            .includes(
              name
            )

      );


    if (
      clip
    ) {

      return clip;

    }

  }


  return (
    entity.clips[0] ||
    null
  );

}


function play(
  entity,
  mode
) {

  if (
    !entity?.mixer ||
    entity.animMode ===
    mode
  ) {

    return;

  }


  const types = {

    idle: [
      "idle",
      "breath",
      "stand"
    ],

    walk: [
      "walk",
      "move"
    ],

    run: [
      "run",
      "sprint",
      "gallop"
    ],

    fly: [
      "fly",
      "flight"
    ],

    attack: [
      "attack",
      "bite",
      "skill"
    ],

    hurt: [
      "hurt",
      "damage"
    ]

  };


  const clip =
    findClip(

      entity,

      types[mode] ||
      [mode]

    );


  if (
    !clip
  ) {

    return;

  }


  const next =
    entity.mixer
      .clipAction(
        clip
      );


  if (
    entity.currentAction &&
    entity.currentAction !==
    next
  ) {

    entity.currentAction
      .fadeOut(
        0.12
      );

  }


  next
    .reset()
    .fadeIn(
      0.12
    )
    .play();


  entity.currentAction =
    next;


  entity.animMode =
    mode;

}


/* =========================================================
   CHARACTER CREATOR
========================================================= */

const CHARACTER_SAVE_KEY =
  "galaxy-pals-character-v1";


let characterOptions =
  JSON.parse(
    localStorage.getItem(
      CHARACTER_SAVE_KEY
    ) ||
    "null"
  ) ||
  {

    hairColor:
      "#24160f",

    skinColor:
      "#d7a47e",

    body:
      "normal",

    height:
      "normal"

  };


function openCharacterCreator() {

  return new Promise(
    resolve => {

      const overlay =
        document.createElement(
          "div"
        );


      overlay.style.cssText = `
        position:fixed;
        inset:0;
        z-index:99999;
        background:linear-gradient(135deg,#07111f,#142a3d);
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:Arial,sans-serif;
        color:white;
      `;


      overlay.innerHTML = `

        <div style="
          width:min(520px,90vw);
          background:rgba(10,20,32,.95);
          border:1px solid rgba(255,255,255,.15);
          border-radius:24px;
          padding:30px;
          box-shadow:0 25px 80px rgba(0,0,0,.5);
        ">

          <h1 style="
            margin:0 0 6px;
            font-size:30px;
          ">
            ✦ Create Your Character
          </h1>

          <p style="
            opacity:.7;
            margin-bottom:25px;
          ">
            Customize your GALAXY PALS explorer
          </p>

          <label>
            Hair Color
          </label>

          <input
            id="characterHair"
            type="color"
            value="${characterOptions.hairColor}"
            style="
              width:100%;
              height:48px;
              margin:8px 0 20px;
              border:none;
              border-radius:12px;
            "
          >

          <label>
            Skin Color
          </label>

          <input
            id="characterSkin"
            type="color"
            value="${characterOptions.skinColor}"
            style="
              width:100%;
              height:48px;
              margin:8px 0 20px;
              border:none;
              border-radius:12px;
            "
          >

          <label>
            Body Type
          </label>

          <select
            id="characterBody"
            style="
              width:100%;
              padding:14px;
              margin:8px 0 20px;
              border-radius:12px;
              background:#172536;
              color:white;
              border:1px solid rgba(255,255,255,.15);
            "
          >

            <option value="slim">
              Slim
            </option>

            <option value="normal">
              Normal
            </option>

            <option value="large">
              Large
            </option>

          </select>

          <label>
            Height
          </label>

          <select
            id="characterHeight"
            style="
              width:100%;
              padding:14px;
              margin:8px 0 22px;
              border-radius:12px;
              background:#172536;
              color:white;
              border:1px solid rgba(255,255,255,.15);
            "
          >

            <option value="short">
              Short
            </option>

            <option value="normal">
              Normal
            </option>

            <option value="tall">
              Tall
            </option>

          </select>

          <div style="
            display:flex;
            gap:10px;
          ">

            <button
              id="randomCharacter"
              type="button"
              style="
                flex:1;
                padding:14px;
                border:none;
                border-radius:13px;
                background:#24364a;
                color:white;
                cursor:pointer;
              "
            >
              Random
            </button>

            <button
              id="startCharacter"
              type="button"
              style="
                flex:2;
                padding:14px;
                border:none;
                border-radius:13px;
                background:linear-gradient(135deg,#397fca,#56b8ff);
                color:white;
                font-weight:800;
                cursor:pointer;
              "
            >
              Start Adventure
            </button>

          </div>

        </div>

      `;


      document.body.appendChild(
        overlay
      );


      const bodySelect =
        overlay.querySelector(
          "#characterBody"
        );


      const heightSelect =
        overlay.querySelector(
          "#characterHeight"
        );


      bodySelect.value =
        characterOptions.body;


      heightSelect.value =
        characterOptions.height;


      overlay
        .querySelector(
          "#randomCharacter"
        )
        .addEventListener(
          "click",
          () => {

            const hairColors = [
              "#24160f",
              "#5b311c",
              "#b2763d",
              "#161616",
              "#c8c8c8",
              "#334b82",
              "#703455"
            ];


            const skinColors = [
              "#f0c7a5",
              "#d7a47e",
              "#b97855",
              "#8d563c",
              "#70402c"
            ];


            overlay.querySelector(
              "#characterHair"
            ).value =
              pick(
                hairColors
              );


            overlay.querySelector(
              "#characterSkin"
            ).value =
              pick(
                skinColors
              );


            bodySelect.value =
              pick([
                "slim",
                "normal",
                "large"
              ]);


            heightSelect.value =
              pick([
                "short",
                "normal",
                "tall"
              ]);

          }
        );


      overlay
        .querySelector(
          "#startCharacter"
        )
        .addEventListener(
          "click",
          () => {

            characterOptions = {

              hairColor:
                overlay.querySelector(
                  "#characterHair"
                ).value,

              skinColor:
                overlay.querySelector(
                  "#characterSkin"
                ).value,

              body:
                bodySelect.value,

              height:
                heightSelect.value

            };


            localStorage.setItem(

              CHARACTER_SAVE_KEY,

              JSON.stringify(
                characterOptions
              )

            );


            overlay.remove();


            resolve();

          }
        );

    }

  );

}


/* =========================================================
   CHARACTER MODEL CUSTOMIZATION
========================================================= */

function customizeCharacter(
  model
) {

  let widthScale =
    1;


  if (
    characterOptions.body ===
    "slim"
  ) {

    widthScale =
      0.88;

  }


  if (
    characterOptions.body ===
    "large"
  ) {

    widthScale =
      1.14;

  }


  let heightScale =
    1;


  if (
    characterOptions.height ===
    "short"
  ) {

    heightScale =
      0.9;

  }


  if (
    characterOptions.height ===
    "tall"
  ) {

    heightScale =
      1.1;

  }


  model.scale.x *=
    widthScale;

  model.scale.z *=
    widthScale;

  model.scale.y *=
    heightScale;


  model.traverse(
    object => {

      if (
        !object.isMesh
      ) {

        return;

      }


      const name =
        object.name
          .toLowerCase();


      const materials =
        Array.isArray(
          object.material
        )
          ? object.material
          : [object.material];


      const clonedMaterials =
        materials.map(
          material =>
            material?.clone
              ? material.clone()
              : material
        );


      if (
        name.includes("hair") ||
        name.includes("head_hair")
      ) {

        for (
          const material of
          clonedMaterials
        ) {

          if (
            material?.color
          ) {

            material.color.set(
              characterOptions.hairColor
            );

          }

        }

      }


      if (
        name.includes("skin") ||
        name.includes("face") ||
        name.includes("head") ||
        name.includes("body_skin")
      ) {

        for (
          const material of
          clonedMaterials
        ) {

          if (
            material?.color
          ) {

            material.color.set(
              characterOptions.skinColor
            );

          }

        }

      }


      object.material =
        Array.isArray(
          object.material
        )
          ? clonedMaterials
          : clonedMaterials[0];

    }
  );


  return model;

}


/* =========================================================
   FALLBACK PLAYER
========================================================= */

function createFallbackPlayer() {

  const group =
    new THREE.Group();


  const body =
    new THREE.Mesh(

      new THREE.CapsuleGeometry(
        0.34,
        0.8,
        6,
        12
      ),

      new THREE.MeshStandardMaterial({

        color:
          0x315d8c

      })

    );


  body.position.y =
    1.1;


  body.name =
    "body";


  group.add(
    body
  );


  const head =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.32,
        18,
        14
      ),

      new THREE.MeshStandardMaterial({

        color:
          0xd7a47e

      })

    );


  head.position.y =
    1.95;


  head.name =
    "head_skin";


  group.add(
    head
  );


  const hair =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.33,
        16,
        10,
        0,
        Math.PI *
        2,
        0,
        Math.PI /
        2
      ),

      new THREE.MeshStandardMaterial({

        color:
          0x24160f

      })

    );


  hair.position.y =
    2.08;


  hair.name =
    "hair";


  group.add(
    hair
  );


  group.traverse(
    object => {

      if (
        object.isMesh
      ) {

        object.castShadow =
          true;

      }

    }
  );


  return group;

}


/* =========================================================
   PLAYER
========================================================= */

async function loadPlayer() {

  await openCharacterCreator();


  const player = {

    x:
      state.save.x,

    y:
      state.save.y,

    z:
      state.save.z,

    yaw: 0,

    pitch:
      -0.12,

    hp:
      state.save.hp,

    stamina:
      state.save.stamina,

    hunger:
      state.save.hunger,

    speed:
      4.8,

    model:
      null,

    mixer:
      null,

    clips: [],

    animMode: ""

  };


  try {

    const asset =
      await loadOne(
        "assets/player/player.glb"
      );


    player.model =
      customizeCharacter(

        normalizeModel(
          asset.scene,
          1.9
        )

      );


    makeMixer(
      player,
      asset.clips
    );


    play(
      player,
      "idle"
    );

  } catch {

    player.model =
      customizeCharacter(
        createFallbackPlayer()
      );


    msg(
      "Player model unavailable — temporary explorer loaded"
    );

  }


  player.model.position.set(

    player.x,
    player.y,
    player.z

  );


  world.add(
    player.model
  );


  state.player =
    player;

}


/* =========================================================
   LOAD ONE PAL
========================================================= */

async function loadPal(
  definition
) {

  if (
    state.cache.has(
      definition.id
    )
  ) {

    return true;

  }


  const asset =
    await tryCandidates(
      definition
    );


  if (
    !asset
  ) {

    console.warn(
      "Missing model:",
      definition.name
    );


    return false;

  }


  normalizeModel(

    asset.scene,

    definition.height

  );


  state.cache.set(

    definition.id,

    {

      ...asset,

      source:
        asset.scene

    }

  );


  console.log(

    `Loaded ${definition.name} from ${asset.file}`

  );


  return true;

}


/* =========================================================
   QUICK START PAL LOAD

   Only a few Pals are required before gameplay begins.
========================================================= */

async function loadStarterPals() {

  const starters =
    PAL_LIBRARY.slice(
      0,
      4
    );


  const results =
    await Promise.allSettled(

      starters.map(
        definition =>
          loadPal(
            definition
          )
      )

    );


  return results.filter(

    result =>
      result.status ===
      "fulfilled" &&
      result.value ===
      true

  ).length;

}


/* =========================================================
   LOAD REMAINING PALS IN BACKGROUND
========================================================= */

async function loadRemainingPals() {

  const remaining =
    PAL_LIBRARY.slice(
      4
    );


  const batchSize =
    3;


  for (
    let i = 0;
    i < remaining.length;
    i += batchSize
  ) {

    const batch =
      remaining.slice(
        i,
        i + batchSize
      );


    await Promise.allSettled(

      batch.map(
        definition =>
          loadPal(
            definition
          )
      )

    );


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          60
        )
    );

  }


  msg(
    "All available Pals finished loading"
  );

}


/* =========================================================
   CLONE PAL
========================================================= */

function cloneAsset(
  cached
) {

  const model =
    cloneSkinned(
      cached.source
    );


  return {

    model,

    clips:
      cached.clips || []

  };

}


/* =========================================================
   SPAWN CREATURE
========================================================= */

function spawnCreature(
  definition,
  position = null
) {

  const cached =
    state.cache.get(
      definition.id
    );


  if (
    !cached
  ) {

    return null;

  }


  const clone =
    cloneAsset(
      cached
    );


  const creature = {

    id:
      `${definition.id}-${Math.random().toString(36).slice(2)}`,

    definition,

    model:
      clone.model,

    clips:
      clone.clips,

    mixer:
      null,

    currentAction:
      null,

    animMode:
      "",

    hp:
      definition.hp,

    maxHp:
      definition.hp,

    level:
      Math.max(
        1,
        Math.round(
          rand(
            1,
            12
          )
        )
      ),

    dead:
      false,

    captured:
      false,

    velocity:
      new THREE.Vector3(),

    wanderAngle:
      rand(
        0,
        Math.PI *
        2
      ),

    wanderTimer:
      rand(
        1,
        4
      ),

    attackCooldown:
      0

  };


  if (
    position
  ) {

    creature.model.position.copy(
      position
    );

  } else {

    const angle =
      rand(
        0,
        Math.PI *
        2
      );


    const radius =
      rand(
        20,
        100
      );


    creature.model.position.set(

      Math.cos(angle) *
      radius,

      0,

      Math.sin(angle) *
      radius

    );

  }


  world.add(
    creature.model
  );


  makeMixer(
    creature,
    clone.clips
  );


  play(
    creature,
    definition.mount ===
    "flying"
      ? "fly"
      : "idle"
  );


  state.creatures.push(
    creature
  );


  return creature;

}


/* =========================================================
   SPAWN AVAILABLE WORLD PALS
========================================================= */

function spawnWorldPals(
  onlyMissing = false
) {

  for (
    const definition of
    PAL_LIBRARY
  ) {

    if (
      !state.cache.has(
        definition.id
      )
    ) {

      continue;

    }


    if (
      onlyMissing
    ) {

      const alreadyExists =
        state.creatures.some(

          creature =>
            creature.definition.id ===
            definition.id

        );


      if (
        alreadyExists
      ) {

        continue;

      }

    }


    const count =
      definition.boss
        ? 1
        : Math.max(
            1,
            5 -
            definition.rarity
          );


    for (
      let i = 0;
      i < count;
      i++
    ) {

      spawnCreature(
        definition
      );

    }

  }

}


/* =========================================================
   HYPER SPHERE MODEL
========================================================= */

async function loadHyperSphere() {

  try {

    const asset =
      await loadOne(
        "assets/items/hyper-sphere.glb"
      );


    normalizeModel(
      asset.scene,
      0.42
    );


    state.sphereModel =
      asset.scene;

  } catch {

    state.sphereModel =
      null;

  }

}


/* =========================================================
   PROCEDURAL SPHERE
========================================================= */

function createSphereModel(
  sphere
) {

  const group =
    new THREE.Group();


  const shell =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.18,
        20,
        16
      ),

      new THREE.MeshStandardMaterial({

        color:
          sphere.color,

        metalness:
          0.35,

        roughness:
          0.28

      })

    );


  shell.castShadow =
    true;


  group.add(
    shell
  );


  const ring =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        0.18,
        0.025,
        8,
        22
      ),

      new THREE.MeshStandardMaterial({

        color:
          0xffffff,

        emissive:
          0x222222

      })

    );


  ring.rotation.x =
    Math.PI /
    2;


  group.add(
    ring
  );


  return group;

}


/* =========================================================
   TARGETING
========================================================= */

const raycaster =
  new THREE.Raycaster();


function updateTarget() {

  if (
    !state.player
  ) {

    return;

  }


  raycaster.setFromCamera(

    new THREE.Vector2(
      0,
      0
    ),

    camera

  );


  let nearest =
    null;


  let nearestDistance =
    Infinity;


  for (
    const creature of
    state.creatures
  ) {

    if (
      creature.dead ||
      creature.captured
    ) {

      continue;

    }


    const box =
      new THREE.Box3()
        .setFromObject(
          creature.model
        );


    const hit =
      raycaster.ray.intersectBox(

        box,

        new THREE.Vector3()

      );


    if (
      !hit
    ) {

      continue;

    }


    const distance =
      hit.distanceTo(
        camera.position
      );


    if (
      distance <
      nearestDistance &&
      distance <
      28
    ) {

      nearest =
        creature;

      nearestDistance =
        distance;

    }

  }


  state.target =
    nearest;

}


/* =========================================================
   CAPTURE CHANCE
========================================================= */

function captureChance(
  creature
) {

  if (
    !creature
  ) {

    return 0;

  }


  const sphere =
    SPHERES[
      state.save.selectedSphere
    ];


  const hpFactor =
    1 -
    creature.hp /
    creature.maxHp;


  const rarityFactor =
    1 /
    creature.definition.rarity;


  let chance =
    0.14 +
    hpFactor *
    0.55 +
    rarityFactor *
    0.2;


  chance *=
    sphere.bonus;


  return clamp(
    chance,
    0.05,
    0.95
  );

}


/* =========================================================
   SPHERE AIM
========================================================= */

function beginSphere() {

  if (
    state.charging ||
    !state.player
  ) {

    return;

  }


  const index =
    state.save.selectedSphere;


  if (
    state.save.spheres[index] <=
    0
  ) {

    msg(
      "No Sphere available"
    );


    return;

  }


  const sphere =
    SPHERES[index];


  let model;


  if (
    sphere.name ===
    "Hyper Sphere" &&
    state.sphereModel
  ) {

    model =
      state.sphereModel.clone(
        true
      );

  } else {

    model =
      createSphereModel(
        sphere
      );

  }


  world.add(
    model
  );


  state.heldSphere =
    model;


  state.charging =
    true;


  state.chargeStart =
    performance.now();

}


/* =========================================================
   RELEASE SPHERE
========================================================= */

function releaseSphere() {

  if (
    !state.charging ||
    !state.heldSphere ||
    !state.player
  ) {

    return;

  }


  const index =
    state.save.selectedSphere;


  if (
    state.save.spheres[index] <=
    0
  ) {

    return;

  }


  state.save.spheres[index]--;


  const charge =
    clamp(

      (
        performance.now() -
        state.chargeStart
      ) /
      1200,

      0,
      1

    );


  const model =
    state.heldSphere;


  const direction =
    new THREE.Vector3();


  camera.getWorldDirection(
    direction
  );


  model.position.copy(
    camera.position
  );


  model.position.add(
    direction
      .clone()
      .multiplyScalar(
        1.1
      )
  );


  const projectile = {

    model,

    velocity:
      direction
        .clone()
        .multiplyScalar(
          11 +
          charge *
          12
        ),

    life:
      5,

    sphereIndex:
      index

  };


  state.projectiles.push(
    projectile
  );


  state.heldSphere =
    null;


  state.charging =
    false;


  saveGame();

}


/* =========================================================
   PROJECTILES
========================================================= */

function updateProjectiles(
  dt
) {

  for (
    let i =
      state.projectiles.length -
      1;

    i >= 0;

    i--
  ) {

    const projectile =
      state.projectiles[i];


    projectile.velocity.y -=
      8 *
      dt;


    projectile.model.position.addScaledVector(

      projectile.velocity,

      dt

    );


    projectile.model.rotation.x +=
      dt *
      7;

    projectile.model.rotation.y +=
      dt *
      9;


    projectile.life -=
      dt;


    let hitCreature =
      null;


    for (
      const creature of
      state.creatures
    ) {

      if (
        creature.dead ||
        creature.captured
      ) {

        continue;

      }


      const distance =
        projectile.model.position
          .distanceTo(
            creature.model.position
          );


      if (
        distance <
        1.35
      ) {

        hitCreature =
          creature;

        break;

      }

    }


    if (
      hitCreature
    ) {

      attemptCapture(

        hitCreature,

        projectile.sphereIndex

      );


      world.remove(
        projectile.model
      );


      state.projectiles.splice(
        i,
        1
      );


      continue;

    }


    if (
      projectile.model.position.y <
      0 ||
      projectile.life <=
      0
    ) {

      world.remove(
        projectile.model
      );


      state.projectiles.splice(
        i,
        1
      );

    }

  }

}


/* =========================================================
   CAPTURE
========================================================= */

function attemptCapture(
  creature,
  sphereIndex
) {

  const sphere =
    SPHERES[
      sphereIndex
    ];


  const original =
    state.save.selectedSphere;


  state.save.selectedSphere =
    sphereIndex;


  const chance =
    captureChance(
      creature
    );


  state.save.selectedSphere =
    original;


  if (
    Math.random() <=
    chance
  ) {

    creature.captured =
      true;


    world.remove(
      creature.model
    );


    const entry = {

      id:
        creature.definition.id,

      name:
        creature.definition.name,

      level:
        creature.level

    };


    if (
      state.save.party.length <
      5
    ) {

      state.save.party.push(
        entry
      );


      msg(
        `${creature.definition.name} captured with ${sphere.name} and joined your party!`
      );

    } else {

      state.save.box.push(
        entry
      );


      msg(
        `${creature.definition.name} captured and sent to storage`
      );

    }


    saveGame();

  } else {

    msg(
      `${creature.definition.name} escaped the ${sphere.name}`
    );

  }

}


/* =========================================================
   PLAYER ATTACK
========================================================= */

function attackTarget() {

  const target =
    state.target;


  if (
    !target ||
    target.dead ||
    target.captured
  ) {

    return;

  }


  const distance =
    state.player.model.position
      .distanceTo(
        target.model.position
      );


  if (
    distance >
    7
  ) {

    return;

  }


  const damage =
    rand(
      14,
      24
    );


  target.hp =
    Math.max(
      0,
      target.hp -
      damage
    );


  play(
    target,
    "hurt"
  );


  if (
    target.hp <=
    0
  ) {

    target.dead =
      true;


    world.remove(
      target.model
    );


    msg(
      `${target.definition.name} defeated`
    );


    state.save.xp +=
      20 *
      target.definition.rarity;

  }

}


/* =========================================================
   COMPANION
========================================================= */

function summonCompanion() {

  if (
    !state.save.party.length
  ) {

    msg(
      "Capture a Pal first"
    );


    return;

  }


  if (
    state.companion
  ) {

    world.remove(
      state.companion.model
    );


    state.companion =
      null;


    msg(
      "Companion returned"
    );


    return;

  }


  const partyEntry =
    state.save.party[0];


  const definition =
    PAL_LIBRARY.find(

      item =>
        item.id ===
        partyEntry.id

    );


  if (
    !definition ||
    !state.cache.has(
      definition.id
    )
  ) {

    msg(
      "That Pal is still loading"
    );


    return;

  }


  const companion =
    spawnCreature(

      definition,

      state.player.model.position
        .clone()
        .add(
          new THREE.Vector3(
            2,
            0,
            2
          )
        )

    );


  if (
    companion
  ) {

    state.companion =
      companion;


    msg(
      `${definition.name} summoned`
    );

  }

}


/* =========================================================
   MOUNT
========================================================= */

function toggleMount() {

  if (
    state.mounted
  ) {

    state.mounted =
      false;


    state.player.model.visible =
      true;


    msg(
      "Dismounted"
    );


    return;

  }


  if (
    !state.companion
  ) {

    msg(
      "Summon a mountable Pal first"
    );


    return;

  }


  if (
    !state.companion.definition.mount
  ) {

    msg(
      `${state.companion.definition.name} cannot be mounted`
    );


    return;

  }


  state.mounted =
    true;


  state.player.model.visible =
    false;


  msg(
    `Mounted ${state.companion.definition.name}`
  );

}


/* =========================================================
   WILD AI
========================================================= */

function updateWildAI(
  dt
) {

  if (
    !state.player
  ) {

    return;

  }


  for (
    const creature of
    state.creatures
  ) {

    if (
      creature.dead ||
      creature.captured ||
      creature ===
      state.companion
    ) {

      continue;

    }


    creature.wanderTimer -=
      dt;


    if (
      creature.wanderTimer <=
      0
    ) {

      creature.wanderTimer =
        rand(
          1.5,
          4.5
        );


      creature.wanderAngle +=
        rand(
          -1.2,
          1.2
        );

    }


    const speed =
      creature.definition.speed *
      0.25;


    creature.model.position.x +=

      Math.sin(
        creature.wanderAngle
      ) *

      speed *

      dt;


    creature.model.position.z +=

      Math.cos(
        creature.wanderAngle
      ) *

      speed *

      dt;


    creature.model.rotation.y =
      creature.wanderAngle;


    play(

      creature,

      creature.definition.mount ===
      "flying"
        ? "fly"
        : "walk"

    );


    if (
      creature.definition.mount ===
      "flying"
    ) {

      creature.model.position.y =
        2.4 +
        Math.sin(
          performance.now() *
          0.002
        ) *
        0.5;

    } else {

      creature.model.position.y =
        0;

    }

  }

}


/* =========================================================
   COMPANION FOLLOW
========================================================= */

function updateCompanion(
  dt
) {

  if (
    !state.companion ||
    !state.player
  ) {

    return;

  }


  const companion =
    state.companion;


  if (
    state.mounted
  ) {

    companion.model.position.set(

      state.player.x,
      companion.definition.mount ===
      "flying"
        ? 2.4
        : 0,
      state.player.z

    );


    companion.model.rotation.y =
      state.player.yaw;


    play(

      companion,

      companion.definition.mount ===
      "flying"
        ? "fly"
        : "run"

    );


    return;

  }


  const desired =
    state.player.model.position
      .clone()
      .add(
        new THREE.Vector3(
          2,
          0,
          2
        )
      );


  const direction =
    desired.sub(
      companion.model.position
    );


  const distance =
    direction.length();


  if (
    distance >
    1.6
  ) {

    direction.normalize();


    companion.model.position.addScaledVector(

      direction,

      Math.min(
        companion.definition.speed,
        5
      ) *
      dt

    );


    companion.model.rotation.y =
      Math.atan2(
        direction.x,
        direction.z
      );


    play(
      companion,
      "run"
    );

  } else {

    play(
      companion,
      "idle"
    );

  }

}


/* =========================================================
   HUD
========================================================= */

const targetCard =
  $("#targetCard");

const targetName =
  $("#targetName");

const targetMeta =
  $("#targetMeta");

const captureChanceText =
  $("#captureChance");

const targetHpBar =
  $("#targetHpBar");

const hpBar =
  $("#hpBar");

const hpText =
  $("#hpText");

const staminaBar =
  $("#staminaBar");

const staminaText =
  $("#staminaText");

const foodBar =
  $("#foodBar");

const foodText =
  $("#foodText");

const partyHud =
  $("#partyHud");

const feed =
  $("#feed");

const sphereHud =
  $("#sphereHud") ||
  $("#orbHud");

const clockText =
  $("#clockText");

const levelText =
  $("#levelText");


function updateHUD() {

  const player =
    state.player;


  if (
    !player
  ) {

    return;

  }


  if (
    hpBar
  ) {

    hpBar.style.width =
      `${clamp(
        player.hp,
        0,
        100
      )}%`;

  }


  if (
    hpText
  ) {

    hpText.textContent =
      Math.round(
        player.hp
      );

  }


  if (
    staminaBar
  ) {

    staminaBar.style.width =
      `${clamp(
        player.stamina,
        0,
        100
      )}%`;

  }


  if (
    staminaText
  ) {

    staminaText.textContent =
      Math.round(
        player.stamina
      );

  }


  if (
    foodBar
  ) {

    foodBar.style.width =
      `${clamp(
        player.hunger,
        0,
        100
      )}%`;

  }


  if (
    foodText
  ) {

    foodText.textContent =
      Math.round(
        player.hunger
      );

  }


  if (
    levelText
  ) {

    levelText.textContent =
      `LEVEL ${state.save.level}`;

  }


  if (
    clockText
  ) {

    const hour =
      Math.floor(
        state.worldTime
      ) %
      24;


    const minute =
      Math.floor(

        (
          state.worldTime -
          Math.floor(
            state.worldTime
          )
        ) *
        60

      );


    clockText.textContent =
      `DAY 1 • ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  }


  if (
    targetCard
  ) {

    if (
      state.target &&
      !state.target.dead &&
      !state.target.captured
    ) {

      targetCard.hidden =
        false;


      targetName.textContent =
        state.target.definition.name;


      targetMeta.textContent =
        `LV ${state.target.level} • ${state.target.definition.element}`;


      captureChanceText.textContent =
        `${Math.round(
          captureChance(
            state.target
          ) *
          100
        )}%`;


      targetHpBar.style.width =
        `${clamp(
          state.target.hp /
          state.target.maxHp *
          100,
          0,
          100
        )}%`;

    } else {

      targetCard.hidden =
        true;

    }

  }


  if (
    feed
  ) {

    const now =
      performance.now();


    state.feed =
      state.feed.filter(

        item =>
          now -
          item.time <
          5500

      );


    feed.innerHTML =
      state.feed
        .map(

          item =>
            `<div>${item.text}</div>`

        )
        .join("");

  }


  if (
    partyHud
  ) {

    partyHud.innerHTML =
      state.save.party
        .map(

          pal => {

            const definition =
              PAL_LIBRARY.find(

                item =>
                  item.id ===
                  pal.id

              );


            return `

              <div class="party-card">

                <strong>
                  ${pal.name}
                </strong>

                <span>
                  LV ${pal.level}
                  •
                  ${definition?.element || "Neutral"}
                </span>

              </div>

            `;

          }

        )
        .join("");

  }


  if (
    sphereHud
  ) {

    sphereHud.innerHTML =
      SPHERES
        .map(

          (
            sphere,
            index
          ) => {

            const active =
              index ===
              state.save.selectedSphere;


            return `

              <div class="orb-slot ${active ? "active" : ""}">

                <strong>
                  ${index + 1}
                </strong>

                <span>
                  ${sphere.name}
                </span>

                <small>
                  ×${state.save.spheres[index]}
                </small>

              </div>

            `;

          }

        )
        .join("");

  }

}


/* =========================================================
   CONTROLS
========================================================= */

canvas.addEventListener(

  "click",

  () =>
    canvas.requestPointerLock?.()

);


document.addEventListener(

  "mousemove",

  event => {

    if (
      document.pointerLockElement !==
      canvas ||
      !state.player
    ) {

      return;

    }


    state.player.yaw -=

      event.movementX *
      0.0024;


    state.player.pitch =
      clamp(

        state.player.pitch -

        event.movementY *
        0.0017,

        -0.5,

        0.28

      );

  }

);


document.addEventListener(

  "keydown",

  event => {

    state.keys.add(
      event.code
    );


    if (
      /^Digit[1-5]$/
        .test(
          event.code
        )
    ) {

      state.save.selectedSphere =

        Number(
          event.code.slice(
            -1
          )
        ) -
        1;

    }


    if (
      event.code ===
      "KeyQ" &&
      !event.repeat
    ) {

      beginSphere();

    }


    if (
      event.code ===
      "KeyF" &&
      !event.repeat
    ) {

      summonCompanion();

    }


    if (
      event.code ===
      "KeyE" &&
      !event.repeat
    ) {

      toggleMount();

    }

  }

);


document.addEventListener(

  "keyup",

  event => {

    state.keys.delete(
      event.code
    );


    if (
      event.code ===
      "KeyQ"
    ) {

      releaseSphere();

    }

  }

);


document.addEventListener(

  "mousedown",

  event => {

    if (
      event.button ===
      0 &&
      document.pointerLockElement ===
      canvas
    ) {

      attackTarget();

    }

  }

);


/* =========================================================
   MENU
========================================================= */

const menu =
  $("#menuPanel");


$("#menuButton")
  ?.addEventListener(

    "click",

    () => {

      menu.hidden =
        !menu.hidden;

    }

  );


$("#resumeButton")
  ?.addEventListener(

    "click",

    () => {

      menu.hidden =
        true;


      canvas.requestPointerLock?.();

    }

  );


$("#resetButton")
  ?.addEventListener(

    "click",

    () => {

      localStorage.removeItem(
        SAVE_KEY
      );


      localStorage.removeItem(
        CHARACTER_SAVE_KEY
      );


      location.reload();

    }

  );


/* =========================================================
   STARTUP TIMEOUT
========================================================= */

function timeoutPromise(
  milliseconds
) {

  return new Promise(

    resolve => {

      setTimeout(

        () =>
          resolve(
            "timeout"
          ),

        milliseconds

      );

    }

  );

}


/* =========================================================
   START GAME FAST

   Player + Sphere + starter Pals load together.
   Maximum wait before game opens = 25 seconds.
========================================================= */

async function startGame() {

  if (
    loading
  ) {

    loading.innerHTML = `

      <div class="loading-card">

        <div class="logo-mark">
          ✦
        </div>

        <h1>
          GALAXY PALS
        </h1>

        <p id="loadingText">
          Preparing your adventure...
        </p>

      </div>

    `;

  }


  const loadingText =
    $("#loadingText");


  if (
    loadingText
  ) {

    loadingText.textContent =
      "Loading explorer and nearby Pals...";

  }


  const criticalLoad =
    Promise.allSettled([

      loadPlayer(),

      loadHyperSphere(),

      loadStarterPals()

    ]);


  await Promise.race([

    criticalLoad,

    timeoutPromise(
      25000
    )

  ]);


  if (
    !state.player
  ) {

    const player = {

      x:
        state.save.x,

      y:
        state.save.y,

      z:
        state.save.z,

      yaw: 0,

      pitch:
        -0.12,

      hp:
        state.save.hp,

      stamina:
        state.save.stamina,

      hunger:
        state.save.hunger,

      speed:
        4.8,

      model:
        customizeCharacter(
          createFallbackPlayer()
        ),

      mixer:
        null,

      clips: [],

      animMode:
        ""

    };


    player.model.position.set(

      player.x,
      player.y,
      player.z

    );


    world.add(
      player.model
    );


    state.player =
      player;

  }


  spawnWorldPals();


  loading?.remove();


  const loadedCount =
    state.cache.size;


  msg(

    loadedCount
      ? `${loadedCount} Pal model${loadedCount === 1 ? "" : "s"} ready`
      : "World ready — Pal models are loading in the background"

  );


  loadRemainingPals()
    .then(
      () => {

        spawnWorldPals(
          true
        );

      }
    )
    .catch(
      error => {

        console.warn(
          "Background Pal loading:",
          error
        );

      }
    );

}


/* =========================================================
   START
========================================================= */

await startGame();


/* =========================================================
   MAIN GAME LOOP
========================================================= */

let last =
  performance.now();


function loop(
  now
) {

  const dt =
    clamp(

      (
        now -
        last
      ) /
      1000,

      0,

      0.05

    );


  last =
    now;


  const player =
    state.player;


  if (
    player
  ) {

    const forward =

      (
        state.keys.has(
          "KeyW"
        )
          ? 1
          : 0
      )

      -

      (
        state.keys.has(
          "KeyS"
        )
          ? 1
          : 0
      );


    const right =

      (
        state.keys.has(
          "KeyD"
        )
          ? 1
          : 0
      )

      -

      (
        state.keys.has(
          "KeyA"
        )
          ? 1
          : 0
      );


    const moving =
      forward !==
      0 ||
      right !==
      0;


    const sprint =

      state.keys.has(
        "ShiftLeft"
      )

      &&

      player.stamina >
      2;


    if (
      !state.mounted
    ) {

      const speed =
        sprint
          ? 7.5
          : player.speed;


      const sin =
        Math.sin(
          player.yaw
        );


      const cos =
        Math.cos(
          player.yaw
        );


      player.x +=

        (
          -sin *
          forward

          +

          cos *
          right
        )

        *

        speed

        *

        dt;


      player.z +=

        (
          -cos *
          forward

          -

          sin *
          right
        )

        *

        speed

        *

        dt;


      player.x =
        clamp(
          player.x,
          -170,
          170
        );


      player.z =
        clamp(
          player.z,
          -170,
          170
        );


      player.model.position.set(

        player.x,
        player.y,
        player.z

      );


      player.model.rotation.y =
        player.yaw;


      if (
        moving
      ) {

        play(
          player,
          sprint
            ? "run"
            : "walk"
        );

      } else {

        play(
          player,
          "idle"
        );

      }

    } else {

      const mount =
        state.companion;


      const speed =

        mount?.definition.mount ===
        "flying"

          ? 11

          : 8.5;


      const sin =
        Math.sin(
          player.yaw
        );


      const cos =
        Math.cos(
          player.yaw
        );


      player.x +=

        (
          -sin *
          forward

          +

          cos *
          right
        )

        *

        speed

        *

        dt;


      player.z +=

        (
          -cos *
          forward

          -

          sin *
          right
        )

        *

        speed

        *

        dt;


      player.x =
        clamp(
          player.x,
          -170,
          170
        );


      player.z =
        clamp(
          player.z,
          -170,
          170
        );

    }


    if (
      sprint &&
      moving
    ) {

      player.stamina =
        Math.max(

          0,

          player.stamina -
          20 *
          dt

        );

    } else {

      player.stamina =
        Math.min(

          100,

          player.stamina +
          12 *
          dt

        );

    }


    player.hunger =
      Math.max(

        0,

        player.hunger -
        0.18 *
        dt

      );


    state.worldTime +=

      dt *
      0.22;


    if (
      state.worldTime >=
      24
    ) {

      state.worldTime -=
        24;

    }


    const cameraDistance =
      state.mounted
        ? 8
        : 5.8;


    const cameraHeight =
      state.mounted
        ? 4
        : 3.2;


    const targetPosition =
      new THREE.Vector3(

        player.x,

        (
          state.mounted &&
          state.companion?.definition.mount ===
          "flying"
        )
          ? 3
          : 1.2,

        player.z

      );


    const cameraOffset =
      new THREE.Vector3(

        Math.sin(
          player.yaw
        ) *
        cameraDistance,

        cameraHeight +
        player.pitch *
        5,

        Math.cos(
          player.yaw
        ) *
        cameraDistance

      );


    camera.position.lerp(

      targetPosition
        .clone()
        .add(
          cameraOffset
        ),

      1 -
      Math.pow(
        0.001,
        dt
      )

    );


    camera.lookAt(

      targetPosition
        .clone()
        .add(
          new THREE.Vector3(

            0,

            player.pitch *
            5,

            0

          )
        )

    );


    if (
      state.heldSphere
    ) {

      const direction =
        new THREE.Vector3();


      camera.getWorldDirection(
        direction
      );


      state.heldSphere.position.copy(
        camera.position
      );


      state.heldSphere.position.add(
        direction.multiplyScalar(
          1.1
        )
      );


      state.heldSphere.position.y -=
        0.35;

    }

  }


  updateTarget();


  updateProjectiles(
    dt
  );


  updateWildAI(
    dt
  );


  updateCompanion(
    dt
  );


  for (
    const mixer of
    state.mixers
  ) {

    mixer.update(
      dt
    );

  }


  if (
    now -
    state.lastSave >
    5000
  ) {

    saveGame();


    state.lastSave =
      now;

  }


  updateHUD();


  renderer.render(
    scene,
    camera
  );


  requestAnimationFrame(
    loop
  );

}


requestAnimationFrame(
  loop
);
