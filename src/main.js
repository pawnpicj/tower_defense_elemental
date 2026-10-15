import { BATTLEFIELDS,createRoutes,routePosition } from './battlefields.js';
import { createBattlefield } from './battlefield-scene.js';
import { createGameFlow } from './game-flow.js';
import { BOSS_SKILLS,createBossSkill,tickBossSkill,splitBoss } from './boss-skills.js';
import { createSaveStore } from './save-game.js';
import { createCampaign } from './campaign.js';
import { ELEMENTS } from './tower-data.js';
import { towerFactory,animateTowerVisuals } from './towers.js';
import { createPalette,createModelKit } from './model-kit.js';
import * as THREE from 'three';
import { monsterFactory,animateMonster } from './monsters.js';
import { FAMILIES,ARCHETYPES,wavePlan,monsterStats,damageResult,elementStatus,sameCombatGroup } from './combat.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createVFX } from './vfx.js';
import { createTowerAudio } from './audio.js';
import { toonMaterial } from './toon-style.js';
import { createEconomy,TOWER_COSTS,ECONOMY_RULES,towerStats } from './economy.js';

let currentMapId='forest',flowStage='welcome',gameFlow=null;
const keys=Object.keys(ELEMENTS);
const economy=createEconomy();
const campaign=createCampaign();let campaignKills=0,bossKills=0,resultShown=false,saveReady=false,saveSessionOwned=false;
const saveStore=createSaveStore(()=>window.localStorage);const initialSave=saveStore.read();let cachedSave=initialSave.save,saveError=initialSave.error||'';
for(const [key,e] of Object.entries(ELEMENTS)){
 document.querySelector('#tower-cards').insertAdjacentHTML('beforeend',`<button class="tower-card ${key==='earth'?'selected':''}" data-element="${key}" aria-pressed="${key==='earth'}" style="--element:${e.color};--tint:${e.tint}"><div class="element-icon"><span>${e.symbol}</span></div><div class="card-copy"><strong>ป้อม${e.name}</strong><small>${e.title}</small><p>${e.description} <b class="build-cost">${TOWER_COSTS[key].build} G</b></p></div></button>`);
 document.querySelector('#damage-bars').insertAdjacentHTML('beforeend',`<div class="damage-row" style="--element:${e.color}"><div class="damage-info"><span>${e.symbol} ${e.name}</span><span id="damage-${key}">0</span></div><div class="damage-track"><div class="damage-fill" id="bar-${key}"></div></div></div>`);
}
const container=document.querySelector('#scene');let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(error){document.querySelector('#error').hidden=false;document.querySelector('#error').textContent='เปิดฉาก 3D ไม่สำเร็จ กรุณาเปิด WebGL / การเร่งกราฟิกในเบราว์เซอร์';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
container.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','สนามรบ 3D คลิกแท่นเพื่อเลือกป้อม ลากเพื่อหมุน เลื่อนเพื่อซูม');
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-16,16,13,-13,.1,160),initialCamera=new THREE.Vector3(28,28.2,28);camera.position.copy(initialCamera);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.2,0);controls.enableDamping=false;controls.enablePan=false;controls.minZoom=.75;controls.maxZoom=3.5;const isoPolar=Math.acos(1/Math.sqrt(3));controls.minPolarAngle=isoPolar;controls.maxPolarAngle=isoPolar;controls.update();

controls.addEventListener('end',()=>{const offset=camera.position.clone().sub(controls.target),radius=Math.hypot(offset.x,offset.z),angle=Math.atan2(offset.x,offset.z),snap=Math.round((angle-Math.PI/4)/(Math.PI/2))*Math.PI/2+Math.PI/4;camera.position.x=controls.target.x+Math.sin(snap)*radius;camera.position.z=controls.target.z+Math.cos(snap)*radius;controls.update();});
const hemi=new THREE.HemisphereLight(0xe9f7ff,0x667c48,1.8);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe5b5,3.0);sun.position.set(-8,22,13);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-19,right:19,top:16,bottom:-16,near:1,far:65});sun.shadow.bias=-.0003;sun.shadow.normalBias=.05;scene.add(sun);
const rim=new THREE.DirectionalLight(0xb5e8d4,1.1);rim.position.set(10,8,-12);scene.add(rim);
const world=new THREE.Group();scene.add(world);
const vfx=createVFX(scene,camera);
const sound=createTowerAudio({spatial(position){if(!position)return{pan:0,gain:1};const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);return{pan:position.clone().sub(controls.target).dot(right)/16,gain:.7+.3*Math.max(0,1-camera.position.distanceTo(position)/45)};}});
function material(color,extra={}){return toonMaterial(color,extra);}
const m=createPalette(material);

