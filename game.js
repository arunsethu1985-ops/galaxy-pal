import * as THREE from "https://esm.sh/three@0.180.0";

// GALAXY PALFRONTIER — GRAPHICS & ANIMATION EDITION
// Original creature adventure with procedural graphics.
// Creature behavior is programmed locally, not a trained AI model.

const $ = id => document.getElementById(id);
const KEY = "galaxy-palfrontier-wild-isles-v1";
const WORLD = 110;

let saved = {};

try {
  saved = JSON.parse(localStorage.getItem(KEY) || "{}");
} catch {
  saved = {};
}

const keys = {};

const bag = {
  wood: 12,
  stone: 9,
  crystal: 5,
  berries: 8,
  fiber: 7,
  orbs: 8,
  meals: 3,
  ...saved.bag
};

let hp = saved.hp ?? 100;
let food = saved.food ?? 100;
let day = saved.day ?? 30;

let playing = false;
let flying = false;
let cameraView = 0;
let panel = "";
let cooldown = 0;
let toastTime = 0;
let selected = Math.min(saved.selected || 0, 4);

// CREATURE SPECIES

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
  Array.isArray(saved.party) ? saved.party : []
).filter(name => types[name]).slice(0, 5);

// THREE.JS SCENE

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x96d4ee);
scene.fog = new THREE.FogExp2(0xa5d6e7, 0.0085);

const camera = new THREE.PerspectiveCamera(
  68,
  innerWidth / innerHeight,
  0.1,
  350
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(devicePixelRatio, 1.5)
);

renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;

document.body.append(renderer.domElement);

// LIGHTING

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

// MATERIALS AND GEOMETRY

const mats = new Map();

const geo = {
  sphere: new THREE.SphereGeometry(1, 12, 9),
  low: new THREE.IcosahedronGeometry(1, 1),
  box: new THREE.BoxGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(1, 1, 7),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 8)
};

