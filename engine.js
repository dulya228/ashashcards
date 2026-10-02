(function(){
let C=[];
const FX={rush:{k:'m',d:'⚡ Рывок: атакует сразу'},gen:{k:'b',d:'⛏ Здание: +1 маны каждый ход'},cap:{k:'b',d:'🔋 Здание: +2 к запасу маны'},
draw:{k:'s',d:'🎁 Заклинание: возьми 2 карты'},heal:{k:'s',d:'💊 Заклинание: +4 ❤️ твоей базе'},aoe:{k:'s',d:'💣 Заклинание: 2 урона всем вражеским картам'},nrg:{k:'s',d:'🔌 Заклинание: +3 маны сейчас'},
shield:{k:'m',d:'🛡 Щит: первый удар по ней блокируется'},vamp:{k:'m',d:'🩸 Вампир: лечит твою базу на нанесённый урон'},poison:{k:'m',d:'☠️ Яд: убивает любую карту, которую ударит'},
med:{k:'b',d:'💖 Здание: +1 ❤️ твоей базе каждый ход'},tower:{k:'b',d:'🗼 Здание: каждый ход 1 урон случайному врагу'},lib:{k:'b',d:'📚 Здание: +1 карта каждый ход'},
armor:{k:'s',d:'🦺 Заклинание: +2 ❤️ всем твоим картам'},rage:{k:'s',d:'💪 Заклинание: +1 ⚔️ и +1 ❤️ всем твоим картам'},freeze:{k:'s',d:'🧊 Заклинание: карты врагов пропустят следующую атаку'},
steal:{k:'s',d:'🕵️ Заклинание: украсть карту из руки врага'},clone:{k:'s',d:'🧬 Заклинание: копия твоей сильнейшей карты'},bolt:{k:'s',d:'⚡ Заклинание: 3 урона случайному врагу (карта или база)'},sale:{k:'s',d:'🏷️ Заклинание: карты в руке дешевле на 1'}};
const kind=c=>c.fx&&FX[c.fx]?FX[c.fx].k:'m';
const range=n=>Array.from({length:n},(_,i)=>i),HP=[0,0,20,18,15,14,13,12,12];
const MODES={
classic:{name:'Классика',d:'Каждый сам за себя, побеждает последний выживший',min:2,max:4,mk:n=>({team:range(n),hp:HP[n],ev:3})},
team:{name:'Команды',d:'Выбери команду (синие или красные), союзников бить нельзя',pick:1,min:3,max:4,mk:n=>({team:range(n).map(i=>i%2),hps:range(n).map(i=>HP[n]+(n%2&&i%2?5:0)),ev:3})},
chaos:{name:'Хаос 🌪',d:'Событие каждый раунд, больше карт',min:2,max:4,mk:n=>({team:range(n),hp:HP[n]+5,ev:1,chaos:1})},
blitz:{name:'Блиц ⚡',d:'12 ❤️ и много маны: быстрые партии',min:2,max:4,mk:n=>({team:range(n),hp:12,ev:2,reg:5})},
royale:{name:'Королевская битва 👑',d:'Базы тают уже с 5-го раунда',min:3,max:4,mk:n=>({team:range(n),hp:12,ev:2,sd:4})},
boss:{name:'Рейд на босса 👹',d:'Место 1 (босс) против всех: много ❤️ и доп. карта',min:2,max:4,mk:n=>({team:range(n).map(i=>i?1:0),hps:range(n).map(i=>i?15:15+10*(n-1)),xd:range(n).map(i=>i?0:1),reg:4,ev:3})},
rich:{name:'Мана-фест 💰',d:'Большой запас маны и +6 в ход',min:2,max:4,mk:n=>({team:range(n),hp:HP[n],ev:3,reg:6,cap:8})}};
Object.assign(MODES,{
sprint:{name:'Спринт 🏃',d:'Все существа бьют сразу после выхода',min:2,max:4,mk:n=>({team:range(n),hp:HP[n],ev:3,allrush:1,reg:4})},
party:{name:'Бустер-вечеринка 🎉',d:'В колоде в основном заклинания и здания',min:2,max:4,mk:n=>({team:range(n),hp:HP[n]+3,ev:2,party:1})},
lava:{name:'Лавовый пол 🌋',d:'Базы горят с 2-го раунда: бей быстрее',min:2,max:4,mk:n=>({team:range(n),hp:25,ev:3,sd:1})},
marathon:{name:'Марафон 🐢',d:'40 ❤️, мана копится медленно, долгие партии',min:2,max:4,mk:n=>({team:range(n),hp:40,ev:4,reg:2,sd:14})}});
const build=(k,n)=>({n,...MODES[k].mk(n)});
const nn=(v,d)=>Number.isFinite(+v)&&v!==''&&v!==null?+v:d;let UID=0;const mkc=i=>({id:++UID,n:String(C[i][0]),e:C[i][1],c:nn(C[i][2],1),a:nn(C[i][3],0),h:nn(C[i][4],1),img:C[i][5]||'',fx:C[i][6]||'',ds:C[i][6]=='shield',fz:0,rdy:false});
const mkDeck=M=>{const nm=C.map((c,i)=>i).filter(i=>C[i][6]&&FX[C[i][6]]&&FX[C[i][6]].k!='m'),mi=C.map((c,i)=>i).filter(i=>!nm.includes(i));
 const pool=M&&M.party?[...nm,...nm,...nm,...nm,...mi]:[...C,...C].map((_,i)=>i%C.length);return pool.map(mkc).sort(()=>Math.random()-.5)};
const draw=(g,s)=>{if(!g.deck.length)g.deck=mkDeck(g.M);const c=g.deck.pop();if(s.hand.length<10)s.hand.push(c)};
const alive=g=>g.p.filter(s=>!s.dead),each=(g,f)=>alive(g).forEach(s=>f(s)),cards=s=>[...s.board,...s.bld];
const gens=s=>s.bld.filter(b=>b.fx=='gen').length,capOf=s=>Math.min(10,s.c0+s.turns)+2*s.bld.filter(b=>b.fx=='cap').length;
const EV=[
["💥 Взрыв: −1 ❤️ всем картам и зданиям",g=>each(g,s=>cards(s).forEach(m=>m.h--))],
["🌧 Золотой дождь: +1 ❤️ картам, зданиям и базам",g=>each(g,s=>{cards(s).forEach(m=>m.h++);s.hp++})],
["🔥 Мемный раж: +1 ⚔️ всем картам",g=>each(g,s=>s.board.forEach(m=>m.a++))],
["🎁 Донат: все берут карту",g=>each(g,s=>draw(g,s))],
["⚡ Разряд: −2 ❤️ всем базам",g=>each(g,s=>s.hp-=2)],
["🔷 Халява: все получают +3 маны",g=>each(g,s=>s.mana=Math.min(capOf(s),s.mana+3))],
["🧊 Ледниковый период: все карты пропустят следующую атаку",g=>each(g,s=>s.board.forEach(m=>m.fz=1))],
["🧨 Динамит: 2 урона случайной карте каждого игрока",g=>each(g,s=>{if(s.board.length)s.board[Math.random()*s.board.length|0].h-=2})],
["🏷 Распродажа: все карты в руках дешевле на 1",g=>each(g,s=>s.hand.forEach(c=>c.c=Math.max(0,c.c-1)))],
["🎉 Праздник: все базы получают +2 ❤️",g=>each(g,s=>s.hp+=2)]];
const EVC=[
["☄️ Метеорит: случайной карте −4 ❤️",g=>{const b=alive(g).flatMap(cards);if(b.length)b[Math.random()*b.length|0].h-=4}],
["🔀 Рокировка: столы сдвинулись по кругу",g=>{const a=alive(g),b=a.map(s=>s.board);a.forEach((s,i)=>s.board=b[(i+1)%a.length])}]];
const dealt=(a,t)=>{if(t.ds&&a.a>0){t.ds=false;return 0}let d=a.a;if(a.fx=='poison'&&d>0)d=Math.max(d,t.h);t.h-=d;return d};
function clean(g){g.p.forEach(s=>{s.board=s.board.filter(m=>m.h>0);s.bld=s.bld.filter(m=>m.h>0);s.mana=Math.min(s.mana,capOf(s));
 if(s.hp<=0&&!s.dead){s.dead=true;s.board=[];s.bld=[];s.hand=[]}});
 const t=new Set(alive(g).map(s=>s.team));if(t.size<=1)g.over=t.size?[...t][0]:-1}
function begin(g){const s=g.p[g.t];s.turns++;s.mana=Math.min(capOf(s),s.mana+(g.M.reg||3)+gens(s));draw(g,s);if(g.M.chaos)draw(g,s);if(g.M.xd&&g.M.xd[g.t])draw(g,s);s.board.forEach(m=>{m.rdy=!m.fz;m.fz=0});s.hp+=s.bld.filter(b=>b.fx=='med').length;
 s.bld.filter(b=>b.fx=='tower').forEach(()=>{const t=[];alive(g).filter(o=>o.team!=s.team).forEach(o=>{o.board.forEach(c=>t.push(c));t.push(o)});if(t.length){const z=t[Math.random()*t.length|0];if(z.hp!==undefined)z.hp-=1;else z.h-=1}});
 s.bld.filter(b=>b.fx=='lib').forEach(()=>draw(g,s));
 if(g.t==g.p.findIndex(x=>!x.dead)){g.round++;g.evt='';if(g.round%g.M.ev==0){const l=g.M.chaos?EV.concat(EVC):EV,x=l[Math.random()*l.length|0];x[1](g);g.evt=x[0]}
  {const sdr=g.M.sd!=null?g.M.sd:10;if(g.round>sdr){const dm=1+Math.floor((g.round-sdr-1)/4);each(g,q=>q.hp-=dm);if(!g.evt)g.evt='⏳ Затягивание: −'+dm+' ❤️ всем базам'}}}clean(g)}
function next(g){do{g.t=(g.t+1)%g.M.n}while(g.p[g.t].dead);begin(g)}
function create(mode,names,teams){const M=build(mode,names.length);if(MODES[mode].pick&&Array.isArray(teams)&&new Set(teams.slice(0,M.n)).size>1){M.team=teams.slice(0,M.n).map(t=>t?1:0);const sz=[0,1].map(t=>M.team.filter(x=>x==t).length),mx=Math.max(...sz);M.hps=M.team.map(t=>HP[M.n]+5*(mx-sz[t]))}const g={mode,M,p:[],t:0,round:0,evt:'',over:null,deck:[],seq:0,last:null};g.deck=mkDeck(M);
 for(let k=0;k<M.n;k++)g.p.push({name:names[k],team:M.team[k],hp:M.hps?M.hps[k]:M.hp,c0:M.cap||4,mana:0,turns:0,dead:false,hand:[],board:[],bld:[]});
 g.p.forEach((s,k)=>{for(let i=0;i<(M.chaos?5:3)+(k==1&&M.n==2?1:0);i++)draw(g,s)});begin(g);return g}
function act(g,k,m){if(g.over!=null||g.t!=k)return false;const a=g.p[k];
 if(m.t=='play'){const c=a.hand[m.i];if(!c||(m.id!=null&&c.id!=m.id)||c.c>a.mana)return false;const kd=kind(c);if((kd=='m'&&a.board.length>=7)||(kd=='b'&&a.bld.length>=3))return false;
  a.mana-=c.c;a.hand.splice(m.i,1);g.last={k,t:'play',fx:c.fx,kd,e:c.e,n:c.n,txt:a.name+' играет '+c.n};
  if(kd=='m'){c.rdy=c.fx=='rush'||!!g.M.allrush;a.board.push(c)}else if(kd=='b')a.bld.push(c);
  else if(c.fx=='draw'){draw(g,a);draw(g,a)}else if(c.fx=='heal')a.hp+=4;else if(c.fx=='nrg')a.mana=Math.min(capOf(a),a.mana+3);
  else if(c.fx=='aoe')g.p.forEach(o=>{if(!o.dead&&o.team!=a.team)o.board.forEach(x=>x.h-=2)});
  else if(c.fx=='armor')a.board.forEach(x=>x.h+=2);
  else if(c.fx=='rage')a.board.forEach(x=>{x.a+=1;x.h+=1});
  else if(c.fx=='freeze')g.p.forEach(o=>{if(!o.dead&&o.team!=a.team)o.board.forEach(x=>x.fz=1)});
  else if(c.fx=='steal'){const o=g.p.filter(q=>!q.dead&&q.team!=a.team&&q.hand.length);if(o.length&&a.hand.length<10){const t=o[Math.random()*o.length|0];a.hand.push(...t.hand.splice(Math.random()*t.hand.length|0,1))}}
  else if(c.fx=='clone'){const b=a.board.slice().sort((p,q)=>q.a+q.h-p.a-p.h)[0];if(b&&a.board.length<7)a.board.push({...b,id:++UID,rdy:false,fz:0})}
  else if(c.fx=='bolt'){const t=[];g.p.forEach(o=>{if(!o.dead&&o.team!=a.team){o.board.forEach(x=>t.push(x));t.push(o)}});if(t.length){const z=t[Math.random()*t.length|0];if(z.hp!==undefined)z.hp-=3;else z.h-=3}}
  else if(c.fx=='sale')a.hand.forEach(x=>x.c=Math.max(0,x.c-1))}
 else if(m.t=='atk'){const x=a.board[m.i],d=g.p[m.p];if(!x||(m.id!=null&&x.id!=m.id)||!x.rdy||!d||d.dead||d.team==a.team)return false;
  if(m.b!=null){if(d.board.length)return false;const y=d.bld[m.b];if(!y||(m.bid!=null&&y.id!=m.bid))return false;y.h-=x.a;g.last={k,t:'atk',fr:x.id,tp:m.p,tb:y.id,txt:x.n+' → '+y.n+': −'+x.a+', осталось '+Math.max(0,y.h)}}
  else if(m.j==null){if(d.board.length)return false;d.hp-=x.a;if(x.fx=='vamp')a.hp+=x.a;g.last={k,t:'atk',fr:x.id,tp:m.p,face:1,txt:x.n+' → '+d.name+': −'+x.a+' ❤️'}}
  else{const y=d.board[m.j];if(!y||(m.tid!=null&&y.id!=m.tid))return false;const dd=dealt(x,y);dealt(y,x);if(x.fx=='vamp')a.hp+=dd;g.last={k,t:'atk',fr:x.id,tp:m.p,to:y.id,txt:x.n+' → '+y.n+': −'+dd+(dd==0&&x.a>0?' (щит!)':'')+', осталось '+Math.max(0,y.h)+', в ответ −'+Math.max(0,x.a?y.a:0)}}x.rdy=false}
 else if(m.t=='end'){g.last={k,t:'end',txt:a.name+' завершает ход'};next(g)}else return false;
 g.seq++;if(m.t!='end')clean(g);while(g.over==null&&g.p[g.t].dead)next(g);return true}
function view(g,k){return{t:'state',seq:g.seq,last:g.last,you:k,cur:g.t,round:g.round,evt:g.evt,ev:g.M.ev,mode:g.mode,deck:g.deck.length,over:g.over==null?null:g.over==-1?'draw':g.over==g.p[k].team?'win':'lose',
 p:g.p.map((s,i)=>({name:s.name,team:s.team,hp:s.hp,mana:s.mana,max:capOf(s),regen:(g.M.reg||3)+gens(s),board:s.board,bld:s.bld,dead:s.dead,hand:i==k?s.hand:s.hand.length}))}}
function bot(g,k){const a=g.p[k],en=g.p.map((s,i)=>i).filter(i=>!g.p[i].dead&&g.p[i].team!=a.team),eb=en.reduce((n,p)=>n+g.p[p].board.length,0);
 const ok=a.hand.map((c,i)=>[c,i]).filter(([c])=>{if(c.c>a.mana)return false;const q=kind(c);if(q=='m')return a.board.length<7;if(q=='b')return a.bld.length<3;
  if(c.fx=='heal')return a.hp<14;if(c.fx=='aoe'||c.fx=='freeze')return eb>=2;if(c.fx=='armor'||c.fx=='rage')return a.board.length>0;if(c.fx=='clone')return a.board.length>0&&a.board.length<7;if(c.fx=='sale')return a.hand.length>3;if(c.fx=='nrg')return a.hand.some(x=>x.c>a.mana&&x.c<=a.mana+2);return true})
  .sort((x,y)=>(kind(y[0])=='b')-(kind(x[0])=='b')||y[0].c-x[0].c);
 if(ok.length)return{t:'play',i:ok[0][1]};
 for(let i=0;i<a.board.length;i++){const m=a.board[i];if(!m.rdy)continue;let best=null,bs=-1;
  en.forEach(p=>g.p[p].board.forEach((t,j)=>{if(t.h>m.a||(t.a>=m.h&&t.c<m.c))return;const s=(t.a<m.h?100:0)+t.a+t.c;if(s>bs){bs=s;best={p,j}}}));
  if(!best){const fe=en.filter(p=>!g.p[p].board.length).sort((x,y)=>g.p[x].hp-g.p[y].hp)[0];
   if(fe!=null){const bi=g.p[fe].bld.findIndex(b=>b.h<=m.a);best=bi>=0?{p:fe,b:bi}:{p:fe,j:null}}}
  if(!best)continue;return{t:'atk',i,p:best.p,j:best.j,b:best.b}}
 return{t:'end'}}
const problems=c=>c.map((x,i)=>[x,i]).filter(([x])=>!Array.isArray(x)||[2,3,4].some(j=>!Number.isFinite(+x[j])||x[j]===''||x[j]===null)).map(([x,i])=>'карта №'+(i+1)+' ('+(x&&x[0])+'): проверь ману, атаку и здоровье (числа, без кавычек)');
const API={problems,MODES,build,FX,setCards:c=>C=c,create,act,view,bot};
if(typeof module!=='undefined')module.exports=API;else window.Engine=API;
})();
