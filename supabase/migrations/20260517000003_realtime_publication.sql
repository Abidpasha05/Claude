-- Enable Supabase Realtime on order tables so the customer-facing tracking
-- page and the admin orders view can subscribe to live changes.

do $$
begin
  begin
    alter publication supabase_realtime add table orders;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table order_status_history;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table notifications;
  exception when duplicate_object then null;
  end;
end $$;

-- Replica identity FULL lets RLS evaluate row contents on UPDATE/DELETE events.
alter table orders replica identity full;
alter table order_status_history replica identity full;
