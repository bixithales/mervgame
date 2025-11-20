-- OYUNU SIFIRLAMA KOMUTU
-- Bunu çalıştırdığınızda oyun Merve için EN BAŞTAN (Hoşgeldin ekranından) başlar.

UPDATE games 
SET 
  stage = 0, 
  status = 'init', 
  history = array[]::jsonb[], 
  "proofUrl" = null 
WHERE id = 'merve_progress';
