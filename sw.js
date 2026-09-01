/* 阿毛塔罗 - Service Worker v3
 * 预缓存全部 78 张牌图 + 核心资源，安装失败单条不阻断
 */
const CACHE = 'am-tarot-v4';

/* 牌组结构：suite -> 张数 */
const DECK = {
  'major': 22, 'wands': 14, 'cups': 14, 'swords': 14, 'pents': 14
};

/* 生成全部图片 URL */
const IMAGES = [];
for (const s in DECK) {
  for (let i = 0; i < DECK[s]; i++) IMAGES.push('./images/' + s + '/' + i + '.jpg');
}

const CORE = [
  './am-tarot.html',
  './manifest.json',
  './pwa-icon-192.png',
  './pwa-icon-512.png'
].concat(IMAGES);

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

/* 缓存优先 + 动态补缓存 */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      });
    }).catch(() => caches.match('./am-tarot.html'))
  );
});