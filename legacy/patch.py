import re
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace products array
content = re.sub(r'const products = \[.*?\];', 'let products = [];', content, flags=re.DOTALL)

# Replace DOMContentLoaded
content = content.replace('document.addEventListener("DOMContentLoaded", () => {\n  renderProducts(products);', 
'''document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch('/api/products');
    if (res.ok) products = await res.json();
  } catch(e) { console.error("Error loading API", e); }
  renderProducts(products);''')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
