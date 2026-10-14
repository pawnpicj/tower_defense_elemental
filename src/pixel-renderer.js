import * as THREE from 'three';

export function createPixelRenderer(renderer,scene,camera){
 const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,type:THREE.HalfFloatType,depthBuffer:true});
 target.texture.generateMipmaps=false;
 target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
 const screenScene=new THREE.Scene(),screenCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const uniforms={tColor:{value:target.texture},tDepth:{value:target.depthTexture},uResolution:{value:new THREE.Vector2(1,1)},uExposure:{value:1.1}};
 const material=new THREE.ShaderMaterial({
  uniforms,depthTest:false,depthWrite:false,transparent:true,toneMapped:false,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`
   uniform sampler2D tColor;uniform sampler2D tDepth;uniform vec2 uResolution;uniform float uExposure;varying vec2 vUv;
   vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
   vec3 linearToSRGB(vec3 x){return mix(x*12.92,1.055*pow(max(x,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),x));}
   float bayer(vec2 p){vec2 q=mod(p,4.);float x=q.x,y=q.y;if(y<1.){if(x<1.)return 0.;if(x<2.)return 8.;if(x<3.)return 2.;return 10.;}if(y<2.){if(x<1.)return 12.;if(x<2.)return 4.;if(x<3.)return 14.;return 6.;}if(y<3.){if(x<1.)return 3.;if(x<2.)return 11.;if(x<3.)return 1.;return 9.;}if(x<1.)return 15.;if(x<2.)return 7.;if(x<3.)return 13.;return 5.;}
   void main(){
    vec2 pixel=floor(vUv*uResolution);vec2 uv=(pixel+.5)/uResolution;vec4 sampleColor=texture2D(tColor,uv);
    if(sampleColor.a<.01){gl_FragColor=vec4(0.);return;}
    vec3 color=linearToSRGB(aces(sampleColor.rgb*uExposure));
    // A stable low-resolution palette with restrained ordered dithering.
    float d=(bayer(pixel)/16.-.5)*.012;
    color=floor(clamp(color+d,0.,1.)*12.+.5)/12.;
    float depth=texture2D(tDepth,uv).r;vec2 texel=1./uResolution;
    float edge=0.;edge=max(edge,abs(depth-texture2D(tDepth,uv+vec2(texel.x,0.)).r));edge=max(edge,abs(depth-texture2D(tDepth,uv-vec2(texel.x,0.)).r));edge=max(edge,abs(depth-texture2D(tDepth,uv+vec2(0.,texel.y)).r));edge=max(edge,abs(depth-texture2D(tDepth,uv-vec2(0.,texel.y)).r));
    color=mix(color,vec3(.16,.22,.20),step(.008,edge)*.6);
    gl_FragColor=vec4(color,sampleColor.a);
   }
  `
 });
 screenScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
 let width=1,height=1,pixelSize=3;
 function resize(w,h){width=w;height=h;renderer.setSize(w,h);target.setSize(Math.max(1,Math.ceil(w/pixelSize)),Math.max(1,Math.ceil(h/pixelSize)));uniforms.uResolution.value.set(target.width,target.height);}
 return{
  render(){renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.clear();renderer.render(screenScene,screenCamera);},
  resize,setPixelSize(value){pixelSize=value;resize(width,height);},setExposure(value){uniforms.uExposure.value=value;},
  get pixelSize(){return pixelSize;},get resolution(){return{width:target.width,height:target.height};}
 };
}
export function pixelTexture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=16;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,16,16);
 if(kind==='grass'||kind==='leaf'){
  for(let i=0;i<8;i++){const x=(i*7)%16,y=(i*11+Math.floor(i/4))%16;ctx.fillStyle=i%3?'#e1e9d9':'#c5d6b5';ctx.fillRect(x,y,i%2?1:2,1);}
 }else if(kind==='stone'||kind==='earth'){
  for(let i=0;i<12;i++){ctx.fillStyle=i%3?'#e6e5da':'#c2c4b4';ctx.fillRect((i*5)%16,(i*7)%16,2,1);}if(kind==='earth'){ctx.fillStyle='#b9b49d';ctx.fillRect(0,7,16,2);ctx.fillRect(0,14,16,1);}
 }else if(kind==='wood'){
  for(let i=2;i<16;i+=4){ctx.fillStyle='#c8b6a2';ctx.fillRect(i,0,1,16);ctx.fillStyle='#e3d6c2';ctx.fillRect(i+1,3,1,8);}
 }else if(kind==='path'){
  for(let i=0;i<18;i++){ctx.fillStyle=i%2?'#cbbb9b':'#eee2c9';ctx.fillRect((i*7)%16,(i*9+Math.floor(i/3))%16,1+(i%2),1);}
 }else if(kind==='water'){
  ctx.fillStyle='#b6e1e4';for(let i=0;i<5;i++)ctx.fillRect((i*5)%16,i*3,3,1);ctx.fillStyle='#e2f3e9';ctx.fillRect(3,6,4,1);ctx.fillRect(9,12,3,1);
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(kind==='grass'?3:kind==='water'?3:1,kind==='grass'?2:1);return texture;
}
