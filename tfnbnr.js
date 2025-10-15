/*  =====  FIREBASE AUTH  =====  */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

const firebaseConfig = { /* ← your real keys here */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const $ = q => document.querySelector(q);
const storage = (k,v) => v===undefined ? JSON.parse(localStorage.getItem(k)||'null') : localStorage.setItem(k,JSON.stringify(v));

/*  =====  DARK MODE  =====  */
$('#darkToggle').addEventListener('change',e=>{
  document.body.classList.toggle('dark',e.target.checked);
  storage('dark',e.target.checked);
});
if(storage('dark')){document.body.classList.add('dark'); $('#darkToggle').checked=true;}

/*  =====  HEADER SHADOW  =====  */
window.addEventListener('scroll',()=>$('#topbar').classList.toggle('scrolled',window.scrollY>20));

/*  =====  BOTTOM NAV  =====  */
document.querySelectorAll('.bottom-nav button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    btn.classList.add('active');
    $(`#${btn.dataset.tab}`).classList.add('active');
    if(btn.dataset.tab==='leader') renderLeaders();
    if(btn.dataset.tab==='profile') renderProfile();
  });
});

/*  =====  SIGN-IN MODAL  =====  */
function showModal(){ $('#signModal').classList.remove('hidden'); }
function hideModal(){ $('#signModal').classList.add('hidden'); }
$('#closeModal').onclick = hideModal;

/*  =====  AUTH BUTTONS  =====  */
$('#googleBtn').onclick = () => signInWithPopup(auth,provider).then(hideModal).catch(console.error);
$('#mailBtn').onclick  = () => {
  const email = prompt('Enter your e-mail:');
  if(!email) return;
  sendSignInLinkToEmail(auth,email,{url:location.href,handleCodeInApp:true})
    .then(()=>{alert('Check your inbox & click the link!'); storage('emailForSignIn',email);})
    .catch(console.error);
};
if(isSignInWithEmailLink(auth,location.href)){
  const email = storage('emailForSignIn');
  if(email) signInWithEmailLink(auth,email,location.href).then(hideModal).catch(console.error);
}

/*  =====  AUTH STATE  =====  */
let user = null;
onAuthStateChanged(auth,u=>{
  user = u;
  if(u) hideModal();
});

/*  =====  GATE  =====  */
function gate(action){
  if(user) return action();
  showModal();
}

/*  =====  SOLO TIMER  (no gate)  =====  */
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v||0));
$('#focusStartBtn').onclick = () => {
  const m = clamp(+$('#focusMinutes').value,0,999);
  const s = clamp(+$('#focusSeconds').value,0,59);
  let secs = (m*60+s)||1;
  $('#focusStartBtn').disabled = true;
  $('#focusMinutes').disabled = $('#focusSeconds').disabled = true;
  const iv = setInterval(()=>{
    secs--;
    const mm=String(Math.floor(secs/60)).padStart(2,0);
    const ss=String(secs%60).padStart(2,0);
    $('#focusTimerText').textContent = `${mm}:${ss}`;
    $('#focusProgress').style.width = `${(1-secs/(m*60+s))*100}%`;
    if(secs<=0){ clearInterval(iv); finishSolo(clamp(m*60+s,1,999*60+59)); }
  },1000);
};
$('#focusResetBtn').onclick = () => { location.reload(); }; /* quick reset */

function finishSolo(seconds){
  $('#focusStartBtn').disabled=false;
  $('#focusMinutes').disabled=$('#focusSeconds').disabled=false;
  award(seconds);
  confetti();
}

/*  =====  1-v-1  (gated)  =====  */
$('#findMatch').onclick = () => gate(startMatch);
function startMatch(){
  $('#matchArea').innerHTML='<p>Matching…</p>';
  setTimeout(()=>{
    $('#matchArea').innerHTML=`
      <div class="room">
        <div><p><strong>You</strong></p><div class="progress-bar"><div id="myBar"></div></div></div>
        <div><p><strong>Anonymous 🔥</strong></p><div class="progress-bar"><div id="rivalBar"></div></div></div>
      </div>
      <button class="cta" id="startBattle">Start 10-min battle</button>`;
    $('#startBattle').onclick=startBattle;
  },1200);
}
function startBattle(){
  let secs=10*60;
  myBar=0; rivalBar=0;
  const iv=setInterval(()=>{
    secs--;
    myBar+=Math.random()*2.2; rivalBar+=Math.random()*2;
    $('#myBar').style.width=`${Math.min(myBar,100)}%`;
    $('#rivalBar').style.width=`${Math.min(rivalBar,100)}%`;
    if(myBar>=100||rivalBar>=100||secs<=0){
      clearInterval(iv);
      const won=myBar>=rivalBar;
      alert(won?'You win! +50':'Close! +10');
      award(won?50:10); storage('wins', (storage('wins')||0)+(won?1:0));
      $('#matchArea').innerHTML=''; myBar=0; rivalBar=0;
    }
  },1000);
}

