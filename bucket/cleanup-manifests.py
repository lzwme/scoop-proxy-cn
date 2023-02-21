# Written by shakeyourbunny ( https://github.com/shakeyourbunny )

## Modified by Andrew Poženel ( https://github.com/anderlli0053 ) 


#!/usr/bin/env python3
#
# see also https://github.com/anderlli0053/DEV-tools/issues/10
# 
# use
#     pip3 install json_minify for the python module
#
# on line 26, set the correct path for the bucket directory.

import json
import json_minify
import os
from os import path

# borked_json_files = [
    # # courtesy of Andrew Pozenel (shame on you)
    # "audiosurf2.json",                               # Invalid control character at: line 1 column 548 (char 547)
    # "blip-and-blop.json",                            # Invalid control character at: line 1 column 526 (char 525)
    # "cleo-scripting-pack.json",                      # Invalid control character at: line 1 column 562 (char 561)
    # "crowbar.json",                                  # Invalid control character at: line 1 column 530 (char 529)
    # "dragonunpacker.json",                           # Invalid control character at: line 1 column 590 (char 589)
    # "foe.json"                                       # json.decoder.JSONDecodeError: Invalid control character at: line 1 column 661 (char 660)

# ]

# just plain incomplete json files, skipped
# borked_json_files_incomplete = [
    # "cabal.json",                           # just incomplete
    # "processing.json"                       # JSONDecodeError: Expecting property name enclosed in double quotes: line 1 column 1402 (char 1401)"
# ]

clean_directory = (r"C:\\Users\\ander\\Desktop\\DEV-tools\\bucket")

def cleanup_json(jsonfile, strip_space=False):
    with open(jsonfile, "r", encoding="utf-8") as jf:
        try:
            json_dirty = jf.read().encode().decode('utf-8-sig')             # fix ALAC.json, illegal BOM
        except:
            print("{} is just broken.".format(jsonfile))
            return
    jf.close()
    json_clean = json_minify.json_minify(json_dirty, strip_space=True)

    # clean up OTHER bork
    fname = jsonfile.split(os.sep)[-1]
    json_clean = json_clean.replace('\n', "").replace('\r', "").replace('\t', "")

    # if fname in borked_json_files_incomplete:
        # return

    json_dict = json.loads(json_clean)
    with open(jsonfile, "w", encoding="utf-8") as jf:
        json.dump(json_dict, jf, indent=True, sort_keys=True)

for files in os.scandir(clean_directory):
    if files.name.endswith(".json"):
        print(" -> "+files.path)
        cleanup_json(files.path)
        
        