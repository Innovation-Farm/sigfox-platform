#!/usr/bin/env python3

import json
import requests
import time
import sys
import random

headers = {
    "Authorization": sys.argv[1],
    "Content-Type": "application/json",
}

payload = {
    "deviceId": sys.argv[2],
    "time": int(time.time()),
    "seqNumber": int(time.time()) % 4096,
    "data": "%02d000000000000000000" % random.randint(0, 100)
}

r = requests.post(
        "http://localhost:3000/api/Messages/sigfox",
        headers=headers,
        data=json.dumps(payload))

print(r)
