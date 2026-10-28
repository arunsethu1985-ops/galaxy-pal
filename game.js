import * as THREE from "https://esm.sh/three@0.180.0";

/* ===============================================
   GALAXY PALFRONTIER — CREATURE ADVENTURE
   Original procedural 3D browser game
   =============================================== */

const $ = id => document.getElementById(id);

const SAVE = "galaxy-palfrontier-v2";
const WORLD_SIZE = 120;

const keys = {};
let playing = false;
let flying = false;
let cameraMode = 0;
let currentPanel = "";
let actionCooldown = 0;
let noticeTimer = 0;
let worldTime = 0;

let saveData = {};

try {
  saveData = JSON.parse(localStorage.getItem(SAVE) || "{}");
} catch {
  saveData = {};
}

const inventory = {
  wood: 12,
  stone: 10,
  crystal: 5,
  fiber: 8,
  berries: 8,
  orbs: 8,
  meals: 2,
  ...saveData.inventory
};

let health = saveData.health ?? 100;
let hunger = saveData.hunger ?? 100;

const creatureTypes = {
  Florabun: {
    color: 0x8dd67a,
    belly: 0xd6f4bb,
    dark: 0x488e55,
    symbol: "🌿",
    element: "Nature",
    speed: 2.4,
    scale: .9
  },

  Emberfox: {
    color: 0xef8859,
    belly: 0xffd59a,
    dark: 0x9d4c3a,
    symbol: "🔥",
    element: "Fire",
    speed: 3.4,
    scale: .88
  },

  Aquabbit: {
    color: 0x7bc7e6,
    belly: 0xd8f3ff,
    dark: 0x488caf,
    symbol: "💧",
    element: "Water",
    speed: 2.8,
    scale: .85
  },

  Voltkit: {
    color: 0xf6d66b,
    belly: 0xfff1b2,
    dark: 0xa68035,
    symbol: "⚡",
    element: "Electric",
    speed: 3.3,
    scale: .82
  },

  Cloudhorn: {
    color: 0xddd0fa,
    belly: 0xffffff,
    dark: 0x9e86d1,
    symbol: "✨",
    element: "Mystic",
    speed: 2.1,
    scale: 1.15
  },

  Mossaur: {
    color: 0x65a88b,
    belly: 0xa8d7a5,
    dark: 0x34735a,
    symbol: "🌲",
    element: "Forest",
    speed: 1.9,
    scale: 1.4
  }
};

const party = Array.isArray(saveData.party)
  ? saveData.party.filter(name => creatureTypes[name]).slice(0, 5)
  : [];

let selectedCompanion = Math.min(
  saveData.selectedCompanion ?? 0,
  Math.max(0, party.length - 1)
);

/* ===============================================
   THREE.JS SETUP
   =============================================== */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x99d8f6);
scene.fog = new THREE.Fog(0x99d8f6, 75, 165);

const camera = new THREE.PerspectiveCamera(
  72,
  innerWidth / innerHeight,
  .05,
  350
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 1.5)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

const hemisphere = new THREE.HemisphereLight(
  0xffffff,
  0x587758,
  1.9
);

scene.add(hemisphere);

const sun = new THREE.DirectionalLight(
  0xfff1d7,
  2
);

sun.position.set(35, 70, 25);
scene.add(sun);

/* ===============================================
   GEOMETRY AND MATERIALS
   =============================================== */

const geometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 12, 9),
  low: new THREE.IcosahedronGeometry(1, 1),
  cone: new THREE.ConeGeometry(1, 1, 8),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 8)
};

const materialCache = new Map();

function mat(color, glowing = false) {
  const key = `${color}:${glowing}`;

  if (!materialCache.has(key)) {
    materialCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: .82,
        metalness: .03,
        emissive: glowing ? color : 0x000000,
        emissiveIntensity: glowing ? .45 : 0
      })
    );
  }

  return materialCache.get(key);
}

function shape(
  parent, type, color,
  x, y, z,
  sx = 1, sy = 1, sz = 1,
  glow = false
) {
  const mesh = new THREE.Mesh(
    geometries[type],
    mat(color, glow)
  );

  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);

  parent.add(mesh);
  return mesh;
}

function notify(message) {
  $("notice").textContent = message;
  noticeTimer = 3;
}

function add(item, n = 1) {
  inventory[item] = (inventory[item] || 0) + n;
}

function take(item, n = 1) {
  if ((inventory[item] || 0) < n) return false;

  inventory[item] -= n;
  return true;
}

function has(cost) {
  return Object.entries(cost).every(
    ([item, amount]) => (inventory[item] || 0) >= amount
  );
}

function pay(cost) {
  if (!has(cost)) return false;

  for (const [item, amount] of Object.entries(cost)) {
    take(item, amount);
  }

  return true;
}

/* ===============================================
   PROCEDURAL TERRAIN
   =============================================== */

function random(x, z, seed = 0) {
  const v = Math.sin(
    x * 127.1 + z * 311.7 + seed * 73.17
  ) * 43758.5453;

  return v - Math.floor(v);
}

