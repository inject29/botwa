import os
import sys

try:
    import pandas as pd
    from sqlalchemy import create_engine
except ImportError:
    print("❌ Error: Library yang dibutuhkan belum terinstall.")
    print("Silakan jalankan perintah ini di terminal: pip install pandas openpyxl sqlalchemy")
    sys.exit(1)

# Path file sesuai yang terlihat di terminal/konteks
base_dir = '/home/ubuntu/botwa'
file_path = os.path.join(base_dir, 'Listing', 'ADP01D.xlsx')

def baca_file_spesifik():
    if not os.path.exists(file_path):
        print(f"File tidak ditemukan di: {file_path}")
        return

    print(f"Membaca file: {file_path} ...\n")
    
    try:
        # Membaca file Excel
        # Menambahkan header manual karena file asli tidak memilikinya
        nama_kolom = ['PLU', 'NAMA BARANG', 'RAK', 'SHELFING', 'BARIS', 'RETUR']
        df = pd.read_excel(file_path, engine='openpyxl', header=None, names=nama_kolom)
        
        # Fungsi pembersih yang lebih kuat
        def bersihkan_plu(val):
            s_val = str(val).strip()
            # Cek sampah string umum
            if s_val.lower() in ['nan', 'none', '', '0', '1']: return None
            try:
                f_val = float(s_val)
                # Cek jika angka adalah 0 atau 1 (sampah)
                if f_val == 0 or f_val == 1: return None
                # Jika angka valid, hilangkan desimal .0 (misal 123.0 jadi 123)
                if f_val.is_integer(): return str(int(f_val))
                return str(f_val)
            except ValueError:
                return s_val # Kembalikan aslinya jika alphanumeric

        # Fungsi baru: Merapikan format angka (misal 1.0 jadi 1) untuk kolom lain
        # Kita TIDAK menghapus angka 1 disini karena Shelf 1 adalah data valid
        def rapikan_format_angka(val):
            s_val = str(val).strip()
            if s_val.lower() in ['nan', 'none', '']: return None
            try:
                f_val = float(s_val)
                # Hilangkan desimal .0 (misal 1.0 jadi 1, 0.0 jadi 0)
                if f_val.is_integer(): return str(int(f_val))
                return str(f_val)
            except ValueError:
                return s_val

        # 1. Bersihkan PLU dan hapus baris yang PLU-nya tidak valid
        df['PLU'] = df['PLU'].apply(bersihkan_plu)
        df = df.dropna(subset=['PLU'])

        # 2. Rapikan format kolom SHELFING, RAK, dan BARIS (hilangkan .0)
        for col in ['SHELFING', 'RAK', 'BARIS']:
            if col in df.columns:
                df[col] = df[col].apply(rapikan_format_angka)

        print("--- 5 Baris Pertama Data ---")
        print(df.head().to_string())
        print("\n--- Informasi Kolom & Tipe Data ---")
        print(df.info())
        
        # Menyimpan ke Database (SQLite)
        db_name = 'listing.db'
        print(f"\nMenyimpan data ke database SQLite: {db_name} ...")
        engine = create_engine(f'sqlite:///{db_name}')
        df.to_sql('adp01d', engine, if_exists='replace', index=False)
        print("✅ Sukses! Data berhasil disimpan ke tabel 'adp01d'.")
        
    except Exception as e:
        print(f"❌ Gagal membaca file. Error: {e}")
        # Tampilkan detail error untuk debugging
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    baca_file_spesifik()