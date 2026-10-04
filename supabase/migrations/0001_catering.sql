create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table clients (id uuid primary key default gen_random_uuid(), name text not null, email text, phone text, notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_clients before update on clients for each row execute function touch_updated_at();
create table events (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, client_id uuid not null references clients(id), event_date date not null, service_time text not null default '', venue text not null default '', guests integer not null check(guests>0), status text not null default 'inquiry' check(status in ('inquiry','tentative','confirmed','completed','cancelled')), currency text not null default 'NZD' check(currency in ('NZD','AUD','USD')), tax_rate numeric(5,4) not null default 0 check(tax_rate between 0 and 1), deposit_due date, deposit_cents bigint not null default 0 check(deposit_cents>=0), balance_due date, last_contact date not null default current_date, dietary_reviewed boolean not null default false, notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_events before update on events for each row execute function touch_updated_at();
create table menus (id uuid primary key default gen_random_uuid(), name text not null unique, description text not null default '', allergens text not null default 'UNVERIFIED', price_cents bigint not null check(price_cents>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_menus before update on menus for each row execute function touch_updated_at();
create table ingredients (id uuid primary key default gen_random_uuid(), name text not null unique, unit text not null, cost_cents numeric(12,2) not null check(cost_cents>=0), supplier text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_ingredients before update on ingredients for each row execute function touch_updated_at();
create table recipes (id uuid primary key default gen_random_uuid(), menu_id uuid not null references menus(id), ingredient_id uuid not null references ingredients(id), quantity numeric(12,4) not null check(quantity>0), unique(menu_id,ingredient_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_recipes before update on recipes for each row execute function touch_updated_at();
create table lines (id uuid primary key default gen_random_uuid(), event_id uuid not null references events(id), menu_id uuid references menus(id), name text not null, category text not null default 'food' check(category in ('food','beverage','staff','rental','fee')), quantity numeric(12,3) not null check(quantity>0), unit_price_cents bigint not null check(unit_price_cents>=0), unit_cost_cents numeric(12,2) check(unit_cost_cents>=0), notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_lines before update on lines for each row execute function touch_updated_at();
create table dietary (id uuid primary key default gen_random_uuid(), event_id uuid not null references events(id), name text not null, guests integer not null check(guests>0), instructions text not null, reviewed_by text, reviewed_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_dietary before update on dietary for each row execute function touch_updated_at();
create table packing (id uuid primary key default gen_random_uuid(), event_id uuid not null references events(id), name text not null, quantity integer not null check(quantity>0), packed integer not null default 0 check(packed>=0 and packed<=quantity), responsible text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_packing before update on packing for each row execute function touch_updated_at();
create table roster (id uuid primary key default gen_random_uuid(), event_id uuid not null references events(id), name text not null, role text not null, start_at timestamptz not null, end_at timestamptz not null, check(end_at>start_at), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_roster before update on roster for each row execute function touch_updated_at();
create table payments (id uuid primary key default gen_random_uuid(), event_id uuid not null references events(id), reference text not null unique, amount_cents bigint not null check(amount_cents>0), paid_on date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_payments before update on payments for each row execute function touch_updated_at();
create table food_logs (id uuid primary key default gen_random_uuid(), event_id uuid not null references events(id), name text not null, mode text not null check(mode in ('cold','hot','cooling')), temperature_c numeric(5,2), exposure_minutes integer check(exposure_minutes>=0), first_cooling_minutes integer check(first_cooling_minutes>=0), second_cooling_minutes integer check(second_cooling_minutes>=0), observed_at timestamptz not null, operator text not null, corrective_action text not null default '', jurisdiction text not null check(jurisdiction in ('AU','NZ')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_food_logs before update on food_logs for each row execute function touch_updated_at();
create table notes (id uuid primary key default gen_random_uuid(), event_id uuid not null references events(id), name text not null, body text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_notes before update on notes for each row execute function touch_updated_at();

create index events_date on events(event_date);
create index lines_event on lines(event_id);
create index logs_event on food_logs(event_id);
create view event_totals as
select e.*,c.name client,
 coalesce(l.net_cents,0)::bigint net_cents,
 round(coalesce(l.net_cents,0)*e.tax_rate)::bigint tax_cents,
 (coalesce(l.net_cents,0)+round(coalesce(l.net_cents,0)*e.tax_rate))::bigint total_cents,
 coalesce(l.cost_cents,0)::bigint known_cost_cents,
 coalesce(l.missing_costs,0)::integer missing_costs,
 case when coalesce(l.missing_costs,0)=0 and l.net_cents is not null then (l.net_cents-l.cost_cents)::bigint end margin_cents,
 coalesce(p.paid_cents,0)::bigint paid_cents,
 (coalesce(l.net_cents,0)+round(coalesce(l.net_cents,0)*e.tax_rate)-coalesce(p.paid_cents,0))::bigint balance_cents,
 greatest(e.deposit_cents-coalesce(p.paid_cents,0),0)::bigint deposit_remaining_cents
from events e join clients c on c.id=e.client_id
left join (select event_id,sum(round(quantity*unit_price_cents)) net_cents,sum(round(quantity*unit_cost_cents)) cost_cents,count(*) filter(where unit_cost_cents is null) missing_costs from lines group by event_id) l on l.event_id=e.id
left join (select event_id,sum(amount_cents) paid_cents from payments group by event_id) p on p.event_id=e.id;
create view kitchen_prep as
select e.id event_id,e.code,e.event_date,e.name event,l.name item,l.quantity portions,m.allergens,l.notes
from events e join lines l on e.id=l.event_id left join menus m on m.id=l.menu_id
where e.status='confirmed' and l.category in ('food','beverage');
create view attention_queue as
select id event_id,code,name,event_date,'Overdue deposit' issue from event_totals where status in ('confirmed','tentative') and deposit_due<current_date and deposit_remaining_cents>0
union all select id,code,name,event_date,'Overdue balance' from event_totals where status in ('confirmed','completed') and balance_due<current_date and balance_cents>0
union all select id,code,name,event_date,'Stale enquiry' from events where status in ('inquiry','tentative') and last_contact<current_date-7
union all select id,code,name,event_date,'Dietary review missing' from events where status='confirmed' and not dietary_reviewed
union all select id,code,name,event_date,'Missing cost evidence' from event_totals where missing_costs>0 and status<>'cancelled';
create view food_checks as
select f.id,f.event_id,e.code,f.name,f.jurisdiction,f.observed_at,f.corrective_action,
case when f.jurisdiction='NZ' then 'REVIEW AGAINST REGISTERED FOOD CONTROL PLAN'
when f.mode='cooling' and (f.first_cooling_minutes is null or f.second_cooling_minutes is null or f.temperature_c is null) then 'MISSING COOLING EVIDENCE'
when f.mode='cooling' and (f.first_cooling_minutes>120 or f.second_cooling_minutes>240 or f.temperature_c>5) then 'COOLING LIMIT EXCEEDED'
when f.mode='cooling' then 'RECORDED COOLING TIMES WITHIN LIMITS'
when f.temperature_c is null then 'MISSING TEMPERATURE'
when f.exposure_minutes is null then 'MISSING CUMULATIVE EXPOSURE'
when f.exposure_minutes>=240 then 'DISCARD: EXPOSURE AT LEAST 4 HOURS'
when f.exposure_minutes>=120 then 'USE NOW: DO NOT REFRIGERATE'
when (f.mode='cold' and f.temperature_c<=5) or (f.mode='hot' and f.temperature_c>=60) then 'RECORDED HOLDING TEMPERATURE WITHIN LIMIT'
else 'TEMPERATURE OUTSIDE HOLDING LIMIT: REVIEW EXPOSURE' end finding
from food_logs f join events e on e.id=f.event_id;
