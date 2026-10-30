import * as THREE from "https://esm.sh/three@0.180.0";

/* ==================================================
   GALAXY PALFRONTIER — WILD ISLES
   ORIGINAL 3D CREATURE ADVENTURE
   ================================================== */

const $ = id => document.getElementById(id);
const STORE = "galaxy-palfrontier-rebuild-v1";
const SIZE = 110;

const keys = {};
const clock = new THREE.Clock();

let saved = {};

try {
  saved = JSON.parse(localStorage.getItem(STORE) || "{}");
} catch {
  saved = {};
}

const bag = {
  wood: 12,
  stone: 9,
  crystal: 5,
  berries: 8,
  fiber: 8,
  orbs: 8,
  meals: 2,
  ...saved.bag
};

let health = saved.health ?? 100;
let hunger = saved.hunger ?? 100;
let time = saved.time ?? 20;

let active = false;
let paused = true;
let flying = false;
let firstPerson = false;
let currentDialog = "";
let cooldown = 0;
let toastTimer = 0;
let yaw = 0;
let pitch = 0.1;
let verticalSpeed = 0;
let grounded = true;
let rightDragging = false;

const party = (
  Array.isArray(saved.party) ? saved.party : []
).slice(0, 5);

let selected = Math.min(
  saved.selected ?? 0,
  Math.max(0, party.length - 1)
);

function notify(message) {
  $("toast").textContent = message;
  toastTimer = 3;
}

function get(item) {
  return bag[item] || 0;
}

function earn(item, amount) {
  bag[item] = get(item) + amount;
}

function canAfford(cost) {
  return Object.entries(cost).every(
    ([item, amount]) => get(item) >= amount
  );
}

function pay(cost) {
  if (!canAfford(cost)) return false;

  for (const [item, amount] of Object.entries(cost)) {
    bag[item] -= amount;
  }

  return true;
}

function hash(x, z, seed = 0) {
  let n = Math.sin(
    x * 127.1 + z * 311.7 + seed * 71.9
  ) * 43758.5453;

  return n - Math.floor(n);
}

function terrainY(x, z) {
  return (
    3 +
    Math.sin(x * .038) * 4 +
    Math.cos(z * .048) * 3 +
    Math.sin((x + z) * .079) * 1.6 +
    Math.sin(x * .017 + z * .02) * 4
  );
}

function biome(x, z) {
  if (x > 30 && z < -25) return "Blossom Ridge";
  if (x < -25 && z > 10) return "Elder Forest";
  if (x > 36 && z > 25) return "Golden Grasslands";
  return "Emerald Meadow";
}

/* ==================================================
   3D ENGINE
   ================================================== */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8bd0f2);
scene.fog = new THREE.Fog(0x8bd0f2, 70, 180);

const camera = new THREE.PerspectiveCamera(
  70,
  innerWidth / innerHeight,
  .1,
  350
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(
  Math.min(devicePixelRatio || 1, 1.5)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

$("game").append(renderer.domElement);

const ambient = new THREE.HemisphereLight(
  0xf2faff,
  0x587452,
  2.1
);
scene.add(ambient);

const sun = new THREE.DirectionalLight(
  0xffedce,
  2.7
);
sun.position.set(30, 65, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.camera.far = 150;
scene.add(sun);

/* ==================================================
   SHAPES AND MATERIALS
   ================================================== */

const shapes = {
  sphere: new THREE.SphereGeometry(1, 14, 10),
  box: new THREE.BoxGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(1, 1, 8),
  trunk: new THREE.CylinderGeometry(1, 1, 1, 9),
  rock: new THREE.IcosahedronGeometry(1, 1)
};

const materials = new Map();

function material(color, glow = false) {
  const key = `${color}-${glow}`;

  if (!materials.has(key)) {
    materials.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: .78,
        metalness: .04,
        emissive: glow ? color : 0,
        emissiveIntensity: glow ? .5 : 0
      })
    );
  }

  return materials.get(key);
}

function mesh(
  parent,
  type,
  color,
  x, y, z,
  sx = 1, sy = 1, sz = 1,
  glow = false
) {
  const object = new THREE.Mesh(
    shapes[type],
    material(color, glow)
  );

  object.position.set(x, y, z);
  object.scale.set(sx, sy, sz);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);

  return object;
}

/* ==================================================
   LANDSCAPE
   ================================================== */

const groundGeometry = new THREE.PlaneGeometry(
  SIZE * 2, SIZE * 2, 110, 110
);
groundGeometry.rotateX(-Math.PI / 2);

const positions = groundGeometry.attributes.position;
const colors = [];

for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const z = positions.getZ(i);
  positions.setY(i, terrainY(x, z));

  const zone = biome(x, z);
  const color = new THREE.Color(
    zone === "Blossom Ridge" ? 0x90bf7e :
    zone === "Elder Forest" ? 0x438d69 :
    zone === "Golden Grasslands" ? 0xb1b978 :
    0x69b76b
  );

  color.multiplyScalar(
    .9 + hash(x, z, 3) * .2
  );

  colors.push(color.r, color.g, color.b);
}

groundGeometry.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(colors, 3)
);
groundGeometry.computeVertexNormals();

const ground = new THREE.Mesh(
  groundGeometry,
  new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1
  })
);

ground.receiveShadow = true;
scene.add(ground);

/* Water is intentionally placed below the hills. */

const waterMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x3daac8,
  roughness: .23,
  metalness: .05,
  transparent: true,
  opacity: .78,
  side: THREE.DoubleSide
});

