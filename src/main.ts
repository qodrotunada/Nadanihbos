import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles.css';
import { supabase, request, type Person, type Event as FaceEvent, type ListResponse, type RecognizeResponse } from './database';
import { FaceVision, type LiveFace, type VisionFrame } from './vision';
import { WORDS, locateWord, type Word } from './vocabulary';

const el = <T extends HTMLElement>(id: string): T => {
  const value = document.getElementById(id);
  if (!value) throw Error(`Elemen ${id} tidak ditemukan.`);
  return value as T;
};
const video = el<HTMLVideoElement>('camera');
const canvas = el<HTMLCanvasElement>('overlay');
const frame = el<HTMLElement>('camera-frame');
const startButton = el<HTMLButtonElement>('start-camera');
const stopButton = el<HTMLButtonElement>('stop-camera');
const switchButton = el<HTMLButtonElement>('switch-camera');
const recognizeButton = el<HTMLButtonElement>('recognize');
const captureButton = el<HTMLButtonElement>('capture-sample');
const saveButton = el<HTMLButtonElement>('save-person');
const loginDialog = el<HTMLDialogElement>('login-dialog');
const loginForm = el<HTMLFormElement>('login-form');
const nameField = el<HTMLInputElement>('student-name');
const consent = el<HTMLInputElement>('consent');
const threshold = el<HTMLInputElement>('match-threshold');

let loggedIn = false;
let latest: LiveFace | null = null;
let samples: number[][] = [];
let lastCapture = 0;
let matchLabel: string | null = null;
let matchExpires = 0;
let busy = false;
let startingCamera = false;
let toastTimer = 0;
let currentTab = 'camera';
let selectedWord: Word = WORDS[0];
let lastVisionFrame: VisionFrame | null = null;

const vision = new FaceVision(video, {
  onFrame(result) { frameUpdate(result); },
  onError(error) { showToast(`Deteksi terhenti: ${error.message}`, true); updateCamera(false); },
});

function showToast(message: string, error = false) {
  const toast = el<HTMLElement>('toast');
  toast.textContent = message;
  toast.classList.toggle('error', error);
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 5000);
}

function updateCamera(on: boolean) {
  frame.classList.toggle('running', on);
  el('camera-led').classList.toggle('active', on);
  startButton.disabled = on;
  stopButton.disabled = !on;
  switchButton.disabled = !on;
  el('camera-status').textContent = on ? 'Mencari bagian tubuh…' : 'Kamera belum dinyalakan';
  el('camera-hint').innerHTML = on
    ? '<i class="bi bi-info-circle"></i> Tunjukkan bagian tubuh yang dipilih dalam pencahayaan cukup.'
    : '<i class="bi bi-info-circle"></i> Jalankan melalui HTTPS atau localhost. Video tidak disimpan.';
  video.style.transform = vision.cameraFacing === 'user' ? 'scaleX(-1)' : 'none';
  updateButtons();
}

function updateButtons() {
  recognizeButton.disabled = busy || !vision.active || !latest || !loggedIn;
  captureButton.disabled = busy || !vision.active || !latest || !loggedIn || samples.length >= 3;
  saveButton.disabled = busy || !loggedIn || samples.length !== 3 || !consent.checked || !nameField.value.trim();
}

function frameUpdate(result: VisionFrame) {
  lastVisionFrame = result;
  latest = result.face;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (canvas.width !== result.width || canvas.height !== result.height) {
      canvas.width = result.width;
      canvas.height = result.height;
      if (result.width && result.height) frame.style.aspectRatio = `${result.width}/${result.height}`;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (result.face && currentTab !== 'vocabulary') drawFace(ctx, result.face);
    if (currentTab === 'vocabulary') drawSelectedWord(ctx, result);
  }
  if (vision.active) {
    el('camera-status').textContent = currentTab === 'vocabulary'
      ? result.body && Object.keys(result.body).length ? 'Pose tubuh terdeteksi' : result.face ? 'Wajah terdeteksi' : 'Mencari bagian tubuh…'
      : result.count > 1 ? 'Terdeteksi lebih dari satu wajah'
      : result.face ? 'Satu wajah siap dikenali' : result.count === 1 ? 'Wajah terlalu jauh; dekatkan kamera' : 'Mencari wajah…';
  }
  updateWordTracking(result);
  updateButtons();
}

