const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const AUTH_KEY='sc-auth-users', SESSION_KEY='sc-auth-session';
let activeUser=localStorage.getItem(SESSION_KEY)||'';
document.body.classList.toggle('authenticated',!!activeUser);
const appKey=k=>'sc-user-'+activeUser+'-'+k;
const keyOf=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),key=()=>keyOf(new Date());
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(appKey(k)))??d}catch{return d}};
const set=(k,v)=>localStorage.setItem(appKey(k),JSON.stringify(v));
const readUsers=()=>{try{return JSON.parse(localStorage.getItem(AUTH_KEY))||{}}catch{return {}}};
async function passwordHash(value){
  if(!window.crypto?.subtle) throw new Error('Abra pelo Live Server ou por um endereço HTTPS para ativar o cadastro.');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function showAuthPanel(which){$('#loginPanel').hidden=which!=='login';$('#registerPanel').hidden=which!=='register';$('#authMessage').textContent=''}
$('#showRegister').onclick=()=>showAuthPanel('register');
$('#showLogin').onclick=()=>showAuthPanel('login');
$('#registerForm').onsubmit=async e=>{
  e.preventDefault();const name=$('#registerName').value.trim(),password=$('#registerPassword').value,confirm=$('#registerPassword2').value;
  if(name.length<2){$('#authMessage').textContent='O nome precisa ter pelo menos 2 caracteres.';return}
  if(password.length<4){$('#authMessage').textContent='A senha precisa ter pelo menos 4 caracteres.';return}
  if(password!==confirm){$('#authMessage').textContent='As senhas não coincidem.';return}
  const users=readUsers(),id=name.toLocaleLowerCase('pt-BR');
  if(users[id]){$('#authMessage').textContent='Esse nome já está cadastrado. Escolha outro ou faça login.';return}
  try{users[id]={name,passwordHash:await passwordHash(password)};localStorage.setItem(AUTH_KEY,JSON.stringify(users));localStorage.setItem(SESSION_KEY,id);location.reload()}
  catch(err){$('#authMessage').textContent=err.message||'Não foi possível criar a conta.'}
};
$('#loginForm').onsubmit=async e=>{
  e.preventDefault();const name=$('#loginName').value.trim(),password=$('#loginPassword').value,id=name.toLocaleLowerCase('pt-BR'),user=readUsers()[id];
  if(!user){$('#authMessage').textContent='Usuário não encontrado. Confira os dados ou cadastre-se.';return}
  try{if(await passwordHash(password)!==user.passwordHash){$('#authMessage').textContent='Senha incorreta. Tente novamente.';return}localStorage.setItem(SESSION_KEY,id);location.reload()}
  catch(err){$('#authMessage').textContent=err.message||'Não foi possível entrar.'}
};
$('#logoutButton').onclick=()=>{localStorage.removeItem(SESSION_KEY);location.reload()};
if(activeUser){const user=readUsers()[activeUser];if(!user){localStorage.removeItem(SESSION_KEY);location.reload()}else $('#welcomeUser').textContent='Olá, '+user.name;}
let routine=get('sc-routine',{bedtime:'22:30'}),records=get('sc-records',{}),tasks=records[key()]?.tasks||[false,false,false,false];
function minus(t){let [h,m]=t.split(':').map(Number),d=new Date();d.setHours(h,m-45,0,0);return d.toTimeString().slice(0,5)}
function renderRoutine(){let t=routine.bedtime;$('#bedtime').value=t;$('#windtime').textContent=minus(t);$('#homeTime').textContent=t;$('#homeStart').textContent='Desacelerar às '+minus(t)}
$('#bedtime').addEventListener('input',e=>$('#windtime').textContent=minus(e.target.value||'22:30'));
$('#saveRoutine').onclick=()=>{routine={bedtime:$('#bedtime').value||'22:30'};set('sc-routine',routine);renderRoutine();$('#routineMsg').textContent='Rotina salva neste dispositivo.'};
function saveDay(){records[key()]={tasks:[...tasks],completed:tasks.every(Boolean)};set('sc-records',records)}
function renderTasks(){let n=tasks.filter(Boolean).length,p=n*25;$$('[data-task]').forEach(i=>i.checked=!!tasks[+i.dataset.task]);$('#taskCount').textContent=n+' de 4 tarefas concluídas';$('#percent').textContent=p+'%';$('#bar').style.width=p+'%';$('#ring').style.background=`conic-gradient(#4777c2 ${p*3.6}deg,#e9eff9 0deg)`;$('#checkMsg').textContent=n===4?'Muito bem! Você concluiu todos os passos de hoje.':'Cada pequeno hábito conta.'}
$$('[data-task]').forEach(i=>i.onchange=()=>{tasks[+i.dataset.task]=i.checked;saveDay();renderTasks();renderHome()});
$('#finish').onclick=()=>{saveDay();renderTasks();$('#checkMsg').textContent=tasks.every(Boolean)?'Rotina de hoje concluída! Parabéns!':`Você concluiu ${tasks.filter(Boolean).length} de 4 hábitos. Continue quando quiser.`;renderHome()};
function days(){let a=[];for(let i=6;i>=0;i--){let d=new Date();d.setDate(d.getDate()-i);let k=keyOf(d);a.push({label:['D','S','T','Q','Q','S','S'][d.getDay()],count:records[k]?.tasks?.filter(Boolean).length||0,complete:!!records[k]?.completed})}return a}
function renderWeek(){let a=days();$('#weekCount').textContent=a.filter(x=>x.complete).length+' dias';$('#chart').innerHTML=a.map(x=>`<div class="day"><div class="bar-track"><div class="bar-fill" style="height:${x.count*25}%"></div></div><small>${x.label}</small></div>`).join('')}
function renderHome(){renderStats();$('#homeTasks').textContent=tasks.filter(Boolean).length+'/4';$('#homeDays').textContent=days().filter(x=>x.complete).length+' dias'}
function page(p){$$('.page').forEach(x=>x.classList.toggle('active',x.id===p));$$('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===p));if(p==='progresso'){renderWeek();renderStats()}if(p==='diario')renderDiary();if(p==='inicio')renderHome();scrollTo({top:0,behavior:'smooth'})}
$$('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));$$('[data-go]').forEach(b=>b.onclick=()=>page(b.dataset.go));
let reflection=get('sc-reflection','');$('#reflection').value=reflection;$('#saveReflection').onclick=()=>{set('sc-reflection',$('#reflection').value);$('#reflectionMsg').textContent='Reflexão salva neste dispositivo.'};
$('#date').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
function renderStats(){const ds=Object.keys(records).filter(k=>records[k].completed).sort(),doneSet=new Set(ds),pl=(n,a,b)=>n+' '+(n===1?a:b);
let cur=0,d=new Date();if(!doneSet.has(keyOf(d)))d.setDate(d.getDate()-1);while(doneSet.has(keyOf(d))){cur++;d.setDate(d.getDate()-1)}
let best=0,run=0,prev='';ds.forEach(k=>{const [y,m,dd]=k.split('-');run=keyOf(new Date(y,m-1,+dd-1))===prev?run+1:1;best=Math.max(best,run);prev=k});
$('#streakNow').textContent=pl(cur,'dia','dias');$('#streakBest').textContent=pl(best,'dia','dias');$('#totalRoutines').textContent=ds.length;
$('#totalHabits').textContent=Object.values(records).reduce((s,r)=>s+(r.tasks||[]).filter(Boolean).length,0)}
const MOODS=[['😫','Exausto'],['😕','Cansado'],['😐','Normal'],['🙂','Bem'],['😄','Ótimo']];
let diary=get('sc-diary',{}),mood=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function pickMood(n){mood=n;$$('.mood').forEach(b=>{const on=+b.dataset.mood===n;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)})}
$('#moodPick').innerHTML=MOODS.map((m,i)=>`<button type="button" class="mood" role="radio" aria-checked="false" data-mood="${i+1}"><span>${m[0]}</span>${m[1]}</button>`).join('');
$$('.mood').forEach(b=>b.onclick=()=>pickMood(+b.dataset.mood));
function renderDiary(){const t=diary[key()]||{};$('#diaryMsg').textContent='';pickMood(t.mood||0);$('#sleepHours').value=t.hours??'';$('#sleepNotes').value=t.notes||'';
const last=Object.keys(diary).sort().reverse().slice(0,7),hs=last.map(k=>diary[k].hours).filter(x=>typeof x==='number');
$('#diaryAvg').textContent=hs.length?'Média: '+(hs.reduce((a,b)=>a+b,0)/hs.length).toLocaleString('pt-BR',{maximumFractionDigits:1})+' h de sono':'Sem registros ainda';
$('#diaryList').innerHTML=last.map(k=>{const e=diary[k],[y,m,d]=k.split('-'),dt=new Date(y,m-1,d);return `<div class="entry"><span class="e">${MOODS[e.mood-1]?.[0]||''}</span><div><b>${dt.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})} · ${Number(e.hours).toLocaleString('pt-BR')} h</b><small>${MOODS[e.mood-1]?.[1]||''}${e.notes?' — '+esc(e.notes):''}</small></div></div>`}).join('')}
$('#saveDiary').onclick=()=>{const h=parseFloat($('#sleepHours').value),msg=$('#diaryMsg');
if(!mood){msg.textContent='Escolha como você acordou.';return}
if(!(h>=0&&h<=24)){msg.textContent='Informe as horas dormidas (de 0 a 24).';return}
diary[key()]={mood,hours:h,notes:$('#sleepNotes').value.trim()};set('sc-diary',diary);renderDiary();msg.textContent='Registro de hoje salvo neste dispositivo.'};
renderRoutine();renderTasks();renderHome();renderWeek();renderDiary();

$('#timeBtn').onclick=()=>{const i=$('#bedtime');try{i.showPicker()}catch{i.focus()}};