const waterGeometry = new THREE.PlaneGeometry(
  SIZE * 2, SIZE * 2, 35, 35
);
waterGeometry.rotateX(-Math.PI / 2);

const water = new THREE.Mesh(
  waterGeometry,
  waterMaterial
);
water.position.y = -1.8;
scene.add(water);

/* ==================================================
   FOREST, ROCKS, FLOWERS, GRASS
   ================================================== */

const resources = [];
const trees = [];
const flowers = [];
const clouds = [];

function putResource(group, type, amount, x, z) {
  group.position.set(x, terrainY(x, z), z);
  group.userData.resource = {type, amount};
  resources.push(group);
  scene.add(group);
}

function tree(x, z, kind = "normal") {
  const g = new THREE.Group();
  const giant = kind === "giant";
  const cherry = kind === "cherry";
  const h = giant ? 10 : 5.7;

  mesh(
    g, "trunk",
    giant ? 0x67513c : 0x805f44,
    0, h / 2, 0,
    giant ? .7 : .38, h,
    giant ? .7 : .38
  );

  const palette = cherry
    ? [0xf6a3c8, 0xfad0de, 0xe88fb0]
    : giant
      ? [0x317966, 0x429377, 0x56a887]
      : [0x3f9052, 0x64af62, 0x80c473];

  for (let i = 0; i < (giant ? 10 : 6); i++) {
    const a = i * 2.399;
    const r = i ? (giant ? 2.9 : 1.35) : 0;

    mesh(
      g, "rock",
      palette[i % 3],
      Math.cos(a) * r,
      h + Math.sin(i * 2) * .5,
      Math.sin(a) * r,
      giant ? 2.4 : 1.5,
      giant ? 1.8 : 1.25,
      giant ? 2.4 : 1.5
    );
  }

  putResource(
    g, "wood", giant ? 7 : 4, x, z
  );

  trees.push({
    object: g,
    phase: hash(x, z, 6) * 6
  });
}

function rock(x, z, crystal = false) {
  const g = new THREE.Group();

  if (crystal) {
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;

      mesh(
        g, "cone",
        i % 2 ? 0x70e4f1 : 0xb3a0ff,
        Math.cos(a) * .6,
        1.25,
        Math.sin(a) * .6,
        .55, 2.4, .55,
        true
      );
    }
  } else {
    mesh(
      g, "rock",
      0x919a9f,
      0, .7, 0,
      1.3, .9, 1.1
    );
  }

  putResource(
    g,
    crystal ? "crystal" : "stone",
    crystal ? 2 : 4,
    x, z
  );
}

function bush(x, z) {
  const g = new THREE.Group();

  mesh(
    g, "rock",
    0x41874e,
    0, .65, 0,
    1, .8, 1
  );

  for (let i = 0; i < 7; i++) {
    const a = i * 6.283 / 7;

    mesh(
      g, "sphere",
      0xea6981,
      Math.cos(a) * .7,
      .72,
      Math.sin(a) * .7,
      .13, .13, .13
    );
  }

  putResource(g, "berries", 4, x, z);
}

for (let i = 0; i < 170; i++) {
  const x = (hash(i, 2, 7) - .5) * 206;
  const z = (hash(i, 8, 6) - .5) * 206;

  if (Math.hypot(x, z) < 15) continue;

  const n = hash(i, 12, 3);

  if (n < .48) {
    tree(
      x, z,
      biome(x,z) === "Blossom Ridge" ? "cherry" :
      biome(x,z) === "Elder Forest" && n < .2
        ? "giant" : "normal"
    );
  } else if (n < .74) {
    rock(x, z, n > .66);
  } else {
    bush(x, z);
  }
}

/* Instanced grass is much faster than
   thousands of separate grass meshes. */

const grassGeometry = new THREE.ConeGeometry(
  .12, .7, 3
);

const grass = new THREE.InstancedMesh(
  grassGeometry,
  material(0x69af64),
  2800
);

const dummy = new THREE.Object3D();

for (let i = 0; i < 2800; i++) {
  const x = (hash(i, 20, 4) - .5) * 205;
  const z = (hash(i, 21, 7) - .5) * 205;

  dummy.position.set(
    x, terrainY(x, z) + .25, z
  );
  dummy.rotation.y = hash(i, 24, 1) * 6.283;
  dummy.scale.setScalar(.5 + hash(i, 28, 3));
  dummy.updateMatrix();
  grass.setMatrixAt(i, dummy.matrix);
}

grass.instanceMatrix.needsUpdate = true;
scene.add(grass);

/* Flowers */

for (let i = 0; i < 120; i++) {
  const x = (hash(i, 30, 1) - .5) * 200;
  const z = (hash(i, 31, 4) - .5) * 200;
  const g = new THREE.Group();

  mesh(
    g, "trunk",
    0x489354,
    0, .25, 0,
    .035, .5, .035
  );

  for (let j = 0; j < 5; j++) {
    const a = j * 6.283 / 5;

    mesh(
      g, "sphere",
      i % 2 ? 0xffbed9 : 0xffd38a,
      Math.cos(a) * .14,
      .55,
      Math.sin(a) * .14,
      .14, .09, .14
    );
  }

  g.position.set(x, terrainY(x,z), z);
  scene.add(g);

  flowers.push({
    g,
    phase: hash(i, 41, 5) * 6
  });
}

/* Animated sky clouds */

