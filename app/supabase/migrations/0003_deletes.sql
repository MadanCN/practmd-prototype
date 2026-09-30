-- Allow editors to delete roadmap items and challenges (archive remains available).
-- Change history (roadmap_item_history) and challenge notes are removed with their parent via
-- the existing ON DELETE CASCADE foreign keys.

create policy "editors delete items" on public.roadmap_items for delete using (can_edit());
create policy "editors delete challenges" on public.challenges for delete using (can_edit());

-- When an item is deleted, drop its code from other items' dependencies and from any
-- challenge that links to it, so nothing points at a missing item.
create or replace function public.forget_deleted_item() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update roadmap_items set depends_on_codes = array_remove(depends_on_codes, old.code)
    where old.code = any(depends_on_codes);
  update challenges set related_item_code = null where related_item_code = old.code;
  return old;
end $$;

create trigger roadmap_items_forget after delete on public.roadmap_items
  for each row execute function public.forget_deleted_item();
