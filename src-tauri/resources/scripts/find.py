##
## EPITECH PROJECT, 2024
## SPVE
## File description:
## main.py
##


import requests
import random
import math
import dotenv
import os
import sys


EARTH_RADIUS = 6371


def get_communes(dept_code):
    url = f"https://geo.api.gouv.fr/departements/{dept_code}/communes"
    params = {
        "fields": "centre",
        "format": "json",
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    communes = []
    for c in data:
        lon, lat = c['centre']['coordinates']
        communes.append({'name': c['nom'], 'lat': lat, 'lon': lon})
    return communes


def haversine(lat1, lon1, lat2, lon2):
    global EARTH_RADIUS
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def select_communes(communes, min_dist_km=20):
    remaining = communes.copy()
    selected = []

    while remaining:
        choice = random.choice(remaining)
        selected.append(choice)

        new_remaining = []
        for c in remaining:
            dist = haversine(choice['lat'], choice['lon'], c['lat'], c['lon'])
            if dist >= min_dist_km:
                new_remaining.append(c)
        remaining = new_remaining

    return selected


def connect_to_api():
    payload: dict = {
        "email": os.getenv('EMAIL'),
        "keepAlive": False,
        "lang": "fr",
        "password": os.getenv('PASSWORD'),
    }
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
    resp = requests.post("https://pv.kelfoncier.com/api/login", json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"Erreur lors de la connexion à l'API: {resp.status_code}.\n {resp.text}")
        exit(1)
    resp_json = resp.json()
    dotenv.load_dotenv()
    return resp_json['token']


def find_files(dept: str, folder: str):
    dotenv.load_dotenv()
    communes = get_communes(dept)
    result = select_communes(communes, min_dist_km=20)
    apiKey = os.getenv('API_KEY')

    header = {
        "Authorization": f"Bearer {apiKey}",
    }
    for c in result:
        resp = requests.post(f"https://pv.kelfoncier.com/api/building-consumption/{c['lat']}/{c['lon']}/radius/20/generate?plotNumber=", headers=header)
        if resp.status_code == 401:
            apiKey = connect_to_api()
            header = {
                "Authorization": f"Bearer {apiKey}",
            }
            resp = requests.post(f"https://pv.kelfoncier.com/api/building-consumption/{c['lat']}/{c['lon']}/radius/20/generate?plotNumber=", headers=header)
        if resp.status_code != 200:
            print(f"Erreur lors de la génération du fichier pour {c['name']}: {resp.status_code}")
            continue
        with open(os.path.join(folder, c['name'] + '.xlsx'), 'wb') as f:
            f.write(resp.content)


def main(argv: list[str]) -> int:
    find_files(argv[2], argv[1])
    return 0


if __name__ == "__main__":
    main(sys.argv)
