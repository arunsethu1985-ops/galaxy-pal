import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "https://esm.sh/three@0.160.0/examples/jsm/utils/SkeletonUtils.js";

const $ = (s, r = document) => r.querySelector(s);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

const SAVE_KEY = "galaxy-pals-save-v1";

const PALS = [
  {
    id: "emberfox",
    name: "Emberfox",
    element: "Fire",
    model: "assets/pals/emberfox.glb",
    scale: 1.05,
    hp: 110,
    speed: 4.2,
    rarity: 1,
    mount: "ground"
  },
  {
    id: "frostwolf",
    name: "Frostwolf",
    element: "Ice",
    model: "assets/pals/frostwolf.glb",
    scale: 1.18,
    hp: 150,
    speed: 4.8,
    rarity: 2,
    mount: "ground"
  },
  {
    id: "voltlynx",
    name: "Voltlynx",
    element: "Electric",
    model: "assets/pals/voltlynx.glb",
    scale: 1,
    hp: 125,
    speed: 5.1,
    rarity: 2,
    mount: "ground"
  },
  {
    id: "aquafin",
    name: "Aquafin",
    element: "Water",
    model: "assets/pals/aquafin.glb",
    scale: 1.25,
    hp: 165,
    speed: 3.7,
    rarity: 2,
    mount: "swim"
  },
  {
    id: "stonehorn",
    name: "Stonehorn",
    element: "Ground",
    model: "assets/pals/stonehorn.glb",
    scale: 1.4,
    hp: 230,
    speed: 3,
    rarity: 3,
    mount: "ground"
  },
  {
    id: "stormgryph",
    name: "Stormgryph",
    element: "Electric",
    model: "assets/pals/stormgryph.glb",
    scale: 1.35,
    hp: 185,
    speed: 5.6,
    rarity: 4,
    mount: "flying"
  },
  {
    id: "cinderdrake",
    name: "Cinderdrake",
    element: "Fire",
    model: "assets/pals/cinderdrake.glb",
    scale: 1.55,
    hp: 260,
    speed: 5,
    rarity: 4,
    mount: "flying"
  },
  {
    id: "glacierox",
    name: "Glacierox",
    element: "Ice",
    model: "assets/pals/glacierox.glb",
    scale: 1.5,
    hp: 300,
    speed: 3,
    rarity: 4,
    mount: "ground"
  },
  {
    id: "voidlion",
    name: "Voidlion",
    element: "Dark",
    model: "assets/pals/voidlion.glb",
    scale: 1.3,
    hp: 240,
    speed: 5.3,
    rarity: 5,
    mount: "ground"
  },
  {
    id: "bloomdeer",
    name: "Bloomdeer",
    element: "Grass",
    model: "assets/pals/bloomdeer.glb",
    scale: 1.1,
    hp: 140,
    speed: 4.5,
    rarity: 2,
    mount: "ground"
  },
  {
    id: "moonowl",
    name: "Moonowl",
    element: "Dark",
    model: "assets/pals/moonowl.glb",
    scale: 1.1,
    hp: 130,
    speed: 5,
    rarity: 3,
    mount: "flying"
  },
  {
    id: "starwyrm",
    name: "Starwyrm",
    element: "Dragon",
    model: "assets/pals/starwyrm.glb",
    scale: 2.1,
    hp: 680,
    speed: 4.5,
    rarity: 5,
    mount: "flying",
    boss: true
  }
];

const ORBS = [
  { name: "Basic Orb", bonus: 1, color: 0x52a9ff },
  { name: "Mega Orb", bonus: 1.35, color: 0x59db7a },
  { name: "Giga Orb", bonus: 1.75, color: 0xe2c84d },
  { name: "Hyper Orb", bonus: 2.2, color: 0xa76fe8 },
  { name: "Ultra Orb", bonus: 2.8, color: 0xffb44e }
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
  selectedOrb: 0,
  orbs: [20, 8, 4, 2, 1],
  party: [],
  box: []
};

