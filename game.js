import * as THREE from "https://esm.sh/three@0.180.0";

/* ===================================================
   GALAXY PALFRONTIER — CREATURE WORLD
   ORIGINAL OPEN-WORLD BROWSER GAME
   =================================================== */

const $ = id => document.getElementById(id);
const SAVE_KEY = "galaxy-palfrontier-world-v1";
const WORLD = 115;
const keys = {};

let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
} catch {
  saved = {};
}

const inventory = {
  wood: 14,
  stone: 10,
  crystal: 4,
  berries: 8,
  fiber: 6,
  orbs: 8,
  ...(saved.inventory || {})
};

let health = saved.health ?? 100;
let food = saved.food ?? 100;
let flying = false;
let playing = false;
let currentPanel = "";
let cameraMode = 0;
let selectedCompanion = 0;
let worldTime = saved.worldTime ?? 0;
let messageTime = 0;
let actionCooldown = 0;

/* ===================================================
   THREE.JS SCENE
   =================================================== */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91d9fa);
scene.fog = new THREE.Fog(0x91d9fa, 70, 170);

const camera = new THREE.PerspectiveCamera(
  72,
  innerWidth / innerHeight,
  .05,
  400
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

const light = new THREE.HemisphereLight(
  0xffffff,
  0x65815e,
  2
);

scene.add(light);

const sunlight = new THREE.DirectionalLight(
  0xffefd1,
  2.3
);

sunlight.position.set(50, 90, 30);
scene.add(sunlight);

/* ===================================================
   MATERIALS AND SHAPES
   =================================================== */

const materialCache = new Map();

function material(color, emissive = false) {
  const key = `${color}-${emissive}`;

  if (!materialCache.has(key)) {
    materialCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: .77,
        metalness: .04,
        emissive: emissive ? color : 0x000000,
        emissiveIntensity: emissive ? .4 : 0
      })
    );
  }

  return materialCache.get(key);
}

const geometries = {
  cube: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 12, 9),
  lowSphere: new THREE.IcosahedronGeometry(1, 1),
  cone: new THREE.ConeGeometry(1, 1, 7),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 8)
};

function shape(
  parent,
  kind,
  color,
  x, y, z,
  sx = 1, sy = 1, sz = 1,
  glowing = false
) {
  const mesh = new THREE.Mesh(
    geometries[kind],
    material(color, glowing)
  );

  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);

  parent.add(mesh);
  return mesh;
}

function seeded(x, z, seed = 0) {
  let v = Math.sin(
    x * 127.17 + z * 311.71 + seed * 79.31
  ) * 43758.5453;

  return v - Math.floor(v);
}

function terrainHeight(x, z) {
  return (
    Math.sin(x * .043) * 3.4 +
    Math.cos(z * .038) * 2.8 +
    Math.sin((x + z) * .071) * 1.5 +
    Math.sin(x * .015 + z * .018) * 4 +
    2
  );
}

function notify(text) {
  $("notice").textContent = text;
  messageTime = 3;
}

function add(item, amount = 1) {
  inventory[item] = (inventory[item] || 0) + amount;
}

function use(item, amount = 1) {
  if ((inventory[item] || 0) < amount) return false;

  inventory[item] -= amount;
  return true;
}

/* ===================================================
   GROUND AND BIOMES
   =================================================== */

const terrainGeometry = new THREE.PlaneGeometry(
  WORLD * 2,
  WORLD * 2,
  110,
  110
);

terrainGeometry.rotateX(-Math.PI / 2);

const vertices = terrainGeometry.attributes.position;
const vertexColors = [];

const grassGreen = new THREE.Color(0x6dae64);
const forestGreen = new THREE.Color(0x438b68);
const blossomGreen = new THREE.Color(0x89c77f);
const dryGreen = new THREE.Color(0x9bac6e);

function region(x, z) {
  if (x > 30 && z < -25) return "Blossom Highlands";
  if (x < -30 && z > 10) return "Mystic Forest";
  if (x > 35 && z > 25) return "Sunlit Savanna";
  return "Emerald Meadow";
}

for (let i = 0; i < vertices.count; i++) {
  const x = vertices.getX(i);
  const z = vertices.getZ(i);
  const h = terrainHeight(x, z);

  vertices.setY(i, h);

  const area = region(x, z);

  const base =
    area === "Mystic Forest" ? forestGreen :
    area === "Blossom Highlands" ? blossomGreen :
    area === "Sunlit Savanna" ? dryGreen :
    grassGreen;

  const variation = .88 + seeded(x, z, 8) * .22;
  const c = base.clone().multiplyScalar(variation);

  vertexColors.push(c.r, c.g, c.b);
}

