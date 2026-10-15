import * as THREE from 'three';

// Procedural effects: luminous ribbons, soft sprites and animated particles.
// Geometry and materials are owned by each effect and released at its end.
const PALETTES={
 earth:{main:0xdca850,hot:0xffefb2,dark:0x785b32},
 water:{main:0x2fc7ed,hot:0xd4fcff,dark:0x1980b2},
 wind:{main:0x87e7be,hot:0xf1ffed,dark:0x59ad8a},
 fire:{main:0xff7826,hot:0xffe7a0,dark:0xc73717},
 lightning:{main:0xab79ff,hot:0xf4e6ff,dark:0x6248cf}
};
export function createVFX(scene,camera){
 const active=[],statuses=new Map();let time=0;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.2,'rgba(255,255,255,.9)');gradient.addColorStop(.5,'rgba(255,255,255,.2)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const glowTexture=new THREE.CanvasTexture(canvas);
 const pointMaterial=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uLife:{value:1},uColor:{value:new THREE.Color()},uHot:{value:new THREE.Color()},uGravity:{value:2},uViewportHeight:{value:240}},
  vertexShader:`attribute vec3 velocity; attribute float size; attribute float seed; uniform float uTime; uniform float uLife; uniform float uGravity; uniform float uViewportHeight; varying float vFade; varying float vSeed;
  void main(){float p=clamp(uTime/uLife,0.,1.);vec3 pos=position+velocity*uTime;pos.y-=uGravity*uTime*uTime*.5;vec4 mv=modelViewMatrix*vec4(pos,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*(1.-p*.7)*projectionMatrix[1][1]*uViewportHeight*.5,1.,28.);vFade=(1.-p)*(1.-p);vSeed=seed;}`,
  fragmentShader:`uniform vec3 uColor;uniform vec3 uHot;varying float vFade;varying float vSeed;void main(){vec2 q=gl_PointCoord-.5;float d=length(q)*2.;float soft=exp(-d*d*6.);float core=exp(-d*d*35.);gl_FragColor=vec4(mix(uColor,uHot,core+.2*vSeed),soft*vFade);}`,
  transparent:true,blending:THREE.NormalBlending,depthWrite:false
 });
 function basic(color,opacity=1,additive=false){return new THREE.MeshBasicMaterial({color,transparent:true,opacity,toneMapped:false,side:THREE.DoubleSide,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending});}
 function addMesh(group,geometry,material){const object=new THREE.Mesh(geometry,material);object.frustumCulled=false;object.renderOrder=3;group.add(object);return object;}
 function sprite(group,color,size,opacity=1){const material=new THREE.SpriteMaterial({toneMapped:false,map:glowTexture,color,transparent:true,opacity,blending:THREE.NormalBlending,depthWrite:false});const s=new THREE.Sprite(material);s.scale.setScalar(size);s.renderOrder=4;group.add(s);return s;}
 function groundGlow(group,color,size,opacity=.3){const g=addMesh(group,new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({toneMapped:false,map:glowTexture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));g.rotation.x=-Math.PI/2;return g;}
 function release(group){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry&&!o.isSprite)geometries.add(o.geometry);if(o.material){for(const mat of Array.isArray(o.material)?o.material:[o.material])materials.add(mat);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.removeFromParent();}
 function effect(group,life,update){scene.add(group);active.push({group,age:0,life,update});return group;}
 function particles(key,position,{count=28,speed=2.8,life=.7,gravity=3,spread=1,lift=1.8,size=.3}={}){
  const palette=PALETTES[key],geo=new THREE.BufferGeometry(),positions=[],velocities=[],sizes=[],seeds=[];
  for(let i=0;i<count;i++){const a=i*2.39996,r=.25+Math.random()*.75;positions.push((Math.random()-.5)*spread*.1,Math.random()*.15,(Math.random()-.5)*spread*.1);velocities.push(Math.cos(a)*r*speed,Math.random()*lift+.3,Math.sin(a)*r*speed);sizes.push(size*(.5+Math.random()));seeds.push(Math.random());}
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('velocity',new THREE.Float32BufferAttribute(velocities,3));geo.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));geo.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));
  const mat=pointMaterial.clone();mat.uniforms.uColor.value.set(palette.main);mat.uniforms.uHot.value.set(palette.hot);mat.uniforms.uLife.value=life;mat.uniforms.uGravity.value=gravity;
  const points=new THREE.Points(geo,mat);points.frustumCulled=false;points.position.copy(position);points.renderOrder=5;effect(points,life,(_,age)=>mat.uniforms.uTime.value=age);
 }
 function arcGeometry(radius,width,start=0,length=Math.PI*2,segments=48){
  const positions=[],uv=[],indices=[];
  for(let i=0;i<=segments;i++){const a=start+length*i/segments;for(const side of [-1,1]){const r=radius+side*width*.5;positions.push(Math.cos(a)*r,0,Math.sin(a)*r);uv.push(i/segments,(side+1)*.5);}if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);return g;
 }
 function arc(group,r,width,color,start=0,length=Math.PI*2,opacity=1){return addMesh(group,arcGeometry(r,width,start,length),basic(color,opacity));}
 function ribbonMaterial(key,opacity=.7){return new THREE.ShaderMaterial({uniforms:{uColor:{value:new THREE.Color(PALETTES[key].main)},uHot:{value:new THREE.Color(PALETTES[key].hot)},uOpacity:{value:opacity}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform vec3 uColor;uniform vec3 uHot;uniform float uOpacity;void main(){float edge=pow(max(0.,1.-abs(vUv.y-.5)*2.),1.4);float tail=pow(vUv.x,1.3);gl_FragColor=vec4(mix(uColor,uHot,edge*.8),edge*tail*uOpacity);}`,side:THREE.DoubleSide,transparent:true,blending:THREE.NormalBlending,depthWrite:false});}
 function makeRibbon(key){const geo=new THREE.BufferGeometry(),segments=22;geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array((segments+1)*6),3));const uv=[],indices=[];for(let i=0;i<=segments;i++){uv.push(i/segments,0,i/segments,1);if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);const mesh=new THREE.Mesh(geo,ribbonMaterial(key));mesh.frustumCulled=false;mesh.renderOrder=5;scene.add(mesh);return{mesh,history:[],segments};}
 function updateRibbon(trail,position,width){trail.history.push(position.clone());if(trail.history.length>trail.segments+1)trail.history.shift();const attr=trail.mesh.geometry.attributes.position;
  for(let i=0;i<=trail.segments;i++){const idx=Math.max(0,trail.history.length-1-trail.segments+i),p=trail.history[idx],next=trail.history[Math.min(idx+1,trail.history.length-1)],prev=trail.history[Math.max(0,idx-1)],direction=next.clone().sub(prev),view=camera.position.clone().sub(p),side=new THREE.Vector3().crossVectors(direction,view).normalize();const w=width*(i/trail.segments);for(let j=0;j<2;j++){const v=p.clone().addScaledVector(side,(j?1:-1)*w);attr.setXYZ(i*2+j,v.x,v.y,v.z);}}attr.needsUpdate=true;
 }
 function elementFlameMaterial(tail=1.7){return new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uTail:{value:tail},uOpacity:{value:.94}},transparent:true,vertexShader:`uniform float uTime;uniform float uTail;varying vec3 vP;varying vec3 vN;void main(){vec3 p=position;p.z-=max(0.,-p.z)*uTail;p.x+=sin(p.z*35.+uTime*18.)*.014;p.y+=cos(p.z*30.-uTime*16.)*.012;vP=p;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float uTime;uniform float uOpacity;varying vec3 vP;varying vec3 vN;void main(){float n=sin(vP.x*33.+sin(vP.z*25.-uTime*12.)*2.)*cos(vP.y*29.+uTime*5.);float heat=.48+n*.24+vP.z*.5;vec3 c=mix(vec3(1.,.12,.005),vec3(1.,.86,.21),clamp(heat,0.,1.));gl_FragColor=vec4(c,uOpacity);}`,depthWrite:false});}
 function waterSkin(opacity=.78){return new THREE.MeshPhongMaterial({color:0x27b9e0,specular:0xffffff,shininess:110,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide});}
 function stoneSkin(){return new THREE.MeshStandardMaterial({color:0x81745c,roughness:1,flatShading:true});}
 function cast(key,position){
  const g=new THREE.Group();g.position.copy(position);g.name=`cast-${key}`;const p=PALETTES[key],flash=sprite(g,p.hot,key==='lightning'?.48:.36,.65);
  effect(g,.16,t=>{flash.scale.setScalar(.36+Math.sin(t*Math.PI)*.2);flash.material.opacity=(1-t)*.6;});
  if(key==='earth')particles(key,position,{count:5,speed:.35,life:.3,lift:.35,gravity:2,size:.08});
  if(key==='fire')particles(key,position,{count:6,speed:.7,life:.27,lift:.5,gravity:-.3,size:.08});
 }
 function projectile(key,position){
  const g=new THREE.Group();g.name=`projectile-${key}`;scene.add(g);g.position.copy(position);const p=PALETTES[key],parts=[];let flame=null;
  if(key==='earth'){
   const rock=addMesh(g,new THREE.DodecahedronGeometry(.23,0),stoneSkin());rock.scale.set(1,.85,1.2);parts.push(rock);
   const seam=addMesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.16,-.06,.17),new THREE.Vector3(-.02,.02,.23),new THREE.Vector3(.04,.14,.15)]),8,.009,4,false),basic(p.main,.8));parts.push(seam);
  }else if(key==='water'){
   const drop=addMesh(g,new THREE.SphereGeometry(.18,24,16),waterSkin());drop.scale.set(.85,.85,1.55);parts.push(drop);
   for(let i=0;i<3;i++){const bead=addMesh(g,new THREE.SphereGeometry(.065-i*.012,12,8),waterSkin(.65));bead.position.set(Math.sin(i*2)*.04,Math.cos(i)*.04,-.28-i*.15);parts.push(bead);}
  }else if(key==='wind'){
   for(let i=0;i<2;i++){const blade=arc(g,.25+i*.08,.035,i?p.main:p.hot,i*Math.PI,Math.PI*1.25,i?.36:.72);blade.rotation.x=Math.PI/2;parts.push(blade);}
  }else if(key==='fire'){
   flame=elementFlameMaterial();const ball=addMesh(g,new THREE.SphereGeometry(.23,24,16),flame);parts.push(ball);const hot=addMesh(g,new THREE.SphereGeometry(.105,16,12),basic(p.hot,.85));hot.position.z=.12;
   sprite(g,p.main,.70,.22);
  }
  const trail=makeRibbon(key);trail.mesh.name=`trail-${key}`;let elapsed=0,emission=0;const forward=new THREE.Vector3(0,0,1),direction=new THREE.Vector3(),old=position.clone();
  return{group:g,update(pos,progress,dt){old.copy(g.position);g.position.copy(pos);elapsed+=dt;emission+=dt;direction.subVectors(pos,old);if(direction.lengthSq()>.000001)g.quaternion.setFromUnitVectors(forward,direction.normalize());
   if(key==='earth'){parts[0].rotation.x=elapsed*5;parts[0].rotation.y=elapsed*3;parts[1].rotation.copy(parts[0].rotation);}
   if(key==='wind')parts.forEach((a,i)=>a.rotation.z=elapsed*9+i*Math.PI);
   if(key==='water'){parts[0].scale.z=1.4+Math.sin(elapsed*14)*.13;for(let i=1;i<parts.length;i++)parts[i].position.y=Math.sin(elapsed*16+i)*.035;}
   if(flame)flame.uniforms.uTime.value=elapsed;
   const opacity=key==='earth'?.10:key==='wind'?.22:key==='water'?.40:.55;trail.mesh.material.uniforms.uOpacity.value=opacity;updateRibbon(trail,pos,key==='fire'?.13:key==='water'?.065:key==='wind'?.10:.045);
   if(emission>.12&&key!=='wind'){emission=0;particles(key,pos,{count:key==='fire'?2:1,speed:.22,life:.25,gravity:key==='earth'?4:key==='water'?6:-.5,lift:.1,size:key==='fire'?.075:.045});}
  },dispose(){release(g);active.push({group:trail.mesh,age:0,life:.13,update:t=>trail.mesh.material.uniforms.uOpacity.value=(1-t)*.25});}};
 }
 function debris(group,key,count){const pieces=[];for(let i=0;i<count;i++){const a=i*2.39996,speed=.7+Math.random()*1.2,size=.045+Math.random()*.075,mesh=addMesh(group,key==='earth'?new THREE.DodecahedronGeometry(size,0):new THREE.SphereGeometry(size*.55,10,6),key==='earth'?stoneSkin():waterSkin());pieces.push({mesh,v:new THREE.Vector3(Math.cos(a)*speed,1.4+Math.random()*1.5,Math.sin(a)*speed),spin:Math.random()*7});}return pieces;}
 function animateDebris(pieces,age,floor,life){for(const p of pieces){p.mesh.position.copy(p.v).multiplyScalar(age);p.mesh.position.y=Math.max(floor,p.v.y*age-4.9*age*age);p.mesh.rotation.x=age*p.spin;p.mesh.rotation.z=age*p.spin*.6;p.mesh.scale.setScalar(Math.max(.02,1-Math.max(0,age/life-.45)*1.7));}}
 function splashCrown(){const positions=[],uv=[],indices=[],rows=5,sides=48;for(let j=0;j<=rows;j++){const t=j/rows;for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,r=.16+t*.35,y=Math.pow(t,2)*(.24+.14*Math.sin(a*9.)**2);positions.push(Math.cos(a)*r,y,Math.sin(a)*r);uv.push(i/sides,t);}}for(let j=0;j<rows;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
 function impact(key,position,scale=1){
  const p=PALETTES[key],g=new THREE.Group();g.name=`impact-${key}`;g.position.copy(position);const size=THREE.MathUtils.clamp(scale,.45,1.6);g.scale.setScalar(size);const floor=(.23-position.y)/size;
  if(key==='earth'){
   const chips=debris(g,key,9),dust=[];for(let i=0;i<5;i++){const s=sprite(g,0x9f9078,.45,.20);s.position.set(Math.sin(i*2.4)*.20,floor+.08,Math.cos(i*2.4)*.20);dust.push(s);}
   const cracks=[];for(let i=0;i<4;i++){const a=i*1.57,pts=[];for(let j=0;j<4;j++){const r=.12+j*.19;pts.push(new THREE.Vector3(Math.cos(a+j%2*.12)*r,floor+.015,Math.sin(a+j%2*.12)*r));}cracks.push(addMesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.009,3,false),basic(0x7d6138,.65)));}
   effect(g,.78,(t,age)=>{animateDebris(chips,age,floor,.78);dust.forEach((s,i)=>{s.position.x=Math.sin(i*2.4)*(.2+t*.55);s.position.z=Math.cos(i*2.4)*(.2+t*.55);s.position.y=floor+.10+t*.2;s.scale.setScalar(.4+t*.9);s.material.opacity=Math.sin(t*Math.PI)*.18;});cracks.forEach(c=>c.material.opacity=(1-t)*.6);});
  }else if(key==='water'){
   const drops=debris(g,key,15),crown=addMesh(g,splashCrown(),waterSkin(.72)),ripples=[];
   for(let i=0;i<2;i++){const wave=arc(g,.38,.014,i?p.hot:p.main,0,Math.PI*2,.35);wave.position.y=floor+.018+i*.007;ripples.push(wave);}
   effect(g,.72,(t,age)=>{animateDebris(drops,age,floor,.72);crown.scale.set( .65+t*1.6,Math.sin(t*Math.PI)*1.25,.65+t*1.6);crown.position.y=Math.max(floor+.02,-t*.35);crown.material.opacity=(1-t)*.7;ripples.forEach((r,i)=>{const age=Math.max(0,t-i*.12);r.scale.setScalar(.4+age*2.8);r.material.opacity=Math.max(0,.45-age*.6);});});
  }else if(key==='wind'){
   const cuts=[];for(let i=0;i<2;i++){const slash=arc(g,.48+i*.15,.025,i?p.main:p.hot,i*2.4,Math.PI*1.15,.65);slash.rotation.x=.75+i*.5;slash.rotation.z=.35;cuts.push(slash);}
   const flecks=[];for(let i=0;i<5;i++){const leaf=addMesh(g,new THREE.PlaneGeometry(.07,.025),basic(i%2?0x9da67c:p.main,.65));flecks.push(leaf);}
   effect(g,.28,t=>{cuts.forEach((s,i)=>{s.rotation.y=t*4+i;s.scale.setScalar(.65+t*.8);s.material.opacity=(1-t)*.65;});flecks.forEach((s,i)=>{const a=i*2.4+t*6;s.position.set(Math.cos(a)*t*.75,t*.35,Math.sin(a)*t*.75);s.rotation.z=a;s.material.opacity=(1-t)*.5;});});
  }else if(key==='fire'){
   const flame=elementFlameMaterial(0),ball=addMesh(g,new THREE.SphereGeometry(.36,24,16),flame),flash=sprite(g,p.hot,.75,.8),smoke=[],tongues=[];
   for(let i=0;i<5;i++){const s=sprite(g,i%2?0x6c6560:0x938b80,.40,.20);s.position.set(Math.sin(i*2.4)*.15,.1,Math.cos(i*2.4)*.15);smoke.push(s);}
   for(let i=0;i<5;i++){const f=addMesh(g,new THREE.SphereGeometry(.12,12,8),elementFlameMaterial(0));tongues.push(f);}
   const ground=groundGlow(g,0xea6c23,2,.15);ground.position.y=floor+.02;
   effect(g,.68,(t,age)=>{flame.uniforms.uTime.value=age;ball.scale.setScalar(.5+Math.sin(Math.min(1,t*3.6)*Math.PI));ball.visible=t<.28;flame.uniforms.uOpacity.value=Math.max(0,1-t*3.6)*.9;flash.material.opacity=Math.max(0,1-t*7)*.8;smoke.forEach((s,i)=>{s.position.set(Math.sin(i*2.4)*(.15+t*.35),.12+t*(.7+i*.07),Math.cos(i*2.4)*(.15+t*.35));s.scale.setScalar(.3+t*.75);s.material.opacity=Math.sin(t*Math.PI)*.18;});tongues.forEach((f,i)=>{const a=i*2.4;f.position.set(Math.cos(a)*t*.35,t*(.4+i*.10),Math.sin(a)*t*.35);f.scale.set(.5*(1-t),1.1*(1-t),.5*(1-t));f.material.uniforms.uTime.value=age+i;f.visible=t<.65;});ground.material.opacity=(1-t)*.15;});
   particles(key,position,{count:15,speed:1.7,life:.48,lift:1.3,gravity:2.7,size:.07});
  }else{
   const flash=sprite(g,p.hot,.55,.85),sparks=[];for(let i=0;i<6;i++){const s=addMesh(g,new THREE.SphereGeometry(.018,6,4),basic(p.hot));sparks.push(s);}
   effect(g,.22,(t,age)=>{flash.material.opacity=(1-t)*.7;flash.scale.setScalar(.2+(1-t)*.45);sparks.forEach((s,i)=>{const a=i*2.4;s.position.set(Math.cos(a)*t*.6,Math.sin(a*1.7)*t*.4,Math.sin(a)*t*.6);s.scale.setScalar(1-t);});});
  }
 }
 function lightning(from,to){
  const g=new THREE.Group();g.name='lightning-strike';const palette=PALETTES.lightning,delta=to.clone().sub(from),side=new THREE.Vector3().crossVectors(delta,new THREE.Vector3(0,1,0));if(side.lengthSq()<.001)side.set(1,0,0);side.normalize();const points=Array.from({length:13},()=>new THREE.Vector3()),segments=[],branches=[],up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3();const geometry=new THREE.CylinderGeometry(1,1,1,5),coreMaterial=basic(palette.hot),outerMaterial=basic(palette.main,.30),seed=Math.random()*10;
  for(let i=0;i<12;i++)segments.push({inner:addMesh(g,geometry,coreMaterial),outer:addMesh(g,geometry,outerMaterial)});
  for(let i=0;i<3;i++){const mesh=addMesh(g,geometry,basic(palette.main,.65));branches.push(mesh);}
  function place(mesh,a,b,r){direction.subVectors(b,a);const length=direction.length();direction.normalize();mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.set(r,length,r);mesh.quaternion.setFromUnitVectors(up,direction);}
  function redraw(tick){for(let i=0;i<=12;i++){const t=i/12,w=Math.sin(t*Math.PI);points[i].copy(from).lerp(to,t);if(i>0&&i<12){points[i].addScaledVector(side,Math.sin(seed+i*8.7+tick*2.1)*.16*w);points[i].y+=Math.cos(seed+i*4.2+tick)*.11*w;}}for(let i=0;i<12;i++){place(segments[i].inner,points[i],points[i+1],.010);place(segments[i].outer,points[i],points[i+1],.037);}branches.forEach((mesh,i)=>{const a=points[3+i*3],b=a.clone().addScaledVector(side,Math.sin(seed+tick+i)*.32);b.y-=.16;place(mesh,a,b,.006);});}
  redraw(0);let lastTick=-1;const flash=sprite(g,palette.hot,.48,.75);flash.position.copy(to);
  effect(g,.19,(t,age)=>{const tick=Math.floor(age*35);if(tick!==lastTick){lastTick=tick;redraw(tick);}const pulse=tick%3===1?.45:1;coreMaterial.opacity=(1-t)*pulse;outerMaterial.opacity=(1-t)*.3*pulse;branches.forEach(b=>b.material.opacity=(1-t)*.55);flash.material.opacity=(1-t)*.7;});impact('lightning',to);
 }

 function status(enemy){
  const key=enemy.burn>0?'fire':enemy.wet>0?'water':enemy.armorBreak>0||enemy.stun>0?'earth':null;let record=statuses.get(enemy.id);
  if(record&&(!enemy.alive||record.key!==key)){release(record.group);statuses.delete(enemy.id);record=null;}
  if(!key||!enemy.alive)return;
  if(!record){const g=new THREE.Group();scene.add(g);const palette=PALETTES[key],glow=groundGlow(g,palette.main,1.35,.27),pieces=[];
   if(key==='water'){for(let i=0;i<5;i++){const a=addMesh(g,new THREE.SphereGeometry(.028,10,6),waterSkin(.75));a.scale.set(.8,1.7,.8);pieces.push(a);}}
   if(key==='fire'){for(let i=0;i<3;i++){const a=addMesh(g,new THREE.SphereGeometry(.095,12,8),elementFlameMaterial(0));pieces.push(a);}}
   if(key==='earth'){for(let i=0;i<3;i++){const a=addMesh(g,new THREE.OctahedronGeometry(.075),basic(palette.hot));a.position.y=1.6;pieces.push(a);}}
   record={group:g,key,pieces,glow};statuses.set(enemy.id,record);
  }
  record.group.position.copy(enemy.group.position);record.group.position.y=.25;record.group.scale.setScalar(enemy.group.scale.y);record.glow.material.opacity=key==='water'?.12:.16;const height=enemy.hitHeight||.8;
  record.pieces.forEach((obj,i)=>{if(key==='water'){const phase=(time*.7+i*.2)%1;obj.position.set(Math.sin(i*2.4)*.32,height*(1-phase),Math.cos(i*2.4)*.32);obj.material.opacity=Math.sin(phase*Math.PI)*.65;}else if(key==='fire'){const phase=(time*1.6+i/3)%1;obj.position.set(Math.sin(i*2.4)*.25,height*.2+phase*height*.65,Math.cos(i*2.4)*.25);obj.scale.set(1-phase*.6,1.3*(1-phase)+.3,1-phase*.6);obj.material.uniforms.uTime.value=time+i;}else{obj.position.set(Math.sin(time*3+i*2.1)*.38,height+.15+Math.sin(time*4)*.05,Math.cos(time*3+i*2.1)*.38);}});

 }
 function removeStatus(id){const record=statuses.get(id);if(record){release(record.group);statuses.delete(id);}}
 function update(dt){time+=dt;for(let i=active.length-1;i>=0;i--){const e=active[i];e.age+=dt;e.update(Math.min(1,e.age/e.life),e.age);if(e.age>=e.life){release(e.group);active.splice(i,1);}}}
 function clear(){for(const e of active)release(e.group);active.length=0;for(const r of statuses.values())release(r.group);statuses.clear();}
 return{cast,projectile,impact,lightning,status,removeStatus,update,clear,burst(key,position,count=10){particles(key,position,{count:Math.max(6,count*2),speed:1.8,life:.55,lift:1.5,size:.18});},setViewportHeight(height){pointMaterial.uniforms.uViewportHeight.value=height;for(const e of active){if(e.group.material?.uniforms?.uViewportHeight)e.group.material.uniforms.uViewportHeight.value=height;}},get activeCount(){return active.length;},get statusCount(){return statuses.size;}};
}
