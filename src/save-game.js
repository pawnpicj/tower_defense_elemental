import {BATTLEFIELDS} from './battlefields.js';
import {createEconomy} from './economy.js';
export const SAVE_KEY='elemental-frontier.checkpoint.v1';
const elements=['earth','water','wind','fire','lightning'];
const number=(x,max=1e9)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
export function validateSave(data){
 if(!data||data.version!==1||!Number.isInteger(data.completed)||data.completed<0||data.completed>50||!Number.isInteger(data.lives)||data.lives<1||data.lives>20||!number(data.elapsed,1e7)||!Number.isSafeInteger(data.lastEnemyId)||data.lastEnemyId<0||!['kills','bossKills','escaped'].every(k=>Number.isSafeInteger(data[k])&&number(data[k]))||data.bossKills>6||![1,2,3].includes(data.speed)||!number(data.totalDamage,1e12)||typeof data.savedAt!=='string'||!Number.isFinite(Date.parse(data.savedAt)))return false;
 for(const field of ['damage','shots','effects'])if(!data[field]||Object.keys(data[field]).length!==5||!elements.every(k=>number(data[field][k],1e12)))return false;
 if(!data.combos||Object.keys(data.combos).length!==3||!['wetLightning','fireSpread','armorBreak'].every(k=>Number.isSafeInteger(data.combos[k])&&number(data.combos[k])))return false;
 if(Math.abs(elements.reduce((a,k)=>a+data.damage[k],0)-data.totalDamage)>.1)return false;
 const mapId=data.battlefield??'forest';if(typeof mapId!=='string'||!Object.hasOwn(BATTLEFIELDS,mapId))return false;const map=BATTLEFIELDS[mapId];if(!Array.isArray(data.economy?.towers)||data.economy.towers.some((t,i)=>i>=map.plots.length&&t!==null))return false;
 return createEconomy().restore(data.economy,data.completed);
}
export function createSaveStore(getStorage){
 function read(){try{const raw=getStorage().getItem(SAVE_KEY);if(!raw)return{save:null};const save=JSON.parse(raw);return validateSave(save)?{save}:{save:null,error:'ไฟล์เซฟไม่รองรับหรือข้อมูลไม่ครบ'};}catch{return{save:null,error:'อ่านเซฟไม่ได้ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์'};}}
 function write(save){if(!validateSave(save))return{ok:false,error:'ข้อมูลเซฟไม่ถูกต้อง'};try{getStorage().setItem(SAVE_KEY,JSON.stringify(save));return{ok:true};}catch{return{ok:false,error:'บันทึกไม่ได้ พื้นที่จัดเก็บอาจเต็มหรือถูกปิด'};}}
 return{read,write};
}
