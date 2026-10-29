// Web version: data and results live behind the team PIN in Supabase (cust-api edge function).
const API='https://xpehjmiymlxqbydczppu.supabase.co/functions/v1/cust-api';
const POLL_MS=20000;

async function api(action,extra={}){
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({action,pin:store.get('pin')||'',...extra})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw Object.assign(new Error(j.error||('HTTP '+r.status)),{code:j.error||'http',status:r.status});
  return j;
}
const gateMsg=e=>e.status===401?'ລະຫັດທີມບໍ່ຖືກ':e.status===429?'ລອງຜິດຫຼາຍເທື່ອ ລໍຖ້າ 15 ນາທີ ແລ້ວລອງໃໝ່':'ເຊື່ອມຕໍ່ບໍ່ໄດ້ ກວດອິນເຕີເນັດ ແລ້ວລອງໃໝ່';

// Nobody sees data or saves anything until they give the team PIN and their name.
function ensureLogin(){
  return new Promise(done=>{
    const g=$('gate'), f=$('gateF');
    $('gPin').value=store.get('pin')||'';$('gName').value=store.get('who')||'';
    const ok=()=>{g.hidden=true;done();};
    if(store.get('pin')&&(store.get('who')||'').length>=2){
      api('auth').then(ok).catch(e=>{g.hidden=false;$('gErr').textContent=gateMsg(e);});
    } else g.hidden=false;
    f.addEventListener('submit',async e=>{
      e.preventDefault();
      const pin=$('gPin').value.trim(), name=$('gName').value.trim().replace(/\s+/g,' ');
      if(name.length<2){$('gErr').textContent='ກະລຸນາໃສ່ຊື່ຜູ້ເຮັດ (ຢ່າງໜ້ອຍ 2 ຕົວອັກສອນ)';$('gName').focus();return;}
      if(!pin){$('gErr').textContent='ກະລຸນາໃສ່ລະຫັດທີມ';$('gPin').focus();return;}
      store.set('pin',pin);store.set('who',name);$('gErr').textContent='ກຳລັງກວດ…';
      try{await api('auth');ok();}catch(err){$('gErr').textContent=gateMsg(err);}
    });
  });
}

// Same surface the page uses for the claude.ai store: collection('track').onSnapshot / doc(k).set
function webDb(){
  const rows=new Map(); let since=null, cb=null, errCb=null;
  const emit=()=>cb&&cb({docs:[...rows].map(([id,b])=>({id,data:()=>b}))});
  async function poll(){
    try{
      const j=await api('list',since?{since}:{});
      j.rows.forEach(r=>{rows.set(r.k,r.body);if(!since||r.updated_at>since) since=r.updated_at;});
      if(j.rows.length||!poll.done) emit();
      poll.done=true;
    }catch(e){
      if(e.status===401){store.set('pin','');location.reload();return;}
      errCb&&errCb({code:e.code});
    }
  }
  return {collection:()=>({
    onSnapshot(next,err){
      cb=next;errCb=err;poll();
      setInterval(()=>{if(!document.hidden) poll();},POLL_MS);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden) poll();});
      return()=>{};
    },
    doc:k=>({set:async body=>{await api('save',{k,body});rows.set(k,JSON.parse(JSON.stringify(body)));emit();}})
  })};
}

const webDownloads={save:async({filename,data})=>{
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));a.download=filename;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  return {status:'saved'};
}};

(async()=>{
  $('loading').hidden=true;
  await ensureLogin();
  $('loading').hidden=false;
  try{D=await api('data');}
  catch(e){$('loading').hidden=true;$('banner').hidden=false;$('banner').textContent='ໂຫຼດຂໍ້ມູນລູກຄ້າບໍ່ໄດ້ ລອງໂຫຼດໜ້າໃໝ່ ('+e.code+')';return;}
  // repeated strings ship as indexes into D.S to keep the file small
  const dec=x=>typeof x==='number'?D.S[x]:x;
  for(const q of Object.keys(CFG)) D[q].r=D[q].r.map(r=>[r[0],r[1],r[2],r[3],dec(r[4]),dec(r[5]),dec(r[6]),dec(r[7]),r[8].map(dec)]);
  $('loading').hidden=true;
  IDX=new Map(Object.keys(CFG).flatMap(R).map(o=>[o.k,o]));
  for(const o of IDX.values()){if(!BYCODE.has(o.c)) BYCODE.set(o.c,[]);BYCODE.get(o.c).push(o);}
  const uq=l=>[...new Set([...IDX.values()].map(o=>fld(o,l)).filter(Boolean))].sort();
  const dl=(id,v)=>`<datalist id="${id}">${v.map(x=>`<option value="${esc(x)}"></option>`).join('')}</datalist>`;
  document.body.insertAdjacentHTML('beforeend',dl('dl-district',uq('ເມືອງ'))+dl('dl-branch',uq('ສາຂາ (ລະບົບ)')));
  // the name given at the gate is the name on every save; change it only by switching user
  $('who').value=store.get('who');$('who').readOnly=true;$('who').title='ປ່ຽນຊື່: ກົດ "ປ່ຽນຜູ້ໃຊ້"';
  $('switchUser').hidden=false;
  $('switchUser').addEventListener('click',()=>{store.set('who','');location.reload();});
  const h=location.hash.slice(1); go(CFG[h]||['rp','lg','gd'].includes(h)?h:'ov');
  db=webDb();
  db.collection('track').onSnapshot(s=>{TR={};s.docs.forEach(x=>{TR[x.id]=x.data()});refresh();},
    err=>{$('banner').hidden=false;$('banner').textContent='ການເຊື່ອມຕໍ່ຂາດ ຈະລອງໃໝ່ເອງ ('+err.code+')';});
  refresh();
  const dls=webDownloads;
  $('exp').hidden=false;$('exp').addEventListener('click',()=>dls.save({filename:'VARI_ຜົນຕິດຕາມ_'+ymd(Date.now())+'.csv',data:csv()}));
  const offer=(btn,fn,name)=>{$(btn).hidden=false;$(btn).addEventListener('click',()=>{
    const c=fn();
    if(!c){$('banner').hidden=false;$('banner').textContent='ຍັງບໍ່ມີຂໍ້ມູນແກ້ທີ່ລໍຖ້າເຂົ້າ LOO';return;}
    dls.save({filename:name+ymd(Date.now())+'.csv',data:c});
  });};
  offer('expLoo',looCsv,'VARI_ນຳເຂົ້າ_LOO_');
  offer('expFix',fullFixCsv,'VARI_ຂໍ້ມູນແກ້_ຄົບທຸກຊ່ອງ_');
})();
