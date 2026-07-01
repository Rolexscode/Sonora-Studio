import http.server
import socketserver
import sqlite3
import json
import urllib.parse
import os

PORT = 8000
DB_FILE = 'database.sqlite'

# Initialize Database
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            rating REAL,
            inStock BOOLEAN NOT NULL CHECK (inStock IN (0, 1)),
            isNew BOOLEAN NOT NULL CHECK (isNew IN (0, 1)),
            desc TEXT,
            specs TEXT,
            image TEXT
        )
    ''')
    
    # Insert initial data if empty
    c.execute('SELECT COUNT(*) FROM products')
    if c.fetchone()[0] == 0:
        print("Poblando base de datos con productos iniciales...")
        initial_products = [
            (1, "Fender American Pro II Stratocaster", "guitarras", 1899.00, 4.9, 1, 1, 
             "Guitarra eléctrica de boutique fabricada con cuerpo de fresno seleccionado.", 
             json.dumps({"Cuerpo": "Fresno", "Mástil": "Arce Tostado", "Pastillas": "HSS", "Trastes": "22"}),
             "assets/images/fender_strat_1782346389155.png"),
            (11, "Fender Player Precision Bass", "bajos", 999.00, 4.7, 1, 0,
             "Bajo eléctrico activo de 4 cuerdas.",
             json.dumps({"Cuerpo": "Aliso", "Mástil": "Arce", "Pastillas": "2 Humbuckers Activos", "Trastes": "24"}),
             "assets/images/fender_bass_1782346401742.png"),
            (2, "Korg Minilogue XD Analógico", "teclados", 1249.00, 4.8, 1, 1,
             "Sintetizador analógico polifónico de 8 voces.",
             json.dumps({"Polifonía": "8 Voces", "Teclas": "37", "Efectos": "Chorus, Delay", "Conexión": "MIDI"}),
             "assets/images/korg_minilogue_1782346413918.png"),
            (3, "Roland TD-27KV2 V-Drums", "baterias", 2499.00, 4.7, 1, 0,
             "Batería electrónica de gama alta.",
             json.dumps({"Pads": "5 Pads", "Platillos": "Hi-Hat, 2 Crashes", "Muestras": "500", "Salidas": "USB"}),
             "assets/images/roland_drums_1782346431841.png"),
            (4, "Yamaha HS8 Active Studio Monitor", "estudio", 599.00, 4.9, 1, 0,
             "Par de monitores de estudio activos.",
             json.dumps({"Potencia": "80W", "Frecuencia": "45 Hz - 22 kHz", "Entradas": "XLR", "Controles": "Ajuste"}),
             "assets/images/yamaha_hs8_1782346441986.png"),
            (5, "Gibson Les Paul Standard '60s", "guitarras", 999.00, 4.6, 1, 0,
             "Inspirada en los modelos legendarios de los años 60.",
             json.dumps({"Cuerpo": "Aliso", "Mástil": "Arce", "Pastillas": "3 Single-Coil", "Puente": "Trémolo"}),
             "assets/images/gibson_les_paul_1782346453442.png"),
            (6, "Neumann U87 Ai Condensador", "estudio", 3490.00, 4.8, 0, 0,
             "Micrófono de condensador de diafragma grande.",
             json.dumps({"Cápsula": "Diafragma grande", "Patrón Polar": "Cardioide", "Filtro": "80Hz", "Accesorios": "Shockmount"}),
             "assets/images/neumann_u87_1782346468703.png"),
            (7, "Audio-Technica ATH-M50x", "estudio", 189.00, 4.5, 1, 0,
             "Auriculares de estudio circumaurales.",
             json.dumps({"Transductor": "45 mm", "Impedancia": "38 Ohmios", "Almohadillas": "Piel", "Cable": "3m"}),
             "assets/images/audiotechnica_m50x_1782346479047.png"),
            (8, "Novation Launchpad Pro MK3", "accesorios", 149.00, 4.7, 1, 0,
             "Controlador de cuadrícula MIDI USB.",
             json.dumps({"Matriz": "64 Pads", "Botones": "16", "Energía": "USB", "Software": "Ableton"}),
             "assets/images/novation_launchpad_1782346489513.png")
        ]
        c.executemany('INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,?)', initial_products)
        conn.commit()
    conn.close()

class APIHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/products':
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('SELECT * FROM products')
            rows = c.fetchall()
            products = []
            for row in rows:
                p = dict(row)
                p['inStock'] = bool(p['inStock'])
                p['isNew'] = bool(p['isNew'])
                try:
                    p['specs'] = json.loads(p['specs'])
                except:
                    p['specs'] = {}
                products.append(p)
            conn.close()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(products).encode('utf-8'))
        else:
            # Serve static files
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/products':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute('''
                INSERT INTO products (name, category, price, rating, inStock, isNew, desc, specs, image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.get('name', 'Producto'),
                data.get('category', 'otros'),
                float(data.get('price', 0)),
                float(data.get('rating', 0)),
                int(data.get('inStock', True)),
                int(data.get('isNew', False)),
                data.get('desc', ''),
                json.dumps(data.get('specs', {})),
                data.get('image', 'assets/images/hero_bg_1782346378898.png')
            ))
            conn.commit()
            new_id = c.lastrowid
            conn.close()
            
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'id': new_id}).encode('utf-8'))
        else:
            self.send_error(404)

if __name__ == '__main__':
    init_db()
    with socketserver.TCPServer(("", PORT), APIHandler) as httpd:
        print(f"Servidor web y API corriendo en http://localhost:{PORT}")
        httpd.serve_forever()
