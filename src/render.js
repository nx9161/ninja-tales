import {MAPS,TILE,getInteractable} from './world.js';

// Original code-drawn pixel assets. No image, font, or network dependencies.
const cache = new Map();
const palettes={red:['#7d3c35','#ac5141','#ce7550','#e89a69'],blue:['#274859','#3a6977','#5d8b92','#88b0aa'],gold:['#865937','#b27b40','#dca75b','#f1c77d'],green:['#304e43','#497660','#719572','#9fb98a']};
const px=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function canvas(w,h){const a=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):document.createElement('canvas');a.width=w;a.height=h;return a;}
function asset(key,w,h,fn){if(!cache.has(key)){const a=canvas(w,h),c=a.getContext('2d');c.imageSmoothingEnabled=false;fn(c);cache.set(key,a);}return cache.get(key);}
function noise(x,y){return ((x*73+y*179+x*y*11)%997)/997;}
function ground(c,m){
 for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){
  const t=m.terrain[y][x],a=x*TILE,b=y*TILE,n=noise(x,y);
  if(t==='.'||t==='s'){
   px(c,a,b,16,16,t==='s'?'#bbaa6b':n>.5?'#6e964f':'#739c52');
   for(let i=0;i<4;i++){const dx=(x*7+i*11+y)%15,dy=(y*13+i*7+x)%15;px(c,a+dx,b+dy,2,1,t==='s'?'#caba80':i%2?'#87a85a':'#5c8848');}
   if(t==='.'&&n>.86){px(c,a+6,b+9,1,3,'#4a7848');px(c,a+4,b+8,5,2,'#e1ca82');px(c,a+6,b+7,1,4,'#eddea3');}
  }else if(t===':'){
   px(c,a,b,16,16,'#c5b58b');px(c,a,b+15,16,1,'#afa17d');
   const shift=y%2?7:0;px(c,a+shift,b+1,1,14,'#b2a47f');px(c,a+shift+1,b+1,14-shift,1,'#d4c59a');
   if(n>.7){px(c,a+3,b+9,3,1,'#b2a47f');px(c,a+5,b+10,1,3,'#b2a47f');}
   for(const [dx,dy,side] of [[-1,0,'l'],[1,0,'r'],[0,-1,'t'],[0,1,'b']]){
    if(m.terrain[y+dy]?.[x+dx]==='.'){
     if(side==='l'){px(c,a,b,2,16,'#69764c');px(c,a+2,b,1,16,'#ded0a1');}
     if(side==='r'){px(c,a+14,b,2,16,'#69764c');px(c,a+13,b,1,16,'#ded0a1');}
     if(side==='t'){px(c,a,b,16,2,'#69764c');px(c,a,b+2,16,1,'#ded0a1');}
     if(side==='b'){px(c,a,b+14,16,2,'#69764c');px(c,a,b+13,16,1,'#ded0a1');}
    }
   }
  }else if(t==='~'){
   px(c,a,b,16,16,n>.5?'#427b82':'#3e737c');px(c,a+(x+y)%8,b+6,8,1,'#6ba1a0');px(c,a+3,b+13,5,1,'#5d9697');
   if(m.terrain[y]?.[x-1]!== '~'&&m.terrain[y]?.[x-1]!== '='){px(c,a,b,3,16,'#8b9575');px(c,a+3,b,2,16,'#b1b18b');}
  }else if(t==='='){
   px(c,a,b,16,16,'#755f43');for(let i=0;i<4;i++){px(c,a,b+i*4,16,3,'#b49a68');px(c,a+1,b+i*4,14,1,'#d0b780');}
   if(m.terrain[y-1]?.[x]!=='=')px(c,a,b,16,3,'#554b39');if(m.terrain[y+1]?.[x]!=='=')px(c,a,b+13,16,3,'#554b39');
  }else if(t==='^'){
   const rock=['#69705b','#777861','#898269','#9b9071'];px(c,a,b,16,16,rock[(x+y)%4]);
   px(c,a+2,b+2,11,2,'#aba17b');px(c,a+13,b+3,2,12,'#5e6655');px(c,a+4,b+8,6,1,'#73715b');
   if(y===3){px(c,a,b,16,4,'#486d44');px(c,a,b+4,16,2,'#90a15e');}
  }else if(t==='f'||t==='t'){
   px(c,a,b,16,16,t==='t'?'#9caa7b':'#a58158');px(c,a,b+15,16,1,t==='t'?'#5d7661':'#755e46');
   px(c,a+(y%2?8:0),b,1,15,t==='t'?'#819168':'#866b4d');
   for(let i=0;i<3;i++)px(c,a+3+i*4,b+4+i*3,4,1,t==='t'?'#adb98b':'#b89567');
  }else if(t==='#'){
   px(c,a,b,16,16,'#49594f');px(c,a+1,b+1,14,13,'#73816b');px(c,a+2,b+2,12,1,'#94a086');
   if(y===2){px(c,a,b+9,16,7,'#544e3e');px(c,a,b+9,16,2,'#aa8d5b');}
  }
 }
 if(m.id!=='village'){
  // Windows, wall hangings and a warm entrance mat make each room legible.
  for(const x of [3,15]){px(c,x*16,15,48,25,'#4c4537');px(c,x*16+3,17,42,20,'#9bb9ae');px(c,x*16+5,18,17,17,'#bad1bc');px(c,x*16+23,17,2,20,'#5d6657');px(c,x*16+3,27,42,2,'#5d6657');}
  px(c,9*16,14*16,3*16,16,'#b4a176');px(c,9*16+2,14*16+2,44,11,'#c3b58d');
  px(c,10*16,15*16,16,16,'#273e38');px(c,10*16+5,15*16+2,6,2,'#edce89');px(c,10*16+7,15*16+5,2,6,'#edce89');
 }
}
function roof(c,x,y,w,h,p){
 poly(c,[[x+9,y],[x+w-9,y],[x+w,y+h-5],[x+w,y+h],[x,y+h],[x,y+h-5]],p[0]);
 for(let row=0;row<h-5;row+=5){const inset=Math.max(1,Math.round(8*(1-row/h)));px(c,x+inset,y+row,w-inset*2,4,p[1]);
  for(let col=inset;col<w-inset;col+=8){px(c,x+col,y+row,6,1,p[3]);px(c,x+col+5,y+row+1,2,3,p[2]);}
 }
 px(c,x,y+h-5,w,3,p[0]);px(c,x,y+h-5,w,1,p[3]);px(c,x+2,y+h-2,w-4,2,'#503f35');
 px(c,x+8,y-1,w-16,3,p[3]);px(c,x+8,y+2,w-16,2,p[0]);
}
function window(c,x,y,w=16,h=17){
 px(c,x-2,y-2,w+4,h+4,'#745b3e');px(c,x,y,w,h,'#497986');px(c,x+2,y+2,w-4,h-4,'#8eb2ac');
 px(c,x+3,y+2,3,h-5,'#c1d1b6');px(c,x+w/2,y,2,h,'#5a6558');px(c,x,y+h/2,w,2,'#5a6558');px(c,x-3,y+h+1,w+6,3,'#c5a77a');
}
function buildingSprite(b){return asset(`building-${b.id}`,b.w*16+10,b.h*16+8,c=>{
 const w=b.w*16,h=b.h*16,p=palettes[b.roof];
 px(c,7,8,w-3,h,'#3f59414d');px(c,5,3,w-8,h-3,'#51493a');
 const roofHeight=b.kind==='academy'?48:Math.round(h*.49);
 px(c,9,roofHeight-2,w-16,h-roofHeight,'#d4c497');px(c,12,roofHeight+4,w-22,h-roofHeight-9,'#e0d0a4');
 px(c,9,h-8,w-16,8,'#8a8870');for(let x=12;x<w-10;x+=14)px(c,x,h-7,1,6,'#666d5c');
 for(const x of [10,w-14])px(c,x,roofHeight-2,4,h-roofHeight-3,'#735a40');
 px(c,10,roofHeight+9,w-20,3,'#ad9368');
 const doorX=b.doorX!==undefined?(b.doorX-b.x)*16:w/2-8;
 for(let x=22;x<w-22;x+=33){if(Math.abs(x-doorX)<22)continue;window(c,x,roofHeight+17,16,Math.min(18,h-roofHeight-28));}
 px(c,doorX-3,h-33,22,33,'#6f5940');px(c,doorX,h-30,16,30,'#333f37');px(c,doorX+2,h-28,12,27,'#7d6244');
 for(let i=0;i<3;i++)px(c,doorX+3+i*4,h-27,1,23,'#a68457');px(c,doorX+11,h-14,2,2,'#e0bc70');
 px(c,doorX-4,h-3,24,3,'#b9b091');
 roof(c,0,4,w,roofHeight,p);
 if(b.kind==='academy'){
  // A distinctly original bell tower and split, tiered gable.
  px(c,w/2-22,3,44,23,'#e5d4a5');window(c,w/2-10,9,20,11);roof(c,w/2-33,0,66,15,p);
  px(c,12,roofHeight+15,25,h-roofHeight-26,'#758675');px(c,w-37,roofHeight+15,25,h-roofHeight-26,'#758675');
  for(let i=0;i<3;i++){px(c,17+i*7,roofHeight+18,3,h-roofHeight-33,'#c2c49a');px(c,w-32+i*7,roofHeight+18,3,h-roofHeight-33,'#c2c49a');}
 }
 if(b.kind==='shop'){
  for(let x=13;x<w-13;x+=10){px(c,x,h-47,10,13,(x-13)%20?'#d6ca9f':'#aa593d');px(c,x,h-34,10,3,'#66523e');}
  px(c,16,h-27,31,20,'#8c6b46');for(let i=0;i<5;i++){px(c,18+i*5,h-31,4,6,i%2?'#c1a157':'#7f9852');}
 }
 if(b.kind==='clinic'){px(c,w/2-11,roofHeight+7,22,17,'#e5d8ac');px(c,w/2-2,roofHeight+9,4,13,'#63885f');px(c,w/2-7,roofHeight+14,14,4,'#63885f');}
 if(b.name){const short={academy:'ACADEMY',clinic:'HERBALIST',home:'HOME',shop:'PROVISIONS'}[b.id];
  const size=short.length*5+8;px(c,w/2-size/2,roofHeight-1,size,10,'#4d5141');px(c,w/2-size/2,roofHeight-1,size,1,'#e4bd78');
  c.fillStyle='#f0dcad';c.font='7px monospace';c.textAlign='center';c.fillText(short,w/2,roofHeight+7);
 }
 });}
