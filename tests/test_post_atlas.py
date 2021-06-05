#!/usr/bin/env python3

import json
import requests
import sys
import time

headers = {
    "Authorization": sys.argv[1],
    "Content-Type": "application/json",
}

payload = {
    "deviceId": "1F13FC2",
    "time": int(time.time()),
    "seqNumber": int(time.time()) % 4096,
    "data": "011e00030101010000000000",
    "lqi": "Good",
    "fixedLat": "0.0",
    "fixedLng": "0.0",
    "operatorName": "SIGFOX_Japan_KCCS",
    "countryCode": "392",
    "deviceTypeId": "60b2d229c563d650adf46b5d",
    "computedLocation": {
        "lat": 35.50534111741823,
        "lng": 139.57328887601793,
        "radius":
        8500,
        "source": 2,
        "status": 1
    }
}

r = requests.post(
        "http://localhost:3000/api/Messages/sigfox",
        headers=headers,
        data=json.dumps(payload))

print(r)
