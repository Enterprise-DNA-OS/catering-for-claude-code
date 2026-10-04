#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb, REPO_ROOT} from './lib/db.mjs';
import {table} from './lib/format.mjs';
import {parseCsv,pick} from './lib/csv.mjs';

export const entities=['clients','events','menus','ingredients','recipes','lines','dietary','packing','roster','payments','food_logs','notes'];
const refs={client_id:'clients',event_id:'events',menu_id:'menus',ingredient_id:'ingredients'};
export const reads={
 clients:'select id,name,email,phone,notes from clients order by name,id',
 menus:'select id,name,description,allergens,price_cents from menus order by name',
 ingredients:'select id,name,unit,cost_cents,supplier from ingredients order by name',
 recipes:'select m.name menu,i.name ingredient,r.quantity,i.unit,round(r.quantity*i.cost_cents) ingredient_cost_cents from recipes r join menus m on m.id=r.menu_id join ingredients i on i.id=r.ingredient_id order by m.name,i.name',
 events:'select code,name,client,event_date,status,guests,currency,total_cents from event_totals where event_date between $1 and $2 order by event_date,code',
 'event-week':"select code,name,event_date,status,guests,venue from events where event_date between $1 and $2 and status<>'cancelled' order by event_date,code",
 enquiries:"select code,name,event_date,last_contact,status from events where status in ('inquiry','tentative') order by last_contact,code",
 prep:'select code,event_date,item,portions,allergens,notes from kitchen_prep where event_date between $1 and $2 order by event_date,code,item',
 shopping:"select i.name ingredient,i.unit,i.supplier,sum(r.quantity*l.quantity) quantity from events e join lines l on e.id=l.event_id join recipes r on r.menu_id=l.menu_id join ingredients i on i.id=r.ingredient_id where e.status='confirmed' and e.event_date between $1 and $2 group by i.id order by i.name",
 'recipe-gaps':"select e.code,l.name item from events e join lines l on e.id=l.event_id where e.status='confirmed' and l.category='food' and not exists(select 1 from recipes r where r.menu_id=l.menu_id) order by e.code,l.name",
 dietary:'select e.code,d.name,d.guests,d.instructions,d.reviewed_by,d.reviewed_on from dietary d join events e on e.id=d.event_id where e.event_date between $1 and $2 order by e.event_date,e.code,d.name',
 dispatch:"select e.code,e.event_date,e.service_time,e.venue,p.name item,p.quantity,p.packed,p.quantity-p.packed remaining,p.responsible from events e join packing p on p.event_id=e.id where e.status='confirmed' and e.event_date between $1 and $2 order by e.event_date,e.code,p.name",
 roster:'select e.code,r.name,r.role,r.start_at,r.end_at from roster r join events e on e.id=r.event_id where e.event_date between $1 and $2 order by r.start_at,r.name',
 clashes:'select a.name,a.event_id first_event,b.event_id second_event,a.start_at,a.end_at from roster a join roster b on lower(a.name)=lower(b.name) and a.id<b.id and a.start_at<b.end_at and b.start_at<a.end_at order by a.name,a.start_at',
 deposits:"select code,name,deposit_due,currency,deposit_remaining_cents from event_totals where status in ('tentative','confirmed') and deposit_remaining_cents>0 order by deposit_due nulls last,code",
 balances:"select code,name,balance_due,currency,total_cents,paid_cents,balance_cents from event_totals where status in ('confirmed','completed') and balance_cents<>0 order by balance_due nulls last,code",
 profit:"select code,name,currency,net_cents,known_cost_cents,missing_costs,margin_cents from event_totals where status in ('confirmed','completed') and event_date between $1 and $2 order by event_date,code",
 tax:"select currency,tax_rate,sum(net_cents)::bigint net_cents,sum(tax_cents)::bigint tax_cents from event_totals where status='completed' and event_date between $1 and $2 group by currency,tax_rate order by currency,tax_rate",
 attention:'select code,name,event_date,issue from attention_queue order by event_date,code,issue',
 compliance:'select code,name,jurisdiction,observed_at,finding,corrective_action from food_checks order by observed_at,code,name',
};
function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`Invalid ISO date: ${s}`);return s;}
export function options(args){const opts={},pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(!['json','from','to','data','file','dry-run','out','mapping'].includes(k))throw Error(`Unknown option: ${k}`);opts[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {opts,pos};}
export async function resolve(db,t,value){if(!entities.includes(t))throw Error('Unknown entity');const cols=t==='events'?"id,code,name":"id,name";const s=String(value||'');if(!s)throw Error(`Missing ${t} reference`);const rows=await db.query(`select ${cols} from ${t} where id::text=$1 or lower(name)=lower($1) ${t==='events'?'or lower(code)=lower($1)':''} order by id`,[s]);if(rows.length===1)return rows[0].id;const found=rows.length?rows:await db.query(`select ${cols} from ${t} where left(id::text,length($1))=$1 or position(lower($1) in lower(name))>0 order by id`,[s]);if(found.length!==1)throw Error(`${found.length?'Ambiguous':'No matching'} ${t}: ${s}\n${found.map(x=>`${x.id} ${x.code||''} ${x.name}`).join('\n')}`);return found[0].id;}
async function write(db,t,data,id=null){
 if(!entities.includes(t))throw Error(`Unknown entity: ${t}`);
 if(!data||Array.isArray(data)||typeof data!=='object')throw Error('Data must be an object');
 if(id&&['payments','food_logs','notes'].includes(t))throw Error(`${t} is append-only; add a correction note`);
 const columns=await db.query('select column_name,data_type from information_schema.columns where table_schema=current_schema() and table_name=$1',[t]);
 const types=new Map(columns.map(c=>[c.column_name,c.data_type]));
 const keys=Object.keys(data);if(!keys.length)throw Error('No fields supplied');
 for(const k of keys){if(!types.has(k)||['id','created_at','updated_at'].includes(k))throw Error(`Unknown or protected field: ${k}`);if(typeof data[k]==='string'&&!data[k].trim()&&!['notes','phone','email','service_time','venue','corrective_action','responsible','supplier'].includes(k))throw Error(`Empty field: ${k}`);if(data[k]!==null&&types.get(k)==='date')date(String(data[k]));if(data[k]!==null&&refs[k])data[k]=await resolve(db,refs[k],data[k]);}
 const vals=keys.map(k=>data[k]);
 if(id){return db.query(`update ${t} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`,[...vals,id]);}
 return db.query(`insert into ${t} (${keys.join(',')}) values (${keys.map((_,i)=>`$${i+1}`).join(',')}) returning *`,vals);
}
function getData(opts){if(!opts.data)throw Error('Use --data=\'{"field":"value"}\'');return JSON.parse(opts.data);}
export async function run(db,args){
 const {opts,pos}=options(args);const [cmd='help',arg,ref]=pos;
 const from=date(opts.from||new Date().toISOString().slice(0,10));const to=date(opts.to||new Date(Date.now()+6*86400000).toISOString().slice(0,10));
 if(from>to)throw Error('--from must precede --to');
 if(cmd==='help')return [{commands:[...Object.keys(reads),'event <name/code/id>','add <entity> --data=JSON','edit <entity> <id> --data=JSON','log <event> --data=JSON','import better-cater --file=CSV [--mapping=JSON] [--dry-run]','export [--out=FILE]','draft-weekly'].join('\n')}];
 if(reads[cmd])return db.query(reads[cmd],reads[cmd].includes('$1')?[from,to]:[]);
 if(cmd==='event'){
  const id=await resolve(db,'events',arg),event=(await db.query('select * from event_totals where id=$1',[id]))[0];
  const result={event};for(const t of ['lines','dietary','packing','roster','payments','food_logs','notes'])result[t]=await db.query(`select * from ${t} where event_id=$1 order by created_at,id`,[id]);return result;
 }
 if(cmd==='add')return write(db,arg,getData(opts));
 if(cmd==='edit'){
  if(!entities.includes(arg))throw Error('Unknown entity');
  // Entities without names use exact UUIDs; named entities accept human references.
  let id;if(['recipes','payments'].includes(arg)){const rows=await db.query(`select id from ${arg} where id::text=$1`,[ref]);if(!rows.length)throw Error('No matching record');id=rows[0].id;}else id=await resolve(db,arg,ref);
  return write(db,arg,getData(opts),id);
 }
 if(cmd==='log'){const data=getData(opts);data.event_id=await resolve(db,'events',arg);return write(db,'notes',data);}
 if(cmd==='import'){
  if(arg!=='better-cater'||!opts.file)throw Error('import better-cater requires --file=CSV');
  const rows=parseCsv(fs.readFileSync(opts.file,'utf8'));if(!rows.length)throw Error('No import rows');
  const mapping=opts.mapping?JSON.parse(fs.readFileSync(opts.mapping,'utf8')):{};
  const get=(r,k,...aliases)=>mapping[k]?pick(r,mapping[k]):pick(r,k,...aliases);
  let inserted=0,unchanged=0;const seen=new Set();await db.exec('BEGIN');
  try{for(const row of rows){
   const code=get(row,'code','Event ID'),name=get(row,'name','Event Name'),client=get(row,'client','Client'),dt=get(row,'event_date','Event Date'),g=get(row,'guests','Guest Count'),status=get(row,'status','Status').toLowerCase(),currency=get(row,'currency','Currency');
   if(!code||!name||!client||!dt||!g||!status||!currency)throw Error('Each row needs code, name, client, event_date, guests, status and currency');
   if(seen.has(code))throw Error(`Duplicate event code: ${code}`);seen.add(code);
   if(!/^\d+$/.test(g)||Number(g)<=0)throw Error(`Invalid guest count: ${g}`);
   const data={code,name,client_id:await resolve(db,'clients',client),event_date:date(dt),guests:Number(g),status,currency,venue:get(row,'venue','Venue')};
   const old=(await db.query('select * from events where code=$1',[code]))[0];
   if(old){for(const [k,v] of Object.entries(data))if(String(old[k])!==String(v))throw Error(`Conflict for ${code}: ${k}; reconcile before importing`);unchanged++;}
   else {await write(db,'events',data);inserted++;}
  }await db.exec(opts['dry-run']?'ROLLBACK':'COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  return [{inserted,unchanged,dry_run:Boolean(opts['dry-run']),scope:'Event headers only; amounts, menus, signatures and history require separate mapping.'}];
 }
 if(cmd==='export'){
  const data={format:'catering-v1',exported_at:new Date().toISOString()};await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ');
  try{for(const t of entities)data[t]=await db.query(`select * from ${t} order by id`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  if(opts.out){const out=path.resolve(opts.out);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');return [{file:out}];}return data;
 }
 if(cmd==='draft-weekly'){
  const blocks=[];for(const c of ['event-week','attention','prep']){const rows=await run(db,[c,`--from=${from}`,`--to=${to}`]);blocks.push(`## ${c}\n\n${format(rows)}`);}
  const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`weekly-${from}.md`);fs.writeFileSync(file,`# Catering week ${from}\n\nDRAFT. Check with the event captain before sharing.\n\n${blocks.join('\n\n')}\n`);return [{file}];
 }
 throw Error(`Unknown command: ${cmd}. Run help.`);
}
export function format(result){if(!Array.isArray(result))return JSON.stringify(result,null,2);if(!result.length)return '(none)';return table(result,Object.keys(result[0]).map(key=>({key,label:key,format:v=>v===null?'UNKNOWN':typeof v==='object'?JSON.stringify(v):String(v)})));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const args=process.argv.slice(2),result=await run(db,args);console.log(args.includes('--json')?JSON.stringify(result,null,2):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