function groundHeight(x, z) {
  return (
    2 +
    Math.sin(x * .045) * 3.2 +
    Math.cos(z * .043) * 2.5 +
    Math.sin((x + z) * .075) * 1.7 +
    Math.sin(x * .018 + z * .013) * 3.5
  );
}

function biomeAt(x, z) {
  if (x > 28 && z < -20) return "Blossom Highlands";
  if (x < -25 && z > 8) return "Mystic Forest";
  if (x > 35 && z > 28) return "Golden Savanna";
  return "Emerald Meadows";
}

const plane = new THREE.PlaneGeometry(
  WORLD_SIZE * 2,
  WORLD_SIZE * 2,
  110,
  110
);

plane.rotateX(-Math.PI / 2);

const vertices = plane.attributes.position;
const colorValues = [];

for (let i = 0; i < vertices.count; i++) {
  const x = vertices.getX(i);
  const z = vertices.getZ(i);

  vertices.setY(i, groundHeight(x, z));

  const biome = biomeAt(x, z);

  const hex =
    biome === "Blossom Highlands" ? 0x91c381 :
    biome === "Mystic Forest" ? 0x458a65 :
    biome === "Golden Savanna" ? 0xb2bd79 :
    0x65b56b;

  const c = new THREE.Color(hex);

  c.multiplyScalar(.91 + random(x, z, 11) * .18);

  colorValues.push(c.r, c.g, c.b);
}

plane.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(colorValues, 3)
);

plane.computeVertexNormals();

const groundMesh = new THREE.Mesh(
  plane,
  new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1
  })
);

scene.add(groundMesh);

/* ===============================================
   WORLD RESOURCES
   =============================================== */

const resources = [];

function resourceGroup(type, amount, x, z, group) {
  group.position.set(x, groundHeight(x, z), z);

  group.userData.type = type;
  group.userData.amount = amount;

  scene.add(group);

  resources.push({
    type,
    amount,
    x,
    z,
    group
  });
}

function makeTree(x, z, kind = "normal") {
  const g = new THREE.Group();

  const cherry = kind === "cherry";
  const giant = kind === "giant";

  const height = giant ? 10 : 5.5;
  const radius = giant ? .75 : .38;

  shape(
    g, "cylinder",
    giant ? 0x65513e : 0x886347,
    0, height / 2, 0,
    radius, height, radius
  );

  const leaves =
    cherry ? [0xffb3d0,0xe98eaf,0xf9c8da] :
    giant ? [0x337e68,0x418e71,0x55a187] :
    [0x468e4a,0x65a952,0x79b96b];

  const count = giant ? 11 : 6;

  for (let i = 0; i < count; i++) {
    const angle = i * 2.399;
    const spread = i === 0 ? 0 : giant ? 3.1 : 1.4;

    shape(
      g, "low",
      leaves[i % leaves.length],
      Math.cos(angle) * spread,
      height + Math.sin(i * 2.3) * .65,
      Math.sin(angle) * spread,
      giant ? 2.4 : 1.5,
      giant ? 1.7 : 1.3,
      giant ? 2.4 : 1.5
    );
  }

  resourceGroup("wood", giant ? 7 : 4, x, z, g);
}

function makeRock(x, z, crystal = false) {
  const g = new THREE.Group();

  if (crystal) {
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;

      shape(
        g, "cone",
        i % 2 ? 0x78e6e4 : 0xb093f5,
        Math.cos(angle) * .7,
        1.3,
        Math.sin(angle) * .7,
        .55,
        1.9 + random(i, x, 8) * 1.5,
        .55,
        true
      );
    }
  } else {
    shape(
      g, "low",
      0x939b9e,
      0, .6, 0,
      1.3, .85, 1.05
    );

    shape(
      g, "low",
      0xb3b7ae,
      .75, .4, .4,
      .7, .5, .65
    );
  }

  resourceGroup(
    crystal ? "crystal" : "stone",
    crystal ? 2 : 4,
    x, z, g
  );
}

function makeBush(x, z) {
  const g = new THREE.Group();

  shape(g, "low", 0x387e48, 0, .5, 0, 1, .75, 1);

  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 7;

    shape(
      g, "sphere",
      0xe96b84,
      Math.cos(angle) * .65,
      .6,
      Math.sin(angle) * .65,
      .13, .13, .13
    );
  }

  resourceGroup("berries", 4, x, z, g);
}

function makeGrass(x, z) {
  const g = new THREE.Group();

  for (let i = 0; i < 4; i++) {
    const blade = shape(
      g, "cone",
      i % 2 ? 0x3a995c : 0x6bb86c,
      (i - 1.5) * .13,
      .24,
      0,
      .1, .52, .1
    );

    blade.rotation.z = (i - 1.5) * .17;
  }

  g.position.set(x, groundHeight(x, z), z);
  scene.add(g);
}