function loadSave() {
  try {
    return {
      ...DEFAULT_SAVE,
      ...(JSON.parse(localStorage.getItem(SAVE_KEY)) || {})
    };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

const canvas = $("#gameCanvas");
const host = $("#gameShell");
const loading = $("#loading");

const loader = new GLTFLoader();

const state = {
  save: loadSave(),
  keys: new Set(),
  creatures: [],
  mixers: [],
  modelCache: new Map(),
  target: null,
  companion: null,
  mounted: false,
  projectiles: [],
  heldOrb: null,
  charging: false,
  chargeStart: 0,
  feed: [],
  worldTime: 8,
  lastSave: performance.now(),
  player: null,
  running: true
};

function saveGame() {
  if (!state.player) return;

  state.save.x = state.player.x;
  state.save.y = state.player.y;
  state.save.z = state.player.z;
  state.save.hp = state.player.hp;
  state.save.stamina = state.player.stamina;
  state.save.hunger = state.player.hunger;

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(state.save)
  );
}

function msg(text) {
  state.feed.unshift({
    text,
    time: performance.now()
  });

  state.feed = state.feed.slice(0, 5);
}

/* ===============================
   THREE SCENE
================================ */

const scene = new THREE.Scene();

scene.background =
  new THREE.Color(0x93cce9);

scene.fog =
  new THREE.FogExp2(
    0xa7d3df,
    0.0055
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

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
  THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

renderer.toneMapping =
  THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure =
  1.05;

const hemi =
  new THREE.HemisphereLight(
    0xeaf8ff,
    0x405537,
    1.55
  );

scene.add(hemi);

const sun =
  new THREE.DirectionalLight(
    0xffefd1,
    2.2
  );

sun.position.set(
  45,
  70,
  30
);

sun.castShadow = true;

sun.shadow.mapSize.set(
  2048,
  2048
);

sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;

scene.add(sun);

const world =
  new THREE.Group();

scene.add(world);

/* ===============================
   WORLD
================================ */

const ground =
  new THREE.Mesh(
    new THREE.PlaneGeometry(
      360,
      360
    ),
    new THREE.MeshStandardMaterial({
      color: 0x59854b,
      roughness: 0.96
    })
  );

ground.rotation.x =
  -Math.PI / 2;

ground.receiveShadow = true;

world.add(ground);

const water =
  new THREE.Mesh(
    new THREE.CircleGeometry(
      27,
      64
    ),
    new THREE.MeshPhysicalMaterial({
      color: 0x4e9bc9,
      transparent: true,
      opacity: 0.72,
      roughness: 0.12,
      clearcoat: 0.7
    })
  );

water.rotation.x =
  -Math.PI / 2;

water.position.set(
  55,
  0.04,
  -45
);

world.add(water);

function addTree(x, z, scale = 1) {

  const tree =
    new THREE.Group();

  const trunk =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.28 * scale,
        0.48 * scale,
        4.2 * scale,
        10
      ),
      new THREE.MeshStandardMaterial({
        color: 0x69472f,
        roughness: 1
      })
    );

  trunk.position.y =
    2.1 * scale;

  trunk.castShadow = true;

  tree.add(trunk);

  for (let i = 0; i < 3; i++) {

    const crown =
      new THREE.Mesh(
        new THREE.IcosahedronGeometry(
          (1.25 + i * 0.12) * scale,
          1
        ),
        new THREE.MeshStandardMaterial({
          color: pick([
            0x3d753a,
            0x4c8542,
            0x5a9148
          ]),
          roughness: 0.95
        })
      );

    crown.position.set(
      rand(-0.45, 0.45) * scale,
      (4.1 + i * 0.58) * scale,
      rand(-0.45, 0.45) * scale
    );

    crown.castShadow = true;

    tree.add(crown);
  }

  tree.position.set(
    x,
    0,
    z
  );

  world.add(tree);
}

