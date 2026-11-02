// The new promenade joins the existing straight shore at both ends.
export function shoreBulge(x){const t=Math.max(0,Math.min(1,(x+33)/26));return 3.2*Math.sin(Math.PI*t)**2;}
export function shoreSlope(x){return (shoreBulge(x+.01)-shoreBulge(x-.01))/.02;}
export function promenadePolygon(){
  return [[-33,-5.9],[-7,-5.9],...Array.from({length:65},(_,i)=>{const x=-7-i*26/64;return [x,-4.85+shoreBulge(x)];})];
}
export function pointInPolygon(points,x,z){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