for (let i = 0; i < 165; i++) {
  const x = (random(i, 3, 9) - .5) * 215;
  const z = (random(i, 8, 17) - .5) * 215;

  if (Math.hypot(x, z) < 13) continue;

  const n = random(i, 11, 5);
  const biome = biomeAt(x, z);

  if (n < .45) {
    const kind =
      biome === "Blossom Highlands" ? "cherry" :
      biome === "Mystic Forest" && n < .2 ? "giant" :
      "normal";

    makeTree(x, z, kind);
  } else if (n < .72) {
    makeRock(x, z, n > .65);
  } else if (n < .84) {
    makeBush(x, z);
  } else {
    makeGrass(x, z);
  }
}

/* ===============================================
   PLAYER MODEL
   =============================================== */

const player = new THREE.Group();
const body = new THREE.Group();

player.add(body);

shape(
  body, "box",
  0x3c759d,
  0, 1.28, 0,
  .8, 1, .46
);

shape(
  body, "sphere",
  0xe2b28d,
  0, 2.08, 0,
  .44, .48, .4
);

shape(
  body, "sphere",
  0x49372f,
  0, 2.4, .07,
  .47, .21, .43
);

const arms = [];
const legs = [];

for (const side of [-1, 1]) {
  const arm = new THREE.Group();

  arm.position.set(side * .55, 1.6, 0);

  shape(
    arm, "box",
    0x367096,
    0, -.42, 0,
    .27, .85, .33
  );

  body.add(arm);
  arms.push(arm);

  const leg = new THREE.Group();

  leg.position.set(side * .2, .79, 0);

  shape(
    leg, "box",
    0x334e78,
    0, -.42, 0,
    .3, .82, .36
  );

  body.add(leg);
  legs.push(leg);

  shape(
    body, "sphere",
    0xffffff,
    side * .18, 2.13, -.39,
    .08, .08, .045
  );

  shape(
    body, "sphere",
    0x253443,
    side * .18, 2.13, -.44,
    .04, .05, .025
  );
}

player.position.set(
  saveData.position?.[0] ?? 0,
  saveData.position?.[1] ?? groundHeight(0, 0),
  saveData.position?.[2] ?? 0
);

scene.add(player);

let yaw = 0;
let pitch = .12;
let vy = 0;
let grounded = false;

/* ===============================================
   ORIGINAL CREATURE GENERATOR
   =============================================== */

const wildCreatures = [];
let follower = null;

function createCreature(
  name,
  x,
  z,
  captured = false
) {
  const c = creatureTypes[name];

  const root = new THREE.Group();
  const model = new THREE.Group();

  model.scale.setScalar(c.scale);
  root.add(model);

  shape(
    model, "sphere",
    c.color,
    0, 1.1, 0,
    .8, .78, .7
  );

  shape(
    model, "sphere",
    c.belly,
    0, .98, -.53,
    .55, .51, .29
  );

  shape(
    model, "sphere",
    c.color,
    0, 1.89, -.23,
    .7, .68, .6
  );

  for (const side of [-1, 1]) {
    const ear = shape(
      model, "cone",
      c.dark,
      side * .43,
      2.55,
      -.2,
      .25, .65, .24
    );

    ear.rotation.z = side * -.22;

    shape(
      model, "sphere",
      0xffffff,
      side * .26,
      1.99,
      -.77,
      .18, .22, .08
    );

    shape(
      model, "sphere",
      0x28344b,
      side * .26,
      1.99,
      -.85,
      .09, .13, .05
    );

    for (const front of [-1, 1]) {
      shape(
        model, "sphere",
        c.color,
        side * .44,
        .43,
        front * .4,
        .26, .32, .27
      );
    }
  }

  shape(
    model, "sphere",
    0xf49ba9,
    0, 1.73, -.84,
    .14, .09, .07
  );

  shape(
    model, "sphere",
    c.color,
    0, 1.1, .7,
    .36, .4, .5
  );

  if (name === "Cloudhorn") {
    shape(
      model, "cone",
      0xecf3ff,
      0, 2.79, -.35,
      .16, .8, .16
    );
  }

  if (name === "Emberfox") {
    shape(
      model, "cone",
      0xffc861,
      0, 1.32, 1.1,
      .27, .75, .27,
      true
    );
  }

  if (name === "Voltkit") {
    const tail = shape(
      model, "box",
      0xf9d35e,
      0, 1.2, .98,
      .27, .28, 1
    );

    tail.rotation.x = .5;
  }

  if (name === "Mossaur") {
    for (let i = 0; i < 4; i++) {
      shape(
        model, "cone",
        c.dark,
        0,
        1.8,
        i * .38 - .15,
        .22, .45, .25
      );
    }
  }

  root.position.set(x, groundHeight(x, z), z);

  scene.add(root);

  const creature = {
    name,
    config: c,
    root,
    model,
    captured,
    hp: 100,
    phase: random(x, z, 16) * 10,
    heading: random(x, z, 19) * Math.PI * 2,
    timer: 0,
    homeX: x,
    homeZ: z
  };

  root.userData.creature = creature;

  if (!captured) wildCreatures.push(creature);

  return creature;
}

