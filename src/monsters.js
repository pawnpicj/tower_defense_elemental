import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ARCHETYPES} from './combat.js';

// Cached, immutable geometry and smooth cartoon materials are shared by every enemy.
export function monsterFactory({material,mesh}){
 const cache=new Map();
 const geometry=(key,create)=>{if(!cache.has(key))cache.set(key,create());return cache.get(key);};
 const palette={slime:'#79cf53',slimeShade:'#58ac52',rat:'#98795d',ratLight:'#c4a182',spider:'#784464',spiderLight:'#b27b9e',goblin:'#78ae59',goblinShade:'#4f8146',skeleton:'#eadbb8',boneShade:'#c8b58e',zombie:'#80a797',zombieLight:'#a2bb9b',orc:'#65904f',orcShade:'#456d42',eye:'#fff4da',pupil:'#233832',pink:'#d78f88',cloth:'#b55742',clothDark:'#75473d',leather:'#77533b',wood:'#a37b49',steel:'#78929e',steelDark:'#465e6c',steelLight:'#b3c6c8',purple:'#aa71dc',purpleDark:'#69498c',gold:'#dfad48',goldLight:'#f6d58a',scar:'#74867b',deadShirt:'#647788',deadPants:'#57594e',deadHair:'#43544c',bruise:'#6b8981'};
 const colors=Object.fromEntries(Object.entries(palette).map(([k,c])=>[k,new THREE.MeshPhongMaterial({color:c,flatShading:false,shininess:k==='slime'?70:['steel','steelLight','gold','goldLight'].includes(k)?60:16,specular:k==='slime'?'#8a9e72':['steel','steelLight','gold','goldLight'].includes(k)?'#8b9983':'#253a2a'})]));
 colors.gloss=new THREE.MeshPhongMaterial({color:'#24332d',shininess:85,specular:'#a2baad'});
 colors.glint=new THREE.MeshBasicMaterial({color:'#fffbea'});
 const roleMats=Object.fromEntries(Object.entries(ARCHETYPES).map(([k,v])=>[k,material(v.color,{flatShading:false})]));
 function part(geo,mat,x,y,z,parent,scale){const o=mesh(geo,mat,x,y,z,parent);o.userData.sharedGeometry=true;o.receiveShadow=false;if(scale)o.scale.set(...scale);for(const child of o.children)if(child.userData.toonOutline)child.scale.setScalar(1.018);return o;}
 const sphere=geometry('sphere',()=>new THREE.SphereGeometry(1,20,14));
 function ball(parent,mat,x,y,z,sx,sy=sx,sz=sx){return part(sphere,mat,x,y,z,parent,[sx,sy,sz]);}
 function rounded(parent,w,h,d,r,mat,x,y,z){return part(geometry(`box:${w}:${h}:${d}:${r}`,()=>new RoundedBoxGeometry(w,h,d,2,r)),mat,x,y,z,parent);}
 function tube(parent,key,points,r,mat){return part(geometry(`tube:${key}:${r}`,()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),12,r,6,false)),mat,0,0,0,parent);}
 function capsule(parent,a,b,r,mat){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),len=from.distanceTo(to),o=part(geometry(`capsule:${r}:${len.toFixed(4)}`,()=>new THREE.CapsuleGeometry(r,len,4,10)),mat,0,0,0,parent);o.position.copy(from).add(to).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize());return o;}
 function torus(parent,r,t,mat,x,y,z){const o=part(geometry(`torus:${r}:${t}`,()=>new THREE.TorusGeometry(r,t,8,32)),mat,x,y,z,parent);o.rotation.x=Math.PI/2;return o;}
 function cone(parent,r,h,mat,x,y,z){return part(geometry(`cone:${r}:${h}`,()=>new THREE.ConeGeometry(r,h,16)),mat,x,y,z,parent);}
 function leaf(parent,mat,x,y,z,sign,size=1){
  const geo=geometry('ear',()=>{const shape=new THREE.Shape();shape.moveTo(0,-.1);shape.quadraticCurveTo(.2,-.17,.46,.17);shape.quadraticCurveTo(.12,.2,0,.08);shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,steps:1,curveSegments:8});});
  const ear=new THREE.Group();ear.position.set(x,y,z);ear.scale.set(sign*size,size,size);parent.add(ear);part(geo,mat,0,0,0,ear);part(geo,colors.pink,.04,.01,.056,ear,[.63,.55,.4]);return ear;
 }
 function build(spec){
  const species=spec.species,skin=colors[species]||colors.slime,group=new THREE.Group(),body=new THREE.Group(),limbs=[],rig={limbs:[],ears:[],tail:null,orbit:null,torso:null};group.add(body);
  const pivot=(parent,x,y,z,kind,phase,base=0)=>{const p=new THREE.Group();p.position.set(x,y,z);parent.add(p);if(kind){if(kind!=='spider')p.rotation.x=base;rig.limbs.push({obj:p,kind,phase,base});limbs.push(p);}return p;};
  const eye=(parent,x,y,z,r=.092,white=true)=>{if(white)ball(parent,colors.eye,x,y,z,r,r*1.12,r*.48);ball(parent,colors.gloss,x,y,z+r*.37,r*.56,r*.7,r*.3);ball(parent,colors.glint,x-r*.18,y+r*.26,z+r*.66,r*.16,r*.19,r*.08);};
  const smile=(parent,key,y,z,w=.13)=>tube(parent,`${species}:${key}`,[[-w,y+.025,z],[0,y-.025,z+.015],[w,y+.025,z]],.018,colors.pupil);
  let headTop=1.13,headZ=0,headRadius=.3,hitHeight=.6,head=null,leftHand=null,rightHand=null;
  if(species==='slime'){
   const geo=geometry('slime-body',()=>{const g=new THREE.SphereGeometry(.57,24,18),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)/.57,factor=1+.12*(1-y);p.setXYZ(i,p.getX(i)*factor,Math.max(-.45,p.getY(i)*.95),p.getZ(i)*factor);}g.computeVertexNormals();return g;});
   rig.torso=part(geo,skin,0,.49,0,body);ball(body,colors.slimeShade,0,.12,0,.51,.11,.46);
   eye(body,-.18,.59,.62,.105);eye(body,.18,.59,.62,.105);smile(body,'smile',.39,.665,.13);ball(body,colors.pink,0,.37,.68,.055,.022,.012);
   for(const x of [-.31,.31])ball(body,colors.pink,x,.45,.58,.075,.028,.012);
   ball(body,colors.glint,-.2,.82,.45,.105,.045,.018).rotation.z=-.45;ball(body,colors.glint,-.32,.72,.48,.035,.022,.012);
   ball(body,skin,.08,1,-.08,.14,.16,.13);headTop=1.16;headRadius=.34;
  }else if(species==='rat'){
   rig.torso=ball(body,skin,0,.43,-.15,.34,.32,.54);ball(body,colors.ratLight,0,.34,.23,.25,.22,.27);head=pivot(body,0,.57,.4);ball(head,skin,0,0,0,.29,.255,.32);ball(head,colors.ratLight,0,-.085,.25,.19,.12,.21);
   for(const sign of [-1,1]){const ear=pivot(head,sign*.23,.22,-.07);ball(ear,skin,0,0,0,.185,.21,.075);ball(ear,colors.pink,0,.015,.063,.127,.145,.025);rig.ears.push({obj:ear,base:sign*.17,sign});eye(head,sign*.14,.06,.255,.082);for(let j=0;j<2;j++)tube(head,`rat-whisker:${sign}:${j}`,[[sign*.1,-.08,.4],[sign*.28,-.055+j*.06,.46],[sign*.42,-.08+j*.08,.4]],.006,colors.boneShade);}
   ball(head,colors.pink,0,-.045,.44,.09,.065,.055);for(const x of [-.035,.035])rounded(head,.055,.09,.035,.015,colors.eye,x,-.17,.4);
   for(const [i,[x,z]] of [[-.23,.21],[.23,.21],[-.23,-.42],[.23,-.42]].entries()){const leg=pivot(body,x,.31,z,'rat',i%2?Math.PI:0);capsule(leg,[0,-.02,0],[0,-.16,.02],.075,skin);ball(leg,colors.pink,0,-.23,.07,.082,.045,.11);}
   const tail=pivot(body,0,.32,-.6);tube(tail,'rat-tail',[[0,0,0],[.16,-.03,-.24],[.4,.02,-.42],[.38,.13,-.65]],.035,colors.pink);rig.tail=tail;
   headTop=.99;headZ=.29;headRadius=.25;hitHeight=.46;
  }else if(species==='spider'){
   rig.torso=ball(body,skin,0,.56,-.23,.43,.36,.51);ball(body,colors.spiderLight,0,.77,-.28,.27,.08,.3);head=pivot(body,0,.4,.42);ball(head,skin,0,0,0,.29,.25,.27);
   for(const sign of [-1,1]){eye(head,sign*.125,.045,.24,.1);eye(head,sign*.235,.12,.13,.052,false);for(let i=0;i<4;i++){const anchor=[sign*.25,.49,.29-i*.19],leg=pivot(body,...anchor,'spider',i*Math.PI*.7+(sign>0?Math.PI:0));const endZ=.22-i*.17;tube(leg,`spider-leg:${sign}:${i}`,[[0,0,0],[sign*.34,.08,endZ],[sign*.49,-.05,endZ+.03],[sign*.61,-.37,endZ+.08]],.045,skin);ball(leg,colors.spiderLight,sign*.34,.08,endZ,.06);ball(leg,colors.spiderLight,sign*.61,-.36,endZ+.08,.048,.035,.05);}
    tube(head,`spider-fang:${sign}`,[[sign*.12,-.13,.21],[sign*.14,-.23,.28],[sign*.08,-.25,.32]],.035,colors.skeleton);
   }
   for(const x of [-.17,0,.17])ball(body,colors.spiderLight,x,.86,-.28,.055,.026,.08);headTop=.96;headZ=-.2;headRadius=.33;hitHeight=.5;
  }else if(species==='zombie'){
   // A human undead silhouette, independent of the goblin/orc face and outfit.
   body.rotation.x=.06;headRadius=.34;headTop=1.73;headZ=.1;hitHeight=.83;
   const shirtGeo=geometry('zombie-ragged-shirt',()=>{const g=new THREE.CylinderGeometry(.22,.28,.55,16,1),p=g.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)<-.2){const angle=Math.atan2(p.getZ(i),p.getX(i));p.setY(i,p.getY(i)-(.5+.5*Math.sin(angle*7))*.065);}g.computeVertexNormals();return g;});
   const torso=pivot(body,0,.8,.025);torso.rotation.x=.14;rig.torso=part(shirtGeo,colors.deadShirt,0,0,0,torso);
   rounded(body,.42,.23,.3,.055,colors.deadPants,0,.46,0);
   ball(body,skin,.145,.62,.23,.075,.1,.02);for(let i=0;i<2;i++)capsule(body,[.12,.6+i*.06,.252],[.175,.615+i*.06,.252],.009,colors.scar);
   rounded(torso,.105,.14,.025,.018,colors.scar,-.11,-.04,.25).rotation.z=-.25;
   head=pivot(body,0,1.31,.1);head.rotation.z=-.1;rig.head=head;
   ball(head,skin,0,0,0,.34,.41,.28);
   for(const sign of [-1,1]){const ear=pivot(head,sign*.34,-.035,-.025);ball(ear,skin,0,0,0,.06,.095,.045);ball(ear,colors.scar,0,0,.036,.025,.05,.01);}
   // Uneven hollow sockets: one tiny pupil, one cloudy blind eye.
   ball(head,colors.bruise,-.145,.085,.246,.137,.15,.024);ball(head,colors.bruise,.145,.035,.247,.115,.13,.022);
   ball(head,colors.eye,-.145,.08,.272,.09,.111,.025);ball(head,colors.pupil,-.12,.075,.297,.025,.037,.009);
   ball(head,colors.zombieLight,.145,.025,.271,.075,.09,.025);ball(head,colors.eye,.145,.025,.294,.026,.035,.007);
   capsule(head,[-.25,.2,.25],[-.1,.18,.272],.017,colors.scar);
   ball(head,skin,0,-.055,.276,.053,.07,.031);ball(head,colors.bruise,-.018,-.08,.305,.011,.017,.005);
   rounded(head,.27,.13,.03,.035,colors.pupil,.015,-.215,.247).rotation.z=.14;
   rounded(head,.38,.1,.14,.04,skin,-.025,-.3,.16).rotation.z=.09;
   rounded(head,.047,.063,.023,.008,colors.eye,-.08,-.174,.29);rounded(head,.042,.047,.023,.008,colors.boneShade,.09,-.224,.295);
   tube(head,'zombie-forehead-scar',[[-.18,.27,.2],[-.065,.245,.255],[.075,.26,.238]],.009,colors.clothDark);
   for(let i=0;i<3;i++)capsule(head,[-.14+i*.075,.22,.258],[-.12+i*.075,.28,.258],.008,colors.deadPants);
   rounded(head,.025,.13,.12,.012,colors.bruise,.322,-.08,.04);
   for(const [i,x] of [-.13,-.015,.1].entries())tube(head,`zombie-hair:${i}`,[[x,.375,-.03],[x+.025,.418,-.065],[x+.07,.385,-.14]],.014,colors.deadHair);
   for(const sign of [-1,1]){
    const leg=pivot(body,sign*.135,.46,0,'leg',sign>0?Math.PI:0,sign>0?.08:-.06);
    capsule(leg,[0,-.03,0],[0,-.26,0],.073,skin);
    if(sign<0){rounded(leg,.17,.16,.27,.04,colors.deadPants,0,-.35,.055);rounded(leg,.17,.045,.28,.012,colors.clothDark,0,-.415,.055);}
    else{ball(leg,skin,0,-.36,.065,.12,.064,.17);for(let i=0;i<3;i++)ball(leg,skin,(i-1)*.055,-.367,.19,.033,.036,.055);}
    const arm=pivot(body,sign*.28,sign<0?1.0:.97,.04,'arm',sign>0?0:Math.PI,sign<0?-1.08:-.87);
    ball(arm,colors.deadShirt,0,-.065,0,.105,.14,.105);
    capsule(arm,[0,-.11,0],[0,-.36,.015],.072,skin);ball(arm,skin,0,-.41,.02,.085,.115,.045);
    for(let i=0;i<3;i++)capsule(arm,[(i-1)*.048,-.43,.05],[(i-1)*.048,-.52,.07],.018,skin);
    const hand=pivot(arm,0,-.41,.055);if(sign<0)leftHand=hand;else rightHand=hand;
   }
  }else if(species==='skeleton'){
   // Open bone anatomy and recessed skull cavities; no flesh or adventurer outfit.
   headRadius=.34;headTop=1.79;headZ=0;hitHeight=.83;
   capsule(body,[0,.48,-.085],[0,1.06,-.085],.038,colors.boneShade);
   for(let i=0;i<5;i++)ball(body,skin,0,.58+i*.09,-.085,.055,.032,.047);
   capsule(body,[0,.73,.14],[0,1.01,.14],.028,skin);
   for(const sign of [-1,1]){
    capsule(body,[0,1.01,.07],[sign*.25,1.04,0],.032,skin);
    for(let i=0;i<4;i++)tube(body,`skeleton-open-rib:${sign}:${i}`,[[sign*.025,.98-i*.085,.14],[sign*.19,.97-i*.085,.15],[sign*.265,.91-i*.085,.015],[sign*.17,.875-i*.085,-.1],[0,.88-i*.085,-.085]],.025,skin);
    tube(body,`skeleton-pelvis:${sign}`,[[0,.54,-.015],[sign*.16,.565,.015],[sign*.205,.49,.04],[sign*.14,.43,.06],[sign*.045,.46,.04]],.037,skin);
   }
   rounded(body,.1,.12,.1,.025,colors.boneShade,0,.46,-.015);
   head=pivot(body,0,1.34,0);rig.head=head;
   const skullBack=geometry('skeleton-skull-back',()=>{const g=new THREE.SphereGeometry(1,24,16),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.min(p.getZ(i),.33));g.computeVertexNormals();return g;});
   part(skullBack,skin,0,.065,-.005,head,[.34,.38,.29]);
   const face=geometry('skeleton-skull-face',()=>{
    const shape=new THREE.Shape();shape.moveTo(-.24,-.17);shape.quadraticCurveTo(-.36,.1,-.27,.28);shape.quadraticCurveTo(0,.59,.27,.28);shape.quadraticCurveTo(.36,.1,.24,-.17);shape.lineTo(.16,-.2);shape.lineTo(-.16,-.2);shape.closePath();
    for(const sign of [-1,1]){const socket=new THREE.Path();socket.absellipse(sign*.14,.065,.103,.123,0,Math.PI*2,true);shape.holes.push(socket);}
    const nose=new THREE.Path();nose.moveTo(0,-.045);nose.lineTo(-.046,-.12);nose.lineTo(.046,-.12);nose.closePath();shape.holes.push(nose);
    return new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelThickness:.014,bevelSize:.014,bevelSegments:2,steps:1,curveSegments:16});
   });
   part(face,skin,0,0,.16,head);
   for(const sign of [-1,1]){ball(head,colors.pupil,sign*.14,.065,.13,.115,.135,.015);ball(head,colors.gold,sign*.14,.06,.149,.018,.028,.006);ball(head,skin,sign*.25,-.16,.04,.05,.06,.045);capsule(head,[sign*.245,-.17,.06],[sign*.18,-.29,.15],.028,skin);}
   ball(head,colors.pupil,0,-.09,.13,.055,.05,.012);
   rounded(head,.38,.065,.15,.024,skin,0,-.32,.115);
   for(let i=0;i<5;i++)rounded(head,.039,.07,.047,.011,skin,(i-2)*.052,-.2,.195);
   for(let i=0;i<4;i++)rounded(head,.038,.045,.045,.01,skin,(i-1.5)*.055,-.275,.17);
   for(const sign of [-1,1]){
    const leg=pivot(body,sign*.135,.51,0,'leg',sign>0?Math.PI:0);
    ball(leg,skin,0,-.025,0,.055);capsule(leg,[0,-.05,0],[0,-.19,0],.039,skin);ball(leg,skin,0,-.215,.02,.054,.045,.055);
    for(const x of [-.022,.022])capsule(leg,[x,-.25,0],[x,-.395,.015],.023,skin);
    ball(leg,skin,0,-.425,.015,.044);ball(leg,skin,0,-.45,.09,.085,.032,.11);
    for(let i=0;i<4;i++)capsule(leg,[(i-1.5)*.035,-.45,.145],[(i-1.5)*.035,-.453,.205-Math.abs(i-1.5)*.012],.014,skin);
    const arm=pivot(body,sign*.27,1.025,0,'arm',sign>0?0:Math.PI,sign*-.08);
    ball(arm,skin,0,0,0,.06);capsule(arm,[0,-.035,0],[0,-.19,0],.035,skin);ball(arm,skin,0,-.22,0,.045);
    for(const x of [-.023,.023])capsule(arm,[x,-.255,0],[x,-.405,.02],.02,skin);
    ball(arm,skin,0,-.435,.015,.037);rounded(arm,.105,.07,.04,.016,skin,0,-.48,.025);
    for(let i=0;i<4;i++){const x=(i-1.5)*.027;capsule(arm,[x,-.51,.03],[x,-.55,.045],.011,skin);capsule(arm,[x,-.55,.045],[x,-.58,.065],.009,skin);}
    const hand=pivot(arm,0,-.48,.06);if(sign<0)leftHand=hand;else rightHand=hand;
   }
   const blade=geometry('skeleton-sword-blade',()=>{const shape=new THREE.Shape();shape.moveTo(-.055,.04);shape.lineTo(-.06,.52);shape.lineTo(0,.67);shape.lineTo(.06,.52);shape.lineTo(.055,.04);shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:1,steps:1});});
   part(blade,colors.steelLight,0,0,.07,rightHand);capsule(rightHand,[-.14,.015,.075],[.14,.015,.075],.024,colors.gold);capsule(rightHand,[0,-.12,.075],[0,0,.075],.03,colors.clothDark);ball(rightHand,colors.gold,0,-.14,.075,.04);
  }else if(species==='orc'){
   // A broad, heavy warrior rather than an enlarged goblin adventurer.
   headRadius=.38;headTop=2.04;headZ=0;hitHeight=1.0;
   rig.torso=ball(body,skin,0,.98,0,.43,.38,.28);ball(body,skin,0,.75,.015,.34,.26,.255);
   for(const sign of [-1,1]){const strap=rounded(body,.075,.43,.045,.025,colors.leather,sign*.24,1.0,.245);strap.rotation.z=sign*-.22;}
   const belt=torus(body,.345,.055,colors.leather,0,.63,0);belt.scale.z=.83;rounded(body,.16,.12,.055,.025,colors.steelLight,0,.635,.3);rounded(body,.08,.055,.065,.012,colors.steelDark,0,.635,.318);
   const skirt=geometry('orc-warrior-loincloth',()=>{const sh=new THREE.Shape();sh.moveTo(-.23,.1);sh.lineTo(.23,.1);sh.lineTo(.19,-.13);sh.lineTo(.07,-.19);sh.lineTo(0,-.13);sh.lineTo(-.12,-.18);sh.lineTo(-.2,-.1);sh.closePath();return new THREE.ExtrudeGeometry(sh,{depth:.035,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,steps:1});});
   part(skirt,colors.clothDark,0,.5,.23,body);
   head=pivot(body,0,1.6,0);rig.head=head;rounded(head,.77,.65,.57,.18,skin,0,.025,0);rounded(head,.66,.24,.43,.09,skin,0,-.245,.13);
   for(const sign of [-1,1]){
    const ear=leaf(head,skin,sign*.34,.025,-.05,sign,.62);rig.ears.push({obj:ear,base:sign*.12,sign});
    ball(head,colors.eye,sign*.155,.075,.289,.09,.052,.025);ball(head,colors.gold,sign*.155,.075,.314,.035,.039,.012);ball(head,colors.pupil,sign*.155,.075,.327,.015,.027,.006);ball(head,colors.glint,sign*.155-.009,.09,.334,.008,.011,.004);
    capsule(head,[sign*.06,.13,.31],[sign*.27,.19,.24],.053,colors.orcShade);
    const tusk=geometry(`orc-curved-tusk:${sign}`,()=>{const g=new THREE.ConeGeometry(.067,.33,16,6),p=g.attributes.position;for(let i=0;i<p.count;i++){const t=(p.getY(i)+.165)/.33;p.setX(i,p.getX(i)+sign*.055*t*t);p.setZ(i,p.getZ(i)+.045*t*t);}g.computeVertexNormals();return g;});
    part(tusk,colors.eye,sign*.185,-.125,.36,head);
   }
   ball(head,skin,0,-.025,.33,.135,.075,.08);for(const x of [-.055,.055])ball(head,colors.orcShade,x,-.035,.399,.025,.015,.008);
   tube(head,'orc-snarl',[[-.2,-.2,.356],[0,-.22,.37],[.2,-.2,.356]],.021,colors.pupil);
   for(let i=0;i<2;i++)capsule(head,[.25+i*.035,.015,.289],[.28+i*.035,-.08,.285],.009,colors.boneShade);
   for(const z of [-.16,-.04,.08]){const crest=cone(head,.105,.18,colors.clothDark,0,.375,z);crest.rotation.x=-.2;}
   for(const sign of [-1,1]){
    const leg=pivot(body,sign*.215,.59,0,'leg',sign>0?Math.PI:0);
    capsule(leg,[0,-.045,0],[0,-.36,.015],.12,skin);rounded(leg,.2,.14,.09,.035,colors.steelDark,0,-.215,.115);
    rounded(leg,.265,.16,.36,.055,colors.leather,0,-.51,.08);rounded(leg,.27,.1,.22,.045,colors.steelDark,0,-.525,.18);
    const arm=pivot(body,sign*.49,1.18,0,'arm',sign>0?0:Math.PI,sign*.07);
    ball(arm,skin,0,-.105,0,.16,.22,.15);capsule(arm,[0,-.19,0],[0,-.37,.02],.12,skin);
    rounded(arm,.255,.15,.25,.055,colors.steelDark,0,-.3,.01);rounded(arm,.26,.035,.26,.012,colors.steelLight,0,-.355,.01);
    ball(arm,skin,0,-.46,.055,.15,.14,.115);for(let i=0;i<3;i++)ball(arm,skin,(i-1)*.075,-.48,.15,.042,.06,.035);
    const hand=pivot(arm,0,-.47,.085);if(sign<0)leftHand=hand;else rightHand=hand;
   }
   const pad=rounded(body,.35,.2,.42,.075,colors.steelDark,-.49,1.27,0);pad.rotation.z=-.12;
   for(const z of [-.12,0,.12])cone(body,.045,.15,colors.boneShade,-.49,1.415,z);
   const axe=pivot(rightHand,.015,0,.045);axe.rotation.z=-.28;capsule(axe,[0,-.22,0],[0,.78,0],.045,colors.wood);
   const blade=geometry('orc-double-axe',()=>{const sh=new THREE.Shape();sh.moveTo(.06,-.14);sh.lineTo(.3,-.23);sh.quadraticCurveTo(.45,0,.3,.23);sh.lineTo(.06,.14);sh.closePath();return new THREE.ExtrudeGeometry(sh,{depth:.055,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,steps:1,curveSegments:10});});
   for(const sign of [-1,1]){part(blade,colors.steelLight,0,.65,-.03,axe,[sign,1,1]);part(blade,colors.steelDark,0,.65,.038,axe,[sign*.76,.8,.2]);}rounded(axe,.15,.2,.14,.025,colors.steelDark,0,.65,0);ball(axe,colors.gold,0,.65,.09,.04,.045,.018);
  }else{
   const orc=species==='orc',skeleton=species==='skeleton',zombie=species==='zombie',width=orc?.37:.3,shoulderY=1.02,headY=orc?1.42:1.34;
   hitHeight=.88;headRadius=orc?.48:.42;
   const leather=zombie?colors.clothDark:colors.leather;
   if(skeleton){
    capsule(body,[0,.53,0],[0,1.04,0],.072,colors.boneShade);
    for(const sign of [-1,1])for(let i=0;i<4;i++)tube(body,`hero-rib:${sign}:${i}`,[[0,1.01-i*.1,.08],[sign*.19,1-i*.1,.21],[sign*.285,.94-i*.1,.14],[sign*.23,.9-i*.1,-.03]],.045,skin);
    ball(body,skin,0,.54,0,.27,.12,.18);rounded(body,.38,.21,.27,.05,colors.steelDark,0,.46,0);
   }else{
    rig.torso=ball(body,orc?skin:leather,0,.8,0,width,.33,orc?.28:.24);
    ball(body,leather,0,.55,0,width*.88,.17,.24);
    if(orc){rounded(body,.58,.28,.12,.06,leather,0,.72,.25);}
    if(zombie){for(const sign of [-1,1]){const patch=rounded(body,.13,.19,.035,.025,colors.cloth,sign*.13,.78,.22);patch.rotation.z=sign*.3;}ball(body,colors.zombieLight,.17,.94,.16,.09,.12,.06);}
   }
   const belt=torus(body,width*.93,.048,colors.clothDark,0,.58,0);belt.scale.z=.82;
   const buckle=torus(body,.085,.022,colors.steelLight,0,.59,.255);buckle.rotation.x=0;
   tube(body,`${species}:cross-strap`,[[-width*.84,1.01,.17],[-.12,.88,.27],[.13,.74,.28],[width*.8,.64,.2]],.043,colors.wood);
   ball(body,leather,width*.85,.53,.25,.15,.16,.07);
   head=pivot(body,0,headY,0);ball(head,skin,0,.015,0,headRadius,orc?.39:.37,orc?.34:.32);
   const heroEye=(sign,small=false)=>{
    const x=sign*(orc?.19:.17),y=.065,z=orc?.316:.3,r=small?.09:.115;
    ball(head,colors.eye,x,y,z,r,r*1.2,.04);ball(head,zombie?colors.zombieLight:colors.goldLight,x,y,z+.04,r*.68,r*.98,.022);ball(head,zombie&&sign>0?colors.boneShade:colors.pupil,x,y,z+.063,r*.25,r*.85,.015);ball(head,colors.glint,x-.02,y+.04,z+.08,.018,.025,.009);
   };
   if(skeleton){
    for(const sign of [-1,1]){ball(head,colors.pupil,sign*.155,.065,.3,.135,.15,.045);ball(head,colors.gold,sign*.155,.055,.346,.035,.06,.014);ball(head,skin,sign*.28,-.11,.2,.1,.1,.1);}
    rounded(head,.46,.15,.24,.055,skin,0,-.255,.17);for(let i=0;i<6;i++)rounded(head,.05,.095,.06,.018,skin,(i-2.5)*.067,-.2,.32);
    const nose=cone(head,.068,.085,colors.pupil,0,-.065,.326);nose.rotation.x=Math.PI/2;
   }else{
    for(const sign of [-1,1]){
     let ear;if(zombie){ear=pivot(head,sign*.41,0,0);ball(ear,skin,0,0,0,.1,.13,.065);ball(ear,colors.scar,0,-.02,.055,.043,.065,.018);}else ear=leaf(head,skin,sign*headRadius*.8,.015,-.05,sign,orc?1:1.28);rig.ears.push({obj:ear,base:sign*.09,sign});
     heroEye(sign,zombie&&sign>0);
     capsule(head,[sign*.075,.23,.32],[sign*.3,.22,.25],orc?.065:.055,orc?colors.orcShade:colors.goblinShade);
     ball(head,skin,sign*.29,-.09,.24,.13,.105,.1);
    }
    ball(head,skin,0,-.035,orc?.36:.34,orc?.19:.16,.085,.11);
    for(const x of [-.075,.075])ball(head,orc?colors.orcShade:colors.goblinShade,x,-.035,.432,.026,.018,.012);
    ball(head,colors.clothDark,0,-.22,.25,orc?.32:.28,.155,.11);ball(head,colors.pupil,0,-.18,.345,orc?.28:.24,.115,.045);
    for(let i=0;i<4;i++){if(zombie&&i%2)continue;const tooth=cone(head,.032,zombie?.055:.095,colors.eye,(i-1.5)*.085,-.15,.387);tooth.rotation.z=Math.PI;}
    if(!zombie)for(const sign of [-1,1]){const tusk=cone(head,orc?.075:.05,orc?.29:.17,colors.eye,sign*(orc?.23:.19),orc?-.13:-.175,.375);tusk.rotation.z=orc?-sign*.18:Math.PI;}
    if(zombie){tube(head,'hero-stitch',[[-.2,.22,.26],[-.04,.28,.3],[.12,.25,.27]],.012,colors.clothDark);for(let i=0;i<3;i++)capsule(head,[-.16+i*.09,.21,.3],[-.13+i*.09,.29,.3],.011,colors.clothDark);for(const x of [-.14,-.02,.1])ball(head,colors.scar,x,.34,-.07,.075,.08,.15);}
    else{for(let i=0;i<4;i++){const hair=cone(head,.085,.12,colors.clothDark,(i-1.5)*.09,.38,-.06);hair.rotation.x=-.3;}}
   }
   for(const sign of [-1,1]){
    const leg=pivot(body,sign*(orc?.215:.175),.5,0,'leg',sign>0?Math.PI:0);
    capsule(leg,[0,-.035,0],[0,-.245,0],skeleton?.067:orc?.13:.105,skin);
    ball(leg,skeleton?skin:leather,0,-.13,.105,skeleton?.075:.125,.085,.045);
    const ankle=torus(leg,skeleton?.07:orc?.13:.105,.026,leather,0,-.25,0);ankle.scale.z=.9;
    ball(leg,skin,0,-.34,.1,orc?.19:.155,.085,orc?.24:.2);
    for(let i=0;i<3;i++){const x=(i-1)*(orc?.105:.085);ball(leg,skin,x,-.345,.245,orc?.065:.055,.06,.085);cone(leg,.022,.07,colors.eye,x,-.345,.315).rotation.x=Math.PI/2;}
    const arm=pivot(body,sign*(width+.055),shoulderY,0,'arm',sign>0?0:Math.PI,zombie?-.75:sign*-.14);
    ball(arm,skin,0,-.09,0,orc?.16:.13,.19,.135);capsule(arm,[0,-.13,0],[0,-.34,.02],skeleton?.07:orc?.13:.11,skin);
    ball(arm,skin,0,-.4,.045,orc?.16:.13,.14,.12);
    for(const y of [-.25,-.31])torus(arm,skeleton?.078:orc?.135:.115,.022,leather,0,y,.015);
    for(let i=0;i<3;i++)ball(arm,skin,(i-1)*.07,-.43,.13,.035,.06,.035);
    const hand=pivot(arm,0,-.4,.07);if(sign>0)rightHand=hand;else leftHand=hand;
   }
   if(species==='goblin'){
    const spear=pivot(rightHand,.015,0,.06);spear.rotation.z=-.42;
    capsule(spear,[0,-.35,0],[0,.88,0],.035,colors.wood);
    const tip=part(geometry('hero-spear',()=>new THREE.OctahedronGeometry(.14)),colors.steelLight,0,1.03,0,spear,[.65,1.8,.4]);torus(spear,.05,.02,colors.gold,0,.83,0);
   }else if(skeleton){rounded(rightHand,.09,.65,.06,.025,colors.steelLight,0,.31,.08);rounded(rightHand,.29,.055,.1,.025,colors.gold,0,0,.08);capsule(rightHand,[0,-.14,.08],[0,0,.08],.04,leather);}
   else if(orc){capsule(rightHand,[0,-.15,.09],[0,.43,.09],.065,colors.wood);ball(rightHand,colors.steelDark,0,.48,.09,.22,.27,.2);for(const sign of [-1,1])cone(rightHand,.055,.17,colors.skeleton,sign*.18,.52,.09).rotation.z=-sign*Math.PI/2;}
   if(orc){rounded(body,.32,.2,.37,.075,colors.steelDark,-.45,1.12,0).rotation.z=-.15;for(const z of [-.11,.11])cone(body,.055,.18,colors.skeleton,-.47,1.29,z);}
   headTop=headY+(orc?.44:.42);headZ=0;
  }
  const baseTop=headTop;
  if(spec.archetype==='armored'){
   const radius=species==='slime'?.44:headRadius+.075,centerY=headTop-.14;
   const helmet=part(geometry(`helmet:${radius}`,()=>new THREE.SphereGeometry(radius,20,12,0,Math.PI*2,0,Math.PI/2)),colors.steel,0,centerY,headZ,body);helmet.scale.z=.93;
   const rim=torus(body,radius,.035,colors.steelLight,0,centerY,headZ);rim.scale.z=.93;
   rounded(body,.08,radius*.8,.04,.02,colors.gold,0,centerY+radius*.35,headZ+radius*.92);
   headTop=centerY+radius;
   if(leftHand){
   const shieldShape=geometry('shield',()=>{const s=new THREE.Shape();s.moveTo(-.23,.27);s.quadraticCurveTo(0,.35,.23,.27);s.lineTo(.22,-.06);s.quadraticCurveTo(.15,-.25,0,-.32);s.quadraticCurveTo(-.15,-.25,-.22,-.06);s.closePath();return new THREE.ExtrudeGeometry(s,{depth:.06,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,steps:1,curveSegments:10});});
   const shield=leftHand;shield.name='humanoid-shield';
   part(shieldShape,colors.gold,0,0,.09,shield);part(shieldShape,colors.steelDark,0,.015,.14,shield,[.86,.86,.5]);rounded(shield,.065,.32,.03,.022,colors.steelLight,0,.02,.2);ball(shield,colors.goldLight,0,.02,.24,.065,.075,.025);
   }
  }
  if(spec.archetype==='fast'){
   const y=species==='slime'?.31:species==='rat'?.46:species==='spider'?.48:baseTop-.51;
   const scarf=torus(body,headRadius*.85,.045,colors.gold,0,y,headZ);scarf.scale.z=.82;
   for(const sign of [-1,1])tube(body,`${species}:scarf:${sign}`,[[sign*.13,y,headZ-.15],[sign*.23,y+.06,headZ-.38],[sign*.22,y-.035,headZ-.62]],.046,colors.gold);
  }
  if(spec.archetype==='resistant'){
   torus(body,.57,.022,colors.purple,0,.12,0);const orbit=pivot(body,0,Math.max(.56,baseTop*.65),0);
   for(let i=0;i<3;i++){const a=i*Math.PI*2/3;part(geometry('rune',()=>new THREE.OctahedronGeometry(.075)),colors.purple,Math.cos(a)*.48,Math.sin(a)*.035,Math.sin(a)*.48,orbit);}
   rig.orbit=orbit;
   const pendant=part(geometry('amulet',()=>new THREE.OctahedronGeometry(.09)),colors.purple,0,hitHeight,species==='slime'?.6:species==='rat'?.7:species==='spider'?.68:.25,body);pendant.scale.y=1.3;
  }
  group.scale.setScalar(spec.archetype==='fast'?1.15:spec.archetype==='armored'?1.5:1.3);
  if(species==='slime'&&!spec.boss)group.scale.multiplyScalar(.8);
  if(spec.boss){
   group.scale.multiplyScalar(1.65);const crownY=headTop+.035,r=Math.max(.23,headRadius*.9);
   const band=part(geometry(`crown:${r}`,()=>new THREE.CylinderGeometry(r,r*.95,.12,24)),colors.gold,0,crownY,headZ,body);
   torus(body,r,.022,colors.goldLight,0,crownY+.065,headZ);
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5;cone(body,.055,.22,colors.gold,Math.sin(a)*r,crownY+.16,headZ+Math.cos(a)*r);ball(body,colors.goldLight,Math.sin(a)*r,crownY+.27,headZ+Math.cos(a)*r,.027);ball(body,i%2?colors.pink:colors.purple,Math.sin(a)*(r+.01),crownY,headZ+Math.cos(a)*(r+.01),.032,.04,.032);}
   headTop=crownY+.3;
  }
  group.scale.multiplyScalar(.8);
  const markerY=headTop+.2;
  part(geometry('role-marker',()=>new THREE.IcosahedronGeometry(.07,1)),roleMats[spec.archetype]||roleMats.normal,0,markerY,headZ,body);
  return{group,body,limbs,rig,height:markerY+.24,hitHeight,species,gaitRate:(spec.archetype==='fast'?1.4:spec.archetype==='armored'?.8:1)*(spec.boss?.8:1)};
 }
 return build;
}