const elementMats={},brightMats={};for(const key of keys){elementMats[key]=material(ELEMENTS[key].color);brightMats[key]=material(ELEMENTS[key].color,{emissive:ELEMENTS[key].color,emissiveIntensity:.75,roughness:.26,metalness:.2});}
const {mesh,box,cyl,ring,beam}=createModelKit(world);
function disposeTree(root){root.traverse(o=>{if(o.geometry&&!o.userData.sharedGeometry)o.geometry.dispose();});root.removeFromParent();}
let terrain=createBattlefield(world,BATTLEFIELDS[currentMapId],m),routes=createRoutes(BATTLEFIELDS[currentMapId]);
function pathPosition(distance,out=new THREE.Vector3(),route=0){const p=routePosition(routes[route]||routes[0],distance);return out.set(p.x,.2,p.z);}
function nearestPathLocation(point){let best=Infinity,result={route:0,distance:0};for(let route=0;route<routes.length;route++)for(let d=0;d<=routes[route].length;d+=.2){const sq=pathPosition(d,new THREE.Vector3(),route).distanceToSquared(point);if(sq<best){best=sq;result={route,distance:d};}}return result;}
const buildTower=towerFactory({mesh,box,cyl,ring,beam,m,elementMats,brightMats});
const plotCoords=BATTLEFIELDS.forest.plots;
const plots=plotCoords.map(([x,z],i)=>{const group=new THREE.Group();group.position.set(x,.14,z);world.add(group);const pad=cyl(.95,1.04,.12,m.stone,0,.04,0,8,group);pad.userData.plotIndex=i;const edge=ring(.86,.025,m.gold,0,.12,0,group);edge.userData.plotIndex=i;box(.4,.02,.07,m.dark,0,.12,0,group).userData.plotIndex=i;box(.07,.02,.4,m.dark,0,.12,0,group).userData.plotIndex=i;return{index:i,available:true,position:new THREE.Vector3(x,.14,z),group,pad,tower:null,cooldown:.2+i*.1,shots:0};});
let selectedElement='earth',selectedPlot=0,showRange=true;
let plotMenuOpen=false;
const plotMenu=document.createElement('div');plotMenu.id='plot-menu';plotMenu.hidden=true;
plotMenu.innerHTML=`<div id="plot-actions" class="plot-actions" role="group" aria-label="จัดการป้อม"><button id="plot-upgrade" class="plot-action up"><span>↑ UP</span><small></small></button><button id="plot-sell" class="plot-action sell"><span>SELL ↗</span><small></small></button></div><div id="plot-build" class="plot-build" role="group" aria-label="เลือกป้อมเพื่อติดตั้ง"><div class="plot-build-heading"><strong>ติดตั้งป้อม</strong><button id="plot-menu-close" aria-label="ปิดเมนูป้อม">×</button></div><div class="plot-build-options"></div></div>`;
container.parentElement.appendChild(plotMenu);
for(const key of keys){const e=ELEMENTS[key];plotMenu.querySelector('.plot-build-options').insertAdjacentHTML('beforeend',`<button data-build="${key}" style="--element:${e.color};--tint:${e.tint}" aria-label="สร้างป้อม${e.name} ${TOWER_COSTS[key].build} G"><span class="build-symbol">${e.symbol}</span><strong>${e.name}</strong><small>${TOWER_COSTS[key].build} G</small></button>`);}
function closePlotMenu(){plotMenuOpen=false;plotMenu.hidden=true;}
plotMenu.querySelector('#plot-menu-close').addEventListener('click',closePlotMenu);
document.addEventListener('keydown',event=>{if(event.key==='Escape')closePlotMenu();});
plotMenu.querySelector('#plot-upgrade').addEventListener('click',()=>document.querySelector('#upgrade').click());
plotMenu.querySelector('#plot-sell').addEventListener('click',()=>document.querySelector('#remove').click());
plotMenu.querySelectorAll('[data-build]').forEach(button=>button.addEventListener('click',()=>{if(plots[selectedPlot].tower)return;selectElement(button.dataset.build);if(placeTower(selectedPlot,button.dataset.build))message(`วางป้อม${ELEMENTS[button.dataset.build].name} · แท่น ${selectedPlot+1}`);}));
function updatePlotMenu(){
 const record=economy.getTower(selectedPlot),locked=state.lives<=0||campaign.ended;
 plotMenu.querySelector('#plot-actions').hidden=!record;plotMenu.querySelector('#plot-build').hidden=!!record;
 const up=plotMenu.querySelector('#plot-upgrade'),cost=record&&record.level<3?TOWER_COSTS[record.key].upgrades[record.level-1]:null;
 up.disabled=!record||cost===null||economy.gold<cost||locked;up.querySelector('small').textContent=cost===null?'MAX LV.3':`${cost} G · LV.${record.level+1}`;up.setAttribute('aria-label',cost===null?'ระดับสูงสุดแล้ว':`อัปเกรดป้อมเป็นระดับ ${record.level+1} ราคา ${cost} G`);
 const sell=plotMenu.querySelector('#plot-sell');sell.disabled=!record||locked;sell.querySelector('small').textContent=`+${economy.sellValue(selectedPlot)} G`;sell.setAttribute('aria-label',`ขายป้อม ได้คืน ${economy.sellValue(selectedPlot)} G`);
 plotMenu.querySelectorAll('[data-build]').forEach(b=>{b.disabled=locked||economy.gold<TOWER_COSTS[b.dataset.build].build;});
 positionPlotMenu();
}
const menuPoint=new THREE.Vector3();
function positionPlotMenu(){
 if(!plotMenuOpen||campaign.ended){plotMenu.hidden=true;return;}
 const p=plots[selectedPlot],w=container.clientWidth,h=container.clientHeight;
 menuPoint.copy(p.position).add(new THREE.Vector3(0,p.tower?1.6:.5,0)).project(camera);
 const x=(menuPoint.x+1)*w/2,y=(1-menuPoint.y)*h/2;
 if(menuPoint.z< -1||menuPoint.z>1||x<0||x>w||y<0||y>h){plotMenu.hidden=true;return;}
 plotMenu.hidden=false;
 if(p.tower){const half=Math.min(124,(w-16)/2),cx=THREE.MathUtils.clamp(x,half+8,w-half-8);plotMenu.style.left=cx+'px';plotMenu.style.top=THREE.MathUtils.clamp(y,40,h-45)+'px';}
 else{const width=Math.min(310,w-24),height=136;plotMenu.style.setProperty('--build-menu-width',width+'px');plotMenu.style.left=THREE.MathUtils.clamp(x,width/2+8,w-width/2-8)+'px';plotMenu.style.top=THREE.MathUtils.clamp(y-height-12,12,h-height-12)+'px';}
}

