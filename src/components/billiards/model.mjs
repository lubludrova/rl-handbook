export const CUE={x:155,y:285},TARGET={x:445,y:180},POCKET={x:665,y:60};
export const REAL={friction:90,restitution:.94},APPROX={friction:40,restitution:.8};
export function simulate(angle,power,params=REAL){
 const a=angle*Math.PI/180,dt=1/240;
 const balls=[{...CUE,vx:Math.cos(a)*power*6,vy:Math.sin(a)*power*6,pocket:false},{...TARGET,vx:0,vy:0,pocket:false}];
 /** @type {{x:number,y:number,pocket:boolean}[][]} */
 const frames=[];
 const record=()=>frames.push(balls.map(b=>({x:b.x,y:b.y,pocket:b.pocket})));record();let contact=false;
 for(let t=0;t<3600;t++){
  for(const b of balls){if(b.pocket)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(Math.hypot(b.x-POCKET.x,b.y-POCKET.y)<21){b.x=POCKET.x;b.y=POCKET.y;b.vx=0;b.vy=0;b.pocket=true;continue;}
   if(b.x<40){b.x=80-b.x;b.vx=Math.abs(b.vx)*.92;}if(b.x>680){b.x=1360-b.x;b.vx=-Math.abs(b.vx)*.92;}
   if(b.y<40){b.y=80-b.y;b.vy=Math.abs(b.vy)*.92;}if(b.y>360){b.y=720-b.y;b.vy=-Math.abs(b.vy)*.92;}
   const speed=Math.hypot(b.vx,b.vy),factor=speed?Math.max(0,speed-params.friction*dt)/speed:0;b.vx*=factor;b.vy*=factor;
  }
  const [c,o]=balls,dx=o.x-c.x,dy=o.y-c.y,dist=Math.hypot(dx,dy);
  if(!c.pocket&&!o.pocket&&dist>0&&dist<20){const nx=dx/dist,ny=dy/dist,closing=(c.vx-o.vx)*nx+(c.vy-o.vy)*ny;
   const overlap=(20-dist)/2;c.x-=nx*overlap;c.y-=ny*overlap;o.x+=nx*overlap;o.y+=ny*overlap;
   if(closing>0){const impulse=(1+params.restitution)*closing/2;c.vx-=impulse*nx;c.vy-=impulse*ny;o.vx+=impulse*nx;o.vy+=impulse*ny;contact=true;}
  }
  if(t%4===0)record();if(balls.every(b=>b.pocket||Math.hypot(b.vx,b.vy)<.5)){record();break;}
 }
 return {frames,contact,pocket:balls[1].pocket,scratch:balls[0].pocket};
}
/**
 * @param {{friction:number,restitution:number}} params
 * @returns {{angle:number,power:number,length:number}|null}
 */
export function findShot(params){
 /** @type {{angle:number,power:number,length:number}|null} */
 let best=null;
 // Search direct-contact candidates on a fine angular grid, lowest power first.
 const center=Math.atan2(TARGET.y-CUE.y,TARGET.x-CUE.x)*180/Math.PI;
 const angles=Array.from({length:97},(_,i)=>center-12+i*.25);
 for(let p=28;p<=100;p+=2){for(const a of angles){const r=simulate(a,p,params);if(r.pocket&&!r.scratch&&(!best||r.frames.length<best.length))best={angle:a,power:p,length:r.frames.length};}if(best)break;}
 return best;
}