/*  =====  LEADERS / PROFILE  (gated)  =====  */
function renderLeaders(){
  const today=new Date().toISOString().slice(0,10);
  const b=storage('board')||{};
  const arr=Object.entries(b[today]||{}).sort((a,b)=>b[1]-a[1]).slice(0,10);
  $('#soloLeader').innerHTML= arr.length ? arr.map(([n,p],i)=>`<div class="leader-item">${i+1}. ${n}<span>${p} pts</span></div>`).join('')
                                        : '<div class="leader-item">No scores yet today.</div>';
  $('#compLeader').innerHTML= `<div class="leader-item">${storage('userName')||'You'}<span>${storage('wins')||0} wins</span></div>`;
}
function renderProfile(){
  $('#cardName').textContent=storage('userName')||'—';
  $('#cardMin').textContent=storage('totalMin')||0;
  $('#cardWins').textContent=storage('wins')||0;
  const lvlNames=['Rookie','Spark','Fire','Blaze','Inferno','Supernova'];
  const min=storage('totalMin')||0;
  const lvl=min<60?0:min<180?1:min<480?2:min<1200?3:min<2400?4:5;
  $('#cardLvl').textContent=lvlNames[lvl];
}
$('#resetProf').onclick=()=>{if(confirm('Erase ALL local data?')){localStorage.clear();location.reload();}};

/*  =====  POINTS  =====  */
function award(seconds){
  const today=new Date().toISOString().slice(0,10);
  const board=storage('board')||{};
  if(!board[today]) board[today]={};
  const name=storage('userName')||'Anonymous';
  board[today][name]=(board[today][name]||0)+seconds;
  storage('board',board);
  storage('totalMin', (storage('totalMin')||0)+seconds);
  if(user) renderProfile();
}

/*  =====  CONFETTI  =====  */
function confetti(){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  document.body.appendChild(canvas); canvas.style.position='fixed'; canvas.style.inset=0; canvas.style.pointerEvents='none'; canvas.style.zIndex=9999;
  const W=innerWidth,H=innerHeight; canvas.width=W; canvas.height=H;
  const pcs=[],colors=['#3b82f6','#60a5fa','#22c55e','#eab308'];
  for(let i=0;i<150;i++) pcs.push({x:W*Math.random(),y:H*Math.random(),r:Math.random()*4+2,color:colors[Math.floor(Math.random()*colors.length)],vy:Math.random()*3+2});
  function draw(){
    ctx.clearRect(0,0,W,H);
    pcs.forEach(p=>{p.y+=p.vy; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=p.color; ctx.fill();});
    if(pcs[0].y<H+20) requestAnimationFrame(draw); else canvas.remove();
  }
  draw();
}

/*  =====  INIT  =====  */
const courses = [
  "MS 6","MS 7","MS 8",
  "HS Alg 1","HS Geo","HS Alg 2","HS Pre-Calc","HS Calc AB","HS Calc BC","HS Stats",
  "Hon Geo","Hon Alg 2","Hon Pre-Calc","Hon Calc AB","Hon Calc BC",
  "AP Calc AB","AP Calc BC","AP Stats","AP Phys 1","AP Phys 2","AP Phys C","AP Chem","AP Bio","AP Enviro","APUSH","AP World","AP Euro","AP Gov","AP Micro","AP Macro","AP CS A","AP CSP",
  "IB SL Math","IB HL Math","IB SL Phys","IB HL Phys","IB SL Chem","IB HL Chem","IB SL Bio","IB HL Bio",
  "College 1","College 2","College 3","College 4","Grad"
];
[$('#soloCourse'),$('#compCourse')].forEach(sel=> courses.forEach(c=> sel.innerHTML+=`<option>${c}</option>`));

/*  =====  FIRST DRAW  =====  */
renderLeaders();
renderProfile();