function treeSprite(kind,variant){return asset(`tree-${kind}-${variant}`,44,50,c=>{
 px(c,12,42,25,6,'#344c3f50');px(c,20,29,7,17,'#514b36');px(c,22,30,3,14,'#8a7950');px(c,18,42,4,4,'#665d3e');px(c,26,43,5,3,'#665d3e');
 const colors=kind==='blossom'?['#775773','#a66f8e','#d098ae','#edbcc5','#f6d2cc']:['#264e3d','#346447','#4c8250','#729b58','#98b66b'];
 const clusters=[[12,6,20,22],[4,16,23,20],[22,14,19,22],[11,24,24,17],[14,2,14,16]];
 for(let i=0;i<clusters.length;i++){const [x,y,w,h]=clusters[i];poly(c,[[x+5,y],[x+w-5,y],[x+w,y+5],[x+w,y+h-5],[x+w-5,y+h],[x+4,y+h],[x,y+h-5],[x,y+5]],colors[0]);px(c,x+3,y+3,w-6,h-7,colors[1]);px(c,x+5,y+2,w-9,7,colors[2]);px(c,x+4,y+6,w-9,4,colors[3]);}
 for(let i=0;i<30;i++){const x=6+(i*13+variant*3)%29,y=7+(i*7+variant)%29;px(c,x,y,3+(i%3),2,colors[2+i%3]);}
 px(c,8,27,3,3,colors[0]);px(c,33,23,3,4,colors[0]);
 });}