const selectionMat=new THREE.MeshBasicMaterial({color:0xcba65c}),selection=ring(1.04,.04,selectionMat,plotCoords[0][0],.3,plotCoords[0][1],scene);
const rangeMat=new THREE.MeshBasicMaterial({color:ELEMENTS.earth.color,transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false});
const rangeRing=mesh(new THREE.RingGeometry(.985,1,96),rangeMat,0,.235,0,scene);rangeRing.rotation.x=-Math.PI/2;rangeRing.castShadow=false;rangeRing.receiveShadow=false;
const state={wave:0,lives:20,kills:0,escaped:0,totalDamage:0,damage:Object.fromEntries(keys.map(k=>[k,0])),shots:Object.fromEntries(keys.map(k=>[k,0])),effects:Object.fromEntries(keys.map(k=>[k,0])),running:false,paused:false,speed:1,pending:0,spawnTimer:0,waveSize:12,spawned:0,completed:0};
let activeWave=wavePlan(1);
state.combos={wetLightning:0,fireSpread:0,armorBreak:0};
const enemies=[],projectiles=[],effects=[];let enemyId=0,night=false,uiTimer=0,toastTimer=0,simTime=0;
const toast=document.querySelector('#toast');
function message(text){toast.textContent=text;toastTimer=5;}
function statsFor(p){return towerStats(ELEMENTS[p.tower.userData.key],p.tower.userData.level);}
function rebuildTower(index){const p=plots[index],record=economy.getTower(index);if(p.tower)disposeTree(p.tower);p.tower=null;if(record){const tower=buildTower(record.key,record.level);tower.position.copy(p.position);tower.scale.setScalar(1.22+(record.level-1)*.06);tower.traverse(o=>o.userData.plotIndex=index);world.add(tower);p.tower=tower;}p.cooldown=Math.max(p.cooldown,.2);updateSelection();updateUI();if(saveReady)saveCheckpoint();}
function placeTower(index,key){if(!plots[index]?.available)return false;if(state.lives<=0||campaign.ended)return false;const result=economy.purchase(index,key,{replace:!!plots[index].tower});if(!result.ok){message(result.reason==='same-element'?'ป้อมเป็นธาตุนี้แล้ว · ใช้ปุ่มอัปเกรดเพิ่มระดับ':`เงินไม่พอ · ต้องใช้ ${result.required||TOWER_COSTS[key].build} G`);updateSelection();return false;}rebuildTower(index);return true;}
function updateSelection(){
 const p=plots[selectedPlot],record=economy.getTower(selectedPlot),key=record?.key,e=key?statsFor(p):ELEMENTS[selectedElement],price=TOWER_COSTS[selectedElement].build,refund=economy.sellValue(selectedPlot),net=price-refund;
 selection.position.set(p.position.x,.3,p.position.z);rangeRing.position.set(p.position.x,.235,p.position.z);rangeRing.scale.setScalar(e.range);rangeRing.material.color.set(e.color);rangeRing.visible=showRange&&!!p.tower;
 document.querySelector('#slot-id').textContent=`PLOT ${String(selectedPlot+1).padStart(2,'0')}`;
 document.querySelector('#slot-name').textContent=record?`ป้อม${e.name} · LV.${record.level} / 3 · ${e.damage} DMG · ${e.range.toFixed(1)} m`:'แท่นว่าง · เลือกธาตุเพื่อสร้างป้อม';
 document.querySelector('#level-pips').innerHTML=[1,2,3].map(l=>`<span class="${record&&record.level>=l?'filled':''}">${l}</span>`).join('');
 const build=document.querySelector('#replace');build.textContent=record?`เปลี่ยนเป็น${ELEMENTS[selectedElement].name} · ${net>=0?'จ่าย '+net:'รับคืน '+Math.abs(net)} G`:`สร้างป้อม${ELEMENTS[selectedElement].name} · ${price} G`;if(record?.key===selectedElement)build.textContent='เลือกธาตุอื่นเพื่อเปลี่ยนป้อม';build.disabled=campaign.ended||state.lives<=0||record?.key===selectedElement||economy.gold<net;
 const upgrade=document.querySelector('#upgrade'),cost=record&&record.level<3?TOWER_COSTS[key].upgrades[record.level-1]:null;
 upgrade.textContent=!record?'เลือกป้อมเพื่ออัปเกรด':cost===null?'ระดับสูงสุดแล้ว · LV.3':`อัปเกรด LV.${record.level+1} · ${cost} G`;upgrade.disabled=!record||cost===null||economy.gold<cost||state.lives<=0||campaign.ended;
 document.querySelector('#upgrade-preview').textContent=cost!==null&&record?(()=>{const next=towerStats(ELEMENTS[key],record.level+1);return`ดาเมจ ${e.damage} → ${next.damage} · ระยะ ${e.range.toFixed(1)} → ${next.range.toFixed(1)} m · ช่วงยิง ${next.interval.toFixed(2)} s`;})():'อัปเกรดเพิ่มดาเมจ ระยะ และความเร็วโจมตี';
 const sell=document.querySelector('#remove');sell.textContent=record?`ขายป้อม · +${refund} G`:'ไม่มีป้อมให้ขาย';sell.disabled=!record||state.lives<=0||campaign.ended;
 document.querySelector('#test-attack').disabled=!p.tower||state.lives<=0||campaign.state.phase!=='idle';
 updatePlotMenu();
}
function selectPlot(index){if(!Number.isInteger(index)||!plots[index]?.available)return;selectedPlot=index;plotMenuOpen=true;updateSelection();}
function selectElement(key){selectedElement=key;document.querySelectorAll('[data-element]').forEach(b=>{const active=b.dataset.element===key;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});updateSelection();}
document.querySelectorAll('[data-element]').forEach(b=>b.addEventListener('click',()=>{selectElement(b.dataset.element);message(`เลือกธาตุ${ELEMENTS[selectedElement].name}แล้ว · คลิกฐานว่างเพื่อเปิดเมนูติดตั้ง หรือกดสร้างจากแผงด้านข้าง`);}));
document.querySelector('#replace').addEventListener('click',()=>{if(placeTower(selectedPlot,selectedElement))message(`วางป้อม${ELEMENTS[selectedElement].name}บนแท่น ${selectedPlot+1} แล้ว`);});
document.querySelector('#upgrade').addEventListener('click',()=>{if(state.lives<=0||campaign.ended)return;const result=economy.upgrade(selectedPlot);if(!result.ok){message(result.reason==='insufficient'?'เงินไม่พอสำหรับอัปเกรด':'ป้อมอัปเกรดไม่ได้');return;}rebuildTower(selectedPlot);vfx.cast(plots[selectedPlot].tower.userData.key,plots[selectedPlot].position.clone().add(new THREE.Vector3(0,2.5,0)));message(`อัปเกรดเป็นระดับ ${result.level} · ใช้ ${result.cost} G`);});
document.querySelector('#remove').addEventListener('click',()=>{if(state.lives<=0||campaign.ended)return;const result=economy.sell(selectedPlot);if(result.ok){rebuildTower(selectedPlot);message(`ขายป้อมแล้ว · ได้คืน ${result.refund} G (70% ของเงินลงทุน)`);}});