const creatureNames = Object.keys(creatureTypes);

for (let i = 0; i < 30; i++) {
  const angle = random(i, 1, 20) * Math.PI * 2;
  const distance = 15 + random(i, 4, 25) * 90;

  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;

  const name = creatureNames[
    Math.floor(random(i, 7, 13) * creatureNames.length)
  ];

  createCreature(name, x, z);
}

/* ===============================================
   PARTY AND COMPANION
   =============================================== */

function updatePartyBar() {
  $("partyBar").replaceChildren();

  for (let i = 0; i < 5; i++) {
    const div = document.createElement("div");

    div.className = "partySlot";

    const name = party[i];

    if (name && i === selectedCompanion) {
      div.classList.add("active");
    }

    const symbol = document.createElement("span");
    symbol.textContent = name
      ? creatureTypes[name].symbol
      : "＋";

    const index = document.createElement("small");
    index.textContent = i + 1;

    div.append(symbol, index);

    $("partyBar").append(div);
  }
}

function setCompanion(index) {
  if (!party[index]) return;

  selectedCompanion = index;

  if (follower) {
    scene.remove(follower.root);
    follower = null;
  }

  const name = party[index];

  follower = createCreature(
    name,
    player.position.x + 2,
    player.position.z + 2,
    true
  );

  $("companionName").textContent =
    `${creatureTypes[name].symbol} ${name}`;

  $("companionInfo").textContent =
    `${creatureTypes[name].element} companion • E to attack`;

  updatePartyBar();
}

if (party.length) {
  setCompanion(selectedCompanion);
} else {
  updatePartyBar();
}

function updateCreatures(dt) {
  for (const c of wildCreatures) {
    c.timer -= dt;

    if (c.timer <= 0) {
      c.timer = 2 + random(
        c.root.position.x + worldTime,
        c.root.position.z,
        5
      ) * 3;

      c.heading += (Math.random() - .5) * 2.2;
    }

    const distance = c.config.speed * dt * .45;

    const x = c.root.position.x +
      Math.sin(c.heading) * distance;

    const z = c.root.position.z +
      Math.cos(c.heading) * distance;

    if (
      Math.hypot(
        x - c.homeX,
        z - c.homeZ
      ) < 9 &&
      Math.abs(x) < WORLD_SIZE - 4 &&
      Math.abs(z) < WORLD_SIZE - 4
    ) {
      c.root.position.x = x;
      c.root.position.z = z;
    } else {
      c.heading += Math.PI;
    }

    c.root.position.y = groundHeight(
      c.root.position.x,
      c.root.position.z
    );

    c.root.rotation.y = c.heading;

    c.model.position.y =
      Math.sin(worldTime * 3 + c.phase) * .08;
  }

  if (follower) {
    const p = follower.root.position;

    const dx = player.position.x - p.x;
    const dz = player.position.z - p.z;

    const distance = Math.hypot(dx, dz);

    if (distance > 35) {
      p.x = player.position.x + 2;
      p.z = player.position.z + 2;
    } else if (distance > 3) {
      const step = Math.min(
        distance - 3,
        follower.config.speed * 2 * dt
      );

      p.x += dx / distance * step;
      p.z += dz / distance * step;

      follower.root.rotation.y =
        Math.atan2(-dx, -dz);
    }

    p.y = groundHeight(p.x, p.z);

    follower.model.position.y =
      Math.sin(worldTime * 4) * .1;
  }
}

/* ===============================================
   MOVEMENT AND CAMERA
   =============================================== */

function forwardVector() {
  return new THREE.Vector3(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  );
}

function moveDirection() {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);

  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);

  let x = 0;
  let z = 0;

  if (keys.KeyW) { x += fx; z += fz; }
  if (keys.KeyS) { x -= fx; z -= fz; }
  if (keys.KeyD) { x += rx; z += rz; }
  if (keys.KeyA) { x -= rx; z -= rz; }

  const length = Math.hypot(x, z);

  return length
    ? { x:x/length, z:z/length, moving:true }
    : { x:0, z:0, moving:false };
}

function updatePlayer(dt) {
  const m = moveDirection();

  const sprint = keys.ShiftLeft || keys.ShiftRight;

  const speed = flying ? 12 : sprint ? 10 : 6.5;

  player.position.x += m.x * speed * dt;
  player.position.z += m.z * speed * dt;

  player.position.x = THREE.MathUtils.clamp(
    player.position.x,
    -WORLD_SIZE + 4,
    WORLD_SIZE - 4
  );

  player.position.z = THREE.MathUtils.clamp(
    player.position.z,
    -WORLD_SIZE + 4,
    WORLD_SIZE - 4
  );

  const ground = groundHeight(
    player.position.x,
    player.position.z
  );

  if (flying) {
    let vertical = 0;

    if (keys.Space) vertical++;
    if (keys.KeyX) vertical--;

    player.position.y += vertical * speed * dt;
    vy = 0;

    player.position.y = THREE.MathUtils.clamp(
      player.position.y,
      -5,
      90
    );
  } else {
    vy -= 22 * dt;

    if (keys.Space && grounded) {
      vy = 9.5;
      grounded = false;
    }

    player.position.y += vy * dt;

    if (player.position.y <= ground) {
      player.position.y = ground;
      vy = 0;
      grounded = true;
    }
  }

  if (m.moving) {
    player.rotation.y = Math.atan2(-m.x, -m.z);
  }

  const swing = m.moving
    ? Math.sin(worldTime * 11) * .5
    : 0;

  arms[0].rotation.x = swing;
  arms[1].rotation.x = -swing;

  legs[0].rotation.x = -swing;
  legs[1].rotation.x = swing;
}