function updateWordTracking(result: VisionFrame) {
  const status = el('word-tracking');
  if (!selectedWord.source) status.textContent = 'Kata ini dipelajari melalui daftar. Titik AR tidak tersedia untuk bagian ini.';
  else if (!vision.active) status.textContent = 'Nyalakan kamera untuk melihat penanda AR.';
  else if (locateWord(selectedWord.id, result)) status.textContent = `Titik ${selectedWord.indonesian.toLowerCase()} terlihat dan mengikuti gerakan.`;
  else status.textContent = selectedWord.source === 'hand'
    ? 'Tunjukkan satu tangan terbuka ke kamera dengan cahaya cukup.'
    : selectedWord.source === 'face' ? 'Arahkan satu wajah ke kamera dan dekati sedikit.'
      : 'Mundurlah agar bagian tubuh ini terlihat utuh di kamera.';
}

function drawSelectedWord(ctx: CanvasRenderingContext2D, result: VisionFrame) {
  const point = locateWord(selectedWord.id, result);
  if (!point || !result.width || !result.height) return;
  const px = vision.cameraFacing === 'user' ? result.width - point[0] : point[0];
  const py = point[1];
  if (px < 0 || px > result.width || py < 0 || py > result.height) return;
  const size = Math.max(15, Math.min(24, result.width / 26));
  const label = `${selectedWord.arabic} · ${selectedWord.indonesian}`;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  const width = Math.min(result.width - 12, ctx.measureText(label).width + 26);
  const x = Math.max(6, Math.min(result.width - width - 6, px - width / 2));
  const y = py > size + 55 ? py - size - 42 : py + 19;
  ctx.strokeStyle = '#ffe6a4';ctx.fillStyle = '#15bba0';ctx.lineWidth = 2.5;
  ctx.beginPath();ctx.arc(px, py, 11, 0, Math.PI * 2);ctx.stroke();
  ctx.beginPath();ctx.arc(px, py, 4, 0, Math.PI * 2);ctx.fill();
  ctx.beginPath();ctx.moveTo(px, py > size + 55 ? py - 12 : py + 12);ctx.lineTo(px, py > size + 55 ? y + size + 14 : y);ctx.stroke();
  ctx.fillStyle = '#173951ed';ctx.beginPath();ctx.roundRect(x, y, width, size + 14, 8);ctx.fill();
  ctx.fillStyle = '#fff';ctx.fillText(label, x + 13, y + size + 2, width - 24);
}

function renderVocabulary() {
  const focus = el('word-focus');focus.replaceChildren();
  const arabic = document.createElement('strong');arabic.lang = 'ar';arabic.dir = 'rtl';arabic.textContent = selectedWord.arabic;
  const translation = document.createElement('span');translation.textContent = selectedWord.indonesian;
  const reading = document.createElement('small');reading.textContent = `Dibaca: ${selectedWord.latin} · ${selectedWord.source ? 'Penanda AR tersedia' : 'Pelajaran tanpa penanda AR'}`;
  focus.append(arabic,translation,reading);
  if (selectedWord.hint) {
    const hint = document.createElement('small');hint.textContent = selectedWord.hint;focus.append(hint);
  }
  const search = el<HTMLInputElement>('vocab-search').value.trim().toLocaleLowerCase('id');
  const list = el('word-list');list.replaceChildren();
  for (const group of ['Kepala & wajah','Tubuh & tangan','Kaki']) {
    const matches = WORDS.filter(word => word.group === group &&
      `${word.arabic} ${word.latin} ${word.indonesian}`.toLocaleLowerCase('id').includes(search));
    if (!matches.length) continue;
    const title = document.createElement('h4');title.textContent = group;list.append(title);
    for (const word of matches) {
      const button = document.createElement('button');button.type = 'button';button.className = 'word-item';
      button.classList.toggle('selected', word.id === selectedWord.id);
      button.setAttribute('aria-pressed', String(word.id === selectedWord.id));
      const meaning = document.createElement('span');meaning.textContent = word.indonesian;
      const glyph = document.createElement('b');glyph.lang = 'ar';glyph.dir = 'rtl';glyph.textContent = word.arabic;
      const badge = document.createElement('small');badge.textContent = word.source ? 'AR' : 'Pelajaran';
      button.append(meaning,glyph,badge);
      button.addEventListener('click', () => { selectedWord = word;renderVocabulary();if (lastVisionFrame) frameUpdate(lastVisionFrame); });
      list.append(button);
    }
  }
  if (!list.childElementCount) {const empty = document.createElement('p');empty.textContent = 'Kosakata tidak ditemukan.';list.append(empty);}
  if (lastVisionFrame) updateWordTracking(lastVisionFrame);
}