terrainGeometry.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(vertexColors, 3)
);

terrainGeometry.computeVertexNormals();

const terrain = new THREE.Mesh(
  terrainGeometry,
  new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1
  })
);

scene.add(terrain);

/* ===================================================
   WORLD DECORATIONS AND RESOURCES
   =================================================== */

const resources = [];
const decorations = [];
const buildings = [];

function addResource(group, type, amount, x, z) {
  group.userData.kind = "resource";
  group.userData.type = type;
  group.userData.amount = amount;
  group.userData.radius = 2.5;

  resources.push(group);
  decorations.push(group);

  group.position.set(
    x,
    terrainHeight(x, z),
    z
  );

  scene.add(group);
}

function tree(x, z, species = "oak") {
  const g = new THREE.Group();
  const trunk = material(0x806344);

  const pink = species === "cherry";
  const giant = species === "giant";

  const height = giant ? 9 : 4.3 + seeded(x,z,4)*2;
  const radius = giant ? 4.5 : pink ? 3.1 : 2.5;

  const bark = shape(
    g, "cylinder",
    giant ? 0x615244 : 0x816149,
    0, height/2, 0,
    giant ? .65 : .35,
    height,
    giant ? .65 : .35
  );

  bark.material = trunk;

  const leaves =
    pink ? [0xf7a5c5,0xffc2d8,0xe98bac] :
    giant ? [0x2d806a,0x38977c,0x4da18b] :
    [0x438e51,0x55a85e,0x70b76b];

  for (let i = 0; i < (giant ? 10 : 5); i++) {
    const a = i * 2.399;
    const r = i === 0 ? 0 : radius * .45;

    shape(
      g, "lowSphere",
      leaves[i % leaves.length],
      Math.cos(a)*r,
      height + Math.sin(i*2)*.8,
      Math.sin(a)*r,
      radius * .67,
      radius * .52,
      radius * .67
    );
  }

  addResource(g, "wood", giant ? 6 : 3, x, z);
}

function rock(x,z,crystal=false) {
  const g = new THREE.Group();

  if (crystal) {
    for (let i=0;i<4;i++) {
      const a=i*Math.PI/2;

      const spike=shape(
        g,"cone",
        i%2 ? 0x70e5ed : 0x9b8cff,
        Math.cos(a)*.65,
        1.1,
        Math.sin(a)*.65,
        .65,
        2.1+seeded(x,z,i)*1.3,
        .65,
        true
      );

      spike.rotation.z = Math.cos(a)*.14;
    }
  } else {
    shape(g,"lowSphere",0x879296,0,.65,0,1.3,.85,1.1);
    shape(g,"lowSphere",0xb2b6aa,.8,.45,.5,.65,.5,.6);
  }

  addResource(g,crystal?"crystal":"stone",crystal?2:3,x,z);
}

function berryBush(x,z) {
  const g = new THREE.Group();

  shape(g,"lowSphere",0x347b46,0,.6,0,1,.8,1);

  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    shape(
      g,"sphere",0xe85a75,
      Math.cos(a)*.65,
      .7+Math.sin(i*2)*.2,
      Math.sin(a)*.65,
      .13,.13,.13
    );
  }

  addResource(g,"berries",3,x,z);
}

function flower(x,z) {
  const g = new THREE.Group();
  const color =
    seeded(x,z,4)>.5 ? 0xffd16b : 0xb8a3fa;

  shape(g,"cylinder",0x397d41,0,.28,0,.035,.55,.035);

  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;

    shape(
      g,"sphere",color,
      Math.cos(a)*.16,.6,Math.sin(a)*.16,
      .15,.1,.15
    );
  }

  shape(g,"sphere",0xffed8e,0,.6,0,.12,.12,.12);

  g.position.set(x,terrainHeight(x,z),z);
  scene.add(g);
  decorations.push(g);
}

for(let i=0;i<155;i++){
  const x=(seeded(i,2,4)-.5)*WORLD*1.9;
  const z=(seeded(i,9,7)-.5)*WORLD*1.9;

  if(Math.hypot(x,z)<13)continue;

  const value=seeded(i,14,8);
  const area=region(x,z);

  if(value<.48){
    tree(
      x,z,
      area==="Blossom Highlands"?"cherry":
      area==="Mystic Forest"&&value<.16?"giant":"oak"
    );
  }else if(value<.72){
    rock(x,z,value>.65);
  }else if(value<.83){
    berryBush(x,z);
  }else{
    flower(x,z);
  }
}

/* ===================================================
   ORIGINAL FANTASY CREATURES
   =================================================== */

