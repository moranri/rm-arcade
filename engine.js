/* RM Arcade. Pure game models: no DOM, network, timers, or animation loops here.
   update(dt) uses seconds, so gameplay is independent of display refresh rate. */
(function(root){
  'use strict';
  const W=900,H=600, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
  function scores(raw){try{const a=JSON.parse(raw);if(!Array.isArray(a))return[];return a.filter(x=>x&&Number.isFinite(x.score)&&x.score>=0&&typeof x.name==='string').map(x=>({name:x.name.replace(/[^A-Z0-9]/gi,'').slice(0,3).toUpperCase()||'RM',score:Math.floor(x.score)})).sort((a,b)=>b.score-a.score).slice(0,5);}catch{return[];}}
  function addScore(list,name,score){return scores(JSON.stringify([...list,{name,score}]));}
  class Base{
    constructor(random=Math.random){this.random=random;this.state='ready';this.score=0;this.time=0;this.message='';this.events=[];}
    begin(){this.state='playing';}
    pause(){if(this.state==='playing')this.state='paused';else if(this.state==='paused')this.state='playing';}
    end(win=false){this.state=win?'won':'over';}
    event(type){this.events.push(type);}
    tick(dt){if(this.state!=='playing')return false;this.time+=dt;return true;}
  }
  class Shooter extends Base{
    constructor(random){super(random);this.player={x:426,y:510,w:48,h:48,fuel:100,shield:0,rapid:0,cooldown:0};this.bullets=[];this.enemies=[];this.shots=[];this.pickups=[];this.spawn=0.6;this.drop=5;this.boss=null;this.bossTriggered=false;this.kills=0;}
    collect(type){if(type==='fuel')this.player.fuel=Math.min(100,this.player.fuel+40);if(type==='shield')this.player.shield=5;if(type==='rapid')this.player.rapid=8;this.event('power');}
    triggerBoss(){if(this.bossTriggered)return;this.enemies=[];this.shots=[];this.bossTriggered=true;this.boss={x:375,y:60,w:150,h:65,hp:32,maxHp:32,attack:1,phase:0};this.message='The Warden has arrived. Keep moving.';}
    update(dt,input={}){
      if(!this.tick(dt))return;
      const p=this.player;
      p.x=clamp(p.x+((input.right?1:0)-(input.left?1:0))*390*dt,0,W-p.w);
      p.fuel=Math.max(0,p.fuel-1.65*dt);p.shield=Math.max(0,p.shield-dt);p.rapid=Math.max(0,p.rapid-dt);p.cooldown-=dt;
      if(input.fire&&p.cooldown<=0){this.bullets.push({x:p.x+21,y:p.y-12,w:6,h:20});p.cooldown=p.rapid>0?.09:.26;this.event('shoot');}
      for(const b of this.bullets)b.y-=650*dt;
      this.bullets=this.bullets.filter(b=>b.y>-30);
      if(this.score>=1000&&!this.bossTriggered)this.triggerBoss();
      if(this.boss){
        const b=this.boss;b.x=375+280*Math.sin(this.time*.85);b.y=64+23*Math.sin(this.time*1.5);b.attack-=dt;
        if(b.attack<=0){b.phase++;b.attack=b.hp<16?.7:1.15;const cx=b.x+b.w/2,cy=b.y+b.h;
          if(b.phase%2){for(const vx of [-140,0,140])this.shots.push({x:cx,y:cy,w:10,h:16,vx,vy:210});}
          else{const dx=p.x+24-cx,dy=p.y-cy,l=Math.hypot(dx,dy);this.shots.push({x:cx,y:cy,w:14,h:14,vx:dx/l*285,vy:dy/l*285});}
        }
      }else if(!this.bossTriggered){
        this.spawn-=dt;if(this.spawn<=0){let r=this.random();this.enemies.push({type:r<.55?'rock':r<.82?'chaser':'dodger',x:40+this.random()*760,y:-55,w:42,h:42,speed:80+this.random()*70});this.spawn=Math.max(.3,.9-this.score/2300);}
      }
      for(const e of this.enemies){e.y+=e.speed*dt;if(e.type==='chaser')e.x+=Math.sign(p.x-e.x)*60*dt;if(e.type==='dodger'){const b=this.bullets.find(b=>Math.hypot(b.x-e.x,b.y-e.y)<150);if(b)e.x+=Math.sign(e.x-b.x||1)*135*dt;}e.x=clamp(e.x,0,W-e.w);}
      this.drop-=dt;if(this.drop<=0){this.pickups.push({x:50+this.random()*780,y:-30,w:30,h:30,type:['rapid','shield','fuel'][Math.floor(this.random()*3)]});this.drop=5+this.random()*2;}
      for(const d of this.pickups)d.y+=135*dt;
      for(const b of this.bullets){
        if(this.boss&&hit(b,this.boss)){b.dead=true;this.boss.hp--;this.event('hit');continue;}
        const e=this.enemies.find(e=>!e.dead&&hit(b,e));if(e){e.dead=true;b.dead=true;this.kills++;this.score+=50;this.event('hit');}
      }
      for(const s of this.shots){s.x+=s.vx*dt;s.y+=s.vy*dt;if(hit(p,s)&&p.shield===0){this.end();return;}}
      if(p.shield===0&&this.enemies.some(e=>!e.dead&&hit(e,p))){this.end();return;}
      if(this.boss&&hit(p,this.boss)){this.end();return;}
      for(const d of this.pickups)if(hit(p,d)){d.dead=true;this.collect(d.type);}
      this.enemies=this.enemies.filter(e=>!e.dead&&e.y<H+50);this.bullets=this.bullets.filter(b=>!b.dead);this.pickups=this.pickups.filter(d=>!d.dead&&d.y<H+40);this.shots=this.shots.filter(s=>s.y<H+30&&s.x>-40&&s.x<W+40);
      if(this.boss&&this.boss.hp<=0){this.score+=1500;this.boss=null;this.end(true);return;}
      if(p.fuel<=0)this.end();
    }
  }
  class Breakout extends Base{
    constructor(random){super(random);this.lives=3;this.level=1;this.paddle={x:385,y:548,w:130,h:14};this.ball={x:450,y:536,r:8,vx:200,vy:-260,attached:true};this.bricks=[];this.pickups=[];this.effects={wide:0,slow:0,sticky:0};this.makeBricks();}
    makeBricks(){this.bricks=[];for(let r=0;r<5;r++)for(let c=0;c<10;c++){if(this.level===2&&Math.abs(c-4.5)>r+.5)continue;if(this.level===3&&(r+c)%3===0)continue;this.bricks.push({x:43+c*82,y:65+r*30,w:74,h:20,row:r});}}
    attach(){this.ball.attached=true;this.ball.x=this.paddle.x+this.paddle.w/2;this.ball.y=this.paddle.y-10;this.ball.vx=200;this.ball.vy=-260;}
    launch(){if(this.state==='playing')this.ball.attached=false;}
    collect(type){this.effects[type]=12;this.event('power');if(type==='wide'){this.paddle.w=190;this.paddle.x=clamp(this.paddle.x,0,W-190);}}
    update(dt,input={}){
      if(!this.tick(dt))return;
      for(const k of Object.keys(this.effects))this.effects[k]=Math.max(0,this.effects[k]-dt);
      this.paddle.w=this.effects.wide>0?190:130;
      this.paddle.x=clamp(this.paddle.x+((input.right?1:0)-(input.left?1:0))*470*dt,0,W-this.paddle.w);
      const p=this.paddle,b=this.ball;
      if(b.attached){b.x=p.x+p.w/2;b.y=p.y-10;if(input.fire)this.launch();}
      else{
        // Small physics substeps prevent tunneling through thin bricks/paddle.
        const n=Math.max(1,Math.ceil(dt/.008)), step=dt/n*(this.effects.slow>0?.62:1)*(1+(this.level-1)*.12);
        for(let i=0;i<n;i++){
          const oldX=b.x,oldY=b.y;b.x+=b.vx*step;b.y+=b.vy*step;
          if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx);}if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx);}if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy);}
          if(b.vy>0&&b.y+b.r>=p.y&&oldY+b.r<=p.y+3&&b.x+b.r>p.x&&b.x-b.r<p.x+p.w){
            const t=clamp((b.x-(p.x+p.w/2))/(p.w/2),-.95,.95),speed=330;b.vx=t*speed*.85;b.vy=-Math.sqrt(speed*speed-b.vx*b.vx);b.y=p.y-b.r-1;this.event('hit');if(this.effects.sticky>0){this.attach();break;}
          }
          const at=this.bricks.findIndex(k=>b.x+b.r>k.x&&b.x-b.r<k.x+k.w&&b.y+b.r>k.y&&b.y-b.r<k.y+k.h);
          if(at>=0){const k=this.bricks.splice(at,1)[0];if(oldX+b.r<=k.x||oldX-b.r>=k.x+k.w){b.vx*=-1;b.x=oldX;}else{b.vy*=-1;b.y=oldY;}this.score+=100;this.event('hit');if(this.random()<.32)this.pickups.push({x:k.x+25,y:k.y,w:24,h:24,type:['wide','slow','sticky'][Math.floor(this.random()*3)]});}
          if(b.y>H+15){this.lives--;if(this.lives<=0)this.end();else this.attach();break;}
        }
      }
      for(const d of this.pickups){d.y+=125*dt;if(hit(d,p)){this.collect(d.type);d.dead=true;}}
      this.pickups=this.pickups.filter(d=>!d.dead&&d.y<H+30);
      if(this.state==='playing'&&this.bricks.length===0){this.score+=500;if(this.level===3)this.end(true);else{this.level++;this.makeBricks();this.pickups=[];this.effects={wide:0,slow:0,sticky:0};this.attach();}}
    }
  }
  function makeMaze(random,cols=25,rows=17){
    const grid=Array.from({length:rows},()=>Array(cols).fill(1));const stack=[[1,1]];grid[1][1]=0;
    while(stack.length){const [x,y]=stack[stack.length-1];const options=[[0,-2],[0,2],[-2,0],[2,0]].map(([dx,dy])=>[x+dx,y+dy,dx,dy]).filter(([nx,ny])=>nx>0&&ny>0&&nx<cols-1&&ny<rows-1&&grid[ny][nx]===1);if(!options.length){stack.pop();continue;}const[nx,ny,dx,dy]=options[Math.floor(random()*options.length)];grid[y+dy/2][x+dx/2]=0;grid[ny][nx]=0;stack.push([nx,ny]);}return grid;
  }
  class Maze extends Base{
    constructor(random){super(random);this.cols=25;this.rows=17;this.grid=makeMaze(this.random);this.player={x:1,y:1};this.exit={x:23,y:15};this.remaining=300;this.coins=[];this.boosts=[];this.guards=[];this.collected=0;this.invulnerable=0;this.moveTimer=0;
      const cells=[];for(let y=1;y<16;y++)for(let x=1;x<24;x++)if(!this.grid[y][x]&&(x!==1||y!==1)&&(x!==23||y!==15))cells.push({x,y});
      const take=()=>cells.splice(Math.floor(this.random()*cells.length),1)[0];for(let i=0;i<8;i++)this.coins.push(take());for(let i=0;i<3;i++)this.boosts.push(take());
      for(let i=0;i<3;i++){const candidates=cells.filter(c=>c.x+c.y>8&&((!this.grid[c.y][c.x+1])||(!this.grid[c.y+1][c.x])));const c=candidates[Math.floor(this.random()*candidates.length)];if(c)this.guards.push({...c,axis:this.grid[c.y][c.x+1]?'y':'x',dir:1,wait:.3+i*.15});}
    }
    guardCollision(){if(this.invulnerable>0)return; if(this.guards.some(g=>g.x===this.player.x&&g.y===this.player.y)){this.player={x:1,y:1};this.invulnerable=2;this.message='Guard encounter — returned to the entrance.';this.event('damage');}}
    move(dx,dy){if(this.state!=='playing')return;const x=this.player.x+dx,y=this.player.y+dy;if(x<0||y<0||x>=this.cols||y>=this.rows||this.grid[y][x])return;this.player={x,y};
      const coin=this.coins.findIndex(c=>c.x===x&&c.y===y);if(coin>=0){this.coins.splice(coin,1);this.collected++;this.score+=100;this.event('power');}
      const boost=this.boosts.findIndex(c=>c.x===x&&c.y===y);if(boost>=0){this.boosts.splice(boost,1);this.remaining+=30;this.message='+30 seconds';this.event('power');}
      this.guardCollision();if(this.player.x===this.exit.x&&this.player.y===this.exit.y){if(this.coins.length===0){this.score+=Math.floor(this.remaining)*5;this.end(true);}else this.message='The gate needs all 8 coins.';}
    }
    update(dt,input={}){if(!this.tick(dt))return;this.remaining=Math.max(0,this.remaining-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);this.moveTimer-=dt;if(this.moveTimer<=0){const dir=input.left?[-1,0]:input.right?[1,0]:input.up?[0,-1]:input.down?[0,1]:null;if(dir){this.move(...dir);this.moveTimer=.115;}else this.moveTimer=0;}
      if(this.state!=='playing')return;for(const g of this.guards){g.wait-=dt;if(g.wait<=0){let nx=g.x+(g.axis==='x'?g.dir:0),ny=g.y+(g.axis==='y'?g.dir:0);if(!this.grid[ny]||this.grid[ny][nx]!==0){g.dir*=-1;nx=g.x+(g.axis==='x'?g.dir:0);ny=g.y+(g.axis==='y'?g.dir:0);}if(this.grid[ny]&&this.grid[ny][nx]===0){g.x=nx;g.y=ny;}g.wait=.42;}}this.guardCollision();if(this.remaining<=0)this.end();}
  }
  const PATH=[{x:-30,y:140},{x:250,y:140},{x:250,y:370},{x:610,y:370},{x:610,y:150},{x:825,y:150},{x:825,y:530},{x:940,y:530}];
  const PADS=[{x:160,y:230},{x:350,y:235},{x:400,y:475},{x:505,y:260},{x:710,y:260},{x:730,y:430},{x:145,y:440},{x:450,y:80}];
  class Keep extends Base{
    constructor(random){super(random);this.energy=180;this.integrity=15;this.wave=0;this.waveActive=false;this.queue=0;this.spawnTimer=0;this.enemies=[];this.towers=[];this.beams=[];this.selected='pulse';this.message='Build towers before sending wave 1.';}
    build(i,type=this.selected){if(this.state!=='playing'||!Number.isInteger(i)||!PADS[i])return false;const old=this.towers.find(t=>t.pad===i);if(old){if(old.level>=3){this.message='Maximum tower level reached.';return false;}if(this.energy<50){this.message='Need 50 energy to upgrade.';return false;}this.energy-=50;old.level++;this.message='Tower upgraded to level '+old.level;return true;}
      if(!['pulse','frost'].includes(type))return false;const cost=type==='pulse'?60:45;if(this.energy<cost){this.message='Not enough energy for this tower.';return false;}this.energy-=cost;this.towers.push({...PADS[i],pad:i,type,level:1,cooldown:0});this.message=(type==='pulse'?'Pulse':'Frost')+' tower ready.';return true;
    }
    sendWave(){if(this.state!=='playing'||this.waveActive||this.wave>=6)return false;this.wave++;this.waveActive=true;this.queue=5+this.wave*2;this.spawnTimer=0;this.message='Wave '+this.wave+' incoming';return true;}
    spawnEnemy(){const n=this.queue;let type=this.wave>=3&&n%4===0?'armor':this.wave>=2&&n%3===0?'runner':'drone';const hp=(type==='armor'?135:55)+this.wave*17;this.enemies.push({x:PATH[0].x,y:PATH[0].y,target:1,progress:0,hp,maxHp:hp,speed:type==='runner'?105:type==='armor'?45:65,type,slow:0});}
    update(dt){if(!this.tick(dt))return;
      if(this.waveActive&&this.queue>0){this.spawnTimer-=dt;if(this.spawnTimer<=0){this.spawnEnemy();this.queue--;this.spawnTimer=.95;}}
      for(const e of this.enemies){e.slow=Math.max(0,e.slow-dt);let dist=e.speed*(e.slow>0?.46:1)*dt;while(dist>0&&!e.escaped){const t=PATH[e.target],dx=t.x-e.x,dy=t.y-e.y,len=Math.hypot(dx,dy);if(dist>=len){e.x=t.x;e.y=t.y;e.target++;e.progress+=len;dist-=len;if(e.target>=PATH.length){e.escaped=true;this.integrity-=e.type==='armor'?2:1;this.event('damage');}}else{e.x+=dx/len*dist;e.y+=dy/len*dist;e.progress+=dist;dist=0;}}}
      for(const t of this.towers){t.cooldown-=dt;const range=150+t.level*14;const e=this.enemies.filter(e=>!e.escaped&&e.hp>0&&Math.hypot(e.x-t.x,e.y-t.y)<=range).sort((a,b)=>b.progress-a.progress)[0];if(e&&t.cooldown<=0){const damage=t.type==='pulse'?27*t.level:9*t.level;e.hp-=damage*(e.type==='armor'&&t.type==='pulse'?.8:1);if(t.type==='frost')e.slow=1.8;t.cooldown=t.type==='pulse'?.55:.65;this.beams.push({x:t.x,y:t.y,tx:e.x,ty:e.y,type:t.type,life:.13});this.event('shoot');}}
      for(const e of this.enemies)if(e.hp<=0&&!e.escaped){this.energy+=e.type==='armor'?23:16;this.score+=e.type==='armor'?80:40;this.event('hit');}
      this.enemies=this.enemies.filter(e=>e.hp>0&&!e.escaped);this.beams.forEach(b=>b.life-=dt);this.beams=this.beams.filter(b=>b.life>0);
      if(this.integrity<=0){this.integrity=0;this.end();return;}
      if(this.waveActive&&this.queue===0&&this.enemies.length===0){this.waveActive=false;this.energy+=40;this.message='Wave cleared. +40 energy. Build or upgrade.';if(this.wave===6){this.score+=this.integrity*100;this.end(true);}}
    }
  }
  const API={W,H,clamp,hit,rng,scores,addScore,makeMaze,Shooter,Breakout,Maze,Keep,PATH,PADS};
  if(typeof module==='object'&&module.exports)module.exports=API;else root.Arcade=API;
})(typeof window!=='undefined'?window:globalThis);
