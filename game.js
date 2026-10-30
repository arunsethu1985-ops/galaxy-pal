import * as THREE from "https://esm.sh/three@0.180.0";

/* =====================================================
   GALAXY PALFRONTIER
   GRAPHICS & ANIMATION EDITION
   COMPLETE CORRECTED GAME.JS

   Original creature-collecting adventure
   ===================================================== */

const $ = id => document.getElementById(id);

const SAVE_KEY = "galaxy-palfrontier-wild-isles-v1";
const WORLD = 110;

const keys = {};

let saved = {};

try {
  saved = JSON.parse(
    localStorage.getItem(SAVE_KEY) || "{}"
  );
} catch (error) {
  console.warn("Save loading failed:", error);
  saved = {};
}

const bag = {
  wood: 12,
  stone: 9,
  crystal: 5,
  berries: 8,
  fiber: 7,
  orbs: 8,
  meals: 3,
  ...(saved.bag || {})
};

let hp = saved.hp ?? 100;
let food = saved.food ?? 100;
let worldTime = saved.day ?? 30;

let playing = false;
let flying = false;
let cameraView = 0;
let panel = "";

let cooldown = 0;
let toastTime = 0;
let selected = Math.min(saved.selected || 0, 4);

/* =====================================================
   CREATURE TYPES
   ===================================================== */

const types = {
  Bloomlet: {
    body: 0x83d48a,
    trim: 0xd5f1b4,
    accent: 0x3c9669,
    emoji: "🌿",
    element: "Leaf",
    speed: 1.7
  },

  Cinderfox: {
    body: 0xf19757,
    trim: 0xffd89f,
    accent: 0xb95739,
    emoji: "🔥",
    element: "Flame",
    speed: 2.5
  },

  Tidepup: {
    body: 0x78bce4,
    trim: 0xc8f2ff,
    accent: 0x4a82bd,
    emoji: "💧",
    element: "Tide",
    speed: 2
  },

  Sparkit: {
    body: 0xf5d36f,
    trim: 0xfff1b6,
    accent: 0xa98537,
    emoji: "⚡",
    element: "Spark",
    speed: 2.7
  },

  Moonhorn: {
    body: 0xcab5ee,
    trim: 0xf9f6ff,
    accent: 0x8865c8,
    emoji: "✨",
    element: "Moon",
    speed: 1.6
  },

  Brambleon: {
    body: 0x6fbaa7,
    trim: 0x9de0b9,
    accent: 0x39775f,
    emoji: "🌲",
    element: "Forest",
    speed: 1.4
  }
};

const species = Object.keys(types);

const party = (
  Array.isArray(saved.party)
    ? saved.party
    : []
).filter(name => types[name]).slice(0, 5);

/* =====================================================
   INITIAL UI SETUP
   ===================================================== */

$("menu").hidden = false;
$("hud").hidden = true;
$("panel").hidden = true;

function toast(message) {
  $("toast").textContent = message;
  toastTime = 3;
}

function add(item, amount = 1) {
  bag[item] = (bag[item] || 0) + amount;
}

function have(cost) {
  return Object.entries(cost).every(
    ([item, amount]) =>
      (bag[item] || 0) >= amount
  );
}

function spend(cost) {
  if (!have(cost)) return false;

  for (const [item, amount] of Object.entries(cost)) {
    bag[item] -= amount;
  }

  return true;
}

/* =====================================================
   THREE.JS RENDERER
   ===================================================== */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x96d4ee);
scene.fog = new THREE.FogExp2(
  0xa5d6e7,
  0.0085
);

const camera = new THREE.PerspectiveCamera(
  68,
  window.innerWidth / window.innerHeight,
  0.1,
  350
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 1.5)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;

document.body.appendChild(renderer.domElement);

// Ensure the canvas sits behind the HTML interface.
renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "0";
renderer.domElement.style.display = "block";

/* =====================================================
   LIGHTING
   ===================================================== */

const hemi = new THREE.HemisphereLight(
  0xe7f7ff,
  0x567c57,
  1.9
);

scene.add(hemi);

const sun = new THREE.DirectionalLight(
  0xffe3b6,
  2.3
);

sun.position.set(35, 65, 27);
sun.castShadow = true;

sun.shadow.mapSize.set(1024, 1024);

sun.shadow.camera.left = -65;
sun.shadow.camera.right = 65;
sun.shadow.camera.top = 65;
sun.shadow.camera.bottom = -65;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 170;

sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.03;

scene.add(sun);

/* =====================================================
   MATERIALS AND SHAPES
   ===================================================== */

const materials = new Map();

const geometries = {
  sphere: new THREE.SphereGeometry(1, 12, 9),
  low: new THREE.IcosahedronGeometry(1, 1),
  box: new THREE.BoxGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(1, 1, 7),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 8)
};

function material(color, glow = false) {
  const key = `${color}:${glow}`;

  if (!materials.has(key)) {
    materials.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.78,
        metalness: 0.02,
        emissive: glow ? color : 0x000000,
        emissiveIntensity: glow ? 0.35 : 0
      })
    );
  }

  return materials.get(key);
}

function part(
  parent,
  form,
  color,
  x, y, z,
  sx = 1, sy = 1, sz = 1,
  glow = false
) {
  const object = new THREE.Mesh(
    geometries[form],
    material(color, glow)
  );

  object.position.set(x, y, z);
  object.scale.set(sx, sy, sz);

  object.castShadow = true;
  object.receiveShadow = true;

  parent.add(object);

  return object;
}

function random(x, z, seed = 0) {
  const value = Math.sin(
    x * 127.1 +
    z * 311.7 +
    seed * 78.7
  ) * 43758.5453;

  return value - Math.floor(value);
}

/* =====================================================
   TERRAIN
   ===================================================== */

function height(x, z) {
  return (
    2 +
    Math.sin(x * 0.045) * 3.3 +
    Math.cos(z * 0.037) * 2.4 +
    Math.sin((x + z) * 0.07) * 1.6 +
    Math.sin(x * 0.016 + z * 0.011) * 4.1
  );
}

function biome(x, z) {
  if (x > 28 && z < -22) {
    return "Blossom Ridge";
  }

  if (x < -28 && z > 8) {
    return "Ancient Woodland";
  }

  if (x > 35 && z > 25) {
    return "Golden Savannah";
  }

  return "Emerald Meadow";
}

const terrain = new THREE.PlaneGeometry(
  WORLD * 2,
  WORLD * 2,
  110,
  110
);

terrain.rotateX(-Math.PI / 2);

const positions = terrain.attributes.position;
const terrainColors = [];

for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const z = positions.getZ(i);

  positions.setY(i, height(x, z));

  const area = biome(x, z);

  const color = new THREE.Color(
    area === "Blossom Ridge"
      ? 0x90be7a
      : area === "Ancient Woodland"
        ? 0x408b68
        : area === "Golden Savannah"
          ? 0xb5bd78
          : 0x68ad6b
  );

  color.multiplyScalar(
    0.89 + random(x, z, 2) * 0.22
  );

  terrainColors.push(
    color.r,
    color.g,
    color.b
  );
}

