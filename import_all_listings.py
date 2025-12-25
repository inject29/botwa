import os
import glob
import pandas as pd
from sqlalchemy import create_engine

def import_all_listings():
    base_dir = '/botwa/Listing'
    folder_path = os.path.join(base_dir, 'Listing')
    db_path = os.path.join(base_dir, 'listing.db')
    
    # Cek folder
    if not os.path.exists(folder_path):
        print(f"❌ Folder tidak ditemukan: {folder_path}")
        return

    # Cari semua file .xlsx
    files = glob.glob(os.path.join(folder_path, "*.xlsx"))
    if not files:
        print("⚠️ Tidak ada file .xlsx di folder Listing.")
        return
    files.sort() # Urutkan file agar urutan proses konsisten

    print(f"🔎 Ditemukan {len(files)} file Excel. Memulai proses impor ke {db_path}...\n")

    # Setup koneksi DB
    engine = create_engine(f'sqlite:///{db_path}')
    
    # Nama kolom standar
    nama_kolom = ['PLU', 'NAMA BARANG', 'RAK', 'SHELFING', 'BARIS', 'RETUR']

    # Fungsi pembersih PLU
    def bersihkan_plu(val):
        s_val = str(val).strip()
        if s_val.lower() in ['nan', 'none', '', '0', '1']: return None
        try:
            f_val = float(s_val)
            if f_val == 0 or f_val == 1: return None
            if f_val.is_integer(): return str(int(f_val))
            return str(f_val)
        except ValueError:
            return s_val

    # Fungsi pembersih Angka Lain
    def rapikan_format_angka(val):
        s_val = str(val).strip()
        if s_val.lower() in ['nan', 'none', '']: return None
        try:
            f_val = float(s_val)
            if f_val.is_integer(): return int(f_val) # Kembalikan sebagai INT (Angka) agar sorting benar (1, 2, 10)
            return f_val # Kembalikan sebagai FLOAT
        except ValueError:
            return s_val

    total_data = 0
    table_name = 'listings' # Nama tabel gabungan

    for i, file_path in enumerate(files):
        nama_file = os.path.basename(file_path)
        print(f"📂 Memproses [{i+1}/{len(files)}]: {nama_file}")
        
        try:
            # Baca Excel
            df = pd.read_excel(file_path, engine='openpyxl', header=None, names=nama_kolom)
            
            # Bersihkan PLU
            df['PLU'] = df['PLU'].apply(bersihkan_plu)
            df = df.dropna(subset=['PLU'])
            
            # Bersihkan kolom lain
            for col in ['SHELFING', 'RAK', 'BARIS', 'RETUR']:
                if col in df.columns:
                    df[col] = df[col].apply(rapikan_format_angka)
            
            # Kategorikan (Urutkan) data berdasarkan RAK, SHELFING, dan BARIS
            sort_cols = [c for c in ['RAK', 'SHELFING', 'BARIS'] if c in df.columns]
            if sort_cols:
                df = df.sort_values(by=sort_cols)
            
            # Simpan ke DB (Replace untuk file pertama, Append untuk selanjutnya)
            mode = 'replace' if i == 0 else 'append'
            df.to_sql(table_name, engine, if_exists=mode, index=False)
            
            rows_added = len(df)
            total_data += rows_added
            print(f"   ✅ Berhasil menambahkan {rows_added} baris.")
            
        except Exception as e:
            print(f"   ❌ Gagal memproses {nama_file}: {e}")

    print("="*60)
    print(f"🎉 Selesai! Total {total_data} baris data tersimpan di database 'listing.db'.")
    print(f"   Tabel: '{table_name}'")

if __name__ == "__main__":
    import_all_listings()