for (let i = 0; i < 14; i++) {
  const g = new THREE.Group();

  for (let j = 0; j < 5; j++) {
    mesh(
      g, "sphere",
      0xffffff,
      (j - 2) * 2.3,
      Math.sin(j * 2) * .35,
      (j % 2) * 1.1,
      3.3, 1.25, 2
    );
  }

  g.position.set(
    (hash(i, 40, 2) - .5) * 230,
    34 + hash(i, 42, 4) * 15,
    (hash(i, 43, 6) - .5) * 230
  );

  scene.add(g);
  clouds.push(g);
}

/* ==================================================
   PLAYER MODEL
   ================================================== */

const player = new THREE.Group();
const playerModel = new THREE.Group();
player.add(playerModel);

mesh(
  playerModel, "box",
  0x3476a3,
  0, 1.35, 0,
  .8, 1, .48
);

mesh(
  playerModel, "sphere",
  0xe1b28c,
  0, 2.12, 0,
  .43, .46, .43
);

mesh(
  playerModel, "sphere",
  0x3a2d2f,
  0, 2.43, .06,
  .46, .2, .45
);

const arms = [];
const legs = [];

for (const side of [-1, 1]) {
  const arm = new THREE.Group();
  arm.position.set(side * .56, 1.68, 0);

  mesh(
    arm, "box",
    0x3476a3,
    0, -.39, 0,
    .25, .78, .31
  );

  playerModel.add(arm);
  arms.push(arm);

  const leg = new THREE.Group();
  leg.position.set(side * .2, .85, 0);

  mesh(
    leg, "box",
    0x304e77,
    0, -.4, 0,
    .29, .8, .34
  );

  playerModel.add(leg);
  legs.push(leg);

  mesh(
    playerModel, "sphere",
    0xffffff,
    side * .18, 2.13, -.4,
    .085, .09, .05
  );

  mesh(
    playerModel, "sphere",
    0x203647,
    side * .18, 2.13, -.45,
    .043, .06, .03
  );
}

player.position.set(
  saved.pos?.[0] ?? 0,
  saved.pos?.[1] ?? terrainY(0,0),
  saved.pos?.[2] ?? 0
);

scene.add(player);

/* ==================================================
   ORIGINAL CREATURES + LOCAL AI
   ================================================== */

const species = {
  Bloomlet: {
    color:0x84d78b, belly:0xd1f4b3,
    accent:0x499c6b, emoji:"🌿",
    element:"Nature", speed:2
  },
  Cinderfox: {
    color:0xee9759, belly:0xffd4a2,
    accent:0xb95740, emoji:"🔥",
    element:"Fire", speed:3
  },
  Tidepup: {
    color:0x70b9e0, belly:0xd3f2ff,
    accent:0x438eb7, emoji:"💧",
    element:"Water", speed:2.5
  },
  Sparkit: {
    color:0xf4d36f, belly:0xffefad,
    accent:0xb58b42, emoji:"⚡",
    element:"Electric", speed:3.2
  },
  Moonhorn: {
    color:0xcbb9ee, belly:0xf9f6ff,
    accent:0x886dc7, emoji:"✨",
    element:"Mystic", speed:2
  },
  Brambleon: {
    color:0x63b49c, belly:0xb2dfb8,
    accent:0x357c60, emoji:"🌲",
    element:"Forest", speed:1.8
  }
};

const wild = [];
let companion = null;

function createCreature(name, x, z, friendly = false) {
  const spec = species[name];
  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);

  const scale = name === "Brambleon" ? 1.3 :
                name === "Moonhorn" ? 1.1 : .88;
  model.scale.setScalar(scale);

  mesh(
    model, "sphere",
    spec.color,
    0, 1.15, 0,
    .84, .75, .7
  );

  mesh(
    model, "sphere",
    spec.belly,
    0, 1, -.48,
    .55, .5, .27
  );

  mesh(
    model, "sphere",
    spec.color,
    0, 1.92, -.25,
    .7, .66, .62
  );

  const ears = [];

  for (const side of [-1, 1]) {
    const ear = mesh(
      model, "cone",
      spec.accent,
      side * .44, 2.59, -.2,
      .24, .69, .25
    );

    ear.rotation.z = side * -.2;
    ears.push(ear);

    mesh(
      model, "sphere",
      0xffffff,
      side * .26, 2.04, -.76,
      .18, .22, .08
    );

    mesh(
      model, "sphere",
      0x21374b,
      side * .26, 2.04, -.84,
      .09, .12, .04
    );

    for (const f of [-1, 1]) {
      mesh(
        model, "sphere",
        spec.color,
        side * .42, .45, f * .4,
        .25, .3, .28
      );
    }
  }

  mesh(
    model, "sphere",
    0xf4a6b0,
    0, 1.75, -.84,
    .13, .09, .07
  );

  mesh(
    model, "sphere",
    spec.color,
    0, 1.08, .7,
    .36, .4, .5
  );

  if (name === "Moonhorn") {
    mesh(
      model, "cone",
      0xf0f4ff,
      0, 2.82, -.34,
      .16, .85, .16
    );
  }

  if (name === "Cinderfox") {
    mesh(
      model, "cone",
      0xffc666,
      0, 1.4, 1.05,
      .27, .74, .25,
      true
    );
  }

  const unit = {
    name, spec, root, model, ears,
    hp:100,
    state:"idle",
    timer:0,
    angle:hash(x,z,8)*6.283,
    homeX:x,
    homeZ:z,
    phase:hash(x,z,9)*6.283,
    friendly,
    scale
  };

  root.position.set(x, terrainY(x,z), z);
  root.userData.creature = unit;
  scene.add(root);

  if (!friendly) wild.push(unit);

  return unit;
}

