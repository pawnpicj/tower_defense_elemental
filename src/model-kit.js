import * as THREE from 'three';
import { toonMaterial,addToonOutline } from './toon-style.js';
export function createPalette(material=toonMaterial){return {grass:material('#7fb34b'),grassTop:material('#98c85c'),earth:material('#8f7249'),stone:material('#d6d0ac'),light:material('#efe2b6'),dark:material('#5a705a'),wood:material('#97622e'),gold:material('#e2ad39',{metalness:.55,roughness:.4}),path:material('#ebc685'),pathEdge:material('#bf9454'),water:material('#1fafd2',{metalness:.25,roughness:.3}),leaf:material('#398341'),leafLight:material('#80b348'),leafDark:material('#245f37'),black:material('#344b43')};}
export function createModelKit(world){
function mesh(geo,mat,x=0,y=0,z=0,parent=world){const a=new THREE.Mesh(geo,mat);a.position.set(x,y,z);a.castShadow=a.receiveShadow=true;parent.add(a);addToonOutline(a);return a;}
function box(w,h,d,mat,x,y,z,parent=world){return mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);}
function cyl(rt,rb,h,mat,x,y,z,n=8,parent=world){return mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat,x,y,z,parent);}
function ring(r,t,mat,x,y,z,parent=world){const a=mesh(new THREE.TorusGeometry(r,t,6,48),mat,x,y,z,parent);a.rotation.x=Math.PI/2;return a;}
function beam(a,b,r,mat,parent=world){const v=new THREE.Vector3().subVectors(b,a);const obj=mesh(new THREE.CylinderGeometry(r,r,v.length(),6),mat,0,0,0,parent);obj.position.copy(a).add(b).multiplyScalar(.5);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return obj;}
return{mesh,box,cyl,ring,beam};
}