const CREATURES = {
  Florabun: {
    color:0x9edb81,
    belly:0xd5f5ad,
    ears:0x74b86a,
    element:"Nature",
    emoji:"🌿",
    scale:.85,
    speed:2.2
  },
  Emberfox: {
    color:0xe98755,
    belly:0xffd69b,
    ears:0x9c4d48,
    element:"Fire",
    emoji:"🔥",
    scale:.9,
    speed:3
  },
  Aquabbit: {
    color:0x75badb,
    belly:0xc8edff,
    ears:0x4d9fc6,
    element:"Water",
    emoji:"💧",
    scale:.85,
    speed:2.5
  },
  Cloudhorn: {
    color:0xe5d4fb,
    belly:0xffffff,
    ears:0xbaa4ee,
    element:"Mystic",
    emoji:"✨",
    scale:1.1,
    speed:2
  },
  Voltkit: {
    color:0xf2d269,
    belly:0xffe9ac,
    ears:0xb48e40,
    element:"Electric",
    emoji:"⚡",
    scale:.8,
    speed:3.4
  }
};

const wild = [];
const party = Array.isArray(saved.party)
  ? saved.party.filter(n=>CREATURES[n]).slice(0,5)
  : [];

let follower = null;

function makeCreature(name,x,z,captured=false){
  const config=CREATURES[name];
  const group=new THREE.Group();
  const visual=new THREE.Group();

  group.add(visual);

  const s=config.scale;
  visual.scale.setScalar(s);

  shape(
    visual,"sphere",config.color,
    0,1.15,0, .85,.78,.72
  );

  shape(
    visual,"sphere",config.belly,
    0,.99,-.49, .53,.49,.29
  );

  shape(
    visual,"sphere",config.color,
    0,1.9,-.25, .7,.68,.62
  );

  for(const side of [-1,1]){
    const ear=shape(
      visual,"cone",config.ears,
      side*.43,2.58,-.22,
      .25,.65,.23
    );

    ear.rotation.z=side*-.22;

    shape(
      visual,"sphere",0xffffff,
      side*.27,2.0,-.78,
      .18,.23,.09
    );

    shape(
      visual,"sphere",0x243b52,
      side*.27,2.0,-.86,
      .09,.14,.05
    );

    shape(
      visual,"sphere",config.color,
      side*.45,.48,-.39,
      .27,.36,.31
    );

    shape(
      visual,"sphere",config.color,
      side*.45,.48,.43,
      .27,.36,.31
    );
  }

  shape(
    visual,"sphere",0xf49eaa,
    0,1.72,-.84,
    .15,.10,.07
  );

  shape(
    visual,"sphere",config.color,
    0,1.15,.72,
    .36,.42,.55
  );

  if(name==="Cloudhorn"){
    shape(
      visual,"cone",0xe4eeff,
      0,2.77,-.35,
      .16,.8,.16
    );
  }

  if(name==="Emberfox"){
    shape(
      visual,"cone",0xffc35f,
      0,1.25,1.08,
      .28,.8,.28,
      true
    );
  }

  if(name==="Voltkit"){
    const tail=shape(
      visual,"cube",0xf3c64a,
      0,1.2,1.0,
      .3,.3,1.1
    );
    tail.rotation.x=.38;
  }

  group.position.set(x,terrainHeight(x,z),z);
  scene.add(group);

  const creature={
    name,
    config,
    group,
    visual,
    captured,
    hp:100,
    timer:0,
    angle:Math.random()*Math.PI*2,
    originX:x,
    originZ:z,
    phase:Math.random()*10
  };

  if(!captured)wild.push(creature);

  group.userData.creature=creature;
  return creature;
}

const types=Object.keys(CREATURES);

for(let i=0;i<25;i++){
  const angle=seeded(i,1,12)*Math.PI*2;
  const distance=14+seeded(i,3,9)*87;
  const x=Math.cos(angle)*distance;
  const z=Math.sin(angle)*distance;

  const name=types[Math.floor(seeded(i,8,4)*types.length)];
  makeCreature(name,x,z);
}

function spawnFollower(){
  if(follower){
    scene.remove(follower.group);
    follower=null;
  }

  const name=party[selectedCompanion];
  if(!name)return;

  follower=makeCreature(
    name,
    player.position.x+2,
    player.position.z+2,
    true
  );

  $("companionName").textContent=name;
  $("companionHint").textContent=
    `${CREATURES[name].element} companion • Press E to command`;
}