function updateCamera() {
  const focus = player.position.clone();
  focus.y += 1.65;

  const direction = forwardVector();

  if (cameraMode === 1) {
    camera.position.copy(focus);

    camera.rotation.set(
      pitch,
      yaw,
      0,
      "YXZ"
    );

    body.visible = false;
  } else {
    body.visible = true;

    camera.position.copy(
      focus.clone().addScaledVector(direction, -6)
    );

    camera.position.y += 1.4;

    camera.lookAt(
      focus.clone().addScaledVector(direction, 8)
    );
  }
}

function toggleFlight() {
  flying = !flying;
  vy = 0;

  $("flyButton").textContent =
    flying ? "✈ FLY OFF" : "✈ FLY ON";

  $("flyButton").classList.toggle("enabled", flying);

  notify(
    flying
      ? "Flying enabled! Space UP • X DOWN"
      : "Flying disabled! Gravity restored."
  );
}

/* ===============================================
   CREATURE CAPTURE
   =============================================== */

const raycaster = new THREE.Raycaster();
const projectiles = [];

function aimedCreature() {
  raycaster.setFromCamera(
    new THREE.Vector2(0, 0),
    camera
  );

  raycaster.far = 30;

  const objects = wildCreatures.map(c => c.root);

  const hits = raycaster.intersectObjects(
    objects,
    true
  );

  if (!hits.length) return null;

  let object = hits[0].object;

  while (object && !object.userData.creature) {
    object = object.parent;
  }

  return object?.userData.creature || null;
}

function nearestCreature(range = 14) {
  const aimed = aimedCreature();

  if (
    aimed &&
    player.position.distanceTo(aimed.root.position) < range
  ) {
    return aimed;
  }

  let best = range;
  let chosen = null;

  for (const c of wildCreatures) {
    const distance = player.position.distanceTo(
      c.root.position
    );

    if (distance < best) {
      best = distance;
      chosen = c;
    }
  }

  return chosen;
}

function throwOrbEffect(target, success) {
  const orb = shape(
    scene,
    "sphere",
    success ? 0x7ce9df : 0xb8a0ff,
    0,0,0,
    .26,.26,.26,
    true
  );

  const start = player.position.clone();
  start.y += 1.8;

  const end = target.root.position.clone();
  end.y += 1.5;

  projectiles.push({
    orb, start, end,
    elapsed: 0,
    duration: .55
  });
}

function capture() {
  if (!playing || actionCooldown > 0) return;

  if (party.length >= 5) {
    notify("Your creature party is full (5 maximum)");
    return;
  }

  const target = nearestCreature(19);

  if (!target) {
    notify("Move near a wild creature to capture it");
    return;
  }

  if (!take("orbs")) {
    notify("No Capture Orbs! Press C to craft more.");
    return;
  }

  actionCooldown = .7;

  const distance = player.position.distanceTo(
    target.root.position
  );

  const successChance =
    distance < 7 ? .92 :
    distance < 13 ? .76 : .58;

  const success = Math.random() < successChance;

  throwOrbEffect(target, success);

  if (success) {
    party.push(target.name);

    scene.remove(target.root);

    const index = wildCreatures.indexOf(target);

    if (index >= 0) {
      wildCreatures.splice(index, 1);
    }

    setCompanion(party.length - 1);

    notify(
      `Captured ${target.name}! New companion joined.`
    );
  } else {
    notify(`${target.name} escaped! Try another orb.`);
  }

  updatePartyBar();
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    p.elapsed += dt;

    const t = Math.min(1, p.elapsed / p.duration);

    p.orb.position.lerpVectors(
      p.start,
      p.end,
      t
    );

    p.orb.position.y += Math.sin(t * Math.PI) * 2.5;

    p.orb.rotation.y += dt * 8;

    if (t >= 1) {
      scene.remove(p.orb);
      projectiles.splice(i, 1);
    }
  }
}

/* ===============================================
   COMPANION ATTACK
   =============================================== */

