/* 阿毛塔罗 - Service Worker v1 */
const CACHE = 'am-tarot-v1';
const FILES = [
  './am-tarot.html',
  './manifest.json',
  './pwa-icon-192.png',
  './pwa-icon-512.png',
  './images/major/major-0.jpg',
  './images/major/major-1.jpg',
  './images/major/major-2.jpg',
  './images/major/major-3.jpg',
  './images/major/major-4.jpg',
  './images/major/major-5.jpg',
  './images/major/major-6.jpg',
  './images/major/major-7.jpg',
  './images/major/major-8.jpg',
  './images/major/major-9.jpg',
  './images/major/major-10.jpg',
  './images/major/major-11.jpg',
  './images/major/major-12.jpg',
  './images/major/major-13.jpg',
  './images/major/major-14.jpg',
  './images/major/major-15.jpg',
  './images/major/major-16.jpg',
  './images/major/major-17.jpg',
  './images/major/major-18.jpg',
  './images/major/major-19.jpg',
  './images/major/major-20.jpg',
  './images/major/major-21.jpg',
  './images/wands/wands-0.jpg',
  './images/wands/wands-1.jpg',
  './images/wands/wands-2.jpg',
  './images/wands/wands-3.jpg',
  './images/wands/wands-4.jpg',
  './images/wands/wands-5.jpg',
  './images/wands/wands-6.jpg',
  './images/wands/wands-7.jpg',
  './images/wands/wands-8.jpg',
  './images/wands/wands-9.jpg',
  './images/wands/wands-10.jpg',
  './images/wands/wands-11.jpg',
  './images/wands/wands-12.jpg',
  './images/wands/wands-13.jpg',
  './images/cups/cups-0.jpg',
  './images/cups/cups-1.jpg',
  './images/cups/cups-2.jpg',
  './images/cups/cups-3.jpg',
  './images/cups/cups-4.jpg',
  './images/cups/cups-5.jpg',
  './images/cups/cups-6.jpg',
  './images/cups/cups-7.jpg',
  './images/cups/cups-8.jpg',
  './images/cups/cups-9.jpg',
  './images/cups/cups-10.jpg',
  './images/cups/cups-11.jpg',
  './images/cups/cups-12.jpg',
  './images/cups/cups-13.jpg',
  './images/swords/swords-0.jpg',
  './images/swords/swords-1.jpg',
  './images/swords/swords-2.jpg',
  './images/swords/swords-3.jpg',
  './images/swords/swords-4.jpg',
  './images/swords/swords-5.jpg',
  './images/swords/swords-6.jpg',
  './images/swords/swords-7.jpg',
  './images/swords/swords-8.jpg',
  './images/swords/swords-9.jpg',
  './images/swords/swords-10.jpg',
  './images/swords/swords-11.jpg',
  './images/swords/swords-12.jpg',
  './images/swords/swords-13.jpg',
  './images/pents/pents-0.jpg',
  './images/pents/pents-1.jpg',
  './images/pents/pents-2.jpg',
  './images/pents/pents-3.jpg',
  './images/pents/pents-4.jpg',
  './images/pents/pents-5.jpg',
  './images/pents/pents-6.jpg',
  './images/pents/pents-7.jpg',
  './images/pents/pents-8.jpg',
  './images/pents/pents-9.jpg',
  './images/pents/pents-10.jpg',
  './images/pents/pents-11.jpg',
  './images/pents/pents-12.jpg',
  './images/pents/pents-13.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});