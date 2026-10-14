// Licensed recorded samples; source credits are served at /audio/credits.html.
export const SOUND_BANK={
 earth:{cast:{files:['earth-cast.wav'],gain:.48},impact:{files:['earth-impact.wav','earth-impact-2.wav'],gain:.65}},
 water:{cast:{files:['water-yofrankie-cast.wav'],gain:.5},impact:{files:['water-yofrankie-impact.wav','water-yofrankie-impact-2.wav'],gain:.85}},
 wind:{cast:{files:['wind-cast.wav'],gain:.65},impact:{files:['wind-impact.wav'],gain:.45}},
 fire:{cast:{files:['fire-cast.wav'],gain:.55},impact:{files:['fire-impact.wav'],gain:.65}},
 lightning:{cast:{files:['lightning-magic-cast.wav'],gain:.22},impact:{files:['lightning-magic-impact.wav','lightning-magic-chain.wav'],gain:.72}}
};
const files=[...new Set(Object.values(SOUND_BANK).flatMap(element=>Object.values(element).flatMap(sound=>sound.files)))];
async function downloadSamples(){return new Map(await Promise.all(files.map(async file=>{const response=await fetch(`/audio/${file}`);if(!response.ok)throw Error(`Unable to load ${file}: ${response.status}`);return[file,await response.arrayBuffer()];})));}
export async function decodeSampleBank(context,raw){const inputs=raw||await downloadSamples();return new Map(await Promise.all([...inputs].map(async([file,bytes])=>[file,await context.decodeAudioData(bytes.slice(0))])));}
export function playRecordedSound(context,destination,bank,key,stage,when,{index=0,rate=1,level=1}={}){
 const descriptor=SOUND_BANK[key]?.[stage];if(!descriptor)throw Error('Unknown elemental sound');
 const file=descriptor.files[index%descriptor.files.length],buffer=bank.get(file);if(!buffer)throw Error(`Missing decoded sound: ${file}`);
 const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.playbackRate.value=rate;const duration=buffer.duration/rate;
 gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(descriptor.gain*level,when+.004);gain.gain.setValueAtTime(descriptor.gain*level,when+Math.max(.005,duration-.035));gain.gain.linearRampToValueAtTime(0,when+duration);
 source.connect(gain);gain.connect(destination);source.start(when);source.stop(when+duration+.005);
 return{source,gain,file,duration,stop(){try{source.stop();}catch{}source.disconnect();gain.disconnect();}};
}
export function createTowerAudio({spatial=()=>({pan:0,gain:1})}={}){
 let context=null,master=null,compressor=null,bank=null,decoding=null,enabled=true,volume=.5,available=!!(window.AudioContext||window.webkitAudioContext),error=null,generation=0;
 const voices=new Set(),lastPlayed=new Map(),lastIndex=new Map(),pending=[];
 const stats={played:0,dropped:0,samplesPlayed:0,byElement:Object.fromEntries(Object.keys(SOUND_BANK).map(key=>[key,{cast:0,impact:0}]))};
 // Pre-fetch without starting an audio context or playing sound before a gesture.
 const raw=downloadSamples();raw.catch(e=>{error=e.message;refresh();});
 try{const saved=JSON.parse(localStorage.getItem('tower-defense-audio')||'null');if(saved){enabled=saved.enabled!==false;const value=Number(saved.volume);if(Number.isFinite(value))volume=Math.max(0,Math.min(1,value));}}catch{}
 function save(){try{localStorage.setItem('tower-defense-audio',JSON.stringify({enabled,volume}));}catch{}}
 function refresh(){const toggle=document.querySelector('#sound-toggle'),range=document.querySelector('#sound-volume');
  if(toggle){toggle.textContent=enabled&&volume>0?'♪':'♩';toggle.setAttribute('aria-pressed',String(enabled));toggle.setAttribute('aria-label',enabled?'ปิดเสียงเอฟเฟกต์':'เปิดเสียงเอฟเฟกต์');toggle.title=error?'โหลดเสียงไม่สำเร็จ · รีเฟรชเพื่อลองใหม่':available?(enabled?'ปิดเสียงเอฟเฟกต์':'เปิดเสียงเอฟเฟกต์'):'เบราว์เซอร์ไม่รองรับเสียง';toggle.disabled=!available;}
  if(range){range.value=String(Math.round(volume*100));range.disabled=!available;range.setAttribute('aria-valuetext',`${Math.round(volume*100)}%`);}
  if(master&&context)master.gain.setTargetAtTime(enabled?volume*.55:0,context.currentTime,.025);
 }
 async function unlock(){if(!available)return false;
  try{if(!context){const AudioContext=window.AudioContext||window.webkitAudioContext;context=new AudioContext({latencyHint:'interactive'});master=context.createGain();master.gain.value=enabled?volume*.55:0;compressor=context.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.18;master.connect(compressor);compressor.connect(context.destination);}
   if(context.state==='suspended')await context.resume();
   if(!decoding)decoding=raw.then(data=>decodeSampleBank(context,data)).then(decoded=>{bank=decoded;const now=performance.now();for(const item of pending.splice(0))if(item.generation===generation&&now-item.time<250)play(item.key,item.stage,item.position,item.options);return true;});
   await decoding;error=null;refresh();return context.state==='running';
  }catch(e){error=e.message;pending.length=0;refresh();return false;}
 }
 function stopAll(){generation++;pending.length=0;for(const voice of [...voices])voice.stop();voices.clear();lastPlayed.clear();}
 function play(key,stage,position,{delay=0,variant=0}={}){
  if(!enabled||volume===0||!context||context.state!=='running'||document.hidden||error)return false;
  if(!bank){if(pending.length<6)pending.push({key,stage,position:position?.clone(),options:{delay,variant},generation,time:performance.now()});return false;}
  const now=context.currentTime,throttle=`${key}:${stage}:${variant}`,gap=key==='wind'?.11:.07;
  if(voices.size>=20||now-(lastPlayed.get(throttle)??-Infinity)<gap){stats.dropped++;return false;}lastPlayed.set(throttle,now);
  const location=spatial(position),gain=context.createGain();gain.gain.value=(location.gain??1)*(variant?Math.pow(.7,variant):1);
  const pan=context.createStereoPanner();pan.pan.value=Math.max(-.75,Math.min(.75,location.pan??0));gain.connect(pan);pan.connect(master);
  const descriptor=SOUND_BANK[key][stage],id=`${key}:${stage}`,previous=lastIndex.get(id)??-1;
  let index=Math.floor(Math.random()*descriptor.files.length);if(descriptor.files.length>1&&index===previous)index=(index+1)%descriptor.files.length;if(key==='lightning'&&stage==='impact')index=variant>0?1:0;lastIndex.set(id,index);
  const rate=(1+(Math.random()-.5)*.05)*(key==='lightning'?1+variant*.06:1);
  const sound=playRecordedSound(context,gain,bank,key,stage,now+.005+delay,{index,rate});
  let stopped=false;const voice={stop(){if(stopped)return;stopped=true;sound.stop();pan.disconnect();gain.disconnect();voices.delete(voice);}};
  voices.add(voice);sound.source.onended=()=>voice.stop();stats.played++;stats.samplesPlayed++;stats.byElement[key][stage]++;return true;
 }
 const toggle=document.querySelector('#sound-toggle'),slider=document.querySelector('#sound-volume');
 toggle?.addEventListener('click',()=>{enabled=!enabled;if(!enabled)stopAll();else void unlock();save();refresh();});
 slider?.addEventListener('input',()=>{volume=Number(slider.value)/100;if(volume===0)stopAll();save();refresh();});
 document.addEventListener('pointerdown',()=>void unlock(),{capture:true,once:true});document.addEventListener('keydown',()=>void unlock(),{capture:true,once:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});refresh();
 return{play,unlock,stopAll,stats,get enabled(){return enabled;},get volume(){return volume;},get contextState(){return context?.state??'locked';},get activeVoices(){return voices.size;},get error(){return error;},get loadedSamples(){return bank?.size??0;},get ready(){return!!bank;},get mode(){return'recorded-samples';}};
}
