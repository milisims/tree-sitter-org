from csv import DictReader
from os.path import isfile
from urllib.request import urlopen
from collections import defaultdict


def download_ucd(url, filename, header):
    if not isfile(filename):
        with open(filename, "w") as file:
            file.write(header)
            file.write(urlopen(url).read().decode())


def parse_ucd(filename):
    with open(filename, "r") as csvf:
        lines = DictReader(csvf, delimiter=";")
        unicode2enum = defaultdict(lambda: "SYM", {"L": "STR", "N": "NUM", "Z": "NONE"})
        lookup = [unicode2enum[u["cat"][0]] for u in lines]
    for i in range(32):
        lookup[i] = "NONE"
    return lookup


def make_lookup_table(lookup):
    text = "typedef enum { NONE = 0, STR, NUM, SYM } TextNode;\n"
    lookup = lookup.copy()
    for i, _ in enumerate(lookup):
        if i % 8 == 7:
            lookup[i] = '\n  ' + lookup[i]
        else:
            lookup[i] = ' ' + lookup[i]
    return f"{text}const TextNode unicodetypeof[] = {{\n {','.join(lookup)}}};\n"


if __name__ == "__main__":
    file = "./target/UnicodeData.txt"
    # see https://www.unicode.org/L2/L1999/UnicodeData.html
    url = "https://unicode.org/Public/14.0.0/ucd/UnicodeData.txt"
    header = "hex;1;cat;3;4;5;6;7;8;9;10;11;12;13;14\n"
    download_ucd(url, file, header)
    lut = parse_ucd(file)
    with open("./src/unicode_type.h", "w") as includefile:
        includefile.write(make_lookup_table(lut))
