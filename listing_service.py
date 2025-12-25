from sqlalchemy import create_engine, text
import os

# Lokasi database listing
base_dir = '/home/ubuntu/botwa'
DB_PATH = os.path.join(base_dir, 'listing.db')

def get_listing_caption(plu):
    """
    Menerima PLU, mencari di database listing.db, 
    dan mengembalikan string caption lengkap untuk bot.
    """
    if not os.path.exists(DB_PATH):
        return "⚠️ Error: Database listing.db belum dibuat."

    try:
        engine = create_engine(f'sqlite:///{DB_PATH}')
        with engine.connect() as conn:
            # Query data berdasarkan PLU
            query = text("SELECT * FROM listings WHERE PLU = :plu")
            result = conn.execute(query, {"plu": str(plu).strip()}).fetchone()
            
            if result:
                # Mapping hasil query (sesuai urutan kolom di import_all_listings.py)
                # 0=PLU, 1=NAMA BARANG, 2=RAK, 3=SHELFING, 4=BARIS, 5=RETUR
                nama = result[1]
                rak = result[2]
                shelf = result[3]
                baris = result[4]
                retur = result[5]
                
                # Format Caption sesuai permintaan (di bawah gambar)
                caption = f"*{nama}*\n*Rak:* {rak} | *Shelf:* {shelf} | *Baris:* {baris}\n*Retur:* {retur}"
                return caption
            else:
                return None # Data tidak ditemukan
                
    except Exception as e:
        return f"⚠️ Error System: {e}"