const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws'),E=require('./engine.js');
const CARDS=JSON.parse(fs.readFileSync(path.join(__dirname,'cards.json'),'utf8'));E.setCards(CARDS);
const N=20,MX=2,rooms={};
E.problems(CARDS).forEach(p=>console.warn('⚠',p));
process.on('uncaughtException',e=>console.error(e));
const DB=path.join(__dirname,'data.json');let P={};try{P=JSON.parse(fs.readFileSync(DB,'utf8'))}catch{}
let st;const save=()=>{clearTimeout(st);st=setTimeout(()=>fs.writeFile(DB,JSON.stringify(P),()=>{}),2000)};
const cl=s=>String(s||'').replace(/[<>&"'`]/g,'').slice(0,18).trim();
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const AS=path.join(__dirname,'assets')+path.sep;
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u=='/')u='/index.html';const f=path.normalize(path.join(__dirname,u));
 const ok=['/index.html','/engine.js','/cards.json'].includes(u)||f.startsWith(AS);
 if(!ok||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}
 r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const send=(w,o)=>w&&w.readyState==1&&w.send(JSON.stringify(o));
const rnd=()=>{const c=CARDS.map(()=>0),l=[];while(l.length<N){const i=Math.random()*CARDS.length|0;if(c[i]<MX){c[i]++;l.push(i)}}return l};
const lobby=r=>r.ws.forEach((w,i)=>send(w,{t:'lobby',code:r.code,mode:r.mode,names:r.ws.map(x=>x.name),host:i==0}));
function reward(r){const g=r.g;if(r.rewarded||g.over==null)return;r.rewarded=true;if(!r.hs||r.hs.length<2)return;
 r.hs.forEach(w=>{if(!w.pid)return;const p=P[w.pid]||(P[w.pid]={name:w.name,rating:0,wins:0,games:0});p.name=w.name;
  const win=!w.left&&g.over==g.p[w.k].team,dr=!w.left&&g.over==-1,dl=win?25:dr?0:-15;p.games++;if(win)p.wins++;p.rating=Math.max(0,p.rating+dl);
  send(w,{t:'reward',rating:p.rating,delta:dl})});save()}
function push(r){const hum=r.seat.filter(Boolean).length;r.seat.forEach((w,k)=>w&&send(w,{...E.view(r.g,k),hum}));reward(r);pump(r)}
function pump(r){const g=r.g;clearTimeout(r.tm);if(g.over!=null||r.seat[g.t])return;
 r.tm=setTimeout(()=>{if(rooms[r.code]!==r||g.over!=null||r.seat[g.t])return;E.act(g,g.t,E.bot(g,g.t));push(r)},900)}
const validDeck=c=>Array.isArray(c)&&c.length==CARDS.length&&c.every(n=>Number.isInteger(n)&&n>=0&&n<=MX)&&c.reduce((a,b)=>a+b,0)==N;
function startGame(r){const n=E.MODES[r.mode].n,hs=r.ws;r.seat=Array.from({length:n},(_,i)=>hs[i]||null);hs.forEach((w,i)=>w.k=i);r.hs=hs.slice();r.rewarded=false;
 const names=r.seat.map((w,i)=>w?w.name:'Бот '+(i+1));
 hs.forEach(w=>w.deck=null);r.g=E.create(r.mode,names);r.avs=r.seat.map(w=>w?w.av:'');r.seat.forEach(w=>w&&send(w,{t:'avs',a:r.avs}));push(r)}
const wss=new WebSocketServer({server:srv});
setInterval(()=>wss.clients.forEach(w=>{if(w.dead)return w.terminate();w.dead=true;w.ping()}),30000);
wss.on('connection',ws=>{ws.on('error',()=>{});ws.dead=false;ws.on('pong',()=>ws.dead=false);
 ws.on('message',d=>{let m;try{m=JSON.parse(d)}catch{return}if(m.t=='ping')return;
  if(m.t=='list')return send(ws,{t:'list',rooms:Object.values(rooms).filter(x=>!x.started&&!x.priv&&x.ws[0]&&x.ws.length<E.MODES[x.mode].n).map(x=>({code:x.code,mode:E.MODES[x.mode].name,n:x.ws.length,max:E.MODES[x.mode].n,host:x.ws[0].name}))});
  if(m.t=='top')return send(ws,{t:'top',list:Object.values(P).sort((a,b)=>b.rating-a.rating).slice(0,20)});const r=ws.room;
  if(m.t=='create'||m.t=='join'){if(r)return;ws.name=cl(m.name)||'Игрок';ws.pid=cl(m.pid).slice(0,24);ws.tok=String(m.tok||'').slice(0,20);ws.av=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(m.av||'')&&m.av.length<30000?m.av:'';
   if(m.t=='create'){if(!E.MODES[m.mode])return;const code=Math.random().toString(36).slice(2,6).toUpperCase();ws.room=rooms[code]={code,mode:m.mode,ws:[ws],g:null,seat:null,started:false,away:{},priv:!!m.priv};lobby(ws.room)}
   else{const j=rooms[String(m.code||'').toUpperCase()];if(!j||j.started||j.ws.length>=E.MODES[j.mode].n)return send(ws,{t:'err',m:'Комната не найдена или уже занята'});
    j.ws.push(ws);ws.room=j;lobby(j);if(j.ws.length==E.MODES[j.mode].n){j.started=true;j.ws.forEach(w=>send(w,{t:'prematch'}))}}}
  else if(m.t=='rejoin'){if(r)return;const j=rooms[String(m.code||'').toUpperCase()],tok=String(m.tok||'').slice(0,20),a=j&&j.away[tok];
   if(!a||!j.g)return send(ws,{t:'err',m:'Партия уже недоступна'});clearTimeout(a.tm);delete j.away[tok];
   ws.room=j;ws.name=a.name;ws.av=a.av;ws.pid=a.pid;ws.tok=tok;ws.k=a.k;j.hs=(j.hs||[]).map(w=>w.pid&&w.pid==ws.pid&&w.left?ws:w);j.seat[a.k]=ws;j.ws.push(ws);send(ws,{t:'avs',a:j.avs});send(ws,{...E.view(j.g,a.k),hum:j.seat.filter(Boolean).length});
   j.ws.forEach(w=>w!==ws&&send(w,{t:'note',m:ws.name+' вернулся'}));pump(j)}
  else if(!r)return;
  else if(m.t=='fill'){if(r.ws[0]!==ws||r.started)return;r.started=true;r.ws.forEach(w=>send(w,{t:'prematch'}))}
  else if(m.t=='deck'){if(!r.started||(r.g&&r.g.over==null))return;ws.deck=1;if(r.ws.every(w=>w.deck))startGame(r)}
  else if(r.g&&r.seat[ws.k]===ws&&E.act(r.g,ws.k,m))push(r)});
 ws.on('close',()=>{const r=ws.room;if(!r)return;ws.left=true;r.ws=r.ws.filter(x=>x!==ws);if(r.seat&&r.seat[ws.k]===ws)r.seat[ws.k]=null;
  if(r.g&&r.g.over==null&&ws.tok&&ws.k!=null){const tok=ws.tok;
   r.away[tok]={k:ws.k,name:ws.name,av:ws.av,pid:ws.pid,tm:setTimeout(()=>{delete r.away[tok];if(!r.ws.length&&!Object.keys(r.away).length){clearTimeout(r.tm);delete rooms[r.code]}},90000)};
   r.ws.forEach(w=>send(w,{t:'note',m:ws.name+' отключился, за него играет бот (90 с на возвращение)'}));pump(r);return}
  if(!r.ws.length&&!Object.keys(r.away).length){clearTimeout(r.tm);delete rooms[r.code];return}
  if(!r.started)lobby(r);else{r.ws.forEach(w=>send(w,{t:'note',m:ws.name+' вышел, его заменил бот'}));if(r.g&&r.g.over==null)pump(r)}})});
srv.listen(process.env.PORT||3000,()=>console.log('Мем-Стоун: http://localhost:'+(process.env.PORT||3000)));