function drawFace(ctx: CanvasRenderingContext2D, face: LiveFace) {
  const width = canvas.width;
  const mirrored = vision.cameraFacing === 'user';
  const [rawX, y, w, h] = face.box;
  const x = mirrored ? width - rawX - w : rawX;
  const paintX = (coordinate: number) => mirrored ? width - coordinate : coordinate;
  ctx.strokeStyle = '#56ebcb';
  ctx.fillStyle = '#56ebcb';
  ctx.lineWidth = Math.max(2, width / 320);
  ctx.shadowColor = '#54edcc';
  ctx.shadowBlur = 12;
  const corner = Math.min(30, w / 4, h / 4);
  for (const [dx, dy, sx, sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]) {
    ctx.beginPath();ctx.moveTo(dx + sx*corner,dy);ctx.lineTo(dx,dy);ctx.lineTo(dx,dy + sy*corner);ctx.stroke();
  }
  for (const [mx,my] of face.mesh) {
    ctx.beginPath();ctx.arc(paintX(mx),my,Math.max(1.5,width/500),0,Math.PI*2);ctx.fill();
  }
  ctx.shadowBlur = 0;
  const recognized = matchLabel && Date.now() < matchExpires;
  const label = recognized ? `INI ${matchLabel}` : 'WAJAH TERDETEKSI';
  const fontSize = Math.max(13, Math.min(24, width / 27));
  ctx.font = `800 ${fontSize}px system-ui, sans-serif`;
  const pillW = Math.min(width - 16, ctx.measureText(label).width + 28);
  const pillX = Math.max(8,Math.min(width-pillW-8,x + (w-pillW)/2));
  const pillY = Math.max(12,y - fontSize - 25);
  ctx.fillStyle = recognized ? '#17b886' : '#0b6582';
  ctx.beginPath();ctx.roundRect(pillX,pillY,pillW,fontSize+17,8);ctx.fill();
  ctx.fillStyle = '#fff';ctx.fillText(label,pillX+14,pillY+fontSize+5);
  if (el<HTMLInputElement>('show-vocabulary').checked && face.features) {
    for (const [text, point, side] of [
      ['عَيْنٌ · MATA', face.features.eye, -1],
      ['أَنْفٌ · HIDUNG', face.features.nose, 1],
      ['فَمٌ · MULUT', face.features.mouth, -1],
    ] as Array<[string,[number,number],number]>) {
      const px=paintX(point[0]);const py=point[1];
      ctx.font=`700 ${Math.max(12,Math.round(width/48))}px system-ui,sans-serif`;
      const textW=ctx.measureText(text).width+14;
      const lx=Math.max(3,Math.min(width-textW-3,px+side*(w/3)-textW/2));
      const ly=Math.max(3,Math.min(canvas.height-25,py-14));
      ctx.fillStyle='#132d42e8';ctx.beginPath();ctx.roundRect(lx,ly,textW,23,6);ctx.fill();
      ctx.fillStyle='#fff';ctx.fillText(text,lx+7,ly+16);
      ctx.fillStyle='#ffe0a1';ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fill();
    }
  }
}

