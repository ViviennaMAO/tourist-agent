/** Compact island houses retain the original footprint/height. Recessed doors,
 * stone returns, roof parapets and timber pergolas replace candy-colour blocks. */
export function appendIslandVilla({b,finishes,box,index}) {
  const {wall,trim,glass,wood,roof,recess}=finishes,{w,d,h}=b;
  const front=d/2,porch=.28,back=front-porch;
  box(wall,0,h*.46,-porch/2,w,h*.92,d-porch);
  box(trim,0,.035,0,w,.07,d);
  box(roof,0,h-.10,-porch/2,w-.1,.045,d-porch-.1);
  for(const sign of [-1,1]) {
    box(wall,sign*(w/2-.055),h-.05,0,.11,.10,d);
    box(trim,sign*(w/2-.055),h-.005,0,.11,.01,d);
    box(wall,0,h-.05,sign*(d/2-.055),w,.1,.11);
  }
  for(const sign of [-1,1]) {
    const x=sign*w*.26;
    box(recess,x,.58,back+.006,w*.35,.82,.018);
    box(glass,x,.59,back+.02,w*.29,.74,.016);
    for(const side of [-1,1])box(trim,x+side*w*.16,.59,back+.045,.045,.82,.075);
    box(trim,x,.18,back+.05,w*.35,.06,.10);
    box(wood,x,.59,back+.045,.018,.74,.03);
    for(const y of [.23,.96])box(wood,x,y,back+.045,w*.29,.025,.03);
    box(wood,x+.035,.54,back+.07,.012,.12,.02);
    box(trim,sign*(w/2-.065),h*.43,front-.065,.09,h*.86,.09);
  }
  // Thin pergola members have real gaps and cast shadows on the entrance.
  for(let i=0;i<7;i++)box(wood,-w/2+.07+i*(w-.14)/6,h*.88,front-.16,.035,.045,.31);
  box(wood,0,h*.86,front-.025,w-.08,.035,.035);
  for(const sign of [-1,1])for(const z of [-d*.24,d*.12]) {
    box(recess,sign*(w/2+.001),.59,z,.008,.55,.36);
    box(glass,sign*(w/2+.005),.59,z,.008,.48,.30);
    for(const edge of [-1,1])box(trim,sign*(w/2-.018),.59,z+edge*.18,.035,.59,.025);
    box(trim,sign*(w/2-.018),.31,z,.035,.035,.39);
    box(wood,sign*(w/2+.008),.59,z,.008,.48,.016);
  }
  return {treatment:'island-limestone',facadeHeight:h,pergolaSlats:7,variant:index%3};
}
