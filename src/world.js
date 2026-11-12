/** Original Leafwood content. Coordinates are tile units; doors require ACTION. */
export const TILE = 16;
const directions = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const grid = (w,h,c) => Array.from({length:h},()=>Array(w).fill(c));
const fill = (a,x,y,w,h,c) => {for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(a[j]?.[i]!==undefined)a[j][i]=c;};
const buildings = [
 {id:'academy',name:'WINDWARD ACADEMY',x:17,y:5,w:13,h:8,roof:'red',kind:'academy',doorX:23},
 {id:'clinic',name:'HERBAL CLINIC',x:5,y:8,w:9,h:7,roof:'blue',kind:'clinic',doorX:9},
 {id:'home',name:'REN’S HOME',x:5,y:23,w:9,h:7,roof:'blue',kind:'home',doorX:9},
 {id:'shop',name:'PROVISIONS',x:30,y:23,w:10,h:7,roof:'gold',kind:'shop',doorX:35},
 {id:'residence1',name:'',x:3,y:17,w:7,h:5,roof:'gold',kind:'house'},
 {id:'residence2',name:'',x:32,y:4,w:8,h:6,roof:'green',kind:'house'},
 {id:'residence3',name:'',x:32,y:16,w:8,h:5,roof:'red',kind:'house'},
 {id:'residence4',name:'',x:15,y:23,w:6,h:6,roof:'red',kind:'house'},
];
const villageTiles=grid(48,36,'.');
fill(villageTiles,0,0,48,4,'^'); fill(villageTiles,0,34,48,2,'^');
fill(villageTiles,0,0,2,36,'^');fill(villageTiles,46,0,2,36,'^');
fill(villageTiles,42,4,4,30,'~');
fill(villageTiles,22,4,5,30,':');fill(villageTiles,2,15,40,3,':');
fill(villageTiles,2,30,40,3,':');fill(villageTiles,8,14,3,18,':');
fill(villageTiles,34,9,3,23,':');fill(villageTiles,14,19,9,3,':');
fill(villageTiles,29,10,12,5,'s');
fill(villageTiles,42,15,4,3,'=');fill(villageTiles,42,30,4,3,'=');
fill(villageTiles,27,28,14,3,':');
fill(villageTiles,22,33,5,3,':');
const props=[
 {id:'notice',type:'notice',name:'Village noticeboard',x:21,y:28,w:1,h:1,kind:'notice',solid:true,text:'A new beginning • Find Instructor Sora at Windward Academy, north along Lantern Walk.'},
 {x:29,y:11,kind:'target',solid:true},{x:32,y:11,kind:'target',solid:true},{x:40,y:11,kind:'target',solid:true},
 {x:28,y:28,kind:'lantern',solid:true},{x:21,y:14,kind:'lantern',solid:true},{x:27,y:14,kind:'lantern',solid:true},
 {x:12,y:19,kind:'lantern',solid:true},{x:28,y:19,kind:'lantern',solid:true},
 {x:11,y:20,kind:'bench',solid:true,w:2,h:1},{x:28,y:17,kind:'bench',solid:true,w:2,h:1},
 {x:29,y:25,kind:'crate',solid:true},{x:40,y:26,kind:'crate',solid:true},
 {x:30,y:21,kind:'stall',solid:true,w:3,h:1},{x:37,y:21,kind:'stall',solid:true,w:3,h:1},
 {x:13,y:16,kind:'flower',solid:false},{x:20,y:16,kind:'flower',solid:false},
 {x:28,y:31,kind:'flower',solid:false},{x:11,y:31,kind:'flower',solid:false},
];
const npcs=[
 {id:'trainee',type:'npc',name:'Scout Toma',x:38,y:12,color:'amber',text:'A good scout reads the opponent before moving.'},
 {id:'gardener',type:'npc',name:'Mira',x:18,y:19,color:'rose',text:'The academy is north, past the lanterns. Look for its red roof.'},
 {id:'villager',type:'npc',name:'Jun',x:28,y:30,color:'blue',text:'Home is west of this avenue. The provisions shop is to the east.'},
];
const exits = buildings.filter(b=>['academy','home','shop','clinic'].includes(b.id)).map(b=>({id:`enter-${b.id}`,name:b.name,type:'exit',x:b.doorX,y:b.y+b.h-1,target:b.id,spawn:{x:10,y:12,facing:'up'}}));
const overlaps=(x,y,o)=>x>=o.x&&x<o.x+(o.w||1)&&y>=o.y&&y<o.y+(o.h||1);
// Tree trunks are solid; canopies overhang and are depth sorted by their trunk.
for(let y=4;y<34;y+=2)for(let x=2;x<42;x+=2){
 const hash=(x*37+y*71)%19;
 if(hash>12)continue;
 if(villageTiles[y][x]!=='.'||buildings.some(b=>x>=b.x-1&&x<b.x+b.w+1&&y>=b.y-1&&y<b.y+b.h+1))continue;
 if(props.some(p=>Math.abs(p.x-x)<2&&Math.abs(p.y-y)<2)||npcs.some(n=>Math.abs(n.x-x)<2&&Math.abs(n.y-y)<2))continue;
 props.push({x,y,kind:hash%7===0?'blossom':'tree',variant:hash%3,solid:true});
}
for(const [x,y] of [[3,5],[7,5],[11,5],[15,4],[28,4],[40,6],[40,20],[3,28],[3,32],[16,32],[19,32],[29,32],[39,32]]){
 if(!props.some(p=>overlaps(x,y,p)))props.push({x,y,kind:'tree',variant:(x+y)%3,solid:true});
}
function interior(id,name,decor,npc){
 const width=21,height=16,terrain=grid(width,height,'f');
 fill(terrain,0,0,width,3,'#');fill(terrain,0,0,1,height,'#');fill(terrain,width-1,0,1,height,'#');fill(terrain,0,height-1,width,1,'#');
 fill(terrain,7,5,7,6,'t');
 const outside=exits.find(e=>e.target===id);
 return {id,name,width,height,spawn:{x:10,y:12},terrain:terrain.map(r=>r.join('')),buildings:[],props:decor,npcs:npc,exits:[{id:`leave-${id}`,type:'exit',name:'Return to Lantern Walk',x:10,y:15,target:'village',spawn:{x:outside.x,y:outside.y+1,facing:'down'}}]};
}
export const MAPS={
 village:{id:'village',name:'Leafwood Village',subtitle:'Lantern Walk',width:48,height:36,spawn:{x:24,y:29},terrain:villageTiles.map(r=>r.join('')),buildings,props,npcs,exits},
 academy:interior('academy','Windward Academy',[
 {x:3,y:3,w:5,h:1,kind:'shelf',solid:true},{x:13,y:3,w:5,h:1,kind:'shelf',solid:true},
 {x:3,y:6,w:3,h:1,kind:'desk',solid:true},{x:15,y:6,w:3,h:1,kind:'desk',solid:true},
 {x:3,y:9,w:3,h:1,kind:'desk',solid:true},{x:15,y:9,w:3,h:1,kind:'desk',solid:true},
 {x:9,y:3,w:3,h:1,kind:'board',solid:true},
 ],[{id:'instructor',type:'npc',name:'Instructor Sora',x:10,y:5,color:'blue'}]),
 home:interior('home','Ren’s Home',[
 {id:'bed',type:'bed',name:'Rest at home',x:4,y:5,w:3,h:4,kind:'bed',solid:true},
 {x:14,y:3,w:4,h:1,kind:'shelf',solid:true},{x:14,y:7,w:3,h:2,kind:'table',solid:true},
 {x:3,y:11,kind:'plant',solid:true},{x:17,y:11,kind:'plant',solid:true},
 ],[]),
 shop:interior('shop','The Copper Kettle',[
 {x:2,y:3,w:6,h:1,kind:'shelf',solid:true},{x:13,y:3,w:6,h:1,kind:'shelf',solid:true},
 {x:3,y:7,w:4,h:1,kind:'counter',solid:true},{x:14,y:7,w:4,h:1,kind:'counter',solid:true},
 {x:3,y:10,kind:'crate',solid:true},{x:17,y:10,kind:'crate',solid:true},
 ],[{id:'supply',type:'npc',name:'Merchant Ivo',x:10,y:6,color:'amber'}]),
 clinic:interior('clinic','Herbal Clinic',[
 {x:3,y:5,w:3,h:4,kind:'bed',solid:true},{x:15,y:5,w:3,h:4,kind:'bed',solid:true},
 {x:8,y:3,w:5,h:1,kind:'shelf',solid:true},{x:3,y:11,kind:'plant',solid:true},{x:17,y:11,kind:'plant',solid:true},
 ],[{id:'healer',type:'npc',name:'Herbalist Neri',x:10,y:5,color:'rose'}]),
};
export function isWalkable(mapId,x,y){
 const m=MAPS[mapId];if(!m||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=m.width||y>=m.height)return false;
 if('~^#'.includes(m.terrain[y][x]))return false;
 return !m.buildings.some(b=>overlaps(x,y,b))&&!m.props.some(p=>p.solid&&overlaps(x,y,p))&&!m.npcs.some(n=>n.x===x&&n.y===y);
}
export function getInteractable(mapId,x,y,facing){
 const m=MAPS[mapId],d=directions[facing];if(!m||!d)return null;
 const tx=x+d[0],ty=y+d[1];
 return m.exits.find(e=>e.x===tx&&e.y===ty)||m.npcs.find(n=>n.x===tx&&n.y===ty)||m.props.find(p=>p.id&&overlaps(tx,ty,p))||null;
}