function commandCompanion() {
  if (!follower) {
    notify("Capture a creature first!");
    return;
  }

  if (actionCooldown > 0) return;

  const target = nearestCreature(14);

  if (!target) {
    notify(`${follower.name} is following you.`);
    return;
  }

  actionCooldown = .55;

  target.hp -= 35;

  const start = follower.root.position.clone();
  start.y += 1.8;

  const end = target.root.position.clone();
  end.y += 1.5;

  const bolt = shape(
    scene,
    "sphere",
    follower.config.color,
    0,0,0,
    .3,.3,.3,
    true
  );

  projectiles.push({
    orb:bolt,
    start,
    end,
    elapsed:0,
    duration:.35
  });

  if (target.hp <= 0) {
    add("crystal", 2);

    scene.remove(target.root);

    const index = wildCreatures.indexOf(target);

    if (index >= 0) {
      wildCreatures.splice(index, 1);
    }

    notify(
      `${follower.name} defeated ${target.name}! +2 crystals`
    );
  } else {
    notify(`${follower.name} used an elemental attack!`);
  }
}

/* ===============================================
   RESOURCE GATHERING
   =============================================== */

function gather() {
  if (!playing || actionCooldown > 0) return;

  let closest = null;
  let bestDistance = 5.5;

  for (const r of resources) {
    const distance = player.position.distanceTo(
      r.group.position
    );

    if (distance < bestDistance) {
      closest = r;
      bestDistance = distance;
    }
  }

  if (!closest) {
    notify("Move closer to a tree, rock or berry bush");
    return;
  }

  add(closest.type, closest.amount);

  notify(
    `Collected ${closest.amount} ${closest.type}`
  );

  scene.remove(closest.group);

  const index = resources.indexOf(closest);

  if (index >= 0) {
    resources.splice(index, 1);
  }

  actionCooldown = .3;
}

/* ===============================================
   BASE BUILDING
   =============================================== */

const buildings = [];

const buildingCosts = {
  camp: {wood:8, stone:5},
  workbench: {wood:5, stone:3},
  shelter: {wood:4, fiber:3}
};

function createBuilding(type, x, z, saving = false) {
  const group = new THREE.Group();

  if (type === "camp") {
    shape(
      group, "box",
      0xb2a086,
      0, 1.6, 0,
      5, 3.2, 4
    );

    const roof = shape(
      group, "cone",
      0x86634c,
      0, 3.9, 0,
      3.7, 2.6, 3.7
    );

    roof.rotation.y = Math.PI / 4;

    shape(
      group, "box",
      0x5f4131,
      0, .9, -2.05,
      1.1, 1.8, .13
    );

    shape(
      group, "box",
      0x8ad5e9,
      -1.35, 2.05, -2.07,
      .95, .9, .12
    );
  }

  if (type === "workbench") {
    shape(
      group, "box",
      0x95704f,
      0, 1.2, 0,
      2.2, .25, 1.2
    );

    for (const side of [-1, 1]) {
      shape(
        group, "box",
        0x654836,
        side * .8, .6, 0,
        .2, 1.1, .22
      );
    }
  }

  if (type === "shelter") {
    shape(
      group, "box",
      0x977856,
      0, .16, 0,
      4, .3, 4
    );

    for (const xOffset of [-1.7,1.7]) {
      for (const zOffset of [-1.7,1.7]) {
        shape(
          group, "box",
          0x76543e,
          xOffset, 1.35, zOffset,
          .19, 2.5, .19
        );
      }
    }

    const roof = shape(
      group, "cone",
      0x66b495,
      0, 3, 0,
      3.1, 1.4, 3.1
    );

    roof.rotation.y = Math.PI / 4;
  }

  group.position.set(x, groundHeight(x,z), z);
  scene.add(group);

  buildings.push({type,x,z,group});

  if (!saving) {
    notify(`${type.toUpperCase()} constructed!`);
  }
}

function build(type) {
  const cost = buildingCosts[type];

  if (!pay(cost)) {
    notify("Not enough resources to build!");
    return;
  }

  const forward = forwardVector();

  const x = THREE.MathUtils.clamp(
    player.position.x + forward.x * 8,
    -WORLD_SIZE + 8,
    WORLD_SIZE - 8
  );

  const z = THREE.MathUtils.clamp(
    player.position.z + forward.z * 8,
    -WORLD_SIZE + 8,
    WORLD_SIZE - 8
  );

  createBuilding(type, x, z);

  closePanel();
}

if (Array.isArray(saveData.buildings)) {
  for (const b of saveData.buildings) {
    if (
      buildingCosts[b.type] &&
      Number.isFinite(b.x) &&
      Number.isFinite(b.z)
    ) {
      createBuilding(b.type, b.x, b.z, true);
    }
  }
}

/* ===============================================
   INVENTORY / CRAFTING / BUILDING UI
   =============================================== */

function entry(title, detail, actions = []) {
  const row = document.createElement("div");
  row.className = "entry";

  const info = document.createElement("div");
  info.className = "info";

  const strong = document.createElement("strong");
  strong.textContent = title;

  const small = document.createElement("small");
  small.textContent = detail;

  info.append(strong, small);
  row.append(info);

  for (const [label, callback, disabled] of actions) {
    const button = document.createElement("button");
    button.textContent = label;
    button.disabled = !!disabled;
    button.onclick = callback;
    row.append(button);
  }

  $("entries").append(row);
}