function updateWild(dt){
  for(const c of wild){
    c.timer-=dt;

    if(c.timer<=0){
      c.timer=2+Math.random()*4;
      c.angle+=(Math.random()-.5)*2.4;
    }

    const dx=Math.sin(c.angle)*c.config.speed*dt*.45;
    const dz=Math.cos(c.angle)*c.config.speed*dt*.45;

    const nx=c.group.position.x+dx;
    const nz=c.group.position.z+dz;

    if(
      Math.hypot(
        nx-c.originX,
        nz-c.originZ
      )<9 &&
      Math.abs(nx)<WORLD-4 &&
      Math.abs(nz)<WORLD-4
    ){
      c.group.position.x=nx;
      c.group.position.z=nz;
    }else{
      c.angle+=Math.PI;
    }

    c.group.position.y=terrainHeight(
      c.group.position.x,
      c.group.position.z
    );

    c.group.rotation.y=c.angle;
    c.visual.position.y=
      Math.sin(worldTime*3+c.phase)*.08;
  }
}

function updateFollower(dt){
  if(!follower)return;

  const p=follower.group.position;
  const dx=player.position.x-p.x;
  const dz=player.position.z-p.z;
  const distance=Math.hypot(dx,dz);

  if(distance>35){
    p.x=player.position.x+2;
    p.z=player.position.z+2;
  }else if(distance>3){
    const step=Math.min(
      distance-3,
      follower.config.speed*2*dt
    );

    p.x+=dx/distance*step;
    p.z+=dz/distance*step;

    follower.group.rotation.y=Math.atan2(-dx,-dz);
  }

  p.y=terrainHeight(p.x,p.z);
  follower.visual.position.y=
    Math.sin(worldTime*5)*.1;
}

/* ===================================================
   PLAYER CHARACTER
   =================================================== */

const player=new THREE.Group();
const playerVisual=new THREE.Group();

player.add(playerVisual);

shape(
  playerVisual,"cube",0x386f9e,
  0,1.25,0,
  .85,1.05,.46
);

shape(
  playerVisual,"sphere",0xe5b68c,
  0,2.12,0,
  .45,.49,.42
);

shape(
  playerVisual,"sphere",0x49382b,
  0,2.43,.03,
  .48,.23,.46
);

for(const side of [-1,1]){
  shape(
    playerVisual,"cube",0x31648d,
    side*.59,1.26,0,
    .26,.85,.3
  );

  shape(
    playerVisual,"cube",0x394f77,
    side*.22,.45,0,
    .32,.9,.37
  );

  shape(
    playerVisual,"sphere",0xffffff,
    side*.18,2.16,-.4,
    .085,.09,.05
  );

  shape(
    playerVisual,"sphere",0x223743,
    side*.18,2.16,-.45,
    .04,.06,.025
  );
}

player.position.set(
  saved.position?.[0] ?? 0,
  saved.position?.[1] ?? terrainHeight(0,0),
  saved.position?.[2] ?? 0
);

scene.add(player);

let yaw=0;
let pitch=.15;
let verticalVelocity=0;
let grounded=false;

/* ===================================================
   CAMERA AND PLAYER MOVEMENT
   =================================================== */

function viewDirection(){
  return new THREE.Vector3(
    -Math.sin(yaw)*Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw)*Math.cos(pitch)
  );
}

function movementDirection(){
  const forwardX=-Math.sin(yaw);
  const forwardZ=-Math.cos(yaw);
  const rightX=Math.cos(yaw);
  const rightZ=-Math.sin(yaw);

  let x=0,z=0;

  if(keys.KeyW){x+=forwardX;z+=forwardZ;}
  if(keys.KeyS){x-=forwardX;z-=forwardZ;}
  if(keys.KeyD){x+=rightX;z+=rightZ;}
  if(keys.KeyA){x-=rightX;z-=rightZ;}

  const length=Math.hypot(x,z);
  return length?{x:x/length,z:z/length,moving:true}:
    {x:0,z:0,moving:false};
}

function updateMovement(dt){
  const input=movementDirection();
  const sprint=keys.ShiftLeft||keys.ShiftRight;
  const speed=flying?12:sprint?10:6.5;

  player.position.x+=input.x*speed*dt;
  player.position.z+=input.z*speed*dt;

  player.position.x=THREE.MathUtils.clamp(
    player.position.x,-WORLD+3,WORLD-3
  );
  player.position.z=THREE.MathUtils.clamp(
    player.position.z,-WORLD+3,WORLD-3
  );

  const ground=terrainHeight(
    player.position.x,
    player.position.z
  );

  if(flying){
    let movement=0;
    if(keys.Space)movement+=1;
    if(keys.KeyX)movement-=1;

    player.position.y+=movement*speed*dt;
    verticalVelocity=0;
  }else{
    verticalVelocity-=22*dt;

    if(keys.Space&&grounded){
      verticalVelocity=9.5;
      grounded=false;
    }

    player.position.y+=verticalVelocity*dt;

    if(player.position.y<=ground){
      player.position.y=ground;
      verticalVelocity=0;
      grounded=true;
    }
  }

  if(input.moving){
    player.rotation.y=Math.atan2(-input.x,-input.z);
  }

  if(!flying){
    playerVisual.position.y=input.moving
      ?Math.abs(Math.sin(worldTime*11))*.06
      :0;
  }
}

