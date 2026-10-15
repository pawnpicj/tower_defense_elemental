import { BOSS_SKILLS } from './boss-skills.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ELEMENTS } from './tower-data.js';
import { TOWER_COSTS,towerStats,ECONOMY_RULES } from './economy.js';
import { FAMILIES,ARCHETYPES,monsterStats } from './combat.js';
import { towerFactory,animateTowerVisuals as animateTower } from './towers.js';
import { monsterFactory,animateMonster } from './monsters.js';
import { createPalette,createModelKit } from './model-kit.js';
import { toonMaterial } from './toon-style.js';
const $=selector=>document.querySelector(selector);
const MONSTERS=[
 {id:'slime',name:'Slime',thai:'สไลม์',symbol:'◉',color:'#78a945',tint:'#e0ebca',note:'สิ่งมีชีวิตเจลลี่ที่เด้งไปตามเส้นทาง',stage:0},
 {id:'rat',name:'Rat',thai:'หนู',symbol:'R',color:'#a17d50',tint:'#ece3cf',note:'นักล่าตัวเล็ก หูใหญ่และหางยาว',stage:1},
 {id:'spider',name:'Spider',thai:'แมงมุม',symbol:'S',color:'#956481',tint:'#ecdeea',note:'มอนสเตอร์แปดขาในฝูงหนูและแมงมุม',stage:1},
 {id:'goblin',name:'Goblin',thai:'ก็อบลิน',symbol:'G',color:'#668d47',tint:'#e1e8d1',note:'นักรบหูยาว ถือหอก พร้อมชุดหนังและกระเป๋าสะพาย',stage:2},
 {id:'skeleton',name:'Skeleton',thai:'โครงกระดูก',symbol:'K',color:'#9c916c',tint:'#ece8d8',note:'นักรบอันเดด เบ้าตาลึก ซี่โครงโปร่ง และดาบเหล็ก',stage:3},
 {id:'zombie',name:'Zombie',thai:'ซอมบี้',symbol:'Z',color:'#668e80',tint:'#dce8df',note:'อันเดดตาขุ่น เสื้อขาด เดินลากขาและยื่นแขนไปข้างหน้า',stage:3},
 {id:'orc',name:'Orc',thai:'ออร์ค',symbol:'O',color:'#547b47',tint:'#dce8d1',note:'นักรบล่ำไหล่กว้าง กรามหนัก เขี้ยวโค้ง และขวานศึกสองคม',stage:4}
];
const ABILITIES={
 earth:{name:'Stone Impact / Armor Break',text:'โจมตีหมู่รัศมี 1.55 m และสตัน 0.55 วินาที เปิดเกราะ 4 วินาที ลดต้านดิน/ลม 35 จุด และทำให้รับดาเมจทุกธาตุเพิ่ม 20%'},
 water:{name:'Tidal Slow / Wet',text:'ลดความเร็ว 50% นาน 2.2 วินาที และทำให้เปียก 5 วินาที สายฟ้าที่โจมตีเป้าหมายเปียกจะทำดาเมจเพิ่มเป็น ×1.6'},
 wind:{name:'Wind Push / Fan the Flames',text:'ผลักเป้าหมายกลับ 0.38 m ถ้าเป้าหมายติดไฟ จะกระจายความแรงและเวลาการเผาที่เหลือไปยังศัตรูในรัศมี 2 m'},
 fire:{name:'Fireball / Burning',text:'ระเบิดหมู่รัศมี 1.45 m และเผา 3 วินาที ดาเมจเผาคิดทุก 0.5 วินาที ใช้ลมยิงเป้าหมายที่ติดไฟเพื่อกระจายการเผา'},
 lightning:{name:'Chain Lightning / Conductivity',text:'ชิ่งสูงสุด 3 เป้าหมาย ระยะชิ่ง 3.35 m ดาเมจลดลง 22% ต่อครั้ง เป้าหมายเปียกจากป้อมน้ำจะรับสายฟ้าแรงขึ้น ×1.6'}
};
const params=new URLSearchParams(location.search);
const initialType=params.get('type')==='monster'?'monster':'tower';
const validTower=Object.hasOwn(ELEMENTS,params.get('id'))?params.get('id'):'earth';
const validMonster=MONSTERS.find(m=>m.id===params.get('id'))?.id||'slime';
const clampWave=value=>Math.min(999,Math.max(1,Math.floor(Number(value)||1)));
const selection={type:initialType,tower:validTower,monster:validMonster,level:[1,2,3].includes(Number(params.get('level')))?Number(params.get('level')):1,role:Object.hasOwn(ARCHETYPES,params.get('role'))?params.get('role'):'normal',boss:params.get('boss')==='1',wave:params.has('wave')?clampWave(params.get('wave')):(MONSTERS.find(m=>m.id===validMonster).stage*10+1)};
const scene=new THREE.Scene(),world=new THREE.Group();scene.add(world);
const camera=new THREE.PerspectiveCamera(36,1,.05,100);camera.position.set(6,4,7);
const hemi=new THREE.HemisphereLight(0xf0faff,0x6b8048,1.8);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe7c0,3);sun.position.set(-4,9,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-5,right:5,top:7,bottom:-4,near:1,far:30});sun.shadow.normalBias=.035;scene.add(sun);
const rim=new THREE.DirectionalLight(0xc2ebd7,1.1);rim.position.set(6,5,-7);scene.add(rim);
const m=createPalette(),helpers=createModelKit(world),elementMats={},brightMats={};
for(const [key,e] of Object.entries(ELEMENTS)){elementMats[key]=toonMaterial(e.color);brightMats[key]=toonMaterial(e.color,{emissive:e.color,emissiveIntensity:.75});}
const buildTower=towerFactory({...helpers,m,elementMats,brightMats}),buildMonster=monsterFactory({...helpers,m,material:toonMaterial});
const pedestal=new THREE.Group();world.add(pedestal);
helpers.cyl(1.65,1.72,.16,m.stone,0,.04,0,48,pedestal);helpers.cyl(1.58,1.65,.08,m.light,0,.16,0,48,pedestal);
const accentMaterial=toonMaterial('#b38d45'),pedestalRing=helpers.ring(1.62,.025,accentMaterial,0,.205,0,pedestal);
for(let i=0;i<12;i++){const a=i*Math.PI/6;const mark=helpers.box(.045,.012,.12,accentMaterial,Math.sin(a)*1.43,.21,Math.cos(a)*1.43,pedestal);mark.rotation.y=a;}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.06;floor.receiveShadow=true;scene.add(floor);
let renderer,controls,current=null,autoRotate=true,animated=true,fitDistance=8,t=0;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;$('#model-canvas').append(renderer.domElement);renderer.domElement.setAttribute('aria-label','โมเดล 3D ลากเพื่อหมุน เลื่อนเพื่อซูม');controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.autoRotate=true;controls.autoRotateSpeed=1;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI*.49;}catch(error){$('#viewer-error').hidden=false;console.error(error);}
function disposeModel(){if(!current)return;current.group.traverse(o=>{if(o.geometry&&!o.userData.sharedGeometry)o.geometry.dispose();});current.group.removeFromParent();current=null;}
function fitModel(){
 if(!current||!controls)return;
 current.group.updateMatrixWorld(true);pedestal.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(current.group).union(new THREE.Box3().setFromObject(pedestal)),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 fitDistance=Math.max(size.y,size.x/camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.15;
 controls.target.copy(center);
 const direction=new THREE.Vector3(5,3.3,6).normalize(),points=[];
 for(const root of [current.group,pedestal])root.traverse(o=>{if(!o.isMesh)return;const positions=o.geometry.getAttribute('position');for(let i=0;i<positions.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld));});
 for(let step=0;step<4;step++){
  camera.position.copy(center).addScaledVector(direction,fitDistance);camera.lookAt(center);camera.updateMatrixWorld();
  let projectedExtent=0;
  for(const point of points){const v=point.clone().project(camera);projectedExtent=Math.max(projectedExtent,Math.abs(v.x),Math.abs(v.y));}
  if(projectedExtent<=.88)break;fitDistance*=projectedExtent/.85;
 }
 camera.position.copy(center).addScaledVector(direction,fitDistance);controls.minDistance=fitDistance*.5;controls.maxDistance=fitDistance*2.5;camera.near=.05;camera.far=Math.max(100,fitDistance*4);camera.updateProjectionMatrix();controls.update();
}

