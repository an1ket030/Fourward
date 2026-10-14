import {createBoard,drop,HUMAN,AI,search} from '../js/core.js';
import os from 'node:os';
const positions=[];for(const seq of[[3,2,3,4,2,4],[3,2,4,3,2,4,1,5],[3,3,2,4,1,5,2,4]]){const board=createBoard();seq.forEach((c,i)=>drop(board,c,i%2===0?HUMAN:AI));positions.push(board)}
const rows=[];for(let p=0;p<positions.length;p++)for(const depth of[4,6])for(const pruning of[false,true]){const result=search(positions[p],{depth,pruning});rows.push({position:p+1,depth,algorithm:pruning?'alpha-beta':'minimax',move:result.move+1,score:result.score,...result.stats})}
const cpu=os.cpus();const output=JSON.stringify({generatedAt:new Date().toISOString(),environment:{runtime:process.version,platform:process.platform,release:os.release(),architecture:process.arch,cpuModel:cpu[0]?.model||'unavailable',logicalCores:cpu.length},note:'Observed locally by this run; timings vary by machine and browser.',results:rows},null,2);console.log(output);
