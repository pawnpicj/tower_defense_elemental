import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createVFX } from './vfx.js';
import { createTowerAudio } from './audio.js';
import { createPixelRenderer,pixelTexture } from './pixel-renderer.js';
const ELEMENTS={
 earth:{name:'ดิน',title:'STONE GUARDIAN',symbol:'◆',color:'#b38e52',tint:'#eee4ce',description:'ระเบิดหิน · สตันเป็นวง',damage:56,range:4.7,interval:1.8,projectile:7},
 water:{name:'น้ำ',title:'TIDAL SANCTUM',symbol:'≈',color:'#4babc5',tint:'#d6ecec',description:'คลื่นน้ำ · ลดความเร็ว 50%',damage:26,range:4.8,interval:1.05,projectile:10},
 wind:{name:'ลม',title:'ZEPHYR SPIRE',symbol:'≋',color:'#7daa83',tint:'#e0ecda',description:'คมลม · ยิงเร็วและผลักกลับ',damage:18,range:5.1,interval:.48,projectile:16},
 fire:{name:'ไฟ',title:'EMBER CITADEL',symbol:'♨',color:'#d98651',tint:'#f3dfcb',description:'ลูกไฟ · เผาและระเบิดหมู่',damage:34,range:4.5,interval:1.25,projectile:8},
 lightning:{name:'สายฟ้า',title:'STORM OBELISK',symbol:'ϟ',color:'#9c86bf',tint:'#e6dff0',description:'สายฟ้าชิ่ง · สูงสุด 3 เป้าหมาย',damage:38,range:5,interval:1.15,projectile:0}
};
const keys=Object.keys(ELEMENTS);
for(const [key,e] of Object.entries(ELEMENTS)){
 document.querySelector('#tower-cards').insertAdjacentHTML('beforeend',`<button class="tower-card ${key==='earth'?'selected':''}" data-element="${key}" aria-pressed="${key==='earth'}" style="--element:${e.color};--tint:${e.tint}"><div class="element-icon"><span>${e.symbol}</span></div><div class="card-copy"><strong>ป้อม${e.name}</strong><small>${e.title}</small><p>${e.description}</p></div></button>`);
 document.querySelector('#damage-bars').insertAdjacentHTML('beforeend',`<div class="damage-row" style="--element:${e.color}"><div class="damage-info"><span>${e.symbol} ${e.name}</span><span id="damage-${key}">0</span></div><div class="damage-track"><div class="damage-fill" id="bar-${key}"></div></div></div>`);
}
const container=document.querySelector('#scene');let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:false,alpha:true});}catch(error){document.querySelector('#error').hidden=false;document.querySelector('#error').textContent='เปิดฉาก 3D ไม่สำเร็จ กรุณาเปิด WebGL / การเร่งกราฟิกในเบราว์เซอร์';throw error;}
renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.BasicShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
container.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','สนามรบ 3D คลิกแท่นเพื่อเลือกป้อม ลากเพื่อหมุน เลื่อนเพื่อซูม');
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-16,16,13,-13,.1,160),initialCamera=new THREE.Vector3(28,28.2,28);camera.position.copy(initialCamera);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.2,0);controls.enableDamping=false;controls.enablePan=false;controls.minZoom=.75;controls.maxZoom=3.5;const isoPolar=Math.acos(1/Math.sqrt(3));controls.minPolarAngle=isoPolar;controls.maxPolarAngle=isoPolar;controls.update();
const pixelRenderer=createPixelRenderer(renderer,scene,camera);
controls.addEventListener('end',()=>{const offset=camera.position.clone().sub(controls.target),radius=Math.hypot(offset.x,offset.z),angle=Math.atan2(offset.x,offset.z),snap=Math.round((angle-Math.PI/4)/(Math.PI/2))*Math.PI/2+Math.PI/4;camera.position.x=controls.target.x+Math.sin(snap)*radius;camera.position.z=controls.target.z+Math.cos(snap)*radius;controls.update();});
const hemi=new THREE.HemisphereLight(0xe9f7ff,0x667c48,1.8);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe5b5,3.0);sun.position.set(-8,22,13);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-19,right:19,top:16,bottom:-16,near:1,far:65});sun.shadow.bias=-.0003;sun.shadow.normalBias=.05;scene.add(sun);
const rim=new THREE.DirectionalLight(0xb5e8d4,1.1);rim.position.set(10,8,-12);scene.add(rim);
const world=new THREE.Group();scene.add(world);
const vfx=createVFX(scene,camera);
const sound=createTowerAudio({spatial(position){if(!position)return{pan:0,gain:1};const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);return{pan:position.clone().sub(controls.target).dot(right)/16,gain:.7+.3*Math.max(0,1-camera.position.distanceTo(position)/45)};}});
function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.87,flatShading:true,...extra});}
const m={grass:material('#93ac72'),grassTop:material('#a4b884'),earth:material('#908462'),stone:material('#d1cbb1'),light:material('#e5dcc0'),dark:material('#789381'),wood:material('#8e6945'),gold:material('#c7a25a',{metalness:.55,roughness:.4}),path:material('#d2bc8e'),pathEdge:material('#b19f75'),water:material('#71afb3',{metalness:.25,roughness:.3}),leaf:material('#729862'),leafLight:material('#9db779'),leafDark:material('#547c58'),black:material('#344b43')};
for(const [key,kind] of Object.entries({grass:'grass',grassTop:'grass',earth:'earth',stone:'stone',light:'stone',dark:'stone',wood:'wood',path:'path',water:'water',leaf:'leaf',leafLight:'leaf',leafDark:'leaf'})){m[key].map=pixelTexture(kind);m[key].needsUpdate=true;}
const elementMats={},brightMats={};for(const key of keys){elementMats[key]=material(ELEMENTS[key].color);brightMats[key]=material(ELEMENTS[key].color,{emissive:ELEMENTS[key].color,emissiveIntensity:.75,roughness:.26,metalness:.2});}
function mesh(geo,mat,x=0,y=0,z=0,parent=world){const a=new THREE.Mesh(geo,mat);a.position.set(x,y,z);a.castShadow=a.receiveShadow=true;parent.add(a);return a;}
function box(w,h,d,mat,x,y,z,parent=world){return mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);}
function cyl(rt,rb,h,mat,x,y,z,n=8,parent=world){return mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat,x,y,z,parent);}
function ring(r,t,mat,x,y,z,parent=world){const a=mesh(new THREE.TorusGeometry(r,t,6,48),mat,x,y,z,parent);a.rotation.x=Math.PI/2;return a;}
function beam(a,b,r,mat,parent=world){const v=new THREE.Vector3().subVectors(b,a);const obj=mesh(new THREE.CylinderGeometry(r,r,v.length(),6),mat,0,0,0,parent);obj.position.copy(a).add(b).multiplyScalar(.5);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return obj;}
function disposeTree(root){root.traverse(o=>{if(o.geometry&&!o.userData.sharedGeometry)o.geometry.dispose();});root.removeFromParent();}
box(25,.9,16,m.earth,0,-.55,0);box(25.2,.2,16.2,m.grass,0,0,0);
for(let i=0;i<26;i++){const x=-12+i;box(.92,.2+(i%3)*.06,.15,m.grassTop,x,.11,-8.04);box(.92,.15,.15,m.grassTop,x,.1,8.04);}
box(1.6,.025,16,m.water,8.3,.115,0);for(const x of [7.42,9.18])box(.15,.09,16,m.stone,x,.14,0);
for(let i=0;i<9;i++)box(.24,.12,1.9,i%2?m.wood:m.pathEdge,7.28+i*.25,.25,-3);
for(const z of [-4,-2]){for(const x of [7.3,9.25])cyl(.045,.045,.75,m.wood,x,.63,z,6);beam(new THREE.Vector3(7.3,.95,z),new THREE.Vector3(9.25,.95,z),.035,m.wood);}
const pathPoints=[[-12,-4],[-6,-4],[-6,0],[0,0],[0,4],[6.5,4],[6.5,-3],[12,-3]].map(([x,z])=>new THREE.Vector3(x,.2,z));
const segmentLengths=[],pathStarts=[0];let pathLength=0;
for(let i=0;i<pathPoints.length-1;i++){const a=pathPoints[i],b=pathPoints[i+1],length=a.distanceTo(b);segmentLengths.push(length);pathLength+=length;pathStarts.push(pathLength);const section=box(length+1.12,.045,1.12,m.path,(a.x+b.x)/2,.15,(a.z+b.z)/2);section.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);for(let j=.5;j<length;j+=1.1){const p=a.clone().lerp(b,j/length);const stone=box(.12,.04,.12,m.pathEdge,p.x+.26,.19,p.z-.22);stone.rotation.y=j;}}
function pathPosition(distance,out=new THREE.Vector3()){const d=THREE.MathUtils.clamp(distance,0,pathLength);for(let i=0;i<segmentLengths.length;i++)if(d<=pathStarts[i+1])return out.copy(pathPoints[i]).lerp(pathPoints[i+1],(d-pathStarts[i])/segmentLengths[i]);return out.copy(pathPoints.at(-1));}
function nearestPathDistance(point){let best=Infinity,distance=0;for(let d=0;d<=pathLength;d+=.2){const p=pathPosition(d),sq=p.distanceToSquared(point);if(sq<best){best=sq;distance=d;}}return distance;}
const portal=new THREE.Group();portal.position.copy(pathPoints[0]);world.add(portal);for(const z of [-.83,.83]){cyl(.28,.35,1.55,m.dark,0,.8,z,6,portal);mesh(new THREE.OctahedronGeometry(.22),brightMats.fire,0,1.72,z,portal);}
const portalRing=ring(.8,.07,brightMats.fire,0,1.1,0,portal);portalRing.rotation.z=Math.PI/2;
const base=new THREE.Group();base.position.copy(pathPoints.at(-1));world.add(base);for(const z of [-.9,.9]){cyl(.45,.52,2,m.stone,0,1,z,6,base);cyl(.6,.45,.3,m.dark,0,2.14,z,6,base);mesh(new THREE.ConeGeometry(.6,.65,6),elementMats.water,0,2.6,z,base);}box(.6,.3,2.4,m.light,0,1.95,0,base);box(.16,1.6,1.35,m.wood,.1,.85,0,base);for(let i=0;i<6;i++)box(.18,1.65,.035,m.gold,-.01,.87,-.58+i*.23,base);
function tree(x,z,s=1){const g=new THREE.Group();g.position.set(x,.15,z);g.scale.setScalar(s);world.add(g);cyl(.1,.16,.9,m.wood,0,.45,0,6,g);for(let j=0;j<3;j++)cyl(0,.65-j*.13,.92,[m.leafDark,m.leaf,m.leafLight][j],0,.9+j*.4,0,7,g);}
for(const [x,z,s] of [[-10,5,1.15],[-11,6.4,.8],[-8.7,6.5,.9],[-10,-6.5,1],[-8.5,-7,.7],[-3,-6.7,1.2],[-1.6,-6.6,.8],[1.8,-5.6,.95],[3,-6.8,1.1],[10.5,5.5,1.2],[11.5,6.9,.8],[9.3,6.8,.8],[10.5,-6.2,1],[11.8,-5.8,.7]])tree(x,z,s);
for(let i=0;i<30;i++){const x=Math.sin(i*5.83)*11.5,z=Math.cos(i*3.91)*7.2;if(pathPosition(nearestPathDistance(new THREE.Vector3(x,.2,z))).distanceTo(new THREE.Vector3(x,.2,z))<1.2||Math.abs(x-8.3)<1.4)continue;const rock=mesh(new THREE.DodecahedronGeometry(.16+(i%3)*.08),i%2?m.dark:m.light,x,.24,z);rock.scale.set(1.4,.65,1);rock.rotation.y=i;}
for(let i=0;i<22;i++){const x=-11+(i%11)*2,z=i<11?-7.4:7.4;for(let j=0;j<2;j++){const tuft=mesh(new THREE.ConeGeometry(.06,.35,3),m.leaf,x+j*.12,.26,z);tuft.rotation.z=(j-.5)*.5;}}
function buildTower(key){
 const g=new THREE.Group(),body=new THREE.Group();g.add(body);const color=elementMats[key],glow=brightMats[key],animated=[];
 cyl(.73,.88,.22,m.dark,0,.21,0,8,body);cyl(.68,.73,.16,m.light,0,.4,0,8,body);
 if(key==='earth'){
  for(let r=0;r<3;r++)for(let i=0;i<4;i++){const a=i*Math.PI/2+r*.15,b=box(.56,.45,.56,r%2?m.dark:m.stone,Math.sin(a)*.35,.75+r*.4,Math.cos(a)*.35,body);b.rotation.y=a;}
  cyl(.67,.58,.23,color,0,1.83,0,6,body);const rock=mesh(new THREE.DodecahedronGeometry(.53,0),color,0,2.3,0,body);rock.scale.set(1,1.25,1);animated.push({obj:rock,type:'rock',base:2.3});
  for(let i=0;i<4;i++){const a=i*Math.PI/2,shard=mesh(new THREE.ConeGeometry(.15,.47,4),m.gold,Math.sin(a)*.52,2.02,Math.cos(a)*.52,body);shard.rotation.z=-Math.sin(a)*.25;}
  box(.3,.3,.08,m.black,0,1.3,.68,body);const rune=mesh(new THREE.OctahedronGeometry(.12),glow,0,1.3,.74,body);rune.scale.z=.3;
 }else if(key==='water'){
  cyl(.4,.65,1.12,m.light,0,1.02,0,8,body);cyl(.58,.41,.17,color,0,1.57,0,8,body);cyl(.72,.38,.32,m.stone,0,1.8,0,10,body);cyl(.62,.62,.025,glow,0,1.98,0,24,body);
  for(let i=0;i<6;i++){const a=i*Math.PI/3,p=box(.1,.7,.1,color,Math.sin(a)*.44,1.02,Math.cos(a)*.44,body);p.rotation.y=a;}
  const drop=new THREE.Group();body.add(drop);mesh(new THREE.SphereGeometry(.31,12,8),glow,0,2.42,0,drop);mesh(new THREE.ConeGeometry(.29,.55,12),glow,0,2.75,0,drop);animated.push({obj:drop,type:'float',base:0});
  for(const [r,y] of [[.43,2.19],[.56,2.33]]){const halo=ring(r,.025,glow,0,y,0,body);animated.push({obj:halo,type:'water',base:y});}
 }else if(key==='wind'){
  cyl(.24,.5,1.72,m.light,0,1.3,0,8,body);cyl(.37,.37,.12,m.gold,0,1.65,0,8,body);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3,fin=box(.15,1.25,.32,color,Math.sin(a)*.4,1.15,Math.cos(a)*.4,body);fin.rotation.y=a;fin.rotation.z=Math.sin(a)*.15;}
  const rotor=new THREE.Group();rotor.position.y=2.45;body.add(rotor);for(let i=0;i<3;i++){const a=i*Math.PI*2/3,wing=mesh(new THREE.ConeGeometry(.22,1.1,3),color,Math.sin(a)*.46,Math.cos(a)*.46,0,rotor);wing.rotation.z=-a;}
  mesh(new THREE.OctahedronGeometry(.18),m.gold,0,0,.1,rotor);animated.push({obj:rotor,type:'rotor',base:2.45});const halo=ring(.66,.024,glow,0,2.4,0,body);halo.rotation.z=.45;animated.push({obj:halo,type:'wind',base:2.4});
 }else if(key==='fire'){
  cyl(.55,.7,1.2,m.dark,0,1.05,0,6,body);for(let i=0;i<6;i++){const a=i*Math.PI/3,buttress=box(.18,1.15,.23,color,Math.sin(a)*.55,1.03,Math.cos(a)*.55,body);buttress.rotation.y=a;}
  cyl(.62,.47,.22,m.gold,0,1.72,0,8,body);cyl(.74,.4,.4,m.black,0,1.98,0,8,body);cyl(.59,.59,.04,glow,0,2.19,0,10,body);
  const flame=new THREE.Group();flame.position.y=2.25;body.add(flame);const f=mesh(new THREE.OctahedronGeometry(.42),glow,0,.3,0,flame);f.scale.set(.8,1.7,.8);const inner=mesh(new THREE.OctahedronGeometry(.23),m.gold,.06,.26,.1,flame);inner.scale.y=2;
  for(let i=0;i<3;i++){const a=i*2.1,spark=mesh(new THREE.OctahedronGeometry(.14),glow,Math.sin(a)*.36,.4,Math.cos(a)*.36,flame);spark.scale.y=1.8;}
  animated.push({obj:flame,type:'flame',base:2.25});for(let i=0;i<4;i++){const a=i*Math.PI/2;cyl(.04,.07,.6,m.gold,Math.sin(a)*.62,2.25,Math.cos(a)*.62,5,body);}
 }else{
  cyl(.42,.6,1.45,m.dark,0,1.18,0,6,body);cyl(.48,.48,.15,m.gold,0,1.9,0,6,body);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;beam(new THREE.Vector3(Math.sin(a)*.43,1.7,Math.cos(a)*.43),new THREE.Vector3(Math.sin(a)*.6,2.67,Math.cos(a)*.6),.065,m.gold,body);mesh(new THREE.OctahedronGeometry(.13),glow,Math.sin(a)*.6,2.7,Math.cos(a)*.6,body);}
  const core=mesh(new THREE.OctahedronGeometry(.4),glow,0,2.42,0,body);core.scale.set(.65,1.7,.65);animated.push({obj:core,type:'lightning',base:2.42});for(const y of [1.05,1.42,2.13]){const coil=ring(y>2?.5:.47,.04,color,0,y,0,body);animated.push({obj:coil,type:'coil',base:y});}
  const rune=mesh(new THREE.OctahedronGeometry(.16),glow,0,1.4,.53,body);rune.scale.set(.6,1.6,.3);
 }
 g.userData={animated,body,key};return g;
}
const plotCoords=[[-8,-1],[-3,-2],[2,1.55],[3.5,6],[9.6,.2],[-3,2.7],[3.5,-2.8],[-8,2.5]];
const plots=plotCoords.map(([x,z],i)=>{const group=new THREE.Group();group.position.set(x,.14,z);world.add(group);const pad=cyl(.95,1.04,.12,m.stone,0,.04,0,8,group);pad.userData.plotIndex=i;const edge=ring(.86,.025,m.gold,0,.12,0,group);edge.userData.plotIndex=i;box(.4,.02,.07,m.dark,0,.12,0,group).userData.plotIndex=i;box(.07,.02,.4,m.dark,0,.12,0,group).userData.plotIndex=i;return{index:i,position:new THREE.Vector3(x,.14,z),group,pad,tower:null,cooldown:.2+i*.1,shots:0};});
let selectedElement='earth',selectedPlot=0,showRange=true;
const selectionMat=new THREE.MeshBasicMaterial({color:0xcba65c}),selection=ring(1.04,.04,selectionMat,plotCoords[0][0],.3,plotCoords[0][1],scene);
const rangeMat=new THREE.MeshBasicMaterial({color:ELEMENTS.earth.color,transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false});
const rangeRing=mesh(new THREE.RingGeometry(.985,1,96),rangeMat,0,.235,0,scene);rangeRing.rotation.x=-Math.PI/2;rangeRing.castShadow=false;rangeRing.receiveShadow=false;
const state={wave:0,lives:20,kills:0,escaped:0,totalDamage:0,damage:Object.fromEntries(keys.map(k=>[k,0])),shots:Object.fromEntries(keys.map(k=>[k,0])),effects:Object.fromEntries(keys.map(k=>[k,0])),running:false,paused:false,speed:1,pending:0,spawnTimer:0,waveSize:12,spawned:0,completed:0};
const enemies=[],projectiles=[],effects=[];let enemyId=0,night=false,uiTimer=0,toastTimer=0,simTime=0;
const toast=document.querySelector('#toast');
function message(text){toast.textContent=text;toastTimer=5;}
function placeTower(index,key){const p=plots[index];if(p.tower)disposeTree(p.tower);const tower=buildTower(key);tower.position.copy(p.position);tower.traverse(o=>o.userData.plotIndex=index);world.add(tower);p.tower=tower;p.cooldown=.2;p.shots=0;updateSelection();updateUI();}
function updateSelection(){const p=plots[selectedPlot];selection.position.set(p.position.x,.3,p.position.z);const key=p.tower?.userData.key,e=ELEMENTS[key||selectedElement];rangeRing.position.set(p.position.x,.235,p.position.z);rangeRing.scale.setScalar(e.range);rangeRing.material.color.set(e.color);rangeRing.visible=showRange&&!!p.tower;document.querySelector('#slot-id').textContent=`PLOT ${String(selectedPlot+1).padStart(2,'0')}`;document.querySelector('#slot-name').textContent=key?`ป้อม${e.name} · ${e.damage} DMG · ระยะ ${e.range.toFixed(1)} m`:'แท่นว่าง · เลือกธาตุแล้วคลิกวาง';document.querySelector('#replace').textContent=p.tower?`เปลี่ยนเป็นป้อม${ELEMENTS[selectedElement].name}`:`วางป้อม${ELEMENTS[selectedElement].name}`;document.querySelector('#remove').disabled=!p.tower;document.querySelector('#test-attack').disabled=!p.tower||state.lives<=0;}
function selectElement(key){selectedElement=key;document.querySelectorAll('[data-element]').forEach(b=>{const active=b.dataset.element===key;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});updateSelection();}
document.querySelectorAll('[data-element]').forEach(b=>b.addEventListener('click',()=>{selectElement(b.dataset.element);message(`เลือกธาตุ${ELEMENTS[selectedElement].name}แล้ว · คลิกแท่นว่างเพื่อวาง หรือเลือกป้อมแล้วกดเปลี่ยนธาตุ`);}));
document.querySelector('#replace').addEventListener('click',()=>{placeTower(selectedPlot,selectedElement);message(`วางป้อม${ELEMENTS[selectedElement].name}บนแท่น ${selectedPlot+1} แล้ว`);});
document.querySelector('#remove').addEventListener('click',()=>{const p=plots[selectedPlot];if(p.tower){disposeTree(p.tower);p.tower=null;updateSelection();updateUI();message(`นำป้อมออกจากแท่น ${selectedPlot+1} แล้ว`);}});
const raycaster=new THREE.Raycaster();let pointerDown=null;
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{if(!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>6){pointerDown=null;return;}pointerDown=null;const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hits=raycaster.intersectObjects([...plots.map(p=>p.group),...plots.filter(p=>p.tower).map(p=>p.tower)],true),hit=hits.find(h=>h.object.userData.plotIndex!==undefined);if(hit){selectedPlot=hit.object.userData.plotIndex;if(!plots[selectedPlot].tower){placeTower(selectedPlot,selectedElement);message(`วางป้อม${ELEMENTS[selectedElement].name} · แท่น ${selectedPlot+1}`);}else{updateSelection();message(`เลือกป้อม${ELEMENTS[plots[selectedPlot].tower.userData.key].name} · แท่น ${selectedPlot+1}`);}}});
const healthBackMat=new THREE.MeshBasicMaterial({color:0x4f5c42}),healthMat=new THREE.MeshBasicMaterial({color:0x8cc96d}),enemySkin=material('#74986c'),armor=material('#737e75'),red=material('#b78a61');
function spawnEnemy(options={}){
 if(enemies.length>=60)return null;
 const tank=options.tank??(state.spawned%5===4),g=new THREE.Group();world.add(g);const hp=options.hp??(tank?1000:600)*(1+Math.max(0,state.wave-1)*.2);
 cyl(.22,.3,.53,tank?armor:red,0,.63,0,6,g);mesh(new THREE.SphereGeometry(.23,7,5),enemySkin,0,1.08,0,g);const helmet=mesh(new THREE.ConeGeometry(.28,.25,6),armor,0,1.28,0,g);helmet.rotation.y=Math.PI/6;for(const x of [-.105,.105])box(.055,.045,.04,m.black,x,1.09,.22,g);
 const limbs=[];for(const x of [-.14,.14]){limbs.push(box(.13,.32,.15,m.wood,x,.28,0,g));limbs.push(box(.12,.36,.12,enemySkin,x*2.1,.65,0,g));}if(tank){const shield=box(.33,.5,.09,armor,-.34,.68,.16,g);shield.rotation.z=-.15;g.scale.setScalar(1.2);}
 const bar=new THREE.Group();bar.position.y=tank?1.75:1.55;g.add(bar);mesh(new THREE.PlaneGeometry(.68,.075),healthBackMat,0,0,0,bar).castShadow=false;const fill=mesh(new THREE.PlaneGeometry(.64,.045),healthMat,0,0,.005,bar);fill.castShadow=false;
 const e={id:++enemyId,group:g,bar,fill,limbs,hp,maxHp:hp,distance:options.distance??0,speed:options.speed??(tank?1.35:1.65),tank,slow:0,stun:0,burn:0,burnTick:0,alive:true,training:!!options.training,trainingPlot:options.trainingPlot??null,phase:enemyId*1.2};pathPosition(e.distance,g.position);enemies.push(e);return e;
}
function targetFor(p){const key=p.tower.userData.key;return enemies.filter(e=>e.alive&&(!e.training||e.trainingPlot===p.index)&&e.group.position.distanceTo(p.position)<ELEMENTS[key].range).sort((a,b)=>b.distance-a.distance)[0];}
function burst(position,key,count=9){vfx.burst(key,position,count);}
function shockwave(position,key,radius){vfx.impact(key,position,radius);}
function lightningBeam(from,to,hop=0){vfx.lightning(from,to);sound.play('lightning','impact',to,{delay:hop*.035,variant:hop});}
function applyDamage(enemy,amount,key){if(!enemy.alive)return;const actual=Math.min(enemy.hp,amount);enemy.hp-=actual;state.damage[key]+=actual;state.totalDamage+=actual;if(enemy.hp<=0){enemy.alive=false;state.kills++;burst(enemy.group.position.clone().add(new THREE.Vector3(0,.5,0)),key,6);vfx.removeStatus(enemy.id);enemy.group.visible=false;}}
function applyHit(enemy,key,position){
 const data=ELEMENTS[key],victims=key==='earth'||key==='fire'?enemies.filter(e=>e.alive&&e.group.position.distanceTo(position)<(key==='earth'?1.55:1.45)):enemy.alive?[enemy]:[];
 for(const e of victims){applyDamage(e,data.damage,key);if(!e.alive)continue;if(key==='earth'){e.stun=Math.max(e.stun,.55);state.effects.earth++;}if(key==='water'){e.slow=2.2;state.effects.water++;}if(key==='wind'){e.distance=Math.max(0,e.distance-.38);state.effects.wind++;}if(key==='fire'){e.burn=3;e.burnTick=0;state.effects.fire++;}}
 vfx.impact(key,position);sound.play(key,'impact',position);
}
function attack(p,enemy){
 if(!p.tower||!enemy?.alive)return;const key=p.tower.userData.key;p.cooldown=ELEMENTS[key].interval;p.shots++;state.shots[key]++;p.tower.userData.recoil=.2;const source=p.position.clone().add(new THREE.Vector3(0,2.65,0));vfx.cast(key,source);sound.play(key,'cast',source);
 if(key==='lightning'){const hit=new Set();let current=enemy,origin=source;for(let i=0;i<3&&current;i++){hit.add(current.id);const target=current.group.position.clone().add(new THREE.Vector3(0,.8,0));lightningBeam(origin,target,i);applyDamage(current,ELEMENTS.lightning.damage*Math.pow(.78,i),key);burst(target,key,5);state.effects.lightning++;origin=target;current=enemies.filter(e=>e.alive&&!hit.has(e.id)&&e.group.position.distanceTo(origin)<3.35).sort((a,b)=>a.group.position.distanceTo(origin)-b.group.position.distanceTo(origin))[0];}}
 else{const visual=vfx.projectile(key,source),object=visual.group;const duration=Math.max(.15,source.distanceTo(enemy.group.position)/ELEMENTS[key].projectile);projectiles.push({object,visual,key,enemy,source,age:-.12,duration,target:enemy.group.position.clone()});}
}
function updateEnemy(e,dt){
 if(!e.alive)return;e.slow=Math.max(0,e.slow-dt);e.stun=Math.max(0,e.stun-dt);
 if(e.burn>0){e.burn=Math.max(0,e.burn-dt);e.burnTick+=dt;while(e.burnTick>=.5&&e.alive){e.burnTick-=.5;applyDamage(e,8,'fire');burst(e.group.position.clone().add(new THREE.Vector3(0,.6,0)),'fire',3);}}if(!e.alive)return;
 if(e.stun<=0)e.distance+=e.speed*(e.slow>0?.5:1)*dt;
 if(e.distance>=pathLength){e.alive=false;e.group.visible=false;state.lives=Math.max(0,state.lives-1);state.escaped++;if(state.lives===0){sound.stopAll();state.running=false;state.pending=0;message('ฐานถูกทำลายแล้ว · กดรีเซ็ตเพื่อทดสอบใหม่');}return;}
 pathPosition(e.distance,e.group.position);const next=pathPosition(e.distance+.1);e.group.rotation.y=Math.atan2(next.x-e.group.position.x,next.z-e.group.position.z);
 const walk=Math.sin(simTime*8+e.phase)*(e.stun>0?0:.35);e.limbs.forEach((limb,i)=>limb.rotation.x=walk*(i%2?1:-1));e.bar.quaternion.copy(camera.quaternion).premultiply(e.group.quaternion.clone().invert());e.fill.scale.x=Math.max(0,e.hp/e.maxHp);e.fill.position.x=-.32*(1-e.hp/e.maxHp);e.group.children[0].material=e.slow>0?elementMats.water:e.stun>0?elementMats.earth:e.burn>0?elementMats.fire:e.tank?armor:red;vfx.status(e);
}
function updateProjectiles(dt){
 for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.age+=dt;if(p.enemy.alive)p.target.copy(p.enemy.group.position);const t=THREE.MathUtils.clamp(p.age/p.duration,0,1),position=p.source.clone().lerp(p.target.clone().add(new THREE.Vector3(0,.65,0)),t);position.y+=Math.sin(t*Math.PI)*(p.key==='earth'?1.1:p.key==='water'?.45:.22);p.visual.update(position,t,dt);if(t>=1){applyHit(p.enemy,p.key,p.target);p.visual.dispose();projectiles.splice(i,1);}}
}
function updateEffects(dt){vfx.update(dt);}
function cleanupEnemies(){for(let i=enemies.length-1;i>=0;i--)if(!enemies[i].alive&&!projectiles.some(p=>p.enemy===enemies[i])){vfx.removeStatus(enemies[i].id);disposeTree(enemies[i].group);enemies.splice(i,1);}}
function startWave(){if(state.running||state.lives<=0)return;if(!plots.some(p=>p.tower)){message('วางป้อมอย่างน้อย 1 ป้อมก่อนเริ่มเวฟ');return;}state.wave++;state.waveSize=12+(state.wave-1)*3;state.pending=state.waveSize;state.spawnTimer=0;state.spawned=0;state.running=true;state.paused=false;message(`เริ่มเวฟ ${state.wave} · ศัตรู ${state.waveSize} ตัว`);updateUI();}
function resetBattle(){sound.stopAll();enemies.forEach(e=>disposeTree(e.group));enemies.length=0;projectiles.forEach(p=>p.visual.dispose());projectiles.length=0;vfx.clear();effects.forEach(e=>{e.group.removeFromParent();if(e.owned){e.group.geometry.dispose();e.group.material.dispose();}});effects.length=0;Object.assign(state,{wave:0,lives:20,kills:0,escaped:0,totalDamage:0,running:false,paused:false,speed:1,pending:0,spawnTimer:0,waveSize:12,spawned:0,completed:0});keys.forEach(k=>{state.damage[k]=0;state.shots[k]=0;state.effects[k]=0;});plots.forEach(p=>{if(p.tower){disposeTree(p.tower);p.tower=null;}});selectedPlot=0;camera.position.copy(initialCamera);camera.zoom=1;camera.updateProjectionMatrix();controls.target.set(0,.2,0);controls.update();selectElement('earth');keys.forEach((key,i)=>placeTower(i,key));updateSelection();updateUI();message('รีเซ็ตสนามแล้ว · ป้อมทั้ง 5 ธาตุพร้อมทดสอบ');}
document.querySelector('#start').addEventListener('click',startWave);
document.querySelector('#pause').addEventListener('click',()=>{if(!state.running&&!enemies.some(e=>e.alive))return;state.paused=!state.paused;if(state.paused)sound.stopAll();updateUI();});
document.querySelector('#speed').addEventListener('click',()=>{state.speed=state.speed===3?1:state.speed+1;updateUI();});
document.querySelector('#reset').addEventListener('click',resetBattle);
function focusTower(){const p=plots[selectedPlot],target=p.position.clone().add(new THREE.Vector3(0,1.1,0));controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(28,28,28));camera.zoom=2.5;camera.updateProjectionMatrix();controls.update();}
document.querySelector('#focus-tower').addEventListener('click',focusTower);
document.querySelector('#test-attack').addEventListener('click',()=>{const p=plots[selectedPlot];if(!p.tower||state.lives<=0)return;focusTower();if(enemies.length>55){message('สนามมีศัตรูเต็มแล้ว รอสักครู่หรือรีเซ็ต');return;}state.paused=false;const distance=nearestPathDistance(p.position),enemy=spawnEnemy({distance,hp:280,speed:.55,training:true,trainingPlot:p.index,tank:false});if(!enemy)return;if(p.tower.userData.key==='lightning')for(let i=1;i<3;i++)spawnEnemy({distance:Math.max(0,distance-i*.75),hp:280,speed:.55,training:true,trainingPlot:p.index,tank:false});attack(p,enemy);message(`ทดสอบป้อม${ELEMENTS[p.tower.userData.key].name} · ${ELEMENTS[p.tower.userData.key].description}`);updateUI();});
document.querySelector('#range-toggle').addEventListener('click',e=>{showRange=!showRange;e.currentTarget.setAttribute('aria-pressed',String(showRange));updateSelection();});
document.querySelector('#reset-camera').addEventListener('click',()=>{camera.position.copy(initialCamera);camera.zoom=1;camera.updateProjectionMatrix();controls.target.set(0,.2,0);controls.update();});
document.querySelector('#theme').addEventListener('click',e=>{night=!night;document.body.classList.toggle('night',night);e.currentTarget.textContent=night?'☀':'☾';hemi.intensity=night?.7:1.8;sun.intensity=night?.6:3.0;rim.intensity=night?2.7:1.1;renderer.toneMappingExposure=night?1:1.18;pixelRenderer.setExposure(night?1:1.1);keys.forEach(k=>brightMats[k].emissiveIntensity=night?1.5:.75);});
function updateUI(){
 document.querySelector('#wave').textContent=String(state.wave).padStart(2,'0');document.querySelector('#lives').textContent=state.lives;document.querySelector('#kills').textContent=state.kills;document.querySelector('#alive').textContent=enemies.filter(e=>e.alive).length;document.querySelector('#total-damage').textContent=Math.round(state.totalDamage).toLocaleString();
 document.querySelector('#wave-detail').textContent=state.lives<=0?'ฐานถูกทำลาย · รีเซ็ตเพื่อเริ่มใหม่':state.running?`เกิดแล้ว ${state.spawned} / ${state.waveSize} ตัว`:state.wave?`เวฟ ${state.completed} จบแล้ว · พร้อมเวฟถัดไป`:'พร้อมทดสอบการป้องกัน';
 const max=Math.max(1,...Object.values(state.damage));for(const key of keys){document.querySelector(`#damage-${key}`).textContent=Math.round(state.damage[key]).toLocaleString();document.querySelector(`#bar-${key}`).style.width=`${state.damage[key]/max*100}%`;}
 document.querySelector('#tower-count').textContent=`${plots.filter(p=>p.tower).length} / 8 TOWERS PLACED`;document.querySelector('#state-badge').textContent=state.lives<=0?'ฐานถูกทำลาย':state.paused?'หยุดชั่วคราว':state.running?'กำลังต่อสู้':enemies.some(e=>e.alive)?'ทดสอบโจมตี':'พร้อมเริ่ม';
 const start=document.querySelector('#start');start.disabled=state.running||state.lives<=0;start.innerHTML=`▶ ${state.wave?'เวฟถัดไป':'เริ่มเวฟ'} <span>${state.running?state.waveSize:12+state.wave*3} ENEMIES</span>`;
 const pause=document.querySelector('#pause');pause.disabled=state.lives<=0||(!state.running&&!enemies.some(e=>e.alive));pause.textContent=state.paused?'▶ เล่นต่อ':'Ⅱ หยุดชั่วคราว';document.querySelector('#speed').textContent=`${state.speed}×`;document.querySelector('#test-attack').disabled=!plots[selectedPlot].tower||state.lives<=0;
}
keys.forEach((key,i)=>placeTower(i,key));updateSelection();updateUI();
function resize(){const w=container.clientWidth,h=container.clientHeight,aspect=w/h,frustumHeight=Math.max(22,32/aspect);camera.left=-frustumHeight*aspect/2;camera.right=frustumHeight*aspect/2;camera.top=frustumHeight/2;camera.bottom=-frustumHeight/2;camera.updateProjectionMatrix();pixelRenderer.resize(w,h);vfx.setViewportHeight(pixelRenderer.resolution.height);}
document.querySelector('#pixel-size').addEventListener('click',e=>{pixelRenderer.setPixelSize(pixelRenderer.pixelSize===4?2:pixelRenderer.pixelSize+1);vfx.setViewportHeight(pixelRenderer.resolution.height);e.currentTarget.querySelector('span').textContent=`${pixelRenderer.pixelSize}×`;});

