import * as THREE from 'three';
import {createModelKit} from './model-kit.js';
import {createSpawnGate} from './spawn-gate.js';
export function createBattlefield(parent,map,palette){
 const group=new THREE.Group();group.name='battlefield-'+map.id;parent.add(group);const {mesh,box,cyl,beam}=createModelKit(group),m=palette;
 const ground=new THREE.MeshPhongMaterial({color:map.ground,shininess:8}),side=new THREE.MeshPhongMaterial({color:map.side,flatShading:true}),road=new THREE.MeshPhongMaterial({color:map.road,shininess:8}),rockMat=new THREE.MeshPhongMaterial({color:map.id==='canyon'?0xa68160:0x788481,flatShading:true});
 box(25,.9,16,side,0,-.55,0);box(25.2,.18,16.2,ground,0,0,0);
 const seen=new Set();for(const path of map.routes)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],key=[a,b].map(p=>p.join(',')).sort().join('|');if(seen.has(key))continue;seen.add(key);const length=Math.hypot(b[0]-a[0],b[1]-a[1]),section=box(length+1.08,.045,1.08,road,(a[0]+b[0])/2,.15,(a[1]+b[1])/2);section.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);}
 const gates=map.routes.map(path=>{const [x,z]=path[0],gate=createSpawnGate(group,new THREE.Vector3(x,.2,z));const next=path[1];gate.group.rotation.y=Math.atan2(next[0]-x,next[1]-z);return gate;});
 const end=map.routes[0].at(-1),base=new THREE.Group();base.position.set(end[0],.2,end[1]);group.add(base);
 for(const z of [-.9,.9]){cyl(.42,.51,1.8,m.stone,0,.9,z,8,base);cyl(.56,.44,.22,m.dark,0,1.93,z,8,base);mesh(new THREE.ConeGeometry(.57,.60,8),m.water,0,2.3,z,base);}box(.55,.25,2.3,m.light,0,1.78,0,base);box(.15,1.48,1.25,m.wood,.08,.75,0,base);
 for(let i=0;i<6;i++)box(.17,1.5,.028,m.gold,0,.76,-.54+i*.22,base);
 if(map.id==='forest'){
  box(1.4,.015,16,m.water,8.3,.12,0);for(const x of [7.55,9.05])box(.12,.06,16,m.stone,x,.14,0);
  for(let i=0;i<9;i++)box(.22,.10,1.75,m.wood,7.45+i*.22,.24,-3);
  for(const z of [-3.9,-2.1]){for(const x of [7.4,9.2])cyl(.045,.045,.65,m.wood,x,.56,z,6);beam(new THREE.Vector3(7.4,.85,z),new THREE.Vector3(9.2,.85,z),.035,m.wood);}
  for(const [x,z,s] of [[-10,5,1],[-11,6.4,.8],[-8.7,6.5,.9],[-10,-6.5,1],[-8.5,-7,.7],[-3,-6.7,1.1],[-1.6,-6.6,.8],[1.8,-5.6,.95],[3,-6.8,1.1],[10.5,5.5,1],[11.5,6.9,.8],[9.3,6.8,.8],[10.5,-6.2,1],[11.8,-5.8,.7]]){const tree=new THREE.Group();tree.position.set(x,.15,z);tree.scale.setScalar(s);group.add(tree);cyl(.1,.16,.9,m.wood,0,.45,0,6,tree);for(let j=0;j<3;j++)cyl(0,.65-j*.13,.92,[m.leafDark,m.leaf,m.leafLight][j],0,.9+j*.4,0,7,tree);}
 }else if(map.id==='canyon'){
  for(let i=0;i<14;i++){const x=-10.5+(i%7)*3.4,z=i<7?-7.1:7.2,r=mesh(new THREE.DodecahedronGeometry(.65+(i%3)*.18),rockMat,x,.65,z);r.scale.set(1.25,1.0+(i%3)*.4,.75);r.rotation.y=i;}
  for(const [x,z] of [[-11,3],[4,-6],[10,5]]){const r=mesh(new THREE.DodecahedronGeometry(.55),rockMat,x,.36,z);r.scale.y=.8;}
 }else{
  for(let i=0;i<10;i++){const x=-10+(i%5)*4.6,z=i<5?-7:7,h=.6+(i%3)*.45;cyl(.38,.46,.16,m.dark,x,.2,z,8);cyl(.24,.3,h,m.stone,x,.28+h/2,z,10);if(i%2===0)cyl(.36,.33,.15,m.light,x,.36+h,z,8);}
  for(const [x,z] of [[-1,-5],[5,-5],[4,6]]){const slab=box(1.15,.28,.65,m.stone,x,.26,z);slab.rotation.y=x*.3;}
 }
 return{group,gates,update(t){gates.forEach(g=>g.update(t));},dispose(){const geos=new Set(),mats=new Set(),shared=new Set(Object.values(m));group.traverse(o=>{if(o.geometry&&!o.isSprite)geos.add(o.geometry);if(o.material&&!o.userData.toonOutline&&!shared.has(o.material))mats.add(o.material);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());group.removeFromParent();}};
}
