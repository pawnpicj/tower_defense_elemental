import * as THREE from 'three';
import {addToonOutline} from './toon-style.js';
export function createSpawnGate(parent,position){
 const group=new THREE.Group();group.name='monster-spawn-gate';group.position.copy(position);group.rotation.y=Math.PI/2;parent.add(group);
 const stone=new THREE.MeshPhongMaterial({color:0x596879,shininess:16});
 const edge=new THREE.MeshPhongMaterial({color:0x354450,shininess:22});
 const pale=new THREE.MeshPhongMaterial({color:0xadb4b5,shininess:30});
 const crystal=new THREE.MeshPhongMaterial({color:0xb183f0,emissive:0x7841c3,emissiveIntensity:.6,shininess:90,flatShading:true});
 const rune=new THREE.MeshBasicMaterial({color:0xd2a8ff});
 function part(geometry,material,x=0,y=0,z=0,outline=true){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=false;group.add(mesh);if(outline)addToonOutline(mesh);return mesh;}
 function box(w,h,d,mat,x,y,z){return part(new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
 box(2.85,.16,1.02,edge,0,-.025,.06);box(2.62,.08,.88,pale,0,.09,.06);
 for(const x of [-1.13,1.13]){
  box(.55,.19,.72,edge,x,.23,0);
  for(let j=0;j<4;j++){const block=box(.40,.37,.49,j%2?stone:pale,x,.51+j*.37,0);block.rotation.z=(j%2?1:-1)*.012;}
  box(.55,.17,.65,edge,x,1.85,0);
  box(.09,.82,.025,edge,x,1.01,.264);
  for(let j=0;j<3;j++){const glyph=part(new THREE.OctahedronGeometry(.065),rune,x,.73+j*.27,.285,false);glyph.scale.set(.6,1,.25);}
 }
 for(let i=0;i<11;i++){
  const a=i/11*Math.PI+.012,b=(i+1)/11*Math.PI-.012,shape=new THREE.Shape();shape.moveTo(Math.cos(a)*.95,1.80+Math.sin(a)*.95);shape.lineTo(Math.cos(a)*1.32,1.80+Math.sin(a)*1.32);shape.absarc(0,1.80,1.32,a,b,false);shape.lineTo(Math.cos(b)*.95,1.80+Math.sin(b)*.95);shape.absarc(0,1.80,.95,b,a,true);shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.46,bevelEnabled:true,bevelThickness:.022,bevelSize:.018,bevelSegments:2,curveSegments:12});geometry.translate(0,0,-.23);part(geometry,i===5?pale:stone);
 }
 const keystone=part(new THREE.OctahedronGeometry(.22),crystal,0,3.12,.29);keystone.scale.set(.7,1.2,.5);
 for(const x of [-1.42,1.42]){const shard=part(new THREE.OctahedronGeometry(.15),crystal,x,.46,0);shard.scale.set(.75,1.6,.75);}
 const shape=new THREE.Shape();shape.moveTo(-.94,.16);shape.lineTo(.94,.16);shape.lineTo(.94,1.80);shape.absarc(0,1.80,.94,0,Math.PI,false);shape.closePath();
 const time={value:0};
 const membrane=new THREE.ShaderMaterial({uniforms:{uTime:time},side:THREE.DoubleSide,
 vertexShader:`varying vec2 vPoint;void main(){vPoint=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform float uTime;varying vec2 vPoint;void main(){vec2 p=(vPoint-vec2(0.,1.42))/vec2(.96,1.30);float r=length(p),a=atan(p.y,p.x);float swirl=sin(a*5.-r*11.+uTime*2.+sin(r*8.-uTime)*.7);float mist=sin(p.x*13.+sin(p.y*8.+uTime))*sin(p.y*12.-uTime*.8);float edge=pow(smoothstep(.48,1.05,r),2.);vec3 c=mix(vec3(.055,.035,.13),vec3(.30,.12,.53),.28+swirl*.20+mist*.12);c+=vec3(.35,.18,.55)*edge;c+=vec3(.24,.10,.34)*pow(max(swirl,0.),12.)*(1.-smoothstep(.25,1.25,r));gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const surface=part(new THREE.ShapeGeometry(shape,48),membrane,0,0,-.035,false);surface.name='spawn-portal-surface';surface.castShadow=false;
 const rimPoints=[new THREE.Vector3(-.94,.17,.05),new THREE.Vector3(-.94,1.80,.05)];for(let i=1;i<=48;i++){const a=Math.PI-i/48*Math.PI;rimPoints.push(new THREE.Vector3(Math.cos(a)*.94,1.80+Math.sin(a)*.94,.05));}rimPoints.push(new THREE.Vector3(.94,.17,.05));
 part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPoints),128,.025,8,false),rune,0,0,0,false);
 const motes=[];const moteGeometry=new THREE.SphereGeometry(.025,8,6);for(let i=0;i<12;i++){const mote=part(moteGeometry,rune,0,0,0,false);mote.castShadow=false;motes.push(mote);}
 return {group,update(t){time.value=t;for(let i=0;i<motes.length;i++){const a=i*2.4+t*.35,r=.35+(i%3)*.19;motes[i].position.set(Math.cos(a)*r,.25+((t*.18+i/12)%1)*2.35,.07+Math.sin(a)*.05);motes[i].scale.setScalar(.6+.4*Math.sin(t*2+i)**2);}keystone.position.y=3.12+Math.sin(t*1.6)*.025;}};
}
