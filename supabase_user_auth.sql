-- -----------------------------------------------------------------------------
-- SCRIPT RESET & KHỞI TẠO TÀI KHOẢN TRÊN SUPABASE (QA BRAIN CENTER)
-- Chạy trực tiếp file này trong Supabase Project ➔ SQL Editor
-- -----------------------------------------------------------------------------

-- 1. Tạo bảng user_profiles nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  role TEXT NOT NULL,
  "avatarUrl" TEXT,
  "passwordHash" TEXT DEFAULT '123456',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
);

-- Thêm cột passwordHash nếu thiếu
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS "passwordHash" TEXT DEFAULT '123456';

-- Bật phân quyền Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.user_profiles;
CREATE POLICY "Allow anonymous read access" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.user_profiles FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.user_profiles FOR DELETE USING (true);

-- 2. Thêm cột mới cho bảng kanban_tasks
ALTER TABLE public.kanban_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.kanban_tasks ADD COLUMN IF NOT EXISTS "assigneeId" TEXT;
ALTER TABLE public.kanban_tasks ADD COLUMN IF NOT EXISTS "isReleased" BOOLEAN DEFAULT false;

-- 3. XÓA SẠCH DỮ LIỆU TÀI KHOẢN CŨ VÀ TẠO MỚI THEO Ý MỤC TIÊU
TRUNCATE TABLE public.user_profiles;

-- Thêm danh sách Tài khoản Nhân sự mới (Mật khẩu mặc định là: 123456)
-- Bạn có thể chỉnh sửa Email, Họ tên, Vai trò và Mật khẩu tùy ý bên dưới:
INSERT INTO public.user_profiles (id, email, "fullName", role, "passwordHash", "avatarUrl")
VALUES
  ('usr-1', 'baoqc@med.vn',      'Quốc Bảo',   'Dev Lead',          '123456', 'https://api.dicebear.com/7.x/initials/svg?seed=QuocBao'),
  ('usr-2', 'tuanba@med.vn',     'Minh Tuấn',  'Business Analyst',  '123456', 'https://api.dicebear.com/7.x/initials/svg?seed=MinhTuan'),
  ('usr-3', 'phuonganh@med.vn',  'Phương Anh', 'QA Lead',           '123456', 'https://api.dicebear.com/7.x/initials/svg?seed=PhuongAnh'),
  ('usr-4', 'namtran@med.vn',    'Trần Nam',   'QA Engineer',       '123456', 'https://api.dicebear.com/7.x/initials/svg?seed=TranNam'),
  ('usr-5', 'longhoang@med.vn',   'Hoàng Long', 'Product Owner',     '123456', 'https://api.dicebear.com/7.x/initials/svg?seed=HoangLong');
