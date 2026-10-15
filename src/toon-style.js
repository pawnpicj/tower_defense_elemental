import * as THREE from 'three';
// Three deliberately separated lighting bands for the selected cartoon direction.
const gradientMap=new THREE.DataTexture(new Uint8Array([55,155,255]),3,1,THREE.RedFormat);
gradientMap.minFilter=gradientMap.magFilter=THREE.NearestFilter;gradientMap.generateMipmaps=false;gradientMap.needsUpdate=true;
export function toonMaterial(color,extra={}){
 const {roughness,metalness,...options}=extra;
 return new THREE.MeshToonMaterial({color,gradientMap,flatShading:true,...options});
}
const outlineMaterial=new THREE.MeshBasicMaterial({color:0x24352c,side:THREE.BackSide});
export function addToonOutline(object){
 if(!object.isMesh||object.geometry.type==='PlaneGeometry')return;
 const dimensions=object.geometry.parameters;
 if(dimensions.height!==undefined&&dimensions.height<.1)return;
 const hull=new THREE.Mesh(object.geometry,outlineMaterial);const extent=Math.max(dimensions.width||0,dimensions.height||0,dimensions.depth||0,(dimensions.radius||0)*2,(dimensions.radiusBottom||0)*2);hull.scale.setScalar(extent>4?1.006:1.035);hull.castShadow=false;hull.receiveShadow=false;hull.userData.sharedGeometry=true;hull.userData.toonOutline=true;
 hull.raycast=()=>{};object.add(hull);
}
