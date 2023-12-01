import os
import sys
import requests
# import matplotlib.pyplot as plt
from PIL import Image
from io import BytesIO
import json

image_data = open(sys.argv[1], "rb").read()
headers = {'Ocp-Apim-Subscription-Key': 'd780a27e3b2b4441bc4c940ac82a6223',
           'Content-Type': 'application/octet-stream'}
params = {'visualFeatures': 'Categories,Description,Color'}
response = requests.post(
    'https://car-recogniser.cognitiveservices.azure.com/vision/v3.2/analyze?visualFeatures=Tags,Brands,Color', headers=headers, params=params, data=image_data)
# print(response.request.hooks)
response.raise_for_status()
print('         ')
analysis = response.json()
# analysis = json.dump(analysis)
print(analysis)