function updateCamera(){
  const focus=player.position.clone();
  focus.y+=1.65;

  const forward=viewDirection();

  if(cameraMode===1){
    camera.position.copy(focus);
    camera.rotation.set(pitch,yaw,0,"YXZ");
    playerVisual.visible=false;
  }else{
    playerVisual.visible=true;

    camera.position.copy(
      focus.clone().addScaledVector(forward,-6)
    );

    camera.position.y+=1.15;
    camera.lookAt(focus.clone().addScaledVector(forward,9));
  }
}

/* ===================================================
   CAPTURE ORBS AND TARGETING
   =================================================== */

const raycaster=new THREE.Raycaster();
const screenCenter=new THREE.Vector2(0,0);

function targetCreature(){
  raycaster.setFromCamera(screenCenter,camera);
  raycaster.far=35;

  const hits=raycaster.intersectObjects(
    wild.map(c=>c.group),
    true
  );

  if(!hits.length)return null;

  let obj=hits[0].object;

  while(obj&&!obj.userData.creature){
    obj=obj.parent;
  }

  return obj?.userData.creature||null;
}

function nearbyCreature(){
  const target=targetCreature();
  if(target)return target;

  let closest=null;
  let best=14;

  for(const c of wild){
    const distance=c.group.position.distanceTo(player.position);

    if(distance<best){
      best=distance;
      closest=c;
    }
  }

  return closest;
}

const projectiles=[];

function orbEffect(end,success){
  const start=player.position.clone();
  start.y+=1.9;

  const orb=new THREE.Mesh(
    geometries.sphere,
    material(success?0x68eeca:0x9a8df2,true)
  );

  orb.scale.setScalar(.25);
  scene.add(orb);

  projectiles.push({
    object:orb,
    start,
    end:end.clone(),
    time:0,
    duration:.55
  });
}

function capture(){
  if(actionCooldown>0)return;

  const c=nearbyCreature();

  if(!c){
    notify("Find a creature to capture");
    return;
  }

  const distance=player.position.distanceTo(c.group.position);

  if(distance>21){
    notify("Get closer to the creature!");
    return;
  }

  if(!use("orbs")){
    notify("No Capture Orbs — craft more");
    return;
  }

  actionCooldown=.7;

  const success=Math.random()<(
    distance<7?.92:
    distance<13?.78:.58
  );

  const endpoint=c.group.position.clone();
  endpoint.y+=1.5;

  orbEffect(endpoint,success);

  if(success){
    if(party.length>=5){
      add("orbs");
      notify("Party full! Maximum 5 companions");
      return;
    }

    party.push(c.name);
    selectedCompanion=party.length-1;

    scene.remove(c.group);
    wild.splice(wild.indexOf(c),1);

    spawnFollower();
    notify(`Captured ${c.name}! New companion joined.`);
  }else{
    notify(`${c.name} escaped! Try another orb.`);
  }

  updatePartyBar();
}

function updateProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    p.time+=dt;

    const t=Math.min(1,p.time/p.duration);

    p.object.position.lerpVectors(p.start,p.end,t);
    p.object.position.y+=Math.sin(t*Math.PI)*2.5;

    p.object.rotation.y+=dt*8;

    if(t>=1){
      scene.remove(p.object);
      projectiles.splice(i,1);
    }
  }
}

/* ===================================================
   GATHERING
   =================================================== */

function gather(){
  const creature=targetCreature();

  if(creature){
    capture();
    return;
  }

  let closest=null;
  let best=6;

  for(const r of resources){
    const distance=player.position.distanceTo(r.position);

    if(distance<best){
      best=distance;
      closest=r;
    }
  }

  if(!closest){
    notify("Move closer to trees, rocks or berry bushes");
    return;
  }

  const item=closest.userData.type;
  const count=closest.userData.amount;

  add(item,count);

  notify(`Collected ${count} ${item}`);

  scene.remove(closest);

  resources.splice(resources.indexOf(closest),1);
  decorations.splice(decorations.indexOf(closest),1);
}