const names = Object.keys(species);

for (let i = 0; i < 30; i++) {
  const a = hash(i,3,7)*Math.PI*2;
  const d = 15 + hash(i,5,4)*83;

  createCreature(
    names[Math.floor(hash(i,7,2)*names.length)],
    Math.cos(a)*d,
    Math.sin(a)*d
  );
}

/* ==================================================
   COMPANION PARTY
   ================================================== */

function redrawParty() {
  $("party").replaceChildren();

  for (let i = 0; i < 5; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";

    if (party[i] && i === selected) {
      slot.classList.add("selected");
    }

    slot.textContent = party[i]
      ? species[party[i]]?.emoji || "🐾"
      : "＋";

    const number = document.createElement("small");
    number.textContent = i+1;
    slot.append(number);

    $("party").append(slot);
  }
}

function selectCompanion(index) {
  if (!species[party[index]]) return;

  selected = index;

  if (companion) {
    scene.remove(companion.root);
  }

  companion = createCreature(
    party[index],
    player.position.x+2,
    player.position.z+2,
    true
  );

  $("companion").textContent =
    species[party[index]].emoji + " " + party[index];

  $("companionState").textContent =
    species[party[index]].element + " · Following";

  redrawParty();
}

if (party.length && species[party[selected]]) {
  selectCompanion(selected);
} else {
  redrawParty();
}

/* ==================================================
   CREATURE AI — IDLE, WANDER, FLEE, FOLLOW
   ================================================== */

function updateCreatureAI(dt) {
  for (const unit of wild) {
    unit.timer -= dt;

    if (unit.timer <= 0) {
      if (unit.state === "flee") {
        unit.state = "wander";
      } else {
        unit.state = Math.random() < .28
          ? "idle" : "wander";
      }

      unit.timer = 1.5 + Math.random()*3;
      unit.angle += (Math.random()-.5)*2.8;
    }

    if (unit.state !== "idle") {
      const speed = unit.spec.speed *
        (unit.state === "flee" ? 1.7 : .45);

      const nx = unit.root.position.x +
        Math.sin(unit.angle)*speed*dt;
      const nz = unit.root.position.z +
        Math.cos(unit.angle)*speed*dt;

      if (
        Math.hypot(nx-unit.homeX,nz-unit.homeZ)<14 &&
        Math.abs(nx)<SIZE-3 &&
        Math.abs(nz)<SIZE-3
      ) {
        unit.root.position.x = nx;
        unit.root.position.z = nz;
      } else {
        unit.angle += Math.PI;
      }
    }

    unit.root.position.y = terrainY(
      unit.root.position.x,
      unit.root.position.z
    );

    unit.root.rotation.y = unit.angle;
    animateCreature(unit, dt);
  }

  if (companion) {
    const p = companion.root.position;
    const dx = player.position.x-p.x;
    const dz = player.position.z-p.z;
    const d = Math.hypot(dx,dz);

    if (d>35) {
      p.x=player.position.x+2;
      p.z=player.position.z+2;
    } else if (d>3) {
      const step = Math.min(
        d-3, companion.spec.speed*2.1*dt
      );
      p.x += dx/d*step;
      p.z += dz/d*step;
      companion.root.rotation.y =
        Math.atan2(-dx,-dz);
    }

    p.y=terrainY(p.x,p.z);
    animateCreature(companion,dt);
  }
}

function animateCreature(unit, dt) {
  const t = time+unit.phase;

  unit.model.position.y =
    Math.sin(t*3.3)*.09;

  unit.model.rotation.z =
    Math.sin(t*2)*.025;

  unit.model.scale.y =
    unit.scale*(1+Math.sin(t*2.6)*.018);

  unit.ears[0].rotation.z =
    .2+Math.sin(t*3)*.07;

  unit.ears[1].rotation.z =
    -.2-Math.sin(t*3)*.07;
}

/* ==================================================
   3D PLAYER MOVEMENT
   ================================================== */

function lookVector() {
  return new THREE.Vector3(
    -Math.sin(yaw)*Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw)*Math.cos(pitch)
  );
}

function updateMovement(dt) {
  const fx=-Math.sin(yaw);
  const fz=-Math.cos(yaw);
  const rx=Math.cos(yaw);
  const rz=-Math.sin(yaw);

  let x=0,z=0;

  if(keys.KeyW){x+=fx;z+=fz;}
  if(keys.KeyS){x-=fx;z-=fz;}
  if(keys.KeyD){x+=rx;z+=rz;}
  if(keys.KeyA){x-=rx;z-=rz;}

  const length=Math.hypot(x,z);
  const moving=length>.01;

  if(moving){
    x/=length;
    z/=length;
  }

  const sprint=keys.ShiftLeft||keys.ShiftRight;
  const speed=flying?13:sprint?10:6.5;

  player.position.x=THREE.MathUtils.clamp(
    player.position.x+x*speed*dt,
    -SIZE+3,SIZE-3
  );

  player.position.z=THREE.MathUtils.clamp(
    player.position.z+z*speed*dt,
    -SIZE+3,SIZE-3
  );

  if(moving){
    player.rotation.y=Math.atan2(-x,-z);
  }

  const floor=terrainY(
    player.position.x,player.position.z
  );

  if(flying){
    const up=(keys.Space?1:0)-(keys.KeyX?1:0);
    player.position.y+=up*speed*dt;
    player.position.y=THREE.MathUtils.clamp(
      player.position.y,floor,90
    );
    verticalSpeed=0;
  }else{
    verticalSpeed-=23*dt;

    if(keys.Space && grounded){
      verticalSpeed=9;
      grounded=false;
    }

    player.position.y+=verticalSpeed*dt;

    if(player.position.y<=floor){
      player.position.y=floor;
      verticalSpeed=0;
      grounded=true;
    }
  }

  const swing=moving?Math.sin(time*11)*.5:0;
  arms[0].rotation.x=swing;
  arms[1].rotation.x=-swing;
  legs[0].rotation.x=-swing;
  legs[1].rotation.x=swing;
}

