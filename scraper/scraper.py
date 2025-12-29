"""
scraper.py — примерный скрипт для логина на http://81.23.127.46/wms_front/ и получения данных.


Этот пример — шаблон. Страницы сайта могут требовать адаптации парсинга (имена полей форм, конечные URL).


Выход: prints JSON (словарь {point_id: {last: ISO8601, status: 'green'|'yellow'|'red'}})
"""
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timezone, timedelta
import os


SITE_URL = 'http://81.23.127.46/wms_front/'
USER = os.environ.get('SITE_USER')
PASS = os.environ.get('SITE_PASS')


# points mapping (id->page or endpoint). В примере — просто список id; для реального парсинга
POINT_IDS = ['p1','p2','p3']


session = requests.Session()
# пример логина через форму: нужно откорректировать под форму сайта
login_page = session.get(SITE_URL)
soup = BeautifulSoup(login_page.text, 'html.parser')
# допустим форма POST на /login с полями login/password
login_action = SITE_URL + 'login'
payload = {'username': USER, 'password': PASS}
resp = session.post(login_action, data=payload)
if resp.status_code != 200:
print(json.dumps({'error':'login_failed','code':resp.status_code}))
raise SystemExit(1)


results = {}
now = datetime.now(timezone.utc)
for pid in POINT_IDS:
# здесь — заглушка: в реальном сценарии нужно загрузить страницу поста и найти метку времени
# пример: GET /data?post=pid -> содержит <span class="last">2025-12-28 12:34</span>
try:
r = session.get(SITE_URL + 'data?post=' + pid)
s = BeautifulSoup(r.text, 'html.parser')
last_el = s.select_one('.last')
if last_el:
# предполагаем формат 'YYYY-MM-DD HH:MM'
dt = datetime.fromisoformat(last_el.text.strip())
last_iso = dt.replace(tzinfo=timezone.utc).isoformat()
else:
last_iso = None
except Exception as e:
last_iso = None


results[pid] = {'last': last_iso}


# applying status rules
conf_green_hours = int(os.environ.get('GREEN_HOURS', '24'))
conf_yellow_hours = int(os.environ.get('YELLOW_HOURS', '48'))


for pid,info in results.items():
last = info.get('last')
status = 'red'
if last:
try:
dt = datetime.fromisoformat(last)
except Exception:
print(json.dumps(results, ensure_ascii=False))
