# Sitenizi Nasıl Yayınlarsınız (Deploy)

Projeniz başarıyla derlendi (build edildi). Şimdi `dist` klasörünü yayınlayarak sitenizi internette paylaşabilirsiniz.

## Yöntem 1: Vercel (Önerilen)

Projeniz GitHub'a bağlı olduğu için Vercel en iyi seçenektir.

1.  [Vercel.com](https://vercel.com) adresine gidin ve GitHub hesabınızla giriş yapın.
2.  "Add New Project" butonuna tıklayın.
3.  GitHub reponuzu (`mervv` veya benzeri) seçin ve "Import" deyin.
4.  **Build Command:** `npm run build` (Otomatik algılanır)
5.  **Output Directory:** `dist` (Otomatik algılanır)
6.  **Environment Variables (ÖNEMLİ):** Projenin çalışması için aşağıdaki ayarları eklemelisiniz:
    *   `VITE_SUPABASE_URL`: Supabase Proje URL'niz (Örn: https://xyz.supabase.co)
    *   `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key'iniz (uzun şifreli metin)
7.  "Deploy" butonuna basın.

## Yöntem 2: Netlify (Manuel Sürükle-Bırak)

1.  Terminalde `npm run build` komutunu çalıştırın.
2.  Tarayıcınızda [Netlify Drop](https://app.netlify.com/drop) adresine gidin.
3.  Bilgisayarınızdaki proje klasörünün içindeki **`dist`** klasörünü bulun.
4.  Bu `dist` klasörünü sürükleyip Netlify sayfasındaki kutucuğa bırakın.
5.  Siteniz saniyeler içinde yayına girecek.

## Sitemi Nasıl Güncellerim?

**Vercel (GitHub Bağlantılı):**
Sadece kodunuzu GitHub'a gönderin (`git push`). Vercel otomatik olarak algılayıp sitenizi güncelleyecektir.

**Manuel Yöntem:**
1.  Değişikliklerinizi yapın.
2.  `npm run build` çalıştırın.
3.  Yeni `dist` klasörünü tekrar yükleyin.
