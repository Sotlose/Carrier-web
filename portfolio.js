(()=>{
 const touch=matchMedia('(pointer:coarse)').matches&&navigator.maxTouchPoints>0,entry=touch?'touch.html':'desktop.html';
 document.getElementById('play').href=entry+'?visit=1';document.getElementById('training').href=entry+'?training=1';
 if(touch)document.getElementById('control-list').innerHTML='<div><span>Слева</span><span>Стик: движение</span></div><div><span>Справа</span><span>Обзор и выстрел</span></div><div><span>Двойное касание</span><span>Прицельный вид</span></div><div><span>Обучение</span><span>Жесты и перерождения</span></div><div><span>Удобнее играть</span><span>В горизонтальном положении</span></div>';
 const canvas=document.getElementById('space'),ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion:reduce)'),points=[];
 for(let i=0;i<1250;i++){const y=1-2*(i+.5)/1250,a=i*2.3999632,r=Math.sqrt(1-y*y),pulse=1+.075*Math.sin(a*5+y*7);points.push([Math.cos(a)*r*pulse,y*.94,Math.sin(a)*r*pulse]);}
 let width=0,height=0,visible=true,last=-1;const resize=()=>{const b=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);width=b.width;height=b.height;canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);last=-1;};resize();addEventListener('resize',resize);new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(canvas);
 function draw(ms){requestAnimationFrame(draw);if(!visible||document.hidden||ms-last<33)return;if(reduced.matches&&last>=0)return;last=ms;ctx.clearRect(0,0,width,height);const t=reduced.matches?0:ms*.00009,c=Math.cos(t),s=Math.sin(t),radius=Math.min(width*.39,height*.37),cx=width*.5,cy=height*.5;const sorted=points.map(([x,y,z])=>[x*c-z*s,y,z*c+x*s]).sort((a,b)=>b[2]-a[2]);for(const [x,y,z]of sorted){const d=1/(1+z*.23),r=(.55+.6*(1-z)*.5)*d,ink=Math.max(.12,.72-z*.40);ctx.fillStyle='rgba(169,218,184,'+ink+')';ctx.beginPath();ctx.arc(cx+x*radius*d,cy+y*radius*d,r,0,Math.PI*2);ctx.fill();}}
 requestAnimationFrame(draw);
})();