function openPanel(type) {
  currentPanel = type;

  $("panel").hidden = false;
  $("menu").hidden = true;

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  drawPanel();
}

function closePanel() {
  currentPanel = "";
  $("panel").hidden = true;

  renderer.domElement.requestPointerLock()
    .catch(() => {
      $("menu").hidden = false;
    });
}

$("closePanel").onclick = closePanel;

function drawPanel() {
  $("entries").replaceChildren();

  $("panelTitle").textContent = {
    inventory:"🎒 INVENTORY",
    crafting:"🔨 CRAFTING",
    building:"🏠 BASE BUILDING",
    party:"🐾 CREATURE PARTY"
  }[currentPanel] || "Inventory";

  $("panelHelp").textContent =
    "Collect resources, create items, or choose an action.";

  if (currentPanel === "inventory") {
    for (const [item, amount] of Object.entries(inventory)) {
      entry(
        item.toUpperCase(),
        `Available: ${amount}`
      );
    }

    entry(
      "CREATURE PARTY",
      `${party.length} / 5 captured`,
      [["VIEW", () => openPanel("party")]]
    );
  }

  if (currentPanel === "crafting") {
    const orbCost = {stone:2, crystal:2};

    entry(
      "🔮 Capture Orbs ×3",
      "Requires 2 stone + 2 crystals",
      [[
        "CRAFT",
        () => {
          if (!pay(orbCost)) return;

          add("orbs",3);
          notify("Crafted 3 Capture Orbs");
          drawPanel();
        },
        !has(orbCost)
      ]]
    );

    const mealCost = {berries:3, wood:1};

    entry(
      "🍗 Cooked Meals ×2",
      "Requires 3 berries + 1 wood",
      [[
        "CRAFT",
        () => {
          if (!pay(mealCost)) return;

          add("meals",2);
          notify("Cooked 2 meals");
          drawPanel();
        },
        !has(mealCost)
      ]]
    );
  }

  if (currentPanel === "building") {
    const options = [
      ["camp","🏠 Camp House"],
      ["workbench","🪚 Workbench"],
      ["shelter","🐾 Creature Shelter"]
    ];

    for (const [type,title] of options) {
      const cost = buildingCosts[type];

      const description = Object.entries(cost)
        .map(([item,n]) => `${n} ${item}`)
        .join(" + ");

      entry(
        title,
        description,
        [[
          "BUILD",
          () => build(type),
          !has(cost)
        ]]
      );
    }
  }

  if (currentPanel === "party") {
    if (!party.length) {
      entry(
        "No creatures captured",
        "Find a wild creature and press Q."
      );
    }

    party.forEach((name,index) => {
      entry(
        `${creatureTypes[name].symbol} ${name}`,
        `${creatureTypes[name].element} creature`,
        [[
          "FOLLOW",
          () => {
            setCompanion(index);
            closePanel();
            notify(`${name} is now your companion`);
          }
        ]]
      );
    });
  }
}

/* ===============================================
   SAVE SYSTEM
   =============================================== */

function saveGame(silent = false) {
  try {
    localStorage.setItem(SAVE, JSON.stringify({
      inventory,
      party,
      selectedCompanion,
      health,
      hunger,
      worldTime,
      position:[
        player.position.x,
        player.position.y,
        player.position.z
      ],
      buildings:buildings.map(b => ({
        type:b.type,
        x:b.x,
        z:b.z
      }))
    }));

    if (!silent) notify("Game saved!");
  } catch {
    if (!silent) notify("Could not save the game");
  }
}

$("reset").onclick = () => {
  if (!confirm("Delete your saved Palfrontier world?")) {
    return;
  }

  localStorage.removeItem(SAVE);
  location.reload();
};

window.addEventListener("beforeunload", () => {
  saveGame(true);
});

/* ===============================================
   GAME CONTROLS
   =============================================== */

$("start").onclick = () => {
  renderer.domElement.requestPointerLock();
};

document.addEventListener("pointerlockchange", () => {
  playing =
    document.pointerLockElement === renderer.domElement;

  $("hud").hidden = !playing;
  $("menu").hidden = playing || !!currentPanel;

  if (!playing) {
    for (const code of Object.keys(keys)) {
      keys[code] = false;
    }
  }
});

document.addEventListener("mousemove", event => {
  if (!playing) return;

  yaw -= event.movementX * .0024;

  pitch = THREE.MathUtils.clamp(
    pitch - event.movementY * .0024,
    -.9,
    1.1
  );
});