function propSprite(p){const w=(p.w||1)*16,h=(p.h||1)*16;return asset(`prop-${p.kind}-${w}-${h}`,Math.max(24,w+4),Math.max(40,h+12),c=>{
 const y=Math.max(40,h+12)-h;
 if(p.kind==='target'){px(c,7,20,3,18,'#74583c');for(const [a,b,s,col] of [[0,5,20,'#655941'],[2,7,16,'#c4ba91'],[5,10,10,'#9d5844'],[8,13,4,'#e9d6a3']])px(c,a,b,s,s,col);}
 else if(p.kind==='lantern'){px(c,10,5,3,33,'#504e37');px(c,4,5,16,3,'#61563b');px(c,5,9,13,14,'#e4bb6d');px(c,8,10,6,11,'#f8d896');px(c,5,9,13,2,'#755638');px(c,5,21,13,2,'#755638');px(c,7,24,9,2,'#484a37');}
 else if(p.kind==='notice'){px(c,4,22,3,17,'#73583b');px(c,16,22,3,17,'#73583b');px(c,0,10,24,20,'#5e4e38');px(c,2,12,20,15,'#ad8755');px(c,4,14,8,10,'#e9d6a2');px(c,14,15,6,7,'#cfb580');px(c,5,16,6,1,'#8f825f');px(c,5,19,5,1,'#8f825f');}
 else if(p.kind==='flower'||p.kind==='plant'){px(c,4,30,14,8,'#9d6747');px(c,2,28,18,4,'#c7905c');for(let i=0;i<5;i++){px(c,4+i*3,20-i%2*5,3,10,'#527e4e');px(c,3+i*3,18-i%2*5,5,4,p.kind==='plant'?'#91ad65':i%2?'#dca28e':'#dfc780');}}
 else if(p.kind==='bench'){px(c,1,21,w,4,'#b0925d');px(c,1,27,w,5,'#9c804f');px(c,3,32,3,7,'#514a37');px(c,w-5,32,3,7,'#514a37');}
 else if(p.kind==='crate'){px(c,1,23,20,16,'#665138');px(c,3,25,16,12,'#b58e54');px(c,4,25,2,12,'#d2aa69');px(c,14,25,2,12,'#8b6a40');px(c,3,29,16,2,'#8b6a40');}
 else if(p.kind==='stall'){px(c,3,17,3,22,'#755c3c');px(c,w-5,17,3,22,'#755c3c');px(c,0,3,w,15,'#815647');for(let x=0;x<w;x+=8)px(c,x,3,7,13,(x/8)%2?'#c3ad77':'#9f654c');px(c,0,26,w,13,'#957548');for(let x=3;x<w-3;x+=6)px(c,x,23,5,5,(x%3)?'#abc06a':'#d9a263');}
 else if(p.kind==='shelf'){px(c,0,y-8,w,h+8,'#5e4e3d');px(c,2,y-6,w-4,h+4,'#97754f');for(let x=4;x<w-5;x+=7){px(c,x,y-4,5,11,['#779180','#b26e56','#c7ac70'][Math.floor(x/7)%3]);px(c,x+1,y-2,3,1,'#dfcf9e');}px(c,0,y+7,w,3,'#c09a64');}
 else if(p.kind==='bed'){px(c,1,y+2,w-2,h-2,'#66523d');px(c,4,y+4,w-8,h-8,'#b2bfa6');px(c,5,y+4,w-10,13,'#eadfc4');px(c,6,y+6,w-12,9,'#f2ead3');px(c,4,y+21,w-8,h-27,'#5c8b85');px(c,4,y+21,w-8,3,'#95b5a1');for(let j=28;j<h-6;j+=6)px(c,6,y+j,w-12,1,'#6c9c93');}
 else if(p.kind==='board'){px(c,0,y-7,w,h+7,'#7a6346');px(c,3,y-4,w-6,h+1,'#3c6253');for(let x=7;x<w-8;x+=12){px(c,x,y,8,1,'#a3b592');px(c,x,y+4,5,1,'#a3b592');}}
 else{px(c,2,y-1,w-4,h,'#5e4d39');px(c,0,y-6,w,h,'#ac8957');px(c,2,y-4,w-4,2,'#d1ad73');px(c,4,y+h-7,3,7,'#614f39');px(c,w-7,y+h-7,3,7,'#614f39');if(p.kind==='desk'||p.kind==='table'){px(c,7,y-3,11,6,'#dfd4af');px(c,9,y-1,6,1,'#99946f');}}
 });}
