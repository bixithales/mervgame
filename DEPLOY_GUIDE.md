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

## Yöntem 2: Netlify (En İyi Alternatif - Tamamen Ücretsiz)

Vercel ile sorun yaşarsanız (Pro üyelik hatası vb.), Netlify harika bir alternatiftir.

### Seçenek A: GitHub ile Bağlama (Otomatik Güncelleme) - ÖNERİLEN
1.  [Netlify.com](https://www.netlify.com) adresine gidin ve "Sign up" diyerek GitHub ile giriş yapın.
2.  "Add new site" > **"Import an existing project"** seçeneğine tıklayın.
3.  **GitHub**'ı seçin ve `mervgame` reponuzu listeden bulun.
4.  Ayarlar otomatik gelecektir (Build command: `npm run build`, Publish directory: `dist`).
5.  **Environment Variables** butonuna tıklayın (veya "Show advanced" diyerek bulun) ve "New Variable" diyerek ekleyin:
    *   Key: `VITE_SUPABASE_URL` -> Value: (Supabase URL'niz)
    *   Key: `VITE_SUPABASE_ANON_KEY` -> Value: (Supabase Anon Key'iniz)
6.  **Deploy site** butonuna basın.

### Seçenek B: Manuel Sürükle-Bırak (Hızlı Çözüm)
1.  Terminalde `npm run build` komutunu çalıştırın (zaten yaptıysanız gerek yok).
2.  [Netlify Drop](https://app.netlify.com/drop) adresine gidin.
3.  Proje klasörünüzdeki **`dist`** klasörünü tutup sayfaya bırakın.
4.  Site yayına girdikten sonra "Site settings" > "Environment variables" kısmına gidip Supabase anahtarlarını eklemeniz gerekebilir.

## Sitemi Nasıl Güncellerim?

## Sitemi Nasıl Güncellerim?

**Vercel (GitHub Bağlantılı):**
Sadece kodunuzu GitHub'a gönderin (`git push`). Vercel otomatik olarak algılayıp sitenizi güncelleyecektir.

**Manuel Yöntem:**
1.  Değişikliklerinizi yapın.
2.  `npm run build` çalıştırın.
3.  Yeni `dist` klasörünü tekrar yükleyin.
