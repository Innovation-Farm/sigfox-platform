#!/usr/bin/env python3

import json
import requests
import time
import sys

headers = {
    "Authorization": sys.argv[1],
    "Content-Type": "application/json",
}

payload = {
    "deviceId": "00000001",
    "time": int(time.time()),
    "seqNumber": int(time.time()) % 4096,
    "data": "80000000000000000000"
}

r = requests.post(
        "http://localhost:3000/api/Messages/sigfox",
        headers=headers,
        data=json.dumps(payload))

print(r)
