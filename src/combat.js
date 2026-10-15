export const FAMILIES=[
 {name:'Slime',thai:'สไลม์',species:['slime'],hp:1},
 {name:'Rat / Spider',thai:'หนู / แมงมุม',species:['rat','spider'],hp:1.08},
 {name:'Goblin',thai:'ก็อบลิน',species:['goblin'],hp:1.16},
 {name:'Skeleton / Zombie',thai:'โครงกระดูก / ซอมบี้',species:['skeleton','zombie'],hp:1.25},
 {name:'Orc',thai:'ออร์ค',species:['orc'],hp:1.4}
];
export const ARCHETYPES={
 normal:{name:'ทั่วไป',symbol:'●',color:'#81bb53',hp:1,speed:1,physical:0,magic:0},
 fast:{name:'วิ่งเร็ว',symbol:'»',color:'#efb438',hp:.7,speed:1.65,physical:0,magic:0},
 armored:{name:'เกราะหนัก',symbol:'⬟',color:'#7895ad',hp:1.8,speed:.72,physical:.45,magic:.15},
 resistant:{name:'ต้านเวท',symbol:'✦',color:'#b078e0',hp:1.2,speed:.9,physical:.1,magic:.5}
};
export function wavePlan(wave){
 if(!Number.isInteger(wave)||wave<1)throw Error('Invalid wave');
 const stage=Math.min(4,Math.floor((wave-1)/10)),family=FAMILIES[stage],boss=wave%10===0;
 const count=Math.min(28,12+Math.floor((wave-1)/2));
 const roster=Array.from({length:count},(_,i)=>({species:family.species[i%family.species.length],archetype:Object.keys(ARCHETYPES)[i%4],boss:false}));
 if(boss){if(stage===3)for(const species of ['skeleton','zombie'])roster.push({species,archetype:'normal',boss:true,hpFactor:.6,rewardFactor:.5});else roster.push({species:family.species.at(-1),archetype:'normal',boss:true});}
 return{wave,stage,family,boss,roster,count:roster.length,spawnInterval:Math.max(.85,1.15-(wave-1)*.006)};
}
export function monsterStats(spec,wave=1){
 const role=ARCHETYPES[spec.archetype]||ARCHETYPES.normal;
 const family=FAMILIES.find(f=>f.species.includes(spec.species))||FAMILIES[0];
 const hp=Math.round(320*family.hp*Math.pow(1.0275,Math.max(0,wave-1))*role.hp*(spec.boss?10:1)*(spec.hpFactor??1));
 return{hp,speed:1.65*role.speed*(spec.boss?.65:1),physical:role.physical,magic:role.magic,reward:spec.boss?Math.floor((150+Math.min(4,Math.floor((wave-1)/10))*75)*(spec.rewardFactor??1)):spec.archetype==='armored'?18:10,baseDamage:spec.boss?5:1};
}
export function sameCombatGroup(a,b){return !!a.training===!!b.training&&(!a.training||a.trainingPlot===b.trainingPlot);}
export function damageResult(enemy,amount,element){
 const physical=element==='earth'||element==='wind';
 let resistance=physical?(enemy.physical||0):(enemy.magic||0);
 if(enemy.armorBreak>0&&physical)resistance=Math.max(0,resistance-.35);
 const wetLightning=element==='lightning'&&enemy.wet>0;
 return{amount:Math.max(0,amount)*(1-resistance)*(enemy.armorBreak>0?1.2:1)*(wetLightning?1.6:1),wetLightning};
}
export function ignite(enemy,damage,duration=3){enemy.burnDamage=enemy.burn>0?Math.max(enemy.burnDamage||8,damage):damage;enemy.burn=Math.max(enemy.burn||0,duration);if(!enemy.burnTick)enemy.burnTick=0;}
export function elementStatus(enemy,element,stats={},neighbors=[]){
 if(!enemy.alive)return{spread:0};
 if(element==='earth'){enemy.stun=Math.max(enemy.stun||0,.55);enemy.armorBreak=4;}
 if(element==='water'){enemy.slow=2.2;enemy.wet=5;}
 if(element==='fire')ignite(enemy,stats.burnDamage||8);
 let spread=0;
 if(element==='wind'){
  enemy.distance=Math.max(0,enemy.distance-.38);
  if(enemy.burn>0)for(const other of neighbors){if(other!==enemy&&other.alive&&sameCombatGroup(enemy,other)){ignite(other,enemy.burnDamage||8,Math.min(3,enemy.burn));spread++;}}
 }
 return{spread};
}

