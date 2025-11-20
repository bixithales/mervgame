# Firebase Kurulum ve Bağlantı Kılavuzu

Sitenin veritabanı ve dosya yükleme özelliklerinin çalışması için Firebase Konsolunda şu ayarları yapmanız **ŞARTTIR**.

## 1. Firebase Konsoluna Giriş
1. [Firebase Console](https://console.firebase.google.com/) adresine gidin.
2. Projenizi seçin: **`mervearg-2a516`** (Eğer bu proje yoksa yeni proje oluşturun ve ayarları aşağıya göre yapın).

## 2. Authentication (Kimlik Doğrulama) Açma
Sitenin kullanıcıları tanıması için bu gereklidir.
1. Sol menüden **Build** -> **Authentication** seçin.
2. **Get Started** (Başla) butonuna basın.
3. **Sign-in method** sekmesine gelin.
4. **Anonymous** (Anonim) seçeneğini bulun.
5. **Enable** (Etkinleştir) yapıp **Save** (Kaydet) deyin.

## 3. Firestore Database (Veritabanı) Oluşturma
Logların ve ilerlemenin kaydedilmesi için gereklidir.
1. Sol menüden **Build** -> **Firestore Database** seçin.
2. **Create Database** butonuna basın.
3. Konum olarak (Location) `eur3 (europe-west)` veya size yakın bir yer seçin.
4. **Start in Test Mode** (Test modunda başla) seçeneğini seçin.
   - *Bu seçenek kuralları `allow read, write: if true;` yapar, böylece hemen çalışır.*
5. **Create** diyerek bitirin.

**Eğer veritabanı zaten varsa Kuralları (Rules) kontrol edin:**
1. **Rules** sekmesine gelin.
2. Şu kodu yapıştırın ve **Publish** deyin:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 4. Storage (Dosya Depolama) Açma
Fotoğrafların yüklenmesi için gereklidir.
1. Sol menüden **Build** -> **Storage** seçin.
2. **Get Started** butonuna basın.
3. **Start in Test Mode** seçin ve ilerleyin.
4. **Done** diyerek bitirin.

**Kuralları (Rules) kontrol edin:**
1. **Rules** sekmesine gelin.
2. Şu kodu yapıştırın ve **Publish** deyin:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## 5. Son Kontrol
Bu işlemleri yaptıktan sonra sitenize gidin:
1. Admin Paneline girin (`ADMIN` şifresiyle).
2. **"TEST SİNYALİ GÖNDER"** butonuna basın.
3. "Başarılı" yazısını görmelisiniz.
