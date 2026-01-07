-- Индексы для оптимизации производительности

-- Индексы для blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_active ON blog_posts(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_date ON blog_posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_active ON blog_posts(category, is_active) WHERE is_active = TRUE;

-- Индексы для testimonials (проверяем наличие колонок перед созданием индексов)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'testimonials' AND column_name = 'is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON testimonials(is_active);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'testimonials' AND column_name = 'display_order') THEN
    CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON testimonials(display_order);
  END IF;
END $$;

-- Индексы для contacts
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON contacts(is_active);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'display_order') THEN
    CREATE INDEX IF NOT EXISTS idx_contacts_display_order ON contacts(display_order);
  END IF;
END $$;

-- Индексы для team_members
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(is_active);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'display_order') THEN
    CREATE INDEX IF NOT EXISTS idx_team_members_display_order ON team_members(display_order);
  END IF;
END $$;

-- Индекс для admins (поиск по email)
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(LOWER(TRIM(email)));