function mat(color, glow = false) {
  const key = color + ":" + glow;

  if (!mats.has(key)) {
    mats.set(
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

  return mats.get(key);
}

function part(
  parent, form, color,
  x, y, z,
  sx = 1, sy = 1, sz = 1,
  glow = false
) {
  const object = new THREE.Mesh(
    geo[form],
    mat(color, glow)
  );

  object.position.set(x, y, z);
  object.scale.set(sx, sy, sz);
  object.castShadow = true;
  object.receiveShadow = true;

  parent.add(object);

  return object;
}

function rand(x, z, seed = 0) {
  const v = Math.sin(
    x * 127.1 + z * 311.7 + seed * 78.7
  ) * 43758.5453;

  return v - Math.floor(v);
}

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
  if (x > 28 && z < -22) return "Blossom Ridge";
  if (x < -28 && z > 8) return "Ancient Woodland";
  if (x > 35 && z > 25) return "Golden Savannah";

  return "Emerald Meadow";
}

function toast(message) {
  $("toast").textContent = message;
  toastTime = 3;
}

function add(id, count = 1) {
  bag[id] = (bag[id] || 0) + count;
}

function have(cost) {
  return Object.entries(cost).every(
    ([item, count]) => (bag[item] || 0) >= count
  );
}

function spend(cost) {
  if (!have(cost)) return false;

  for (const [item, count] of Object.entries(cost)) {
    bag[item] -= count;
  }

  return true;
}

// 3D TERRAIN

const terrain = new THREE.PlaneGeometry(
  WORLD * 2,
  WORLD * 2,
  110,
  110
);

terrain.rotateX(-Math.PI / 2);

const attr = terrain.attributes.position;
const cols = [];

for (let i = 0; i < attr.count; i++) {
  const x = attr.getX(i);
  const z = attr.getZ(i);

  attr.setY(i, height(x, z));

  let color = new THREE.Color(
    biome(x, z) === "Blossom Ridge"
      ? 0x90be7a
      : biome(x, z) === "Ancient Woodland"
        ? 0x408b68
        : biome(x, z) === "Golden Savannah"
          ? 0xb5bd78
          : 0x68ad6b
  );

  color.multiplyScalar(
    0.89 + rand(x, z, 2) * 0.22
  );

  cols.push(color.r, color.g, color.b);
}

terrain.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(cols, 3)
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

// ANIMATED WATER

const waterUniforms = {
  time: { value: 0 },
  tint: { value: new THREE.Color(0x50bfc9) }
};

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD * 2, WORLD * 2),
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

        vec4 w = modelMatrix * vec4(p, 1.0);

        vWorld = w.xyz;

        gl_Position =
          projectionMatrix * viewMatrix * w;
      }
    `,

    fragmentShader: `
      uniform vec3 tint;
      uniform float time;

      varying vec2 vUv;
      varying vec3 vWorld;

      void main() {
        float w =
          sin(vWorld.x * 0.26 + time * 1.8) *
          cos(vWorld.z * 0.21 - time * 0.9);

        float stripe = pow(
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

        vec3 c =
          tint +
          vec3(0.05, 0.10, 0.12) * w +
          vec3(0.23, 0.33, 0.34) * stripe;

        gl_FragColor = vec4(c, 0.77);
      }
    `
  })
);

water.rotation.x = -Math.PI / 2;
water.position.y = -1.1;
scene.add(water);

// TREES AND RESOURCES

const animatedTrees = [];
const resources = [];

function resource(type, x, z, amount, group) {
  group.position.set(x, height(x, z), z);
  scene.add(group);

  resources.push({
    type, x, z, amount, group
  });
}

function tree(x, z, kind) {
  const group = new THREE.Group();

  const big = kind === "ancient";
  const pink = kind === "cherry";

  const h = big ? 10 : 5.5;

  part(
    group,
    "cylinder",
    big ? 0x5d5141 : 0x855f42,
    0, h / 2, 0,
    big ? 0.67 : 0.36,
    h,
    big ? 0.67 : 0.36
  );

  const colors = pink
    ? [0xf8b3d5, 0xffd1e3, 0xe895bc]
    : big
      ? [0x286b66, 0x3c8870, 0x50a080]
      : [0x428e4e, 0x5dad61, 0x80c572];

  const count = big ? 11 : 7;

  for (let i = 0; i < count; i++) {
    const angle = i * 2.4;
    const radius = i === 0 ? 0 : big ? 3.3 : 1.4;

    part(
      group,
      "low",
      colors[i % 3],
      Math.cos(angle) * radius,
      h + Math.sin(i * 2) * 0.7,
      Math.sin(angle) * radius,
      big ? 2.4 : 1.6,
      big ? 1.7 : 1.27,
      big ? 2.4 : 1.6
    );
  }

  resource("wood", x, z, big ? 7 : 4, group);

  animatedTrees.push({
    group,
    phase: rand(x, z, 28) * Math.PI * 2,
    scale: big ? 0.004 : 0.01
  });
}

function rock(x, z, crystal = false) {
  const group = new THREE.Group();

  if (crystal) {
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;

      part(
        group,
        "cone",
        i % 2 ? 0x73e5e6 : 0xb19bff,
        Math.cos(a) * 0.64,
        1.2,
        Math.sin(a) * 0.64,
        0.58, 2.4, 0.58,
        true
      );
    }
  } else {
    part(
      group, "low",
      0x87989c,
      0, 0.64, 0,
      1.2, 0.9, 1
    );

    part(
      group, "low",
      0xb1b8b3,
      0.72, 0.38, 0.35,
      0.6, 0.5, 0.6
    );
  }

  resource(
    crystal ? "crystal" : "stone",
    x, z,
    crystal ? 2 : 4,
    group
  );
}

function bush(x, z) {
  const group = new THREE.Group();

  part(
    group,
    "low",
    0x397e51,
    0, 0.62, 0,
    0.96, 0.75, 0.9
  );

  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;

    part(
      group,
      "sphere",
      0xe96983,
      Math.cos(a) * 0.62,
      0.73,
      Math.sin(a) * 0.62,
      0.14, 0.14, 0.14
    );
  }

  resource("berries", x, z, 4, group);
}

function grass(x, z) {
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

  group.position.set(x, height(x, z), z);
  scene.add(group);
}

for (let i = 0; i < 190; i++) {
  const x = (rand(i, 2, 7) - 0.5) * 206;
  const z = (rand(i, 7, 9) - 0.5) * 206;

  if (Math.hypot(x, z) < 14) continue;

  const r = rand(i, 13, 4);
  const area = biome(x, z);

  if (r < 0.46) {
    const kind =
      area === "Blossom Ridge" ? "cherry"
      : area === "Ancient Woodland" && r < 0.2
        ? "ancient"
        : "oak";

    tree(x, z, kind);
  } else if (r < 0.7) {
    rock(x, z, r > 0.64);
  } else if (r < 0.84) {
    bush(x, z);
  } else {
    grass(x, z);
  }
}

// WIND-ANIMATED GRASS

const meadowMat = new THREE.MeshStandardMaterial({
  color: 0x71c468,
  side: THREE.DoubleSide,
  roughness: 1
});

const bladeGeo = new THREE.BufferGeometry();

bladeGeo.setAttribute(
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

bladeGeo.setIndex([0, 1, 2]);
bladeGeo.computeVertexNormals();

meadowMat.onBeforeCompile = shader => {
  shader.uniforms.windTime = { value: 0 };

  meadowMat.userData.windUniform =
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

const grassInst = new THREE.InstancedMesh(
  bladeGeo,
  meadowMat,
  4200
);

grassInst.frustumCulled = false;
grassInst.receiveShadow = true;

const dummy = new THREE.Object3D();
const shadeColor = new THREE.Color();

for (let i = 0; i < 4200; i++) {
  const x = (rand(i, 31, 1) - 0.5) * 200;
  const z = (rand(i, 39, 7) - 0.5) * 200;

  dummy.position.set(
    x,
    height(x, z) + 0.03,
    z
  );

  dummy.rotation.set(
    0,
    rand(i, 17, 2) * Math.PI * 2,
    (rand(i, 11, 8) - 0.5) * 0.27
  );

  dummy.scale.setScalar(
    0.6 + rand(i, 24, 3) * 1.3
  );

  dummy.updateMatrix();

  grassInst.setMatrixAt(i, dummy.matrix);

  shadeColor.setHSL(
    0.24 + rand(i, 32, 12) * 0.08,
    0.43 + rand(i, 14, 6) * 0.2,
    0.35 + rand(i, 18, 2) * 0.18
  );

  grassInst.setColorAt(i, shadeColor);
}

scene.add(grassInst);

// DRIFTING CLOUDS

const clouds = [];

for (let i = 0; i < 16; i++) {
  const group = new THREE.Group();

  const tone = mat(
    i % 3 === 0 ? 0xffefdf : 0xf8fbff
  );

  for (let j = 0; j < 5; j++) {
    const puff = new THREE.Mesh(
      geo.sphere,
      tone
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
    (rand(i, 8, 91) - 0.5) * 230,
    31 + rand(i, 9, 92) * 20,
    (rand(i, 10, 93) - 0.5) * 230
  );

  scene.add(group);

  clouds.push({
    group,
    speed: 0.25 + rand(i, 4, 94) * 0.22
  });
}

// GLOWING FIREFLIES

const motes = [];

const moteMat = new THREE.MeshBasicMaterial({
  color: 0xfbe9a8,
  transparent: true,
  opacity: 0.9,
  depthWrite: false
});

for (let i = 0; i < 90; i++) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 5, 4),
    moteMat.clone()
  );

  const x = (rand(i, 37, 6) - 0.5) * 165;
  const z = (rand(i, 44, 8) - 0.5) * 165;

  mesh.position.set(
    x,
    height(x, z) + 1 + rand(i, 41, 5) * 3,
    z
  );

  scene.add(mesh);

  motes.push({
    mesh, x, z,
    phase: rand(i, 10, 4) * Math.PI * 2
  });
}

// ANIMATED FLOWERS

const bloomMeshes = [];

for (let i = 0; i < 170; i++) {
  const x = (rand(i, 19, 77) - 0.5) * 202;
  const z = (rand(i, 20, 78) - 0.5) * 202;

  if (Math.hypot(x, z) < 8) continue;

  const group = new THREE.Group();

  part(
    group, "cylinder",
    0x408b4c,
    0, 0.23, 0,
    0.025, 0.44, 0.025
  );

  const color = [
    0xffca85,
    0xf0b6df,
    0xc6c3ff,
    0xfcebad
  ][i % 4];

  for (let j = 0; j < 5; j++) {
    const a = j * Math.PI * 2 / 5;

    part(
      group, "sphere",
      color,
      Math.cos(a) * 0.14,
      0.49,
      Math.sin(a) * 0.14,
      0.12, 0.08, 0.12
    );
  }

  part(
    group, "sphere",
    0xffe492,
    0, 0.49, 0,
    0.095, 0.09, 0.095,
    true
  );

  group.position.set(x, height(x, z), z);
  scene.add(group);

  bloomMeshes.push({
    group,
    phase: rand(i, 5, 2) * Math.PI * 2
  });
}

// PARTICLE EFFECTS

const particles = [];

function burst(
  position,
  color = 0x9dfbe0,
  count = 24,
  power = 5
) {
  const geometry = new THREE.SphereGeometry(
    0.075, 5, 4
  );

  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  for (let i = 0; i < count; i++) {
    const object = new THREE.Mesh(
      geometry,
      material
    );

    object.position.copy(position);

    const a = Math.random() * Math.PI * 2;
    const b = Math.random() * Math.PI;

    const v = power * (
      0.3 + Math.random() * 0.7
    );

    scene.add(object);

    particles.push({
      object,
      velocity: new THREE.Vector3(
        Math.cos(a) * Math.sin(b) * v,
        Math.cos(b) * v * 0.75 + 1,
        Math.sin(a) * Math.sin(b) * v
      ),
      age: 0,
      life: 0.6 + Math.random() * 0.6
    });
  }
}

function updateFX(dt) {
  const t = day;

  waterUniforms.time.value = t;

  if (meadowMat.userData.windUniform) {
    meadowMat.userData.windUniform.value = t;
  }

  for (const cloud of clouds) {
    cloud.group.position.x += cloud.speed * dt;

    if (cloud.group.position.x > 145) {
      cloud.group.position.x = -145;
    }
  }

  for (const tree of animatedTrees) {
    tree.group.rotation.z =
      Math.sin(t * 0.8 + tree.phase) * tree.scale;
  }

  for (const mote of motes) {
    mote.mesh.position.x =
      mote.x + Math.sin(t * 0.55 + mote.phase) * 1.8;

    mote.mesh.position.y =
      height(mote.x, mote.z) +
      1.5 +
      Math.sin(t * 2 + mote.phase) * 0.6;

    mote.mesh.material.opacity =
      0.5 +
      0.4 * Math.pow(
        Math.sin(t * 2 + mote.phase),
        2
      );
  }

  for (const bloom of bloomMeshes) {
    bloom.group.rotation.z =
      Math.sin(t * 1.3 + bloom.phase) * 0.08;
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.age += dt;

    p.object.position.addScaledVector(
      p.velocity,
      dt
    );

    p.velocity.y -= 9 * dt;

    p.object.scale.setScalar(
      Math.max(0.01, 1 - p.age / p.life)
    );

    if (p.age >= p.life) {
      scene.remove(p.object);
      particles.splice(i, 1);
    }
  }
}

// PLAYER CHARACTER

const player = new THREE.Group();
const visual = new THREE.Group();

player.add(visual);

part(
  visual, "box",
  0x326d9b,
  0, 1.28, 0,
  0.78, 1, 0.45
);

part(
  visual, "sphere",
  0xd7a982,
  0, 2.08, 0,
  0.43, 0.47, 0.42
);

part(
  visual, "sphere",
  0x3b3031,
  0, 2.43, 0.08,
  0.47, 0.2, 0.42
);

const arms = [];
const legs = [];

for (const s of [-1, 1]) {
  const arm = new THREE.Group();

  arm.position.set(s * 0.54, 1.66, 0);

  part(
    arm, "box",
    0x326d9b,
    0, -0.37, 0,
    0.27, 0.77, 0.3
  );

  visual.add(arm);
  arms.push(arm);

  const leg = new THREE.Group();

  leg.position.set(s * 0.21, 0.79, 0);

  part(
    leg, "box",
    0x31496d,
    0, -0.4, 0,
    0.3, 0.8, 0.33
  );

  visual.add(leg);
  legs.push(leg);

  part(
    visual, "sphere",
    0xffffff,
    s * 0.18, 2.12, -0.4,
    0.08, 0.08, 0.045
  );

  part(
    visual, "sphere",
    0x24364a,
    s * 0.18, 2.12, -0.44,
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
let vy = 0;
let grounded = false;

// CREATURES AND LOCAL BEHAVIOR

const wild = [];
let buddy = null;

function creature(name, x, z, isBuddy = false) {
  const t = types[name];

  const root = new THREE.Group();
  const model = new THREE.Group();

  root.add(model);

  const scale =
    name === "Brambleon" ? 1.35 :
    name === "Moonhorn" ? 1.15 : 0.9;

  model.scale.setScalar(scale);

  part(
    model, "sphere",
    t.body,
    0, 1.13, 0,
    0.84, 0.76, 0.72
  );

  part(
    model, "sphere",
    t.trim,
    0, 1.01, -0.49,
    0.54, 0.49, 0.28
  );

  part(
    model, "sphere",
    t.body,
    0, 1.91, -0.23,
    0.69, 0.67, 0.63
  );

  for (const s of [-1, 1]) {
    const ear = part(
      model, "cone",
      t.accent,
      s * 0.43, 2.58, -0.19,
      0.23, 0.7, 0.24
    );

    ear.rotation.z = -s * 0.23;

    part(
      model, "sphere",
      0xffffff,
      s * 0.25, 2.02, -0.76,
      0.19, 0.22, 0.08
    );

    part(
      model, "sphere",
      0x28374a,
      s * 0.25, 2.02, -0.85,
      0.09, 0.13, 0.04
    );

    for (const f of [-1, 1]) {
      part(
        model, "sphere",
        t.body,
        s * 0.43, 0.46, f * 0.4,
        0.24, 0.31, 0.28
      );
    }
  }

  part(
    model, "sphere",
    0xf5a2ae,
    0, 1.75, -0.83,
    0.13, 0.09, 0.07
  );

  part(
    model, "sphere",
    t.body,
    0, 1.12, 0.69,
    0.36, 0.4, 0.49
  );

  if (name === "Moonhorn") {
    part(
      model, "cone",
      0xe8f4ff,
      0, 2.8, -0.3,
      0.16, 0.83, 0.17
    );
  }

  if (name === "Cinderfox") {
    part(
      model, "cone",
      0xffcd59,
      0, 1.3, 1.1,
      0.28, 0.8, 0.25,
      true
    );
  }

  if (name === "Sparkit") {
    const tail = part(
      model, "box",
      0xffda64,
      0, 1.2, 1.04,
      0.28, 0.26, 1
    );

    tail.rotation.x = 0.45;
  }

  if (name === "Brambleon") {
    for (let i = 0; i < 4; i++) {
      part(
        model, "cone",
        t.accent,
        0, 1.7, i * 0.35,
        0.22, 0.48, 0.22
      );
    }
  }

  root.position.set(x, height(x, z), z);
  scene.add(root);

  const unit = {
    name,
    t,
    root,
    model,
    hp: 100,
    home: [x, z],
    state: "idle",
    timer: 0,
    angle: rand(x, z, 6) * Math.PI * 2,
    phase: rand(x, z, 8) * Math.PI * 2,
    isBuddy
  };

  root.userData.unit = unit;

  if (!isBuddy) wild.push(unit);

  return unit;
}

for (let i = 0; i < 30; i++) {
  const a = rand(i, 2, 16) * Math.PI * 2;
  const d = 15 + rand(i, 5, 18) * 87;

  const x = Math.cos(a) * d;
  const z = Math.sin(a) * d;

  creature(
    species[Math.floor(rand(i, 9, 1) * species.length)],
    x,
    z
  );
}

// COMPANION PARTY

function setBuddy(index) {
  if (!party[index]) return;

  selected = index;

  if (buddy) {
    scene.remove(buddy.root);
  }

  buddy = creature(
    party[index],
    player.position.x + 2,
    player.position.z + 2,
    true
  );

  $("buddyName").textContent =
    types[buddy.name].emoji + " " + buddy.name;

  $("buddyMode").textContent =
    types[buddy.name].element + " · E to assist";

  drawParty();
}

function drawParty() {
  $("party").replaceChildren();

  for (let i = 0; i < 5; i++) {
    const div = document.createElement("div");

    div.className =
      "party-item" +
      (party[i] && selected === i ? " active" : "");

    div.textContent = party[i]
      ? types[party[i]].emoji
      : "＋";

    const small = document.createElement("small");
    small.textContent = i + 1;

    div.append(small);
    $("party").append(div);
  }
}

if (party.length) {
  setBuddy(selected);
} else {
  drawParty();
}

// CREATURE ANIMATIONS AND BEHAVIOR

function updateCreatures(dt) {
  for (const c of wild) {
    c.timer -= dt;

    if (c.timer <= 0) {
      c.state =
        rand(
          c.root.position.x + day,
          c.root.position.z,
          7
        ) > 0.25
          ? "wander"
          : "idle";

      c.timer = 1.7 + Math.random() * 3;
      c.angle += (Math.random() - 0.5) * 2.6;
    }

    if (c.state === "wander") {
      const step = c.t.speed * 0.35 * dt;

      const nx =
        c.root.position.x +
        Math.sin(c.angle) * step;

      const nz =
        c.root.position.z +
        Math.cos(c.angle) * step;

      if (
        Math.hypot(
          nx - c.home[0],
          nz - c.home[1]
        ) < 10 &&
        Math.abs(nx) < WORLD - 3 &&
        Math.abs(nz) < WORLD - 3
      ) {
        c.root.position.x = nx;
        c.root.position.z = nz;
      } else {
        c.angle += Math.PI;
      }
    }

    c.root.position.y = height(
      c.root.position.x,
      c.root.position.z
    );

    c.root.rotation.y = c.angle;

    c.model.position.y =
      Math.sin(day * 3 + c.phase) * 0.09;

    c.model.rotation.z =
      Math.sin(day * 2 + c.phase) * 0.025;

    const baseScale =
      c.name === "Brambleon" ? 1.35 :
      c.name === "Moonhorn" ? 1.15 : 0.9;

    c.model.scale.y =
      baseScale *
      (1 + 0.02 * Math.sin(day * 2.2 + c.phase));
  }

  if (buddy) {
    const p = buddy.root.position;

    const dx = player.position.x - p.x;
    const dz = player.position.z - p.z;
    const d = Math.hypot(dx, dz);

    if (d > 32) {
      p.x = player.position.x + 2;
      p.z = player.position.z + 2;
    } else if (d > 2.8) {
      const step = Math.min(
        d - 2.8,
        buddy.t.speed * 2.3 * dt
      );

      p.x += dx / d * step;
      p.z += dz / d * step;

      buddy.root.rotation.y =
        Math.atan2(-dx, -dz);
    }

    p.y = height(p.x, p.z);

    buddy.model.position.y =
      Math.sin(day * 4) * 0.12;

    buddy.model.rotation.z =
      Math.sin(day * 2) * 0.035;
  }
}

// MOVEMENT AND FLYING

function direction() {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);

  let x = 0;
  let z = 0;

  if (keys.KeyW) { x += fx; z += fz; }
  if (keys.KeyS) { x -= fx; z -= fz; }
  if (keys.KeyA) { x -= rx; z -= rz; }
  if (keys.KeyD) { x += rx; z += rz; }

  const d = Math.hypot(x, z);

  return d
    ? { x: x / d, z: z / d, moving: true }
    : { x: 0, z: 0, moving: false };
}

function look() {
  return new THREE.Vector3(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  );
}

function updatePlayer(dt) {
  const m = direction();

  const speed = flying
    ? 13
    : keys.ShiftLeft || keys.ShiftRight
      ? 10
      : 6.5;

  player.position.x = THREE.MathUtils.clamp(
    player.position.x + m.x * speed * dt,
    -WORLD + 2,
    WORLD - 2
  );

  player.position.z = THREE.MathUtils.clamp(
    player.position.z + m.z * speed * dt,
    -WORLD + 2,
    WORLD - 2
  );

  const floor = height(
    player.position.x,
    player.position.z
  );

  if (flying) {
    player.position.y += (
      (keys.Space ? 1 : 0) -
      (keys.KeyX ? 1 : 0)
    ) * speed * dt;

    player.position.y = THREE.MathUtils.clamp(
      player.position.y,
      -2,
      100
    );

    vy = 0;
    grounded = false;
  } else {
    vy -= 23 * dt;

    if (keys.Space && grounded) {
      vy = 9;
      grounded = false;
    }

    player.position.y += vy * dt;

    if (player.position.y <= floor) {
      player.position.y = floor;
      vy = 0;
      grounded = true;
    }
  }

  if (m.moving) {
    player.rotation.y = Math.atan2(-m.x, -m.z);
  }

  const step = m.moving
    ? Math.sin(day * 11) * 0.55
    : 0;

  arms[0].rotation.x = step;
  arms[1].rotation.x = -step;

  legs[0].rotation.x = -step;
  legs[1].rotation.x = step;
}

function updateCamera() {
  const eye = player.position.clone().add(
    new THREE.Vector3(0, 1.75, 0)
  );

  const dir = look();

  if (cameraView === 1) {
    camera.position.copy(eye);
    camera.rotation.set(pitch, yaw, 0, "YXZ");
    visual.visible = false;
  } else {
    visual.visible = true;

    const desired = eye.clone().addScaledVector(
      dir,
      -6
    );

    desired.y += 1.4;

    camera.position.lerp(desired, 0.28);

    camera.lookAt(
      eye.clone().addScaledVector(dir, 9)
    );
  }
}

// TARGETING AND CAPTURE ORBS

const ray = new THREE.Raycaster();
const projectiles = [];

function aimed() {
  ray.setFromCamera(
    new THREE.Vector2(0, 0),
    camera
  );

  ray.far = 25;

  const hits = ray.intersectObjects(
    wild.map(c => c.root),
    true
  );

  if (!hits.length) return null;

  let object = hits[0].object;

  while (object && !object.userData.unit) {
    object = object.parent;
  }

  return object?.userData.unit || null;
}

function nearest(range = 19) {
  const target = aimed();

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

  for (const c of wild) {
    const d = c.root.position.distanceTo(
      player.position
    );

    if (d < best) {
      best = d;
      selectedCreature = c;
    }
  }

  return selectedCreature;
}

function ball(from, to, color) {
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
    t: 0
  });
}

function capture() {
  if (!playing || cooldown > 0) return;

  if (party.length >= 5) {
    toast("Party full — maximum 5 creatures");
    return;
  }

  const c = nearest();

  if (!c) {
    toast("Get closer to a wild creature");
    return;
  }

  if (!spend({ orbs: 1 })) {
    toast("No orbs — craft more with C");
    return;
  }

  cooldown = 0.7;

  const chance =
    c.root.position.distanceTo(player.position) < 8
      ? 0.92
      : 0.7;

  const success = Math.random() < chance;

  const targetPosition = c.root.position.clone().add(
    new THREE.Vector3(0, 1.4, 0)
  );

  ball(
    player.position.clone().add(
      new THREE.Vector3(0, 1.7, 0)
    ),
    targetPosition,
    success ? 0x7beedc : 0xbd9bff
  );

  if (success) {
    burst(targetPosition, 0x9ef6dc, 38, 6);

    party.push(c.name);

    scene.remove(c.root);

    wild.splice(wild.indexOf(c), 1);

    setBuddy(party.length - 1);

    toast("Captured " + c.name + "!");
  } else {
    toast(c.name + " escaped — try again!");
  }
}

// COMPANION ATTACK

function command() {
  if (!buddy) {
    toast("Capture a creature first");
    return;
  }

  const c = nearest(14);

  if (!c) {
    toast(buddy.name + " is following you");
    return;
  }

  if (cooldown > 0) return;

  cooldown = 0.6;
  c.hp -= 40;

  ball(
    buddy.root.position.clone().add(
      new THREE.Vector3(0, 1.7, 0)
    ),
    c.root.position.clone().add(
      new THREE.Vector3(0, 1.4, 0)
    ),
    buddy.t.body
  );

  if (c.hp <= 0) {
    burst(
      c.root.position.clone().add(
        new THREE.Vector3(0, 1.3, 0)
      ),
      buddy.t.body,
      30,
      5
    );

    scene.remove(c.root);
    wild.splice(wild.indexOf(c), 1);

    add("crystal", 2);

    toast(
      buddy.name +
      " defeated " +
      c.name +
      " · +2 crystals"
    );
  } else {
    toast(
      buddy.name +
      " used " +
      buddy.t.element +
      " Burst!"
    );
  }
}

// RESOURCE GATHERING

function gather() {
  if (!playing || cooldown > 0) return;

  let best = 5;
  let nearestResource = null;

  for (const r of resources) {
    const d = player.position.distanceTo(
      r.group.position
    );

    if (d < best) {
      best = d;
      nearestResource = r;
    }
  }

  if (!nearestResource) {
    toast("Approach a tree, rock or berry bush");
    return;
  }

  const r = nearestResource;

  add(r.type, r.amount);

  const color =
    r.type === "crystal" ? 0x93ecff :
    r.type === "berries" ? 0xf67f99 :
    0xb6e9aa;

  burst(
    r.group.position.clone().add(
      new THREE.Vector3(0, 1, 0)
    ),
    color,
    15,
    3
  );

  scene.remove(r.group);
  resources.splice(resources.indexOf(r), 1);

  cooldown = 0.3;

  toast("Collected " + r.amount + " " + r.type);
}

// BASE BUILDING

const buildingCosts = {
  hut: { wood: 8, stone: 5 },
  bench: { wood: 5, stone: 3 },
  shelter: { wood: 5, fiber: 3 }
};

const buildings = [];

function makeBuilding(type, x, z) {
  const group = new THREE.Group();

  if (type === "hut") {
    part(
      group, "box",
      0xc0a280,
      0, 1.6, 0,
      5, 3.2, 4
    );

    const roof = part(
      group, "cone",
      0x876147,
      0, 3.95, 0,
      3.9, 2.5, 3.9
    );

    roof.rotation.y = Math.PI / 4;

    part(
      group, "box",
      0x684735,
      0, 1, -2.03,
      1.2, 2, 0.15
    );

    part(
      group, "box",
      0x9cdae9,
      -1.35, 2, -2.1,
      0.9, 1, 0.1
    );
  } else if (type === "bench") {
    part(
      group, "box",
      0x976e4c,
      0, 1.2, 0,
      2.2, 0.25, 1.3
    );

    for (const s of [-1, 1]) {
      part(
        group, "box",
        0x674a35,
        s * 0.82, 0.58, 0,
        0.19, 1.1, 0.2
      );
    }
  } else {
    part(
      group, "box",
      0x886b51,
      0, 0.15, 0,
      4, 0.3, 4
    );

    for (const px of [-1.7, 1.7]) {
      for (const pz of [-1.7, 1.7]) {
        part(
          group, "box",
          0x806248,
          px, 1.4, pz,
          0.2, 2.5, 0.2
        );
      }
    }

    const roof = part(
      group, "cone",
      0x66b590,
      0, 3, 0,
      3.2, 1.5, 3.2
    );

    roof.rotation.y = Math.PI / 4;
  }

  group.position.set(x, height(x, z), z);
  scene.add(group);

  buildings.push({ type, x, z });
}

for (const b of (
  Array.isArray(saved.buildings) ? saved.buildings : []
)) {
  if (
    buildingCosts[b.type] &&
    Number.isFinite(b.x) &&
    Number.isFinite(b.z)
  ) {
    makeBuilding(b.type, b.x, b.z);
  }
}

function build(type) {
  const cost = buildingCosts[type];

  if (!spend(cost)) {
    toast("Not enough resources");
    return;
  }

  const forward = look();

  const x = THREE.MathUtils.clamp(
    player.position.x + forward.x * 8,
    -WORLD + 5,
    WORLD - 5
  );

  const z = THREE.MathUtils.clamp(
    player.position.z + forward.z * 8,
    -WORLD + 5,
    WORLD - 5
  );

  makeBuilding(type, x, z);
  closePanel();

  toast(type + " built!");
}

// INVENTORY AND CRAFTING

function entry(title, description, action, disabled = false) {
  const row = document.createElement("div");
  row.className = "entry";

  const info = document.createElement("div");

  const strong = document.createElement("strong");
  strong.textContent = title;

  const small = document.createElement("small");
  small.textContent = description;

  info.append(strong, small);
  row.append(info);

  if (action) {
    const button = document.createElement("button");

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

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  drawPanel();
}

function closePanel() {
  panel = "";
  $("panel").hidden = true;

  renderer.domElement.requestPointerLock().catch(() => {
    $("menu").hidden = false;
  });
}

function drawPanel() {
  $("entries").replaceChildren();

  $("panelTitle").textContent = {
    bag: "🎒 Inventory",
    craft: "⚒ Crafting",
    build: "⌂ Base Building",
    party: "🐾 Companions"
  }[panel];

  if (panel === "bag") {
    for (const [item, count] of Object.entries(bag)) {
      entry(
        item.toUpperCase(),
        count + " available"
      );
    }

    entry(
      "CREATURE PARTY",
      party.length + "/5 captured",
      ["OPEN", () => openPanel("party")]
    );
  }

  if (panel === "party") {
    if (!party.length) {
      entry(
        "No companions yet",
        "Capture creatures using Q"
      );
    }

    party.forEach((name, index) => {
      entry(
        types[name].emoji + " " + name,
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
        { stone: 2, crystal: 2 },
        "orbs",
        3
      ],
      [
        "2 Meals",
        { berries: 3, wood: 1 },
        "meals",
        2
      ]
    ];

    for (const [title, cost, item, amount] of crafts) {
      const description = Object.entries(cost)
        .map(([name, n]) => n + " " + name)
        .join(" + ");

      entry(
        title,
        description,
        [
          "CRAFT",
          () => {
            if (spend(cost)) {
              add(item, amount);
              drawPanel();
              toast("Crafted " + title);
            } else {
              toast("Need more resources");
            }
          }
        ],
        !have(cost)
      );
    }
  }

  if (panel === "build") {
    for (const [type, cost] of Object.entries(buildingCosts)) {
      const description = Object.entries(cost)
        .map(([name, n]) => n + " " + name)
        .join(" + ");

      entry(
        type.toUpperCase(),
        description,
        ["BUILD", () => build(type)],
        !have(cost)
      );
    }
  }
}

$("close").onclick = closePanel;

// FLY AND SAVE

function toggleFly() {
  flying = !flying;
  vy = 0;

  $("fly").textContent =
    flying ? "✈ FLY OFF" : "✈ FLY ON";

  $("fly").classList.toggle("active", flying);

  toast(
    flying
      ? "Flying: Space UP · X DOWN"
      : "Flying off"
  );
}

function save(silent = false) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        bag,
        party,
        selected,
        hp,
        food,
        day,
        pos: player.position.toArray(),
        buildings
      })
    );

    if (!silent) toast("World saved");
  } catch {
    if (!silent) toast("Unable to save");
  }
}

$("reset").onclick = () => {
  if (
    confirm("Delete your saved Palfrontier world?")
  ) {
    localStorage.removeItem(KEY);
    location.reload();
  }
};

window.addEventListener(
  "beforeunload",
  () => save(true)
);

// KEYBOARD AND MOUSE

$("start").onclick = () => {
  renderer.domElement.requestPointerLock();
};

document.addEventListener(
  "pointerlockchange",
  () => {
    playing =
      document.pointerLockElement === renderer.domElement;

    $("menu").hidden = playing || !!panel;
    $("hud").hidden = !playing;

    if (!playing) {
      for (const key of Object.keys(keys)) {
        keys[key] = false;
      }
    }
  }
);

document.addEventListener("mousemove", event => {
  if (!playing) return;

  yaw -= event.movementX * 0.0025;

  pitch = THREE.MathUtils.clamp(
    pitch - event.movementY * 0.0025,
    -0.9,
    1.05
  );
});

document.addEventListener("keydown", event => {
  if (
    ["Space", "ArrowUp", "ArrowDown"].includes(event.code)
  ) {
    event.preventDefault();
  }

  keys[event.code] = true;

  if (panel && event.code === "Escape") {
    closePanel();
    return;
  }

  if (!playing || event.repeat) return;

  if (event.code === "KeyQ") capture();
  if (event.code === "KeyE") command();
  if (event.code === "KeyI") openPanel("bag");
  if (event.code === "KeyC") openPanel("craft");
  if (event.code === "KeyB") openPanel("build");
  if (event.code === "KeyF") toggleFly();
  if (event.code === "KeyP") save();

  if (event.code === "KeyV") {
    cameraView = 1 - cameraView;

    toast(
      cameraView
        ? "First person"
        : "Third person"
    );
  }

  if (event.code === "KeyR") {
    if (spend({ meals: 1 })) {
      food = Math.min(100, food + 35);
      hp = Math.min(100, hp + 12);
      toast("Ate a meal");
    } else if (spend({ berries: 2 })) {
      food = Math.min(100, food + 15);
      toast("Ate berries");
    } else {
      toast("No food");
    }
  }

  if (/^Digit[1-5]$/.test(event.code)) {
    const index = Number(event.code.at(-1)) - 1;

    if (party[index]) {
      setBuddy(index);
    }
  }
});

document.addEventListener("keyup", event => {
  keys[event.code] = false;
});

document.addEventListener("contextmenu", event => {
  event.preventDefault();
});

document.addEventListener("mousedown", event => {
  if (playing && event.button === 0) {
    gather();
  }
});

$("capture").onclick = () => {
  capture();
  renderer.domElement.requestPointerLock().catch(() => {});
};

$("fly").onclick = () => {
  toggleFly();
  renderer.domElement.requestPointerLock().catch(() => {});
};

$("craft").onclick = () => openPanel("craft");
$("build").onclick = () => openPanel("build");

// ANIMATION LOOP

const clock = new THREE.Clock();

let fpsTimer = 0;
let fpsFrames = 0;
let hudTimer = 0;
let hungerTimer = 0;
let saveTimer = 0;

function render() {
  requestAnimationFrame(render);

  const dt = Math.min(0.04, clock.getDelta());

  fpsTimer += dt;
  fpsFrames++;

  if (fpsTimer > 1) {
    $("fps").textContent =
      "FPS " + Math.round(fpsFrames / fpsTimer);

    fpsTimer = 0;
    fpsFrames = 0;
  }

  if (playing) {
    day += dt;

    updatePlayer(dt);
    updateCreatures(dt);

    cooldown = Math.max(0, cooldown - dt);

    hungerTimer += dt;
    saveTimer += dt;

    if (hungerTimer > 9) {
      hungerTimer = 0;
      food = Math.max(0, food - 1);

      if (!food) hp -= 2;
    }

    if (hp <= 0) {
      hp = 100;
      food = 50;

      player.position.set(
        0,
        height(0, 0),
        0
      );

      vy = 0;
      toast("Respawned at meadow");
    }

    if (saveTimer > 45) {
      saveTimer = 0;
      save(true);
    }
  }

  updateCamera();
  updateFX(dt);

  // ANIMATED CAPTURE AND ATTACK PROJECTILES

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    p.t += dt / 0.55;

    const t = Math.min(1, p.t);

    p.object.position.lerpVectors(
      p.from,
      p.to,
      t
    );

    p.object.position.y +=
      Math.sin(t * Math.PI) * 2.4;

    if (t >= 1) {
      burst(
        p.to,
        p.object.material.color.getHex(),
        12,
        2.8
      );

      scene.remove(p.object);
      projectiles.splice(i, 1);
    }
  }

  // DAY/NIGHT LIGHTING

  const brightness =
    0.5 + 0.5 * Math.cos(day * 0.046);

  hemi.intensity =
    0.65 + brightness * 1.3;

  sun.intensity =
    0.3 + brightness * 2;

  scene.background.setRGB(
    0.11 + brightness * 0.45,
    0.16 + brightness * 0.64,
    0.26 + brightness * 0.64
  );

  hudTimer += dt;

  if (hudTimer > 0.14) {
    hudTimer = 0;

    $("hp").textContent = Math.ceil(hp);
    $("food").textContent = Math.ceil(food);
    $("orbCount").textContent = bag.orbs || 0;

    $("biome").textContent = biome(
      player.position.x,
      player.position.z
    );

    $("coords").textContent =
      "XYZ " +
      player.position.toArray()
        .map(v => Math.round(v))
        .join(", ");

    const phase = (day % 120) / 120;

    const timeName =
      phase < 0.25 ? "Morning" :
      phase < 0.5 ? "Afternoon" :
      phase < 0.75 ? "Evening" :
      "Night";

    $("clock").textContent =
      "Day " +
      (Math.floor(day / 120) + 1) +
      " · " +
      timeName;

    const target = aimed();

    $("target").textContent = target
      ? target.name +
        " · " +
        target.t.element +
        " · Q Capture"
      : "";
  }

  if (toastTime > 0) {
    toastTime -= dt;

    if (toastTime <= 0) {
      $("toast").textContent = "";
    }
  }

  renderer.render(scene, camera);
}

updateCamera();
render();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
});
