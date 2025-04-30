##
## EPITECH PROJECT, 2024
## SPVE
## File description:
## generation.py
##


import pandas as pd
import requests
import sys
import os


def get_sirets_from_etablissement(etablissements):
    siret_list = []
    for etablissement in etablissements:
        if "siret" in etablissement:
            siret_list.append(etablissement["siret"])
    return siret_list


def get_sirens_from_etablissement(etablissements):
    siren_list = []
    for etablissement in etablissements:
        if "siren" in etablissement:
            siren_list.append(etablissement["siren"])
    return siren_list


def searchSiretByAddress(address, is_siren: bool=False):
    siret_list = []

    url = "https://recherche-entreprises.api.gouv.fr/search"
    params = {
        "q": f"{address}",
    }
    headers = {
        "Accept": "application/json",
    }
    try:
        response = requests.get(url, headers=headers, params=params)
    except requests.exceptions.RequestException as e:
        print(f"Erreur de connexion: {e}")
        return siret_list
    if response.status_code == 200:
        data = response.json()
        etablissements = data.get("results", [])
        if not is_siren:
            for etablissement in etablissements:
                siret_list += get_sirets_from_etablissement(etablissement["matching_etablissements"])
        else:
            siret_list += get_sirens_from_etablissement(etablissements)
    else:
        print(f"Erreur {response.status_code}: {response.text}")
    return siret_list


def get_tels_list(dict_telephone, siret_list):
    tels_list = []
    for siret in siret_list:
        tel = dict_telephone.get(str(siret))
        if tel is not None:
            tels_list.append(tel)
    return tels_list


def merge_values_into_diction(telephone, conso, sector):
    return {
        "nom": telephone["name"],
        "telephone": telephone["telephone"],
        "adresse": telephone["address"],
        "ville": telephone["ville"],
        "code postal": telephone["code postal"],
        "email": telephone["email"],
        "consommation en MWh": conso,
        "secteur": sector,
    }


def merge_all_values_for_siret(tels, conso, sector):
    merged_list = []
    for tel in tels:
        merged_list.append(merge_values_into_diction(tel, conso, sector))
    return merged_list


def convert_dataframe_in_dict(dataframe):
    dataframe_dict = {}
    for _, row in dataframe.iterrows():
        siret = str(row["SIRET"]).split(".")[0]
        if siret not in dataframe_dict:
            dataframe_dict[siret] = {
                "telephone": row["Téléphone"],
                "name": row["Nom"],
                "address": row["Adresse"],
                "ville": row["Ville"],
                "email": row["Adresse mél"],
                "code postal": row["Code postal"],
            }
    return dataframe_dict


def get_all_correspondances(dataframe_kelfoncier, dataframe_telephone):
    all_correspondances = []

    if dataframe_telephone["SIRET"].astype(str).tolist() == []:
        return None
    len_siret = len(dataframe_telephone["SIRET"].astype(str).tolist()[0])
    dict_telephone = convert_dataframe_in_dict(dataframe_telephone)
    strings = dataframe_kelfoncier["Adresse du point de livraison"].astype(str).tolist()
    consos = dataframe_kelfoncier["Consommation en MWh"].astype(float).tolist()
    sectors = dataframe_kelfoncier["Secteur d'activité"].astype(str).tolist()
    for index, address in enumerate(strings):
        siret_list = searchSiretByAddress(address, len_siret == 9)
        if siret_list:
            tels = get_tels_list(dict_telephone, siret_list)
            all_correspondances += merge_all_values_for_siret(tels, consos[index], sectors[index])
    return all_correspondances


def generate(df_kelfoncier, df_telephone):
    all_correspondances = get_all_correspondances(df_kelfoncier, df_telephone)
    if not all_correspondances:
        return pd.DataFrame(columns=["nom", "telephone", "adresse", "ville", "code postal", "email", "consommation en MWh", "secteur"])
    return pd.DataFrame(all_correspondances)


def merge_files(folder: str, dtype=None):
    dfs = []

    for file in os.listdir(folder):
        dfs.append(pd.read_excel(os.path.join(folder, file), dtype=dtype))
    return pd.concat(dfs, ignore_index=True)


def get_phones(directory: str, department_code: str) -> pd.DataFrame:
    department = department_code if department_code not in ["2A", "2B"] else "20"
    phones_df = merge_files(directory, dtype={"Code postal": str, "SIRET": str})

    phones_df.dropna(subset=["SIRET"], inplace=True)
    phones_df = phones_df[phones_df["Code postal"].astype(str).str[:2] == department]
    return phones_df


def apply_filters(df: pd.DataFrame) -> pd.DataFrame:
    df.drop_duplicates(inplace=True)
    df = df[df["Secteur d'activité"] != "Résidentiel"]
    df = df[df["Consommation en MWh"] > 36]
    return df


def delete_useless_postal_codes(df: pd.DataFrame, department: str):
    if department == "":
        return df
    department = department if department not in ["2A", "2B"] else "20"
    return df[df["code postal"].astype(str).str[:2] == department]


def main(argv: list[str]):
    filename = argv[2] if argv[2].endswith(".xlsx") else argv[2] + ".xlsx"
    outputFile = os.path.join(argv[1], filename)
    inputFolder = argv[3]
    department = argv[4]

    kelfoncier_df = merge_files(os.path.join(inputFolder, "kelfoncier"))
    kelfoncier_df = apply_filters(kelfoncier_df)
    phones_df = get_phones(os.path.join(inputFolder, "phones"), department)
    generated_df = generate(kelfoncier_df, phones_df)
    generated_df = delete_useless_postal_codes(generated_df, department)

    generated_df.to_excel(outputFile, index=False)


if __name__ == "__main__":
    main(sys.argv)