export function drawPortrait(ctx,x,y,characterId='ren',scale=1,facing='down',frame=0){
 const c=ctx;c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
 const colors={ren:'#438e86',aya:'#9b6284',blue:'#557a91',rose:'#aa7b75',amber:'#b28c4e'};const color=colors[characterId]||colors.blue;
 px(c,2,14,13,3,'#263e3650');const step=frame%2;
 px(c,4,12,4,4+step,'#343e3e');px(c,10,12,3,5-step,'#343e3e');px(c,3,5,11,9,color);px(c,5,6,7,6,color);px(c,3,11,11,2,'#314f4d');px(c,3,5,2,6,'#d8b88b');px(c,13,5,2,6,'#d8b88b');
 px(c,5,-3,9,9,'#d8b88b');px(c,4,-5,11,5,'#303e3e');px(c,6,-6,7,2,'#303e3e');px(c,4,-2,3,3,'#303e3e');
 if(facing==='up'){px(c,5,-2,9,4,'#303e3e');px(c,6,4,6,2,'#b9b58b');}
 else{px(c,facing==='left'?6:8,1,1,2,'#2a3d3b');if(facing==='down')px(c,12,1,1,2,'#2a3d3b');px(c,7,5,6,2,'#c7b378');px(c,7,7,2,5,'#c7b378');}
 c.restore();
}
function marker(c,x,y,color='#f4d183'){px(c,x+6,y-19,5,5,'#3b4a3c');px(c,x+7,y-18,3,3,color);px(c,x+8,y-12,1,2,color);}
export function render(ctx,state,time=0){
 const map=MAPS[state.mapId]||MAPS.village;
 const width=ctx.canvas.width,height=ctx.canvas.height;
 const cameraX=Math.max(0,Math.min(map.width*TILE-width,state.player.x*TILE+8-width/2));
 const cameraY=Math.max(0,Math.min(map.height*TILE-height,state.player.y*TILE+8-height/2));
 const offsetX=map.width*TILE<width?Math.floor((width-map.width*TILE)/2):-Math.floor(cameraX);
 const offsetY=map.height*TILE<height?Math.floor((height-map.height*TILE)/2):-Math.floor(cameraY);
 ctx.imageSmoothingEnabled=false;px(ctx,0,0,width,height,'#263e36');ctx.save();ctx.translate(offsetX,offsetY);
 ctx.drawImage(asset(`ground-${map.id}`,map.width*TILE,map.height*TILE,c=>ground(c,map)),0,0);
 const objects=[];
 for(const b of map.buildings)objects.push({depth:b.y+b.h,draw:()=>ctx.drawImage(buildingSprite(b),b.x*16,b.y*16-4)});
 for(const p of map.props){if(p.kind==='tree'||p.kind==='blossom')objects.push({depth:p.y+.95,draw:()=>ctx.drawImage(treeSprite(p.kind,p.variant||0),p.x*16-14,p.y*16-33)});
  else objects.push({depth:p.y+(p.h||1),draw:()=>{const a=propSprite(p);ctx.drawImage(a,p.x*16-2,p.y*16+(p.h||1)*16-a.height);}});
 }
 for(const n of map.npcs)objects.push({depth:n.y+.99,draw:()=>{drawPortrait(ctx,n.x*16,n.y*16,n.color);if(n.id==='instructor'||n.id==='trainee'&&state.quest?.stage===3||n.id==='supply'&&state.quest?.stage===1)marker(ctx,n.x*16,n.y*16);}});
 objects.push({depth:state.player.y+1,draw:()=>drawPortrait(ctx,state.player.x*16,state.player.y*16,'ren',1,state.player.facing,Math.floor(time/180))});
 objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
 // Visible, non-blocking doors; one original compass symbol identifies entrances.
 for(const exit of map.exits){px(ctx,exit.x*16+5,exit.y*16+11,6,2,'#e9c881');px(ctx,exit.x*16+7,exit.y*16+9,2,6,'#e9c881');}
 const target=getInteractable(state.mapId,state.player.x,state.player.y,state.player.facing);
 if(target&&state.mode==='explore'){const x=target.x*16+8,y=target.y*16-11;px(ctx,x-4,y-4,9,9,'#283f35');px(ctx,x-3,y-3,7,7,'#e2bf76');px(ctx,x-1,y-2,3,1,'#374c3b');px(ctx,x-1,y,2,1,'#374c3b');px(ctx,x-1,y+2,3,1,'#374c3b');}
 ctx.restore();
}
