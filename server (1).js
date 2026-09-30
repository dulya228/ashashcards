const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws'),E=require('./engine.js');
const CARDS=JSON.parse(fs.readFileSync(path.join(__dirname,'cards.json'),'utf8'));E.setCards(CARDS);
const N=20,MX=2,rooms={};
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const AS=path.join(__dirname,'assets')+path.sep;
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u=='/')u='/index.html';const f=path.normalize(path.join(__dirname,u));
 const ok=['/index.html','/engine.js','/cards.json'].includes(u)||f.startsWith(AS);
 if(!ok||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}
 r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const send=(w,o)=>w&&w.readyState==1&&w.send(JSON.stringify(o));
const rnd=()=>{const c=CARDS.map(()=>0),l=[];while(l.length<N){const i=Math.random()*CARDS.length|0;if(c[i]<MX){c[i]++;l.push(i)}}return l};
const lobby=r=>r.ws.forEach((w,i)=>send(w,{t:'lobby',code:r.code,mode:r.mode,names:r.ws.map(x=>x.name),host:i==0}));
function push(r){r.seat.forEach((w,k)=>w&&send(w,E.view(r.g,k)));pump(r)}
function pump(r){const g=r.g;clearTimeout(r.tm);if(g.over!=null||r.seat[g.t])return;
 r.tm=setTimeout(()=>{if(rooms[r.code]!==r||g.over!=null||r.seat[g.t])return;E.act(g,g.t,E.bot(g,g.t));push(r)},900)}
const validDeck=c=>Array.isArray(c)&&c.length==CARDS.length&&c.every(n=>Number.isInteger(n)&&n>=0&&n<=MX)&&c.reduce((a,b)=>a+b,0)==N;
function startGame(r){const n=E.MODES[r.mode].n,hs=r.ws;r.seat=Array.from({length:n},(_,i)=>hs[i]||null);hs.forEach((w,i)=>w.k=i);
 const names=r.seat.map((w,i)=>w?w.name:'Бот '+(i+1)),decks=r.seat.map(w=>w?w.deck.flatMap((c,i)=>Array(c).fill(i)):rnd());
 hs.forEach(w=>w.deck=null);r.g=E.create(r.mode,decks,names);r.avs=r.seat.map(w=>w?w.av:'');r.seat.forEach(w=>w&&send(w,{t:'avs',a:r.avs}));push(r)}
const wss=new WebSocketServer({server:srv});
setInterval(()=>wss.clients.forEach(w=>{if(w.dead)return w.terminate();w.dead=true;w.ping()}),30000);
wss.on('connection',ws=>{ws.dead=false;ws.on('pong',()=>ws.dead=false);
 ws.on('message',d=>{let m;try{m=JSON.parse(d)}catch{return}if(m.t=='ping')return;const r=ws.room;
  if(m.t=='create'||m.t=='join'){if(r)return;ws.name=String(m.name||'Игрок').slice(0,12);ws.tok=String(m.tok||'').slice(0,20);ws.av=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(m.av||'')&&m.av.length<30000?m.av:'';
   if(m.t=='create'){if(!E.MODES[m.mode])return;const code=Math.random().toString(36).slice(2,6).toUpperCase();ws.room=rooms[code]={code,mode:m.mode,ws:[ws],g:null,seat:null,started:false,away:{}};lobby(ws.room)}
   else{const j=rooms[String(m.code||'').toUpperCase()];if(!j||j.started||j.ws.length>=E.MODES[j.mode].n)return send(ws,{t:'err',m:'Комната не найдена или уже занята'});
    j.ws.push(ws);ws.room=j;lobby(j);if(j.ws.length==E.MODES[j.mode].n){j.started=true;j.ws.forEach(w=>send(w,{t:'prematch'}))}}}
  else if(m.t=='rejoin'){if(r)return;const j=rooms[String(m.code||'').toUpperCase()],tok=String(m.tok||'').slice(0,20),a=j&&j.away[tok];
   if(!a||!j.g)return send(ws,{t:'err',m:'Партия уже недоступна'});clearTimeout(a.tm);delete j.away[tok];
   ws.room=j;ws.name=a.name;ws.av=a.av;ws.tok=tok;ws.k=a.k;j.seat[a.k]=ws;j.ws.push(ws);send(ws,{t:'avs',a:j.avs});send(ws,E.view(j.g,a.k));
   j.ws.forEach(w=>w!==ws&&send(w,{t:'note',m:ws.name+' вернулся'}));pump(j)}
  else if(!r)return;
  else if(m.t=='fill'){if(r.ws[0]!==ws||r.started)return;r.started=true;r.ws.forEach(w=>send(w,{t:'prematch'}))}
  else if(m.t=='deck'){if(!r.started||!validDeck(m.cnt)||(r.g&&r.g.over==null))return;ws.deck=m.cnt;if(r.ws.every(w=>w.deck))startGame(r)}
  else if(r.g&&r.seat[ws.k]===ws&&E.act(r.g,ws.k,m))push(r)});
 ws.on('close',()=>{const r=ws.room;if(!r)return;r.ws=r.ws.filter(x=>x!==ws);if(r.seat&&r.seat[ws.k]===ws)r.seat[ws.k]=null;
  if(r.g&&r.g.over==null&&ws.tok&&ws.k!=null){const tok=ws.tok;
   r.away[tok]={k:ws.k,name:ws.name,av:ws.av,tm:setTimeout(()=>{delete r.away[tok];if(!r.ws.length&&!Object.keys(r.away).length){clearTimeout(r.tm);delete rooms[r.code]}},90000)};
   r.ws.forEach(w=>send(w,{t:'note',m:ws.name+' отключился, за него играет бот (90 с на возвращение)'}));pump(r);return}
  if(!r.ws.length&&!Object.keys(r.away).length){clearTimeout(r.tm);delete rooms[r.code];return}
  if(!r.started)lobby(r);else{r.ws.forEach(w=>send(w,{t:'note',m:ws.name+' вышел, его заменил бот'}));if(r.g&&r.g.over==null)pump(r)}})});
srv.listen(process.env.PORT||3000,()=>console.log('Мем-Стоун: http://localhost:'+(process.env.PORT||3000)));
