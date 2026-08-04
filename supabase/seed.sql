insert into public.category_templates (code, name_th, transaction_type, color, icon, sort_order)
values
  ('salary', 'เงินเดือน', 'income', '#16A34A', 'wallet-cards', 10),
  ('bonus', 'โบนัส', 'income', '#22C55E', 'gift', 20),
  ('other-income', 'รายรับอื่น', 'income', '#4ADE80', 'circle-plus', 30),
  ('food', 'อาหาร', 'expense', '#F97316', 'utensils', 110),
  ('transport', 'เดินทาง', 'expense', '#3B82F6', 'bus', 120),
  ('home', 'ที่อยู่อาศัย', 'expense', '#8B5CF6', 'house', 130),
  ('utilities', 'ค่าน้ำไฟ/อินเทอร์เน็ต', 'expense', '#EAB308', 'bolt', 140),
  ('shopping', 'ช้อปปิ้ง', 'expense', '#EC4899', 'shopping-bag', 150),
  ('health', 'สุขภาพ', 'expense', '#EF4444', 'heart-pulse', 160),
  ('education', 'การศึกษา', 'expense', '#06B6D4', 'book-open', 170),
  ('entertainment', 'ความบันเทิง', 'expense', '#A855F7', 'gamepad-2', 180),
  ('other-expense', 'รายจ่ายอื่น', 'expense', '#64748B', 'ellipsis', 190)
on conflict (code) do update set
  name_th = excluded.name_th,
  transaction_type = excluded.transaction_type,
  color = excluded.color,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
