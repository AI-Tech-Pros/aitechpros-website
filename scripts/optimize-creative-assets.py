from pathlib import Path
from PIL import Image

ROOT = Path('/home/ubuntu/aitechpros-website/client/public/assets/creative')

sources = {
    'ai-tech-pros-hero-master.png': (1600, 900),
    'capability-enterprise-ai.png': (1000, 750),
    'capability-security.png': (1000, 750),
    'capability-enablement.png': (1000, 750),
    'orchestrateos-bridge.png': (1200, 800),
}

for filename, size in sources.items():
    src = ROOT / filename
    image = Image.open(src).convert('RGB')
    image.thumbnail(size, Image.Resampling.LANCZOS)
    output = src.with_suffix('.webp')
    image.save(output, 'WEBP', quality=86, method=6)
    print(f'{filename} -> {output.name} {image.size}')