async function startCamera() {
  if (vision.active || startingCamera) return;
  startingCamera = true;
  startButton.disabled = true;
  el('camera-status').textContent = 'Memuat kamera dan model wajah…';
  try { await vision.start(); updateCamera(vision.active); if (vision.active) showToast('Kamera aktif. Arahkan satu wajah ke dalam bingkai.'); }
  catch (cause) { updateCamera(false); showToast(cause instanceof Error ? cause.message : String(cause), true); }
  finally { startingCamera = false; }
}

function stopCamera() {
  vision.stop();
  matchLabel = null;
  matchExpires = 0;
  updateCamera(false);
}

function tab(name: string) {
  currentTab = name;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-tab]')) {
    const selected = button.dataset.tab === name;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-selected', String(selected));
    el(`panel-${button.dataset.tab}`).hidden = !selected;
  }
  if (name === 'data' && loggedIn) void loadData();
  if (lastVisionFrame) frameUpdate(lastVisionFrame);
  updateButtons();
}

function setAuth(authorized: boolean) {
  loggedIn = authorized;
  el('header-login-label').textContent = authorized ? 'Keluar Pengajar' : 'Masuk Pengajar';
  el('session-badge').textContent = authorized ? 'Pengajar terhubung' : 'Mode belajar bebas';
  el('session-badge').classList.toggle('logged-in', authorized);
  if (!authorized) {
    samples = [];
    updateSamples();
    el('people-list').innerHTML = '<p class="empty-state">Masuk sebagai pengajar untuk melihat data.</p>';
    el('history-list').innerHTML = '<p class="empty-state">Belum ada pengenalan wajah.</p>';
    el<HTMLButtonElement>('clear-history').disabled = true;
  }
  updateButtons();
}

function updateSamples() {
  el('sample-count').textContent = `${samples.length} / 3`;
  document.querySelectorAll('.sample-progress span').forEach((item,index) => item.classList.toggle('filled',index < samples.length));
  el('sample-instruction').textContent = [
    'Hadapkan wajah ke kamera, lalu ambil sampel pertama.',
    'Miringkan kepala sedikit ke kiri, lalu ambil sampel kedua.',
    'Miringkan kepala sedikit ke kanan, lalu ambil sampel ketiga.',
    'Tiga sampel siap. Pastikan peserta sudah menyetujui penyimpanan.',
  ][samples.length];
  captureButton.innerHTML = samples.length === 3 ? '<i class="bi bi-check-circle"></i> Sampel lengkap'
    : `<i class="bi bi-record-circle"></i> Ambil Sampel ${samples.length + 1}`;
  updateButtons();
}

function requireTeacher() {
  if (loggedIn) return true;
  showToast('Masuk sebagai pengajar untuk menyimpan atau mengenali wajah.', true);
  if (supabase && !loginDialog.open) loginDialog.showModal();
  return false;
}

async function recognize() {
  if (!requireTeacher() || !latest || busy) return;
  const embedding = [...latest.embedding];
  busy = true;updateButtons();
  el('recognition-name').textContent = 'Membandingkan…';
  el('recognition-detail').textContent = 'Menghubungi database Supabase.';
  try {
    const result = await request<RecognizeResponse>('recognize', { embedding, threshold: Number(threshold.value)/100 });
    const recognized = result.recognized && result.name;
    matchLabel = recognized ? result.name : null;
    matchExpires = recognized ? Date.now() + 9000 : 0;
    el('recognition-icon').className = `recognition-icon ${recognized ? 'is-known' : 'is-unknown'}`;
    el('recognition-icon').innerHTML = `<i class="bi bi-${recognized ? 'person-check' : 'person-x'}"></i>`;
    el('recognition-name').textContent = recognized ? `Ini ${result.name}` : 'Wajah belum dikenal';
    const score = result.similarity === null ? '' : `Kemiripan ${(Math.max(0,result.similarity)*100).toFixed(0)}% · `;
    el('recognition-detail').textContent = `${score}${recognized ? 'Tersimpan di riwayat' : result.reason === 'ambigu' ? 'Hasil mirip dengan beberapa peserta' : 'Daftarkan peserta terlebih dahulu'}`;
    showToast(recognized ? `Wajah ${result.name} dikenali dan dicatat.` : 'Hasil belum cocok dengan peserta terdaftar.');
    if (currentTab === 'data') await loadData();
  } catch (cause) {
    el('recognition-name').textContent = 'Pengenalan gagal';
    el('recognition-detail').textContent = 'Periksa koneksi dan coba lagi.';
    showToast(cause instanceof Error ? cause.message : String(cause), true);
  } finally {busy=false;updateButtons();}
}

