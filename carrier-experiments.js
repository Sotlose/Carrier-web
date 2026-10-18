/* Optional experiments. Preferences stay in the existing validated input map.
 * Neither the editor nor its preview writes player progress or spends energy. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const shapes=[['Grid Lines','Сетка'],['Dot Lattice','Точки'],['Hex Lattice','Соты'],['Weave','Плетение'],['Diagonal Grid','Диагонали'],['Fine Mesh','Мелкая сетка'],['Diamond','Ромб'],['Triangle','Треугольник'],['Hexagon','Шестиугольник'],['Cross','Крест'],['Longitude Bulge','Выпуклость'],['Two Lobes','Две доли'],['Equator Belt','Экватор'],['Pole Caps','Полюса'],['Helix','Спираль'],['Double Helix','Двойная спираль'],['Spiral Belt','Спиральный пояс'],['Star 5','Звезда'],['Flower 8','Цветок'],['Clouds','Облака']];
 shapes.push(['Heart','Сердце'],['Square','Квадрат'],['Plus','Плюс'],['X Mark','Крест-икс'],['Frame','Рамка'],['Star 6','Звезда · 6'],['Petals 4','Четыре лепестка'],['Starburst','Лучистая'],['Sunflower','Подсолнух'],['Spikes 12','Двенадцать лучей'],['Gear','Шестерня'],['Cog','Зубчатая'],['Asterisk','Астериск'],['Checker','Шахматы'],['Bricks','Кирпичи'],['Square Rings','Квадратные кольца'],['Diamond Grid','Ромбическая сетка'],['Waffle','Вафли'],['Helix Tight','Тесная спираль'],['Counter Twist','Обратная спираль'],['Coil','Витки'],['Braided Twist','Косичка'],['Marble','Мрамор'],['Cells','Ячейки'],['Mandala','Мандала'],['Eye','Глаз'],['Crescent','Полумесяц'],['Ring','Кольцо'],['Twin Orbs','Две сферы'],['Lobed Blob','Три доли']);
 const defaults=[{radius:100,shape:'Helix',relief:25,layout:'dots',turns:4,tilt:0,yaw:0,offset:0,thickness:45},{radius:65,shape:'Grid Lines',relief:15,layout:'spiral',turns:4,tilt:25,yaw:0,offset:0,thickness:45},{radius:35,shape:'Star 5',relief:20,layout:'slice',turns:4,tilt:-20,yaw:0,offset:0,thickness:45}];
 const finite=(v,f,a,b)=>Number.isFinite(+v)?clamp(+v,a,b):f;
 function normalize(raw){
  const result={count:Math.round(finite(raw?.count,1,1,3)),layers:[],use:raw?.use===true};
  for(let i=0;i<3;i++){
   const source=raw?.layers?.[i]||{},d=defaults[i];
   const layer={radius:finite(source.radius,d.radius,[40,20,8][i],100),
    shape:source.shape==='none'||shapes.some(([id])=>id===source.shape)?source.shape:d.shape,
    relief:finite(source.relief,d.relief,0,65),layout:['dots','spiral','slice'].includes(source.layout)?source.layout:d.layout,
    turns:finite(source.turns,4,1,10),tilt:finite(source.tilt,d.tilt,-90,90),yaw:finite(source.yaw,0,-180,180),
    offset:finite(source.offset,0,-80,80),thickness:finite(source.thickness,45,8,100)};
   if(i){const previous=result.layers[i-1];const outer=previous.radius*(1-previous.relief*.003);
    layer.radius=Math.min(layer.radius,Math.max([40,20,8][i],(outer-4)/(1+layer.relief*.003)));}
   result.layers.push(layer);
  }
  return result;
 }
 function read(){return normalize({count:$('carrierPatternCount').value,use:$('carrierPatternUse').value==='1',layers:defaults.map((d,i)=>Object.fromEntries(Object.keys(d).map(k=>[k,$('carrierPattern'+i+k).value])))});}
 const enabled=()=>$('carrierExperimentsEnabled').checked;
 const editor=$('carrierPatternEditor');
 function rotate(p,pitch,yaw){const a=pitch*Math.PI/180,b=yaw*Math.PI/180,cy=Math.cos(a),sy=Math.sin(a),cx=Math.cos(b),sx=Math.sin(b);const y=p.y*cy-p.z*sy,z=p.y*sy+p.z*cy;return{x:p.x*cx+z*sx,y,z:z*cx-p.x*sx};}
 const outlines=new Map();
 const silhouette=new Set(['Heart','Diamond','Triangle','Hexagon','Square','Cross','Plus','X Mark','Frame','Star 5','Star 6','Flower 8','Petals 4','Starburst','Sunflower','Spikes 12','Gear','Cog','Asterisk','Eye','Crescent','Ring','Twin Orbs','Lobed Blob']);
 function outline(id,a,shape){
  if(id==='Heart'){const c=Math.cos(a);return{x:Math.sin(a)**3,y:-(13*c-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))/17};}
  if(id==='Ring')return{x:Math.cos(a),y:Math.sin(a)};
  if(id==='Crescent'){const u=(a%(Math.PI*2))/(Math.PI*2),v=u<.5?u*2:(1-u)*2,angle=-Math.PI*.65+v*Math.PI*1.3;return{x:(u<.5?Math.cos(angle):.38+.45*Math.cos(angle))-.25,y:Math.sin(angle)*.9};}
  let radii=outlines.get(id);if(!radii){radii=[];for(let i=0;i<256;i++){const angle=i/256*Math.PI*2;let r=1;for(;r>.12;r-=.008){const x=Math.cos(angle)*r,y=-Math.sin(angle)*r;if(shape&&shape(x,y,r,Math.atan2(y,x))>.42)break}radii.push(Math.max(.14,r));}outlines.set(id,radii);}
  const q=((a/(Math.PI*2)%1)+1)%1*256,j=Math.floor(q),r=radii[j]*(1-q+j)+radii[(j+1)%256]*(q-j);return{x:Math.cos(a)*r,y:Math.sin(a)*r};
 }
 function generate(raw,count){
  const config=normalize(raw),total=Math.max(0,Math.min(2400,Math.round(Number(count)||0))),points=[],library=window.__SHAPES||[];
  for(let layer=0;layer<config.count;layer++){
   const L=config.layers[layer],n=Math.floor(total/config.count)+(layer<total%config.count?1:0),shape=library.find(s=>s[0]===L.shape)?.[2],solid=silhouette.has(L.shape);
   for(let i=0;i<n;i++){
    const u=(i+.5)/Math.max(1,n);let y=1-2*u,angle=i*2.399963229728653,ring=-1,p;
    if(L.layout==='spiral')angle=u*Math.PI*2*L.turns;
    if(solid){
     if(L.layout!=='spiral'){const rows=3,columns=Math.ceil(n/rows);ring=Math.floor(i/columns);angle=(i%columns)/columns*Math.PI*2;y=[-.64,0,.64][ring];}
     const edge=outline(L.shape,angle,shape),cross=Math.sqrt(1-y*y);p={x:edge.x*cross,y:edge.y*cross,z:y*(.3+L.relief*.005)};
    }else{
     const latitude=Math.sqrt(Math.max(0,1-y*y));p={x:Math.cos(angle)*latitude,y,z:Math.sin(angle)*latitude};
     const longitude=Math.atan2(p.z,p.x)/Math.PI,vertical=Math.asin(y)*2/Math.PI;
     let value=shape?shape(longitude,vertical,Math.hypot(longitude,vertical),Math.atan2(vertical,longitude)):.5;value=Number.isFinite(value)?clamp(value,0,1):.5;
     const radial=1-(1-value)*(.22+L.relief*.005);if(shape){p.x*=radial;p.y*=radial;p.z*=radial;}
    }
    if(L.layout==='slice'){p.y=clamp(L.offset/100+p.y*L.thickness/100,-.98,.98);}
    const radius=L.radius/100;p=rotate(p,L.tilt,L.yaw);points.push({x:p.x*radius,y:p.y*radius,z:p.z*radius,layer,ring});
   }
  }return points;
 }
 function pattern(count){const config=read();return enabled()&&config.use&&!window.CarrierTutorial?.active()?generate(config,count):null;}
 function activePattern(){const c=read();return enabled()&&c.use&&!window.CarrierTutorial?.active()?c:null;}
 let structureId=0;const structures=[];
 function removeAnchors(group){const removed=new Set(synNodes.filter(n=>n.patternAnchor&&n.patternGroup===group));
  for(let i=synEdges.length-1;i>=0;i--){const e=synEdges[i];if(!removed.has(e.a)&&!removed.has(e.b))continue;for(const [a,b] of [[e.a,e.b],[e.b,e.a]]){const j=a.nb.indexOf(b);if(j>=0)a.nb.splice(j,1);a.edgeTo?.delete(b)}synEdges.splice(i,1)}
  for(let i=synNodes.length-1;i>=0;i--)if(removed.has(synNodes[i]))synNodes.splice(i,1);
 }
 function prepare(config,existing){
  while(structures.length>=2)removeAnchors(structures.shift());
  const origin={x:synCarX,y:synCarY,z:synCarZ},radius=2400,group={id:++structureId,origin,radius};structures.push(group);
  const points=generate(config,Math.max(144,config.count*96)),nodes=[];
  for(let i=0;i<points.length;i++){
   const a=i*2.39996,n=synMakeNode(origin.x+Math.cos(a)*160,origin.y+Math.sin(a)*100,origin.z+Math.sin(a*.7)*160,Math.max(8,58*config.layers[points[i].layer].radius/100),900);
   n.patternAnchor=true;n.patternGroup=group;n.patternLayer=points[i].layer;n.patternRing=points[i].ring;
   n.form={...n.form,kind:'sphere',el:.18,shape:null};n.lite=0;n.mob=0;n.spawn=0;n.pull=.015;n.swirlK=0;n.fil=[];n.state=null;n.stateKey=null;n.foreign=0;n.pal=.68+points[i].layer*.1;nodes.push(n);
  }
  // Heavy world matter belongs inside the deepest shell, never on its silhouette.
  const inner=config.layers[config.count-1].radius/100;
  const bodies=existing.filter(n=>!n.patternAnchor&&!n.giant&&!n.tens&&n.rad<SYN_VORTEX_MIN_RADIUS&&!synQuestOwnsNode(n)).sort((a,b)=>b.rad-a.rad);
  for(let i=0;i<bodies.length;i++){const n=bodies[i],u=(i+.5)/bodies.length,y=1-2*u,a=i*2.39996,r=inner*(.13+.27*u),q=Math.sqrt(1-y*y);
   points.push({x:Math.cos(a)*q*r,y:y*r,z:Math.sin(a)*q*r,layer:config.count-1,ring:-1});n.patternGroup=group;n.patternLayer=config.count-1;nodes.push(n);
  }
  // No stale connections may cut across the new surface.
  const members=new Set(nodes);for(let i=synEdges.length-1;i>=0;i--){const e=synEdges[i];if(!members.has(e.a)&&!members.has(e.b))continue;for(const [a,b] of [[e.a,e.b],[e.b,e.a]]){const j=a.nb.indexOf(b);if(j>=0)a.nb.splice(j,1);a.edgeTo?.delete(b)}synEdges.splice(i,1)}
  return {nodes,points,origin,radius,group};
 }
 function finish(nodes,fx){
  // Ordinary bodies and the same sparse bowed particle links as the world.
  for(const n of nodes){n.mob=0;n.vx=n.vy=n.vz=0;n.displaced=true;n.life=Math.max(n.life,900);delete n.reb;}
  for(let layer=0;layer<3;layer++){
   const shell=nodes.filter(n=>n.patternAnchor&&n.patternLayer===layer);
   if(shell.length&&shell[0].patternRing>=0){
    for(let ring=0;ring<3;ring++){const row=shell.filter(n=>n.patternRing===ring);for(let i=0;i<row.length;i++)synLink(row[i],row[(i+1)%row.length]);}
   }else for(const n of shell){
    const near=shell.filter(o=>o!==n).sort((a,b)=>synD2(n,a)-synD2(n,b));
    for(const o of near){if(n.nb.length>=2)break;if(o.nb.length>=2)continue;if(synD2(n,o)>700*700)break;synLink(n,o);}
   }
 }
 }
 function displace(actor,previous,t,dt){
  if(!enabled()||window.CarrierTutorial?.active()||synOrbit||synRebirthT>=0)return;
  const threshold=synMaxEnergy()*2/3,energy=Number(actor.energy)||0;
  if(energy<=threshold)return;
  const speed=Math.hypot(actor.vx,actor.vy,actor.vz);if(speed<45)return;
  const power=clamp((energy-threshold)/(synMaxEnergy()-threshold),0,1);
  const ux=actor.vx/speed,uy=actor.vy/speed,uz=actor.vz/speed,lead=Math.min(180,speed*.13);
  const end={x:actor.x+ux*lead,y:actor.y+uy*lead,z:actor.z+uz*lead};
  const sx=end.x-previous.x,sy=end.y-previous.y,sz=end.z-previous.z,len=sx*sx+sy*sy+sz*sz||1;
  for(const n of synNodes){
   if(n.patternAnchor||n.rad>=SYN_VORTEX_MIN_RADIUS||n.giant||n.reb||n.crushAt||n.tens||synQuestOwnsNode(n))continue;
   const q=clamp(((n.x-previous.x)*sx+(n.y-previous.y)*sy+(n.z-previous.z)*sz)/len,0,1);
   let dx=n.x-(previous.x+sx*q),dy=n.y-(previous.y+sy*q),dz=n.z-(previous.z+sz*q),distance=Math.hypot(dx,dy,dz);
   const reach=n.rad+75+power*120;if(distance>=reach)continue;
   if(distance<.01){dx=uz;dy=0;dz=-ux;if(Math.hypot(dx,dz)<.01){dx=1;dz=0}distance=Math.hypot(dx,dy,dz);}
   // Direct bounded displacement: there is no stored kick or spring to an old position.
   const shift=Math.min(reach-distance,(reach-distance)*(1-Math.exp(-Math.min(dt,.05)*(1.5+power*3))),Math.min(dt,.05)*(60+power*180));
   n.x+=dx/distance*shift;n.y+=dy/distance*shift;n.z+=dz/distance*shift;
   n.vx=n.vy=n.vz=0;n.displaced=true;
  }
 }
 function kinField(k,dt){
  const influence=synMatterInfluence(k.energy),near=[];
  for(const n of synNodes){if(n.rad>=SYN_VORTEX_MIN_RADIUS||n.giant)continue;const dx=n.x-k.x,dy=n.y-k.y,dz=n.z-k.z,d=Math.hypot(dx,dy,dz);if(d>1&&d<720)near.push({n,dx,dy,dz,d});}
  near.sort((a,b)=>a.d-b.d);let ax=0,ay=0,az=0;
  for(const F of near.slice(0,3)){const force=100*Math.min(5,F.n.pull)*(1-F.d/720)**2*influence;ax+=F.dx/F.d*force;ay+=F.dy/F.d*force;az+=F.dz/F.d*force;}
  const cap=Math.min(1,180*influence/Math.max(1,Math.hypot(ax,ay,az)));
  k.vx+=ax*cap*dt;k.vy+=ay*cap*dt;k.vz+=az*cap*dt;
 }
 window.CarrierExperiments={enabled,editing:()=>!editor.hidden,pattern,activePattern,prepare,finish,displace,kinField,generate,normalize,read};
 const library=$('carrierCollection'),tabs=document.createElement('nav');tabs.id='carrierCreationTabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Создание');tabs.innerHTML='<button type="button" role="tab" id="carrierLibraryTab" aria-selected="true" aria-controls="carrierCollection">Библиотека нодов</button><button type="button" role="tab" id="carrierRebirthTab" aria-selected="false" aria-controls="carrierPatternEditor">Редактор перерождения</button>';library.querySelector('header').after(tabs);$('carrierRebirthTab').onclick=open;
 const style=document.createElement('style');style.textContent=`
 #carrierExperimentSettings small{display:block;margin:10px 0}#carrierExperimentSettings label{display:flex;align-items:center;gap:10px}#carrierPatternOpen{width:100%;margin-top:8px}
 #carrierPatternOpen{display:none!important}
 html.carrierPatternOpen,html.carrierPatternOpen body{touch-action:pan-x pan-y} #carrierCreationTabs[hidden]{display:none!important}#carrierCreationTabs,.patternTabs{display:flex;gap:6px;flex:none;margin:0 0 14px}#carrierCreationTabs button,.patternTabs button{flex:1;min-height:44px;font-size:12px!important;padding:7px;touch-action:manipulation}#carrierCreationTabs [aria-selected=true],.patternTabs [aria-selected=true]{color:rgb(var(--hud-rgb))!important;border-color:rgb(var(--hud-rgb))!important;background:rgba(var(--hud-rgb),.12)!important}.patternTabs{padding:8px 14px;margin:0;border-bottom:1px solid #ffffff20}
 #carrierPatternEditor[hidden]{display:none!important}
 #carrierPatternEditor{position:fixed;z-index:160;inset:0;display:flex;flex-direction:column;box-sizing:border-box;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);background:#0b0e18;color:#e9edf4;font:clamp(14px,calc(13px * var(--carrier-ui-scale)),17px)/1.45 Onest,system-ui}
 #carrierPatternEditor *{box-sizing:border-box}#carrierPatternEditor header{padding:14px 20px;border-bottom:1px solid #ffffff20;display:flex;align-items:center;gap:16px;flex:none}#carrierPatternEditor h2{font-size:clamp(19px,3vw,27px);font-weight:500;margin:0}#carrierPatternEditor .patternWarning{color:#ddbd87;font-size:12px;margin:4px 0 0}#carrierPatternEditor header button{margin-left:auto;flex:none;width:44px;height:44px;display:grid;place-items:center;border-radius:50%}
 #carrierPatternEditor button,#carrierPatternEditor select{min-height:44px;padding:9px 12px;border:1px solid #ffffff25;border-radius:9px;background:#161d2b;color:inherit;font:inherit;cursor:pointer;touch-action:manipulation}#carrierPatternEditor button:hover{border-color:rgb(var(--hud-rgb))}#carrierPatternEditor :focus-visible{outline:2px solid rgb(var(--hud-rgb));outline-offset:2px}#carrierPatternEditor button[aria-pressed=true]{border-color:rgb(var(--hud-rgb));background:rgba(var(--hud-rgb),.14)}
 #carrierPatternEditor .patternBody{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,360px);min-height:0;flex:1}
 #carrierPatternEditor .patternScene{min-height:0;position:relative;overflow:hidden;background:radial-gradient(ellipse at 50% 55%,#1a2335,#090c15 72%)}
 #carrierPatternPreview{width:100%;height:100%;display:block;touch-action:none;cursor:grab}
 #carrierPatternEditor .patternPreviewBar{position:absolute;left:12px;right:12px;bottom:12px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center}#carrierPatternEditor .patternPreviewBar button{font-size:12px;background:#111927ed}
 #carrierPatternEditor .patternGuide{position:absolute;top:12px;left:12px;right:12px;text-align:center;color:#a9b6ca;font-size:12px;pointer-events:none}
 #carrierPatternEditor .patternControls{padding:18px;overflow-y:auto;overscroll-behavior:contain;border-left:1px solid #ffffff20;min-width:0;scrollbar-width:thin;touch-action:pan-x pan-y}
 #carrierPatternEditor .patternGroup{margin-bottom:18px}#carrierPatternEditor .patternGroup>label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}#carrierPatternEditor output{color:rgb(var(--hud-rgb));font-variant-numeric:tabular-nums;white-space:nowrap}
 #carrierPatternEditor input[type=range]{width:100%;height:32px;accent-color:rgb(var(--hud-rgb));margin:0;cursor:pointer}#carrierPatternEditor select{width:100%;min-width:0}#carrierPatternEditor .patternSegments{display:flex;gap:6px}#carrierPatternEditor .patternSegments button{flex:1;padding:8px 4px;font-size:13px}
 #carrierPatternEditor .patternNote{color:#9daac0;font-size:12px;margin:10px 0}#carrierPatternEditor .patternFooter{display:grid;gap:8px;padding-top:12px;border-top:1px solid #ffffff20}#carrierPatternApply{background:rgba(var(--hud-rgb),.18)!important;border-color:rgba(var(--hud-rgb),.65)!important}
 #carrierPatternEditor .patternActions{flex:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 14px;border-top:1px solid #ffffff20;background:#0b0e18}#carrierPatternEditor .patternActions button{font-size:13px;min-height:44px;padding:8px}
 #carrierPatternEditor .patternCards{display:flex;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;padding:3px 2px 10px;touch-action:pan-x pan-y;scrollbar-width:thin}
 #carrierPatternEditor .patternCard{width:100px;height:100px;flex:0 0 100px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;scroll-snap-align:start;padding:5px;font-size:11px;line-height:1.1;touch-action:pan-x pan-y}
 #carrierPatternEditor .patternCard svg{width:62px;height:62px;flex:none;fill:none;stroke:currentColor;stroke-width:1.1;pointer-events:none}#carrierPatternEditor .patternCard span{pointer-events:none}
 #carrierPatternEditor .patternHidden{display:none!important}
 @media(max-width:700px) and (orientation:portrait){#carrierPatternEditor header{padding:10px 14px}#carrierPatternEditor .patternBody{grid-template-columns:1fr;grid-template-rows:minmax(150px,29dvh) minmax(0,1fr)}#carrierPatternEditor .patternControls{border-left:0;border-top:1px solid #ffffff20;padding:14px}#carrierPatternEditor .patternPreviewBar{bottom:8px}#carrierPatternEditor .patternGroup{margin-bottom:14px}}
 @media(max-height:450px) and (orientation:landscape){#carrierPatternEditor header{padding:6px 12px}#carrierPatternEditor h2{font-size:18px}#carrierPatternEditor .patternWarning{font-size:11px}#carrierPatternEditor .patternBody{grid-template-columns:minmax(0,1fr) minmax(270px,46%)}#carrierPatternEditor .patternGuide{font-size:11px}}
 `;document.head.append(style);
 let draft=null,selected=0,pitch=-.25,yaw=.45,previewPoints=[],animation=0,animationStart=0,pointer=null;
 const fields=[['radius','Размер слоя',8,100,1,'%'],['relief','Рельеф фигуры',0,65,1,'%'],['turns','Витки спирали',1,10,1,''],['tilt','Наклон',-90,90,1,'°'],['yaw','Поворот',-180,180,1,'°'],['offset','Положение разреза',-80,80,1,'%'],['thickness','Толщина разреза',8,100,1,'%']];
 function updateSettings(){const on=enabled();tabs.hidden=!on;$('carrierPatternOpen').disabled=!on;$('carrierPatternOpen').textContent=read().use?'Изменить форму перерождения · Experimental':'Конструктор перерождений · Experimental';if(!on&&!editor.hidden)close();}
 function persist(){CarrierProgress.flush();updateSettings();}
 function commit(use){draft=normalize(draft);$('carrierPatternCount').value=String(draft.count);$('carrierPatternUse').value=use?'1':'0';draft.layers.forEach((l,i)=>Object.entries(l).forEach(([k,v])=>$('carrierPattern'+i+k).value=String(v)));persist();close();}
 const thumbs=new Map();
 function card(kind,id,label){
  const key=kind+id;let svg=thumbs.get(key);if(!svg){const config=normalize({count:1,layers:[{...defaults[0],shape:kind==='shape'?id:'none',layout:kind==='layout'?id:'dots',relief:45,thickness:24}]});const points=generate(config,90);
   svg='<svg viewBox="-1.3 -1.3 2.6 2.6" aria-hidden="true">'+points.map(p=>'<circle cx="'+(p.x+p.z*.24).toFixed(3)+'" cy="'+(p.y-p.z*.13).toFixed(3)+'" r=".024" fill="currentColor" stroke="none" opacity="'+(p.z>0?.42:.95)+'"/>').join('')+'</svg>';thumbs.set(key,svg);}
  return '<button type="button" class="patternCard" data-'+kind+'="'+id+'" aria-label="'+label+'" aria-pressed="false">'+svg+'<span>'+label+'</span></button>';
 }
 function controls(){
  const controls=$('carrierPatternControls');
  controls.innerHTML='<div class="patternGroup"><label>Слоёв пространства</label><div id="carrierPatternCounts" class="patternSegments">'+[1,2,3].map(n=>'<button type="button" data-count="'+n+'" aria-pressed="'+(draft.count===n)+'">'+n+'</button>').join('')+'</div></div><div class="patternGroup"><label>Редактируемый слой</label><div id="carrierPatternLayers" class="patternSegments">'+Array.from({length:draft.count},(_,i)=>'<button type="button" data-layer="'+i+'" aria-pressed="'+(selected===i)+'">'+(draft.count===2?['Внешний','Внутренний']:['Внешний','Средний','Внутренний'])[i]+'</button>').join('')+'</div></div>'+
  '<div class="patternGroup"><label>Фигура · листай вбок</label><div id="patternShapes" class="patternCards" role="group" aria-label="Фигуры">'+[['none','Сфера'],...shapes].map(([id,label])=>card('shape',id,label)).join('')+'</div></div>'+
  '<div class="patternGroup"><label>Расположение и разрез</label><div id="patternLayouts" class="patternCards" role="group" aria-label="Расположение нодов">'+[['dots','Точки'],['spiral','Спираль'],['slice','Разрез']].map(([id,label])=>card('layout',id,label)).join('')+'</div></div>'+
  fields.map(([key,label,min,max,step,unit])=>'<div class="patternGroup" data-field="'+key+'"><label for="pattern-'+key+'">'+label+'<output id="pattern-'+key+'-value"></output></label><input id="pattern-'+key+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" data-property="'+key+'"></div>').join('')+
  '<p class="patternNote">Перетащи сферу, чтобы осмотреть объём. Форма применяется к обычному, заряженному и высшему перерождению. Число нодов зависит от самого перерождения.</p><div class="patternFooter"><button type="button" id="carrierPatternReset">Сбросить настройки конструктора</button><p class="patternNote">Предпросмотр бесплатный. ENRG и заряд сейчас не расходуются.</p></div>';
  controls.querySelectorAll('[data-count]').forEach(b=>b.onclick=()=>{draft.count=+b.dataset.count;selected=Math.min(selected,draft.count-1);controlsRender()});
  controls.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{selected=+b.dataset.layer;controlsRender()});
  controls.querySelectorAll('[data-property]').forEach(input=>input.oninput=()=>{draft.layers[selected][input.dataset.property]=+input.value;draft=normalize(draft);syncFields();refresh()});
  controls.querySelectorAll('[data-shape]').forEach(b=>b.onclick=()=>{draft.layers[selected].shape=b.dataset.shape;syncFields();refresh()});
  controls.querySelectorAll('[data-layout]').forEach(b=>b.onclick=()=>{draft.layers[selected].layout=b.dataset.layout;syncFields();refresh()});
  $('carrierPatternApply').onclick=()=>commit(true);$('carrierPatternOrdinary').onclick=()=>commit(false);
  $('carrierPatternReset').onclick=()=>{draft=normalize({count:1,layers:defaults});selected=0;controlsRender()};syncFields();
 }
 function syncFields(){const L=draft.layers[selected];
  editor.querySelectorAll('[data-shape]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shape===L.shape)));
  editor.querySelectorAll('[data-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layout===L.layout)));
  for(const [key,label,min,max,step,unit] of fields){const input=$('pattern-'+key);input.value=String(L[key]);$('pattern-'+key+'-value').textContent=Math.round(L[key])+unit;input.closest('.patternGroup').classList.toggle('patternHidden',key==='turns'?L.layout!=='spiral':['offset','thickness'].includes(key)?L.layout!=='slice':false);}
  $('pattern-radius').min=String([40,20,8][selected]);
 }
 function controlsRender(){draft=normalize(draft);controls();refresh();for(const id of ['patternShapes','patternLayouts']){const strip=$(id),active=strip.querySelector('[aria-pressed=true]');if(active)strip.scrollLeft=active.offsetLeft-strip.offsetLeft-8;}}
 function refresh(){previewPoints=generate(draft,Math.max(144,draft.count*96));draw();}
 function project(p,w,h){const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),x=p.x*cy+p.z*sy,z=p.z*cy-p.x*sy,y=p.y*cp-z*sp,depth=z*cp+p.y*sp,scale=Math.min(w,h)*.32/(1+depth*.2);return{x:w/2+x*scale,y:h*.49+y*scale,z:depth};}
 function draw(stamp=performance.now()){
  if(editor.hidden)return;const canvas=$('carrierPatternPreview'),rect=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
  if(!rect.width||!rect.height)return;if(canvas.width!==Math.round(rect.width*dpr)||canvas.height!==Math.round(rect.height*dpr)){canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr)}
  const ctx=canvas.getContext('2d'),w=rect.width,h=rect.height;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const age=animationStart?(stamp-animationStart)/2400:1,u=clamp(age,0,1),merge=u*u*(3-2*u);
  const colors=['#b7ccff','#dfb9ec','#a3dfcb'];
  if(!animationStart)for(let layer=0;layer<draft.count;layer++){if(!silhouette.has(draft.layers[layer].shape)||draft.layers[layer].layout==='spiral')continue;for(let ring=0;ring<3;ring++){const row=previewPoints.filter(p=>p.layer===layer&&p.ring===ring);ctx.strokeStyle=colors[layer];ctx.globalAlpha=layer===selected?.4:.18;ctx.lineWidth=1;ctx.beginPath();row.forEach((p,i)=>{const q=project(p,w,h);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y)});ctx.closePath();ctx.stroke();}}
  const points=previewPoints.map((p,i)=>{const spread=animationStart?1+Math.sin(u*Math.PI)*.8:1,noise=animationStart?(1-merge)*.45:0;return{...project({x:p.x*spread+Math.sin(i*3.7)*noise,y:p.y*spread+Math.cos(i*2.3)*noise,z:p.z*spread+Math.sin(i*1.9)*noise},w,h),layer:p.layer}}).sort((a,b)=>b.z-a.z);
  for(const p of points){ctx.globalAlpha=(p.layer===selected?.95:.6)*(p.z>0?.5:1);ctx.fillStyle=colors[p.layer];ctx.beginPath();ctx.arc(p.x,p.y,(p.layer===selected?2.6:2)/(1+p.z*.18),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  if(animationStart&&u<1)animation=requestAnimationFrame(draw);else{animationStart=0;animation=0;$('carrierPatternAnimate').textContent='Предпросмотр перерождения';}
 }
 function close(){if(editor.hidden)return;document.documentElement.classList.remove("carrierPatternOpen");cancelAnimationFrame(animation);animation=0;animationStart=0;editor.hidden=true;editor.classList.remove('on');draft=null;$('carrierCollectionButton').click();$('carrierRebirthTab').focus({preventScroll:true});}
 function open(){if(!enabled()||window.CarrierTutorial?.active()||window.CarrierLife?.busy())return;
  CarrierProgress.resetInput();synKeys.w=synKeys.a=synKeys.s=synKeys.d=false;synCharging=false;synShotHeld=false;document.exitPointerLock?.();
  document.documentElement.classList.add("carrierPatternOpen");draft=read();selected=0;pitch=-.25;yaw=.45;editor.hidden=false;editor.classList.add('on');$('carrierSettings').classList.remove('on');library.classList.remove('on');
  editor.innerHTML='<header><div><h2 id="carrierPatternTitle">Конструктор перерождения</h2><p class="patternWarning">Experimental · не рекомендуется для обычного прохождения в этой версии.</p></div><button type="button" id="carrierPatternClose" aria-label="Закрыть без применения">'+CarrierIcons.svg('close')+'</button></header><nav class="patternTabs" role="tablist" aria-label="Создание"><button type="button" role="tab" id="carrierPatternLibraryTab" aria-selected="false" aria-controls="carrierCollection">Библиотека нодов</button><button type="button" role="tab" aria-selected="true" aria-controls="carrierPatternEditor">Редактор перерождения</button></nav><div class="patternBody"><div class="patternScene"><div class="patternGuide">До трёх вложенных слоёв · поворот пальцем или мышью</div><canvas id="carrierPatternPreview" aria-label="Объёмный предпросмотр формы перерождения"></canvas><div class="patternPreviewBar"><button type="button" id="carrierPatternAnimate">Предпросмотр перерождения</button><button type="button" id="carrierPatternView">Сбросить ракурс</button></div></div><div id="carrierPatternControls" class="patternControls"></div></div><footer class="patternActions"><button type="button" id="carrierPatternOrdinary">Обычная форма</button><button type="button" id="carrierPatternApply">Использовать форму</button></footer>';
  $('carrierPatternClose').onclick=close;$('carrierPatternLibraryTab').onclick=close;$('carrierPatternView').onclick=()=>{pitch=-.25;yaw=.45;draw()};
  $('carrierPatternAnimate').onclick=()=>{cancelAnimationFrame(animation);animationStart=performance.now();$('carrierPatternAnimate').textContent='Перерождение…';draw()};
  const canvas=$('carrierPatternPreview');canvas.onpointerdown=e=>{e.stopPropagation();pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=e=>{if(!pointer||e.pointerId!==pointer.id)return;e.stopPropagation();yaw+=(e.clientX-pointer.x)*.009;pitch=clamp(pitch+(e.clientY-pointer.y)*.009,-1.45,1.45);pointer.x=e.clientX;pointer.y=e.clientY;if(!animation)draw()};
  canvas.onpointerup=canvas.onpointercancel=()=>{pointer=null};controlsRender();$('carrierPatternClose').focus({preventScroll:true});
 }
 editor.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();return}if(e.key!=='Tab')return;const list=[...editor.querySelectorAll('button,select,input')].filter(el=>el.getClientRects().length&&!el.disabled),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
 // Some Android WebViews omit the compatibility click after a canvas gesture.
 // Activate a stationary touch on release and suppress only its duplicate native click.
 let buttonTouch=null,lastTouchButton=null,lastTouchAt=0;
 editor.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const b=e.target.closest('button');buttonTouch=b&&!b.disabled?{button:b,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}:null;});
 editor.addEventListener('pointermove',e=>{if(buttonTouch?.id===e.pointerId&&Math.hypot(e.clientX-buttonTouch.x,e.clientY-buttonTouch.y)>9)buttonTouch.moved=true;});
 editor.addEventListener('pointercancel',()=>{buttonTouch=null;});
 editor.addEventListener('pointerup',e=>{const touch=buttonTouch;buttonTouch=null;if(!touch||touch.id!==e.pointerId||touch.moved||e.target.closest('button')!==touch.button)return;lastTouchButton=touch.button;lastTouchAt=performance.now();e.preventDefault();touch.button.click();});
 editor.addEventListener('click',e=>{if(e.isTrusted&&e.pointerType==='touch'&&e.target.closest('button')===lastTouchButton&&performance.now()-lastTouchAt<600){e.preventDefault();e.stopImmediatePropagation();}},true);
 new ResizeObserver(()=>{if(!editor.hidden&&!animation)draw()}).observe(editor);
 $('carrierExperimentsEnabled').addEventListener('input',()=>{updateSettings();persist()});$('carrierPatternOpen').onclick=open;updateSettings();
})();