terrain.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(
    terrainColors,
    3
  )
);

terrain.computeVertexNormals();

const ground = new THREE.Mesh(
  terrain,
  new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1
  })
);

ground.receiveShadow = true;

scene.add(ground);

/* =====================================================
   ANIMATED WATER
   ===================================================== */

const waterUniforms = {
  time: { value: 0 },
  tint: {
    value: new THREE.Color(0x50bfc9)
  }
};

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(
    WORLD * 2,
    WORLD * 2
  ),

  new THREE.ShaderMaterial({
    uniforms: waterUniforms,

    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,

    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorld;

      uniform float time;

      void main() {
        vUv = uv;

        vec3 p = position;

        p.z +=
          sin(p.x * 0.045 + time * 0.8) * 0.23 +
          cos(p.y * 0.07 - time * 0.7) * 0.13;

        vec4 worldPosition =
          modelMatrix * vec4(p, 1.0);

        vWorld = worldPosition.xyz;

        gl_Position =
          projectionMatrix *
          viewMatrix *
          worldPosition;
      }
    `,

    fragmentShader: `
      uniform vec3 tint;
      uniform float time;

      varying vec2 vUv;
      varying vec3 vWorld;

      void main() {
        float wave =
          sin(vWorld.x * 0.26 + time * 1.8) *
          cos(vWorld.z * 0.21 - time * 0.9);

        float shine = pow(
          max(
            0.0,
            sin(
              vWorld.x * 0.8 +
              vWorld.z * 0.25 +
              time * 2.2
            )
          ),
          15.0
        );

        vec3 color =
          tint +
          vec3(0.05, 0.10, 0.12) * wave +
          vec3(0.23, 0.33, 0.34) * shine;

        gl_FragColor = vec4(color, 0.77);
      }
    `
  })
);

water.rotation.x = -Math.PI / 2;
water.position.y = -1.1;

scene.add(water);

/* =====================================================
   RESOURCES AND TREES
   ===================================================== */

const animatedTrees = [];
const resources = [];

function createResource(
  type,
  x,
  z,
  amount,
  group
) {
  group.position.set(x, height(x, z), z);

  scene.add(group);

  resources.push({
    type,
    x,
    z,
    amount,
    group
  });
}

function createTree(x, z, kind = "oak") {
  const group = new THREE.Group();

  const giant = kind === "ancient";
  const cherry = kind === "cherry";

  const treeHeight = giant ? 10 : 5.5;

  part(
    group,
    "cylinder",
    giant ? 0x5d5141 : 0x855f42,
    0,
    treeHeight / 2,
    0,
    giant ? 0.67 : 0.36,
    treeHeight,
    giant ? 0.67 : 0.36
  );

  const colors = cherry
    ? [0xf8b3d5, 0xffd1e3, 0xe895bc]
    : giant
      ? [0x286b66, 0x3c8870, 0x50a080]
      : [0x428e4e, 0x5dad61, 0x80c572];

  const count = giant ? 11 : 7;

  for (let i = 0; i < count; i++) {
    const angle = i * 2.4;

    const radius =
      i === 0
        ? 0
        : giant ? 3.3 : 1.4;

    part(
      group,
      "low",
      colors[i % 3],
      Math.cos(angle) * radius,
      treeHeight + Math.sin(i * 2) * 0.7,
      Math.sin(angle) * radius,
      giant ? 2.4 : 1.6,
      giant ? 1.7 : 1.27,
      giant ? 2.4 : 1.6
    );
  }

  createResource(
    "wood",
    x,
    z,
    giant ? 7 : 4,
    group
  );

  animatedTrees.push({
    group,
    phase: random(x, z, 28) * Math.PI * 2,
    sway: giant ? 0.004 : 0.01
  });
}

function createRock(x, z, crystal = false) {
  const group = new THREE.Group();

  if (crystal) {
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;

      part(
        group,
        "cone",
        i % 2 ? 0x73e5e6 : 0xb19bff,
        Math.cos(angle) * 0.64,
        1.2,
        Math.sin(angle) * 0.64,
        0.58,
        2.4,
        0.58,
        true
      );
    }
  } else {
    part(
      group,
      "low",
      0x87989c,
      0, 0.64, 0,
      1.2, 0.9, 1
    );

    part(
      group,
      "low",
      0xb1b8b3,
      0.72, 0.38, 0.35,
      0.6, 0.5, 0.6
    );
  }

  createResource(
    crystal ? "crystal" : "stone",
    x,
    z,
    crystal ? 2 : 4,
    group
  );
}

function createBush(x, z) {
  const group = new THREE.Group();

  part(
    group,
    "low",
    0x397e51,
    0, 0.62, 0,
    0.96, 0.75, 0.9
  );

  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 7;

    part(
      group,
      "sphere",
      0xe96983,
      Math.cos(angle) * 0.62,
      0.73,
      Math.sin(angle) * 0.62,
      0.14, 0.14, 0.14
    );
  }

  createResource(
    "berries",
    x,
    z,
    4,
    group
  );
}

function createGrass(x, z) {
  const group = new THREE.Group();

  for (let i = 0; i < 3; i++) {
    const blade = part(
      group,
      "cone",
      i % 2 ? 0x60ab67 : 0x418d54,
      (i - 1) * 0.13,
      0.24,
      0,
      0.1, 0.5, 0.1
    );

    blade.rotation.z = (i - 1) * 0.3;
  }

  group.position.set(
    x,
    height(x, z),
    z
  );

  scene.add(group);
}

/* =====================================================
   WORLD GENERATION
   ===================================================== */

for (let i = 0; i < 190; i++) {
  const x =
    (random(i, 2, 7) - 0.5) * 206;

  const z =
    (random(i, 7, 9) - 0.5) * 206;

  if (Math.hypot(x, z) < 14) continue;

  const chance = random(i, 13, 4);
  const area = biome(x, z);

  if (chance < 0.46) {
    let kind = "oak";

    if (area === "Blossom Ridge") {
      kind = "cherry";
    } else if (
      area === "Ancient Woodland" &&
      chance < 0.2
    ) {
      kind = "ancient";
    }

    createTree(x, z, kind);

  } else if (chance < 0.70) {

    createRock(x, z, chance > 0.64);

  } else if (chance < 0.84) {

    createBush(x, z);

  } else {

    createGrass(x, z);

  }
}

/* =====================================================
   THOUSANDS OF ANIMATED GRASS BLADES
   ===================================================== */

const grassMaterial = new THREE.MeshStandardMaterial({
  color: 0x71c468,
  side: THREE.DoubleSide,
  roughness: 1
});

const grassGeometry = new THREE.BufferGeometry();

grassGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(
    [
      -0.075, 0, 0,
       0.075, 0, 0,
       0, 0.65, 0
    ],
    3
  )
);

grassGeometry.setIndex([0, 1, 2]);
grassGeometry.computeVertexNormals();

grassMaterial.onBeforeCompile = shader => {
  shader.uniforms.windTime = {
    value: 0
  };

  grassMaterial.userData.windUniform =
    shader.uniforms.windTime;

  shader.vertexShader = shader.vertexShader.replace(
    "#include <common>",
    `
      #include <common>
      uniform float windTime;
    `
  );

  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `
      #include <begin_vertex>

      transformed.x +=
        sin(
          windTime * 1.8 +
          instanceMatrix[3].x * 0.3 +
          instanceMatrix[3].z * 0.23
        ) * 0.15 * position.y;
    `
  );
};

const grassCount = 4200;

const grassInstances = new THREE.InstancedMesh(
  grassGeometry,
  grassMaterial,
  grassCount
);

grassInstances.frustumCulled = false;

const dummy = new THREE.Object3D();
const grassColor = new THREE.Color();

for (let i = 0; i < grassCount; i++) {
  const x =
    (random(i, 31, 1) - 0.5) * 200;

  const z =
    (random(i, 39, 7) - 0.5) * 200;

  dummy.position.set(
    x,
    height(x, z) + 0.03,
    z
  );

  dummy.rotation.set(
    0,
    random(i, 17, 2) * Math.PI * 2,
    (random(i, 11, 8) - 0.5) * 0.27
  );

  dummy.scale.setScalar(
    0.6 + random(i, 24, 3) * 1.3
  );

  dummy.updateMatrix();

  grassInstances.setMatrixAt(
    i,
    dummy.matrix
  );

  grassColor.setHSL(
    0.24 + random(i, 32, 12) * 0.08,
    0.43 + random(i, 14, 6) * 0.2,
    0.35 + random(i, 18, 2) * 0.18
  );

  grassInstances.setColorAt(
    i,
    grassColor
  );
}

grassInstances.instanceMatrix.needsUpdate = true;

if (grassInstances.instanceColor) {
  grassInstances.instanceColor.needsUpdate = true;
}

scene.add(grassInstances);

/* =====================================================
   MOVING CLOUDS
   ===================================================== */

const clouds = [];

for (let i = 0; i < 16; i++) {
  const group = new THREE.Group();

  const cloudMaterial = material(
    i % 3 === 0 ? 0xffefdf : 0xf8fbff
  );

  for (let j = 0; j < 5; j++) {
    const puff = new THREE.Mesh(
      geometries.sphere,
      cloudMaterial
    );

    puff.position.set(
      (j - 2) * 2.6,
      Math.sin(j * 2) * 0.5,
      (j % 2) * 1.5
    );

    puff.scale.set(3.3, 1.15, 2);

    group.add(puff);
  }

  group.position.set(
    (random(i, 8, 91) - 0.5) * 230,
    31 + random(i, 9, 92) * 20,
    (random(i, 10, 93) - 0.5) * 230
  );

  scene.add(group);

  clouds.push({
    group,
    speed:
      0.25 + random(i, 4, 94) * 0.22
  });
}

/* =====================================================
   FIREFLIES
   ===================================================== */

const fireflies = [];

for (let i = 0; i < 90; i++) {
  const fireflyMaterial = new THREE.MeshBasicMaterial({
    color: 0xfbe9a8,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.065,
      5,
      4
    ),
    fireflyMaterial
  );

  const x =
    (random(i, 37, 6) - 0.5) * 165;

  const z =
    (random(i, 44, 8) - 0.5) * 165;

  mesh.position.set(
    x,
    height(x, z) +
      1 +
      random(i, 41, 5) * 3,
    z
  );

  scene.add(mesh);

  fireflies.push({
    mesh,
    x,
    z,
    phase:
      random(i, 10, 4) *
      Math.PI * 2
  });
}

/* =====================================================
   FLOWERS
   ===================================================== */

const flowers = [];

for (let i = 0; i < 170; i++) {
  const x =
    (random(i, 19, 77) - 0.5) * 202;

  const z =
    (random(i, 20, 78) - 0.5) * 202;

  if (Math.hypot(x, z) < 8) continue;

  const group = new THREE.Group();

  part(
    group,
    "cylinder",
    0x408b4c,
    0, 0.23, 0,
    0.025, 0.44, 0.025
  );

  const colors = [
    0xffca85,
    0xf0b6df,
    0xc6c3ff,
    0xfcebad
  ];

  const color = colors[i % 4];

  for (let j = 0; j < 5; j++) {
    const angle =
      j * Math.PI * 2 / 5;

    part(
      group,
      "sphere",
      color,
      Math.cos(angle) * 0.14,
      0.49,
      Math.sin(angle) * 0.14,
      0.12, 0.08, 0.12
    );
  }

  part(
    group,
    "sphere",
    0xffe492,
    0, 0.49, 0,
    0.095, 0.09, 0.095,
    true
  );

  group.position.set(
    x,
    height(x, z),
    z
  );

  scene.add(group);

  flowers.push({
    group,
    phase:
      random(i, 5, 2) *
      Math.PI * 2
  });
}

/* =====================================================
   PARTICLE EFFECTS
   ===================================================== */

const particles = [];

function burst(
  position,
  color = 0x9dfbe0,
  count = 24,
  power = 5
) {
  const geometry = new THREE.SphereGeometry(
    0.075,
    5,
    4
  );

  const particleMaterial =
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

  for (let i = 0; i < count; i++) {
    const object = new THREE.Mesh(
      geometry,
      particleMaterial
    );

    object.position.copy(position);

    const angle =
      Math.random() * Math.PI * 2;

    const elevation =
      Math.random() * Math.PI;

    const velocity =
      power * (0.3 + Math.random() * 0.7);

    scene.add(object);

    particles.push({
      object,

      velocity: new THREE.Vector3(
        Math.cos(angle) *
          Math.sin(elevation) *
          velocity,

        Math.cos(elevation) *
          velocity * 0.75 + 1,

        Math.sin(angle) *
          Math.sin(elevation) *
          velocity
      ),

      age: 0,
      life:
        0.6 + Math.random() * 0.6
    });
  }
}

function updateEffects(dt) {
  const t = worldTime;

  waterUniforms.time.value = t;

  if (grassMaterial.userData.windUniform) {
    grassMaterial.userData.windUniform.value = t;
  }

  for (const cloud of clouds) {
    cloud.group.position.x +=
      cloud.speed * dt;

    if (cloud.group.position.x > 145) {
      cloud.group.position.x = -145;
    }
  }

  for (const tree of animatedTrees) {
    tree.group.rotation.z =
      Math.sin(t * 0.8 + tree.phase) *
      tree.sway;
  }

  for (const firefly of fireflies) {
    firefly.mesh.position.x =
      firefly.x +
      Math.sin(
        t * 0.55 + firefly.phase
      ) * 1.8;

    firefly.mesh.position.y =
      height(firefly.x, firefly.z) +
      1.5 +
      Math.sin(
        t * 2 + firefly.phase
      ) * 0.6;

    firefly.mesh.material.opacity =
      0.5 +
      0.4 *
      Math.pow(
        Math.sin(t * 2 + firefly.phase),
        2
      );
  }

  for (const flower of flowers) {
    flower.group.rotation.z =
      Math.sin(
        t * 1.3 + flower.phase
      ) * 0.08;
  }

  for (
    let i = particles.length - 1;
    i >= 0;
    i--
  ) {
    const p = particles[i];

    p.age += dt;

    p.object.position.addScaledVector(
      p.velocity,
      dt
    );

    p.velocity.y -= 9 * dt;

    p.object.scale.setScalar(
      Math.max(
        0.01,
        1 - p.age / p.life
      )
    );

    if (p.age >= p.life) {
      scene.remove(p.object);
      particles.splice(i, 1);
    }
  }
}

/* =====================================================
   PLAYER CHARACTER
   ===================================================== */

const player = new THREE.Group();
const visual = new THREE.Group();

player.add(visual);

part(
  visual,
  "box",
  0x326d9b,
  0, 1.28, 0,
  0.78, 1, 0.45
);

part(
  visual,
  "sphere",
  0xd7a982,
  0, 2.08, 0,
  0.43, 0.47, 0.42
);

part(
  visual,
  "sphere",
  0x3b3031,
  0, 2.43, 0.08,
  0.47, 0.2, 0.42
);

const arms = [];
const legs = [];

for (const side of [-1, 1]) {
  const arm = new THREE.Group();

  arm.position.set(
    side * 0.54,
    1.66,
    0
  );

  part(
    arm,
    "box",
    0x326d9b,
    0, -0.37, 0,
    0.27, 0.77, 0.3
  );

  visual.add(arm);
  arms.push(arm);

  const leg = new THREE.Group();

  leg.position.set(
    side * 0.21,
    0.79,
    0
  );

  part(
    leg,
    "box",
    0x31496d,
    0, -0.4, 0,
    0.3, 0.8, 0.33
  );

  visual.add(leg);
  legs.push(leg);

  part(
    visual,
    "sphere",
    0xffffff,
    side * 0.18,
    2.12,
    -0.4,
    0.08, 0.08, 0.045
  );

  part(
    visual,
    "sphere",
    0x24364a,
    side * 0.18,
    2.12,
    -0.44,
    0.043, 0.05, 0.025
  );
}

player.position.set(
  saved.pos?.[0] ?? 0,
  saved.pos?.[1] ?? height(0, 0),
  saved.pos?.[2] ?? 0
);

scene.add(player);

let yaw = 0;
let pitch = 0.12;

let verticalVelocity = 0;
let grounded = false;

/* =====================================================
   CREATURE GENERATION
   ===================================================== */

const wild = [];
let buddy = null;

function createCreature(
  name,
  x,
  z,
  isBuddy = false
) {
  const type = types[name];

  const root = new THREE.Group();
  const model = new THREE.Group();

  root.add(model);

  const scale =
    name === "Brambleon" ? 1.35 :
    name === "Moonhorn" ? 1.15 :
    0.9;

  model.scale.setScalar(scale);

  part(
    model,
    "sphere",
    type.body,
    0, 1.13, 0,
    0.84, 0.76, 0.72
  );

  part(
    model,
    "sphere",
    type.trim,
    0, 1.01, -0.49,
    0.54, 0.49, 0.28
  );

  part(
    model,
    "sphere",
    type.body,
    0, 1.91, -0.23,
    0.69, 0.67, 0.63
  );

  for (const side of [-1, 1]) {
    const ear = part(
      model,
      "cone",
      type.accent,
      side * 0.43,
      2.58,
      -0.19,
      0.23,
      0.7,
      0.24
    );

    ear.rotation.z =
      -side * 0.23;

    part(
      model,
      "sphere",
      0xffffff,
      side * 0.25,
      2.02,
      -0.76,
      0.19,
      0.22,
      0.08
    );

    part(
      model,
      "sphere",
      0x28374a,
      side * 0.25,
      2.02,
      -0.85,
      0.09,
      0.13,
      0.04
    );

    for (const front of [-1, 1]) {
      part(
        model,
        "sphere",
        type.body,
        side * 0.43,
        0.46,
        front * 0.4,
        0.24, 0.31, 0.28
      );
    }
  }

  part(
    model,
    "sphere",
    0xf5a2ae,
    0, 1.75, -0.83,
    0.13, 0.09, 0.07
  );

  part(
    model,
    "sphere",
    type.body,
    0, 1.12, 0.69,
    0.36, 0.4, 0.49
  );

  if (name === "Moonhorn") {
    part(
      model,
      "cone",
      0xe8f4ff,
      0, 2.8, -0.3,
      0.16, 0.83, 0.17
    );
  }

  if (name === "Cinderfox") {
    part(
      model,
      "cone",
      0xffcd59,
      0, 1.3, 1.1,
      0.28, 0.8, 0.25,
      true
    );
  }

  if (name === "Sparkit") {
    const tail = part(
      model,
      "box",
      0xffda64,
      0, 1.2, 1.04,
      0.28, 0.26, 1
    );

    tail.rotation.x = 0.45;
  }

  if (name === "Brambleon") {
    for (let i = 0; i < 4; i++) {
      part(
        model,
        "cone",
        type.accent,
        0,
        1.7,
        i * 0.35,
        0.22, 0.48, 0.22
      );
    }
  }

  root.position.set(
    x,
    height(x, z),
    z
  );

  scene.add(root);

  const unit = {
    name,
    type,
    root,
    model,
    hp: 100,
    home: [x, z],
    state: "idle",
    timer: 0,
    angle:
      random(x, z, 6) *
      Math.PI * 2,
    phase:
      random(x, z, 8) *
      Math.PI * 2,
    isBuddy
  };

  root.userData.unit = unit;

  if (!isBuddy) {
    wild.push(unit);
  }

  return unit;
}

/* =====================================================
   POPULATE CREATURES
   ===================================================== */

for (let i = 0; i < 30; i++) {
  const angle =
    random(i, 2, 16) *
    Math.PI * 2;

  const distance =
    15 + random(i, 5, 18) * 87;

  const x =
    Math.cos(angle) * distance;

  const z =
    Math.sin(angle) * distance;

  const name = species[
    Math.floor(
      random(i, 9, 1) *
      species.length
    )
  ];

  createCreature(name, x, z);
}

/* =====================================================
   COMPANION PARTY
   ===================================================== */

function drawParty() {
  $("party").replaceChildren();

  for (let i = 0; i < 5; i++) {
    const slot =
      document.createElement("div");

    slot.className =
      "party-item" +
      (
        party[i] && selected === i
          ? " active"
          : ""
      );

    slot.textContent =
      party[i]
        ? types[party[i]].emoji
        : "＋";

    const label =
      document.createElement("small");

    label.textContent = i + 1;

    slot.append(label);
    $("party").append(slot);
  }
}

function setBuddy(index) {
  if (!party[index]) return;

  selected = index;

  if (buddy) {
    scene.remove(buddy.root);
    buddy = null;
  }

  buddy = createCreature(
    party[index],
    player.position.x + 2,
    player.position.z + 2,
    true
  );

  $("buddyName").textContent =
    types[buddy.name].emoji +
    " " +
    buddy.name;

  $("buddyMode").textContent =
    types[buddy.name].element +
    " · E to assist";

  drawParty();
}

if (party.length) {
  setBuddy(
    Math.min(selected, party.length - 1)
  );
} else {
  drawParty();
}

/* =====================================================
   CREATURE BEHAVIOR AND ANIMATIONS
   ===================================================== */

function updateCreatures(dt) {
  for (const creature of wild) {
    creature.timer -= dt;

    if (creature.timer <= 0) {
      creature.state =
        random(
          creature.root.position.x + worldTime,
          creature.root.position.z,
          7
        ) > 0.25
          ? "wander"
          : "idle";

      creature.timer =
        1.7 + Math.random() * 3;

      creature.angle +=
        (Math.random() - 0.5) * 2.6;
    }

    if (creature.state === "wander") {
      const step =
        creature.type.speed *
        0.35 *
        dt;

      const nx =
        creature.root.position.x +
        Math.sin(creature.angle) * step;

      const nz =
        creature.root.position.z +
        Math.cos(creature.angle) * step;

      if (
        Math.hypot(
          nx - creature.home[0],
          nz - creature.home[1]
        ) < 10 &&
        Math.abs(nx) < WORLD - 3 &&
        Math.abs(nz) < WORLD - 3
      ) {
        creature.root.position.x = nx;
        creature.root.position.z = nz;
      } else {
        creature.angle += Math.PI;
      }
    }

    creature.root.position.y = height(
      creature.root.position.x,
      creature.root.position.z
    );

    creature.root.rotation.y =
      creature.angle;

    creature.model.position.y =
      Math.sin(
        worldTime * 3 +
        creature.phase
      ) * 0.09;

    creature.model.rotation.z =
      Math.sin(
        worldTime * 2 +
        creature.phase
      ) * 0.025;

    const baseScale =
      creature.name === "Brambleon"
        ? 1.35
        : creature.name === "Moonhorn"
          ? 1.15
          : 0.9;

    creature.model.scale.y =
      baseScale *
      (
        1 +
        0.02 *
        Math.sin(
          worldTime * 2.2 +
          creature.phase
        )
      );
  }

  if (!buddy) return;

  const position = buddy.root.position;

  const dx =
    player.position.x - position.x;

  const dz =
    player.position.z - position.z;

  const distance = Math.hypot(dx, dz);

  if (distance > 32) {
    position.x =
      player.position.x + 2;

    position.z =
      player.position.z + 2;

  } else if (distance > 2.8) {

    const step = Math.min(
      distance - 2.8,
      buddy.type.speed * 2.3 * dt
    );

    position.x +=
      dx / distance * step;

    position.z +=
      dz / distance * step;

    buddy.root.rotation.y =
      Math.atan2(-dx, -dz);
  }

  position.y = height(
    position.x,
    position.z
  );

  buddy.model.position.y =
    Math.sin(worldTime * 4) * 0.12;

  buddy.model.rotation.z =
    Math.sin(worldTime * 2) * 0.035;
}

/* =====================================================
   PLAYER MOVEMENT
   ===================================================== */

function movementDirection() {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);

  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);

  let x = 0;
  let z = 0;

  if (keys.KeyW) {
    x += fx;
    z += fz;
  }

  if (keys.KeyS) {
    x -= fx;
    z -= fz;
  }

  if (keys.KeyA) {
    x -= rx;
    z -= rz;
  }

  if (keys.KeyD) {
    x += rx;
    z += rz;
  }

  const length = Math.hypot(x, z);

  if (!length) {
    return {
      x: 0,
      z: 0,
      moving: false
    };
  }

  return {
    x: x / length,
    z: z / length,
    moving: true
  };
}

function lookDirection() {
  return new THREE.Vector3(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  );
}

function updatePlayer(dt) {
  const movement = movementDirection();

  const sprint =
    keys.ShiftLeft ||
    keys.ShiftRight;

  const speed =
    flying ? 13 :
    sprint ? 10 : 6.5;

  player.position.x =
    THREE.MathUtils.clamp(
      player.position.x +
        movement.x * speed * dt,
      -WORLD + 2,
      WORLD - 2
    );

  player.position.z =
    THREE.MathUtils.clamp(
      player.position.z +
        movement.z * speed * dt,
      -WORLD + 2,
      WORLD - 2
    );

  const floor = height(
    player.position.x,
    player.position.z
  );

  if (flying) {
    const up =
      keys.Space ? 1 : 0;

    const down =
      keys.KeyX ? 1 : 0;

    player.position.y +=
      (up - down) * speed * dt;

    player.position.y =
      THREE.MathUtils.clamp(
        player.position.y,
        -2,
        100
      );

    verticalVelocity = 0;
    grounded = false;

  } else {

    verticalVelocity -= 23 * dt;

    if (keys.Space && grounded) {
      verticalVelocity = 9;
      grounded = false;
    }

    player.position.y +=
      verticalVelocity * dt;

    if (player.position.y <= floor) {
      player.position.y = floor;
      verticalVelocity = 0;
      grounded = true;
    }
  }

  if (movement.moving) {
    player.rotation.y =
      Math.atan2(
        -movement.x,
        -movement.z
      );
  }

  const step = movement.moving
    ? Math.sin(worldTime * 11) * 0.55
    : 0;

  arms[0].rotation.x = step;
  arms[1].rotation.x = -step;

  legs[0].rotation.x = -step;
  legs[1].rotation.x = step;
}

/* =====================================================
   CAMERA
   ===================================================== */

function updateCamera() {
  const eye = player.position.clone().add(
    new THREE.Vector3(
      0,
      1.75,
      0
    )
  );

  const direction = lookDirection();

  if (cameraView === 1) {
    camera.position.copy(eye);

    camera.rotation.set(
      pitch,
      yaw,
      0,
      "YXZ"
    );

    visual.visible = false;

  } else {

    visual.visible = true;

    const desired = eye.clone()
      .addScaledVector(
        direction,
        -6
      );

    desired.y += 1.4;

    camera.position.lerp(
      desired,
      0.28
    );

    camera.lookAt(
      eye.clone()
        .addScaledVector(
          direction,
          9
        )
    );
  }
}

/* =====================================================
   CREATURE TARGETING
   ===================================================== */

const raycaster = new THREE.Raycaster();

function aimedCreature() {
  raycaster.setFromCamera(
    new THREE.Vector2(0, 0),
    camera
  );

  raycaster.far = 25;

  const hits =
    raycaster.intersectObjects(
      wild.map(c => c.root),
      true
    );

  if (!hits.length) return null;

  let object = hits[0].object;

  while (
    object &&
    !object.userData.unit
  ) {
    object = object.parent;
  }

  return object?.userData.unit || null;
}

function nearestCreature(range = 19) {
  const target = aimedCreature();

  if (
    target &&
    target.root.position.distanceTo(
      player.position
    ) < range
  ) {
    return target;
  }

  let best = range;
  let selectedCreature = null;

  for (const creature of wild) {
    const distance =
      creature.root.position.distanceTo(
        player.position
      );

    if (distance < best) {
      best = distance;
      selectedCreature = creature;
    }
  }

  return selectedCreature;
}

/* =====================================================
   CAPTURE AND ATTACK PROJECTILES
   ===================================================== */

const projectiles = [];

function createProjectile(
  from,
  to,
  color
) {
  const object = part(
    scene,
    "sphere",
    color,
    0, 0, 0,
    0.23, 0.23, 0.23,
    true
  );

  projectiles.push({
    object,
    from: from.clone(),
    to: to.clone(),
    progress: 0
  });
}

function updateProjectiles(dt) {
  for (
    let i = projectiles.length - 1;
    i >= 0;
    i--
  ) {
    const projectile = projectiles[i];

    projectile.progress +=
      dt / 0.55;

    const t = Math.min(
      1,
      projectile.progress
    );

    projectile.object.position.lerpVectors(
      projectile.from,
      projectile.to,
      t
    );

    projectile.object.position.y +=
      Math.sin(t * Math.PI) * 2.4;

    if (t >= 1) {
      burst(
        projectile.to,
        projectile.object.material.color.getHex(),
        12,
        2.8
      );

      scene.remove(
        projectile.object
      );

      projectiles.splice(i, 1);
    }
  }
}

/* =====================================================
   CAPTURE CREATURE
   ===================================================== */

function capture() {
  if (!playing || cooldown > 0) {
    return;
  }

  if (party.length >= 5) {
    toast(
      "Party full — maximum 5 creatures"
    );
    return;
  }

  const creature = nearestCreature();

  if (!creature) {
    toast(
      "Get closer to a wild creature"
    );
    return;
  }

  if (!spend({ orbs: 1 })) {
    toast(
      "No capture orbs — craft more with C"
    );
    return;
  }

  cooldown = 0.7;

  const distance =
    creature.root.position.distanceTo(
      player.position
    );

  const chance =
    distance < 8 ? 0.92 : 0.70;

  const success =
    Math.random() < chance;

  const target = creature.root.position
    .clone()
    .add(
      new THREE.Vector3(
        0,
        1.4,
        0
      )
    );

  createProjectile(
    player.position.clone().add(
      new THREE.Vector3(
        0,
        1.7,
        0
      )
    ),
    target,
    success ? 0x7beedc : 0xbd9bff
  );

  if (success) {
    burst(
      target,
      0x9ef6dc,
      38,
      6
    );

    party.push(creature.name);

    scene.remove(creature.root);

    const index =
      wild.indexOf(creature);

    if (index >= 0) {
      wild.splice(index, 1);
    }

    setBuddy(
      party.length - 1
    );

    toast(
      `Captured ${creature.name}!`
    );

  } else {

    toast(
      `${creature.name} escaped — try again!`
    );
  }
}

/* =====================================================
   COMPANION ATTACK
   ===================================================== */

function commandCompanion() {
  if (!buddy) {
    toast(
      "Capture a creature first"
    );
    return;
  }

  if (cooldown > 0) return;

  const target =
    nearestCreature(14);

  if (!target) {
    toast(
      `${buddy.name} is following you`
    );
    return;
  }

  cooldown = 0.6;

  target.hp -= 40;

  createProjectile(
    buddy.root.position.clone().add(
      new THREE.Vector3(
        0,
        1.7,
        0
      )
    ),

    target.root.position.clone().add(
      new THREE.Vector3(
        0,
        1.4,
        0
      )
    ),

    buddy.type.body
  );

  if (target.hp <= 0) {
    burst(
      target.root.position.clone().add(
        new THREE.Vector3(
          0,
          1.3,
          0
        )
      ),
      buddy.type.body,
      30,
      5
    );

    scene.remove(target.root);

    const index =
      wild.indexOf(target);

    if (index >= 0) {
      wild.splice(index, 1);
    }

    add("crystal", 2);

    toast(
      `${buddy.name} defeated ${target.name}! +2 crystals`
    );

  } else {

    toast(
      `${buddy.name} used ${buddy.type.element} Burst!`
    );
  }
}

/* =====================================================
   GATHER RESOURCES
   ===================================================== */

function gather() {
  if (!playing || cooldown > 0) return;

  let nearestResource = null;
  let nearestDistance = 5;

  for (const resource of resources) {
    const distance =
      player.position.distanceTo(
        resource.group.position
      );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestResource = resource;
    }
  }

  if (!nearestResource) {
    toast(
      "Approach a tree, rock or berry bush"
    );
    return;
  }

  const resource = nearestResource;

  add(
    resource.type,
    resource.amount
  );

  const color =
    resource.type === "crystal"
      ? 0x93ecff
      : resource.type === "berries"
        ? 0xf67f99
        : 0xb6e9aa;

  burst(
    resource.group.position.clone().add(
      new THREE.Vector3(
        0,
        1,
        0
      )
    ),
    color,
    15,
    3
  );

  scene.remove(resource.group);

  const index =
    resources.indexOf(resource);

  if (index >= 0) {
    resources.splice(index, 1);
  }

  cooldown = 0.3;

  toast(
    `Collected ${resource.amount} ${resource.type}`
  );
}

/* =====================================================
   BASE BUILDING
   ===================================================== */

const buildingCosts = {
  hut: {
    wood: 8,
    stone: 5
  },

  bench: {
    wood: 5,
    stone: 3
  },

  shelter: {
    wood: 5,
    fiber: 3
  }
};

const buildings = [];

function makeBuilding(type, x, z) {
  const group = new THREE.Group();

  if (type === "hut") {
    part(
      group,
      "box",
      0xc0a280,
      0, 1.6, 0,
      5, 3.2, 4
    );

    const roof = part(
      group,
      "cone",
      0x876147,
      0, 3.95, 0,
      3.9, 2.5, 3.9
    );

    roof.rotation.y =
      Math.PI / 4;

    part(
      group,
      "box",
      0x684735,
      0, 1, -2.03,
      1.2, 2, 0.15
    );

    part(
      group,
      "box",
      0x9cdae9,
      -1.35, 2, -2.1,
      0.9, 1, 0.1
    );

  } else if (type === "bench") {

    part(
      group,
      "box",
      0x976e4c,
      0, 1.2, 0,
      2.2, 0.25, 1.3
    );

    for (const side of [-1, 1]) {
      part(
        group,
        "box",
        0x674a35,
        side * 0.82,
        0.58,
        0,
        0.19, 1.1, 0.2
      );
    }

  } else if (type === "shelter") {

    part(
      group,
      "box",
      0x886b51,
      0, 0.15, 0,
      4, 0.3, 4
    );

    for (const xOffset of [-1.7, 1.7]) {
      for (const zOffset of [-1.7, 1.7]) {
        part(
          group,
          "box",
          0x806248,
          xOffset,
          1.4,
          zOffset,
          0.2, 2.5, 0.2
        );
      }
    }

    const roof = part(
      group,
      "cone",
      0x66b590,
      0, 3, 0,
      3.2, 1.5, 3.2
    );

    roof.rotation.y =
      Math.PI / 4;
  }

  group.position.set(
    x,
    height(x, z),
    z
  );

  scene.add(group);

  buildings.push({
    type,
    x,
    z
  });
}

const savedBuildings =
  Array.isArray(saved.buildings)
    ? saved.buildings
    : [];

for (const building of savedBuildings) {
  if (
    buildingCosts[building.type] &&
    Number.isFinite(building.x) &&
    Number.isFinite(building.z)
  ) {
    makeBuilding(
      building.type,
      building.x,
      building.z
    );
  }
}

function build(type) {
  const cost =
    buildingCosts[type];

  if (!spend(cost)) {
    toast(
      "Not enough resources"
    );
    return;
  }

  const forward = lookDirection();

  const x =
    THREE.MathUtils.clamp(
      player.position.x +
        forward.x * 8,
      -WORLD + 5,
      WORLD - 5
    );

  const z =
    THREE.MathUtils.clamp(
      player.position.z +
        forward.z * 8,
      -WORLD + 5,
      WORLD - 5
    );

  makeBuilding(type, x, z);

  closePanel();

  toast(
    `${type.toUpperCase()} built!`
  );
}

/* =====================================================
   INVENTORY AND CRAFTING
   ===================================================== */

function createEntry(
  title,
  description,
  action = null,
  disabled = false
) {
  const row =
    document.createElement("div");

  row.className = "entry";

  const info =
    document.createElement("div");

  const strong =
    document.createElement("strong");

  strong.textContent = title;

  const small =
    document.createElement("small");

  small.textContent = description;

  info.append(strong, small);
  row.append(info);

  if (action) {
    const button =
      document.createElement("button");

    button.textContent = action[0];
    button.onclick = action[1];
    button.disabled = disabled;

    row.append(button);
  }

  $("entries").append(row);
}

function openPanel(mode) {
  panel = mode;

  $("panel").hidden = false;
  $("menu").hidden = true;

  playing = false;

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  drawPanel();
}

function closePanel() {
  panel = "";

  $("panel").hidden = true;

  playing = true;

  $("menu").hidden = true;
  $("hud").hidden = false;

  renderer.domElement
    .requestPointerLock()
    .catch(error => {
      console.warn(
        "Pointer lock unavailable:",
        error
      );
    });
}

function drawPanel() {
  $("entries").replaceChildren();

  $("panelTitle").textContent = {
    bag: "🎒 Inventory",
    craft: "⚒ Crafting",
    build: "⌂ Base Building",
    party: "🐾 Companions"
  }[panel] || "Inventory";

  if (panel === "bag") {
    for (
      const [item, amount]
      of Object.entries(bag)
    ) {
      createEntry(
        item.toUpperCase(),
        `${amount} available`
      );
    }

    createEntry(
      "CREATURE PARTY",
      `${party.length}/5 captured`,
      [
        "OPEN",
        () => openPanel("party")
      ]
    );
  }

  if (panel === "party") {
    if (!party.length) {
      createEntry(
        "No companions yet",
        "Capture creatures using Q"
      );
    }

    party.forEach((name, index) => {
      createEntry(
        `${types[name].emoji} ${name}`,
        types[name].element,
        [
          "FOLLOW",
          () => {
            setBuddy(index);
            closePanel();
          }
        ]
      );
    });
  }

  if (panel === "craft") {
    const crafts = [
      [
        "3 Capture Orbs",
        {
          stone: 2,
          crystal: 2
        },
        "orbs",
        3
      ],

      [
        "2 Meals",
        {
          berries: 3,
          wood: 1
        },
        "meals",
        2
      ]
    ];

    for (
      const [title, cost, item, amount]
      of crafts
    ) {
      const description =
        Object.entries(cost)
          .map(
            ([name, number]) =>
              `${number} ${name}`
          )
          .join(" + ");

      createEntry(
        title,
        description,
        [
          "CRAFT",
          () => {
            if (spend(cost)) {
              add(item, amount);

              drawPanel();

              toast(
                `Crafted ${title}`
              );
            } else {
              toast(
                "Need more resources"
              );
            }
          }
        ],
        !have(cost)
      );
    }
  }

  if (panel === "build") {
    for (
      const [type, cost]
      of Object.entries(buildingCosts)
    ) {
      const description =
        Object.entries(cost)
          .map(
            ([name, number]) =>
              `${number} ${name}`
          )
          .join(" + ");

      createEntry(
        type.toUpperCase(),
        description,
        [
          "BUILD",
          () => build(type)
        ],
        !have(cost)
      );
    }
  }
}

$("close").onclick = closePanel;

/* =====================================================
   FLYING
   ===================================================== */

function toggleFly() {
  flying = !flying;

  verticalVelocity = 0;

  $("fly").textContent =
    flying
      ? "✈ FLY OFF"
      : "✈ FLY ON";

  $("fly").classList.toggle(
    "active",
    flying
  );

  toast(
    flying
      ? "Flying ON — Space UP · X DOWN"
      : "Flying OFF"
  );
}

/* =====================================================
   SAVE GAME
   ===================================================== */

function saveGame(silent = false) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        bag,
        party,
        selected,
        hp,
        food,
        day: worldTime,
        pos: player.position.toArray(),
        buildings
      })
    );

    if (!silent) {
      toast("World saved!");
    }

  } catch (error) {

    console.error(
      "Save failed:",
      error
    );

    if (!silent) {
      toast(
        "Unable to save world"
      );
    }
  }
}

$("reset").onclick = () => {
  const confirmed = confirm(
    "Delete your saved Palfrontier world?"
  );

  if (!confirmed) return;

  localStorage.removeItem(SAVE_KEY);
  location.reload();
};

window.addEventListener(
  "beforeunload",
  () => saveGame(true)
);

/* =====================================================
   CORRECTED START ADVENTURE
   ===================================================== */

let gameStarted = false;

function startAdventure() {
  // Start gameplay before requesting pointer lock.
  gameStarted = true;
  playing = true;
  panel = "";

  $("menu").hidden = true;
  $("hud").hidden = false;
  $("panel").hidden = true;

  // Prevent a large frame jump after pressing START.
  clock.getDelta();

  toast(
    "Adventure started! WASD to move · Q to capture"
  );

  // Mouse lock is optional for the game to remain visible.
  if (
    document.pointerLockElement !==
    renderer.domElement
  ) {
    try {
      const request =
        renderer.domElement.requestPointerLock();

      if (request?.catch) {
        request.catch(error => {
          console.warn(
            "Mouse pointer lock unavailable:",
            error
          );

          playing = true;
          $("menu").hidden = true;
          $("hud").hidden = false;
        });
      }
    } catch (error) {
      console.warn(
        "Pointer lock not supported:",
        error
      );
    }
  }
}

// Use onclick rather than stacking multiple listeners.
$("start").onclick = startAdventure;

/* =====================================================
   CORRECTED POINTER LOCK HANDLING
   ===================================================== */

document.addEventListener(
  "pointerlockchange",
  () => {
    const locked =
      document.pointerLockElement ===
      renderer.domElement;

    if (locked) {
      playing = true;
      gameStarted = true;

      $("menu").hidden = true;
      $("hud").hidden = false;

    } else if (panel) {

      // Don't show the main menu behind an open panel.
      playing = false;
      $("menu").hidden = true;
      $("hud").hidden = false;

    } else if (gameStarted) {

      // Esc releases mouse lock and pauses the game.
      playing = false;

      $("menu").hidden = false;
      $("hud").hidden = true;
    }

    if (!playing) {
      for (const code of Object.keys(keys)) {
        keys[code] = false;
      }
    }
  }
);

/* =====================================================
   MOUSE MOVEMENT
   ===================================================== */

document.addEventListener(
  "mousemove",
  event => {
    if (!playing) return;

    if (
      document.pointerLockElement !==
      renderer.domElement
    ) {
      return;
    }

    yaw -=
      event.movementX * 0.0025;

    pitch =
      THREE.MathUtils.clamp(
        pitch -
          event.movementY * 0.0025,
        -0.9,
        1.05
      );
  }
);

/* =====================================================
   KEYBOARD CONTROLS
   ===================================================== */

document.addEventListener(
  "keydown",
  event => {
    if (
      ["Space", "ArrowUp", "ArrowDown"]
        .includes(event.code)
    ) {
      event.preventDefault();
    }

    if (
      panel &&
      event.code === "Escape"
    ) {
      closePanel();
      return;
    }

    // Don't record movement while the menu is open.
    if (!playing) return;

    keys[event.code] = true;

    if (event.repeat) return;

    switch (event.code) {
      case "KeyQ":
        capture();
        break;

      case "KeyE":
        commandCompanion();
        break;

      case "KeyI":
        openPanel("bag");
        break;

      case "KeyC":
        openPanel("craft");
        break;

      case "KeyB":
        openPanel("build");
        break;

      case "KeyF":
        toggleFly();
        break;

      case "KeyP":
        saveGame();
        break;

      case "KeyV":
        cameraView =
          1 - cameraView;

        toast(
          cameraView
            ? "First-person camera"
            : "Third-person camera"
        );
        break;

      case "KeyR":
        if (spend({ meals: 1 })) {
          food = Math.min(
            100,
            food + 35
          );

          hp = Math.min(
            100,
            hp + 12
          );

          toast("Ate a meal");

        } else if (
          spend({ berries: 2 })
        ) {
          food = Math.min(
            100,
            food + 15
          );

          toast("Ate berries");

        } else {
          toast("No food available");
        }
        break;
    }

    if (
      /^Digit[1-5]$/.test(
        event.code
      )
    ) {
      const index =
        Number(
          event.code.slice(-1)
        ) - 1;

      if (party[index]) {
        setBuddy(index);
      }
    }
  }
);

document.addEventListener(
  "keyup",
  event => {
    keys[event.code] = false;
  }
);

/* =====================================================
   MOUSE BUTTONS
   ===================================================== */

document.addEventListener(
  "contextmenu",
  event => {
    event.preventDefault();
  }
);

document.addEventListener(
  "mousedown",
  event => {
    if (
      playing &&
      event.button === 0 &&
      event.target === renderer.domElement
    ) {
      gather();
    }
  }
);

/* =====================================================
   ACTION BUTTONS
   ===================================================== */

$("capture").onclick = () => {
  if (playing) {
    capture();
  }
};

$("fly").onclick = () => {
  if (playing) {
    toggleFly();
  }
};

$("craft").onclick = () => {
  openPanel("craft");
};

$("build").onclick = () => {
  openPanel("build");
};

/* =====================================================
   GAME LOOP
   ===================================================== */

const clock = new THREE.Clock();

let fpsTimer = 0;
let fpsFrames = 0;

let hudTimer = 0;
let hungerTimer = 0;
let autoSaveTimer = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(
    0.04,
    clock.getDelta()
  );

  fpsTimer += dt;
  fpsFrames++;

  if (fpsTimer >= 1) {
    $("fps").textContent =
      "FPS " +
      Math.round(
        fpsFrames / fpsTimer
      );

    fpsFrames = 0;
    fpsTimer = 0;
  }

  if (playing) {
    worldTime += dt;

    updatePlayer(dt);
    updateCreatures(dt);

    cooldown = Math.max(
      0,
      cooldown - dt
    );

    hungerTimer += dt;
    autoSaveTimer += dt;

    if (hungerTimer >= 9) {
      hungerTimer = 0;

      food = Math.max(
        0,
        food - 1
      );

      if (food <= 0) {
        hp -= 2;
      }
    }

    if (hp <= 0) {
      hp = 100;
      food = 50;

      player.position.set(
        0,
        height(0, 0),
        0
      );

      verticalVelocity = 0;

      toast(
        "Respawned at Emerald Meadow"
      );
    }

    if (autoSaveTimer >= 45) {
      autoSaveTimer = 0;
      saveGame(true);
    }
  }

  updateCamera();
  updateEffects(dt);
  updateProjectiles(dt);

  /* DAY AND NIGHT */

  const brightness =
    0.5 +
    0.5 * Math.cos(
      worldTime * 0.046
    );

  hemi.intensity =
    0.65 +
    brightness * 1.3;

  sun.intensity =
    0.3 +
    brightness * 2;

  scene.background.setRGB(
    0.11 + brightness * 0.45,
    0.16 + brightness * 0.64,
    0.26 + brightness * 0.64
  );

  /* HUD */

  hudTimer += dt;

  if (hudTimer >= 0.14) {
    hudTimer = 0;

    $("hp").textContent =
      Math.ceil(hp);

    $("food").textContent =
      Math.ceil(food);

    $("orbCount").textContent =
      bag.orbs || 0;

    $("biome").textContent =
      biome(
        player.position.x,
        player.position.z
      );

    $("coords").textContent =
      "XYZ " +
      player.position.toArray()
        .map(value =>
          Math.round(value)
        )
        .join(", ");

    const phase =
      (worldTime % 120) / 120;

    const timeName =
      phase < 0.25
        ? "Morning"
        : phase < 0.5
          ? "Afternoon"
          : phase < 0.75
            ? "Evening"
            : "Night";

    $("clock").textContent =
      `Day ${Math.floor(worldTime / 120) + 1} · ${timeName}`;

    const target =
      aimedCreature();

    $("target").textContent =
      target
        ? `${target.name} · ${target.type.element} · Q Capture`
        : "";
  }

  /* NOTIFICATION TIMER */

  if (toastTime > 0) {
    toastTime -= dt;

    if (toastTime <= 0) {
      $("toast").textContent = "";
    }
  }

  renderer.render(
    scene,
    camera
  );
}

/* =====================================================
   START RENDERING
   ===================================================== */

updateCamera();
animate();

/* =====================================================
   WINDOW RESIZE
   ===================================================== */

window.addEventListener(
  "resize",
  () => {
    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);

console.log(
  "GALAXY PALFRONTIER — Game initialized"
);