function updateCamera(dt) {
  const eye=player.position.clone();
  eye.y+=1.7;

  const look=lookVector();

  if(firstPerson){
    playerModel.visible=false;
    camera.position.copy(eye);
    camera.rotation.set(pitch,yaw,0,"YXZ");
  }else{
    playerModel.visible=true;

    const desired=eye.clone()
      .addScaledVector(look,-6);

    desired.y+=1.8;

    camera.position.lerp(
      desired,
      Math.min(1,dt*12)
    );

    camera.lookAt(
      eye.clone().addScaledVector(look,10)
    );
  }
}

/* ==================================================
   GRAPHICAL EFFECTS
   ================================================== */

const particles=[];
const flyingOrbs=[];

function burst(position,color,count=18) {
  const geometry=new THREE.SphereGeometry(.075,5,4);
  const effectMaterial=new THREE.MeshBasicMaterial({
    color,
    transparent:true,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  });

  for(let i=0;i<count;i++){
    const object=new THREE.Mesh(
      geometry,effectMaterial
    );

    object.position.copy(position);
    scene.add(object);

    particles.push({
      object,
      velocity:new THREE.Vector3(
        (Math.random()-.5)*8,
        Math.random()*6,
        (Math.random()-.5)*8
      ),
      life:.5+Math.random()*.6,
      age:0
    });
  }
}

function throwOrb(start,end,color) {
  const object=new THREE.Mesh(
    new THREE.SphereGeometry(.23,12,9),
    material(color,true)
  );

  scene.add(object);

  flyingOrbs.push({
    object,
    start,
    end,
    elapsed:0
  });
}

function updateEffects(dt) {
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.age+=dt;
    p.object.position.addScaledVector(
      p.velocity,dt
    );
    p.velocity.y-=10*dt;

    const s=Math.max(.01,1-p.age/p.life);
    p.object.scale.setScalar(s);

    if(p.age>=p.life){
      scene.remove(p.object);
      particles.splice(i,1);
    }
  }

  for(let i=flyingOrbs.length-1;i>=0;i--){
    const p=flyingOrbs[i];
    p.elapsed+=dt;
    const t=Math.min(1,p.elapsed/.5);

    p.object.position.lerpVectors(
      p.start,p.end,t
    );
    p.object.position.y+=
      Math.sin(t*Math.PI)*2.2;

    if(t>=1){
      burst(p.end,p.object.material.color.getHex(),14);
      scene.remove(p.object);
      flyingOrbs.splice(i,1);
    }
  }

  for(const tree of trees){
    tree.object.rotation.z=
      Math.sin(time*.85+tree.phase)*.012;
  }

  for(const flower of flowers){
    flower.g.rotation.z=
      Math.sin(time*1.4+flower.phase)*.07;
  }

  for(const cloud of clouds){
    cloud.position.x+=dt*.25;
    if(cloud.position.x>145){
      cloud.position.x=-145;
    }
  }

  water.position.y=-1.8+
    Math.sin(time*1.3)*.08;
}

/* ==================================================
   TARGETING AND COMBAT
   ================================================== */

const raycaster=new THREE.Raycaster();

function aimedCreature() {
  raycaster.setFromCamera(
    new THREE.Vector2(0,0),camera
  );

  raycaster.far=35;

  const hits=raycaster.intersectObjects(
    wild.map(c=>c.root),true
  );

  if(!hits.length)return null;

  let object=hits[0].object;

  while(object && !object.userData.creature){
    object=object.parent;
  }

  return object?.userData.creature||null;
}

function nearestCreature(max=17) {
  const aimed=aimedCreature();

  if(
    aimed &&
    aimed.root.position.distanceTo(player.position)<max
  ){
    return aimed;
  }

  let best=max;
  let target=null;

  for(const unit of wild){
    const d=unit.root.position.distanceTo(
      player.position
    );

    if(d<best){
      best=d;
      target=unit;
    }
  }

  return target;
}

function capture() {
  if(!active || cooldown>0)return;

  const unit=nearestCreature(20);

  if(!unit){
    notify("Approach a wild creature");
    return;
  }

  if(party.length>=5){
    notify("Party full (5 maximum)");
    return;
  }

  if(!pay({orbs:1})){
    notify("Craft more Capture Orbs with C");
    return;
  }

  cooldown=.65;

  const distance=unit.root.position.distanceTo(
    player.position
  );

  const success=Math.random()<
    (distance<8?.92:.7);

  const endpoint=unit.root.position.clone();
  endpoint.y+=1.5;

  throwOrb(
    player.position.clone().add(
      new THREE.Vector3(0,1.8,0)
    ),
    endpoint,
    success?0x87f0e1:0xab96ff
  );

  if(success){
    party.push(unit.name);
    scene.remove(unit.root);
    wild.splice(wild.indexOf(unit),1);
    selectCompanion(party.length-1);
    notify(`Captured ${unit.name}!`);
    burst(endpoint,0x9effdd,35);
  }else{
    unit.state="flee";
    unit.timer=3;
    unit.angle=Math.atan2(
      unit.root.position.x-player.position.x,
      unit.root.position.z-player.position.z
    );
    notify(`${unit.name} escaped!`);
  }

  redrawParty();
}

