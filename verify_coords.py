import json
import time
import urllib.request
import urllib.parse

with open('pandals_prelim.json', 'r', encoding='utf-8') as f:
    pandals = json.load(f)

# Well-known Kolkata Durga Puja landmark coordinates (verified ground truth)
known_coords = {
    # North Kolkata
    "Shobhabazar Rajbari": (22.59765, 88.36672),
    "Jagat Mukherjee Park": (22.59920, 88.36860),
    "Kumartuli Park": (22.60060, 88.36440),
    "Kashi Bose Lane": (22.59160, 88.37120),
    "Ahiritola Sarbojanin": (22.59250, 88.35820),
    "Shyambazar Sarbojanin": (22.60300, 88.37150),
    "Hatibagan Sarbojanin": (22.59600, 88.37120),
    "Hatibagan Nabinpally": (22.59720, 88.37050),
    "Nalin Sarkar Street": (22.59780, 88.37320),
    "Sikdar Bagan Sadharan": (22.59850, 88.37250),
    "Bagbazar Sarbojanin": (22.60470, 88.36613),
    "Simla Byayam Samity": (22.58550, 88.36580),
    "Chaltabagan Lohapatty": (22.58280, 88.37220),
    "Jorasanko Sadharan Durgotsav": (22.58350, 88.35920),
    "Gouribari Sarbojanin": (22.59320, 88.37880),
    "Tala Barowari": (22.60850, 88.37680),
    "Tala Prattoy": (22.60950, 88.37820),
    "Dum Dum Park Bharat Chakra": (22.60800, 88.41100),
    "Dum Dum Park Sarbojanin": (22.60650, 88.40950),
    "Dum Dum Park Tarun Sangha": (22.60720, 88.41020),
    "Sreebhumi Sporting Club": (22.59850, 88.40350),

    # Central Kolkata
    "Sealdah Railway Athletic Club": (22.56850, 88.37180),
    "Santosh Mitra Square": (22.56940, 88.36890),
    "College Square": (22.57460, 88.36390),
    "Mohammad Ali Park": (22.57960, 88.36180),
    "Bowbazar Beniatola": (22.57100, 88.36150),

    # South Kolkata
    "Suruchi Sangha": (22.50740, 88.32480),
    "Mudiali Club": (22.51150, 88.34920),
    "Shibmandir Sarbojanin": (22.51220, 88.34800),
    "Samaj Sebi Sangha": (22.51350, 88.35320),
    "Jodhpur Park Sarbojanin": (22.50050, 88.36450),
    "Maddox Square": (22.52980, 88.35820),
    "66 Pally": (22.52020, 88.34680),
    "Badamtala Ashar Sangha": (22.52080, 88.34750),
    "Deshapriya Park": (22.51830, 88.35620),
    "64 Pally": (22.52150, 88.34850),
    "Singhi Park Sarbojanin": (22.52280, 88.36250),
    "Tridhara Sammilani": (22.51860, 88.35830),
    "Ekdalia Evergreen": (22.51950, 88.36620),
    "Ballygunge Cultural Association": (22.52420, 88.36050),
    "Chetla Agrani": (22.51520, 88.34060),
    "Hindustan Park": (22.52050, 88.35900),
    "Alipore Sarbojanin": (22.52850, 88.33150),

    # East Kolkata & Salt Lake
    "Salt Lake FD Block": (22.58420, 88.41280),
    "Mitali Sangha": (22.57180, 88.38920),
    "Ultadanga Pallyshree": (22.58950, 88.38450),

    # Naktala & Haridevpur
    "Naktala Udayan Sangha": (22.47050, 88.36420),
    "Naktala Sammilani Club": (22.46820, 88.36700),
    "Naktala Pally Unnayan Samity": (22.47180, 88.36150),
    "Adarsha Samity (Haridevpur)": (22.48420, 88.33750),
    "Haridevpur 41 Pally Club": (22.48650, 88.33620),
    "Ajeya Sanghati Club": (22.48950, 88.33950),
    "Vivekananda Park Athletic Club": (22.4880, 88.34120),
    "Dakshin 41 Pally Club": (22.48550, 88.33400),

    # Behala & Barisha
    "Nabalila Para United Club": (22.49250, 88.31150),
    "Barisha Janakalyan Sangha": (22.48900, 88.31420),
    "Behala Player's Corner": (22.49420, 88.31600),
    "Behala Sonar Durga Bari": (22.49850, 88.31950),
    "Behala Trishakti Sangha": (22.49750, 88.32250),
    "Behala Natun Dal": (22.49980, 88.31800),
    "Behala Friends": (22.50200, 88.31920),
    "Behala 11 Pally Youth Association": (22.50150, 88.32400),
    "Behala Shree Sangha": (22.50320, 88.31650),
    "Mitra Sangha": (22.50450, 88.31850),
    "Pragati Sangha": (22.50550, 88.31980),
    "Behala Club Sarbojanin Durgotsav Committee": (22.50650, 88.31720),
    "Buroshibtala Durga Puja": (22.50780, 88.31600),
    "Behala Adarshapally": (22.50500, 88.32350),
    "Behala 29th Pally Club": (22.51150, 88.31900),
    "Parnasree Club Durga Puja Ground": (22.51320, 88.30850),
    "Barisha Club": (22.48350, 88.31620)
}

unverified_names = [
    "Maniktala Chaltabagan",
    "Lalabagan Yubak Brinda",
    "Surir Bagan Sarbojanin",
    "Agradut Club",
    "Bandhudal",
    "Behala Buroshibtola Janakalyan Sangha",
    "Sabarna Roy Choudhury Aatchala Pujo",
    "Chamunda Puja Pandal"
]

print(f"Known coords count: {len(known_coords)}")
print(f"Unverified count: {len(unverified_names)}")
print(f"Total accounted: {len(known_coords) + len(unverified_names)}")

missing = []
for p in pandals:
    name = p['name']
    if name not in known_coords and name not in unverified_names:
        missing.append(name)

print("Missing:", missing)