const raycaster=new THREE.Raycaster();let pointerDown=null;
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{if(!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>6){pointerDown=null;return;}pointerDown=null;const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hits=raycaster.intersectObjects([...plots.filter(p=>p.available).map(p=>p.group),...plots.filter(p=>p.tower).map(p=>p.tower)],true),hit=hits.find(h=>h.object.userData.plotIndex!==undefined);if(hit){selectPlot(hit.object.userData.plotIndex);message(plots[selectedPlot].tower?`เลือกป้อม${ELEMENTS[plots[selectedPlot].tower.userData.key].name} · UP เพื่ออัปเกรด / SELL เพื่อขาย`:'เลือกธาตุจากเมนูบนฐานเพื่อติดตั้งป้อม');}else closePlotMenu();});
const healthBackMat=new THREE.MeshBasicMaterial({color:0x3c493b}),healthMat=new THREE.MeshBasicMaterial({color:0x8cc96d});
const buildMonster=monsterFactory({material,mesh,box,cyl,ring,beam,m});
function spawnEnemy(options={}){
 if(enemies.length>=60)return null;
 const spec={...activeWave.roster[state.spawned%activeWave.count],...options};
 if(options.training&&!options.archetype)spec.archetype='normal';
 const stats=monsterStats(spec,Math.max(1,state.wave)),model=buildMonster(spec),g=model.group;world.add(g);
 if(options.minion)g.scale.multiplyScalar(.6);
 const hp=options.hp??stats.hp;
 const bar=new THREE.Group();bar.position.y=model.height;g.add(bar);
 mesh(new THREE.PlaneGeometry(spec.boss?1:.68,.075),healthBackMat,0,0,0,bar).castShadow=false;
 const fill=mesh(new THREE.PlaneGeometry(spec.boss?.96:.64,.045),healthMat,0,0,.005,bar);fill.castShadow=false;
 const statusMarkers=['water','earth','fire','wind'].map((key,i)=>{const icon=mesh(new THREE.OctahedronGeometry(.055),brightMats[key],(i-1)*.14,.16,0,bar);icon.visible=false;return icon;});
 const route=options.route??(options.training?0:state.spawned%routes.length);
 const e={route,minion:!!options.minion,parentBoss:options.parentBoss??null,skill:spec.boss?createBossSkill(spec.species):null,haste:0,statusMarkers,...stats,...model,id:++enemyId,group:g,bar,fill,hp,maxHp:hp,distance:options.distance??0,speed:options.speed??stats.speed,tank:spec.archetype==='armored',boss:!!spec.boss,archetype:spec.archetype,slow:0,wet:0,stun:0,armorBreak:0,burn:0,burnTick:0,alive:true,training:!!options.training,trainingPlot:options.trainingPlot??null,phase:enemyId*1.2};
 pathPosition(e.distance,g.position,e.route);enemies.push(e);return e;
}
function targetFor(p){const key=p.tower.userData.key;return enemies.filter(e=>e.alive&&(!e.training||e.trainingPlot===p.index)&&e.group.position.distanceTo(p.position)<statsFor(p).range).sort((a,b)=>(routes[a.route].length-a.distance)-(routes[b.route].length-b.distance))[0];}
function burst(position,key,count=9){vfx.burst(key,position,count);}
function shockwave(position,key,radius){vfx.impact(key,position,radius);}
function lightningBeam(from,to,hop=0){vfx.lightning(from,to);sound.play('lightning','impact',to,{delay:hop*.035,variant:hop});}
function comboEvent(kind,position){
 state.combos[kind]++;const names={wetLightning:'เปียก + สายฟ้า · ดาเมจ ×1.6',fireSpread:'ลมกระจายไฟ',armorBreak:'เกราะแตก · รับดาเมจ +20%'};
 document.querySelector('#combat-feed').textContent=names[kind];
 if(kind==='wetLightning'){vfx.impact('water',position,.8);vfx.burst('lightning',position,5);}
 if(kind==='armorBreak')vfx.burst('earth',position,4);
}
function applyDamage(enemy,amount,key){
 if(!enemy.alive)return;const result=damageResult(enemy,amount,key);
 if(result.wetLightning)comboEvent('wetLightning',enemy.group.position);
 const actual=Math.min(enemy.hp,result.amount);enemy.hp-=actual;state.damage[key]+=actual;state.totalDamage+=actual;
 if(enemy.hp<=0){enemy.alive=false;state.kills++;if(!enemy.training){campaignKills++;if(enemy.boss)bossKills++;}const reward=enemy.minion?0:economy.rewardKill(enemy.id,{tank:enemy.tank,training:enemy.training,boss:enemy.boss,bossReward:enemy.reward});if(reward)message(`${enemy.boss?'กำจัดบอส':'กำจัดศัตรู'} +${reward} G`);burst(enemy.group.position.clone().add(new THREE.Vector3(0,.5,0)),key,6);vfx.removeStatus(enemy.id);enemy.group.visible=false;if(enemy.boss){const skill=splitBoss(enemy.species,enemy.skill);if(skill)spawnBossMinions(enemy,skill.count,true);}}
}
function applyHit(enemy,key,position,shotStats=ELEMENTS[key]){
 const victims=key==='earth'||key==='fire'?enemies.filter(e=>e.alive&&sameCombatGroup(enemy,e)&&e.group.position.distanceTo(position)<(key==='earth'?1.55:1.45)):enemy.alive?[enemy]:[];
 for(const e of victims){
  // Wind spreads a burning target's fire even if the wind hit is lethal.
  if(key==='wind'&&e.burn>0){const neighbors=enemies.filter(n=>n!==e&&n.group.position.distanceTo(e.group.position)<2);const result=elementStatus(e,key,shotStats,neighbors);if(result.spread){comboEvent('fireSpread',e.group.position);for(const n of neighbors)if(n.alive&&sameCombatGroup(e,n)&&n.burn>0)vfx.impact('fire',n.group.position,.6);}}
  applyDamage(e,shotStats.damage,key);if(!e.alive)continue;
  if(key!=='wind'||e.burn<=0)elementStatus(e,key,shotStats);
  if(key==='earth')comboEvent('armorBreak',e.group.position);
  state.effects[key]++;
 }
 vfx.impact(key,enemyAim(enemy));sound.play(key,'impact',position);
}
function enemyAim(enemy){return enemy.group.position.clone().add(new THREE.Vector3(0,(enemy.hitHeight||.65)*enemy.group.scale.y,0));}
function attack(p,enemy){
 if(!p.tower||!enemy?.alive)return;const key=p.tower.userData.key,shotStats=statsFor(p);p.cooldown=shotStats.interval;p.shots++;state.shots[key]++;p.tower.userData.recoil=.2;const mountName={earth:'earth-floating-core',water:'water-floating-drop',wind:'wind-round-hub',fire:'fireball-core',lightning:'tesla-floating-crystal'}[key],mount=p.tower.getObjectByName(mountName),source=mount?mount.getWorldPosition(new THREE.Vector3()):p.position.clone().add(new THREE.Vector3(0,2.65*p.tower.scale.y,0));if(key==='water')source.y+=.38*p.tower.scale.y;vfx.cast(key,source);sound.play(key,'cast',source);
 if(key==='lightning'){const hit=new Set();let current=enemy,origin=source;for(let i=0;i<3&&current;i++){hit.add(current.id);const target=enemyAim(current);lightningBeam(origin,target,i);applyDamage(current,shotStats.damage*Math.pow(.78,i),key);burst(target,key,5);state.effects.lightning++;origin=target;current=enemies.filter(e=>e.alive&&sameCombatGroup(enemy,e)&&!hit.has(e.id)&&e.group.position.distanceTo(origin)<3.35).sort((a,b)=>a.group.position.distanceTo(origin)-b.group.position.distanceTo(origin))[0];}}
 else{const visual=vfx.projectile(key,source),object=visual.group;const duration=Math.max(.15,source.distanceTo(enemy.group.position)/ELEMENTS[key].projectile);projectiles.push({object,visual,key,shotStats,enemy,source,age:-.12,duration,target:enemy.group.position.clone()});}
}
function spawnBossMinions(boss,count,split=false){
 let spawned=0;for(let i=0;i<count;i++){
  const stats=monsterStats({species:boss.species,archetype:'normal',boss:false},Math.max(1,state.wave));
  const e=spawnEnemy({species:boss.species,archetype:'normal',boss:false,hpFactor:1,rewardFactor:1,hp:stats.hp*.35,speed:boss.species==='zombie'?1.2:stats.speed,distance:Math.max(0,boss.distance-i*.45),route:boss.route,minion:true,parentBoss:boss.id,training:boss.training,trainingPlot:boss.trainingPlot});if(!e)break;spawned++;
 }
 if(!split&&boss.skill)boss.skill.summoned+=spawned;
 if(spawned){const key=boss.species==='slime'?'water':boss.species==='spider'?'wind':'lightning';vfx.cast(key,enemyAim(boss));document.querySelector('#combat-feed').textContent=`${boss.species.toUpperCase()} · ${split?'แยกร่าง':'เรียกฝูง'} +${spawned}`;}
 return spawned;
}
function updateBoss(e,dt){
 if(!e.boss||e.stun>0)return;const rule=tickBossSkill(e.species,e.skill,dt);if(!rule)return;
 if(rule.kind==='summon')spawnBossMinions(e,Math.min(rule.count,rule.max-e.skill.summoned));
 if(rule.kind==='haste'){
  let count=0;for(const other of enemies)if(other.alive&&!other.boss&&sameCombatGroup(e,other)&&other.group.position.distanceTo(e.group.position)<=rule.radius){other.haste=rule.duration;count++;}
  vfx.impact('wind',e.group.position,rule.radius*.5);if(count)document.querySelector('#combat-feed').textContent=`Orc คำราม · เร่งฝูง ${count} ตัว +25%`;
 }
}
function updateEnemy(e,dt){
 if(!e.alive)return;e.haste=Math.max(0,e.haste-dt);e.slow=Math.max(0,e.slow-dt);e.stun=Math.max(0,e.stun-dt);e.wet=Math.max(0,e.wet-dt);e.armorBreak=Math.max(0,e.armorBreak-dt);
 if(e.burn>0){e.burn=Math.max(0,e.burn-dt);e.burnTick+=dt;while(e.burnTick>=.5&&e.alive){e.burnTick-=.5;applyDamage(e,e.burnDamage||8,'fire');burst(e.group.position.clone().add(new THREE.Vector3(0,.6,0)),'fire',3);}}if(!e.alive)return;updateBoss(e,dt);
 if(e.stun<=0)e.distance+=e.speed*(e.slow>0?.5:1)*(e.haste>0?1.25:1)*dt;
 if(e.distance>=routes[e.route].length){e.alive=false;e.group.visible=false;vfx.removeStatus(e.id);if(e.training)return;state.lives=Math.max(0,state.lives-e.baseDamage);state.escaped++;if(state.lives===0){campaign.lose();finishCampaign();}return;}
 pathPosition(e.distance,e.group.position,e.route);const next=pathPosition(e.distance+.1,new THREE.Vector3(),e.route);e.group.rotation.y=Math.atan2(next.x-e.group.position.x,next.z-e.group.position.z);
 animateMonster(e,simTime,{moving:true,stunned:e.stun>0,phase:e.phase});
 e.bar.quaternion.copy(camera.quaternion).premultiply(e.group.quaternion.clone().invert());e.fill.scale.x=Math.max(0,e.hp/e.maxHp);e.fill.position.x=-(e.boss?.48:.32)*(1-e.hp/e.maxHp);e.statusMarkers.forEach((o,i)=>o.visible=[e.wet>0,e.armorBreak>0,e.burn>0,e.haste>0][i]);vfx.status(e);
}
function updateProjectiles(dt){
 for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.age+=dt;if(p.enemy.alive)p.target.copy(p.enemy.group.position);const t=THREE.MathUtils.clamp(p.age/p.duration,0,1),position=p.source.clone().lerp(p.target.clone().add(new THREE.Vector3(0,(p.enemy.hitHeight||.65)*p.enemy.group.scale.y,0)),t);position.y+=Math.sin(t*Math.PI)*(p.key==='earth'?1.0:p.key==='water'?.28:p.key==='fire'?.12:0);p.visual.update(position,t,dt);if(t>=1){applyHit(p.enemy,p.key,p.target,p.shotStats);p.visual.dispose();projectiles.splice(i,1);}}
}
function updateEffects(dt){vfx.update(dt);}
function cleanupEnemies(){for(let i=enemies.length-1;i>=0;i--)if(!enemies[i].alive&&!projectiles.some(p=>p.enemy===enemies[i])){vfx.removeStatus(enemies[i].id);disposeTree(enemies[i].group);enemies.splice(i,1);}}
function clearTraining(){for(const e of enemies)if(e.training){e.alive=false;e.group.visible=false;vfx.removeStatus(e.id);}for(let i=projectiles.length-1;i>=0;i--)if(projectiles[i].enemy.training){projectiles[i].visual.dispose();projectiles.splice(i,1);}cleanupEnemies();}
function startWave(){
 if(!['setup','combat'].includes(flowStage)||gameFlow?.openDialog)return;
 if(campaign.ended){const dialog=document.querySelector('#campaign-result');if(!dialog.open)dialog.showModal();return;}
 if(state.running||state.lives<=0)return;
 if(campaign.state.phase==='idle'){clearTraining();state.kills=state.escaped=state.totalDamage=0;campaignKills=bossKills=0;keys.forEach(k=>{state.damage[k]=state.shots[k]=state.effects[k]=0;});Object.keys(state.combos).forEach(k=>state.combos[k]=0);saveSessionOwned=true;saveCheckpoint();}
 const wave=campaign.begin();if(wave===null)return;state.wave=wave;activeWave=wavePlan(wave);state.waveSize=activeWave.count;state.pending=state.waveSize;state.spawnTimer=0;state.spawned=0;state.running=true;state.paused=false;flowStage='combat';
 message(`เวฟ ${state.wave}/50 · ${activeWave.family.name}${activeWave.boss?' · บอสกำลังมา!':''}`);updateUI();
}
function finishCampaign(){
 state.running=false;state.pending=0;state.paused=false;sound.stopAll();if(resultShown)return;resultShown=true;
 const won=campaign.state.phase==='won',best=keys.reduce((a,b)=>state.damage[b]>state.damage[a]?b:a),seconds=Math.round(campaign.state.elapsed);
 document.querySelector('#result-eyebrow').textContent=won?'CAMPAIGN COMPLETE':'BASE FALLEN';document.querySelector('#result-title').textContent=won?'ชนะแล้ว!':'ฐานถูกทำลาย';document.querySelector('#result-description').textContent=won?'ผ่านครบ 50 เวฟ และหยุดกองทัพ Orc ได้สำเร็จ':`หยุดที่เวฟ ${state.wave} · ลองปรับตำแหน่งและอัปเกรดป้อมแล้วสู้ใหม่`;
 document.querySelector('#result-stats').innerHTML=[['ผ่านเวฟ',`${campaign.state.completed} / 50`],['กำจัดศัตรู',campaignKills],['กำจัดบอส',`${bossKills} / 6`],['พลังฐาน',`${state.lives} / 20`],['รางวัลรวม',`${economy.earned.toLocaleString()} G`],['เงินคงเหลือ',`${economy.gold.toLocaleString()} G`],['เวลาเล่น',`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`],['ธาตุทำดาเมจสูงสุด',state.totalDamage?`ป้อม${ELEMENTS[best].name} · ${Math.round(state.damage[best]).toLocaleString()}`:'—']].map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('');
 document.querySelector('#result-continue').hidden=!cachedSave||cachedSave.completed>=50;const dialog=document.querySelector('#campaign-result');dialog.dataset.outcome=won?'won':'lost';if(!dialog.open)dialog.showModal();updateUI();
}