function companionAttack(){
  if(!active || cooldown>0)return;

  if(!companion){
    notify("Capture a companion first");
    return;
  }

  const target=nearestCreature(15);

  if(!target){
    notify("No enemy creature nearby");
    return;
  }

  cooldown=.5;
  target.hp-=35;

  const endpoint=target.root.position.clone();
  endpoint.y+=1.5;

  throwOrb(
    companion.root.position.clone().add(
      new THREE.Vector3(0,1.7,0)
    ),
    endpoint,
    companion.spec.color
  );

  target.state="flee";
  target.timer=2.5;
  target.angle=Math.atan2(
    target.root.position.x-companion.root.position.x,
    target.root.position.z-companion.root.position.z
  );

  if(target.hp<=0){
    earn("crystal",2);
    scene.remove(target.root);
    wild.splice(wild.indexOf(target),1);
    notify(`${companion.name} won! +2 crystals`);
  }else{
    notify(`${companion.name} used ${companion.spec.element} Burst!`);
  }
}

function gatherOrAttack(){
  if(!active || cooldown>0)return;

  const target=nearestCreature(5);

  if(target){
    target.hp-=20;
    target.state="flee";
    target.timer=2;
    target.angle=Math.atan2(
      target.root.position.x-player.position.x,
      target.root.position.z-player.position.z
    );

    burst(
      target.root.position.clone().add(
        new THREE.Vector3(0,1.5,0)
      ),
      0xffba79
    );

    cooldown=.3;

    if(target.hp<=0){
      earn("crystal",1);
      scene.remove(target.root);
      wild.splice(wild.indexOf(target),1);
      notify(`Defeated ${target.name}`);
    }else{
      notify(`${target.name} hit!`);
    }
    return;
  }

  let found=null;
  let best=5.5;

  for(const object of resources){
    const d=object.position.distanceTo(
      player.position
    );

    if(d<best){
      best=d;
      found=object;
    }
  }

  if(!found){
    notify("Move closer to trees, rocks or berries");
    return;
  }

  const {type,amount}=found.userData.resource;

  earn(type,amount);

  burst(
    found.position.clone().add(
      new THREE.Vector3(0,1,0)
    ),
    0xb2f5bb
  );

  scene.remove(found);
  resources.splice(resources.indexOf(found),1);
  cooldown=.3;

  notify(`Collected ${amount} ${type}`);
}

/* ==================================================
   CRAFTING AND CAMP BUILDING
   ================================================== */

const recipes = {
  orbs:{
    label:"3 Capture Orbs",
    cost:{stone:2,crystal:2},
    item:"orbs",
    amount:3
  },
  meals:{
    label:"2 Cooked Meals",
    cost:{berries:3,wood:1},
    item:"meals",
    amount:2
  }
};

const structures = {
  hut:{
    name:"Camp House",
    cost:{wood:8,stone:5}
  },
  bench:{
    name:"Workbench",
    cost:{wood:5,stone:3}
  },
  shelter:{
    name:"Creature Shelter",
    cost:{wood:4,fiber:3}
  }
};

const buildings=[];

function makeBuilding(type,x,z){
  const g=new THREE.Group();

  if(type==="hut"){
    mesh(
      g,"box",0xbca586,
      0,1.6,0,5,3.2,4
    );

    const roof=mesh(
      g,"cone",0x906d50,
      0,3.9,0,3.8,2.6,3.8
    );
    roof.rotation.y=Math.PI/4;

    mesh(
      g,"box",0x624638,
      0,.95,-2.05,1.1,1.9,.13
    );

    mesh(
      g,"box",0x9bdcef,
      -1.35,2,-2.08,.9,.8,.1
    );
  }else if(type==="bench"){
    mesh(
      g,"box",0x98744e,
      0,1.2,0,2.2,.25,1.3
    );

    for(const side of [-1,1]){
      mesh(
        g,"box",0x6b4b34,
        side*.8,.62,0,.22,1.15,.22
      );
    }
  }else{
    mesh(
      g,"box",0x987653,
      0,.17,0,4,.34,4
    );

    for(const x of [-1.7,1.7]){
      for(const z of [-1.7,1.7]){
        mesh(
          g,"box",0x76543a,
          x,1.45,z,.2,2.6,.2
        );
      }
    }

    const roof=mesh(
      g,"cone",0x61b58c,
      0,3.1,0,3.3,1.5,3.3
    );
    roof.rotation.y=Math.PI/4;
  }

  g.position.set(x,terrainY(x,z),z);
  scene.add(g);
  buildings.push({type,x,z});
}

for(const b of saved.buildings||[]){
  if(
    structures[b.type] &&
    Number.isFinite(b.x) &&
    Number.isFinite(b.z)
  ){
    makeBuilding(b.type,b.x,b.z);
  }
}

