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
 const canvas=document.createElement('canvas');canvas.width=canvas.height=16;
 const ctx=canvas.getContext('2d');for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-7.5)/8,alpha=Math.floor(Math.max(0,1-d)*5)/5;ctx.fillStyle=`rgba(255,255,255,${alpha})`;ctx.fillRect(x,y,1,1);}
 const glowTexture=new THREE.CanvasTexture(canvas);glowTexture.magFilter=glowTexture.minFilter=THREE.NearestFilter;glowTexture.generateMipmaps=false;
 const pointMaterial=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uLife:{value:1},uColor:{value:new THREE.Color()},uHot:{value:new THREE.Color()},uGravity:{value:2},uViewportHeight:{value:240}},
  vertexShader:`attribute vec3 velocity; attribute float size; attribute float seed; uniform float uTime; uniform float uLife; uniform float uGravity; uniform float uViewportHeight; varying float vFade; varying float vSeed;
  void main(){float p=clamp(uTime/uLife,0.,1.);vec3 pos=position+velocity*uTime;pos.y-=uGravity*uTime*uTime*.5;vec4 mv=modelViewMatrix*vec4(pos,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(floor(size*(1.-p*.7)*projectionMatrix[1][1]*uViewportHeight*.5+.5),1.,10.);vFade=(1.-p)*(1.-p);vSeed=seed;}`,
  fragmentShader:`uniform vec3 uColor;uniform vec3 uHot;varying float vFade;varying float vSeed;void main(){vec2 q=gl_PointCoord-.5;float d=length(q)*2.;float soft=1.;float core=step(max(abs(q.x),abs(q.y)),.2);gl_FragColor=vec4(mix(uColor,uHot,core+.2*vSeed),soft*vFade);}`,
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
 function arcGeometry(radius,width,start=0,length=Math.PI*2,segments=24){
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
 function cast(key,position){const g=new THREE.Group();g.position.copy(position);const p=PALETTES[key],flash=sprite(g,p.hot,1.2,.8),halo=arc(g,.38,.045,p.main);halo.rotation.z=.45;
  effect(g,.28,t=>{flash.scale.setScalar(1.3*(1-t)+.1);flash.material.opacity=(1-t)*.8;halo.scale.setScalar(.5+t*1.6);halo.material.opacity=1-t;});particles(key,position,{count:10,speed:.9,life:.32,gravity:0,lift:.4,size:.18});
 }
 function projectile(key,position){
  const g=new THREE.Group();scene.add(g);g.position.copy(position);const p=PALETTES[key],glow=sprite(g,p.main,key==='fire'?1.55:1.05,.7),core=sprite(g,p.hot,.42,1);const accents=[];
  if(key==='earth'){const rock=addMesh(g,new THREE.DodecahedronGeometry(.26,0),new THREE.MeshStandardMaterial({color:p.dark,roughness:.9,flatShading:true}));accents.push(rock);for(let i=0;i<3;i++){const shard=addMesh(g,new THREE.OctahedronGeometry(.09),basic(p.hot,.8));shard.position.set(Math.sin(i*2.1)*.31,Math.cos(i*2.1)*.31,0);accents.push(shard);}}
  if(key==='water'){const drop=addMesh(g,new THREE.SphereGeometry(.17,12,8),basic(p.main,.85));drop.scale.set(.85,.85,1.6);accents.push(drop);const hoop=arc(g,.28,.035,p.hot);accents.push(hoop);}
  if(key==='wind'){glow.material.opacity=.3;for(let i=0;i<3;i++){const blade=arc(g,.28+i*.13,.06,p.hot,i*2.1,Math.PI*1.25,.85);blade.rotation.x=.6;accents.push(blade);}}
  if(key==='fire'){for(let i=0;i<4;i++){const flame=sprite(g,i%2?p.main:p.hot,.45,.85);flame.position.set(Math.sin(i*2.4)*.18,Math.cos(i*2.4)*.18,-i*.12);accents.push(flame);}}
  const trail=makeRibbon(key);let elapsed=0,emission=0;
  return{group:g,update(pos,progress,dt){const old=g.position.clone();g.position.copy(pos);elapsed+=dt;emission+=dt;const direction=pos.clone().sub(old);if(direction.lengthSq()>.0001)g.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction.normalize());accents.forEach((a,i)=>{a.rotation.z=elapsed*(key==='wind'?14:5)+i;});glow.scale.setScalar((key==='fire'?1.55:1.05)*(1+Math.sin(elapsed*22)*.08));updateRibbon(trail,pos,key==='fire'?.2:key==='wind'?.22:.12);if(emission>.055){emission=0;particles(key,pos,{count:key==='fire'?4:2,speed:.5,life:.35,gravity:key==='earth'?3:-.3,lift:.2,size:key==='fire'?.2:.12});}},dispose(){release(g);const object=trail.mesh;active.push({group:object,age:0,life:.18,update:t=>object.material.uniforms.uOpacity.value=(1-t)*.6});}}
 }
 function impact(key,position,scale=1){
  const p=PALETTES[key],g=new THREE.Group();g.position.copy(position);g.position.y=.24;const ground=groundGlow(g,p.main,3.5,.5),flash=sprite(g,p.hot,1.6,.9);flash.position.y=.65;
  if(key==='earth'){
   const cracks=[],rocks=[],dust=[];
   for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;const points=[];for(let j=0;j<5;j++){const r=.15+j*.31;points.push(new THREE.Vector3(Math.cos(angle+(j%2)*.12)*r,.04,Math.sin(angle+(j%2)*.12)*r));}const crack=addMesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.023,3,false),basic(p.hot,.9));cracks.push(crack);
    const rock=addMesh(g,new THREE.ConeGeometry(.15+(i%2)*.09,.7+(i%3)*.18,5),new THREE.MeshStandardMaterial({color:i%2?p.dark:p.main,roughness:1,flatShading:true}));rock.position.set(Math.cos(angle)*.9,-.3,Math.sin(angle)*.9);rock.rotation.z=Math.sin(angle)*.25;rocks.push(rock);
    const d=sprite(g,p.main,1,.22);d.position.set(Math.cos(angle),.22,Math.sin(angle));dust.push(d);
   }
   const wave=arc(g,.9,.09,p.main);effect(g,.95,(t,age)=>{const rise=Math.sin(Math.min(1,t*3)*Math.PI/2);rocks.forEach((r,i)=>{r.position.y=-.4+rise*.5-Math.max(0,t-.45)*1.2;r.scale.y=.4+rise*.7;});cracks.forEach(r=>{r.scale.setScalar(.4+Math.min(t*4,1)*.7);r.material.opacity=(1-t)*.9;});wave.scale.setScalar(.4+t*2);wave.material.opacity=(1-t)*.5;dust.forEach((d,i)=>{d.position.x*=1+.5/60;d.position.z*=1+.5/60;d.scale.setScalar(1+t*1.3);d.material.opacity=(1-t)*.2;});flash.material.opacity=Math.max(0,1-t*4);ground.material.opacity=(1-t)*.45;});
   particles(key,position,{count:22,speed:2,life:.65,lift:2.8,gravity:7,size:.18});
  }else if(key==='water'){
   const waves=[];for(let i=0;i<3;i++){const wave=arc(g,.6,.055,i===1?p.hot:p.main);wave.position.y=.035+i*.025;waves.push(wave);}
   const splash=[];for(let i=0;i<9;i++){const angle=i*2.39996,points=[];for(let j=0;j<=12;j++){const t=j/12;points.push(new THREE.Vector3(Math.cos(angle)*t*1.15,Math.sin(t*Math.PI)*(.65+(i%3)*.18),Math.sin(angle)*t*1.15));}const stream=addMesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.024,4,false),basic(i%2?p.main:p.hot,.7));splash.push(stream);}
   effect(g,.85,(t)=>{waves.forEach((w,i)=>{const progress=Math.max(0,t-i*.1);w.scale.setScalar(.3+progress*2.6);w.material.opacity=Math.max(0,1-progress*1.4)*.85;});splash.forEach(s=>{s.scale.setScalar(.45+Math.min(1,t*4)*.65);s.material.opacity=Math.max(0,1-t)*.7;});flash.material.opacity=Math.max(0,1-t*4);ground.material.opacity=(1-t)*.35;});
   particles(key,position.clone().add(new THREE.Vector3(0,.5,0)),{count:35,speed:2.3,life:.8,lift:3.5,gravity:8,size:.2});
  }else if(key==='wind'){
   const vortex=[];for(let i=0;i<5;i++){const a=arc(g,.38+i*.13,.045,p.hot,i*.8,Math.PI*1.65,.75);a.position.y=.2+i*.24;vortex.push(a);}
   const slashes=[];for(let i=0;i<3;i++){const a=arc(g,.8+i*.16,.08,p.main,i*2,Math.PI*1.1,.8);a.rotation.z=.7+i*.2;a.position.y=.7;slashes.push(a);}
   effect(g,.62,t=>{vortex.forEach((a,i)=>{a.rotation.y=t*10+i;a.position.y=.2+i*.24+t*.45;a.scale.setScalar(.5+t*.7);a.material.opacity=(1-t)*.8;});slashes.forEach((a,i)=>{a.rotation.y=-t*8+i;a.scale.setScalar(.6+t);a.material.opacity=(1-t)*.7;});flash.material.opacity=Math.max(0,1-t*5);ground.material.opacity=(1-t)*.2;});
   particles(key,position.clone().add(new THREE.Vector3(0,.6,0)),{count:20,speed:3,life:.5,lift:1,gravity:-.8,size:.14});
  }else if(key==='fire'){
   const shock=arc(g,.6,.12,p.main),inner=arc(g,.4,.055,p.hot),flames=[];
   for(let i=0;i<9;i++){const a=i*2.39996,s=sprite(g,i%3?p.main:p.hot,.8,.8);s.position.set(Math.cos(a)*.5,.3,Math.sin(a)*.5);flames.push(s);}
   const smoke=[];for(let i=0;i<4;i++){const s=sprite(g,0x6e5343,1.1,.15);s.material.blending=THREE.NormalBlending;s.position.set(Math.sin(i*2)*.3,.5+i*.2,Math.cos(i*2)*.3);smoke.push(s);}
   effect(g,.9,t=>{shock.scale.setScalar(.2+t*3.3);shock.material.opacity=Math.pow(1-t,2);inner.scale.setScalar(.3+t*3);inner.material.opacity=Math.max(0,1-t*2);flames.forEach((s,i)=>{s.position.y=.3+t*(1.2+(i%3)*.3);s.scale.set(.7*(1-t),1.3*(1-t)+.1,1);s.material.opacity=Math.pow(1-t,1.6)*.85;});smoke.forEach((s,i)=>{s.position.y=.5+i*.2+t*1.1;s.scale.setScalar(1+t*1.5);s.material.opacity=Math.sin(t*Math.PI)*.12;});flash.scale.setScalar(.3+Math.sin(Math.min(1,t*3)*Math.PI)*2);flash.material.opacity=Math.max(0,1-t*3);ground.material.opacity=Math.pow(1-t,2)*.65;});
   particles(key,position.clone().add(new THREE.Vector3(0,.65,0)),{count:42,speed:3.4,life:.85,lift:3.2,gravity:3,size:.28});
  }else{
   const halo=arc(g,.4,.055,p.main),star=addMesh(g,new THREE.PlaneGeometry(1.5,.035),basic(p.hot));star.position.y=.75;star.rotation.z=.7;const star2=star.clone();star2.geometry=star.geometry.clone();star2.material=star.material.clone();star2.rotation.z=-.7;g.add(star2);
   effect(g,.4,t=>{halo.scale.setScalar(.3+t*3);halo.material.opacity=1-t;flash.scale.setScalar(1.4*(1-t));flash.material.opacity=1-t;star.material.opacity=star2.material.opacity=Math.max(0,1-t*2);ground.material.opacity=(1-t)*.4;});particles(key,position.clone().add(new THREE.Vector3(0,.8,0)),{count:15,speed:2.8,life:.42,lift:1,gravity:0,size:.18});
  }
 }
 function lightning(from,to){
  const g=new THREE.Group(),palette=PALETTES.lightning,delta=to.clone().sub(from),side=new THREE.Vector3().crossVectors(delta,new THREE.Vector3(0,1,0)).normalize();
  const points=[from.clone()];for(let i=1;i<10;i++)points.push(from.clone().lerp(to,i/10).addScaledVector(side,(Math.random()-.5)*.65).add(new THREE.Vector3(0,(Math.random()-.5)*.3,0)));points.push(to.clone());
  function bolt(list,radius,color,opacity){return addMesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(list, false,'catmullrom',.05),list.length*3,radius,4,false),basic(color,opacity));}
  const outer=bolt(points,.072,palette.main,.45),core=bolt(points,.021,palette.hot,1),branches=[];
  for(let i=2;i<8;i+=2){const origin=points[i],tip=origin.clone().addScaledVector(side,(i%4?1:-1)*(.45+Math.random()*.4)).add(new THREE.Vector3(0,-.25,0));branches.push(bolt([origin,origin.clone().lerp(tip,.5).add(new THREE.Vector3(0,.15,0)),tip],.012,palette.main,.75));}
  const start=sprite(g,palette.hot,.9,.9);start.position.copy(from);const end=sprite(g,palette.hot,1.1,1);end.position.copy(to);
  effect(g,.32,(t,age)=>{const flicker=Math.sin(age*110)>.1?1:.45;outer.material.opacity=(1-t)*.6*flicker;core.material.opacity=(1-t)*flicker;branches.forEach(b=>b.material.opacity=(1-t)*.7*flicker);start.material.opacity=end.material.opacity=(1-t)*.9;});impact('lightning',to);
 }
 function status(enemy){
  const key=enemy.burn>0?'fire':enemy.slow>0?'water':enemy.stun>0?'earth':null;let record=statuses.get(enemy.id);
  if(record&&(!enemy.alive||record.key!==key)){release(record.group);statuses.delete(enemy.id);record=null;}
  if(!key||!enemy.alive)return;
  if(!record){const g=new THREE.Group();scene.add(g);const palette=PALETTES[key],glow=groundGlow(g,palette.main,1.35,.27),pieces=[];
   if(key==='water'){for(let i=0;i<2;i++){const a=arc(g,.48+i*.08,.035,palette.hot,i*2,Math.PI*1.4,.7);a.position.y=.05+i*.16;pieces.push(a);}}
   if(key==='fire'){for(let i=0;i<4;i++){const a=sprite(g,i%2?palette.hot:palette.main,.55,.7);a.position.set(Math.sin(i*2.4)*.27,.4,Math.cos(i*2.4)*.27);pieces.push(a);}}
   if(key==='earth'){for(let i=0;i<3;i++){const a=addMesh(g,new THREE.OctahedronGeometry(.075),basic(palette.hot));a.position.y=1.6;pieces.push(a);}}
   record={group:g,key,pieces,glow};statuses.set(enemy.id,record);
  }
  record.group.position.copy(enemy.group.position);record.group.position.y=.25;
  record.pieces.forEach((obj,i)=>{if(key==='water')obj.rotation.y=time*(i?1:-1)*2;else if(key==='fire'){obj.position.y=.3+((time*1.4+i*.25)%1)*.8;obj.scale.set(.4,.75,1);obj.material.opacity=.45+Math.sin(time*12+i)*.15;}else{obj.position.set(Math.sin(time*3+i*2.1)*.38,1.6+Math.sin(time*4)*.05,Math.cos(time*3+i*2.1)*.38);}});
 }
 function removeStatus(id){const record=statuses.get(id);if(record){release(record.group);statuses.delete(id);}}
 function update(dt){time+=dt;for(let i=active.length-1;i>=0;i--){const e=active[i];e.age+=dt;e.update(Math.min(1,e.age/e.life),e.age);if(e.age>=e.life){release(e.group);active.splice(i,1);}}}
 function clear(){for(const e of active)release(e.group);active.length=0;for(const r of statuses.values())release(r.group);statuses.clear();}
 return{cast,projectile,impact,lightning,status,removeStatus,update,clear,burst(key,position,count=10){particles(key,position,{count:Math.max(6,count*2),speed:1.8,life:.55,lift:1.5,size:.18});},setViewportHeight(height){pointMaterial.uniforms.uViewportHeight.value=height;for(const e of active){if(e.group.material?.uniforms?.uViewportHeight)e.group.material.uniforms.uViewportHeight.value=height;}},get activeCount(){return active.length;},get statusCount(){return statuses.size;}};
}