new ResizeObserver(resize).observe(container);resize();
const clock=new THREE.Clock();let frame=0;
function animate(){
 const realDt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime,dt=state.paused||state.lives<=0?0:realDt*state.speed;simTime+=dt;frame++;
 for(const p of plots){if(!p.tower)continue;const data=p.tower.userData;
  for(const a of data.animated){if(a.type==='rotor')a.obj.rotation.z=-t*3.5;else if(a.type==='flame'){a.obj.scale.set(1+Math.sin(t*7)*.08,1+Math.cos(t*9)*.12,1);a.obj.rotation.y=t*.6;}else if(a.type==='float')a.obj.position.y=Math.sin(t*2)*.08;else if(a.type==='water'){a.obj.position.y=a.base+Math.sin(t*2+a.base)*.06;a.obj.rotation.z=Math.sin(t*.5)*.12;}else if(a.type==='rock'){a.obj.position.y=a.base+Math.sin(t*1.5)*.035;a.obj.rotation.y=t*.08;}else a.obj.rotation.y=t*(a.type==='lightning'?.5:.3);}
  if(data.recoil>0){data.recoil=Math.max(0,data.recoil-realDt);data.body.scale.y=1-Math.sin(data.recoil/.2*Math.PI)*.08;}else data.body.scale.y=1;
  if(dt>0){p.cooldown-=dt;if(p.cooldown<=0){const enemy=targetFor(p);if(enemy)attack(p,enemy);}}
 }
 if(dt>0){
  if(state.running&&state.pending>0){state.spawnTimer-=dt;if(state.spawnTimer<=0){const e=spawnEnemy();if(e){state.spawned++;state.pending--;}state.spawnTimer=.85;}}
  for(const e of enemies)updateEnemy(e,dt);updateProjectiles(dt);updateEffects(dt);if(frame%20===0)cleanupEnemies();
  if(state.running&&state.pending===0&&!enemies.some(e=>e.alive)&&projectiles.length===0){state.running=false;state.completed=state.wave;message(`ป้องกันเวฟ ${state.wave} สำเร็จ · เลือกจัดป้อมใหม่ หรือเริ่มเวฟถัดไป`);updateUI();}
 }else for(const e of enemies)e.bar.quaternion.copy(camera.quaternion).premultiply(e.group.quaternion.clone().invert());
 if(toastTimer>0){toastTimer-=realDt;if(toastTimer<=0)toast.textContent='เลือกธาตุแล้วคลิกแท่นว่าง · คลิกป้อมเพื่อดูระยะและทดสอบ';}
 portalRing.rotation.y=Math.sin(t*.6)*.08;uiTimer+=realDt;if(uiTimer>.15){updateUI();uiTimer=0;}controls.update();pixelRenderer.render();
}
renderer.setAnimationLoop(animate);
window.__battle={state,plots,enemies,projectiles,effects,ELEMENTS,renderer,scene,camera,vfx,sound,pixelRenderer,get selectedPlot(){return selectedPlot;},get selectedElement(){return selectedElement;},get showRange(){return showRange;},get night(){return night;},projectPlot(index){const v=plots[index].position.clone().add(new THREE.Vector3(0,.5,0)).project(camera),r=renderer.domElement.getBoundingClientRect();return{x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};}};
