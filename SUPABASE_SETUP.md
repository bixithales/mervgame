# Supabase Kurulum Kılavuzu

Firebase yerine Supabase kullanmak için aşağıdaki adımları takip edin. Bu işlem çok daha hızlı ve kolaydır.

## 1. Proje Oluşturma
1. [Supabase.com](https://supabase.com/) adresine gidin ve giriş yapın.
2. **"New Project"** butonuna basın.
3. İsim: `MerveGame` (veya istediğiniz bir şey).
4. Şifre: Güçlü bir şifre belirleyin.
5. Region: Size yakın bir yer (örn. Frankfurt) seçin.
6. **"Create new project"** deyin ve birkaç dakika bekleyin.

## 2. Tablo Oluşturma (Veritabanı)
Oyun verilerini tutmak için bir tabloya ihtiyacımız var.
1. Sol menüden **Table Editor** (Tablo ikonu) seçeneğine tıklayın.
2. **"Create a new table"** butonuna basın.
3. Name: `games`
4. "Enable Realtime" kutucuğunu **MUTLAKA İŞARETLEYİN**. (Canlı takip için şart).
5. Columns (Sütunlar) kısmına şunları ekleyin:
   - `id` (text) -> Primary Key olarak kalsın.
   - `stage` (int4) -> Default Value: `0`
   - `status` (text) -> Default Value: `'init'`
   - `history` (jsonb) -> (Logları tutmak için)
   - `proof_url` (text)
   - `last_update` (timestamptz)
6. **Save** diyerek kaydedin.

## 3. Storage (Dosya Yükleme) Ayarı
Fotoğraflar için bir alan açalım.
1. Sol menüden **Storage** (Kutu ikonu) seçeneğine tıklayın.
2. **"New Bucket"** butonuna basın.
3. Name: `proofs`
4. "Public bucket" seçeneğini **AÇIK** yapın.
5. **Save** deyin.

## 4. API Anahtarlarını Alma
Projeyi koda bağlamak için anahtarlara ihtiyacımız var.
1. Sol menüden en alttaki **Project Settings** (Çark ikonu) seçeneğine tıklayın.
2. **API** sekmesine gelin.
3. Orada `Project URL` ve `anon public` Key göreceksiniz.
4. Bu bilgileri kopyalayıp bana verin veya `src/App.jsx` dosyasına kendiniz yapıştırın.

## 5. Güvenlik Politikaları (RLS) - Hızlı Başlangıç
Veritabanına yazabilmek için izinleri açmamız lazım.
1. **SQL Editor** (Sol menüde terminal ikonu) kısmına gelin.
2. Şu kodu yapıştırıp **Run** deyin:
```sql
-- Tablo izinleri (Herkes okuyup yazabilsin)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON games FOR ALL USING (true) WITH CHECK (true);

-- Storage izinleri
CREATE POLICY "Public Storage" ON storage.objects FOR ALL USING ( bucket_id = 'proofs' );
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', true) ON CONFLICT DO NOTHING;
```