function capture() {
  if (!requireTeacher() || !latest || busy || samples.length >= 3) return;
  if (performance.now()-lastCapture < 650) {showToast('Tunggu sebentar lalu ubah sedikit arah wajah.', true);return;}
  lastCapture = performance.now();
  samples.push([...latest.embedding]);
  updateSamples();
  showToast(`Sampel ${samples.length} dari 3 diambil. Foto tidak disimpan.`);
}

async function enroll(event: SubmitEvent) {
  event.preventDefault();
  if (!requireTeacher() || samples.length !== 3 || !consent.checked || busy) return;
  busy=true;updateButtons();
  try {
    const name = nameField.value.trim();
    await request('enroll', { name, samples, consent: true });
    samples = [];consent.checked=false;nameField.value='';updateSamples();
    showToast(`${name} berhasil didaftarkan di Supabase.`);
    await loadData();
    tab('camera');
  } catch (cause) {showToast(cause instanceof Error ? cause.message : String(cause), true);}
  finally {busy=false;updateButtons();}
}

function formatDate(value: string) {
  try {return new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}
  catch {return value;}
}

function renderPeople(people: Person[]) {
  const area = el('people-list');area.replaceChildren();
  if (!people.length) {area.innerHTML='<p class="empty-state">Belum ada peserta yang didaftarkan.</p>';return;}
  for (const person of people) {
    const row=document.createElement('div');row.className='data-row';
    const avatar=document.createElement('span');avatar.className='avatar';avatar.textContent=person.display_name.slice(0,2).toUpperCase();
    const info=document.createElement('div');
    const strong=document.createElement('strong');strong.textContent=person.display_name;
    const small=document.createElement('small');small.textContent=`Daftar ${formatDate(person.created_at)}`;
    info.append(strong,small);
    const button=document.createElement('button');button.type='button';button.title=`Hapus ${person.display_name}`;button.setAttribute('aria-label',`Hapus ${person.display_name}`);button.innerHTML='<i class="bi bi-trash"></i>';
    button.addEventListener('click',()=>void deletePerson(person));
    row.append(avatar,info,button);area.append(row);
  }
}

function renderHistory(history: FaceEvent[]) {
  const area=el('history-list');area.replaceChildren();
  el<HTMLButtonElement>('clear-history').disabled=!history.length;
  if (!history.length) {area.innerHTML='<p class="empty-state">Belum ada pengenalan wajah.</p>';return;}
  for (const item of history) {
    const row=document.createElement('div');row.className='history-row';
    const avatar=document.createElement('span');avatar.className='avatar';avatar.innerHTML=`<i class="bi bi-${item.profile_id?'check-lg':'question-lg'}"></i>`;
    const info=document.createElement('div');const strong=document.createElement('strong');strong.textContent=item.face_profiles?.display_name||'Tidak dikenal';
    const small=document.createElement('small');small.textContent=`${formatDate(item.detected_at)} · ${item.similarity===null?'Tanpa kandidat':`${(Math.max(0,item.similarity)*100).toFixed(0)}% kemiripan`}`;
    info.append(strong,small);row.append(avatar,info);area.append(row);
  }
}

async function loadData() {
  if (!loggedIn) return;
  try {const {people,history}=await request<ListResponse>('list');renderPeople(people);renderHistory(history);}
  catch(cause){showToast(cause instanceof Error?cause.message:String(cause),true);}
}

