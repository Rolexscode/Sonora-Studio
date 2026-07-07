from PIL import Image

def extract_logo():
    img = Image.open('public/assets/images/logo.png').convert('RGBA')
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if the pixel is white-ish (R, G, B > 200)
        if item[0] > 180 and item[1] > 180 and item[2] > 180:
            # White pixel, make it completely white and opaque
            new_data.append((255, 255, 255, 255))
        else:
            # Transparent
            new_data.append((255, 255, 255, 0))
            
    img.putdata(new_data)
    
    # Crop to bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save('public/assets/images/logo_white.png')
    print("Saved logo_white.png")

if __name__ == "__main__":
    extract_logo()