function addRock(x, z, scale = 1) {

  const rock =
    new THREE.Mesh(
      new THREE.DodecahedronGeometry(
        scale
      ),
      new THREE.MeshStandardMaterial({
        color: 0x777c75,
        roughness: 0.98
      })
    );

  rock.position.set(
    x,
    scale * 0.7,
    z
  );

  rock.rotation.set(
    rand(0, 2),
    rand(0, 2),
    rand(0, 2)
  );

  rock.castShadow = true;
  rock.receiveShadow = true;

  world.add(rock);
}

for (let i = 0; i < 150; i++) {

  const x =
    rand(-170, 170);

  const z =
    rand(-170, 170);

  if (
    Math.hypot(x, z) < 16 ||
    Math.hypot(
      x - 55,
      z + 45
    ) < 32
  ) {
    continue;
  }

  if (Math.random() < 0.68) {

    addTree(
      x,
      z,
      rand(0.75, 1.35)
    );

  } else {

    addRock(
      x,
      z,
      rand(0.55, 1.8)
    );
  }
}

/* ===============================
   PLAYER
================================ */

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
        color: 0x334b6a,
        roughness: 0.75
      })
    );

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.24,
        18,
        14
      ),
      new THREE.MeshStandardMaterial({
        color: 0xd6ad8a,
        roughness: 0.8
      })
    );

  body.position.y = 1.1;
  head.position.y = 1.92;

  group.add(
    body,
    head
  );

  group.traverse(object => {

    if (object.isMesh) {

      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return group;
}

function makeMixer(entity, clips) {

  if (!clips?.length) {
    return;
  }

  entity.mixer =
    new THREE.AnimationMixer(
      entity.model
    );

  entity.clips = clips;

  entity.currentAction = null;

  state.mixers.push(
    entity.mixer
  );
}

function findClip(
  entity,
  names
) {

  if (!entity.clips?.length) {
    return null;
  }

  for (const name of names) {

    const clip =
      entity.clips.find(
        clip =>
          clip.name
            .toLowerCase()
            .includes(name)
      );

    if (clip) {
      return clip;
    }
  }

  return entity.clips[0] || null;
}

function play(
  entity,
  mode
) {

  if (!entity?.mixer) {
    return;
  }

  if (
    entity.animMode === mode
  ) {
    return;
  }

  entity.animMode = mode;

  const animations = {

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
    ],

    sleep: [
      "sleep"
    ]
  };

  const clip =
    findClip(
      entity,
      animations[mode] ||
      [mode]
    );

  if (!clip) {
    return;
  }

  const next =
    entity.mixer
      .clipAction(clip);

  if (
    entity.currentAction &&
    entity.currentAction !== next
  ) {

    entity.currentAction
      .fadeOut(0.12);
  }

  next
    .reset()
    .fadeIn(0.12)
    .play();

  entity.currentAction =
    next;
}

async function loadPlayer() {

  const player = {

    x: state.save.x,
    y: state.save.y,
    z: state.save.z,

    yaw: 0,
    pitch: -0.12,

    hp: state.save.hp,
    stamina: state.save.stamina,
    hunger: state.save.hunger,

    speed: 4.8,

    model: null,

    mixer: null,
    clips: [],
    animMode: ""
  };

  try {

    const gltf =
      await loader.loadAsync(
        "assets/player/player.glb"
      );

    player.model =
      gltf.scene;

    player.model.traverse(
      object => {

        if (object.isMesh) {

          object.castShadow = true;
          object.receiveShadow = true;
        }
      }
    );

    makeMixer(
      player,
      gltf.animations || []
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

/* ===============================
   LOAD PAL MODELS
================================ */

async function loadPalModels() {

  let loaded = 0;

  for (const def of PALS) {

    try {

      const gltf =
        await loader.loadAsync(
          def.model
        );

      gltf.scene.traverse(
        object => {

          if (object.isMesh) {

            object.castShadow = true;
            object.receiveShadow = true;

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

      state.modelCache.set(
        def.id,
        {
          scene: gltf.scene,
          clips:
            gltf.animations || []
        }
      );

      loaded++;

    } catch {

      console.warn(
        "Missing model:",
        def.model
      );
    }
  }

  return loaded;
}

/* ===============================
   SPAWN PALS
================================ */

function spawnCreature(
  def,
  x,
  z,
  level = 1
) {

  const cached =
    state.modelCache.get(
      def.id
    );

  if (!cached) {
    return null;
  }

  const model =
    cloneSkinned(
      cached.scene
    );

  model.scale.setScalar(
    def.scale *
    (
      def.boss
        ? 1.35
        : 1
    )
  );

  model.position.set(
    x,
    def.mount === "flying"
      ? (
          def.boss
            ? 7
            : 2.2
        )
      : 0,
    z
  );

  world.add(model);

  const maxHp =
    def.hp *
    (
      def.boss
        ? 2.2
        : 1
    );

  const creature = {

    def,
    model,

    x,
    z,

    level,

    hp: maxHp,
    maxHp,

    alive: true,

    boss:
      !!def.boss,

    aggressive: false,

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

    mixer: null,
    clips:
      cached.clips,

    animMode: "",
    currentAction: null
  };

  makeMixer(
    creature,
    cached.clips
  );

  play(
    creature,
    def.mount === "flying"
      ? "fly"
      : "idle"
  );

  model.traverse(
    object => {

      if (object.isMesh) {

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

function spawnWorldPals() {

  const available =
    PALS.filter(
      def =>
        state.modelCache.has(
          def.id
        )
    );

  available.forEach(
    (def, index) => {

      const angle =
        index /
        Math.max(
          1,
          available.length
        ) *
        Math.PI *
        2;

      const radius =
        def.boss
          ? 115
          : 38 +
            (
              index % 4
            ) *
            18;

      spawnCreature(
        def,

        Math.sin(angle) *
          radius +
          rand(-5, 5),

        Math.cos(angle) *
          radius +
          rand(-5, 5),

        def.boss
          ? 25
          : Math.floor(
              rand(2, 14)
            )
      );
    }
  );

  const normal =
    available.filter(
      def =>
        !def.boss
    );

  for (
    let i = 0;
    i < 18 &&
    normal.length;
    i++
  ) {

    spawnCreature(

      pick(normal),

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

/* ===============================
   CAPTURE ORBS
================================ */

function createOrb(tier) {

  const def =
    ORBS[tier];

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
          def.color,

        metalness:
          0.35,

        roughness:
          0.2,

        emissive:
          def.color,

        emissiveIntensity:
          0.18
      })
    );

  const ring =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        0.185,
        0.022,
        8,
        26
      ),

      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.55,
        roughness: 0.25
      })
    );

  ring.rotation.x =
    Math.PI / 2;

  group.add(
    shell,
    ring
  );

  group.traverse(
    object => {

      if (object.isMesh) {
        object.castShadow = true;
      }
    }
  );

  return group;
}

const raycaster =
  new THREE.Raycaster();

function findTarget() {

  raycaster
    .setFromCamera(
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

        if (object.isMesh) {

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
    hit.distance < 30

      ? hit.object
          .userData
          .creature ||
        null

      : null;
}

function captureChance(
  creature,
  tier =
    state.save.selectedOrb
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

    ORBS[tier].bonus

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
    creature.hp <= 0
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

function beginOrb() {

  if (
    state.charging ||
    state.mounted
  ) {
    return;
  }

  const tier =
    state.save.selectedOrb;

  if (
    (
      state.save.orbs[tier] ||
      0
    ) <= 0
  ) {

    msg(
      "No capture Orbs"
    );

    return;
  }

  state.charging =
    true;

  state.chargeStart =
    performance.now();

  state.heldOrb =
    createOrb(tier);

  scene.add(
    state.heldOrb
  );
}

function updateHeldOrb() {

  if (
    !state.heldOrb
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

  state.heldOrb
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

  state.heldOrb
    .rotation
    .y +=
    0.06;
}

function releaseOrb() {

  if (
    !state.charging ||
    !state.heldOrb
  ) {
    return;
  }

  const tier =
    state.save.selectedOrb;

  if (
    (
      state.save.orbs[tier] ||
      0
    ) <= 0
  ) {
    return;
  }

  state.save.orbs[tier]--;

  const charge =
    clamp(

      (
        performance.now() -
        state.chargeStart
      ) /
      900,

      0.25,

      1
    );

  const direction =
    new THREE.Vector3();

  camera.getWorldDirection(
    direction
  );

  const mesh =
    state.heldOrb;

  state.heldOrb =
    null;

  state.charging =
    false;

  state.projectiles.push({

    mesh,

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

    life: 5,

    tier,

    dead: false
  });

  msg(
    `${ORBS[tier].name} thrown`
  );
}

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

function updateProjectiles(dt) {

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

    projectile.mesh
      .position
      .addScaledVector(
        projectile.velocity,
        dt
      );

    projectile.mesh
      .rotation
      .x +=
      dt *
      8;

    projectile.mesh
      .rotation
      .z +=
      dt *
      5;

    projectile.life -= dt;

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
            ? 2.3
            : 1.4
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
      projectile.life <= 0 ||
      projectile.mesh.position.y <
      0.1
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

/* ===============================
   PARTY / SUMMON
================================ */

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

  const def =
    PALS.find(
      item =>
        item.id === id
    );

  const cached =
    def &&
    state.modelCache.get(
      def.id
    );

  if (
    !def ||
    !cached
  ) {

    msg(
      "Capture a Pal first"
    );

    return;
  }

  const model =
    cloneSkinned(
      cached.scene
    );

  model.scale.setScalar(
    def.scale
  );

  model.position.set(

    state.player.x + 2,

    def.mount === "flying"
      ? 2
      : 0,

    state.player.z + 2
  );

  world.add(model);

  const companion = {

    def,
    model,

    clips:
      cached.clips,

    mixer: null,

    currentAction: null,

    animMode: "",

    alive: true
  };

  makeMixer(
    companion,
    cached.clips
  );

  play(

    companion,

    def.mount === "flying"
      ? "fly"
      : "idle"
  );

  state.companion =
    companion;

  msg(
    `${def.name} summoned`
  );
}

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

  if (

    !state.mounted &&

    companion.model
      .position
      .distanceTo(
        state.player.model.position
      ) >
      5
  ) {

    msg(
      "Move closer to your Pal"
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

function updateCompanion(
  dt,
  forward,
  right,
  sprint
) {

  const companion =
    state.companion;

  if (!companion) {
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

      speed

      *

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

      speed

      *

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
    distance > 1.5
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

  if (
    companion.def.mount ===
    "flying"
  ) {

    companion.model.position.y =

      1.8 +

      Math.sin(
        performance.now() *
        0.002
      ) *
      0.25;
  }
}

/* ===============================
   WILD PAL AI
================================ */

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
      distance < 28
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
              creature.x
            ) *
            0.4;
    }
  }
}

/* ===============================
   HUD
================================ */

function updateHUD() {

  const setBar =
    (selector, value) => {

      const element =
        $(selector);

      if (element) {

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

  $("#hpText").textContent =
    Math.round(
      state.player.hp
    );

  $("#staminaText").textContent =
    Math.round(
      state.player.stamina
    );

  $("#foodText").textContent =
    Math.round(
      state.player.hunger
    );

  $("#levelText").textContent =
    `LV ${state.save.level}`;

  const target =
    state.target;

  const card =
    $("#targetCard");

  if (
    target?.alive
  ) {

    card.hidden =
      false;

    $("#targetName").textContent =
      target.def.name +
      (
        target.boss
          ? " • BOSS"
          : ""
      );

    $("#targetMeta").textContent =
      `LV ${target.level} • ${target.def.element}`;

    $("#captureChance").textContent =
      `${Math.round(
        captureChance(target) *
        100
      )}%`;

    $("#targetHpBar").style.width =
      `${100 *
      target.hp /
      target.maxHp}%`;

  } else {

    card.hidden =
      true;
  }

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

  $("#orbHud").innerHTML =

    ORBS.map(
      (orb, index) => `

        <div
          class="orb-slot ${
            index ===
            state.save.selectedOrb
              ? "active"
              : ""
          }"
        >

          <strong>
            ${index + 1}
          </strong>

          <span>
            ${orb.name}
          </span>

          <small>
            x${
              state.save.orbs[index] ||
              0
            }
          </small>

        </div>
      `
    ).join("");

  $("#partyHud").innerHTML =

    state.save.party

      .slice(
        0,
        5
      )

      .map(
        id => {

          const def =
            PALS.find(
              item =>
                item.id === id
            );

          if (!def) {
            return "";
          }

          return `

            <div class="party-card">

              <strong>
                ${def.name}
              </strong>

              <span>
                ${def.element}
                •
                ${
                  def.mount ||
                  "companion"
                }
              </span>

            </div>
          `;
        }
      )

      .join("");
}

/* ===============================
   RESIZE
================================ */

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

/* ===============================
   CONTROLS
================================ */

canvas.addEventListener(
  "click",
  () =>
    canvas
      .requestPointerLock?.()
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

      state.save.selectedOrb =
        Number(
          event.code.slice(-1)
        ) -
        1;
    }

    if (
      event.code ===
      "KeyQ" &&
      !event.repeat
    ) {

      beginOrb();
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

      releaseOrb();
    }
  }
);

document.addEventListener(
  "mousedown",
  event => {

    if (

      event.button === 0 &&

      document.pointerLockElement ===
      canvas
    ) {

      attackTarget();
    }
  }
);

/* ===============================
   MENU
================================ */

const menu =
  $("#menuPanel");

$("#menuButton")
  .addEventListener(
    "click",
    () => {

      menu.hidden =
        !menu.hidden;
    }
  );

$("#resumeButton")
  .addEventListener(
    "click",
    () => {

      menu.hidden =
        true;

      canvas
        .requestPointerLock?.();
    }
  );

$("#resetButton")
  .addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        SAVE_KEY
      );

      location.reload();
    }
  );

/* ===============================
   START GAME
================================ */

await loadPlayer();

const loaded =
  await loadPalModels();

if (!loaded) {

  loading.innerHTML = `

    <div class="loading-card">

      <div class="logo-mark">
        ✦
      </div>

      <h1>
        3D PAL MODELS MISSING
      </h1>

      <p>
        Add .glb files inside
        <b>assets/pals/</b>
        and reload.
      </p>

    </div>
  `;

} else {

  spawnWorldPals();

  loading.remove();

  msg(
    `Loaded ${loaded} original 3D Pal model${loaded === 1 ? "" : "s"}`
  );
}

/* ===============================
   MAIN LOOP
================================ */

let last =
  performance.now();

function loop(now) {

  if (
    !state.running
  ) {
    return;
  }

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

    player.y = 0;

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

  updateHeldOrb();

  state.mixers.forEach(
    mixer =>
      mixer.update(dt)
  );

  const cameraDistance =
    state.mounted
      ? 9.5
      : 6.7;

  const cameraTargetY =

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
    cameraDistance,

    player.y +
    3.4 +
    player.pitch *
    3.2,

    player.z +

    Math.cos(
      player.yaw
    ) *
    cameraDistance
  );

  camera.lookAt(
    player.x,
    cameraTargetY,
    player.z
  );

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
          ) *
          60
        )
      )
      .padStart(
        2,
        "0"
      )
    }`;

  updateHUD();

  renderer.render(
    scene,
    camera
  );

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
