/* Input adapter only. World, combat, progression, audio and save schema are unchanged. */
(()=>{
  const $=id=>document.getElementById(id);
  const panels=['carrierSettings','carrierSkills','carrierAudioMenu','carrierSaves','carrierFaq','carrierCollection','carrierNodeEditor','carrierPatternEditor'];
  const locked=()=>document.pointerLockElement===canvas;
  const playable=()=>!document.hidden&&drop.classList.contains('hidden')&&
    !window.CarrierTutorial?.selecting()&&!window.CarrierLife?.busy()&&
    !panels.some(id=>$(id)?.classList.contains('on'))&&!window.CarrierOrbit?.sleeping();
  const held=new Set();
  const codes={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyE:'e',KeyR:'r',KeyQ:'q',KeyC:'c'};
  const fallback={'ц':'w','ф':'a','ы':'s','в':'d','у':'e','к':'r','й':'q','с':'c'};
  function steer(){
    carrierTouch.x=Number(held.has('d'))-Number(held.has('a'));
    carrierTouch.y=Number(held.has('s'))-Number(held.has('w'));
  }
  function clear(){
    held.clear();steer();
    synKeys.w=synKeys.a=synKeys.s=synKeys.d=false;
    synCharging=false;synCharge=0;synShotHeld=false;synShotCharge=0;carrierChargeHold=null;
  }
  function unlock(){clear();if(locked())document.exitPointerLock();}
  const bar=document.createElement('div');
  bar.id='carrierDesktopHelp';
  bar.style.cssText='position:fixed;bottom:calc(95px * var(--carrier-ui-scale,1));left:50%;transform:translateX(-50%);z-index:80;width:min(340px,calc(100vw - 40px));padding:14px;border:1px solid var(--ui-line,#ffffff28);border-radius:4px;background:var(--ui-panel,#101116ec);color:var(--ui-text,#ccc);font:calc(11px * var(--carrier-ui-scale,1))/1.6 Onest,system-ui;';
  bar.innerHTML='<button type="button" id="carrierDesktopPlay" style="background:#ddd;color:#111;border:0;border-radius:5px;padding:5px 10px;cursor:pointer">Играть · захват мыши</button><div>WASD + мышь · E разгон · R перерождение / слияние<br>Q высшее перерождение · ЛКМ выстрел · ПКМ действие<br>C вид · F полный экран · Esc меню / свободная мышь</div><div id="carrierDesktopStatus" role="status"></div>';
  document.body.appendChild(bar);
  const status=$('carrierDesktopStatus');
  async function capture(){
    if(!playable()||synOrbit)return;
    try{await canvas.requestPointerLock();status.textContent='';}
    catch(_){status.textContent='Захват мыши не включился. Нажми «Играть» ещё раз.';}
  }
  $('carrierDesktopPlay').addEventListener('click',capture);
  function sync(){
    if(!playable()&&locked())unlock();
    bar.style.display=locked()||!playable()?'none':'';
    $('carrierDesktopPlay').disabled=!playable()||!!synOrbit;
  }
  document.addEventListener('pointerlockchange',()=>{
    clear();
    // Keep the current Carrier toolbar; the old Dot3D capture presentation is unused.
    setSynCapturePresentation(false);sync();
  });
  function key(e,down){
    const k=codes[e.code]||fallback[e.key.toLowerCase()]||e.key.toLowerCase();
    if(e.key==='Escape'){unlock();return;}
    if(!'wasderqc'.includes(k)||k.length!==1)return;
    if(e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
    if(!down){
      held.delete(k);steer();
      if(k==='e'){const fire=synCharging&&locked()&&playable();synCharging=false;if(fire)synJumpFire();else synCharge=0;}
      return;
    }
    if(!locked()||!playable()||synOrbit)return;
    e.preventDefault();
    if(e.repeat)return;
    held.add(k);steer();
    if(k==='e')synCharging=true;
    if(k==='r'){
      const near=synKinNear();
      if(near){synRebirthArmAt=-1;synBraidStart(nowSec(),near);}else synRebirthArm(nowSec());
    }
    if(k==='q')synUltFire(nowSec());
    if(k==='c'){synFirstPerson=!synFirstPerson;canvas.setAttribute('aria-label',synFirstPerson?'Carrier: прицеливание':'Carrier: полёт');}
  }
  window.addEventListener('keydown',e=>key(e,true));
  window.addEventListener('keyup',e=>key(e,false));
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'||e.button!==0||!playable()||synOrbit)return;
    if(!locked()){capture();return;}
    e.preventDefault();synShotAt=nowSec();synShotHeld=true;synShotCharge=0;
    carrierChargeHold={x:innerWidth/2,y:innerHeight/2};
  });
  window.addEventListener('pointerup',e=>{
    if(e.button!==0||!synShotHeld)return;
    const charge=Math.min(1,(nowSec()-synShotAt)/.85);
    synShotHeld=false;carrierChargeHold=null;
    if(locked()&&playable())synFireShot(nowSec(),charge);else synShotCharge=0;
  });
  window.addEventListener('pointercancel',clear);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==2||!playable())return;
    e.preventDefault();clear();
    if(synOrbit){
      const rest=$('carrierOrbitRest');
      if(!rest.hidden&&!rest.disabled)rest.click();
      unlock();
    }else if($('carrierRemember').classList.contains('on')){
      $('carrierRemember').click();unlock();
    }else{unlock();status.textContent='Подлети к ноду и замедлись до появления «На орбиту».';}
  });
  // RMB on an existing interaction button performs exactly that button's action.
  document.addEventListener('contextmenu',e=>{
    const button=e.target.closest?.('#carrierRemember,#carrierOrbitActions button');
    if(button){e.preventDefault();if(!button.disabled)button.click();}
  });
  window.addEventListener('blur',clear);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)unlock();});
  const observer=new MutationObserver(sync);
  for(const id of panels)if($(id))observer.observe($(id),{attributes:true,attributeFilter:['class']});
  observer.observe(drop,{attributes:true,attributeFilter:['class']});
  sync();
})();
