import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSheetResponse} from '../sheet-links.mjs';
const headers=['Tajuk','Penerangan','URL','Kategori','Aktif','Urutan','Utama'];
const feed=rows=>({status:'ok',table:{cols:headers.map(label=>({label})),rows:rows.map(r=>({c:r.map(v=>v===null?null:{v})}))}});
test('disabled and unfinished links stay hidden; active links sort and new categories work',()=>{
 const result=parseSheetResponse(feed([
 ['Hidden','','https://example.com','Urusan',false,1,false],
 ['Later','','https://example.com/later','Urusan',true,20,false],
 ['New, "link"','Line 1\nLine 2','https://example.com/new','Kategori baharu','TRUE',10,true],
 ['Draft','','https://example.com/draft','Urusan',null,0,false]
 ]));
 assert.deepEqual(result.links.map(l=>l.title),['New, "link"','Later']);assert.equal(result.links[0].featured,true);assert.equal(result.links[0].group,'Kategori baharu');
});
test('unsafe destinations are rejected; email and telephone work',()=>{
 const result=parseSheetResponse(feed([['Bad','','javascript:alert(1)','',true,1,false],['Email','','mailto:office@example.com','',true,2,false],['Call','','tel:+60123456789','',true,3,false]]));
 assert.equal(result.skipped,1);assert.equal(result.links.length,2);assert.equal(result.links[0].group,'Lain-lain');
});
test('empty active set remains empty and malformed feeds fail instead of reviving old links',()=>{
 assert.deepEqual(parseSheetResponse(feed([])).links,[]);assert.throws(()=>parseSheetResponse({status:'error'}));assert.throws(()=>parseSheetResponse({status:'ok',table:{cols:[],rows:[]}}));
});