/* ===================================================
   COMPANION COMMANDS
   =================================================== */

function commandCompanion(){
  if(!follower){
    notify("Capture a creature first!");
    return;
  }

  const target=nearbyCreature();

  if(!target){
    notify(`${follower.name} is following you`);
    return;
  }

  target.hp-=35;

  const attack=shape(
    scene,"sphere",
    follower.config.color,
    target.group.position.x,
    target.group.position.y+1.5,
    target.group.position.z,
    .65,.65,.65,
    true
  );

  setTimeout(()=>{
    scene.remove(attack);
  },250);

  if(target.hp<=0){
    add("crystal",2);
    scene.remove(target.group);
    wild.splice(wild.indexOf(target),1);

    notify(
      `${follower.name} defeated ${target.name}! +2 crystals`
    );
  }else{
    notify(`${follower.name} used an elemental attack!`);
  }
}

/* ===================================================
   BUILDING
   =================================================== */

function buildStructure(type){
  let cost;
  let title;

  if(type==="camp"){
    cost={wood:8,stone:5};
    title="Camp House";
  }else if(type==="workbench"){
    cost={wood:5,stone:3};
    title="Workbench";
  }else{
    cost={wood:4,fiber:3};
    title="Creature Shelter";
  }

  for(const [item,count] of Object.entries(cost)){
    if((inventory[item]||0)<count){
      notify(`Need more ${item}`);
      return;
    }
  }

  for(const [item,count] of Object.entries(cost)){
    use(item,count);
  }

  const ahead=viewDirection();
  const x=player.position.x+ahead.x*7;
  const z=player.position.z+ahead.z*7;

  const g=new THREE.Group();

  if(type==="camp"){
    shape(g,"cube",0xb5a282,0,1.6,0,5,3.2,4);
    const roof=shape(
      g,"cone",0x84614e,
      0,4,0,
      3.8,2.6,3.8
    );
    roof.rotation.y=Math.PI/4;

    shape(g,"cube",0x654637,0,.9,-2.05,1.2,1.8,.12);
    shape(g,"cube",0x86d5e0,-1.3,2,-2.08,1,.9,.12);
  }else if(type==="workbench"){
    shape(g,"cube",0x876044,0,1.2,0,2,.25,1);
    for(const dx of [-.75,.75]){
      shape(g,"cube",0x5c4032,dx,.58,0,.2,1.1,.2);
    }
  }else{
    shape(g,"cube",0x896b52,0,.15,0,4,.3,4);

    for(const dx of [-1.7,1.7]){
      for(const dz of [-1.7,1.7]){
        shape(g,"cube",0x7d604a,dx,1.35,dz,.17,2.4,.17);
      }
    }

    const roof=shape(g,"cone",0x59a486,0,3,0,3.2,1.4,3.2);
    roof.rotation.y=Math.PI/4;
  }

  g.position.set(x,terrainHeight(x,z),z);
  scene.add(g);

  buildings.push({type,x,z,group:g});

  notify(`${title} built!`);
  closePanel();
}

/* ===================================================
   PANEL UI
   =================================================== */

function row(title,detail,buttons=[]){
  const el=document.createElement("div");
  el.className="entry";

  const info=document.createElement("div");
  info.className="info";

  const strong=document.createElement("strong");
  strong.textContent=title;

  const small=document.createElement("small");
  small.textContent=detail;

  info.append(strong,small);
  el.append(info);

  for(const [label,callback] of buttons){
    const button=document.createElement("button");
    button.textContent=label;
    button.onclick=callback;
    el.append(button);
  }

  $("entries").append(el);
}

function openPanel(type){
  currentPanel=type;
  $("panel").hidden=false;
  $("menu").hidden=true;

  if(document.pointerLockElement){
    document.exitPointerLock();
  }

  renderPanel();
}

function closePanel(){
  currentPanel="";
  $("panel").hidden=true;

  renderer.domElement.requestPointerLock().catch(()=>{
    $("menu").hidden=false;
  });
}

$("closePanel").onclick=closePanel;