export function animateMonster(model,time,{moving=true,stunned=false,phase=0}={}){
 const rig=model.rig;if(!rig)return;
 const motion=stunned?0:moving?1:.2,speed=model.species==='rat'?10:model.species==='spider'?8:model.species==='zombie'?4.3:model.species==='orc'?5:6,t=time*speed*(model.gaitRate||1)+phase;
 for(const limb of rig.limbs){const wave=Math.sin(t+limb.phase);if(limb.kind==='spider'){limb.obj.rotation.z=wave*.08*motion;limb.obj.rotation.y=Math.cos(t+limb.phase)*.07*motion;}else if(model.species==='zombie'){limb.obj.rotation.x=limb.base+(limb.kind==='arm'?Math.sin(time*1.4+limb.phase+phase)*.045:wave*.12)*motion;}else limb.obj.rotation.x=limb.base+wave*(model.species==='orc'?(limb.kind==='leg'?.22:.16):limb.kind==='rat'?.24:limb.kind==='leg'?.3:.22)*motion;}
 if(model.species==='slime'){const wave=Math.sin(time*4.5+phase)*motion;model.body.position.y=Math.max(0,wave)*.1;model.body.scale.set(1-wave*.045,1+wave*.065,1-wave*.045);}
 else if(model.species==='zombie'){model.body.position.y=Math.abs(Math.sin(t))*.008*motion;model.body.rotation.z=Math.sin(t*.45)*.025*motion;if(rig.head)rig.head.rotation.z=-.1+Math.sin(time*1.1+phase)*.025*motion;}else model.body.position.y=Math.abs(Math.sin(t))*.022*motion;
 for(const ear of rig.ears)ear.obj.rotation.z=ear.base+Math.sin(time*2.3+phase+ear.sign)*.035*(stunned?.1:1);
 if(rig.tail)rig.tail.rotation.y=Math.sin(time*3+phase)*.13;
 if(rig.orbit)rig.orbit.rotation.y=time*.7;
}
