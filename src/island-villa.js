/** One-storey courtyard villas. The narrow plots retain a usable side lane. */
export function appendIslandVilla({b,finishes,box,index}) {
  const {wall,trim,glass,wood,roof,recess}=finishes,{w,d,h}=b;
  const scale=h/2.65,front=d/2,porch=.28,back=front-porch;
  const detail=(m,x,y,z,ww,hh,dd)=>box(m,x,y*scale,z,ww,hh*scale,dd);
  box(wall,0,h*.46,-porch/2-.055,w,h*.92,d-porch-.11);
  box(trim,0,.035,0,w,.07,d);
  box(roof,0,h-.13,-porch/2,w-.12,.045,d-porch-.1);
  for(const sign of [-1,1]) {
    box(wall,sign*(w/2-.055),h-.08,0,.11,.16,d);
    box(trim,sign*(w/2-.055),h-.005,0,.11,.01,d);
    box(wall,0,h-.08,sign*(d/2-.055),w,.16,.11);
  }
  // A tall glazed entrance and a broad, separate living-room window.
  const openings=[{x:-w*.22,width:w*.42,y:1.34,height:1.28},{x:w*.27,width:Math.min(.80,w*.32),y:1.08,height:2}];
  for(const a of openings){
    detail(recess,a.x,a.y,back-.035,a.width+.10,a.height+.12,.08);
    detail(glass,a.x,a.y,back+.012,a.width,a.height,.018);
    for(const sign of [-1,1])detail(trim,a.x+sign*(a.width/2+.035),a.y,back+.04,.07,a.height+.15,.10);
    for(const sign of [-1,1])detail(trim,a.x,a.y+sign*(a.height/2+.04),back+.04,a.width+.14,.08,.10);
    detail(wood,a.x,a.y,back+.04,.025,a.height,.025);
    if(a===openings[1])detail(wood,a.x+.20,1.05,back+.065,.025,.15,.025);
  }
  for(const sign of [-1,1])box(trim,sign*(w/2-.06),h*.42,front-.055,.09,h*.84,.09);
  for(let i=0;i<9;i++)box(wood,-w/2+.07+i*(w-.14)/8,h*.86,front-.15,.04,.065,.32);
  box(wood,0,h*.84,front-.03,w-.08,.055,.04);
  // The seaward rear is visible from the overview too: paired shuttered
  // windows and a shallow coping keep it from becoming a blank tall box.
  for(const sign of [-1,1]){
    const x=sign*w*.25,z=-d/2;
    detail(recess,x,1.40,z-.003,w*.27,1.18,.012);
    detail(glass,x,1.40,z-.012,w*.23,1.04,.015);
    for(const edge of [-1,1])detail(trim,x+edge*w*.135,1.40,z-.018,.06,1.23,.045);
    for(const y of [.81,1.99])detail(trim,x,y,z-.02,w*.30,.06,.05);
    detail(wood,x,1.40,z-.027,.025,1.04,.015);
  }
  box(trim,0,h-.25,-d/2+.02,w,.065,.08);
  for(const sign of [-1,1]){
    detail(recess,sign*(w/2+.001),1.38,-.12,.008,1.10,.67);
    detail(glass,sign*(w/2+.005),1.38,-.12,.008,.97,.54);
    for(const edge of [-1,1])detail(trim,sign*(w/2-.018),1.38,-.12+edge*.32,.035,1.14,.055);
    detail(trim,sign*(w/2-.018),.84,-.12,.035,.055,.69);
    detail(wood,sign*(w/2+.008),1.38,-.12,.008,.97,.024);
  }
  return {treatment:'island-limestone',facadeHeight:h,width:w,depth:d,pergolaSlats:9,variant:index%3};
}
