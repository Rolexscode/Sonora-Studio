const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const initialProducts = [
    { name: "Fender American Pro II Stratocaster", category: "guitarras", price: 1899.00, rating: 4.9, inStock: true, isNew: true, desc: "Guitarra eléctrica de boutique fabricada con cuerpo de fresno seleccionado.", specs: JSON.stringify({"Cuerpo": "Fresno", "Mástil": "Arce Tostado", "Pastillas": "HSS", "Trastes": "22"}), image: "/assets/images/fender_strat_1782346389155.png" },
    { name: "Fender Player Precision Bass", category: "bajos", price: 999.00, rating: 4.7, inStock: true, isNew: false, desc: "Bajo eléctrico activo de 4 cuerdas.", specs: JSON.stringify({"Cuerpo": "Aliso", "Mástil": "Arce", "Pastillas": "2 Humbuckers Activos", "Trastes": "24"}), image: "/assets/images/fender_bass_1782346401742.png" },
    { name: "Korg Minilogue XD Analógico", category: "teclados", price: 1249.00, rating: 4.8, inStock: true, isNew: true, desc: "Sintetizador analógico polifónico de 8 voces.", specs: JSON.stringify({"Polifonía": "8 Voces", "Teclas": "37", "Efectos": "Chorus, Delay", "Conexión": "MIDI"}), image: "/assets/images/korg_minilogue_1782346413918.png" },
    { name: "Roland TD-27KV2 V-Drums", category: "baterias", price: 2499.00, rating: 4.7, inStock: true, isNew: false, desc: "Batería electrónica de gama alta.", specs: JSON.stringify({"Pads": "5 Pads", "Platillos": "Hi-Hat, 2 Crashes", "Muestras": "500", "Salidas": "USB"}), image: "/assets/images/roland_drums_1782346431841.png" },
    { name: "Yamaha HS8 Active Studio Monitor", category: "estudio", price: 599.00, rating: 4.9, inStock: true, isNew: false, desc: "Par de monitores de estudio activos.", specs: JSON.stringify({"Potencia": "80W", "Frecuencia": "45 Hz - 22 kHz", "Entradas": "XLR", "Controles": "Ajuste"}), image: "/assets/images/yamaha_hs8_1782346441986.png" },
    { name: "Gibson Les Paul Standard '60s", category: "guitarras", price: 999.00, rating: 4.6, inStock: true, isNew: false, desc: "Inspirada en los modelos legendarios de los años 60.", specs: JSON.stringify({"Cuerpo": "Aliso", "Mástil": "Arce", "Pastillas": "3 Single-Coil", "Puente": "Trémolo"}), image: "/assets/images/gibson_les_paul_1782346453442.png" },
    { name: "Neumann U87 Ai Condensador", category: "estudio", price: 3490.00, rating: 4.8, inStock: false, isNew: false, desc: "Micrófono de condensador de diafragma grande.", specs: JSON.stringify({"Cápsula": "Diafragma grande", "Patrón Polar": "Cardioide", "Filtro": "80Hz", "Accesorios": "Shockmount"}), image: "/assets/images/neumann_u87_1782346468703.png" },
    { name: "Audio-Technica ATH-M50x", category: "estudio", price: 189.00, rating: 4.5, inStock: true, isNew: false, desc: "Auriculares de estudio circumaurales.", specs: JSON.stringify({"Transductor": "45 mm", "Impedancia": "38 Ohmios", "Almohadillas": "Piel", "Cable": "3m"}), image: "/assets/images/audiotechnica_m50x_1782346479047.png" },
    { name: "Novation Launchpad Pro MK3", category: "accesorios", price: 149.00, rating: 4.7, inStock: true, isNew: false, desc: "Controlador de cuadrícula MIDI USB.", specs: JSON.stringify({"Matriz": "64 Pads", "Botones": "16", "Energía": "USB", "Software": "Ableton"}), image: "/assets/images/novation_launchpad_1782346489513.png" }
  ]
  
  for (const p of initialProducts) {
    const exists = await prisma.product.findFirst({ where: { name: p.name }})
    if(!exists) await prisma.product.create({ data: p })
  }

  // Seed Users
  const users = [
    { email: "admin@sonora.com", password: "123", name: "Administrador", role: "ADMIN" },
    { email: "cliente@sonora.com", password: "123", name: "Cliente VIP", role: "CUSTOMER" },
  ]
  
  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email }})
    if(!exists) await prisma.user.create({ data: u })
  }

  console.log('Database seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
