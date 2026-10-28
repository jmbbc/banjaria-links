export const SHEET_URL='https://docs.google.com/spreadsheets/d/1zXi-0Gv97QcIeogjqG_3mU74oOi9t_4liyR-riSn2Sk/edit';
const FEED='https://docs.google.com/spreadsheets/d/1zXi-0Gv97QcIeogjqG_3mU74oOi9t_4liyR-riSn2Sk/gviz/tq';
const enabled=value=>value===true||value===1||['true','1','ya'].includes(String(value??'').trim().toLowerCase());
export function parseSheetResponse(response){
  if(response?.status!=='ok'||!Array.isArray(response.table?.cols)||!Array.isArray(response.table?.rows))throw new Error('Invalid sheet response');
  const names=response.table.cols.map(c=>String(c.label??'').trim().toLowerCase());
  for(const name of ['tajuk','penerangan','url','kategori','aktif','urutan','utama'])if(!names.includes(name))throw new Error('Missing column: '+name);
  const links=[];let skipped=0;
  response.table.rows.forEach((row,index)=>{
    const get=name=>row.c?.[names.indexOf(name)]?.v;
    if(!enabled(get('aktif')))return;
    const title=String(get('tajuk')??'').trim(),url=String(get('url')??'').trim();
    let parsed;try{parsed=new URL(url);}catch{skipped++;return;}
    if(!title||!['https:','http:','mailto:','tel:'].includes(parsed.protocol)){skipped++;return;}
    const order=Number(get('urutan'));
    links.push({title,desc:String(get('penerangan')??''),url,group:String(get('kategori')??'').trim()||'Lain-lain',featured:enabled(get('utama')),order:get('urutan')!==null&&get('urutan')!==undefined&&get('urutan')!==''&&Number.isFinite(order)?order:1000000+index,index});
  });
  links.sort((a,b)=>a.order-b.order||a.index-b.index);
  return {links,skipped};
}
export function loadSheetLinks({timeout=15000}={}){
  // Google's documented Visualization response handler avoids cross-origin CSV restrictions.
  return new Promise((resolve,reject)=>{
    const callback='bcLinks_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const script=document.createElement('script');let timer;
    const cleanup=()=>{clearTimeout(timer);script.remove();delete window[callback];};
    const fail=()=>{cleanup();reject(new Error('Sheet unavailable'));};
    window[callback]=data=>{cleanup();try{resolve(parseSheetResponse(data));}catch(error){reject(error);}};
    const url=new URL(FEED);url.searchParams.set('gid','1781923002');url.searchParams.set('headers','1');url.searchParams.set('range','A:G');url.searchParams.set('tqx','out:json;responseHandler:'+callback);url.searchParams.set('_',Date.now());
    script.src=url.href;script.onerror=fail;script.referrerPolicy='no-referrer';timer=setTimeout(fail,timeout);document.head.append(script);
  });
}