function resize(){if(!renderer)return;const el=$('#model-canvas'),w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();fitModel();}
function entries(){return selection.type==='tower'?Object.entries(ELEMENTS).map(([id,e],i)=>({id,name:`ป้อม${e.name}`,subtitle:e.title,symbol:e.symbol,color:e.color,tint:e.tint,search:`${id} ${e.name} ${e.title}`,index:i})):MONSTERS.map((m,i)=>({...m,name:m.name,subtitle:m.thai,search:`${m.id} ${m.thai}`,index:i}));}
function renderCatalog(){
 const query=$('#search').value.trim().toLocaleLowerCase(),list=entries().filter(e=>e.search.toLocaleLowerCase().includes(query)),selected=selection[selection.type];
 $('#catalog-caption').textContent=selection.type==='tower'?'ELEMENTAL TOWERS':'MONSTER BESTIARY';$('#result-count').textContent=String(list.length).padStart(2,'0');
 $('#catalog-list').setAttribute('aria-labelledby',`tab-${selection.type}`);
 $('#catalog-list').innerHTML=list.length?list.map(e=>`<button class="entry-card" data-id="${e.id}" aria-pressed="${selected===e.id}" style="--accent:${e.color};--tint:${e.tint}"><span class="entry-icon">${e.symbol}</span><span><strong>${e.name}</strong><small>${e.subtitle}</small></span><span class="entry-arrow">↗</span></button>`).join(''):'<p class="empty-search">ไม่พบรายการที่ค้นหา</p>';
 for(const type of ['tower','monster']){$(`#tab-${type}`).setAttribute('aria-selected',String(selection.type===type));$(`#tab-${type}`).tabIndex=selection.type===type?0:-1;}
}
const fmt=n=>Math.abs(n)>=1e12?n.toExponential(2):Math.abs(n)>=1e6?new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:2}).format(n):Number.isInteger(n)?n.toLocaleString():Number(n.toFixed(2)).toLocaleString();
const tile=(label,value,unit='')=>`<div class="stat-tile"><small>${label}</small><strong title="${value.toLocaleString()}">${fmt(value)}</strong><em>${unit}</em></div>`;
const row=(label,value)=>`<div class="extra-row"><span>${label}</span><strong>${value}</strong></div>`;
function persist(){const q=new URLSearchParams({type:selection.type,id:selection[selection.type]});if(selection.type==='tower')q.set('level',selection.level);else{q.set('role',selection.role);q.set('wave',selection.wave);if(selection.boss)q.set('boss','1');}history.replaceState(null,'',`${location.pathname}?${q}`);}
function renderEntry(){
 disposeModel();const tower=selection.type==='tower';$('#tower-options').hidden=!tower;$('#monster-options').hidden=tower;let color,tint;
 if(tower){
  const key=selection.tower,e=ELEMENTS[key],level=selection.level,stats=towerStats(e,level),costs=TOWER_COSTS[key],invested=costs.build+costs.upgrades.slice(0,level-1).reduce((a,b)=>a+b,0),index=Object.keys(ELEMENTS).indexOf(key);
  color=e.color;tint=e.tint;const group=buildTower(key,level);group.scale.setScalar(1.22+(level-1)*.06);current={group,type:'tower'};
  $('#model-code').textContent=`T—${String(index+1).padStart(2,'0')}`;$('#entry-number').textContent=`0${index+1} / 05`;$('#model-category').textContent=`${key.toUpperCase()} / LEVEL ${level}`;$('#model-name').textContent=e.title.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());$('#entry-name').textContent=`ป้อม${e.name}`;$('#entry-summary').textContent=e.description;
  for(const button of document.querySelectorAll('[data-level]'))button.setAttribute('aria-pressed',String(Number(button.dataset.level)===level));
  $('#stat-grid').innerHTML=tile('ดาเมจต่อครั้ง',stats.damage,'DMG')+tile('ระยะโจมตี',stats.range,'m')+tile('ช่วงเวลาโจมตี',stats.interval,'s')+tile('ระดับป้อม',level,'/ 3');
  $('#ability-name').textContent=ABILITIES[key].name;$('#ability-description').textContent=ABILITIES[key].text+(key==='fire'?` ระดับนี้เผา ${stats.burnDamage} ดาเมจต่อครั้ง`:'');
  $('#extra-stats').innerHTML=row('ค่าสร้างเริ่มต้น',`${costs.build} G`)+row('อัปเกรดระดับถัดไป',level===3?'ระดับสูงสุด':`${costs.upgrades[level-1]} G`)+row('เงินลงทุนรวม',`${invested} G`)+row('ขายคืน 70%',`${Math.floor(invested*ECONOMY_RULES.sellRatio)} G`)+row('ประเภทการโจมตี',key==='earth'||key==='wind'?'กายภาพ':'เวท');
 }else{
  const entry=MONSTERS.find(m=>m.id===selection.monster),role=ARCHETYPES[selection.role],spec={species:entry.id,archetype:selection.role,boss:selection.boss,hpFactor:selection.boss&&entry.stage===3&&selection.wave===40?.6:1,rewardFactor:selection.boss&&entry.stage===3&&selection.wave===40?.5:1},stats=monsterStats(spec,selection.wave),index=MONSTERS.indexOf(entry),model=buildMonster(spec);current={...model,type:'monster'};color=role.color;tint=entry.tint;
  $('#model-code').textContent=`M—${String(index+1).padStart(2,'0')}`;$('#entry-number').textContent=`0${index+1} / 07`;$('#model-category').textContent=`${selection.role.toUpperCase()} / ${selection.boss?'BOSS':'MONSTER'} / WAVE ${selection.wave}`;$('#model-name').textContent=`${entry.name}${selection.boss?' · Boss':''}`;$('#entry-name').textContent=entry.thai;$('#entry-summary').textContent=entry.note;
  $('#archetype').value=selection.role;$('#boss-form').checked=selection.boss;$('#stat-wave').value=selection.wave;
  $('#stat-grid').innerHTML=tile('พลังชีวิต',stats.hp,'HP')+tile('ความเร็วเคลื่อนที่',stats.speed,'m/s')+tile('ต้านกายภาพ',Math.round(stats.physical*100),'%')+tile('ต้านเวท',Math.round(stats.magic*100),'%');
  $('#ability-name').textContent=`${role.symbol} ${role.name}${selection.boss?' · ร่างบอส':''}`;
  const tactics={normal:'ไม่มีความต้านทานธาตุ ใช้เป็นตัวเปรียบเทียบค่าสเตตัสพื้นฐาน',fast:'ความเร็ว ×1.65 และ HP ×0.7 ใช้น้ำลดความเร็วหรือดินสตันเพื่อหยุดการบุก',armored:'HP ×1.8 แต่เดินช้าลง ใช้ดินเปิดเกราะก่อนโจมตีด้วยป้อมอื่น',resistant:'ต้านน้ำ/ไฟ/สายฟ้า 50% ใช้ดินและลม หรือเปียกก่อนสายฟ้าเพื่อเพิ่มดาเมจ'};
  $('#ability-description').textContent=tactics[selection.role]+(selection.boss?' ร่างบอสมี HP ×10 ความเร็ว ×0.65 และทำให้ฐานเสีย 5 HP เมื่อหลุด':'');
  const range=`${entry.stage*10+1}–${(entry.stage+1)*10}`;
  if(selection.boss&&BOSS_SKILLS[entry.id])$('#ability-description').textContent+=' สกิลบอส: '+BOSS_SKILLS[entry.id].description+(entry.stage===3?' เวฟ 40 มีบอสคู่ แต่ละตัวใช้ HP 60% และรางวัล 50%':'');
  $('#extra-stats').innerHTML=row('ช่วงเวฟของเผ่า',range)+row('อยู่ร่วมกับ',FAMILIES[entry.stage].name)+row('รางวัลเมื่อกำจัด',`${stats.reward} G`)+row('พลังฐานที่เสียเมื่อหลุด',`${stats.baseDamage} HP`)+row('บอสประจำช่วง',`เวฟ ${(entry.stage+1)*10}`);
 }
 document.documentElement.style.setProperty('--accent',color);document.documentElement.style.setProperty('--tint',tint);accentMaterial.color.set(color);
 world.add(current.group);current.group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(current.group),size=bounds.getSize(new THREE.Vector3());const plinthScale=tower?1:Math.min(2,Math.max(.85,Math.max(size.x,size.z)*.6))/1.65;pedestal.scale.set(plinthScale,1,plinthScale);current.group.position.y=.23-bounds.min.y;fitModel();persist();
 document.title=`${$('#entry-name').textContent} · Database · Elemental Frontier`;
}
function setType(type){selection.type=type;$('#search').value='';renderCatalog();renderEntry();}
$('#tab-tower').addEventListener('click',()=>setType('tower'));$('#tab-monster').addEventListener('click',()=>setType('monster'));
for(const tab of document.querySelectorAll('[role=tab]'))tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const type=e.key==='Home'?'tower':e.key==='End'?'monster':selection.type==='tower'?'monster':'tower';setType(type);$(`#tab-${type}`).focus();}});
$('#search').addEventListener('input',renderCatalog);
$('#catalog-list').addEventListener('click',event=>{const button=event.target.closest('[data-id]');if(!button)return;selection[selection.type]=button.dataset.id;if(selection.type==='monster')selection.wave=MONSTERS.find(m=>m.id===selection.monster).stage*10+1;renderCatalog();renderEntry();});
for(const button of document.querySelectorAll('[data-level]'))button.addEventListener('click',()=>{selection.level=Number(button.dataset.level);renderEntry();});
$('#archetype').addEventListener('change',()=>{selection.role=$('#archetype').value;renderEntry();});$('#boss-form').addEventListener('change',()=>{selection.boss=$('#boss-form').checked;renderEntry();});$('#stat-wave').addEventListener('change',()=>{selection.wave=clampWave($('#stat-wave').value);renderEntry();});
$('#auto-rotate').addEventListener('click',()=>{autoRotate=!autoRotate;$('#auto-rotate').setAttribute('aria-pressed',String(autoRotate));if(controls)controls.autoRotate=autoRotate;});$('#animate-model').addEventListener('click',()=>{animated=!animated;$('#animate-model').setAttribute('aria-pressed',String(animated));$('#animate-model').textContent=animated?'Ⅱ แอนิเมชัน':'▶ แอนิเมชัน';});$('#reset-view').addEventListener('click',fitModel);

renderCatalog();renderEntry();if(renderer){new ResizeObserver(resize).observe($('#model-canvas'));resize();const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(document.hidden)return;t+=dt;if(animated&&current){if(current.type==='tower')animateTower(current.group,t);else animateMonster(current,t);}controls.update(dt);renderer.render(scene,camera);});}
window.__database={selection,ELEMENTS,MONSTERS,scene,camera,renderer,controls,get current(){return current;},get fitDistance(){return fitDistance;}};
