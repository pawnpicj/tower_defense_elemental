import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
const earthStone=new THREE.MeshPhongMaterial({color:0x827c65,shininess:12,flatShading:true});
const earthDark=new THREE.MeshPhongMaterial({color:0x4d5548,shininess:10});
const earthEdge=new THREE.MeshPhongMaterial({color:0xb0a285,shininess:20});
const earthAmber=new THREE.MeshBasicMaterial({color:0xffc25c});
const earthDust=new THREE.MeshBasicMaterial({color:0xdac090,transparent:true,opacity:.55,depthWrite:false});
const earthTime={value:0};
const earthCoreMaterial=new THREE.ShaderMaterial({uniforms:{uTime:earthTime},
 vertexShader:`varying vec3 vPoint;varying vec3 vN;void main(){vPoint=position;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform float uTime;varying vec3 vPoint;varying vec3 vN;
 vec3 hash3(vec3 p){return fract(sin(vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))))*43758.5453);}
 void main(){vec3 p=vPoint*3.6,i=floor(p),f=fract(p);float first=10.,second=10.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)for(int z=-1;z<=1;z++){vec3 c=vec3(float(x),float(y),float(z));vec3 d=c+hash3(i+c)*.8-f;float dist=dot(d,d);if(dist<first){second=first;first=dist;}else second=min(second,dist);}float edge=sqrt(second)-sqrt(first);float crack=1.-smoothstep(.014,.055,edge);float light=.48+.52*max(dot(normalize(vN),normalize(vec3(-.5,.9,.8))),0.);vec3 rock=mix(vec3(.22,.20,.15),vec3(.39,.37,.29),fract(sin(dot(floor(p*8.),vec3(12.9,78.2,39.4)))*431.1)*.2+.35)*light;vec3 amber=vec3(1.,.46,.035)*(1.15+.25*sin(uTime*2.));gl_FragColor=vec4(mix(rock,amber,crack),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
function ancientRockGeometry(radius){const g=new THREE.DodecahedronGeometry(radius,0),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),w=1.+Math.sin(x*17.+y*11.+z*23.)*.075;p.setXYZ(i,x*w,y*w,z*w);}g.computeVertexNormals();return g;}
const windStone=new THREE.MeshPhongMaterial({color:0xe8e4cb,shininess:24,specular:0xaaa991});
const windJade=new THREE.MeshPhongMaterial({color:0x399d78,shininess:70,specular:0xa7edd0});
const windLight=new THREE.MeshPhongMaterial({color:0x8cdbc0,shininess:85,specular:0xe2fff4});
const windGold=new THREE.MeshPhongMaterial({color:0xd7ad50,shininess:65,specular:0xffeac0});
const windAirMaterial=new THREE.MeshBasicMaterial({color:0xb7ffe0,transparent:true,opacity:.65,depthWrite:false});
const windDark=new THREE.MeshPhongMaterial({color:0x38584a,shininess:24});
function windPanelGeometry(points,depth=.18){
 const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const point of points.slice(1))shape.lineTo(...point);shape.closePath();return windShapeGeometry(shape,depth);
}
function windShapeGeometry(shape,depth=.18){
 const raw=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:12});raw.deleteAttribute('normal');raw.deleteAttribute('uv');
 const g=mergeVertices(raw);raw.dispose();g.translate(0,0,-depth/2);g.computeVertexNormals();g.parameters={height:1.5,width:1.3,depth};return g;
}
function windBladeGeometry(){return windPanelGeometry([[-.28,.05],[.22,.13],[-.04,1.02]],.11);}
const teslaCeramic=new THREE.MeshPhongMaterial({color:0xd6d5e7,shininess:45,specular:0xf2eaff});
const teslaMetal=new THREE.MeshPhongMaterial({color:0x596477,shininess:80,specular:0xd8e3ff});
const teslaCopper=new THREE.MeshPhongMaterial({color:0xc69a55,shininess:75,specular:0xffdfad});
const teslaCrystal=new THREE.MeshPhongMaterial({color:0x9865ed,emissive:0x5121b6,emissiveIntensity:.65,shininess:100,specular:0xe3d4ff,flatShading:true});
const teslaEnergy=new THREE.MeshBasicMaterial({color:0xceacff});
const boltInner=new THREE.MeshBasicMaterial({color:0xe5eaff});
const boltOuter=new THREE.MeshBasicMaterial({color:0x986bff,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending});
const boltGeometry=new THREE.CylinderGeometry(1,1,1,6);const boltUp=new THREE.Vector3(0,1,0),boltDirection=new THREE.Vector3();
function buildTeslaArc(parent,start,end,seed,animated){
 const group=new THREE.Group();group.name='tesla-lightning-arc';parent.add(group);const segments=[];
 for(let i=0;i<8;i++){const outer=new THREE.Mesh(boltGeometry,boltOuter),inner=new THREE.Mesh(boltGeometry,boltInner);outer.userData.sharedGeometry=inner.userData.sharedGeometry=true;group.add(outer,inner);segments.push({outer,inner});}
 const arc={type:'teslaArc',obj:group,start,end,seed,segments,points:Array.from({length:9},()=>new THREE.Vector3())};animated.push(arc);animateTeslaArc(arc,0);
}
function animateTeslaArc(a,time){
 const tick=Math.floor(time*14),seed=a.seed+tick*1.93;a.obj.visible=Math.sin(tick*.73+a.seed)>-.65;
 for(let i=0;i<=8;i++){const t=i/8,p=a.points[i];p.copy(a.start).lerp(a.end,t);if(i>0&&i<8){const w=Math.sin(t*Math.PI)*.09;p.x+=Math.sin(seed+i*7.1)*w;p.y+=Math.cos(seed*.83+i*4.7)*w;p.z+=Math.sin(seed*1.3+i*5.3)*w;}}
 for(let i=0;i<8;i++){const pair=a.segments[i],p=a.points[i],q=a.points[i+1];boltDirection.subVectors(q,p);const length=boltDirection.length();boltDirection.normalize();for(const [obj,r] of [[pair.inner,.009],[pair.outer,.024]]){obj.position.copy(p).add(q).multiplyScalar(.5);obj.scale.set(r,length,r);obj.quaternion.setFromUnitVectors(boltUp,boltDirection);}}
}
const waterStone=new THREE.MeshPhongMaterial({color:0xeee8d4,shininess:65,specular:0xe1f5f7});
const waterTrim=new THREE.MeshPhongMaterial({color:0x69b9be,shininess:70,specular:0xc7fbff});
const waterFlow=new THREE.MeshPhongMaterial({color:0x26c0e5,emissive:0x075978,emissiveIntensity:.2,shininess:130,specular:0xffffff,transparent:true,opacity:.86});
const waterFoam=new THREE.MeshBasicMaterial({color:0xc6faff,transparent:true,opacity:.7,depthWrite:false});
const waterTime={value:0};
const waterSheetMaterial=new THREE.ShaderMaterial({uniforms:{uTime:waterTime},transparent:true,depthWrite:false,side:THREE.DoubleSide,
 vertexShader:`uniform float uTime;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.x+=sin(uv.y*12.-uTime*2.7)*.016*sin(uv.y*3.14159);p.z+=cos(uv.y*10.-uTime*2.)*.014*sin(uv.y*3.14159);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`uniform float uTime;varying vec2 vUv;void main(){float edge=sin(vUv.x*3.14159);float flow=sin(vUv.y*38.-uTime*5.+sin(vUv.x*9.+uTime));float gleam=pow(max(0.,flow),9.)*.55;float broken=.75+.25*sin(vUv.y*19.-uTime*2.);vec3 c=mix(vec3(.015,.43,.68),vec3(.28,.87,.98),vUv.x*.5+gleam);gl_FragColor=vec4(c,pow(max(edge,0.),.7)*(.65+gleam*.28)*broken);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
const waterSurfaceMaterial=new THREE.ShaderMaterial({uniforms:{uTime:waterTime},transparent:true,side:THREE.DoubleSide,depthWrite:false,
 vertexShader:`uniform float uTime;varying vec2 vPoint;void main(){vPoint=position.xy;vec3 p=position;float r=length(position.xy);p.z+=sin(r*38.-uTime*3.)*.008+sin(position.x*15.+uTime)*.004;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`uniform float uTime;varying vec2 vPoint;void main(){float r=length(vPoint);float wave=sin(r*38.-uTime*3.+sin(vPoint.x*12.+uTime)*.6);float foam=pow(max(wave,0.),12.)*.45;vec3 c=mix(vec3(.08,.57,.72),vec3(.57,.93,.98),.3+foam);gl_FragColor=vec4(c,.90);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
function waterRibbon(curve,width){const positions=[],uvs=[],indices=[],rows=72,side=new THREE.Vector3();for(let j=0;j<=rows;j++){const t=j/rows,p=curve.getPoint(t),tangent=curve.getTangent(t);side.set(-tangent.z,0,tangent.x);if(side.lengthSq()<.01)side.set(1,0,0);side.normalize();const w=width*(.78+.22*Math.sin(t*7));for(let i=0;i<=6;i++){const offset=(i/6-.5)*w;positions.push(p.x+side.x*offset,p.y+Math.sin(i/6*Math.PI)*.008,p.z+side.z*offset);uvs.push(i/6,t);}}for(let j=0;j<rows;j++)for(let i=0;i<6;i++){const a=j*7+i,b=a+7;indices.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;}
function softenWaterMesh(obj){for(const child of [...obj.children])if(child.userData.toonOutline)obj.remove(child);return obj;}

const waterDropMaterial=new THREE.ShaderMaterial({uniforms:{uTime:waterTime},transparent:true,
 vertexShader:`uniform float uTime;varying vec3 vN;varying vec3 vView;varying vec3 vPoint;void main(){vN=normalize(normalMatrix*normal);vec3 vertex=position;float breath=sin(uTime*2.+position.y*5.);vertex.xz*=1.+breath*.035;vertex.x+=sin(uTime*1.3)*position.y*position.y*.045;vec4 p=modelViewMatrix*vec4(vertex,1.);vView=-p.xyz;vPoint=vertex;gl_Position=projectionMatrix*p;}`,
 fragmentShader:`uniform float uTime;varying vec3 vN;varying vec3 vView;varying vec3 vPoint;void main(){vec3 n=normalize(vN),v=normalize(vView);float rim=pow(1.-max(dot(n,v),0.),2.);float flow=sin(vPoint.y*15.-uTime*2.+sin(vPoint.x*14.+uTime)*.8)*sin(vPoint.z*13.+uTime*.6);vec3 c=mix(vec3(.04,.65,.89),vec3(.02,.34,.66),rim*.8);c+=vec3(.06,.13,.13)*flow;vec3 l=normalize(vec3(-.5,.8,1.));float highlight=pow(max(dot(n,normalize(l+v)),0.),42.);c=mix(c,vec3(.9,1.,1.),highlight*.92);gl_FragColor=vec4(c,.78+rim*.20);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
function waterProfile(points){const curve=new THREE.CatmullRomCurve3(points.map(([r,y])=>new THREE.Vector3(r,y,0)));return curve.getPoints(64).map(p=>new THREE.Vector2(Math.max(.001,p.x),p.y));}
// Object-space turbulence keeps the fire continuous across the spherical seam.
const fireTime={value:0};
const fireNoise=`
 float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float turbulence(vec3 p){return noise3(p)*.57+noise3(p*2.03)*.28+noise3(p*4.01)*.15;}
`;
const fireCoreMaterial=new THREE.ShaderMaterial({uniforms:{uTime:fireTime},
 vertexShader:`uniform float uTime;varying vec3 vPoint;varying vec3 vNormal;varying vec3 vView;
 void main(){vPoint=position;vec3 p=position+normal*(sin(position.y*16.+uTime*3.)*sin(position.x*13.-uTime*2.)*.008);vec4 view=modelViewMatrix*vec4(p,1.);vNormal=normalize(normalMatrix*normal);vView=-view.xyz;gl_Position=projectionMatrix*view;}`,
 fragmentShader:`uniform float uTime;varying vec3 vPoint;varying vec3 vNormal;varying vec3 vView;${fireNoise}
 void main(){vec3 p=vPoint*6.;p.y-=uTime*1.3;float warp=turbulence(p*.7+vec3(0,uTime*.22,0));float n=turbulence(p+vec3(warp*2.2,warp*.8,-warp));float veins=smoothstep(.40,.64,n);float rim=pow(1.-max(dot(normalize(vNormal),normalize(vView)),0.),1.6);vec3 c=mix(vec3(1.,.13,.012),vec3(1.,.72,.06),veins);c=mix(c,vec3(1.,.96,.55),smoothstep(.59,.76,n)*.85);c*=1.-rim*.25;gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
const fireFlameMaterial=new THREE.ShaderMaterial({uniforms:{uTime:fireTime},side:THREE.DoubleSide,transparent:true,depthWrite:false,
 vertexShader:`uniform float uTime;varying vec2 vUv;varying vec3 vColor;void main(){vUv=uv;vColor=color;vec3 p=position;float sway=uv.y*uv.y;p.x+=sin(uv.y*8.-uTime*5.+position.y*5.)*.065*sway;p.z+=cos(uv.y*6.-uTime*4.)*.035*sway;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`uniform float uTime;varying vec2 vUv;varying vec3 vColor;void main(){float edge=pow(abs(sin(vUv.x*6.283185)),.65);float hot=(1.-edge)*(.38-vUv.y*.25);vec3 c=mix(vColor,vec3(1.,.97,.57),hot);float alpha=(.96+hot*.04)*(1.-smoothstep(.82,1.,vUv.y));gl_FragColor=vec4(c,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,vertexColors:true});
const fireGlowMaterial=new THREE.MeshBasicMaterial({color:0xff8a16,transparent:true,opacity:.12,depthWrite:false,blending:THREE.AdditiveBlending});
const fireEmberMaterial=new THREE.MeshBasicMaterial({color:0xffda65});
function flameGeometry(height,width,bend){
 const positions=[],colors=[],uvs=[],indices=[],rows=22,sides=12;
 for(let j=0;j<=rows;j++){const t=j/rows,r=Math.max(.001,width*Math.pow(1-t,.8)*(.85+.15*Math.sin(t*6))),cx=bend*(Math.sin(t*Math.PI*.9)*.8+t*.5)+Math.sin(t*Math.PI*2)*.055;
  const color=new THREE.Color().setRGB(1,THREE.MathUtils.lerp(.56,.10,t),THREE.MathUtils.lerp(.045,.002,t));
  for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;positions.push(cx+Math.cos(a)*r,height*t,Math.sin(a)*r*.65);colors.push(color.r,color.g,color.b);uvs.push(i/sides,t);}
 }
 for(let j=0;j<rows;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function fireMesh(geometry,material,parent,x,y,z){const obj=new THREE.Mesh(geometry,material);obj.position.set(x,y,z);parent.add(obj);return obj;}
export function animateTowerVisuals(group,time){
 fireTime.value=time;waterTime.value=time;earthTime.value=time;
 for(const a of group.userData.animated){
  if(a.type==='fireOrb'){a.obj.position.y=a.base+Math.sin(time*2.4)*.045;a.obj.rotation.y=time*.12;}
  else if(a.type==='fireTongue'){const pulse=Math.sin(time*6+a.phase);a.obj.scale.set(1+pulse*.1,1+Math.sin(time*5+a.phase)*.16,1);a.obj.rotation.z=Math.sin(time*4+a.phase)*.13;}
  else if(a.type==='fireEmber'){const life=(time*a.speed+a.phase)%1;a.obj.position.set(a.x+Math.sin(time*2+a.phase)*.06,a.base+life*.65,a.z);a.obj.scale.setScalar(Math.sin(life*Math.PI)*.8);}
  else if(a.type==='earthCore'){a.obj.position.y=a.base+Math.sin(time*1.35)*.055;a.obj.rotation.y=time*.12;a.obj.rotation.z=Math.sin(time*.8)*.035;}
  else if(a.type==='earthOrbit'){const angle=a.phase+time*a.speed;a.obj.position.set(Math.cos(angle)*a.radius,a.base+Math.sin(time*1.7+a.phase)*.10,Math.sin(angle)*a.radius);a.obj.rotation.y=-angle*.7;a.obj.rotation.z=Math.sin(time+a.phase)*.18;}
  else if(a.type==='earthDust'){const life=(time*.16+a.phase)%1,angle=a.phase*20.+time*.2;a.obj.position.set(Math.cos(angle)*a.radius,a.base+life*.7,Math.sin(angle)*a.radius);a.obj.scale.setScalar(Math.sin(life*Math.PI)*.8);}
  else if(a.type==='waterDrop'){a.obj.position.y=a.base+Math.sin(time*1.8)*.06;a.obj.rotation.y=Math.sin(time*.7)*.12;const breathe=Math.sin(time*1.8);a.obj.scale.set(1+breathe*.025,1-breathe*.035,1+breathe*.025);}
  else if(a.type==='waterRipple'){const life=(time*.35+a.phase)%1;a.obj.scale.setScalar(.35+life*.65);a.obj.position.y=a.base+Math.sin(time*2+a.phase)*.006;}
  else if(a.type==='waterSpiral')a.obj.rotation.y=a.phase+time*.65;
  else if(a.type==='waterBead'){const t=(time*a.speed+a.phase)%1;a.obj.position.copy(a.curve.getPoint(t));a.obj.scale.setScalar(.6+Math.sin(t*Math.PI)*.4);}
  else if(a.type==='teslaArc')animateTeslaArc(a,time);
  else if(a.type==='teslaCore'){a.obj.rotation.y=time*.45;a.obj.position.y=a.base+Math.sin(time*2.3)*.035;}
  else if(a.type==='teslaRing')a.obj.rotation.y=time*.5;
  else if(a.type==='windFlow')a.obj.rotation.y=a.phase+time*.75;
  else if(a.type==='windRotor')a.obj.rotation.z=-time*2.3;
  else if(a.type==='windOrbit'){a.obj.rotation.z=a.phase+time*a.speed;a.obj.rotation.y=.3+Math.sin(time*.6+a.phase)*.12;}
  else if(a.type==='rotor')a.obj.rotation.z=-time*3.5;
  else if(a.type==='flame'){a.obj.scale.set(1+Math.sin(time*7)*.08,1+Math.cos(time*9)*.12,1);a.obj.rotation.y=time*.6;}
  else if(a.type==='float')a.obj.position.y=Math.sin(time*2)*.08;
  else if(a.type==='water'){a.obj.position.y=a.base+Math.sin(time*2+a.base)*.06;a.obj.rotation.z=Math.sin(time*.5)*.12;}
  else if(a.type==='rock'){a.obj.position.y=a.base+Math.sin(time*1.5)*.035;a.obj.rotation.y=time*.08;}
  else a.obj.rotation.y=time*(a.type==='lightning'?.5:.3);
 }
}
export function towerFactory({mesh,box,cyl,ring,beam,m,elementMats,brightMats}){
function buildTower(key,level=1){
 const g=new THREE.Group(),body=new THREE.Group();g.add(body);const color=elementMats[key],glow=brightMats[key],animated=[];
 cyl(.73,.88,.22,key==='wind'?windDark:key==='lightning'?teslaMetal:key==='water'?waterTrim:key==='earth'?earthDark:m.dark,0,.21,0,key==='wind'||key==='lightning'||key==='water'?48:8,body);cyl(.68,.73,.16,key==='wind'?windStone:key==='lightning'?teslaCeramic:key==='water'?waterStone:key==='earth'?earthEdge:m.light,0,.4,0,key==='wind'||key==='lightning'||key==='water'?48:8,body);
 if(key==='earth'){
  const plinth=mesh(new THREE.CylinderGeometry(.61,.71,.22,8),earthDark,0,.59,0,body);plinth.receiveShadow=false;
  for(let row=0;row<3;row++){const block=mesh(new THREE.CylinderGeometry(.45+row*.025,.51,.38,6),row%2?earthEdge:earthStone,0,.88+row*.34,0,body);block.rotation.y=row*.18;block.receiveShadow=false;}
  const capital=mesh(new THREE.CylinderGeometry(.67,.48,.22,8),earthDark,0,1.84,0,body);capital.receiveShadow=false;capital.name='earth-capital';
  for(let i=0;i<4;i++){const angle=i*Math.PI/2+.4,armor=mesh(new THREE.BoxGeometry(.25,.90,.30),earthStone,Math.sin(angle)*.44,1.16,Math.cos(angle)*.44,body);armor.rotation.y=angle;armor.rotation.z=(i%2?1:-1)*.05;armor.receiveShadow=false;}
  const seal=fireMesh(new THREE.TorusGeometry(.39,.018,8,64),earthAmber,body,0,1.97,0);seal.rotation.x=Math.PI/2;
  const coreGroup=new THREE.Group();coreGroup.position.y=2.85;coreGroup.name='earth-floating-core';body.add(coreGroup);const core=fireMesh(ancientRockGeometry(.51),earthCoreMaterial,coreGroup,0,0,0);core.scale.set(1,1.18,1);core.name='earth-cracked-rock';coreGroup.scale.setScalar(1+(level-1)*.07);animated.push({obj:coreGroup,type:'earthCore',base:2.85});
  for(let i=0;i<4;i++){const angle=i*Math.PI/2+.4,face=new THREE.Group();face.position.set(Math.sin(angle)*.60,1.25,Math.cos(angle)*.60);face.rotation.y=angle;body.add(face);for(let j=0;j<3;j++){const rune=fireMesh(new THREE.BoxGeometry(j===1?.15:.08,.025,.012),earthAmber,face,j===1?0:.02,j*.10-.10,0);rune.rotation.z=j===1?.5:-.5;}}
  if(level>=2){const count=level===3?5:3;for(let i=0;i<count;i++){const phase=i/count*Math.PI*2,rock=mesh(ancientRockGeometry(level===3?.13:.11),i%2?earthEdge:earthStone,Math.cos(phase)*.82,2.42,Math.sin(phase)*.82,body);rock.name='earth-orbiting-shard';rock.receiveShadow=false;animated.push({obj:rock,type:'earthOrbit',phase,radius:level===3?.86:.78,base:2.40+(i%2)*.15,speed:.35});}}
  if(level===3){for(let i=0;i<4;i++){const angle=i*Math.PI/2+.4,armor=mesh(new THREE.CylinderGeometry(.14,.22,.72,5),earthEdge,Math.sin(angle)*.61,.96,Math.cos(angle)*.61,body);armor.rotation.z=Math.sin(angle)*.17;armor.receiveShadow=false;}
   for(let i=0;i<12;i++){const dust=fireMesh(new THREE.SphereGeometry(.018,6,4),earthDust,body,0,2.1,0);animated.push({obj:dust,type:'earthDust',phase:i/12,radius:.45+(i%3)*.11,base:2.0});}
  }
 }else if(key==='water'){
  const column=mesh(new THREE.LatheGeometry(waterProfile([[.57,.49],[.50,.64],[.39,.91],[.31,1.28],[.32,1.52],[.43,1.69]]),48),waterStone,0,0,0,body);column.name='water-fountain-column';column.receiveShadow=false;softenWaterMesh(column);
  const bowl=mesh(new THREE.LatheGeometry(waterProfile([[.36,1.63],[.51,1.73],[.67,1.93],[.71,2.08],[.66,2.12],[.61,2.04],[.54,1.91],[.30,1.84],[.001,1.84]]),64),waterStone,0,0,0,body);bowl.name='water-fountain-bowl';bowl.receiveShadow=false;softenWaterMesh(bowl);
  for(const [r,y] of [[.53,.57],[.39,1.65],[.68,2.09]]){const trim=mesh(new THREE.TorusGeometry(r,.03,12,80),waterTrim,0,y,0,body);trim.rotation.x=Math.PI/2;trim.receiveShadow=false;softenWaterMesh(trim);}
  const pool=fireMesh(new THREE.CircleGeometry(.60,80),waterSurfaceMaterial,body,0,2.055,0);pool.rotation.x=-Math.PI/2;pool.name='water-pool';

  const drop=new THREE.Group();drop.position.y=2.24;drop.name='water-floating-drop';body.add(drop);
  const droplet=fireMesh(new THREE.LatheGeometry(waterProfile([[.001,0],[.16,.045],[.29,.19],[.32,.36],[.27,.53],[.15,.73],[.06,.89],[.001,1.02]]),64),waterDropMaterial,drop,0,0,0);droplet.name='water-smooth-drop';animated.push({obj:drop,type:'waterDrop',base:2.24});
  const channels=level===1?3:4;
  for(let i=0;i<channels;i++){const a=i*Math.PI*2/channels+.3,point=(r,y)=>new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);const curve=new THREE.CatmullRomCurve3([point(.66,2.08),point(.67,1.91),point(.45,1.64),point(.38,1.32),point(.44,.93),point(.54,.60)]);
   const stream=fireMesh(waterRibbon(curve,.14),waterSheetMaterial,body,0,0,0);stream.name='water-cascade';const bead=fireMesh(new THREE.SphereGeometry(.038,12,8),waterFoam,body,0,0,0);bead.position.copy(curve.getPoint(i/channels));animated.push({obj:bead,type:'waterBead',curve,phase:i/channels,speed:.42});
  }
  if(level>=2){const base=mesh(new THREE.TorusGeometry(.67,.035,12,80),waterTrim,0,.58,0,body);base.rotation.x=Math.PI/2;softenWaterMesh(base);
   for(let i=0;i<3;i++){const a=i*Math.PI*2/3,curve=new THREE.CatmullRomCurve3([new THREE.Vector3(Math.sin(a)*.49,2.07,Math.cos(a)*.49),new THREE.Vector3(Math.sin(a)*.38,2.32,Math.cos(a)*.38),new THREE.Vector3(Math.sin(a)*.14,2.29,Math.cos(a)*.14)]);fireMesh(waterRibbon(curve,.08),waterSheetMaterial,body,0,0,0);}
  }
  if(level===3){for(let i=0;i<2;i++){const spiral=new THREE.Group();spiral.name='water-lv3-vortex';body.add(spiral);const pts=[];for(let j=0;j<=64;j++){const t=j/64,a=t*Math.PI*1.8;pts.push(new THREE.Vector3(Math.cos(a)*.48,2.20+t*.63,Math.sin(a)*.48));}const curve=new THREE.CatmullRomCurve3(pts);fireMesh(waterRibbon(curve,.18),waterSheetMaterial,spiral,0,0,0);animated.push({obj:spiral,type:'waterSpiral',phase:i*Math.PI});const bead=fireMesh(new THREE.SphereGeometry(.035,12,8),waterFoam,spiral,0,0,0);bead.position.copy(curve.getPoint(i*.5));animated.push({obj:bead,type:'waterBead',curve,phase:i*.5,speed:.28});}}
 }else if(key==='wind'){
  // Crossed triangular body and three pointed blades follow the supplied silhouette.
  const pedestal=mesh(new THREE.CylinderGeometry(.55,.62,.13,48),windGold,0,.54,0,body);pedestal.receiveShadow=false;
  const support=mesh(new THREE.CylinderGeometry(.12,.18,1.6,32),windStone,0,1.35,0,body);support.name='wind-center-support';support.receiveShadow=false;
  const panels=new THREE.Group();panels.name='wind-body-panels';panels.rotation.y=Math.PI/4;body.add(panels);
  const back=mesh(windPanelGeometry([[-.61,.62],[.61,.62],[0,1.94]],.36),windJade,0,0,-.12,panels);back.name='wind-upright-triangle';back.receiveShadow=false;
  const front=mesh(windPanelGeometry([[-.63,1.87],[0,.59],[.63,1.87]],.34),windLight,0,0,.18,panels);front.name='wind-inverted-triangle';front.receiveShadow=false;
  // Thicker spindle with collars carries the rotor above its full sweep.
  mesh(new THREE.CylinderGeometry(.16,.24,1.36,40),windGold,0,2.55,0,body);
  for(const y of [1.98,3.12]){const collar=mesh(new THREE.TorusGeometry(y<2?.24:.18,.04,12,64),windGold,0,y,0,body);collar.rotation.x=Math.PI/2;collar.receiveShadow=false;}
  const head=new THREE.Group();head.position.y=3.25;head.rotation.set(-.2,Math.PI/4,0);body.add(head);
  const bearing=mesh(new THREE.CylinderGeometry(.21,.21,.18,40),windDark,0,0,-.03,head);bearing.rotation.x=Math.PI/2;bearing.receiveShadow=false;bearing.name='wind-rear-bearing';
  const axle=mesh(new THREE.CylinderGeometry(.11,.11,.52,32),windGold,0,0,.23,head);axle.rotation.x=Math.PI/2;axle.receiveShadow=false;axle.name='wind-forward-axle';
  const rotor=new THREE.Group();rotor.position.z=.48;head.add(rotor);rotor.name='wind-triangle-rotor';
  for(let i=0;i<3;i++){const blade=mesh(windBladeGeometry(),windJade,0,0,0,rotor);blade.rotation.z=i*Math.PI*2/3;blade.receiveShadow=false;blade.name='wind-triangle-blade';}
  const rim=mesh(new THREE.CylinderGeometry(.365,.365,.16,64),windGold,0,0,.09,rotor);rim.rotation.x=Math.PI/2;rim.receiveShadow=false;
  const hub=mesh(new THREE.CylinderGeometry(.335,.335,.19,64),windLight,0,0,.15,rotor);hub.rotation.x=Math.PI/2;hub.receiveShadow=false;hub.name='wind-round-hub';
  animated.push({obj:rotor,type:'windRotor'});
 }else if(key==='fire'){
  cyl(.55,.7,1.2,m.dark,0,1.05,0,6,body);for(let i=0;i<6;i++){const a=i*Math.PI/3,buttress=box(.18,1.15,.23,color,Math.sin(a)*.55,1.03,Math.cos(a)*.55,body);buttress.rotation.y=a;}
  cyl(.62,.47,.22,m.gold,0,1.72,0,8,body);cyl(.74,.4,.4,m.black,0,1.98,0,8,body);cyl(.59,.59,.04,glow,0,2.19,0,10,body);
  const orb=new THREE.Group();orb.name='fireball';orb.position.y=2.76;body.add(orb);
  const core=fireMesh(new THREE.SphereGeometry(.46,32,24),fireCoreMaterial,orb,0,0,0);core.name='fireball-core';
  fireMesh(new THREE.SphereGeometry(.51,24,16),fireGlowMaterial,orb,0,0,0);
  animated.push({obj:orb,type:'fireOrb',base:2.76});
  // Unequal roots and heights avoid the previous rigid crown of spikes.
  const tongues=[[0,.43,-.24,.80,.18,.26],[.82,.38,-.18,.56,.15,-.18],[1.8,.40,-.3,.96,.18,.28],[2.7,.38,-.18,.67,.17,-.24],[3.5,.43,-.3,.74,.18,.22],[4.55,.39,-.22,.90,.16,-.26],[5.5,.42,-.25,.62,.17,.21],[2.2,.24,.12,.70,.13,.24],[4.3,.22,.16,.55,.12,-.2]];
  tongues.forEach(([a,r,y,height,width,bend],i)=>{const pivot=new THREE.Group();pivot.position.set(Math.cos(a)*r,y,Math.sin(a)*r);pivot.rotation.y=-a;orb.add(pivot);
   const tongue=fireMesh(flameGeometry(height,width,bend),fireFlameMaterial,pivot,0,0,0);tongue.name='fireball-flame';animated.push({obj:tongue,type:'fireTongue',phase:i*1.73});
  });
  for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*.32,z=Math.sin(a)*.32,ember=fireMesh(new THREE.SphereGeometry(.025,6,4),fireEmberMaterial,orb,x,.35,z);animated.push({obj:ember,type:'fireEmber',x,z,base:.35,phase:i*.17,speed:.45+i*.035});}
  for(let i=0;i<4;i++){const a=i*Math.PI/2;cyl(.04,.07,.45,m.gold,Math.sin(a)*.62,2.18,Math.cos(a)*.62,5,body);}

 }else{
  const profile=[[.49,.49],[.49,.60],[.42,.70],[.34,.88],[.33,1.55],[.37,1.72],[.48,1.81],[.48,1.91]].map(([r,y])=>new THREE.Vector2(r,y));
  const column=mesh(new THREE.LatheGeometry(profile,48),teslaCeramic,0,0,0,body);column.name='tesla-ceramic-column';column.receiveShadow=false;
  for(const y of [.68,1.79]){const cap=mesh(new THREE.CylinderGeometry(y<1?.47:.52,y<1?.49:.48,.13,48),teslaMetal,0,y,0,body);cap.receiveShadow=false;}
  const turns=4+level*2,coilPoints=[];for(let i=0;i<=turns*48;i++){const t=i/(turns*48),a=t*Math.PI*2*turns;coilPoints.push(new THREE.Vector3(Math.cos(a)*.38,.83+t*.80,Math.sin(a)*.38));}
  const coil=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPoints),turns*48,.032,10,false),teslaCopper,0,0,0,body);coil.name='tesla-helical-coil';coil.receiveShadow=false;
  const socket=mesh(new THREE.CylinderGeometry(.30,.38,.16,40),teslaCopper,0,1.98,0,body);socket.receiveShadow=false;
  const energy=fireMesh(new THREE.TorusGeometry(.25,.028,12,64),teslaEnergy,body,0,2.09,0);energy.rotation.x=Math.PI/2;
  const core=mesh(new THREE.OctahedronGeometry(.39),teslaCrystal,0,2.70,0,body);core.scale.set(.86,1.5,.86);core.name='tesla-floating-crystal';core.receiveShadow=false;animated.push({obj:core,type:'teslaCore',base:2.70});
  const count=level===1?3:4;
  for(let i=0;i<count;i++){const a=i*Math.PI*2/count+.4,radial=(r,y)=>new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);const points=[radial(.43,1.84),radial(.63,1.96),radial(.77,2.17),radial(.78,2.52)];const arm=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.047,10,false),teslaCopper,0,0,0,body);arm.receiveShadow=false;
   for(const y of [2.23,2.33,2.43]){const insulator=mesh(new THREE.TorusGeometry(.067,.025,8,32),teslaCeramic,Math.sin(a)*.78,y,Math.cos(a)*.78,body);insulator.rotation.x=Math.PI/2;insulator.receiveShadow=false;}
   const pole=radial(.78,2.58);const ball=mesh(new THREE.SphereGeometry(.115,24,16),teslaCopper,pole.x,pole.y,pole.z,body);ball.name='tesla-terminal';ball.receiveShadow=false;
   buildTeslaArc(body,pole,radial(.23,2.72+(i%2)*.07),i*2.13,animated);
  }
  if(level>=2){const foot=mesh(new THREE.TorusGeometry(.66,.04,12,64),teslaCopper,0,.58,0,body);foot.rotation.x=Math.PI/2;}
  if(level===3){const power=new THREE.Group();power.position.y=2.04;power.name='tesla-lv3-power-ring';body.add(power);const halo=mesh(new THREE.TorusGeometry(.61,.035,12,80),teslaMetal,0,0,0,power);halo.rotation.x=Math.PI/2;
   for(let i=0;i<6;i++){const a=i*Math.PI/3;fireMesh(new THREE.SphereGeometry(.045,12,8),teslaEnergy,power,Math.cos(a)*.61,0,Math.sin(a)*.61);}
   animated.push({obj:power,type:'teslaRing'});
   for(let i=0;i<4;i++){const a=i*Math.PI/2,r=.65;buildTeslaArc(body,new THREE.Vector3(Math.cos(a)*r,2.13,Math.sin(a)*r),new THREE.Vector3(Math.cos(a+1.2)*r,2.13,Math.sin(a+1.2)*r),8+i*1.9,animated);}
  }
 }

 if(key==='wind'&&level>=2){
  const foot=mesh(new THREE.TorusGeometry(.67,.045,12,72),windGold,0,.59,0,body);foot.rotation.x=Math.PI/2;
  for(const x of [-.30,.30]){const rivet=mesh(new THREE.SphereGeometry(.055,16,12),windGold,x,1.47,.39,body.getObjectByName('wind-body-panels'));rivet.scale.z=.45;}
 }
 if(key==='wind'&&level===3){
  const crown=mesh(new THREE.TorusGeometry(.72,.035,12,80),windGold,0,2.04,0,body);crown.rotation.x=Math.PI/2;crown.name='wind-lv3-ring';crown.receiveShadow=false;
  const swept=new THREE.Shape();swept.moveTo(.50,.61);swept.bezierCurveTo(.80,.72,.79,1.05,.54,1.30);swept.bezierCurveTo(.60,1.03,.53,.81,.50,.61);swept.closePath();
  for(let i=0;i<3;i++){const fin=mesh(windShapeGeometry(swept,.08),windGold,0,0,0,body);fin.rotation.y=Math.PI/6+i*Math.PI*2/3;fin.receiveShadow=false;fin.name='wind-lv3-swept-fin';}
  for(let i=0;i<2;i++){const flow=new THREE.Group();flow.position.y=2.04;body.add(flow);const pts=[];for(let j=0;j<=40;j++){const a=j/40*Math.PI*1.1;pts.push(new THREE.Vector3(Math.cos(a)*.63,Math.sin(a*2)*.025,Math.sin(a)*.63));}fireMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),48,.012,8,false),windAirMaterial,flow,0,0,0);animated.push({obj:flow,type:'windFlow',phase:i*Math.PI});}
 }
 if(key!=='wind'&&key!=='lightning'&&key!=='water'&&key!=='earth'&&level>=2){ring(.71,.055,m.gold,0,.57,0,body);for(let i=0;i<4;i++){const a=i*Math.PI/2;const gem=mesh(new THREE.OctahedronGeometry(.09),glow,Math.sin(a)*.57,1.5,Math.cos(a)*.57,body);gem.scale.y=1.4;}}
 if(key!=='wind'&&key!=='lightning'&&key!=='water'&&key!=='earth'&&level===3){const halo=ring(.86,.035,m.gold,0,2.5,0,body);halo.rotation.z=.2;animated.push({obj:halo,type:'upgradeHalo',base:2.5});for(let i=0;i<4;i++){const a=i*Math.PI/2;mesh(new THREE.ConeGeometry(.09,.34,4),m.gold,Math.sin(a)*.62,2.05,Math.cos(a)*.62,body);}}
 g.userData={animated,body,key,level};return g;
}
return buildTower;
}
