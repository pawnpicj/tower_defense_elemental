export const BOSS_SKILLS={
 slime:{name:'แยกร่าง',description:'เมื่อตาย แยกเป็น Slime ตัวเล็ก 3 ตัว',kind:'split',count:3},
 spider:{name:'เรียกลูกแมงมุม',description:'เรียกลูกแมงมุมครั้งละ 3 ตัว สูงสุด 6 ตัว',kind:'summon',count:3,max:6,delay:3,interval:10},
 goblin:{name:'กองหนุน Goblin',description:'เรียกฝูง Goblin ครั้งละ 3 ตัว สูงสุด 6 ตัว',kind:'summon',count:3,max:6,delay:3,interval:10},
 skeleton:{name:'กองทัพกระดูก',description:'เรียก Skeleton ครั้งละ 3 ตัว สูงสุด 6 ตัว',kind:'summon',count:3,max:6,delay:3,interval:10},
 zombie:{name:'ฝูงอันเดด',description:'เรียก Zombie ครั้งละ 3 ตัว สูงสุด 6 ตัว',kind:'summon',count:3,max:6,delay:3,interval:10},
 orc:{name:'เสียงคำรามเร่งฝูง',description:'เร่งฝูงใกล้ตัว 25% นาน 3 วินาที รัศมี 6 m',kind:'haste',delay:2,interval:12,duration:3,multiplier:1.25,radius:6}
};
export function createBossSkill(species){const rule=BOSS_SKILLS[species];return rule?{timer:rule.delay||0,summoned:0,split:false}:null;}
export function tickBossSkill(species,state,dt){const rule=BOSS_SKILLS[species];if(!state||!rule||rule.kind==='split'||dt<=0)return null;if(rule.kind==='summon'&&state.summoned>=rule.max)return null;state.timer-=dt;if(state.timer>0)return null;state.timer=rule.interval;return rule;}
export function splitBoss(species,state){const rule=BOSS_SKILLS[species];if(!state||rule?.kind!=='split'||state.split)return null;state.split=true;return rule;}
