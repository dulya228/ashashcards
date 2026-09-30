(function(){
let C=[];
const MODES={
duel:{n:2,team:[0,1],hp:30,ev:3,name:'Дуэль 1×1',d:'Классика: один на один'},
ffa3:{n:3,team:[0,1,2],hp:30,ev:3,name:'1×1×1',d:'Трое, каждый сам за себя'},
ffa4:{n:4,team:[0,1,2,3],hp:30,ev:3,name:'1×1×1×1',d:'Четверо, каждый сам за себя'},
team:{n:4,team:[0,1,0,1],hp:25,ev:3,name:'Команды 2×2',d:'Места 1+3 против 2+4'},
chaos:{n:2,team:[0,1],hp:40,ev:1,name:'Хаос 🌪',d:'Событие каждый раунд, больше карт',chaos:1}};
const draw=s=>{if(!s.deck.length){s.fat++;s.hp-=s.fat}else{const c=s.deck.pop();if(s.hand.length<10)s.hand.push(c)}};
const alive=g=>g.p.filter(s=>!s.dead),each=(g,f)=>alive(g).forEach(s=>f(s));
const EV=[
["💥 Взрыв: −1 ❤️ всем картам",g=>each(g,s=>s.board.forEach(m=>m.h--))],
["🌧 Золотой дождь: +1 ❤️ картам и базам",g=>each(g,s=>{s.board.forEach(m=>m.h++);s.hp++})],
["🔥 Мемный раж: +1 ⚔️ всем картам",g=>each(g,s=>s.board.forEach(m=>m.a++))],
["🎁 Донат: все берут карту",g=>each(g,draw)],
["⚡ Разряд: −2 ❤️ всем базам",g=>each(g,s=>s.hp-=2)],
["🔷 Халява: +1 макс. маны всем",g=>{each(g,s=>s.max=Math.min(10,s.max+1));g.p[g.t].mana++}]];
const EVC=[
["☄️ Метеорит: случайной карте −4 ❤️",g=>{const b=alive(g).flatMap(s=>s.board);if(b.length)b[Math.random()*b.length|0].h-=4}],
["🔀 Рокировка: столы сдвинулись по кругу",g=>{const a=alive(g),b=a.map(s=>s.board);a.forEach((s,i)=>s.board=b[(i+1)%a.length])}]];
function clean(g){g.p.forEach(s=>{s.board=s.board.filter(m=>m.h>0);if(s.hp<=0&&!s.dead){s.dead=true;s.board=[];s.hand=[]}});
 const t=new Set(alive(g).map(s=>s.team));if(t.size<=1)g.over=t.size?[...t][0]:-1}
function begin(g){const s=g.p[g.t];s.max=Math.min(10,s.max+1);s.mana=s.max;draw(s);if(g.M.chaos)draw(s);s.board.forEach(m=>m.rdy=true);
 if(g.t==g.p.findIndex(x=>!x.dead)){g.round++;g.evt='';if(g.round%g.M.ev==0){const l=g.M.chaos?EV.concat(EVC):EV,x=l[Math.random()*l.length|0];x[1](g);g.evt=x[0]}}clean(g)}
function next(g){do{g.t=(g.t+1)%g.M.n}while(g.p[g.t].dead);begin(g)}
function create(mode,decks,names){const M=MODES[mode],g={mode,M,p:[],t:0,round:0,evt:'',over:null};
 for(let k=0;k<M.n;k++)g.p.push({name:names[k],team:M.team[k],hp:M.hp,mana:0,max:0,fat:0,dead:false,hand:[],board:[],
  deck:decks[k].map(i=>({n:C[i][0],e:C[i][1],c:C[i][2],a:C[i][3],h:C[i][4],img:C[i][5]||'',rdy:false})).sort(()=>Math.random()-.5)});
 g.p.forEach((s,k)=>{for(let i=0;i<(M.chaos?5:3)+(k==1&&M.n==2?1:0);i++)draw(s)});begin(g);return g}
function act(g,k,m){if(g.over!=null||g.t!=k)return false;const a=g.p[k];
 if(m.t=='play'){const c=a.hand[m.i];if(!c||c.c>a.mana||a.board.length>=7)return false;a.mana-=c.c;a.hand.splice(m.i,1);c.rdy=false;a.board.push(c)}
 else if(m.t=='atk'){const x=a.board[m.i],d=g.p[m.p];if(!x||!x.rdy||!d||d.dead||d.team==a.team)return false;
  if(m.j==null)d.hp-=x.a;else{const y=d.board[m.j];if(!y)return false;y.h-=x.a;x.h-=y.a}x.rdy=false}
 else if(m.t=='end')next(g);else return false;
 if(m.t!='end')clean(g);while(g.over==null&&g.p[g.t].dead)next(g);return true}
function view(g,k){return{t:'state',you:k,cur:g.t,round:g.round,evt:g.evt,ev:g.M.ev,mode:g.mode,over:g.over==null?null:g.over==-1?'draw':g.over==g.p[k].team?'win':'lose',
 p:g.p.map((s,i)=>({name:s.name,team:s.team,hp:s.hp,mana:s.mana,max:s.max,board:s.board,deck:s.deck.length,dead:s.dead,hand:i==k?s.hand:s.hand.length}))}}
function bot(g,k){const a=g.p[k],ix=a.hand.map((c,i)=>[c,i]).filter(([c])=>c.c<=a.mana).sort((x,y)=>y[0].c-x[0].c);
 if(ix.length&&a.board.length<7)return{t:'play',i:ix[0][1]};
 const en=g.p.map((s,i)=>i).filter(i=>!g.p[i].dead&&g.p[i].team!=a.team);
 for(let i=0;i<a.board.length;i++){const m=a.board[i];if(!m.rdy)continue;let best=null,bs=-1;
  en.forEach(p=>g.p[p].board.forEach((t,j)=>{if(t.h>m.a||(t.a>=m.h&&t.c<m.c))return;const s=(t.a<m.h?100:0)+t.a+t.c;if(s>bs){bs=s;best={p,j}}}));
  if(!best)best={p:[...en].sort((x,y)=>g.p[x].hp-g.p[y].hp)[0],j:null};
  return{t:'atk',i,p:best.p,j:best.j}}
 return{t:'end'}}
const API={MODES,setCards:c=>C=c,create,act,view,bot};
if(typeof module!=='undefined')module.exports=API;else window.Engine=API;
})();
