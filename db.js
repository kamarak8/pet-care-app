// On-device storage for pets, using the browser's built-in database (IndexedDB).
// Nothing here is sent anywhere: the data stays on the phone, tablet or computer.

const DB_NAME = 'pawfile';
const DB_VERSION = 1;
const STORE = 'pets';

let dbPromise = null;

function openDb() {
	if (!dbPromise) {
		dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);
			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains(STORE)) {
					db.createObjectStore(STORE, { keyPath: 'id' });
				}
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
	return dbPromise;
}

// Runs one transaction and resolves once it has fully completed (so a save is really saved).
function withStore(mode, work) {
	return openDb().then((db) => new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, mode);
		const request = work(tx.objectStore(STORE));
		let result;
		if (request) request.onsuccess = () => { result = request.result; };
		tx.oncomplete = () => resolve(result);
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error || new Error('Saving was cancelled.'));
	}));
}

export const PetStore = {
	all: () => withStore('readonly', (store) => store.getAll()),
	get: (id) => withStore('readonly', (store) => store.get(id)),
	put: (pet) => withStore('readwrite', (store) => store.put(pet)),
	remove: (id) => withStore('readwrite', (store) => store.delete(id)),
	putMany: (pets) => withStore('readwrite', (store) => { pets.forEach((pet) => store.put(pet)); }),
};

// Asks the browser not to clear our data when the device is low on space.
export async function requestPersistentStorage() {
	try {
		if (navigator.storage && navigator.storage.persist) {
			return await navigator.storage.persist();
		}
	} catch (_) { /* not supported: fine */ }
	return false;
}