async function deletePerson(person: Person) {
  if (!confirm(`Hapus profil wajah dan seluruh riwayat terkait ${person.display_name}? Tindakan ini tidak bisa dibatalkan.`)) return;
  try {await request('delete',{id:person.id});matchLabel=null;matchExpires=0;showToast(`Data ${person.display_name} dihapus.`);await loadData();}
  catch(cause){showToast(cause instanceof Error?cause.message:String(cause),true);}
}

async function login(event: SubmitEvent) {
  event.preventDefault();
  const errorArea=el('login-error');errorArea.textContent='';
  if (!supabase) {errorArea.textContent='Koneksi Supabase belum diatur. Lihat README-INSTALASI.md.';return;}
  const button=el<HTMLButtonElement>('submit-login');button.disabled=true;
  try {
    const {error}=await supabase.auth.signInWithPassword({
      email:el<HTMLInputElement>('login-email').value.trim(), password:el<HTMLInputElement>('login-password').value,
    });
    if(error)throw error;
    // Server tetap memeriksa INSTRUCTOR_EMAIL; login saja belum memberi akses data.
    await request('list');
    setAuth(true);loginDialog.close();loginForm.reset();
    showToast('Pengajar berhasil masuk. Siap mendaftarkan wajah.');
    await loadData();
  } catch(cause) {
    await supabase.auth.signOut();setAuth(false);
    errorArea.textContent=cause instanceof Error?cause.message:String(cause);
  } finally {button.disabled=false;}
}

async function initAuth() {
  if (!supabase) {showToast('Mode kamera tersedia. Atur Supabase untuk menyimpan dan mengenali wajah.',true);return;}
  const {data}=await supabase.auth.getSession();
  if(data.session) {
    try{await request('list');setAuth(true);await loadData();}
    catch{await supabase.auth.signOut();setAuth(false);}
  }
  supabase.auth.onAuthStateChange((event)=>{
    if(event==='SIGNED_OUT')window.setTimeout(()=>setAuth(false),0);
  });
}

el('hero-start').addEventListener('click',()=>{document.querySelector('.workspace')?.scrollIntoView({behavior:'smooth'});void startCamera();});
startButton.addEventListener('click',()=>void startCamera());
stopButton.addEventListener('click',stopCamera);
switchButton.addEventListener('click',async()=>{
  switchButton.disabled=true;
  try{await vision.switchCamera();updateCamera(true);}catch(cause){updateCamera(false);showToast(cause instanceof Error?cause.message:String(cause),true);}
});
document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button=>button.addEventListener('click',()=>tab(button.dataset.tab||'camera')));
recognizeButton.addEventListener('click',()=>void recognize());
captureButton.addEventListener('click',capture);
el<HTMLFormElement>('enroll-form').addEventListener('submit',event=>void enroll(event));
nameField.addEventListener('input',updateButtons);
consent.addEventListener('change',updateButtons);
threshold.addEventListener('input',()=>{el('threshold-value').textContent=`${threshold.value}%`;});
el<HTMLInputElement>('vocab-search').addEventListener('input',renderVocabulary);
el('refresh-data').addEventListener('click',()=>void loadData());
el('clear-history').addEventListener('click',async()=>{
  if(!confirm('Hapus seluruh riwayat pencocokan pada akun pengajar?'))return;
  try{await request('clear_history');await loadData();showToast('Riwayat telah dihapus.');}
  catch(cause){showToast(cause instanceof Error?cause.message:String(cause),true);}
});
el('header-login').addEventListener('click',async()=>{
  if(loggedIn){if(supabase)await supabase.auth.signOut();setAuth(false);showToast('Anda sudah keluar. Kamera tetap dapat digunakan.');}
  else if(!supabase)showToast('Isi konfigurasi Supabase pada Vercel terlebih dahulu.',true);
  else loginDialog.showModal();
});
el('close-dialog').addEventListener('click',()=>loginDialog.close());
loginForm.addEventListener('submit',event=>void login(event));
window.addEventListener('pagehide',()=>vision.stop());
updateCamera(false);updateSamples();renderVocabulary();void initAuth();
