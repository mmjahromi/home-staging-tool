from PIL import Image

# Resize the mask to match the image
image = Image.open("/Users/mohammadjahromi/projects/home-stage-tool/frontend/image.png")
mask = Image.open("/Users/mohammadjahromi/projects/home-stage-tool/frontend/mask.png").resize(image.size)

# Save resized mask
mask.save("resized_mask.png")