function resetBattle(){flowStage='setup';closePlotMenu();saveSessionOwned=false;const previousSaveReady=saveReady;saveReady=false;campaign.reset();campaignKills=bossKills=0;resultShown=false;document.querySelector('#campaign-result').close();activeWave=wavePlan(1);Object.keys(state.combos).forEach(k=>state.combos[k]=0);document.querySelector("#combat-feed").textContent="ใช้น้ำก่อนสายฟ้า · ใช้ไฟก่อนลม · ดินเปิดเกราะ";economy.reset();sound.stopAll();enemies.forEach(e=>disposeTree(e.group));enemies.length=0;projectiles.forEach(p=>p.visual.dispose());projectiles.length=0;vfx.clear();effects.forEach(e=>{e.group.removeFromParent();if(e.owned){e.group.geometry.dispose();e.group.material.dispose();}});effects.length=0;Object.assign(state,{wave:0,lives:20,kills:0,escaped:0,totalDamage:0,running:false,paused:false,speed:1,pending:0,spawnTimer:0,waveSize:12,spawned:0,completed:0});keys.forEach(k=>{state.damage[k]=0;state.shots[k]=0;state.effects[k]=0;});plots.forEach(p=>{if(p.tower){disposeTree(p.tower);p.tower=null;}});selectedPlot=0;camera.position.copy(initialCamera);camera.zoom=1;camera.updateProjectionMatrix();controls.target.set(0,.2,0);controls.update();selectElement('earth');keys.forEach((key,i)=>placeTower(i,key));saveReady=true;updateSelection();updateUI();message(`รีเซ็ตแล้ว · เงิน ${economy.gold} G และป้อมเริ่มต้น 5 ธาตุ`);saveReady=previousSaveReady;}
function updateSaveUI(){
 const active=campaign.state.phase==='fighting';document.querySelector('#save-game').disabled=active||campaign.state.phase==='lost';
 document.querySelector('#continue-game').disabled=!cachedSave||(!campaign.ended&&campaign.state.phase!=='idle');
 document.querySelector('#continue-game').textContent=cachedSave?cachedSave.completed===50?'ดูผลเซฟที่จบแล้ว':`เล่นต่อเวฟ ${cachedSave.completed+1}`:'เล่นต่อจากเซฟ';
 document.querySelector('#save-status').textContent=saveError|| (cachedSave?`เซฟล่าสุด: ${BATTLEFIELDS[cachedSave.battlefield??'forest'].name} · จบเวฟ ${cachedSave.completed} · ${cachedSave.economy.gold.toLocaleString()} G${active?' · เซฟอีกครั้งเมื่อจบเวฟ':''}`:'ยังไม่มีเซฟ · เซฟอัตโนมัติหลังจบเวฟ');
}
function saveCheckpoint({manual=false}={}){
 if(!saveReady||!['setup','combat'].includes(flowStage)||!['idle','intermission','won'].includes(campaign.state.phase))return false;
 if(!manual&&campaign.state.phase==='idle'&&cachedSave?.completed>0&&!saveSessionOwned)return false;
 const idle=campaign.state.phase==='idle',zero=()=>Object.fromEntries(keys.map(k=>[k,0]));
 const data={version:1,battlefield:currentMapId,savedAt:new Date().toISOString(),completed:campaign.state.completed,lives:state.lives,elapsed:campaign.state.elapsed,lastEnemyId:enemyId,speed:state.speed,kills:idle?0:campaignKills,bossKills:idle?0:bossKills,escaped:idle?0:state.escaped,totalDamage:idle?0:state.totalDamage,damage:idle?zero():{...state.damage},shots:idle?zero():{...state.shots},effects:idle?zero():{...state.effects},combos:idle?{wetLightning:0,fireSpread:0,armorBreak:0}:{...state.combos},economy:economy.snapshot()};
 const result=saveStore.write(data);saveError=result.error||'';if(result.ok){cachedSave=data;saveSessionOwned=true;}updateSaveUI();return result.ok;
}
function resumeSavedGame(){
 const result=saveStore.read();if(!result.save){saveError=result.error||'ไม่พบเซฟ';updateSaveUI();return false;}
 const data=result.save;saveReady=false;applyBattlefield(data.battlefield??'forest');resetBattle();economy.restore(data.economy,data.completed);
 Object.assign(campaign.state,{phase:data.completed===50?'won':data.completed===0?'idle':'intermission',wave:data.completed,completed:data.completed,remaining:data.completed&&data.completed<50?8:0,elapsed:data.elapsed});
 Object.assign(state,{wave:data.completed,completed:data.completed,lives:data.lives,kills:data.kills,escaped:data.escaped,totalDamage:data.totalDamage,speed:data.speed,paused:data.completed>0&&data.completed<50,running:false,pending:0});
 for(const field of ['damage','shots','effects','combos'])Object.assign(state[field],data[field]);campaignKills=data.kills;bossKills=data.bossKills;enemyId=Math.max(enemyId,data.lastEnemyId);activeWave=wavePlan(Math.max(1,data.completed));
 for(let i=0;i<8;i++)rebuildTower(i);flowStage=data.completed?'combat':'setup';gameFlow?.close();cachedSave=data;saveError='';saveReady=true;saveSessionOwned=true;updateUI();
 if(data.completed===50)finishCampaign();else message(`โหลดเซฟจบเวฟ ${data.completed} แล้ว · ${data.completed?'กดเล่นต่อหรือเริ่มเวฟถัดไป':'พร้อมเริ่มแคมเปญ'}`);return true;
}
document.querySelector('#save-game').addEventListener('click',()=>{if(saveCheckpoint({manual:true}))message('บันทึกเกมเรียบร้อยแล้ว');});
document.querySelector('#continue-game').addEventListener('click',resumeSavedGame);document.querySelector('#result-continue').addEventListener('click',resumeSavedGame);
document.querySelector('#start').addEventListener('click',startWave);
document.querySelector('#pause').addEventListener('click',()=>{if(campaign.ended||(!state.running&&campaign.state.phase!=='intermission'&&!enemies.some(e=>e.alive)))return;state.paused=!state.paused;if(state.paused)sound.stopAll();updateUI();});
document.querySelector('#speed').addEventListener('click',()=>{state.speed=state.speed===3?1:state.speed+1;updateUI();});
document.querySelector('#reset').addEventListener('click',resetBattle);
document.querySelector('#result-retry').addEventListener('click',resetBattle);document.querySelector('#result-close').addEventListener('click',()=>document.querySelector('#campaign-result').close());
function focusTower(){const p=plots[selectedPlot],target=p.position.clone().add(new THREE.Vector3(0,1.1,0));controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(28,28,28));camera.zoom=2.5;camera.updateProjectionMatrix();controls.update();}
document.querySelector('#focus-tower').addEventListener('click',focusTower);
function testMonster(){if(campaign.state.phase!=='idle')return;const p=plots[selectedPlot];if(!p.tower||state.lives<=0)return;focusTower();if(enemies.length>55){message('สนามมีศัตรูเต็มแล้ว รอสักครู่หรือรีเซ็ต');return;}state.paused=false;const location=nearestPathLocation(p.position),distance=location.distance,spec={route:location.route,species:document.querySelector('#training-species').value,archetype:document.querySelector('#training-role').value,boss:document.querySelector('#training-boss').checked};const enemy=spawnEnemy({...spec,distance,hp:spec.boss?3360:280,speed:.55,training:true,trainingPlot:p.index});if(!enemy)return;if(p.tower.userData.key==='lightning'&&!spec.boss)for(let i=1;i<3;i++)spawnEnemy({...spec,distance:Math.max(0,distance-i*.75),hp:280,speed:.55,training:true,trainingPlot:p.index});attack(p,enemy);message(`ทดสอบป้อม${ELEMENTS[p.tower.userData.key].name} · ${spec.species} · ${ARCHETYPES[spec.archetype].name}${spec.boss?' · BOSS':''}`);updateUI();}
document.querySelector('#test-attack').addEventListener('click',testMonster);
document.querySelector('#preview-monster').addEventListener('click',testMonster);
document.querySelector('#range-toggle').addEventListener('click',e=>{showRange=!showRange;e.currentTarget.setAttribute('aria-pressed',String(showRange));updateSelection();});
document.querySelector('#reset-camera').addEventListener('click',()=>{camera.position.copy(initialCamera);camera.zoom=1;camera.updateProjectionMatrix();controls.target.set(0,.2,0);controls.update();});
document.querySelector('#theme').addEventListener('click',e=>{night=!night;document.body.classList.toggle('night',night);e.currentTarget.textContent=night?'☀':'☾';hemi.intensity=night?.7:1.8;sun.intensity=night?.6:3.0;rim.intensity=night?2.7:1.1;renderer.toneMappingExposure=night?.85:.95;keys.forEach(k=>brightMats[k].emissiveIntensity=night?1.5:.75);});
function updateUI(){
 if(document.querySelector('#journey-step'))updateJourney();
 updateSaveUI();
 const preview=wavePlan(Math.min(50,(state.running||campaign.ended)?Math.max(1,state.wave):state.wave+1));
 document.querySelector('#wave-intel').textContent=`${campaign.ended?'สิ้นสุดแคมเปญ':state.running?'กำลังต่อสู้':'เวฟถัดไป'} ${preview.wave} · ${preview.family.name} · ${preview.count} ตัว${preview.boss?' · BOSS ปิดท้ายเวฟ':''}`;
 document.querySelectorAll('[data-stage]').forEach(el=>el.classList.toggle('active',Number(el.dataset.stage)===preview.stage));
 document.querySelector('#combo-counts').textContent=`ช็อตเปียก ${state.combos.wetLightning} · กระจายไฟ ${state.combos.fireSpread} · เปิดเกราะ ${state.combos.armorBreak}`;
 const boss=enemies.find(e=>e.alive&&e.boss&&!e.training),bossHud=document.querySelector('#boss-hud');bossHud.hidden=!boss;
 if(boss){const bossCount=enemies.filter(e=>e.alive&&e.boss&&!e.training).length;document.querySelector('#boss-skill-text').textContent=BOSS_SKILLS[boss.species]?.description||'';document.querySelector('#boss-name').textContent=`BOSS · ${boss.species.toUpperCase()}${bossCount>1?' +'+(bossCount-1):''}`;document.querySelector('#boss-hp').textContent=`${Math.ceil(boss.hp).toLocaleString()} / ${boss.maxHp.toLocaleString()}`;document.querySelector('#boss-fill').style.width=`${boss.hp/boss.maxHp*100}%`;}
 document.querySelector('#gold').textContent=economy.gold.toLocaleString();document.querySelector('#gold-earned').textContent=`รางวัลสะสม ${economy.earned} G`;updateSelection();
 document.querySelector('#wave').textContent=String(state.wave).padStart(2,'0');document.querySelector('#lives').textContent=state.lives;document.querySelector('#kills').textContent=state.kills;document.querySelector('#alive').textContent=enemies.filter(e=>e.alive).length;document.querySelector('#total-damage').textContent=Math.round(state.totalDamage).toLocaleString();
 document.querySelector('#campaign-progress').value=campaign.state.completed;document.querySelector('#campaign-label').textContent=`แคมเปญ ${campaign.state.completed} / 50 เวฟ`;document.querySelector('#auto-status').textContent=campaign.ended?(campaign.state.phase==='won'?'ชนะครบ 50 เวฟ':'ฐานถูกทำลาย'):campaign.state.phase==='intermission'?`${state.paused?'หยุดพัก · ':''}เวฟ ${state.wave+1} เริ่มใน ${Math.ceil(campaign.state.remaining)} วินาที`:campaign.state.phase==='fighting'?'AUTO · ต่อเวฟอัตโนมัติ':'พักระหว่างเวฟ 8 วินาที · ปุ่มหยุดจะพักเวลานับถอยหลังด้วย';
 document.querySelector('#wave-detail').textContent=campaign.state.phase==='won'?'ชนะครบ 50 เวฟ':state.lives<=0?'ฐานถูกทำลาย · รีเซ็ตเพื่อเริ่มใหม่':state.running?`เกิดแล้ว ${state.spawned} / ${state.waveSize} ตัว`:state.wave?`เวฟ ${state.completed} จบแล้ว · พร้อมเวฟถัดไป`:'พร้อมทดสอบการป้องกัน';
 const max=Math.max(1,...Object.values(state.damage));for(const key of keys){document.querySelector(`#damage-${key}`).textContent=Math.round(state.damage[key]).toLocaleString();document.querySelector(`#bar-${key}`).style.width=`${state.damage[key]/max*100}%`;}
 document.querySelector('#tower-count').textContent=`${plots.filter(p=>p.tower).length} / ${BATTLEFIELDS[currentMapId].plots.length} TOWERS PLACED`;document.querySelector('#state-badge').textContent=campaign.state.phase==='won'?'ชนะครบ 50 เวฟ':state.lives<=0?'ฐานถูกทำลาย':state.paused?'หยุดชั่วคราว':state.running?'กำลังต่อสู้':enemies.some(e=>e.alive)?'ทดสอบโจมตี':'พร้อมเริ่ม';
 const start=document.querySelector('#start');start.disabled=state.running||!['setup','combat'].includes(flowStage);start.innerHTML=campaign.ended?'ดูผลการเล่น':`▶ ${campaign.state.phase==='intermission'?'เริ่มเวฟถัดไปทันที':state.wave?'กำลังต่อสู้':'เริ่มแคมเปญ'} <span>${state.running?state.waveSize:preview.count} ENEMIES</span>`;
 const pause=document.querySelector('#pause');pause.disabled=campaign.ended||state.lives<=0||(!state.running&&campaign.state.phase!=='intermission'&&!enemies.some(e=>e.alive));pause.textContent=state.paused?'▶ เล่นต่อ':'Ⅱ หยุดชั่วคราว';document.querySelector('#speed').textContent=`${state.speed}×`;document.querySelector('#test-attack').disabled=!plots[selectedPlot].tower||state.lives<=0||campaign.ended;document.querySelector('#preview-monster').disabled=document.querySelector('#test-attack').disabled=campaign.state.phase!=='idle'||!plots[selectedPlot].tower||state.lives<=0;
}
keys.forEach((key,i)=>placeTower(i,key));saveReady=true;updateSelection();updateUI();
function resize(){const w=container.clientWidth,h=container.clientHeight,aspect=w/h,frustumHeight=Math.max(22,32/aspect);camera.left=-frustumHeight*aspect/2;camera.right=frustumHeight*aspect/2;camera.top=frustumHeight/2;camera.bottom=-frustumHeight/2;camera.updateProjectionMatrix();renderer.setSize(w,h);vfx.setViewportHeight(h*renderer.getPixelRatio());}


