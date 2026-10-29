# ຕິດຕາມລູກຄ້າ VARI

ເຄື່ອງມືໃຫ້ທີມ VARI ໂທຕິດຕາມລູກຄ້າ, ບັນທຶກຜົນ, ແກ້ຂໍ້ມູນທີ່ບໍ່ຄົບ ແລະ ສົ່ງອອກເຂົ້າ LOO.

- ໜ້າເວັບ: GitHub Pages (`index.html`)
- ຂໍ້ມູນລູກຄ້າ ແລະ ຜົນການຕິດຕາມ: Supabase project `vari-trucks`, ຕາຕະລາງ `cust_data`, `cust_track`
- ທຸກຄົນຕ້ອງໃສ່ **ລະຫັດທີມ** ແລະ **ຊື່ຜູ້ເຮັດ** ກ່ອນເຂົ້າໃຊ້. ລະຫັດທີມເກັບໃນ Supabase secret `CUST_PIN`
- repo ນີ້ບໍ່ມີຂໍ້ມູນລູກຄ້າ

## ໄຟລ໌

| ໄຟລ໌ | ໜ້າທີ່ |
|---|---|
| `tracker.html` | ໜ້າຫຼັກ (ສະບັບ claude.ai artifact) |
| `web-boot.js` | ສ່ວນເລີ່ມຕົ້ນຂອງສະບັບເວັບ: ໜ້າໃສ່ລະຫັດ + ຊື່, ເຊື່ອມ Supabase |
| `build.py` | ສ້າງ `index.html` ຈາກ `tracker.html` + `web-boot.js` |
| `supabase/functions/cust-api/index.ts` | API: ກວດລະຫັດທີມ, ສົ່ງຂໍ້ມູນ, ບັນທຶກຜົນ, ລັອກ 15 ນາທີ ຫຼັງລອງຜິດ 10 ເທື່ອ |

## ແກ້ໄຂ

ແກ້ `tracker.html` ຫຼື `web-boot.js` ແລ້ວ `python3 build.py` ແລະ commit `index.html`.

## ປ່ຽນລະຫັດທີມ

Supabase dashboard → Edge Functions → Secrets → `CUST_PIN`. ຄົນທີ່ໃຊ້ລະຫັດເກົ່າຈະຖືກໃຫ້ໃສ່ລະຫັດໃໝ່ເອງ.
