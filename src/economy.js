export const ECONOMY_RULES={startingGold:1000,sellRatio:.7,killReward:10,tankReward:18};
export const TOWER_COSTS={earth:{build:120,upgrades:[120,220]},water:{build:100,upgrades:[100,180]},wind:{build:100,upgrades:[110,190]},fire:{build:140,upgrades:[140,240]},lightning:{build:160,upgrades:[160,280]}};
export function towerStats(base,level=1){if(!Number.isInteger(level)||level<1||level>3)throw Error('Invalid tower level');const multiplier=[1,1.6,2.4][level-1];return{...base,damage:Math.round(base.damage*multiplier),range:base.range+(level-1)*.4,interval:base.interval*[1,.9,.8][level-1],burnDamage:Math.round(8*multiplier)};}
export function createEconomy(){
 let gold=ECONOMY_RULES.startingGold,earned=0,spent=0,refunded=0;const towers=new Map(),rewardedEnemies=new Set(),rewardedWaves=new Set();
 const validSlot=slot=>Number.isInteger(slot)&&slot>=0&&slot<8;
 function sellValue(slot){return Math.floor((towers.get(slot)?.invested||0)*ECONOMY_RULES.sellRatio);}
 function purchase(slot,key,{replace=false}={}){
  if(!validSlot(slot)||!TOWER_COSTS[key])return{ok:false,reason:'invalid'};const old=towers.get(slot);
  if(old&&!replace)return{ok:false,reason:'occupied'};if(old?.key===key)return{ok:false,reason:'same-element'};
  const cost=TOWER_COSTS[key].build,refund=old?sellValue(slot):0;if(gold+refund<cost)return{ok:false,reason:'insufficient',required:cost-refund};
  gold+=refund-cost;spent+=cost;refunded+=refund;towers.set(slot,{key,level:1,invested:cost});return{ok:true,cost,refund,level:1};
 }
 function upgrade(slot){const tower=towers.get(slot);if(!tower)return{ok:false,reason:'empty'};if(tower.level===3)return{ok:false,reason:'max-level'};const cost=TOWER_COSTS[tower.key].upgrades[tower.level-1];if(gold<cost)return{ok:false,reason:'insufficient',required:cost};gold-=cost;spent+=cost;tower.level++;tower.invested+=cost;return{ok:true,cost,level:tower.level};}
 function sell(slot){const tower=towers.get(slot);if(!tower)return{ok:false,reason:'empty'};const refund=sellValue(slot);gold+=refund;refunded+=refund;towers.delete(slot);return{ok:true,refund};}
 function rewardKill(id,{tank=false,training=false,boss=false,bossReward=150}={}){if(training||rewardedEnemies.has(id))return 0;rewardedEnemies.add(id);const amount=boss?Math.max(150,Math.floor(bossReward||150)):tank?ECONOMY_RULES.tankReward:ECONOMY_RULES.killReward;gold+=amount;earned+=amount;return amount;}
 function rewardWave(wave){if(!Number.isInteger(wave)||wave<1||rewardedWaves.has(wave))return 0;rewardedWaves.add(wave);const amount=35+wave*3;gold+=amount;earned+=amount;return amount;}
 function reset(){gold=ECONOMY_RULES.startingGold;earned=spent=refunded=0;towers.clear();rewardedEnemies.clear();rewardedWaves.clear();}
 function snapshot(){return{gold,earned,spent,refunded,towers:Array.from({length:8},(_,slot)=>{const t=towers.get(slot);return t?{...t}:null;})};}
 function restore(data,completed=0){
  if(!data||!Number.isInteger(completed)||completed<0||completed>50||!['gold','earned','spent','refunded'].every(k=>Number.isSafeInteger(data[k])&&data[k]>=0&&data[k]<=1e9)||data.gold!==1000-data.spent+data.refunded+data.earned||!Array.isArray(data.towers)||data.towers.length!==8)return false;
  let invested=0;for(const t of data.towers){if(t===null)continue;const cost=t&&Object.hasOwn(TOWER_COSTS,t.key)?TOWER_COSTS[t.key]:null;if(!cost||!Number.isInteger(t.level)||t.level<1||t.level>3||t.invested!==cost.build+cost.upgrades.slice(0,t.level-1).reduce((a,b)=>a+b,0))return false;invested+=t.invested;}
  if(invested>data.spent)return false;
  gold=data.gold;earned=data.earned;spent=data.spent;refunded=data.refunded;towers.clear();data.towers.forEach((t,i)=>{if(t)towers.set(i,{key:t.key,level:t.level,invested:t.invested});});rewardedEnemies.clear();rewardedWaves.clear();for(let w=1;w<=completed;w++)rewardedWaves.add(w);return true;
 }
 return{snapshot,restore,purchase,upgrade,sell,sellValue,rewardKill,rewardWave,reset,getTower(slot){const t=towers.get(slot);return t?{...t}:null;},get gold(){return gold;},get earned(){return earned;},get spent(){return spent;},get refunded(){return refunded;},get count(){return towers.size;}};
}
