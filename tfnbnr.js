/*  =====  FIREBASE AUTH  =====  */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjIXCGgZreTDY-fWFuXIsHRFBm7dVOHGA",
  authDomain: "tfnbnr-test.firebaseapp.com",
  projectId: "tfnbnr-test",
  storageBucket: "tfnbnr-test.firebasestorage.app",
  messagingSenderId: "609221203369",
  appId: "1:609221203369:web:acafea562c2f09a2ea20b8",
  measurementId: "G-N0PW3KTVE6"
};
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

const firebaseConfig = { /* ← your keys */ };
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
    if(secs<=0){ clearInterval(iv); finishSolo(m*60+s); }
  },1000);
};
$('#focusResetBtn').onclick = () => { location.reload(); };
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
  document.body.appendChild(canvas); canvas.style.position='fixed'; inset=0; canvas.style.pointerEvents='none'; canvas.style.zIndex=9999;
  const W=innerWidth,H=innerHeight; canvas.width=W; canvas.height=H;
  const pcs=[],colors=['#7c7cff','#a5a5ff','#fecaca','#fef3c7'];
  for(let i=0;i<150;i++) pcs.push({x:W*Math.random(),y:H*Math.random(),r:Math.random()*4+2,color:colors[Math.floor(Math.random()*colors.length)],vy:Math.random()*3+2});
  function draw(){
    ctx.clearRect(0,0,W,H);
    pcs.forEach(p=>{p.y+=p.vy; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=p.color; ctx.fill();});
    if(pcs[0].y<H+20) requestAnimationFrame(draw); else canvas.remove();
  }
  draw();
}

/*  =====  FULL COURSE LIST  =====  */
const courses = [
  /*  Middle  */
  "MS 6th Grade Math","MS 7th Grade Math","MS 8th Grade Math","MS Science 6","MS Science 7","MS Science 8","MS English 6","MS English 7","MS English 8",
  /*  HS regular  */
  "HS Algebra 1","HS Geometry","HS Algebra 2","HS Pre-Calc","HS Calc AB","HS Calc BC","HS Statistics","HS Biology","HS Chemistry","HS Physics","HS Earth Science","HS English 9","HS English 10","HS English 11","HS English 12","HS World History","HS US History","HS Government","HS Economics",
  /*  HS Honors  */
  "Hon Geometry","Hon Algebra 2","Hon Pre-Calc","Hon Calc AB","Hon Calc BC","Hon Biology","Hon Chemistry","Hon Physics","Hon English 9","Hon English 10","Hon English 11","Hon English 12","Hon World History","Hon US History",
  /*  AP  */
  "AP Calc AB","AP Calc BC","AP Statistics","AP Physics 1","AP Physics 2","AP Physics C Mech","AP Physics C E&M","AP Chemistry","AP Biology","AP Enviro","APUSH","AP World","AP Euro","AP Gov & Pol","AP Comparative","AP Micro","AP Macro","AP Psychology","AP Human Geo","AP CS A","AP CSP","AP English Lang","AP English Lit","AP Spanish","AP French","AP Latin","AP Art History","AP Music Theory",
  /*  IB  */
  "IB SL Math AA","IB HL Math AA","IB SL Math AI","IB HL Math AI","IB SL Physics","IB HL Physics","IB SL Chemistry","IB HL Chemistry","IB SL Biology","IB HL Biology","IB SL ESS","IB HL ESS","IB SL History","IB HL History","IB SL English A","IB HL English A","IB SL French B","IB HL French B","IB SL Spanish B","IB HL Spanish B","IB SL Economics","IB HL Economics","IB SL Psychology","IB HL Psychology","IB SL CS","IB HL CS","IB TOK",
  /*  College + Grad  */
  "College 1st Year","College 2nd Year","College 3rd Year","College 4th Year","Graduate"
];
[$('#soloCourse'),$('#compCourse')].forEach(sel=> courses.forEach(c=> sel.innerHTML+=`<option>${c}</option>`));

/*  =====  FIRST DRAW  =====  */
renderLeaders();
renderProfile();
