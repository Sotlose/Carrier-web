/* Browser visitor shell. No analytics, uploads or automatic media permissions. */
(()=>{
 const $=id=>document.getElementById(id),quick=new URLSearchParams(location.search).get('visit')==='1';
 const back=document.createElement('a');back.id='carrierWebBack';back.href='./';back.textContent='← О проекте';document.body.append(back);
 const sync=()=>{back.hidden=drop.classList.contains('hidden')&&!window.CarrierTutorial?.selecting()};setInterval(sync,300);sync();
 if(!navigator.mediaDevices?.getDisplayMedia)for(const id of ['carrierStartScreen','carrierMenuScreen'])if($(id))$(id).hidden=true;
 if(quick){window.CarrierHints?.finishTraining();}
 if(new URLSearchParams(location.search).get('training')==='1'&&!window.CarrierTutorial?.selecting())window.CarrierTutorial?.offer();
 const box=$('carrierStartFile')?.parentElement;if(!box)return;
 const button=document.createElement('button');button.id='carrierWebBuiltin';button.type='button';button.textContent='Играть · встроенная музыка';
 const state=document.createElement('p');state.id='carrierWebStatus';state.setAttribute('role','status');state.textContent='Музыка запускается только по нажатию. Свой трек можно выбрать ниже.';
 box.insertBefore(button,$('carrierStartFile'));button.after(state);
 button.addEventListener('click',async e=>{e.stopPropagation();if(button.disabled)return;button.disabled=true;state.textContent='Загружаю трек…';
  try{ensureAnalyser();await audioCtx.resume();const response=await fetch('weighted-half-time.mp3');if(!response.ok)throw Error('Track unavailable');const blob=await response.blob();audioEl.loop=true;loadFile(new File([blob],'Weighted Half-Time.mp3',{type:'audio/mpeg'}));await audioEl.play();state.textContent='Трек включён.';}
  catch(_){state.textContent='Не удалось запустить трек. Попробуй снова или выбери аудиофайл / вход без музыки.';}
  finally{button.disabled=false;}
 });
})();
