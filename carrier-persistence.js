/* Carrier persistence boundary. No DOM, game objects or Android bridge here. */
(function(root){
  'use strict';
  let build;
  try{build=JSON.parse(root.document?.getElementById('carrierBuildMetadata')?.textContent||'');}
  catch(_){build={name:'source',code:0,channel:'development',saveSchema:1,settingsSchema:1,
    builtAt:null,commit:null,mode:'development'};}
  const APP_VERSION=Object.freeze(build);
  const SAVE_SCHEMA_VERSION=APP_VERSION.saveSchema;
  const SETTINGS_SCHEMA_VERSION=APP_VERSION.settingsSchema;
  const SKILL_IDS=Object.freeze(['PERCEPTION','RECALL','ASSOCIATION','FOCUS','REBIRTH','REACH','MOMENTUM','CAPACITY','DAMAGE']);
  const STORY_FIGHT_IDS=Object.freeze(['ambush_reflections','monochrome_polygon','interception']);
  const BOSS_IDS=Object.freeze(['boss_1','boss_2']);
  const SAVE_KEYS=Object.freeze({auto:'carrier.progress.auto.v1',slot:i=>`carrier.progress.slot.${i}.v1`,
    settings:'carrier.preferences.v1',resolution:'carrierRenderWidth',links:'carrierModLinks'});
  const deepFreeze=o=>{
    if(o&&typeof o==='object'&&!Object.isFrozen(o)){
      Object.values(o).forEach(deepFreeze);Object.freeze(o);
    }
    return o;
  };
  const DEFAULT_SAVE=deepFreeze({schemaVersion:1,
    meta:{createdAt:0,updatedAt:0,gameVersion:'',reason:'new'},
    progress:{deliveries:0,arenaWins:0,storyFights:{},bosses:{},quest:null,nextIn:25,
      chain:null,finalPhase:0,finalIn:0,finalText:''},
    player:{camera:{x:0,y:0,z:0},velocity:{x:0,y:0,z:0},rotX:0,rotY:0,
      points:7,rebirths:0,speedGain:0,ultCharge:0,ammo:0,commitment:0,rebirthHue:0,rebirthSkew:0},
    world:{seed:1,worldSeed:0,orbitReservoir:[],places:[],islands:[],innerStates:[],domainEra:0},
    progression:{skills:{},skillPoints:0,xp:0,rewardedSites:[],creation:null},tutorial:{hints:[]}});
  const DEFAULT_SETTINGS=deepFreeze({schemaVersion:1,graphics:{inputs:{},resolution:'native',
    preset:'custom',qualityCap:1,dynamicColor:false,fpsLimit:60},audio:{volume:60,bands:[],links:[]},
    accessibility:{brightness:55},gameplay:{firstPerson:false},diagnostics:{profiler:false}});
  const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const finite=(v,d,min=-1e9,max=1e9)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):d;
  const point=(v,d=DEFAULT_SAVE.player.camera)=>({x:finite(v?.x,d.x),y:finite(v?.y,d.y),z:finite(v?.z,d.z)});
  const fields=(v,names)=>Object.fromEntries(names.filter(k=>v?.[k]!==undefined).map(k=>[k,v[k]]));
  const clone=v=>JSON.parse(JSON.stringify(v));
  function legacySaveV1(raw){
    if(!obj(raw)||raw.version!==1||!obj(raw.state)||!Number.isFinite(raw.state.deliveries))
      throw new Error('Unsupported legacy save');
    const s=raw.state;
    const skills=Object.fromEntries(SKILL_IDS.map((id,i)=>[id,s.abilities?.[i]||0]));
    const storyFights=Object.fromEntries(STORY_FIGHT_IDS.map((id,i)=>[id,s.storyFightsDone?.[i]===true]));
    const bosses=Object.fromEntries(BOSS_IDS.map((id,i)=>[id,s.bossStages?.[i]||
      (i===0?{at:s.bossAt,cleared:s.bossCleared,position:s.bossPosition,hp:s.bossHP,maxHp:10}:null)]));
    const timestamp=finite(raw.savedAt,Date.now(),0,9e15);
    return {schemaVersion:1,meta:{createdAt:timestamp,updatedAt:timestamp,
      gameVersion:'legacy-v1',reason:String(raw.reason||'legacy').slice(0,40)},
      progress:{...fields(s,['deliveries','arenaWins','quest','nextIn','chain','finalPhase','finalIn','finalText']),
        storyFights,bosses},
      player:fields(s,['camera','velocity','rotX','rotY','points','rebirths','speedGain',
        'ultCharge','ammo','commitment','rebirthHue','rebirthSkew']),
      world:fields(s,['seed','worldSeed','orbitReservoir','places','islands','innerStates','domainEra']),
      progression:{skills,...fields(s,['skillPoints','creation'])},tutorial:{hints:s.hints}};
  }
  // Add 1: migrateSaveV1ToV2 here when the schema really changes.
  const saveMigrations=Object.freeze({});
  function migrateSave(input){
    let s=input;
    if(obj(s)&&s.schemaVersion===undefined)s=legacySaveV1(s);
    if(!obj(s)||!Number.isInteger(s.schemaVersion)||s.schemaVersion<1)
      throw new Error('Invalid save schema');
    if(s.schemaVersion>SAVE_SCHEMA_VERSION)throw new Error('Save belongs to a newer Carrier');
    while(s.schemaVersion<SAVE_SCHEMA_VERSION){
      const migrate=saveMigrations[s.schemaVersion];
      if(typeof migrate!=='function')throw new Error(`Missing migration from save schema ${s.schemaVersion}`);
      const next=migrate(clone(s));
      if(!obj(next)||next.schemaVersion!==s.schemaVersion+1)throw new Error('Migration did not advance schema');
      s=next;
    }
    return s;
  }
  function sideActivity(raw){
    const r=obj(raw)?raw:{},e=r.event;
    if(!obj(e)||!['fort','rival','wreck'].includes(e.type)||!['offer','battle','pickup','delivery'].includes(e.phase))return {order:finite(r.order,0,0,100000)|0,event:null};
    const roles=['core','guard0','guard1','rival','escort0','escort1'];
    return {order:finite(r.order,0,0,100000)|0,event:{type:e.type,phase:e.phase,at:point(e.at),destination:point(e.destination),remaining:finite(e.remaining,240,0,300),left:[...new Set(Array.isArray(e.left)?e.left.filter(v=>roles.includes(v)):[])].slice(0,3),actors:Array.isArray(e.actors)?e.actors.filter(a=>obj(a)&&roles.includes(a.role)).slice(0,3).map(a=>({role:a.role,kind:a.kind==='warrior'?'warrior':'casual',hp:finite(a.hp,3,.01,12),...point(a),vx:finite(a.vx,0,-1500,1500),vy:finite(a.vy,0,-1500,1500),vz:finite(a.vz,0,-1500,1500)})):[]}};
  }
  function validateSave(input){
    const s=migrateSave(input);
    if(!obj(s.progress)||!Number.isFinite(s.progress.deliveries)||s.progress.deliveries<0||
       !obj(s.player)||!obj(s.player.camera)||
       !['x','y','z'].every(k=>Number.isFinite(s.player.camera[k]))||
       !obj(s.world)||!Number.isFinite(s.world.seed))throw new Error('Incomplete save');
    const d=DEFAULT_SAVE,p=s.progress,w=s.world,a=s.player,g=s.progression||{},t=s.tutorial||{};
    return {schemaVersion:SAVE_SCHEMA_VERSION,
      meta:{createdAt:finite(s.meta?.createdAt,Date.now(),0,9e15),
        updatedAt:finite(s.meta?.updatedAt,Date.now(),0,9e15),
        gameVersion:typeof s.meta?.gameVersion==='string'?s.meta.gameVersion.slice(0,80):'unknown',
        reason:typeof s.meta?.reason==='string'?s.meta.reason.slice(0,40):'progress'},
      progress:{...d.progress,...(p.sideActivity===undefined?{}:{sideActivity:sideActivity(p.sideActivity)}),...fields(p,['quest','chain','nextIn','finalIn','finalText']),
        deliveries:finite(p.deliveries,0,0,100000)|0,arenaWins:finite(p.arenaWins,0,0,10000)|0,
        finalPhase:finite(p.finalPhase,0,0,5)|0,
        storyFights:Object.fromEntries(STORY_FIGHT_IDS.map(id=>[id,p.storyFights?.[id]===true])),
        bosses:Object.fromEntries(BOSS_IDS.map(id=>[id,obj(p.bosses?.[id])?p.bosses[id]:null]))},
      player:{...d.player,...fields(a,['rotX','rotY','points','rebirths','speedGain','ultCharge','ammo',
        'commitment','rebirthHue','rebirthSkew']),camera:point(a.camera),velocity:point(a.velocity)},
      world:{...d.world,...fields(w,['seed','worldSeed','domainEra']),
        orbitReservoir:Array.isArray(w.orbitReservoir)?w.orbitReservoir.slice(-120):[],
        places:Array.isArray(w.places)?w.places.slice(-100):[],
        islands:Array.isArray(w.islands)?w.islands.slice(-200):[],
        innerStates:Array.isArray(w.innerStates)?w.innerStates.slice(-300):[]},
      progression:{skills:Object.fromEntries(SKILL_IDS.map(id=>[id,finite(g.skills?.[id],0,0,100)|0])),
        ...(g.skillPoints===undefined?{}:{skillPoints:finite(g.skillPoints,0,0,1000)|0}),
        ...(g.peakLevel===undefined?{}:{peakLevel:finite(g.peakLevel,1,1,1100)|0}),
        xp:finite(g.xp,0,0,0.999999),
        rewardedSites:Array.isArray(g.rewardedSites)
          ?[...new Set(g.rewardedSites.filter(id=>typeof id==='string'&&id.length<100))].slice(-2500):[],
        creation:obj(g.creation)?g.creation:null},
      tutorial:{hints:Array.isArray(t.hints)?t.hints.filter(id=>typeof id==='string').slice(0,50):[]}};
  }
  function defaultSettings(context={}){
    const d=clone(DEFAULT_SETTINGS);
    d.graphics.inputs={...(context.inputs||{})};
    d.graphics.resolution=context.resolution||'native';
    d.graphics.qualityCap=finite(context.qualityCap,1,.35,1);
    d.graphics.fpsLimit=context.fpsLimit===undefined?60:context.fpsLimit;
    d.audio.bands=Array.isArray(context.bands)?context.bands:[];
    d.audio.links=Array.isArray(context.links)?context.links:[];
    d.gameplay.firstPerson=!!context.firstPerson;
    return d;
  }
  function legacySettingsV1(raw){
    if(!obj(raw)||raw.version!==1)throw new Error('Unsupported legacy settings');
    const inputs=obj(raw.inputs)?raw.inputs:{};
    return {schemaVersion:1,graphics:{inputs,resolution:raw.resolution,preset:raw.preset,
      qualityCap:raw.qualityCap,dynamicColor:raw.dynamicColor,fpsLimit:raw.fpsLimit},
      audio:{volume:inputs.carrierSfxVolume,bands:raw.bands,links:raw.links},
      accessibility:{brightness:inputs.carrierBrightness},gameplay:{firstPerson:raw.firstPerson},
      diagnostics:{profiler:raw.profiler}};
  }
  const settingsMigrations=Object.freeze({});
  function validateSettings(input,defaults){
    let s=input;
    if(obj(s)&&s.schemaVersion===undefined)s=legacySettingsV1(s);
    if(!obj(s)||!Number.isInteger(s.schemaVersion)||s.schemaVersion<1||
       s.schemaVersion>SETTINGS_SCHEMA_VERSION)throw new Error('Unsupported settings schema');
    while(s.schemaVersion<SETTINGS_SCHEMA_VERSION){
      const migrate=settingsMigrations[s.schemaVersion];
      if(typeof migrate!=='function')throw new Error(`Missing settings migration ${s.schemaVersion}`);
      const next=migrate(clone(s));
      if(next?.schemaVersion!==s.schemaVersion+1)throw new Error('Invalid settings migration');
      s=next;
    }
    const d=defaults||defaultSettings(),validInputs={...d.graphics.inputs};
    for(const [id,value] of Object.entries(s.graphics?.inputs||{})){
      if(Object.prototype.hasOwnProperty.call(validInputs,id)&&typeof value==='string'&&value.length<80)validInputs[id]=value;
    }
    return {schemaVersion:SETTINGS_SCHEMA_VERSION,
      graphics:{...d.graphics,inputs:validInputs,
        resolution:['800','960','1280','1600','1920','native'].includes(s.graphics?.resolution)
          ?s.graphics.resolution:d.graphics.resolution,
        preset:typeof s.graphics?.preset==='string'?s.graphics.preset:d.graphics.preset,
        qualityCap:finite(s.graphics?.qualityCap,d.graphics.qualityCap,.35,1),
        dynamicColor:typeof s.graphics?.dynamicColor==='boolean'?s.graphics.dynamicColor:d.graphics.dynamicColor,
        fpsLimit:[0,40,60,120].includes(s.graphics?.fpsLimit)?s.graphics.fpsLimit:d.graphics.fpsLimit},
      audio:{volume:finite(Number(s.audio?.volume),d.audio.volume,0,100),
        bands:Array.isArray(s.audio?.bands)?s.audio.bands.slice(0,6):d.audio.bands,
        links:Array.isArray(s.audio?.links)?s.audio.links.slice(0,100):d.audio.links},
      accessibility:{brightness:finite(Number(s.accessibility?.brightness),d.accessibility.brightness,1,100)},
      gameplay:{firstPerson:typeof s.gameplay?.firstPerson==='boolean'?s.gameplay.firstPerson:d.gameplay.firstPerson},
      diagnostics:{profiler:APP_VERSION.mode==='development'&&s.diagnostics?.profiler===true}};
  }
  function createStorage(area){
    // An unknown future schema is not damaged JSON. Protect every recovery
    // candidate before any write, including writes made without a prior load.
    // Locks last for this page session; a fresh page rechecks the stored data.
    const blocked=new Map();
    function compatibilityError(key,schema,supported){
      const err=new Error(`Carrier storage ${key} uses schema ${schema}; supported ${supported}. Original data kept; writing disabled.`);
      err.name='CarrierStorageCompatibilityError';err.code='CARRIER_STORAGE_NEWER_SCHEMA';
      err.key=key;err.schemaVersion=schema;err.supportedSchema=supported;
      return err;
    }
    function assertCompatible(key){
      if(blocked.has(key))throw blocked.get(key);
      const supported=key===SAVE_KEYS.settings?SETTINGS_SCHEMA_VERSION:SAVE_SCHEMA_VERSION;
      for(const candidate of [key,`${key}.bak`,`${key}.tmp`]){
        // Read errors must also stop a write: unreadable is not the same as empty.
        const raw=area.getItem(candidate);if(raw===null)continue;
        let data;try{data=JSON.parse(raw)}catch(_){continue}
        if(Number.isInteger(data?.schemaVersion)&&data.schemaVersion>supported){
          const err=compatibilityError(key,data.schemaVersion,supported);
          blocked.set(key,err);throw err;
        }
      }
    }
    const rawGet=key=>{try{return area.getItem(key)}catch(err){console.warn('Carrier storage read',key,err);return null}};
    const preserve=(key,raw)=>{if(raw!==null)try{
      if(area.getItem(`${key}.corrupt`)===null)area.setItem(`${key}.corrupt`,raw);
    }catch(_){}};
    function read(key,validate){
      try{assertCompatible(key)}catch(err){
        if(err.code!=='CARRIER_STORAGE_NEWER_SCHEMA')throw err;
        console.warn('Carrier storage protected',err);return null;
      }
      for(const candidate of [key,`${key}.bak`,`${key}.tmp`]){
        const raw=rawGet(candidate);if(raw===null)continue;
        try{return validate(JSON.parse(raw))}
        catch(err){console.warn('Carrier storage damaged',candidate,err);if(candidate===key)preserve(key,raw)}
      }
      return null;
    }
    function write(key,data,validate){
      assertCompatible(key);
      const clean=validate(data),encoded=JSON.stringify(clean),tmp=`${key}.tmp`;
      area.setItem(tmp,encoded);
      validate(JSON.parse(area.getItem(tmp)));
      const previous=rawGet(key);
      if(previous!==null){
        try{validate(JSON.parse(previous));area.setItem(`${key}.bak`,previous)}
        catch(err){console.warn('Keeping damaged primary before new write',key,err);preserve(key,previous)}
      }
      area.setItem(key,encoded);
      validate(JSON.parse(area.getItem(key)));
      area.removeItem(tmp);
      return clean;
    }
    const keyFor=slot=>slot===0||slot==='auto'?SAVE_KEYS.auto:
      Number.isInteger(slot)&&slot>=1&&slot<=3?SAVE_KEYS.slot(slot):null;
    return Object.freeze({
      loadSave(slot){const key=keyFor(slot);return key?read(key,validateSave):null},
      saveGame(slot,data){const key=keyFor(slot);if(!key)throw new Error('Invalid save slot');
        const previous=read(key,validateSave);
        const next=previous?{...data,meta:{...data.meta,createdAt:previous.meta.createdAt}}:data;
        return write(key,next,validateSave)},
      deleteSave(slot){const key=keyFor(slot);if(!key||key===SAVE_KEYS.auto)throw new Error('Invalid manual slot');
        assertCompatible(key);
        area.removeItem(key);area.removeItem(`${key}.tmp`);area.removeItem(`${key}.bak`)},
      loadSettings(defaults){return read(SAVE_KEYS.settings,s=>validateSettings(s,defaults))||defaults},
      saveSettings(data,defaults){return write(SAVE_KEYS.settings,data,s=>validateSettings(s,defaults))},
      loadBootResolution(fallback){const v=rawGet(SAVE_KEYS.resolution);return v||fallback},
      loadLegacyLinks(){const raw=rawGet(SAVE_KEYS.links);if(!raw)return null;
        try{return JSON.parse(raw)}catch(err){console.warn('Legacy band links damaged',err);preserve(SAVE_KEYS.links,raw);return null}},
      saveBootResolution(value){assertCompatible(SAVE_KEYS.settings);area.setItem(SAVE_KEYS.resolution,value)},
      saveLegacyLinks(links){assertCompatible(SAVE_KEYS.settings);area.setItem(SAVE_KEYS.links,JSON.stringify(links))}
    });
  }
  const Storage=createStorage(root.localStorage);
  root.CarrierPersistence=Object.freeze({APP_VERSION,SAVE_SCHEMA_VERSION,SETTINGS_SCHEMA_VERSION,
    DEFAULT_SAVE,DEFAULT_SETTINGS,SKILL_IDS,STORY_FIGHT_IDS,BOSS_IDS,
    saveMigrations,settingsMigrations,legacySaveV1,validateSave,validateSettings,
    defaultSettings,createStorage,Storage});
  root.APP_VERSION=APP_VERSION;
})(typeof window!=='undefined'?window:globalThis);
