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


const $ = (s, r = document) =>
  r.querySelector(s);

const clamp = (n, a, b) =>
  Math.max(a, Math.min(b, n));

const rand = (a, b) =>
  a + Math.random() * (b - a);

const pick = a =>
  a[Math.floor(Math.random() * a.length)];


const SAVE_KEY =
  "galaxy-pals-mixed-models-v1";


/* =========================================================
   PAL FILES

   The game automatically tries different formats.

   Example:
   anubis.glb
   OR
   anubis.fbx

   You do NOT need both.
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
      "assets/pals/direhowl.fbx",
      "assets/pals/dire wolf.fbx"
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
      "assets/pals/jetragon.stl",
      "assets/pals/jet dragon.stl"
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

    height: 1.65,
    hp: 145,
    speed: 4.1,
    rarity: 2
  },

  {
    id: "lily-everhart",
    name: "Lily Everhart",
    element: "Neutral",

    files: [
      "assets/pals/lily-everhart.glb",
      "assets/pals/lily-everhart.fbx",
      "assets/pals/lily ever heart.fbx"
    ],

    height: 1.75,
    hp: 170,
    speed: 4.2,
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

    height: 1.9,
    hp: 160,
    speed: 4,
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

    height: 1.45,
    hp: 155,
    speed: 4.3,
    rarity: 3
  },

  {
    id: "mammorest",
    name: "Mammorest",
    element: "Grass",

    files: [
      "assets/pals/mammorest.glb"
    ],

    height: 3.7,
    hp: 420,
    speed: 2.9,
    rarity: 5,
    mount: "ground",
    boss: true
  },

  {
    id: "mau",
    name: "Mau",
    element: "Dark",

    files: [
      "assets/pals/mau.glb",
      "assets/pals/mau.obj"
    ],

    height: 1.15,
    hp: 100,
    speed: 4.5,
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
   CAPTURE SPHERES
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
   THREE.JS WORLD
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


/* LIGHT */

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
   UTILITY
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

  renderer.setSize(

    host.clientWidth,

    host.clientHeight,

    false

  );


  camera.aspect =

    host.clientWidth /

    host.clientHeight;


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

      new THREE.PlaneGeometry(
        360,
        360
      ),

      new THREE.MeshStandardMaterial({

        color:
          0x58834a,

        roughness:
          0.97

      })

    );


  ground.rotation.x =
    -Math.PI / 2;


  ground.receiveShadow =
    true;


  world.add(
    ground
  );


  /* WATER */

  const water =
    new THREE.Mesh(

      new THREE.CircleGeometry(
        28,
        64
      ),

      new THREE.MeshPhysicalMaterial({

        color:
          0x4c9bca,

        transparent:
          true,

        opacity:
          0.72,

        roughness:
          0.12,

        clearcoat:
          0.7

      })

    );


  water.rotation.x =
    -Math.PI / 2;


  water.position.set(
    55,
    0.04,
    -45
  );


  world.add(
    water
  );


  /* TREES + ROCKS */

  for (
    let i = 0;
    i < 150;
    i++
  ) {


    const x =
      rand(
        -170,
        170
      );


    const z =
      rand(
        -170,
        170
      );


    if (
      Math.hypot(
        x,
        z
      ) < 16
    ) {
      continue;
    }


    if (
      Math.random() <
      0.68
    ) {


      const scale =
        rand(
          0.8,
          1.35
        );


      const tree =
        new THREE.Group();


      const trunk =
        new THREE.Mesh(

          new THREE.CylinderGeometry(

            0.28 *
            scale,

            0.48 *
            scale,

            4.3 *
            scale,

            10

          ),

          new THREE.MeshStandardMaterial({

            color:
              0x6b482f,

            roughness:
              1

          })

        );


      trunk.position.y =
        2.15 *
        scale;


      trunk.castShadow =
        true;


      tree.add(
        trunk
      );


      for (
        let j = 0;
        j < 3;
        j++
      ) {


        const crown =
          new THREE.Mesh(

            new THREE.IcosahedronGeometry(

              (
                1.2 +
                j *
                0.12
              ) *
              scale,

              1

            ),

            new THREE.MeshStandardMaterial({

              color:
                pick([
                  0x3f733a,
                  0x4d8542,
                  0x5a9148
                ]),

              roughness:
                0.95

            })

          );


        crown.position.set(

          rand(
            -0.4,
            0.4
          ) *
          scale,

          (
            4 +
            j *
            0.55
          ) *
          scale,

          rand(
            -0.4,
            0.4
          ) *
          scale

        );


        crown.castShadow =
          true;


        tree.add(
          crown
        );

      }


      tree.position.set(
        x,
        0,
        z
      );


      world.add(
        tree
      );


    } else {


      const size =
        rand(
          0.5,
          1.8
        );


      const rock =
        new THREE.Mesh(

          new THREE.DodecahedronGeometry(
            size
          ),

          new THREE.MeshStandardMaterial({

            color:
              0x777c75,

            roughness:
              0.98

          })

        );


      rock.position.set(

        x,

        size *
        0.65,

        z

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

}


makeWorld();


/* =========================================================
   PLAYER
========================================================= */

function createFallbackPlayer() {


  const group =
    new THREE.Group();


  const body =
    new THREE.Mesh(

      new THREE.CapsuleGeometry(

        0.32,
        0.9,
        6,
        10

      ),

      new THREE.MeshStandardMaterial({

        color:
          0x344e6c,

        roughness:
          0.75

      })

    );


  body.position.y =
    1.1;


  const head =
    new THREE.Mesh(

      new THREE.SphereGeometry(

        0.24,
        18,
        14

      ),

      new THREE.MeshStandardMaterial({

        color:
          0xd6ad8a,

        roughness:
          0.8

      })

    );


  head.position.y =
    1.92;


  group.add(
    body,
    head
  );


  group.traverse(
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


  return group;

}


/* =========================================================
   AUTO SIZE MODELS

   This does NOT change the model design.
   It only makes models usable at proper game size.
========================================================= */

function normalizeModel(
  model,
  targetHeight = 1.8
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


  const box2 =
    new THREE.Box3()
      .setFromObject(
        model
      );


  const center =
    new THREE.Vector3();


  box2.getCenter(
    center
  );


  model.position.x -=
    center.x;


  model.position.z -=
    center.z;


  model.position.y -=
    box2.min.y;


  model.traverse(
    object => {


      if (
        object.isMesh
      ) {


        object.castShadow =
          true;


        object.receiveShadow =
          true;


        if (
          object.material?.map
        ) {


          object.material
            .map
            .colorSpace =
            THREE.SRGBColorSpace;

        }

      }

    }
  );


  return model;

}


/* =========================================================
   AUTO MODEL LOADER

   GLB
   GLTF
   FBX
   OBJ
   STL
========================================================= */

function extension(path) {

  return path
    .split("?")[0]
    .split(".")
    .pop()
    .toLowerCase();

}


async function loadOne(
  path
) {


  const type =
    extension(
      path
    );


  /* GLB */

  if (
    type === "glb" ||
    type === "gltf"
  ) {


    const gltf =
      await gltfLoader.loadAsync(
        path
      );


    return {

      scene:
        gltf.scene,

      clips:
        gltf.animations ||
        [],

      type

    };

  }


  /* FBX */

  if (
    type === "fbx"
  ) {


    const model =
      await fbxLoader.loadAsync(
        path
      );


    return {

      scene:
        model,

      clips:
        model.animations ||
        [],

      type

    };

  }


  /* OBJ */

  if (
    type === "obj"
  ) {


    let materials =
      null;


    try {


      materials =
        await mtlLoader.loadAsync(

          path.replace(
            /\.obj$/i,
            ".mtl"
          )

        );


      materials.preload();


    } catch {}


    if (
      materials
    ) {


      objLoader.setMaterials(
        materials
      );

    }


    const model =
      await objLoader.loadAsync(
        path
      );


    objLoader.setMaterials(
      null
    );


    return {

      scene:
        model,

      clips: [],

      type

    };

  }


  /* STL */

  if (
    type === "stl"
  ) {


    const geometry =
      await stlLoader.loadAsync(
        path
      );


    geometry.computeVertexNormals();


    const model =
      new THREE.Mesh(

        geometry,

        new THREE.MeshStandardMaterial({

          color:
            0xc7c9cd,

          roughness:
            0.78

        })

      );


    return {

      scene:
        model,

      clips: [],

      type

    };

  }


  throw new Error(
    "Unsupported file type"
  );

}


/* =========================================================
   TRY MULTIPLE FILE TYPES
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
    clips ||
    [];


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

/* ==========================================
   CHARACTER CREATOR
========================================== */

const CHARACTER_SAVE_KEY = "galaxy-pals-character-v1";

let characterOptions = JSON.parse(
  localStorage.getItem(CHARACTER_SAVE_KEY) || "null"
) || {
  hairColor: "#24160f",
  skinColor: "#d7a47e",
  body: "normal",
  height: "normal"
};


/* ==========================================
   CREATE CHARACTER MENU
========================================== */

function openCharacterCreator() {

  return new Promise(resolve => {

    const overlay = document.createElement("div");

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


        <label>Hair Color</label>

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


        <label>Skin Color</label>

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


        <label>Body Type</label>

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


        <label>Height</label>

        <select
          id="characterHeight"
          style="
            width:100%;
            padding:14px;
            margin:8px 0 24px;
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
            style="
              flex:1;
              padding:15px;
              border-radius:14px;
              border:0;
              cursor:pointer;
              font-weight:bold;
            "
          >
            Random
          </button>

          <button
            id="startCharacter"
            style="
              flex:2;
              padding:15px;
              border-radius:14px;
              border:0;
              cursor:pointer;
              font-weight:bold;
              background:#4da6ff;
              color:white;
            "
          >
            Start Adventure
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(overlay);


    const hair =
      overlay.querySelector("#characterHair");

    const skin =
      overlay.querySelector("#characterSkin");

    const body =
      overlay.querySelector("#characterBody");

    const height =
      overlay.querySelector("#characterHeight");


    body.value =
      characterOptions.body;

    height.value =
      characterOptions.height;


    overlay
      .querySelector("#randomCharacter")
      .onclick = () => {

        const hairColors = [
          "#22130c",
          "#111111",
          "#6c3c22",
          "#d7b36a",
          "#dddddd",
          "#3158a6",
          "#7d3fa3",
          "#b33247"
        ];

        const skinColors = [
          "#f0c7a5",
          "#dba47e",
          "#b97955",
          "#855136",
          "#5e3828"
        ];

        const bodies = [
          "slim",
          "normal",
          "large"
        ];

        const heights = [
          "short",
          "normal",
          "tall"
        ];

        hair.value =
          hairColors[
            Math.floor(
              Math.random() *
              hairColors.length
            )
          ];

        skin.value =
          skinColors[
            Math.floor(
              Math.random() *
              skinColors.length
            )
          ];

        body.value =
          bodies[
            Math.floor(
              Math.random() *
              bodies.length
            )
          ];

        height.value =
          heights[
            Math.floor(
              Math.random() *
              heights.length
            )
          ];

      };


    overlay
      .querySelector("#startCharacter")
      .onclick = () => {

        characterOptions = {

          hairColor:
            hair.value,

          skinColor:
            skin.value,

          body:
            body.value,

          height:
            height.value

        };


        localStorage.setItem(
          CHARACTER_SAVE_KEY,
          JSON.stringify(
            characterOptions
          )
        );


        overlay.remove();

        resolve();

      };

  });

}


/* ==========================================
   APPLY CHARACTER APPEARANCE
========================================== */

function customizeCharacter(model) {

  /* BODY SIZE */

  let widthScale = 1;

  if (
    characterOptions.body === "slim"
  ) {

    widthScale = 0.82;

  }

  if (
    characterOptions.body === "large"
  ) {

    widthScale = 1.18;

  }


  /* HEIGHT */

  let heightScale = 1;

  if (
    characterOptions.height === "short"
  ) {

    heightScale = 0.90;

  }

  if (
    characterOptions.height === "tall"
  ) {

    heightScale = 1.10;

  }


  model.scale.x *=
    widthScale;

  model.scale.z *=
    widthScale;

  model.scale.y *=
    heightScale;


  /* HAIR AND SKIN */

  model.traverse(object => {

    if (
      !object.isMesh
    ) return;


    const meshName =
      object.name
        .toLowerCase();


    /* HAIR */

    if (
      meshName.includes("hair") ||
      meshName.includes("head_hair")
    ) {

      object.material =
        object.material.clone();

      object.material.color =
        new THREE.Color(
          characterOptions.hairColor
        );

    }


    /* SKIN */

    if (
      meshName.includes("skin") ||
      meshName.includes("face") ||
      meshName.includes("head") ||
      meshName.includes("body_skin")
    ) {

      object.material =
        object.material.clone();

      object.material.color =
        new THREE.Color(
          characterOptions.skinColor
        );

    }

  });


  return model;

}
/* =========================================================
   PLAYER MODEL
========================================================= */

async function loadPlayer() {


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
      normalizeModel(
        asset.scene,
        1.9
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
      createFallbackPlayer();


    msg(
      "player.glb missing — temporary 3D player used"
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
   LOAD ALL AVAILABLE PALS
========================================================= */

async function loadPals() {


  let loaded =
    0;


  for (
    const definition of
    PAL_LIBRARY
  ) {


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


      continue;

    }


    normalizeModel(

      asset.scene,

      definition.height

normalizeModel(
  asset.scene,
  definition.height
);

    return null;

  }


  const model =
    cloneAsset(
      cached
    );


  model.position.set(

    x,

    definition.mount ===
    "flying"

      ? (
          definition.boss
            ? 7
            : 2.2
        )

      : 0,

    z

  );


  world.add(
    model
  );


  const maxHp =

    definition.hp *

    (
      definition.boss
        ? 2.15
        : 1
    );


  const creature = {

    def:
      definition,

    model,

    x,

    z,

    level,

    hp:
      maxHp,

    maxHp,

    alive:
      true,

    boss:
      !!definition.boss,

    aggressive:
      false,

    direction:
      rand(
        0,
        Math.PI * 2
      ),

    changeAt:
      performance.now() +
      rand(
        1500,
        3500
      ),

    mixer:
      null,

    clips:
      cached.clips ||
      [],

    animMode:
      "",

    currentAction:
      null,

    bobSeed:
      rand(
        0,
        10
      )

  };


  makeMixer(

    creature,

    creature.clips

  );


  play(

    creature,

    definition.mount ===
    "flying"

      ? "fly"

      : "idle"

  );


  model.traverse(
    object => {


      if (
        object.isMesh
      ) {


        object.userData
          .creature =
          creature;

      }

    }
  );


  state.creatures.push(
    creature
  );


  return creature;

}


/* =========================================================
   SPAWN WORLD
========================================================= */

function spawnWorldPals() {


  const definitions =

    PAL_LIBRARY.filter(

      definition =>
        state.cache.has(
          definition.id
        )

    );


  definitions.forEach(

    (
      definition,
      index
    ) => {


      const angle =

        index /

        Math.max(
          1,
          definitions.length
        )

        *

        Math.PI *
        2;


      const radius =

        definition.boss

          ? 115

          : 38 +
            (
              index %
              5
            ) *
            16;


      spawnCreature(

        definition,

        Math.sin(
          angle
        ) *
        radius +
        rand(
          -5,
          5
        ),

        Math.cos(
          angle
        ) *
        radius +
        rand(
          -5,
          5
        ),

        definition.boss

          ? 25

          : Math.floor(
              rand(
                2,
                15
              )
            )

      );

    }

  );


  const normal =

    definitions.filter(
      definition =>
        !definition.boss
    );


  for (
    let i = 0;
    i < 18 &&
    normal.length;
    i++
  ) {


    spawnCreature(

      pick(
        normal
      ),

      rand(
        -125,
        125
      ),

      rand(
        -125,
        125
      ),

      Math.floor(
        rand(
          2,
          16
        )
      )

    );

  }

}


/* =========================================================
   REAL HYPER SPHERE MODEL
========================================================= */

async function loadHyperSphere() {


  try {


    const asset =
      await loadOne(
        "assets/items/hyper-sphere.glb"
      );


    state.sphereModel =
      normalizeModel(
        asset.scene,
        0.36
      );


  } catch {


    state.sphereModel =
      null;

  }

}


/* =========================================================
   CREATE SPHERE

   Other spheres are original GALAXY 3D spheres.
========================================================= */

function createSphere(
  tier
) {


  if (
    tier === 3 &&
    state.sphereModel
  ) {


    const model =
      cloneSkinned(
        state.sphereModel
      );


    return model;

  }


  const definition =
    SPHERES[tier];


  const group =
    new THREE.Group();


  const shell =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.18,
        24,
        18
      ),

      new THREE.MeshStandardMaterial({

        color:
          definition.color,

        metalness:
          0.38,

        roughness:
          0.2,

        emissive:
          definition.color,

        emissiveIntensity:
          0.15

      })

    );


  const ring =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        0.185,
        0.022,
        8,
        28
      ),

      new THREE.MeshStandardMaterial({

        color:
          0xffffff,

        metalness:
          0.55,

        roughness:
          0.25

      })

    );


  ring.rotation.x =
    Math.PI / 2;


  group.add(
    shell,
    ring
  );


  return group;

}


/* =========================================================
   TARGET
========================================================= */

const raycaster =
  new THREE.Raycaster();


function findTarget() {


  raycaster.setFromCamera(

    new THREE.Vector2(
      0,
      0
    ),

    camera

  );


  const meshes = [];


  for (
    const creature of
    state.creatures
  ) {


    if (
      !creature.alive ||
      !creature.model.visible
    ) {
      continue;
    }


    creature.model.traverse(
      object => {


        if (
          object.isMesh
        ) {

          meshes.push(
            object
          );

        }

      }
    );

  }


  const hit =

    raycaster
      .intersectObjects(
        meshes,
        false
      )[0];


  state.target =

    hit &&
    hit.distance <
    30

      ? (
          hit.object
            .userData
            .creature ||
          null
        )

      : null;

}


/* =========================================================
   CAPTURE CHANCE
========================================================= */

function captureChance(

  creature,

  tier =
    state.save
      .selectedSphere

) {


  const weaken =

    1 -

    creature.hp /
    creature.maxHp;


  return clamp(

    (
      0.16 +
      weaken *
      0.72
    )

    *

    SPHERES[tier]
      .bonus

    /

    (
      1 +
      creature.def.rarity *
      0.22 +
      creature.level *
      0.015
    ),

    0.03,

    0.95

  );

}


/* =========================================================
   ATTACK
========================================================= */

function attackTarget() {


  const creature =
    state.target;


  if (
    !creature?.alive ||
    state.charging
  ) {
    return;
  }


  creature.hp =
    Math.max(

      0,

      creature.hp -

      (
        18 +
        state.save.level *
        1.5
      )

    );


  creature.aggressive =
    true;


  play(
    creature,
    "hurt"
  );


  msg(

    `${creature.def.name} HP ${Math.ceil(creature.hp)}`

  );


  if (
    creature.hp <=
    0
  ) {


    creature.alive =
      false;


    creature.model.visible =
      false;


    msg(
      `${creature.def.name} defeated`
    );


  } else {


    setTimeout(

      () => {


        if (
          creature.alive
        ) {


          play(

            creature,

            creature.def.mount ===
            "flying"

              ? "fly"

              : "run"

          );

        }

      },

      320

    );

  }

}


/* =========================================================
   HOLD Q
========================================================= */

function beginSphere() {


  if (
    state.charging ||
    state.mounted
  ) {
    return;
  }


  const tier =
    state.save
      .selectedSphere;


  if (
    (
      state.save
        .spheres[tier] ||
      0
    ) <= 0
  ) {


    msg(
      "No capture Spheres"
    );


    return;

  }


  state.charging =
    true;


  state.chargeStart =
    performance.now();


  state.heldSphere =
    createSphere(
      tier
    );


  scene.add(
    state.heldSphere
  );

}


/* =========================================================
   SPHERE IN HAND
========================================================= */

function updateHeldSphere() {


  if (
    !state.heldSphere
  ) {
    return;
  }


  const direction =
    new THREE.Vector3();


  camera.getWorldDirection(
    direction
  );


  const right =
    new THREE.Vector3()
      .crossVectors(
        direction,
        camera.up
      )
      .normalize();


  state.heldSphere
    .position
    .copy(
      camera.position
    )
    .add(

      direction
        .clone()
        .multiplyScalar(
          1.15
        )

    )
    .add(

      right
        .multiplyScalar(
          0.42
        )

    )
    .add(

      new THREE.Vector3(
        0,
        -0.34,
        0
      )

    );


  state.heldSphere
    .rotation
    .y +=
    0.06;

}


/* =========================================================
   RELEASE Q
========================================================= */

function releaseSphere() {


  if (
    !state.charging ||
    !state.heldSphere
  ) {
    return;
  }


  const tier =
    state.save
      .selectedSphere;


  state.save
    .spheres[tier]--;


  const charge =
    clamp(

      (
        performance.now() -
        state.chargeStart
      )

      /

      900,

      0.25,

      1

    );


  const direction =
    new THREE.Vector3();


  camera.getWorldDirection(
    direction
  );


  state.projectiles.push({

    mesh:
      state.heldSphere,

    velocity:

      direction
        .multiplyScalar(
          13 +
          13 *
          charge
        )
        .add(

          new THREE.Vector3(
            0,
            3.2 +
            2 *
            charge,
            0
          )

        ),

    life:
      5,

    tier,

    dead:
      false

  });


  state.heldSphere =
    null;


  state.charging =
    false;


  msg(
    `${SPHERES[tier].name} thrown`
  );

}


/* =========================================================
   CAPTURE
========================================================= */

function resolveCapture(
  creature,
  projectile
) {


  projectile.dead =
    true;


  projectile.mesh.visible =
    false;


  const chance =
    captureChance(

      creature,

      projectile.tier

    );


  creature.model.visible =
    false;


  msg(

    `Capturing ${creature.def.name}… ${Math.round(chance * 100)}%`

  );


  setTimeout(

    () => {


      if (
        Math.random() <
        chance
      ) {


        creature.alive =
          false;


        state.save.box.push(
          creature.def.id
        );


        if (
          state.save.party.length <
          5
        ) {


          state.save.party.push(
            creature.def.id
          );

        }


        state.save.xp +=

          40 *
          creature.def.rarity;


        msg(
          `${creature.def.name} captured!`
        );


        saveGame();


      } else {


        creature.model.visible =
          true;


        creature.aggressive =
          true;


        play(

          creature,

          creature.def.mount ===
          "flying"

            ? "fly"

            : "run"

        );


        msg(
          `${creature.def.name} escaped!`
        );

      }

    },

    900

  );

}


/* =========================================================
   SPHERE PROJECTILES
========================================================= */

function updateProjectiles(
  dt
) {


  for (
    const projectile of
    state.projectiles
  ) {


    if (
      projectile.dead
    ) {
      continue;
    }


    projectile.velocity.y -=

      9.8 *
      dt;


    projectile.mesh.position
      .addScaledVector(

        projectile.velocity,

        dt

      );


    projectile.mesh.rotation.x +=

      dt *
      8;


    projectile.mesh.rotation.z +=

      dt *
      5;


    projectile.life -=
      dt;


    for (
      const creature of
      state.creatures
    ) {


      if (
        !creature.alive ||
        !creature.model.visible
      ) {
        continue;
      }


      if (

        projectile.mesh
          .position
          .distanceTo(
            creature.model.position
          )

        <

        (
          creature.boss
            ? 2.5
            : 1.5
        )

      ) {


        resolveCapture(

          creature,

          projectile

        );


        break;

      }

    }


    if (
      projectile.life <=
      0 ||

      projectile.mesh
        .position
        .y <
      0.08
    ) {


      projectile.dead =
        true;

    }

  }


  state.projectiles =

    state.projectiles.filter(

      projectile => {


        if (
          projectile.dead
        ) {


          scene.remove(
            projectile.mesh
          );


          return false;

        }


        return true;

      }

    );

}


/* =========================================================
   SUMMON
========================================================= */

function summonCompanion() {


  if (
    state.mounted
  ) {
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
      "Companion recalled"
    );


    return;

  }


  const id =
    state.save.party[0];


  const definition =

    PAL_LIBRARY.find(

      definition =>
        definition.id ===
        id

    );


  const cached =

    definition &&

    state.cache.get(
      definition.id
    );


  if (
    !definition ||
    !cached
  ) {


    msg(
      "Capture a Pal first"
    );


    return;

  }


  const model =
    cloneAsset(
      cached
    );


  model.position.set(

    state.player.x +
    2,

    definition.mount ===
    "flying"

      ? 2

      : 0,

    state.player.z +
    2

  );


  world.add(
    model
  );


  const companion = {

    def:
      definition,

    model,

    clips:
      cached.clips ||
      [],

    mixer:
      null,

    currentAction:
      null,

    animMode:
      "",

    alive:
      true

  };


  makeMixer(

    companion,

    companion.clips

  );


  play(

    companion,

    definition.mount ===
    "flying"

      ? "fly"

      : "idle"

  );


  state.companion =
    companion;


  msg(
    `${definition.name} summoned`
  );

}


/* =========================================================
   MOUNT
========================================================= */

function toggleMount() {


  const companion =
    state.companion;


  if (
    !companion?.def.mount
  ) {


    msg(
      "Summon a mountable Pal first"
    );


    return;

  }


  state.mounted =
    !state.mounted;


  state.player.model.visible =
    !state.mounted;


  msg(

    state.mounted

      ? `Mounted ${companion.def.name}`

      : `Dismounted ${companion.def.name}`

  );

}


/* =========================================================
   COMPANION
========================================================= */

function updateCompanion(

  dt,

  forward,

  right,

  sprint

) {


  const companion =
    state.companion;


  if (
    !companion
  ) {
    return;
  }


  if (
    state.mounted
  ) {


    const speed =

      companion.def.mount ===
      "flying"

        ? 11

        : (
            sprint
              ? 10
              : 7
          );


    const sin =
      Math.sin(
        state.player.yaw
      );


    const cos =
      Math.cos(
        state.player.yaw
      );


    companion.model.position.x +=

      (
        -sin *
        forward

        +

        cos *
        right
      )

      *

      speed *

      dt;


    companion.model.position.z +=

      (
        -cos *
        forward

        -

        sin *
        right
      )

      *

      speed *

      dt;


    if (
      companion.def.mount ===
      "flying"
    ) {


      if (
        state.keys.has(
          "Space"
        )
      ) {


        companion.model.position.y +=

          6 *
          dt;

      }


      if (
        state.keys.has(
          "ControlLeft"
        )
      ) {


        companion.model.position.y -=

          6 *
          dt;

      }


      companion.model.position.y =
        clamp(

          companion.model.position.y,

          0.2,

          35

        );


      play(
        companion,
        "fly"
      );


    } else {


      companion.model.position.y =
        0;


      play(

        companion,

        (
          forward ||
          right
        )

          ? (
              sprint
                ? "run"
                : "walk"
            )

          : "idle"

      );

    }


    companion.model.rotation.y =
      state.player.yaw;


    state.player.x =
      companion.model.position.x;


    state.player.y =
      companion.model.position.y;


    state.player.z =
      companion.model.position.z;


    return;

  }


  const targetX =

    state.player.x +

    Math.cos(
      state.player.yaw
    ) *
    2.6;


  const targetZ =

    state.player.z -

    Math.sin(
      state.player.yaw
    ) *
    2.6;


  const dx =

    targetX -

    companion.model.position.x;


  const dz =

    targetZ -

    companion.model.position.z;


  const distance =
    Math.hypot(
      dx,
      dz
    );


  if (
    distance >
    1.5
  ) {


    companion.model.position.x +=

      dx *
      Math.min(
        1,
        dt *
        3.2
      );


    companion.model.position.z +=

      dz *
      Math.min(
        1,
        dt *
        3.2
      );


    companion.model.rotation.y =
      Math.atan2(
        dx,
        dz
      );


    play(

      companion,

      companion.def.mount ===
      "flying"

        ? "fly"

        : "run"

    );


  } else {


    play(

      companion,

      companion.def.mount ===
      "flying"

        ? "fly"

        : "idle"

    );

  }

}


/* =========================================================
   WILD PAL AI
========================================================= */

function updateWild(
  dt,
  now
) {


  for (
    const creature of
    state.creatures
  ) {


    if (
      !creature.alive ||
      !creature.model.visible
    ) {
      continue;
    }


    const dx =

      state.player.x -
      creature.x;


    const dz =

      state.player.z -
      creature.z;


    const distance =
      Math.hypot(
        dx,
        dz
      );


    if (
      creature.aggressive &&
      distance <
      28
    ) {


      creature.direction =
        Math.atan2(
          dx,
          dz
        );


      const speed =

        creature.def.speed *

        (
          creature.boss
            ? 1.05
            : 0.85
        );


      creature.x +=

        Math.sin(
          creature.direction
        ) *

        speed *

        dt;


      creature.z +=

        Math.cos(
          creature.direction
        ) *

        speed *

        dt;


      play(

        creature,

        creature.def.mount ===
        "flying"

          ? "fly"

          : "run"

      );


      if (

        distance <
        2.6 &&

        Math.random() <
        dt *
        0.65

      ) {


        state.player.hp =
          Math.max(

            0,

            state.player.hp -

            (
              creature.boss
                ? 16
                : 6
            )

          );


        play(
          creature,
          "attack"
        );


        msg(
          `${creature.def.name} hit you`
        );

      }


    } else {


      if (
        now >
        creature.changeAt
      ) {


        creature.direction +=

          rand(
            -1.3,
            1.3
          );


        creature.changeAt =

          now +

          rand(
            1600,
            3800
          );

      }


      const speed =

        creature.def.speed *
        0.16;


      creature.x +=

        Math.sin(
          creature.direction
        ) *

        speed *

        dt;


      creature.z +=

        Math.cos(
          creature.direction
        ) *

        speed *

        dt;


      play(

        creature,

        creature.def.mount ===
        "flying"

          ? "fly"

          : "walk"

      );

    }


    creature.model.position.x =
      creature.x;


    creature.model.position.z =
      creature.z;


    creature.model.rotation.y =
      creature.direction;


    if (
      creature.def.mount ===
      "flying"
    ) {


      creature.model.position.y =

        creature.boss

          ? 7

          : 2.2 +

            Math.sin(

              now *
              0.0015 +

              creature.bobSeed

            ) *
            0.4;

    }

  }

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {


  const setBar =
    (
      id,
      value
    ) => {


      const element =
        $(id);


      if (
        element
      ) {


        element.style.width =
          `${clamp(
            value,
            0,
            100
          )}%`;

      }

    };


  setBar(
    "#hpBar",
    state.player.hp
  );


  setBar(
    "#staminaBar",
    state.player.stamina
  );


  setBar(
    "#foodBar",
    state.player.hunger
  );


  if (
    $("#hpText")
  ) {


    $("#hpText").textContent =
      Math.round(
        state.player.hp
      );

  }


  if (
    $("#staminaText")
  ) {


    $("#staminaText").textContent =
      Math.round(
        state.player.stamina
      );

  }


  if (
    $("#foodText")
  ) {


    $("#foodText").textContent =
      Math.round(
        state.player.hunger
      );

  }


  const card =
    $("#targetCard");


  if (
    card
  ) {


    if (
      state.target?.alive
    ) {


      card.hidden =
        false;


      $("#targetName").textContent =

        state.target.def.name +

        (
          state.target.boss
            ? " • BOSS"
            : ""
        );


      $("#targetMeta").textContent =

        `LV ${state.target.level} • ${state.target.def.element}`;


      $("#captureChance").textContent =

        `${Math.round(
          captureChance(
            state.target
          ) *
          100
        )}%`;


      $("#targetHpBar")
        .style
        .width =

        `${100 *
        state.target.hp /
        state.target.maxHp}%`;


    } else {


      card.hidden =
        true;

    }

  }


  if (
    $("#feed")
  ) {


    $("#feed").innerHTML =

      state.feed

        .filter(

          item =>

            performance.now() -
            item.time <
            5200

        )

        .map(

          item =>
            `<div>${item.text}</div>`

        )

        .join("");

  }


  if (
    $("#orbHud")
  ) {


    $("#orbHud").innerHTML =

      SPHERES.map(

        (
          sphere,
          index
        ) => `

          <div class="orb-slot ${
            index ===
            state.save.selectedSphere
              ? "active"
              : ""
          }">

            <strong>
              ${index + 1}
            </strong>

            <span>
              ${sphere.name}
            </span>

            <small>
              x${
                state.save.spheres[index] ||
                0
              }
            </small>

          </div>

        `

      ).join("");

  }


  if (
    $("#partyHud")
  ) {


    $("#partyHud").innerHTML =

      state.save.party

        .slice(
          0,
          5
        )

        .map(
          id => {


            const definition =

              PAL_LIBRARY.find(

                definition =>
                  definition.id ===
                  id

              );


            if (
              !definition
            ) {
              return "";
            }


            return `

              <div class="party-card">

                <strong>
                  ${definition.name}
                </strong>

                <span>
                  ${definition.element}
                </span>

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


      location.reload();

    }

  );


/* =========================================================
   START
========================================================= */

await loadPlayer();


await loadHyperSphere();


const loaded =
  await loadPals();


if (
  !loaded
) {


  loading.innerHTML = `

    <div class="loading-card">

      <div class="logo-mark">
        ✦
      </div>

      <h1>
        NO PAL MODEL FOUND
      </h1>

      <p>
        Put extracted GLB, FBX, OBJ or STL files inside assets/pals
      </p>

    </div>

  `;


} else {


  spawnWorldPals();


  loading?.remove();


  msg(

    `Loaded ${loaded} 3D Pal model${
      loaded === 1
        ? ""
        : "s"
    }`

  );

}


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


  const sprint =

    state.keys.has(
      "ShiftLeft"
    )

    &&

    player.stamina >
    2;


  /* PLAYER */

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

      speed *

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

      speed *

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


    player.y =
      0;


    player.model.position.set(

      player.x,

      player.y,

      player.z

    );


    player.model.rotation.y =
      player.yaw;


    play(

      player,

      (
        forward ||
        right
      )

        ? (
            sprint
              ? "run"
              : "walk"
          )

        : "idle"

    );

  }


  /* STAMINA */

  player.stamina =
    clamp(

      player.stamina +

      (
        sprint &&
        (
          forward ||
          right
        )

          ? -18

          : 13
      )

      *

      dt,

      0,

      100

    );


  /* FOOD */

  player.hunger =
    clamp(

      player.hunger -

      0.12 *
      dt,

      0,

      100

    );


  if (
    player.hunger <
    8
  ) {


    player.hp =
      Math.max(

        0,

        player.hp -

        0.45 *
        dt

      );

  }


  updateCompanion(

    dt,

    forward,

    right,

    sprint

  );


  updateWild(
    dt,
    now
  );


  updateProjectiles(
    dt
  );


  findTarget();


  updateHeldSphere();


  state.mixers.forEach(

    mixer =>
      mixer.update(
        dt
      )

  );


  /* THIRD PERSON CAMERA */

  const distance =

    state.mounted
      ? 9.5
      : 6.7;


  const targetY =

    state.mounted &&
    state.companion

      ? state.companion
          .model
          .position
          .y +
        1.8

      : 1.55;


  camera.position.set(

    player.x +

    Math.sin(
      player.yaw
    ) *
    distance,

    player.y +

    3.4 +

    player.pitch *
    3.2,

    player.z +

    Math.cos(
      player.yaw
    ) *
    distance

  );


  camera.lookAt(

    player.x,

    targetY,

    player.z

  );


  /* DAY NIGHT */

  state.worldTime +=

    dt *
    0.12;


  if (
    state.worldTime >=
    24
  ) {


    state.worldTime -=
      24;

  }


  const daylight =
    clamp(

      Math.sin(

        (
          state.worldTime -
          6
        )

        /

        24

        *

        Math.PI *
        2

      )

      *

      0.5

      +

      0.55,

      0.14,

      1

    );


  sun.intensity =

    0.35 +

    daylight *
    2;


  hemi.intensity =

    0.28 +

    daylight *
    1.2;


  sun.position.set(

    Math.sin(

      state.worldTime /
      24 *
      Math.PI *
      2

    ) *
    70,

    18 +

    daylight *
    60,

    Math.cos(

      state.worldTime /
      24 *
      Math.PI *
      2

    ) *
    70

  );


  if (
    $("#clockText")
  ) {


    $("#clockText").textContent =

      `DAY 1 • ${

        String(
          Math.floor(
            state.worldTime
          )
        )
        .padStart(
          2,
          "0"
        )

      }:${

        String(

          Math.floor(

            (
              state.worldTime %
              1
            )

            *

            60

          )

        )
        .padStart(
          2,
          "0"
        )

      }`;

  }


  updateHUD();


  renderer.render(

    scene,

    camera

  );


  /* AUTO SAVE */

  if (

    now -

    state.lastSave >

    5000

  ) {


    saveGame();


    state.lastSave =
      now;

  }


  requestAnimationFrame(
    loop
  );

}


requestAnimationFrame(
  loop
);
function openGalaxyPals() {
  window.location.href = "https://galaxy-csxwhhb4q-harshavardhan5.vercel.app";
}
