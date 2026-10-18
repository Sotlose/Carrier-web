/* Shared Android/PC onboarding and respawn. Save schema stays 1.
 * Training owns transient runtime only; the return snapshot is never overwritten
 * with training rewards, enemies or position. No production save keys change. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),now=()=>performance.now()/1000;
 const style=document.createElement('style');style.textContent=`
 #carrierTrainingSelect{position:fixed;inset:0;z-index:180;display:grid;place-items:center;padding:22px;background:rgba(8,9,19,.96);color:#f4eff6;font:500 16px/1.5 Onest,system-ui;overflow:auto}
 #carrierTrainingSelect[hidden],#carrierTrainingCard[hidden],#carrierDissolve[hidden]{display:none!important}
 #carrierTrainingSelect section{width:min(510px,100%);margin:auto}#carrierTrainingSelect h1{font-size:clamp(26px,5vw,38px);font-weight:500;margin:12px 0}
 #carrierTrainingSelect small{color:rgb(var(--hud-rgb));letter-spacing:.12em}#carrierTrainingSelect p{color:#bcb9c8}
 #carrierTrainingSelect button{display:block;width:100%;margin:10px 0;padding:15px 18px;min-height:48px;text-align:left;border:1px solid rgba(var(--hud-rgb),.4);border-radius:12px;background:rgba(var(--hud-rgb),.06);color:#f4eff6;font:inherit;cursor:pointer}
 #carrierTrainingSelect button:first-of-type{background:rgba(var(--hud-rgb),.2)}#carrierTrainingSelect button:disabled{opacity:.5}
 #carrierTrainingSelect button:focus-visible,#carrierTrainingCard button:focus-visible{outline:2px solid rgb(var(--hud-rgb));outline-offset:3px}
 #carrierTrainingCard{position:fixed;z-index:42;top:calc(96px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(480px,calc(100vw - 32px));padding:16px 20px;box-sizing:border-box;border:1px solid rgba(var(--hud-rgb),.3);border-radius:14px;background:rgba(12,12,26,.85);backdrop-filter:blur(12px);color:#eeeaf4;font:500 calc(16px * var(--carrier-ui-scale))/1.4 Onest,system-ui;pointer-events:none}
 #carrierTrainingCard strong{display:block;font-size:1.18em;margin:6px 0}#carrierTrainingCard p{margin:6px 0}#carrierTrainingCard small{color:rgb(var(--hud-rgb));font-size:.8em}
 #carrierTrainingCard button{pointer-events:auto;min-height:36px;border:0;border-bottom:1px solid rgba(var(--hud-rgb),.4);background:none;color:rgb(var(--hud-rgb));font:inherit;font-size:.8em;padding:6px 0;margin-right:16px}
 body.carrierTraining #carrierHint,body.carrierTraining #hudMission,body.carrierTraining #carrierSkillButton,body.carrierTraining #carrierCollectionButton,body.carrierTraining #carrierSaveButton,body.carrierTraining #carrierNewGame{display:none!important}
 body.carrierTraining:has(#carrierSettings.on) #carrierTrainingCard,body.carrierTraining:has(#carrierFaq.on) #carrierTrainingCard,body.carrierTraining:has(#carrierAudioMenu.on) #carrierTrainingCard{display:none!important}
 #carrierDissolve{position:fixed;inset:0;z-index:170;display:grid;place-content:center;text-align:center;background:radial-gradient(ellipse,rgba(var(--hud-rgb),.15),rgba(6,7,18,.92));color:#eeeaf4;font:500 24px/1.5 Onest,system-ui;pointer-events:auto;animation:carrierDissolveIn .4s ease both}
 #carrierDissolve small{font-size:15px;opacity:.7}#carrierDissolve:before{content:'·   · ·    ·   ·';font-size:60px;letter-spacing:14px;color:rgb(var(--hud-rgb));animation:carrierScatter 1.4s ease-out both}
 @keyframes carrierScatter{from{transform:scale(.2);opacity:1}to{transform:scale(2);opacity:0}}@keyframes carrierDissolveIn{from{opacity:0}to{opacity:1}}
 @media(max-height:500px){#carrierTrainingCard{left:var(--hud-gap);top:80px;transform:none;width:min(350px,44vw);font-size:15px;padding:12px}#carrierTrainingCard strong{margin:2px 0}#carrierTrainingSelect{display:block}#carrierTrainingSelect button{margin:6px 0;padding:9px 14px}}
 @media(prefers-reduced-motion:reduce){#carrierDissolve,#carrierDissolve:before{animation:none}}
 `;document.head.append(style);
 const select=document.createElement('div');select.id='carrierTrainingSelect';select.hidden=true;select.setAttribute('role','dialog');select.setAttribute('aria-modal','true');select.setAttribute('aria-labelledby','carrierTrainingTitle');
 const card=document.createElement('section');card.id='carrierTrainingCard';card.hidden=true;card.setAttribute('aria-label','Обучение');
 card.innerHTML='<small id="carrierTrainingCount"></small><strong id="carrierTrainingGoal"></strong><p id="carrierTrainingText"></p><small id="carrierTrainingFeedback" role="status"></small><div><button id="carrierTrainingAudio">Источник звука</button><button id="carrierTrainingRetry">Повторить этап</button></div>';
 const dissolve=document.createElement('div');dissolve.id='carrierDissolve';dissolve.hidden=true;dissolve.innerHTML='<div>Курьер распался</div><small>Материя собирается снова. Прогресс сохранён.</small>';
 document.body.append(select,card,dissolve);
 let phase='off',step=0,returnSave=null,stepSave=null,progress=0,kills=0,advanceAt=0,startRot=null,startPos=null,reborn=false,awaitAudio=false,audioSwitch=false,selectBusy=false;
 const isPC=()=>!!document.getElementById('carrierDesktopPlay');
 const steps=[
  ['Движение','Сдвинь стик слева вперёд и удерживай. Пролети немного вперёд.','Удерживай W: пролети немного вперёд.'],
  ['Камера','Проведи пальцем справа, чтобы осмотреться. Направление полёта следует за взглядом.','Поверни камеру мышью. Если курсор свободен, нажми «Играть», чтобы захватить мышь.'],
  ['Прицеливание','Быстро коснись экрана двумя пальцами: включится вид от первого лица.','Нажми C, чтобы включить вид от первого лица.'],
  ['Первый выстрел','Коротко коснись свободной части экрана и отпусти. Энергия ENRG расходуется на выстрелы.','Нажми и отпусти ЛКМ. Удержание усиливает выстрел; он расходует ENRG.'],
  ['Ускорение рядом с нодом','Учебный нод рядом. Удерживай палец неподвижно справа, дождись заряда и отпусти. В пустоте заряд не набирается.','Учебный нод рядом. Удерживай E для заряда и отпусти для рывка. Заряд набирается только рядом с нодами.'],
  ['Три противника','Поворачивай камеру, прицеливайся и стреляй. Уничтожь трёх врагов. При распаде повторится только этот этап.','Поворачивай камеру мышью и стреляй ЛКМ. Уничтожь трёх врагов. При распаде повторится только этот этап.'],
  ['Выстрел в ритм','Смотри на шкалу BPM сверху. Отпусти выстрел у отметки доли: урон усилится. Нужен один усиленный выстрел.','Отпусти ЛКМ у отметки доли на верхней шкале BPM. Нужен один усиленный выстрел.'],
  ['Перерождение','Энергия подготовлена. Коснись Курьера в центре экрана, чтобы перестроить пространство. Выйди из прицеливания двойным касанием, если нужно.','Энергия подготовлена. Нажми R, чтобы перестроить пространство.'],
  ['В обычный мир','Высшее перерождение заряжено. Нажми кнопку со стрелкой в круге над ENRG. Затем выбери музыку для нового мира. Настройки сохранятся, прогресс начнётся с нуля.','Высшее перерождение заряжено. Нажми Q или кнопку со стрелкой в круге над ENRG. Затем выбери музыку для нового мира. Настройки сохранятся, прогресс начнётся с нуля.']
 ];
 function hasSaves(){try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(/^carrier\.progress\.(auto|slot\.[123])\.v1(?:\.|$)/.test(key)&&localStorage.getItem(key))return true}return false}catch(_){return true}}
 function sourceMenu(optional=false){
  select.hidden=false;card.hidden=true;
  const world=phase==='world-audio';
  select.innerHTML='<section><small>CARRIER · '+(world?'НОВОЕ ПУТЕШЕСТВИЕ':'ПОЛИГОН')+'</small><h1 id="carrierTrainingTitle">'+(world?'Полигон пройден. Выбери музыку.':optional?'Освежить управление?':'Твоя музыка. Твой первый полёт.')+'</h1><p>'+(world?'Выбери трек или источник звука для обычного мира. Настройки сохранены; учебные награды остались в полигоне.':optional?'Пройти обучение перед новым путешествием или сразу войти в мир.':'Пройдём управление и бой по шагам. Для ритма и мира выбери источник звука.')+'</p><div id="carrierTrainingChoices"></div><p id="carrierTrainingStatus" role="status"></p></section>';
  const choices=$('carrierTrainingChoices');
  function button(label,fn){const b=document.createElement('button');b.textContent=label;b.addEventListener('click',fn);choices.append(b);return b}
  button('Использовать встроенный трек · Weighted Half-Time',async()=>{
   if(selectBusy)return;selectBusy=true;awaitAudio=true;status('Загружаю встроенный трек…');
   try{ensureAnalyser();await audioCtx.resume();const response=await fetch('weighted-half-time.mp3');if(!response.ok)throw Error('Файл недоступен');const blob=await response.blob();audioEl.loop=true;loadFile(new File([blob],'Weighted Half-Time.mp3',{type:'audio/mpeg'}));await audioEl.play();}
   catch(e){awaitAudio=false;status('Не удалось включить трек. Попробуй снова или выбери другой источник.');}
   finally{selectBusy=false}
  });
  button('Загрузить аудиофайл',()=>{awaitAudio=true;$('carrierStartFile').click()});
  if(navigator.mediaDevices?.getDisplayMedia)button('Захват звука вкладки / экрана',()=>{awaitAudio=true;$('carrierStartScreen').click()});
  button('Микрофон',()=>{awaitAudio=true;$('carrierStartMic').click()});
  if(optional)button('Начать без повторного обучения',()=>{phase='off';select.hidden=true;CarrierProgress.autosave('new');CarrierProgress.open()});
  if(world)button('Войти без музыки',()=>{$('carrierMenuStop').click();awaitAudio=true;CarrierProgress.open()});
  if(audioSwitch)button('Вернуться к этапу',()=>{select.hidden=true;card.hidden=false;audioSwitch=false;awaitAudio=false});
  choices.querySelector('button')?.focus({preventScroll:true});
 }
 function status(message){const el=$('carrierTrainingStatus');if(el)el.textContent=message}
 function render(){const s=steps[step];$('carrierTrainingCount').textContent='ПОЛИГОН · '+(step+1)+' / '+steps.length;$('carrierTrainingGoal').textContent=s[0];$('carrierTrainingText').textContent=s[isPC()?2:1];$('carrierTrainingFeedback').textContent=step===5?'Побеждено: '+kills+' / 3':''}
 function clearCombat(){synCombatReset();synCombatNextEcology=Infinity;synQuest=null;synQuestNext=Infinity;synKin=[];synTrial=null;synBraid=null}
 function checkpoint(){stepSave=CarrierProgress.snapshot('training-checkpoint');startRot={x:rotX,y:rotY};startPos={x:synCarX,y:synCarY,z:synCarZ};progress=0;kills=0;advanceAt=0;reborn=false}
 function softenNode(node){node.rad=Math.min(node.rad,64);node.born=Math.min(node.born,.7);node.spawn=0;node.pull=.12;node.swirlK=.10;node.mob=0;node.rep=0;node.state=null;node.stateKey=null;node.giant=null;return node}
 function trainingField(){
  synNodes=[];synEdges=[];synSits=[];synPath=[];synGrows=[];synMotes=[];synNear=null;synVortexPass=new WeakMap();
  for(let i=0;i<8;i++){const angle=i*Math.PI/4;softenNode(synMakeNode(synCarX+Math.cos(angle)*850,synCarY,synCarZ+Math.sin(angle)*850,35+i*4,1e6))}
 }
 function placeNode(){const A=synAim();const node=softenNode(synMakeNode(synCarX+A.rx*320,synCarY,synCarZ+A.rz*320,55,1e6));node.e=.5;synNear=node;synCond=null;return node}
  function enterStep(){
  clearCombat();synVel={x:0,y:0,z:0};synCharge=0;synCharging=false;synShotHeld=false;synCond=null;
  synPoints=synPointsShown=step===7?Math.max(28,SYN_REBIRTH_AT+2):20;synAmmo=synAmmoCapacity();
  if(step===2){synFirstPerson=false;document.getElementById('carrierView')?.setAttribute('aria-pressed','false')}
  if(step===4)placeNode();
  if(step===5){const A=synAim();for(let i=0;i<3;i++){const h=synSpawnHostile({x:synCarX+A.fx*900+A.rx*(i-1)*450,y:synCarY+A.fy*900,z:synCarZ+A.fz*900+A.rz*(i-1)*450},'casual',nowSec(),true);if(h){h.tutorial=true;h.siteRegion=null;h.siteKey=null;h.x=h.hx=synCarX+A.fx*1000+A.rx*(i-1)*400;h.y=h.hy=synCarY+A.fy*1000;h.z=h.hz=synCarZ+A.fz*1000+A.rz*(i-1)*400;h.attackNext=nowSec()+3+i;}}}
  if(step===8)synUltCharge=1;
  checkpoint();render();
 }
 function begin(){
  returnSave=CarrierProgress.snapshot('before-training');phase='active';step=0;select.hidden=true;card.hidden=false;document.body.classList.add('carrierTraining');
  synCam={x:0,y:0,z:0};synCamS={...synCam};synVel={x:0,y:0,z:0};synUpdateCarrierPos();trainingField();
  enterStep();
 }
 function done(){if(advanceAt)return;advanceAt=now()+1.1;$('carrierTrainingFeedback').textContent='Получилось';}
 function event(type,info){if(phase!=='active'||advanceAt||!select.hidden)return;
  if(step===3&&type==='fired')done();
  if(step===4&&type==='jump'&&Number(info)>=.15)done();
  if(step===5&&type==='kill'){kills++;$('carrierTrainingFeedback').textContent='Побеждено: '+kills+' / 3';if(kills>=3)done()}
  if(step===6&&type==='fired'&&info.beatMultiplier>1.05&&synBeatAvailable())done();
  if(step===7&&type==='rebirth')reborn=true;
 }
 function retry(){if(phase!=='active'||!stepSave)return;CarrierProgress.restore(stepSave);trainingField();enterStep();$('carrierTrainingFeedback').textContent='Этап начат заново';}
 function finish(){if(phase!=='active'||step!==8||advanceAt)return false;
  phase='restoring';const restored=CarrierProgress.restore(returnSave);if(!restored){phase='active';return false;}
  phase='off';card.hidden=true;select.hidden=true;document.body.classList.remove('carrierTraining');returnSave=stepSave=null;
  window.CarrierHints?.finishTraining();CarrierProgress.autosave('tutorial-complete');
  CarrierProgress.resetInput();synVel={x:0,y:0,z:0};document.exitPointerLock?.();
  phase='world-audio';awaitAudio=false;audioSwitch=false;sourceMenu(false);return true;
 }
 window.CarrierTutorial={
  prepareNode(node){return phase==='active'?softenNode(node):node},
  active:()=>phase==='active',selecting:()=>!select.hidden,blocksSave:()=>phase!=='off'&&phase!=='world-audio',status,event,finish,retry,
  paused:()=>phase==='active'&&['carrierSettings','carrierFaq','carrierAudioMenu','carrierCollection','carrierNodeEditor','carrierSkills'].some(id=>$(id)?.classList.contains('on')),
  offer(){phase='offer';audioSwitch=false;awaitAudio=false;sourceMenu(true)},
  interceptOpen(){if(phase==='off')return false;if(phase==='active'&&!audioSwitch)return false;
   if(!awaitAudio){sourceMenu(phase==='offer');return true}awaitAudio=false;
   if(phase==='world-audio'){phase='off';select.hidden=true;CarrierProgress.autosave('tutorial-audio-selected');return false}
   if(audioSwitch){audioSwitch=false;select.hidden=true;card.hidden=false;return false}begin();return false;
  },
  tick(t,dt){if(phase!=='active'||!select.hidden||document.hidden)return;
   // Rebirth and node growth may create new matter. Every training node stays gentle.
   for(const node of synNodes)softenNode(node);
   if(step===5&&Math.hypot(synCarX-startPos.x,synCarY-startPos.y,synCarZ-startPos.z)>4500){retry();$('carrierTrainingFeedback').textContent='Вернули тебя к учебной битве. Пройденные этапы сохранены.';return}
   if(advanceAt){if(now()>=advanceAt){step++;enterStep()}return}
   if(step===0){const intent=synIntent();if(intent&&Math.hypot(synCarX-startPos.x,synCarY-startPos.y,synCarZ-startPos.z)>100)progress+=dt;if(progress>.8)done()}
   if(step===1&&Math.hypot(rotX-startRot.x,rotY-startRot.y)>.4)done();
   if(step===2&&synFirstPerson)done();
   if(step===6&&!synBeatAvailable())$('carrierTrainingFeedback').textContent='Пока нет ритма. Включи музыку или выбери встроенный трек.';
   if(step===7&&reborn&&synRebirthT<0)done();
   if(step===8)synUltCharge=1;
   if(step===4&&synNear&&Math.hypot(synNear.x-synCarX,synNear.y-synCarY,synNear.z-synCarZ)>1600){placeNode();$('carrierTrainingFeedback').textContent='Новый учебный нод рядом — зарядись от него.'}
  }
 };
 $('carrierTrainingAudio').onclick=()=>{audioSwitch=true;awaitAudio=false;sourceMenu(false)};
 $('carrierTrainingRetry').onclick=retry;
 // Modal keyboard focus stays inside the audio choice; Escape cannot bypass a first run.
 select.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=[...select.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
 let death=null,shieldUntil=0,deathCause=null;
 function loss(save){
  if(deathCause!=='enemy'||Math.max(save.progression.peakLevel||1,1+save.progression.skillPoints+Object.values(save.progression.skills).reduce((a,b)=>a+b,0))<6)return '';
  const entries=Object.entries(save.progression.skills).filter(([id,lv])=>lv>0);if(!entries.length)return '';
  const highest=Math.max(...entries.map(e=>e[1])),options=entries.filter(e=>e[1]===highest),[id,lv]=options[Math.floor(Math.random()*options.length)];
  save.progression.peakLevel=Math.max(save.progression.peakLevel||1,synLevel());save.progression.skills[id]=lv-1;
  const name=SYN_ABIL.find(a=>a[0]===id)?.[1]||id;return 'Потеряна ступень: '+name+' '+lv+' → '+(lv-1)+'.';
 }

 window.CarrierLife={recordDamage(cause,before,after){if(before>0&&after<=0)deathCause=cause;},resetCause(){deathCause=null;},busy:()=>!!death,protected:()=>!!death||now()<shieldUntil,
  tick(t,dt){
   if(!drop.classList.contains('hidden')||!select.hidden)return false;
   if(!death&&synPoints>0)deathCause=null;
   if(!death&&synPoints<=0){death={at:now(),save:CarrierProgress.snapshot('respawn'),x:synCarX,y:synCarY,z:synCarZ};CarrierProgress.resetInput();synShotHeld=false;synCharging=false;carrierTouch.x=carrierTouch.y=0;document.exitPointerLock?.();death.loss=phase==='active'?'':loss(death.save);dissolve.querySelector('small').textContent=phase==='active'?'Вернёмся к началу текущего этапа.':death.loss||'Материя собирается снова. Прогресс сохраняется.';dissolve.hidden=false;}
   if(!death)return false;
   if(now()-death.at<1.4)return true;
   if(phase==='active'){death=null;retry()}
   else{
    const lost=death.loss,state=death.save,angle=Math.random()*Math.PI*2,vertical=(Math.random()-.5)*.5,distance=7000+Math.random()*5000,horizontal=Math.sqrt(1-vertical*vertical),A=synAim();
    state.player.camera={x:death.x+Math.cos(angle)*horizontal*distance-A.fx*SYN_ANCHOR_Z,y:death.y+vertical*distance-A.fy*SYN_ANCHOR_Z,z:death.z+Math.sin(angle)*horizontal*distance-A.fz*SYN_ANCHOR_Z};
    state.player.velocity={x:0,y:0,z:0};state.player.points=20;state.player.commitment=0;
    CarrierProgress.restore(state);death=null;CarrierProgress.autosave('respawn');
    synSay(['Курьер собран заново.',lost||'Энергия 20 · прогресс сохранён.'],t,5);
   }
   deathCause=null;shieldUntil=now()+3;dissolve.hidden=true;return true;
  }
 };
 if(!hasSaves()){phase='required';sourceMenu(false)}
})();
