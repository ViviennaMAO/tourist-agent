import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {loadArtwork,CITY_ART} from '../src/interior-art.js';
import {existsSync} from 'node:fs';

test('city paintings are bundled local assets',()=>{for(const art of Object.values(CITY_ART))assert.ok(existsSync(new URL('../public'+art.src,import.meta.url)));});
test('artwork released during download does not attach to a closed room',async()=>{
 let complete,disposed=0;const texture=new THREE.Texture();texture.addEventListener('dispose',()=>disposed++);
 const loader={load(url,ok){complete=ok;return texture;}},m=new THREE.MeshStandardMaterial();
 const art=loadArtwork(m,'/test.jpg',loader);art.dispose();art.dispose();complete(texture);
 assert.equal(await art.ready,false);assert.equal(m.map,null);assert.equal(disposed,1);m.dispose();
});
test('artwork loads in sRGB and releases its texture once',async()=>{
 let complete,disposed=0;const texture=new THREE.Texture();texture.addEventListener('dispose',()=>disposed++);
 const m=new THREE.MeshStandardMaterial(),art=loadArtwork(m,'/test.jpg',{load(url,ok){complete=ok;return texture;}});
 complete(texture);assert.equal(await art.ready,true);assert.equal(m.map,texture);assert.equal(texture.colorSpace,THREE.SRGBColorSpace);art.dispose();art.dispose();assert.equal(disposed,1);m.dispose();
});