new ResizeObserver(resize).observe(container);resize();
const clock=new THREE.Clock();let frame=0;
function stepBattle(dt,realDt=dt/state.speed){
 if(gameFlow?.openDialog)return;
 if(campaign.ended)return;
 if(campaign.tick(realDt,state.paused))startWave();
 if(dt<=0||state.paused)return;
 for(const p of plots)if(p.tower){p.cooldown-=dt;if(p.cooldown<=0){const enemy=targetFor(p);if(enemy)attack(p,enemy);}}
 if(state.running&&state.pending>0){state.spawnTimer-=dt;if(state.spawnTimer<=0){const e=spawnEnemy(activeWave.roster[state.spawned]);if(e){state.spawned++;state.pending--;}state.spawnTimer=activeWave.spawnInterval;}}
 for(const e of enemies){if(campaign.ended)break;updateEnemy(e,dt);}
 if(campaign.ended)return;updateProjectiles(dt);updateEffects(dt);cleanupEnemies();
 if(state.running&&state.pending===0&&!enemies.some(e=>e.alive&&!e.training)&&!projectiles.some(p=>!p.enemy.training)){
  state.running=false;state.completed=state.wave;const bonus=economy.rewardWave(state.wave);campaign.clear(state.lives);saveCheckpoint();
  if(campaign.ended)finishCampaign();else{message(`จบเวฟ ${state.wave} · โบนัส +${bonus} G · เตรียมตัว 8 วินาที`);updateUI();}
 }
}
function animate(){
 const realDt=Math.min(clock.getDelta(),.25),t=clock.elapsedTime,dt=state.paused||state.lives<=0||campaign.ended?0:Math.min(realDt,.05)*state.speed;simTime+=dt;frame++;
 for(const p of plots){if(!p.tower)continue;const data=p.tower.userData;
  animateTowerVisuals(p.tower,t);
  if(data.recoil>0){data.recoil=Math.max(0,data.recoil-realDt);data.body.scale.y=1-Math.sin(data.recoil/.2*Math.PI)*.08;}else data.body.scale.y=1;
 }
 stepBattle(dt,realDt);
 if(dt===0)for(const e of enemies)e.bar.quaternion.copy(camera.quaternion).premultiply(e.group.quaternion.clone().invert());
 if(toastTimer>0){toastTimer-=realDt;if(toastTimer<=0)toast.textContent='คลิกฐานว่างเพื่อเลือกป้อม · คลิกป้อมเพื่ออัปเกรดหรือขาย';}
 terrain.update(t);uiTimer+=realDt;if(uiTimer>.15){updateUI();uiTimer=0;}controls.update();positionPlotMenu();renderer.render(scene,camera);
}
renderer.setAnimationLoop(animate);
window.__battle={get battlefield(){return currentMapId;},get flowStage(){return flowStage;},routes,state,plots,enemies,projectiles,effects,ELEMENTS,renderer,scene,camera,controls,vfx,sound,economy,statsFor,campaign,stepBattle,selectPlot,saveCheckpoint,resumeSavedGame,spawnEnemy,applyDamage,applyHit,startWave,wavePlan,monsterStats,renderStyle:'toon-cel-shaded',get selectedPlot(){return selectedPlot;},get selectedElement(){return selectedElement;},get showRange(){return showRange;},get night(){return night;},projectPlot(index){const v=plots[index].position.clone().add(new THREE.Vector3(0,.5,0)).project(camera),r=renderer.domElement.getBoundingClientRect();return{x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};}};

