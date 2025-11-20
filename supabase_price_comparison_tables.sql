-- Fiyat Karşılaştırma Tabloları
-- Bu SQL dosyasını Supabase SQL Editor'de çalıştırın

-- 1. price_comparisons tablosu
CREATE TABLE IF NOT EXISTS price_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_name TEXT NOT NULL,
    total_products INTEGER DEFAULT 0,
    avg_price_difference DECIMAL(10, 2) DEFAULT 0,
    analysis_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. price_update_suggestions tablosu
CREATE TABLE IF NOT EXISTS price_update_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID REFERENCES price_comparisons(id) ON DELETE CASCADE,
    stock_code TEXT NOT NULL,
    current_purchase_price DECIMAL(10, 2),
    suggested_purchase_price DECIMAL(10, 2),
    current_sales_price DECIMAL(10, 2),
    suggested_sales_price DECIMAL(10, 2),
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexler - Performans için
CREATE INDEX IF NOT EXISTS idx_price_comparisons_user_id ON price_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_price_comparisons_upload_date ON price_comparisons(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_update_suggestions_comparison_id ON price_update_suggestions(comparison_id);
CREATE INDEX IF NOT EXISTS idx_price_update_suggestions_stock_code ON price_update_suggestions(stock_code);
CREATE INDEX IF NOT EXISTS idx_price_update_suggestions_status ON price_update_suggestions(status);

-- Row Level Security (RLS) Politikaları
ALTER TABLE price_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_update_suggestions ENABLE ROW LEVEL SECURITY;

-- price_comparisons için RLS politikaları
CREATE POLICY "Users can view their own price comparisons"
    ON price_comparisons FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price comparisons"
    ON price_comparisons FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price comparisons"
    ON price_comparisons FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price comparisons"
    ON price_comparisons FOR DELETE
    USING (auth.uid() = user_id);

-- price_update_suggestions için RLS politikaları
CREATE POLICY "Users can view all price update suggestions"
    ON price_update_suggestions FOR SELECT
    USING (true);

CREATE POLICY "Users can insert price update suggestions"
    ON price_update_suggestions FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update suggestions they created"
    ON price_update_suggestions FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete suggestions they created"
    ON price_update_suggestions FOR DELETE
    USING (auth.uid() = created_by);

-- Trigger fonksiyonu - updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger - price_update_suggestions tablosuna ekle
CREATE TRIGGER update_price_update_suggestions_updated_at
    BEFORE UPDATE ON price_update_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

