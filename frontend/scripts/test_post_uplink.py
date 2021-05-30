#!/usr/bin/env python3

import json
import requests
import time

headers = {
    "Authorization": "0BiVPD5A5CQYvioB0CH0DkyzPg587qmkVdyIaY65TmLeTVXNVQARc2WSn0fQZPdm",
    "Content-Type": "application/json",
}

payload = {
    "deviceId": "00000001",
    "time": int(time.time()),
    "seqNumber": int(time.time()) % 4096,
    "data": "fe0500090f423eb90b43"
}

r = requests.post(
        "http://localhost:3000/api/Messages/sigfox",
        headers=headers,
        data=json.dumps(payload))

print(r)
