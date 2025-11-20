# Sitenizi Nasıl Yayınlarsınız (Deploy)

Projeniz başarıyla derlendi (build edildi). Şimdi `dist` klasörünü yayınlayarak sitenizi internette paylaşabilirsiniz.

## Yöntem 1: Netlify (En Kolay)

1.  Tarayıcınızda [Netlify Drop](https://app.netlify.com/drop) adresine gidin.
2.  Bilgisayarınızdaki proje klasörünün içindeki **`dist`** klasörünü bulun.
3.  Bu `dist` klasörünü sürükleyip Netlify sayfasındaki kutucuğa bırakın.
4.  Siteniz saniyeler içinde yayına girecek ve size bir link verilecektir.

## Yöntem 2: Vercel

1.  [Vercel.com](https://vercel.com) adresinde bir hesap oluşturun.
2.  "Add New Project" diyerek projenizi ekleyin.
3.  Eğer projeniz GitHub'da ise oradan seçebilirsiniz.
4.  Değilse, Vercel CLI yükleyerek terminalden `vercel` yazıp yayınlayabilirsiniz.

## Yöntem 3: Firebase Hosting (Projeniz Firebase kullanıyor)

Projeniz zaten Firebase kullandığı için en profesyonel yöntem budur ama biraz kurulum gerektirir.

1.  Terminalde `npm install -g firebase-tools` yazın.
2.  `firebase login` yazarak giriş yapın.
3.  `firebase init` yazın ve "Hosting" seçeneğini seçin.
4.  Public directory olarak `dist` yazın.
5.  Single page app? sorusuna `Yes` deyin.
6.  `firebase deploy` yazarak yayınlayın.

## Sitemi Nasıl Güncellerim?

Sitenizde bir değişiklik yaptığınızda (örneğin kod değiştirdiniz veya bir hata düzelttiniz), bu değişikliğin internetteki sitenizde görünmesi için **tekrar yayınlamanız** gerekir.

1.  Değişikliklerinizi yapın ve kaydedin.
2.  Terminalde tekrar `npm run build` komutunu çalıştırın.
3.  Yeni oluşan `dist` klasörünü tekrar Netlify'a sürükleyin (veya kullandığınız yönteme göre tekrar deploy edin).

**İpucu:** Eğer bu işlemden sıkılırsanız, projenizi bir GitHub hesabına yükleyip Netlify/Vercel'i GitHub'a bağlayabilirsiniz. Böylece siz kodunuzu kaydettiğinizde site otomatik olarak güncellenir.