function renderPanel(){
  $("entries").replaceChildren();

  $("panelTitle").textContent={
    inventory:"🎒 INVENTORY",
    crafting:"🔨 CRAFTING",
    building:"🏠 BASE BUILDING",
    companions:"🐾 CREATURE PARTY"
  }[currentPanel];

  $("panelHelp").textContent=
    "Collect resources to craft, build and explore.";

  if(currentPanel==="inventory"){
    for(const [item,count] of Object.entries(inventory)){
      row(
        item.toUpperCase(),
        `Available: ${count}`,
        []
      );
    }
  }

  if(currentPanel==="crafting"){
    row(
      "🔮 Capture Orbs ×3",
      "Requires 2 stone and 2 crystals",
      [[
        "CRAFT",
        ()=>{
          if(
            inventory.stone>=2 &&
            inventory.crystal>=2
          ){
            use("stone",2);
            use("crystal",2);
            add("orbs",3);
            notify("Crafted 3 Capture Orbs");
            renderPanel();
          }else{
            notify("Not enough resources");
          }
        }
      ]]
    );

    row(
      "🍗 Cooked Food ×2",
      "Requires 3 berries and 1 wood",
      [[
        "CRAFT",
        ()=>{
          if(
            inventory.berries>=3 &&
            inventory.wood>=1
          ){
            use("berries",3);
            use("wood");
            add("cooked",2);
            notify("Cooked 2 meals");
            renderPanel();
          }else{
            notify("Not enough ingredients");
          }
        }
      ]]
    );
  }

  if(currentPanel==="building"){
    row(
      "🏠 Camp House",
      "8 wood + 5 stone",
      [["BUILD",()=>buildStructure("camp")]]
    );

    row(
      "🪚 Workbench",
      "5 wood + 3 stone",
      [["BUILD",()=>buildStructure("workbench")]]
    );

    row(
      "🐾 Creature Shelter",
      "4 wood + 3 fiber",
      [["BUILD",()=>buildStructure("shelter")]]
    );
  }

  if(currentPanel==="companions"){
    party.forEach((name,i)=>{
      row(
        `${CREATURES[name].emoji} ${name}`,
        `${CREATURES[name].element} creature`,
        [[
          "FOLLOW",
          ()=>{
            selectedCompanion=i;
            spawnFollower();
            updatePartyBar();
            closePanel();
          }
        ]]
      );
    });
  }
}

/* ===================================================
   PARTY BAR
   =================================================== */

function updatePartyBar(){
  const bar=$("partyBar");
  bar.replaceChildren();

  for(let i=0;i<5;i++){
    const slot=document.createElement("div");
    slot.className="partySlot";

    if(i===selectedCompanion && party[i]){
      slot.classList.add("active");
    }

    slot.textContent=party[i]
      ?CREATURES[party[i]].emoji
      :"＋";

    const n=document.createElement("small");
    n.textContent=i+1;
    slot.append(n);

    bar.append(slot);
  }
}

updatePartyBar();

if(party.length){
  spawnFollower();
}

/* ===================================================
   SAVE AND RESTORE
   =================================================== */

function saveGame(){
  try{
    localStorage.setItem(SAVE_KEY,JSON.stringify({
      inventory,
      party,
      position:[
        player.position.x,
        player.position.y,
        player.position.z
      ],
      health,
      food,
      worldTime,
      buildings:buildings.map(b=>({
        type:b.type,
        x:b.x,
        z:b.z
      }))
    }));

    notify("World saved!");
  }catch{
    notify("Unable to save world");
  }
}

