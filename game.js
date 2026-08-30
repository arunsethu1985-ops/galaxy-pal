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