document.addEventListener("keydown", event => {
  if (["Space","ArrowUp","ArrowDown"].includes(event.code)) {
    event.preventDefault();
  }

  keys[event.code] = true;

  if (!playing || event.repeat) return;

  if (event.code === "KeyQ") capture();
  if (event.code === "KeyE") commandCompanion();
  if (event.code === "KeyI") openPanel("inventory");
  if (event.code === "KeyC") openPanel("crafting");
  if (event.code === "KeyB") openPanel("building");
  if (event.code === "KeyF") toggleFlight();
  if (event.code === "KeyP") saveGame();

  if (event.code === "KeyV") {
    cameraMode = (cameraMode + 1) % 2;

    notify(
      cameraMode === 1
        ? "First-person camera"
        : "Third-person camera"
    );
  }

  if (event.code === "KeyR") {
    if (take("meals")) {
      hunger = Math.min(100, hunger + 35);
      health = Math.min(100, health + 10);

      notify("Ate cooked food");
    } else if (take("berries",2)) {
      hunger = Math.min(100, hunger + 15);

      notify("Ate berries");
    } else {
      notify("No food. Gather berries.");
    }
  }

  if (/^Digit[1-5]$/.test(event.code)) {
    const index = Number(event.code.slice(-1)) - 1;

    if (party[index]) {
      setCompanion(index);
      notify(`${party[index]} is following you`);
    }
  }
});

document.addEventListener("keyup", event => {
  keys[event.code] = false;
});

document.addEventListener("mousedown", event => {
  if (!playing || event.button !== 0) return;

  gather();
});

document.addEventListener("contextmenu", event => {
  event.preventDefault();
});

/* ===============================================
   HUD BUTTONS
   =============================================== */

$("captureButton").onclick = () => {
  capture();
  renderer.domElement.requestPointerLock().catch(() => {});
};

$("flyButton").onclick = () => {
  toggleFlight();
  renderer.domElement.requestPointerLock().catch(() => {});
};

$("buildButton").onclick = () => {
  openPanel("building");
};

$("inventoryButton").onclick = () => {
  openPanel("inventory");
};

/* ===============================================
   HUD UPDATE
   =============================================== */

function updateHUD() {
  $("health").textContent = Math.ceil(health);
  $("hunger").textContent = Math.ceil(hunger);
  $("orbs").textContent = inventory.orbs || 0;

  $("coords").textContent =
    `XYZ ${player.position.x.toFixed(0)}, ` +
    `${player.position.y.toFixed(0)}, ` +
    `${player.position.z.toFixed(0)}`;

  $("biome").textContent = biomeAt(
    player.position.x,
    player.position.z
  );

  const day = Math.floor(worldTime / 120) + 1;
  const timeOfDay = (worldTime % 120) / 120;

  const label =
    timeOfDay < .25 ? "Morning" :
    timeOfDay < .5 ? "Afternoon" :
    timeOfDay < .75 ? "Evening" : "Night";

  $("time").textContent = `Day ${day} • ${label}`;

  $("flightStatus").textContent =
    flying ? "✈ FLYING" : "WALKING";

  const target = aimedCreature();

  $("targetName").textContent = target
    ? `${target.name} • ${target.config.element} • Q to capture`
    : "";
}

/* ===============================================
   MAIN GAME LOOP
   =============================================== */

const clock = new THREE.Clock();

let fpsFrames = 0;
let fpsTimer = 0;
let hudTimer = 0;
let foodTimer = 0;
let autosaveTimer = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(.04, clock.getDelta());

  fpsFrames++;
  fpsTimer += dt;

  if (fpsTimer >= 1) {
    $("fps").textContent =
      `FPS ${Math.round(fpsFrames / fpsTimer)}`;

    fpsFrames = 0;
    fpsTimer = 0;
  }

  if (playing) {
    worldTime += dt;

    updatePlayer(dt);
    updateCreatures(dt);

    actionCooldown = Math.max(
      0,
      actionCooldown - dt
    );

    foodTimer += dt;
    autosaveTimer += dt;

    if (foodTimer >= 8) {
      foodTimer = 0;
      hunger = Math.max(0, hunger - 1);

      if (hunger === 0) {
        health = Math.max(0, health - 2);
      }
    }

    if (health <= 0) {
      health = 100;
      hunger = 50;

      player.position.set(
        0,
        groundHeight(0, 0),
        0
      );

      vy = 0;

      notify("You respawned at the starting meadow");
    }

    if (autosaveTimer >= 45) {
      autosaveTimer = 0;
      saveGame(true);
    }
  }

  updateCamera();
  updateProjectiles(dt);

  const daylight =
    .5 + .5 * Math.cos(worldTime * .052);

  hemisphere.intensity = .7 + daylight * 1.4;
  sun.intensity = .3 + daylight * 1.9;

  scene.background.setRGB(
    .09 + daylight * .49,
    .14 + daylight * .65,
    .25 + daylight * .69
  );

  hudTimer += dt;

  if (hudTimer >= .16) {
    hudTimer = 0;
    updateHUD();
  }

  if (noticeTimer > 0) {
    noticeTimer -= dt;

    if (noticeTimer <= 0) {
      $("notice").textContent = "";
    }
  }

  renderer.render(scene, camera);
}

updateCamera();
animate();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
});