function build(type){
  const structure=structures[type];

  if(!structure || !pay(structure.cost)){
    notify("Not enough building resources");
    return;
  }

  const look=lookVector();

  const x=THREE.MathUtils.clamp(
    player.position.x+look.x*8,
    -SIZE+8,SIZE-8
  );

  const z=THREE.MathUtils.clamp(
    player.position.z+look.z*8,
    -SIZE+8,SIZE-8
  );

  makeBuilding(type,x,z);
  closeDialog();
  notify(`${structure.name} built!`);
}

/* ==================================================
   INVENTORY INTERFACE
   ================================================== */

function row(title,description,buttonText,action,disabled=false){
  const div=document.createElement("div");
  div.className="entry";

  const info=document.createElement("div");
  info.className="text";

  const strong=document.createElement("strong");
  strong.textContent=title;

  const small=document.createElement("small");
  small.textContent=description;

  info.append(strong,small);
  div.append(info);

  if(buttonText){
    const button=document.createElement("button");
    button.textContent=buttonText;
    button.disabled=disabled;
    button.onclick=action;
    div.append(button);
  }

  $("dialogRows").append(div);
}

function showDialog(kind){
  currentDialog=kind;
  active=false;
  paused=true;

  $("dialog").hidden=false;
  $("menu").hidden=true;
  $("hud").hidden=false;

  if(document.pointerLockElement){
    document.exitPointerLock();
  }

  for(const code of Object.keys(keys)){
    keys[code]=false;
  }

  refreshDialog();
}

function refreshDialog(){
  $("dialogRows").replaceChildren();

  $("dialogTitle").textContent={
    inventory:"🎒 Inventory",
    crafting:"🔨 Crafting",
    building:"🏠 Building",
    party:"🐾 Party"
  }[currentDialog];

  if(currentDialog==="inventory"){
    for(const [name,count] of Object.entries(bag)){
      row(name.toUpperCase(),`${count} available`);
    }

    row(
      "CREATURE PARTY",
      `${party.length}/5`,
      "VIEW",
      ()=>showDialog("party")
    );
  }

  if(currentDialog==="crafting"){
    for(const recipe of Object.values(recipes)){
      const cost=Object.entries(recipe.cost)
        .map(([n,v])=>`${v} ${n}`).join(" + ");

      row(
        recipe.label,cost,"CRAFT",
        ()=>{
          if(pay(recipe.cost)){
            earn(recipe.item,recipe.amount);
            notify(`Crafted ${recipe.label}`);
            refreshDialog();
          }
        },
        !canAfford(recipe.cost)
      );
    }
  }

  if(currentDialog==="building"){
    for(const [type,structure] of Object.entries(structures)){
      const cost=Object.entries(structure.cost)
        .map(([n,v])=>`${v} ${n}`).join(" + ");

      row(
        structure.name,cost,"BUILD",
        ()=>build(type),
        !canAfford(structure.cost)
      );
    }
  }

  if(currentDialog==="party"){
    for(let i=0;i<party.length;i++){
      const index=i;
      row(
        party[i],
        species[party[i]]?.element||"",
        "FOLLOW",
        ()=>{
          selectCompanion(index);
          closeDialog();
        }
      );
    }
  }
}

function closeDialog(){
  currentDialog="";
  $("dialog").hidden=true;
  resumeGame();
}

$("closeDialog").onclick=closeDialog;

/* ==================================================
   START, PAUSE, RESUME
   ================================================== */

function resumeGame(){
  $("menu").hidden=true;
  $("dialog").hidden=true;
  $("hud").hidden=false;

  active=true;
  paused=false;

  clock.getDelta();

  // The game starts even when pointer lock is unavailable.
  if(document.pointerLockElement!==renderer.domElement){
    try{
      const result=renderer.domElement.requestPointerLock();

      if(result?.catch){
        result.catch(error=>{
          console.warn("Mouse lock unavailable:",error);
          notify("Use right-click drag to look around");
        });
      }
    }catch(error){
      console.warn(error);
    }
  }
}

$("start").onclick=resumeGame;

function pauseGame(){
  active=false;
  paused=true;

  $("menu").hidden=false;
  $("hud").hidden=true;

  for(const code of Object.keys(keys)){
    keys[code]=false;
  }

  if(document.pointerLockElement){
    document.exitPointerLock();
  }
}

document.addEventListener("pointerlockchange",()=>{
  // Pointer lock controls camera convenience.
  // Losing it does NOT automatically break or pause gameplay.
  if(
    document.pointerLockElement!==renderer.domElement &&
    active
  ){
    notify("Mouse unlocked — hold right mouse button to look");
  }
});

/* ==================================================
   KEYBOARD / MOUSE CONTROLS
   ================================================== */

document.addEventListener("keydown",e=>{
  if(["Space","ArrowUp","ArrowDown"].includes(e.code)){
    e.preventDefault();
  }

  if(e.code==="Escape"){
    if(currentDialog){
      closeDialog();
    }else if(active){
      pauseGame();
    }
    return;
  }

  if(!active)return;

  keys[e.code]=true;

  if(e.repeat)return;

  if(e.code==="KeyQ")capture();
  if(e.code==="KeyE")companionAttack();
  if(e.code==="KeyI")showDialog("inventory");
  if(e.code==="KeyC")showDialog("crafting");
  if(e.code==="KeyB")showDialog("building");
  if(e.code==="KeyP")saveGame();
  if(e.code==="KeyF"){
    flying=!flying;
    verticalSpeed=0;
    notify(flying?"Flying ON":"Flying OFF");
  }
  if(e.code==="KeyV"){
    firstPerson=!firstPerson;
    notify(firstPerson?"First-person view":"Third-person view");
  }

  if(e.code==="KeyR"){
    if(pay({meals:1})){
      hunger=Math.min(100,hunger+35);
      health=Math.min(100,health+10);
      notify("Ate a cooked meal");
    }else if(pay({berries:2})){
      hunger=Math.min(100,hunger+15);
      notify("Ate berries");
    }else{
      notify("Gather berries or craft food");
    }
  }

  if(/^Digit[1-5]$/.test(e.code)){
    const index=Number(e.code.slice(-1))-1;
    if(party[index])selectCompanion(index);
  }
});