$("reset").onclick=()=>{
  if(confirm("Delete your Palfrontier world?")){
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
};

window.addEventListener("beforeunload",()=>{
  try{
    localStorage.setItem(SAVE_KEY,JSON.stringify({
      inventory,
      party,
      position:[
        player.position.x,
        player.position.y,
        player.position.z
      ],
      health,
      food,
      worldTime
    }));
  }catch{}
});

/* ===================================================
   FLYING
   =================================================== */

function setFly(){
  flying=!flying;
  verticalVelocity=0;

  $("flyBtn").textContent=flying
    ?"✈ FLY OFF"
    :"✈ FLY ON";

  $("flyBtn").classList.toggle("enabled",flying);

  notify(
    flying
      ?"Flying ON — Space up, X down"
      :"Flying OFF — gravity enabled"
  );
}

/* ===================================================
   INPUT
   =================================================== */

$("start").onclick=()=>{
  renderer.domElement.requestPointerLock();
};

document.addEventListener("pointerlockchange",()=>{
  playing=document.pointerLockElement===renderer.domElement;

  $("hud").hidden=!playing;
  $("menu").hidden=playing||!!currentPanel;

  if(!playing){
    for(const k of Object.keys(keys)){
      keys[k]=false;
    }
  }
});

document.addEventListener("mousemove",e=>{
  if(!playing)return;

  yaw-=e.movementX*.0024;

  pitch=THREE.MathUtils.clamp(
    pitch-e.movementY*.0024,
    -.8,1.15
  );
});

document.addEventListener("keydown",e=>{
  if(["Space","ArrowUp","ArrowDown"].includes(e.code)){
    e.preventDefault();
  }

  keys[e.code]=true;

  if(!playing||e.repeat)return;

  if(e.code==="KeyQ")capture();
  if(e.code==="KeyE")commandCompanion();
  if(e.code==="KeyI")openPanel("inventory");
  if(e.code==="KeyC")openPanel("crafting");
  if(e.code==="KeyB")openPanel("building");
  if(e.code==="KeyF")setFly();
  if(e.code==="KeyP")saveGame();

  if(e.code==="KeyV"){
    cameraMode=(cameraMode+1)%2;
    notify(cameraMode?"First-person view":"Third-person view");
  }

  if(e.code==="KeyR"){
    if(use("cooked")){
      food=Math.min(100,food+35);
      health=Math.min(100,health+10);
      notify("Ate cooked food");
    }else if(use("berries",2)){
      food=Math.min(100,food+15);
      notify("Ate berries");
    }else{
      notify("Gather berries or craft food");
    }
  }

  if(/^Digit[1-5]$/.test(e.code)){
    const i=Number(e.code.slice(-1))-1;

    if(party[i]){
      selectedCompanion=i;
      spawnFollower();
      updatePartyBar();
      notify(`${party[i]} is now following`);
    }
  }
});

document.addEventListener("keyup",e=>{
  keys[e.code]=false;
});

document.addEventListener("contextmenu",e=>{
  e.preventDefault();
});

document.addEventListener("mousedown",e=>{
  if(!playing||e.button!==0)return;
  gather();
});

/* HUD BUTTONS */

$("captureBtn").onclick=()=>{
  capture();
  renderer.domElement.requestPointerLock().catch(()=>{});
};

$("flyBtn").onclick=()=>{
  setFly();
  renderer.domElement.requestPointerLock().catch(()=>{});
};

$("buildBtn").onclick=()=>{
  openPanel("building");
};

/* ===================================================
   MAIN LOOP
   =================================================== */

const clock=new THREE.Clock();

let frameCount=0;
let frameTime=0;
let uiTime=0;
let hungerTime=0;

function updateHUD(){
  $("hp").textContent=Math.ceil(health);
  $("food").textContent=Math.ceil(food);
  $("orbs").textContent=inventory.orbs||0;

  $("coords").textContent=
    `XYZ ${player.position.x.toFixed(0)}, `+
    `${player.position.y.toFixed(0)}, `+
    `${player.position.z.toFixed(0)}`;

  $("location").textContent=region(
    player.position.x,
    player.position.z
  );

  const day=Math.floor(worldTime/120)+1;
  const phase=(worldTime%120)/120;

  const timeName=
    phase<.25?"Morning":
    phase<.50?"Afternoon":
    phase<.75?"Evening":"Night";

  $("clock").textContent=`Day ${day} • ${timeName}`;

  $("mode").textContent=flying
    ?"FLYING"
    :"EXPLORING";

  const target=targetCreature();

  $("targetLabel").textContent=target
    ?`${target.name} • ${target.config.element} • Q Capture`
    :"";
}

function animate(){
  requestAnimationFrame(animate);

  const dt=Math.min(.04,clock.getDelta());

  frameCount++;
  frameTime+=dt;

  if(frameTime>=1){
    $("fps").textContent=
      `FPS ${Math.round(frameCount/frameTime)}`;

    frameCount=0;
    frameTime=0;
  }

  if(playing){
    worldTime+=dt;

    updateMovement(dt);
    updateWild(dt);
    updateFollower(dt);

    hungerTime+=dt;

    if(hungerTime>=7){
      hungerTime=0;
      food=Math.max(0,food-1);

      if(food===0){
        health=Math.max(0,health-2);
      }
    }

    if(health<=0){
      health=100;
      food=50;

      player.position.set(
        0,
        terrainHeight(0,0),
        0
      );

      notify("You respawned at the starting area");
    }

    actionCooldown=Math.max(0,actionCooldown-dt);
  }

  updateCamera();
  updateProjectiles(dt);

  const sunlightAmount=
    .5+.5*Math.cos(worldTime*.052);

  light.intensity=.7+sunlightAmount*1.5;
  sunlight.intensity=.3+sunlightAmount*2;

  scene.background.setRGB(
    .08+sunlightAmount*.50,
    .12+sunlightAmount*.66,
    .22+sunlightAmount*.73
  );

  uiTime+=dt;

  if(uiTime>.15){
    uiTime=0;
    updateHUD();
  }

  if(messageTime>0){
    messageTime-=dt;

    if(messageTime<=0){
      $("notice").textContent="";
    }
  }

  renderer.render(scene,camera);
}

updateCamera();
animate();

window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
