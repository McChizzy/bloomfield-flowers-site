-- Black Friday Week 2026 (Fri 20 Nov to Black Friday 27 Nov, 12 noon): same offer as Girlfriend's Day (GFDAY5).
-- 5% off any order + free delivery when the bouquet subtotal is ₦250,000 or more.
-- Expires at 12 noon Nigeria time on Black Friday, 27 Nov 2026. Run in the Supabase SQL editor.
-- The code works as soon as this runs (there is no start date), so run it when you want testing to begin.
insert into discount_codes (code, type, value, free_delivery_threshold, min_order, max_uses, expires_at, active)
values ('BFFRIDAY', 'percent', 5, 250000, 0, null, '2026-11-27 12:00:00+01', true)
on conflict (code) do update set
  type = excluded.type,
  value = excluded.value,
  free_delivery_threshold = excluded.free_delivery_threshold,
  min_order = excluded.min_order,
  max_uses = excluded.max_uses,
  expires_at = excluded.expires_at,
  active = excluded.active;

-- To switch it off early:
-- update discount_codes set active = false where code = 'BFFRIDAY';
