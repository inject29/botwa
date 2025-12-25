import pandas as pd
from sqlalchemy import create_engine
import os

# Lokasi database (sesuaikan jika folder berbeda)
base_dir = '/home/ubuntu/botwa'
db_path = os.path.join(base_dir, 'listing.db')

def test_database_content():
    # 1. Cek keberadaan file database
    if not os.path.exists(db_path):
        print(f"❌ File database tidak ditemukan di: {db_path}")
        print("Pastikan Anda sudah menjalankan script 'baca_adp01d.py' sebelumnya.")
        return

    print(f"🔎 Memeriksa isi database: {db_path}\n")
    
    try:
        # 2. Koneksi ke Database
        engine = create_engine(f'sqlite:///{db_path}')
        table_name = 'listings'
        
        # 3. Query: Hitung Total Data
        df_count = pd.read_sql(f"SELECT COUNT(*) as total FROM {table_name}", engine)
        total_rows = df_count['total'][0]
        print(f"📊 Total Data Tersimpan: {total_rows} baris")
        
        # 4. Query: Lihat Sampel Data (10 Baris Pertama)
        print(f"\n📋 Sampel 10 Data Pertama (Diurutkan per RAK):")
        print("=" * 80)
        df_sample = pd.read_sql(f"SELECT * FROM {table_name} ORDER BY RAK, SHELFING, BARIS LIMIT 10", engine)
        
        # Menampilkan tabel dengan rapi tanpa index pandas
        print(df_sample.to_string(index=False))
        print("=" * 80)
        
        # 5. Simulasi Output Bot (Caption)
        print("\n🤖 Simulasi Output Bot (Caption untuk PLU pertama):")
        if not df_sample.empty:
            test_plu = df_sample.iloc[0]['PLU']
            
            # Query spesifik menggunakan Pandas untuk simulasi
            df_res = pd.read_sql(f"SELECT * FROM {table_name} WHERE PLU = '{test_plu}'", engine)
            
            if not df_res.empty:
                r = df_res.iloc[0]
                caption = f"*{r['NAMA BARANG']}*\n*Rak:* {r['RAK']} | *Shelf:* {r['SHELFING']} | *Baris:* {r['BARIS']}\n*Retur:* {r['RETUR']}"
                print(f"PLU: {test_plu}")
                print("-" * 40)
                print(caption)
                print("-" * 40)

    except Exception as e:
        print(f"❌ Terjadi kesalahan saat membaca database: {e}")

if __name__ == "__main__":
    test_database_content()