from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/aitechpros-website/client/public/assets/creative')
source = Image.open(root / 'ai-tech-pros-hero-master.png').convert('RGB')
# The homepage places the art in a dedicated right-hand column, so remove
# the master’s left text-safe area while preserving the full focal system.
left, top, right, bottom = 420, 0, 1600, 900
focus = source.crop((left, top, right, bottom)).resize((1200, 900), Image.Resampling.LANCZOS)
focus.save(root / 'ai-tech-pros-hero-focus.webp', 'WEBP', quality=88, method=6)
print('Created', root / 'ai-tech-pros-hero-focus.webp', focus.size)
