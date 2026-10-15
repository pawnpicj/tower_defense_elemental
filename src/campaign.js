export const CAMPAIGN_RULES={waves:50,preparationSeconds:8};
export function createCampaign(){
 const state={phase:'idle',wave:0,completed:0,remaining:0,elapsed:0};
 const ended=()=>state.phase==='won'||state.phase==='lost';
 function begin(){if(ended()||state.phase==='fighting'||state.wave>=CAMPAIGN_RULES.waves)return null;state.wave++;state.phase='fighting';state.remaining=0;return state.wave;}
 function clear(lives){if(state.phase!=='fighting')return false;if(lives<=0){lose();return false;}state.completed=state.wave;state.phase=state.wave===CAMPAIGN_RULES.waves?'won':'intermission';state.remaining=ended()?0:CAMPAIGN_RULES.preparationSeconds;return true;}
 function tick(seconds,paused=false){if(paused||ended()||state.phase==='idle'||!Number.isFinite(seconds)||seconds<=0)return false;state.elapsed+=seconds;if(state.phase==='intermission'){state.remaining=Math.max(0,state.remaining-seconds);return state.remaining===0;}return false;}
 function lose(){if(ended())return false;state.phase='lost';state.remaining=0;return true;}
 function reset(){Object.assign(state,{phase:'idle',wave:0,completed:0,remaining:0,elapsed:0});}
 return{state,begin,clear,tick,lose,reset,get ended(){return ended();}};
}
