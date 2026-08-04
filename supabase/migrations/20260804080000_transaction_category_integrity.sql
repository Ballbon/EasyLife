alter table public.categories
  add constraint categories_id_user_type_key
  unique (id, user_id, transaction_type);

alter table public.transactions
  drop constraint transactions_category_owner_fk;

alter table public.transactions
  add constraint transactions_category_owner_fk
  foreign key (category_id, user_id, transaction_type)
  references public.categories (id, user_id, transaction_type);