document.addEventListener("keyup",e=>{
  keys[e.code]=false;
});

document.addEventListener("mousemove",e=>{
  if(!active)return;

  const locked=
    document.pointerLockElement===renderer.domElement;

  if(!locked && !rightDragging)return;

  yaw-=e.movementX*.0025;
  pitch=THREE.MathUtils.clamp(
    pitch-e.movementY*.0025,
    -.85,1.05
  );
});

renderer.domElement.addEventListener("mousedown",e=>{
  if(!active)return;

  if(e.button===2){
    rightDragging=true;
  }

  if(e.button===0){
    gatherOrAttack();
  }
});

document.addEventListener("mouseup",e=>{
  if(e.button===2){
    rightDragging=false;
  }
});

document.addEventListener("contextmenu",e=>{
  e.preventDefault();
});

$("captureBtn").onclick=capture;
$("attackBtn").onclick=companionAttack;
$("bagBtn").onclick=()=>showDialog("inventory");
$("craftBtn").onclick=()=>showDialog("crafting");
$("buildBtn").onclick=()=>showDialog("building");
$("flyBtn").onclick=()=>{
  if(!active)return;
  flying=!flying;
  verticalSpeed=0;
  notify(flying?"Flying ON":"Flying OFF");
};

/* ==================================================
   SAVE SYSTEM
   ================================================== */

function saveGame(silent=false){
  try{
    localStorage.setItem(STORE,JSON.stringify({
      bag,
      party,
      selected,
      health,
      hunger,
      time,
      pos:player.position.toArray(),
      buildings
    }));

    if(!silent)notify("Game saved!");
  }catch(error){
    console.error("Save failed",error);
  }
}

$("reset").onclick=()=>{
  if(confirm("Reset the entire game?")){
    localStorage.removeItem(STORE);
    location.reload();
  }
};

window.addEventListener("beforeunload",()=>{
  saveGame(true);
});

/* ==================================================
   LIVE HUD
   ================================================== */

let hudTimer=0;
let foodTimer=0;
let fpsTimer=0;
let frameCount=0;
let saveTimer=0;

function updateHUD(){
  $("health").textContent=Math.ceil(health);
  $("hunger").textContent=Math.ceil(hunger);
  $("orbs").textContent=get("orbs");

  $("biome").textContent=biome(
    player.position.x,player.position.z
  );

  $("coordinates").textContent=
    player.position.toArray()
      .map(v=>Math.round(v)).join(", ");

  const phase=(time%120)/120;

  const period=
    phase<.25?"Morning":
    phase<.5?"Afternoon":
    phase<.75?"Evening":"Night";

  $("clock").textContent=
    `Day ${Math.floor(time/120)+1} · ${period}`;

  $("mode").textContent=flying
    ?"✈ FLYING":"EXPLORING";

  const target=aimedCreature();

  $("target").textContent=target
    ?`${target.name} · ${target.spec.element} · Q Capture`
    :"";
}

/* ==================================================
   MAIN RENDER LOOP
   ================================================== */

function animate(){
  requestAnimationFrame(animate);

  const dt=Math.min(clock.getDelta(),.04);

  fpsTimer+=dt;
  frameCount++;

  if(fpsTimer>=1){
    $("fps").textContent=
      `FPS ${Math.round(frameCount/fpsTimer)}`;
    frameCount=0;
    fpsTimer=0;
  }

  if(active){
    time+=dt;
    cooldown=Math.max(0,cooldown-dt);

    updateMovement(dt);
    updateCreatureAI(dt);

    foodTimer+=dt;
    saveTimer+=dt;

    if(foodTimer>9){
      foodTimer=0;
      hunger=Math.max(0,hunger-1);

      if(hunger===0){
        health=Math.max(0,health-2);
      }
    }

    if(health<=0){
      health=100;
      hunger=50;
      player.position.set(
        0,terrainY(0,0),0
      );
      verticalSpeed=0;
      notify("Respawned at Emerald Meadow");
    }

    if(saveTimer>45){
      saveTimer=0;
      saveGame(true);
    }
  }

  updateCamera(dt);
  updateEffects(dt);

  const daylight=.5+.5*Math.cos(time*.046);

  ambient.intensity=.8+daylight*1.4;
  sun.intensity=.3+daylight*2;

  scene.background.setRGB(
    .10+daylight*.48,
    .14+daylight*.64,
    .25+daylight*.66
  );

  hudTimer+=dt;

  if(hudTimer>.16){
    hudTimer=0;
    updateHUD();
  }

  if(toastTimer>0){
    toastTimer-=dt;
    if(toastTimer<=0){
      $("toast").textContent="";
    }
  }

  renderer.render(scene,camera);
}

camera.position.set(0,7,10);
camera.lookAt(player.position);

animate();

window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

console.log("PALFRONTIER — 3D GAME INITIALIZED");
