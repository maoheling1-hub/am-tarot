/* 阿毛塔罗 - Service Worker v4
 * 预缓存全部 78 张牌图 + 核心资源，安装失败单条不阻断
 * 关键：app shell (HTML) 采用 network-first，在线始终取最新版本，离线回退缓存
 */
const CACHE = 'am-tarot-v6';

/* 牌组结构：suite -> 张数 */
const DECK = {
  'major': 22, 'wands': 14, 'cups': 14, 'swords': 14, 'pents': 14
};

/* 生成全部图片 URL（带版本号，配合页面缓存策略） */
const IMAGES = [];
for (const s in DECK) {
  for (let i = 0; i < DECK[s]; i++) IMAGES.push('./images/' + s + '/' + i + '.jpg?v=5');
}

const CORE = [
  './am-tarot.html',
  './manifest.json',
  './pwa-icon-192.png',
  './pwa-icon-512.png'
].concat(IMAGES);

/* app shell 相对路径（network-first 用） */
const APP_SHELL = './am-tarot.html';

/* 防抖：队列顺序缓存，单张失败不中断其余 */
function queueAddAll(cache, urls) {
  return urls.reduce((chain, url) =>
    chain.catch(() => {}).then(() => cache.add(url)),
    Promise.resolve()
  );
}

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => queueAddAll(c, CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

/* fetch 策略：app shell 用 network-first（在线拿最新），其余 cache-first */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* 1. app shell / 导航请求 → network-first */
  if (req.mode === 'navigate' || url.pathname.endsWith('/am-tarot.html') || url.pathname.endsWith('/index.html')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(APP_SHELL, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(APP_SHELL).then(hit => hit || caches.match(req)))
    );
    return;
  }

  /* 2. 其余资源 → cache-first + 动态补缓存 */
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      });
    }).catch(() => caches.match('./am-tarot.html'))
  );
});