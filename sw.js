// Lets the app open without an internet connection.
// It always tries the network first (so updates show straight away),
// and falls back to the saved copy when offline.

const CACHE = 'pawfile-v2';
const APP_FILES = [
	'./', 'index.html', 'styles.css', 'app.js', 'db.js', 'pet.js',
	'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-maskable.svg',
	'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
	event.respondWith(
		fetch(request)
			.then((response) => {
				if (response.ok) {
					const copy = response.clone();
					caches.open(CACHE).then((cache) => cache.put(request, copy));
				}
				return response;
			})
			.catch(() => caches.match(request).then((hit) => hit || caches.match('index.html'))),
	);
});