function applyBattlefield(id){const map=BATTLEFIELDS[id];if(!map)throw Error('Unknown battlefield');terrain.dispose();currentMapId=id;routes=createRoutes(map);terrain=createBattlefield(world,map,m);container.parentElement.style.background=map.id==='canyon'?'radial-gradient(ellipse,#f4edda,#ddd0af)':map.id==='ruins'?'radial-gradient(ellipse,#e5e8e3,#cbd3ce)':'';plots.forEach((p,i)=>{p.available=i<map.plots.length;p.group.visible=p.available;const point=map.plots[i]||[0,0];p.position.set(point[0],.14,point[1]);p.group.position.copy(p.position);});document.querySelector('#map-name').textContent=map.name+' · '+map.difficulty;document.querySelector('.field-top>div:first-child').innerHTML='<span class="live-dot"></span>'+map.subtitle+'<small>'+map.routes.length+' ประตู · '+map.plots.length+' จุดวางป้อม</small>';if(window.__battle)window.__battle.routes=routes;}
const menuBar=document.createElement('div');menuBar.className='journey-bar';menuBar.innerHTML='<div><span id="journey-step">03 · จัดการ Tower</span><strong id="map-name">ป่าเขียว · ง่าย</strong><small>เลือกฐานเพื่อสร้างป้อม · UP อัปเกรด · SELL ขาย · พร้อมแล้วกดเริ่มแคมเปญ</small></div><button id="choose-battlefield">เลือกสนามใหม่</button><button id="game-menu">เมนูหลัก</button>';document.querySelector('.wave-intelligence').before(menuBar);
function updateJourney(){document.querySelector('#journey-step').textContent=flowStage==='combat'?'04 · ต่อสู้ / แคมเปญ':'03 · จัดการ Tower';document.querySelector('#choose-battlefield').disabled=campaign.state.phase!=='idle'&&!campaign.ended;}
gameFlow=createGameFlow({getSave:()=>cachedSave,onContinue:resumeSavedGame,onBack:()=>{},onChoose(id){const prev=saveReady;saveReady=false;applyBattlefield(id);resetBattle();saveReady=prev;updateJourney();message('จัดการป้อมใน'+BATTLEFIELDS[id].name+' แล้วกดเริ่มแคมเปญเมื่อพร้อม');}});
document.querySelector('#choose-battlefield').onclick=()=>{if(campaign.state.phase==='idle'||campaign.ended)gameFlow.open('maps',true);};document.querySelector('#game-menu').onclick=()=>gameFlow.open('home',true);gameFlow.open();
