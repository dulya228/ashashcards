(function(){
let C=[];
const FX={rush:{k:'m',d:'⚡ Рывок: атакует сразу'},gen:{k:'b',d:'⛏ Здание: +1 маны каждый ход'},cap:{k:'b',d:'🔋 Здание: +2 к запасу маны'},
draw:{k:'s',d:'🎁 Заклинание: возьми 2 карты'},heal:{k:'s',d:'💊 Заклинание: +4 ❤️ твоей базе'},aoe:{k:'s',d:'💣 Заклинание: 2 урона всем вражеским картам'},nrg:{k:'s',d:'🔌 Заклинание: +3 маны сейчас'}};
const kind=c=>c.fx&&FX[c.fx]?FX[c.fx].k:'m';
const MODES={
duel:{n:2,team:[0,1],hp:20,ev:3,name:'Дуэль 1×1',d:'Классика: один на один'},
ffa3:{n:3,team:[0,1,2],hp:18,ev:3,name:'1×1×1',d:'Трое, каждый сам за себя'},
ffa4:{n:4,team:[0,1,2,3],hp:15,ev:3,name:'1×1×1×1',d:'Четверо, каждый сам за себя'},
team:{n:4,team:[0,1,0,1],hp:15,ev:3,name:'Команды 2×2',d:'Места 1+3 против 2+4'},
chaos:{n:2,team:[0,1],hp:25,ev:1,name:'Хаос 🌪',d:'Событие каждый раунд, больше карт',chaos:1},
blitz:{n:2,team:[0,1],hp:12,ev:2,reg:5,name:'Блиц ⚡',d:'12 ❤️ и много маны: быстрые партии'},
royale:{n:4,team:[0,1,2,3],hp:12,ev:2,sd:4,name:'Королевская битва 👑',d:'Четверо, базы тают с 5-го раунда'},
boss:{n:3,team:[0,1,1],hps:[35,15,15],xd:[1,0,0],reg:4,name:'Рейд на босса 👹',d:'Место 1 (босс) против двоих: 35 ❤️ и доп. карта'},
rich:{n:2,team:[0,1],hp:20,ev:3,reg:6,cap:8,name:'Мана-фест 💰',d:'Большой запас маны и +6 в ход'}};
const nn=(v,d)=>Number.isFinite(+v)&&v!==''&&v!==null?+v:d;let UID=0;const mkc=i=>({id:++UID,n:String(C[i][0]),e:C[i][1],c:nn(C[i][2],1),a:nn(C[i][3],0),h:nn(C[i][4],1),img:C[i][5]||'',fx:C[i][6]||'',rdy:false});
const mkDeck=()=>[...C,...C].map((_,i)=>mkc(i%C.length)).sort(()=>Math.random()-.5);
const draw=(g,s)=>{if(!g.deck.length)g.deck=mkDeck();const c=g.deck.pop();if(s.hand.length<10)s.hand.push(c)};
const alive=g=>g.p.filter(s=>!s.dead),each=(g,f)=>alive(g).forEach(s=>f(s)),cards=s=>[...s.board,...s.bld];
const gens=s=>s.bld.filter(b=>b.fx=='gen').length,capOf=s=>Math.min(10,s.c0+s.turns)+2*s.bld.filter(b=>b.fx=='cap').length;
const EV=[
["💥 Взрыв: −1 ❤️ всем картам и зданиям",g=>each(g,s=>cards(s).forEach(m=>m.h--))],
["🌧 Золотой дождь: +1 ❤️ картам, зданиям и базам",g=>each(g,s=>{cards(s).forEach(m=>m.h++);s.hp++})],
["🔥 Мемный раж: +1 ⚔️ всем картам",g=>each(g,s=>s.board.forEach(m=>m.a++))],
["🎁 Донат: все берут карту",g=>each(g,s=>draw(g,s))],
["⚡ Разряд: −2 ❤️ всем базам",g=>each(g,s=>s.hp-=2)],
["🔷 Халява: все получают +3 маны",g=>each(g,s=>s.mana=Math.min(capOf(s),s.mana+3))]];
const EVC=[
["☄️ Метеорит: случайной карте −4 ❤️",g=>{const b=alive(g).flatMap(cards);if(b.length)b[Math.random()*b.length|0].h-=4}],
["🔀 Рокировка: столы сдвинулись по кругу",g=>{const a=alive(g),b=a.map(s=>s.board);a.forEach((s,i)=>s.board=b[(i+1)%a.length])}]];
function clean(g){g.p.forEach(s=>{s.board=s.board.filter(m=>m.h>0);s.bld=s.bld.filter(m=>m.h>0);s.mana=Math.min(s.mana,capOf(s));
 if(s.hp<=0&&!s.dead){s.dead=true;s.board=[];s.bld=[];s.hand=[]}});
 const t=new Set(alive(g).map(s=>s.team));if(t.size<=1)g.over=t.size?[...t][0]:-1}
function begin(g){const s=g.p[g.t];s.turns++;s.mana=Math.min(capOf(s),s.mana+(g.M.reg||3)+gens(s));draw(g,s);if(g.M.chaos)draw(g,s);if(g.M.xd&&g.M.xd[g.t])draw(g,s);s.board.forEach(m=>m.rdy=true);
 if(g.t==g.p.findIndex(x=>!x.dead)){g.round++;g.evt='';if(g.round%g.M.ev==0){const l=g.M.chaos?EV.concat(EVC):EV,x=l[Math.random()*l.length|0];x[1](g);g.evt=x[0]}
  if(g.round>(g.M.sd||10)){each(g,q=>q.hp--);if(!g.evt)g.evt='⏳ Затягивание: −1 ❤️ всем базам'}}clean(g)}
function next(g){do{g.t=(g.t+1)%g.M.n}while(g.p[g.t].dead);begin(g)}
function create(mode,names){const M=MODES[mode],g={mode,M,p:[],t:0,round:0,evt:'',over:null,deck:[],seq:0,last:null};g.deck=mkDeck();
 for(let k=0;k<M.n;k++)g.p.push({name:names[k],team:M.team[k],hp:M.hps?M.hps[k]:M.hp,c0:M.cap||4,mana:0,turns:0,dead:false,hand:[],board:[],bld:[]});
 g.p.forEach((s,k)=>{for(let i=0;i<(M.chaos?5:3)+(k==1&&M.n==2?1:0);i++)draw(g,s)});begin(g);return g}
function act(g,k,m){if(g.over!=null||g.t!=k)return false;const a=g.p[k];
 if(m.t=='play'){const c=a.hand[m.i];if(!c||(m.id!=null&&c.id!=m.id)||c.c>a.mana)return false;const kd=kind(c);if((kd=='m'&&a.board.length>=7)||(kd=='b'&&a.bld.length>=3))return false;
  a.mana-=c.c;a.hand.splice(m.i,1);g.last={k,t:'play',fx:c.fx,kd,e:c.e,n:c.n,txt:a.name+' играет '+c.n};
  if(kd=='m'){c.rdy=c.fx=='rush';a.board.push(c)}else if(kd=='b')a.bld.push(c);
  else if(c.fx=='draw'){draw(g,a);draw(g,a)}else if(c.fx=='heal')a.hp+=4;else if(c.fx=='nrg')a.mana=Math.min(capOf(a),a.mana+3);
  else if(c.fx=='aoe')g.p.forEach(o=>{if(!o.dead&&o.team!=a.team)o.board.forEach(x=>x.h-=2)})}
 else if(m.t=='atk'){const x=a.board[m.i],d=g.p[m.p];if(!x||(m.id!=null&&x.id!=m.id)||!x.rdy||!d||d.dead||d.team==a.team)return false;
  if(m.b!=null){if(d.board.length)return false;const y=d.bld[m.b];if(!y||(m.bid!=null&&y.id!=m.bid))return false;y.h-=x.a;g.last={k,t:'atk',txt:x.n+' → '+y.n+': −'+x.a+', осталось '+Math.max(0,y.h)}}
  else if(m.j==null){if(d.board.length)return false;d.hp-=x.a;g.last={k,t:'atk',txt:x.n+' → '+d.name+': −'+x.a+' ❤️'}}
  else{const y=d.board[m.j];if(!y||(m.tid!=null&&y.id!=m.tid))return false;y.h-=x.a;x.h-=y.a;g.last={k,t:'atk',txt:x.n+' → '+y.n+': −'+x.a+' (осталось '+Math.max(0,y.h)+'), в ответ −'+y.a}}x.rdy=false}
 else if(m.t=='end'){g.last={k,t:'end',txt:a.name+' завершает ход'};next(g)}else return false;
 g.seq++;if(m.t!='end')clean(g);while(g.over==null&&g.p[g.t].dead)next(g);return true}
function view(g,k){return{t:'state',seq:g.seq,last:g.last,you:k,cur:g.t,round:g.round,evt:g.evt,ev:g.M.ev,mode:g.mode,deck:g.deck.length,over:g.over==null?null:g.over==-1?'draw':g.over==g.p[k].team?'win':'lose',
 p:g.p.map((s,i)=>({name:s.name,team:s.team,hp:s.hp,mana:s.mana,max:capOf(s),regen:(g.M.reg||3)+gens(s),board:s.board,bld:s.bld,dead:s.dead,hand:i==k?s.hand:s.hand.length}))}}
function bot(g,k){const a=g.p[k],en=g.p.map((s,i)=>i).filter(i=>!g.p[i].dead&&g.p[i].team!=a.team),eb=en.reduce((n,p)=>n+g.p[p].board.length,0);
 const ok=a.hand.map((c,i)=>[c,i]).filter(([c])=>{if(c.c>a.mana)return false;const q=kind(c);if(q=='m')return a.board.length<7;if(q=='b')return a.bld.length<3;
  if(c.fx=='heal')return a.hp<14;if(c.fx=='aoe')return eb>=2;if(c.fx=='nrg')return a.hand.some(x=>x.c>a.mana&&x.c<=a.mana+2);return true})
  .sort((x,y)=>(kind(y[0])=='b')-(kind(x[0])=='b')||y[0].c-x[0].c);
 if(ok.length)return{t:'play',i:ok[0][1]};
 for(let i=0;i<a.board.length;i++){const m=a.board[i];if(!m.rdy)continue;let best=null,bs=-1;
  en.forEach(p=>g.p[p].board.forEach((t,j)=>{if(t.h>m.a||(t.a>=m.h&&t.c<m.c))return;const s=(t.a<m.h?100:0)+t.a+t.c;if(s>bs){bs=s;best={p,j}}}));
  if(!best){const fe=en.filter(p=>!g.p[p].board.length).sort((x,y)=>g.p[x].hp-g.p[y].hp)[0];
   if(fe!=null){const bi=g.p[fe].bld.findIndex(b=>b.h<=m.a);best=bi>=0?{p:fe,b:bi}:{p:fe,j:null}}}
  if(!best)continue;return{t:'atk',i,p:best.p,j:best.j,b:best.b}}
 return{t:'end'}}
const problems=c=>c.map((x,i)=>[x,i]).filter(([x])=>!Array.isArray(x)||[2,3,4].some(j=>!Number.isFinite(+x[j])||x[j]===''||x[j]===null)).map(([x,i])=>'карта №'+(i+1)+' ('+(x&&x[0])+'): проверь ману, атаку и здоровье (числа, без кавычек)');
const API={problems,MODES,FX,setCards:c=>C=c,create,act,view,bot};
if(typeof module!=='undefined')module.exports=API;else window.Engine=API;
})();
