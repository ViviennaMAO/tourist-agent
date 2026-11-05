// Run with PLAYWRIGHT_MODULE and CHROMIUM_PATH when using an external QA runtime.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const base=process.env.TOURIST_TEST_URL||'http://127.0.0.1:5178';
const out=process.env.QA_OUTPUT||'/private/tmp/tourist-pilot-qa';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--enable-gpu','--use-angle=metal']});
const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out,size:{width:1440,height:1000}}});
const page=await context.newPage(),errors=[];page.setDefaultTimeout(60000);
page.on('pageerror',e=>errors.push(e.message));
const shot=async name=>{await page.screenshot({path:`${out}/${name}.png`});console.log('SCREEN',name);};
try{
 await page.addInitScript(()=>{
   if(!localStorage.getItem('qa_seeded')){localStorage.setItem('qa_seeded','1');localStorage.setItem('ta_demo_pwv_balance','777');localStorage.setItem('ta_demo_ticket_orders','[{"city":"lasvegas","code":"legacy"}]');localStorage.setItem('ta_demo_coupons','4');}
 });
 await page.goto(`${base}/?review=1`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#glGo')&&!document.querySelector('#glGo').disabled,null,{timeout:180000});
 if(process.env.REQUIRE_ALL_ASSETS==='1')await page.waitForFunction(()=>document.querySelector('#loading')?.textContent==='地标模型 14/14',null,{timeout:300000});
 await page.locator('#glGo').click();await page.locator('#travelDialog[open]').waitFor();await page.waitForTimeout(2500);await shot('01-welcome');
 assert.equal(await page.locator('#hudSide [data-act="shop"]').count(),0);assert.equal(await page.locator('#hudPwv').count(),0);
 assert.equal(await page.locator('#city option').count(),2);
 await page.locator('[data-travel-interior="dubai:cruise_terminal"]').click();await page.locator('#interiorDialog[data-ready="true"]').waitFor();
 await page.locator('#interiorDialog[data-art-state="ready"]').waitFor();await shot('02-harbor-guide');
 await page.locator('[data-guide-next]').click();await page.locator('[data-guide-next]').click();
 assert.match(await page.locator('[data-guide-step]').innerText(),/3 \/ 3/);await page.locator('[data-guide-next]').click();
 await page.locator('#travelDialog[open]').waitFor();assert.match(await page.locator('#travelDialog h2').innerText(),/海港/);
 await shot('03-real-place');await page.locator('.travel-route-invite [data-travel-view="route"]').click();await shot('04-marina-route');
 await page.locator('[data-travel-add-route]').click();await page.locator('[data-travel-view="itinerary"]').first().click();
 assert.equal(await page.locator('.travel-stops li').count(),3);
 await page.locator('[data-travel-move="dubai:pier7"][data-delta="-1"]').click();
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ta_travel_passport_v1')));
 assert.deepEqual(saved.saved,['dubai:marina_mall','dubai:pier7','dubai:marina_promenade']);await shot('05-itinerary');
 const dl=page.waitForEvent('download');await page.locator('[data-travel-download]').click();const downloaded=await dl;await downloaded.saveAs(`${out}/itinerary.txt`);
 const text=await fs.readFile(`${out}/itinerary.txt`,'utf8');assert.match(text,/Pier 7/);assert.match(text,/google.com\/maps/);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#glGo')&&!document.querySelector('#glGo').disabled,null,{timeout:180000});await page.locator('#glGo').click();
 await page.locator('[data-travel-view="itinerary"]').first().click();assert.equal(await page.locator('.travel-stops li').count(),3);
 await page.locator('[data-travel-remove="dubai:pier7"]').click();assert.equal(await page.locator('.travel-stops li').count(),2);
 await page.locator('[data-travel-view="passport"]').click();await shot('06-passport');assert.match(await page.locator('#travelDialog').innerText(),/现场核验尚未接入/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('ta_demo_pwv_balance')),'777');assert.equal(await page.evaluate(()=>localStorage.getItem('ta_demo_coupons')),'4');
 await page.locator('[data-travel-view="places"]').click();await page.locator('[data-travel-city="abudhabi"]').click();await shot('07-abu-places');
 await page.locator('[data-travel-place="abudhabi:grand_mosque"]').click();await page.locator('[data-travel-interior="abudhabi:grand_mosque"]').click();await page.locator('#interiorDialog[data-ready="true"]').waitFor();await shot('08-mosque-guide');
 await page.locator('[data-interior-list]').click();
 for(const [city,ids] of [['dubai',['burj_khalifa','museum_future','atlantis','burj_al_arab','cruise_terminal']],['abudhabi',['grand_mosque','emirates_palace','ferrari_world','etihad_towers','abrahamic']]]){
  await page.locator(`[data-interior-city="${city}"]`).click();
  for(const id of ids){await page.locator(`[data-interior-room="${city}:${id}"]`).click();await page.locator('#interiorDialog[data-ready="true"]').waitFor();assert.match(await page.locator('[data-guide-copy]').innerText(),/./);await page.locator('[data-guide-next]').click();await page.locator('[data-guide-next]').click();await page.locator('[data-interior-list]').click();console.log('ROOM',city,id);}
 }
 await page.locator('[data-interior-close]').click();await page.waitForTimeout(1500);
 const assetStatus=await page.locator('#loading').innerText();console.log('REMOTE_ASSETS',assetStatus);
 await fs.writeFile(`${out}/remote-assets.txt`,assetStatus);
 if(process.env.REQUIRE_ALL_ASSETS==='1')assert.equal(assetStatus,'地标模型 14/14');
 await page.setViewportSize({width:390,height:844});await page.locator('#hudSide [data-act="travel"]').click();await shot('09-mobile-welcome');
 await page.locator('[data-travel-view="route"]').click();await shot('10-mobile-route');
 assert.ok(await page.locator('#travelDialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await page.locator('[data-travel-view="passport"]').click();await shot('11-mobile-passport');
 await page.locator('[data-travel-view="places"]').click();await page.locator('[data-travel-city="dubai"]').click();await page.locator('[data-travel-place="dubai:burj_khalifa"]').click();await page.locator('[data-travel-interior="dubai:burj_khalifa"]').click();await page.locator('#interiorDialog[data-ready="true"]').waitFor();await shot('12-mobile-interior');
 assert.ok(await page.locator('.interior-stage').evaluate(el=>el.clientHeight>=180));
 await page.keyboard.press('Escape');assert.equal(await page.locator('#interiorDialog[open]').count(),0);
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('ta_travel_events_v1')));assert.ok(data.some(e=>e.event==='guide_complete'));assert.ok(data.some(e=>e.event==='route_saved'));assert.ok(data.every(e=>!e.event.includes('paid')&&!e.event.includes('payment')));
 // Lightweight route must work with every Three.js/game/landmark request blocked.
 const light=await context.newPage(),blocked=[];light.on('pageerror',e=>errors.push(e.message));await light.route(/game\.js|three|resources\.parallelworld/,route=>{blocked.push(route.request().url());route.abort();});
 await light.goto(`${base}/?view=trip`);await light.locator('#travelDialog[open]').waitFor();await light.locator('[data-travel-add-route]').click();
 await light.screenshot({path:`${out}/13-light-itinerary.png`});
 assert.equal(blocked.length,0);await light.close();
 await fs.writeFile(`${out}/events.json`,JSON.stringify(data,null,2));await fs.writeFile(`${out}/errors.json`,JSON.stringify(errors,null,2));assert.deepEqual(errors,[]);
 console.log('PASS: two cities, ten room guides, saved/reordered/exported itinerary, legacy isolation, mobile, light fallback; remote asset availability recorded separately');
}catch(error){await shot('failure').catch(()=>{});await fs.writeFile(`${out}/errors.json`,JSON.stringify(errors,null,2));throw error;}
finally{await context.close();await browser.close();}
