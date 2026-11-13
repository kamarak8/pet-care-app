// The screens. Each render function draws one page from the saved data.
// Changes are always saved to storage first, then the page is redrawn.

import { PetStore, requestPersistentStorage } from './db.js';
import {
	PROFILE_FIELDS, CARE_FIELDS, SECTIONS, sectionByKey, sortedItems, newPet, newItem, normalisePet,
	speciesEmoji, ageText, formatDate, activeMedications, emergencyText,
} from './pet.js';

const APP_NAME = 'PawFile';
const app = document.getElementById('app');
const topTitle = document.getElementById('top-title');
const backBtn = document.getElementById('back');
const modal = document.getElementById('modal');

let currentPet = null; // the pet shown on the profile page, used by its buttons

// ---------- small helpers ----------

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (value) => esc(value).replace(/\n/g, '<br>');

function setTop(title, backHref) {
	topTitle.textContent = title;
	backBtn.hidden = !backHref;
	if (backHref) backBtn.href = backHref;
	document.title = title === APP_NAME ? APP_NAME : `${title} · ${APP_NAME}`;
}

function avatar(pet, size = '') {
	const inner = pet.photo
		? `<img src="${esc(pet.photo)}" alt="Photo of ${esc(pet.name)}">`
		: `<span aria-hidden="true">${speciesEmoji(pet.species)}</span>`;
	return `<div class="avatar ${size}">${inner}</div>`;
}

function petSubtitle(pet) {
	return [pet.breed || pet.species, ageText(pet.birthDate)].filter(Boolean).join(' · ');
}

async function savePet(pet) {
	pet.updatedAt = new Date().toISOString();
	await PetStore.put(pet);
}

function toast(message) {
	const el = document.createElement('div');
	el.className = 'toast';
	el.textContent = message;
	document.body.appendChild(el);
	setTimeout(() => el.remove(), 2600);
}

// ---------- forms ----------

function fieldHtml(field, value = '') {
	const id = `f-${field.key}`;
	const req = field.required ? ' required' : '';
	const ph = field.placeholder ? ` placeholder="${esc(field.placeholder)}"` : '';
	let control;
	if (field.type === 'select') {
		control = `<select id="${id}" name="${field.key}">${field.options.map((o) => `<option${o === value ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
	} else if (field.type === 'textarea') {
		control = `<textarea id="${id}" name="${field.key}" rows="3"${ph}${req}>${esc(value)}</textarea>`;
	} else {
		control = `<input id="${id}" name="${field.key}" type="${field.type || 'text'}" value="${esc(value)}"${ph}${req}>`;
	}
	return `<label class="field" for="${id}"><span>${esc(field.label)}${field.required ? ' <em>*</em>' : ''}</span>${control}</label>`;
}

function readFields(form, fields) {
	const data = {};
	fields.forEach((f) => { data[f.key] = form.elements[f.key].value.trim(); });
	return data;
}

// Opens a pop-up form. onSave receives the typed values.
function openForm({ title, fields, values = {}, onSave, onDelete }) {
	modal.innerHTML = `
		<form class="modal-form" novalidate>
			<h2>${esc(title)}</h2>
			${fields.map((f) => fieldHtml(f, values[f.key])).join('')}
			<div class="modal-actions">
				${onDelete ? '<button type="button" class="btn danger-text" data-act="delete">Delete</button>' : ''}
				<span class="spacer"></span>
				<button type="button" class="btn secondary" data-act="cancel">Cancel</button>
				<button type="submit" class="btn primary">Save</button>
			</div>
		</form>`;
	const form = modal.querySelector('form');
	const saveBtn = form.querySelector('[type="submit"]');
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (saveBtn.disabled || !form.reportValidity()) return; // ignore double taps while saving
		saveBtn.disabled = true;
		try {
			await onSave(readFields(form, fields));
			modal.close();
		} catch (err) {
			saveBtn.disabled = false;
			alert(`Could not save: ${err.message}`);
		}
	});
	form.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());
	const del = form.querySelector('[data-act="delete"]');
	if (del) {
		del.addEventListener('click', async () => {
			if (!confirm('Delete this entry? This cannot be undone.')) return;
			await onDelete();
			modal.close();
		});
	}
	modal.showModal();
	const first = form.querySelector('input, select, textarea');
	if (first) first.focus();
}

// Shrinks a photo so it does not fill up the device's storage.
async function resizeImage(file, maxSize = 800) {
	const url = URL.createObjectURL(file);
	try {
		const img = await new Promise((resolve, reject) => {
			const i = new Image();
			i.onload = () => resolve(i);
			i.onerror = () => reject(new Error('That file could not be opened as a picture.'));
			i.src = url;
		});
		const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(img.naturalWidth * scale);
		canvas.height = Math.round(img.naturalHeight * scale);
		canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL('image/jpeg', 0.82);
	} finally {
		URL.revokeObjectURL(url);
	}
}

// ---------- page: list of pets ----------

async function renderList() {
	setTop(APP_NAME);
	const pets = (await PetStore.all()).sort((a, b) => a.name.localeCompare(b.name));
	if (!pets.length) {
		app.innerHTML = `
			<section class="welcome">
				<div class="welcome-emoji" aria-hidden="true">🐾</div>
				<h2>Everything about your pets, in one place</h2>
				<p>Record medical needs, medications, allergies, vet visits, likes and dislikes, so anyone looking after them knows exactly what to do, especially in an emergency.</p>
				<a class="btn primary large" href="#/new">Add your first pet</a>
				<p class="small muted">Your information is stored only on this device.</p>
			</section>`;
		return;
	}
	app.innerHTML = `
		<div class="pet-grid">
			${pets.map((pet) => {
				const allergyCount = pet.allergies.length;
				const meds = activeMedications(pet).length;
				const chips = [
					allergyCount ? `<span class="chip danger">⚠️ ${allergyCount} ${allergyCount === 1 ? 'allergy' : 'allergies'}</span>` : '',
					meds ? `<span class="chip">💊 ${meds} ${meds === 1 ? 'medication' : 'medications'}</span>` : '',
				].join('');
				return `
					<a class="card pet-card" href="#/pet/${encodeURIComponent(pet.id)}">
						${avatar(pet)}
						<div class="pet-card-body">
							<h2>${esc(pet.name)}</h2>
							<p class="muted">${esc(petSubtitle(pet))}</p>
							${chips ? `<div class="chips">${chips}</div>` : ''}
						</div>
					</a>`;
			}).join('')}
		</div>
		<a class="btn primary large block" href="#/new">+ Add a pet</a>`;
}

// ---------- page: one pet's profile ----------

function factsHtml(pet) {
	const facts = [
		['Sex', pet.sex !== 'Unknown' ? pet.sex : ''],
		['Neutered', pet.neutered !== 'Unknown' ? pet.neutered : ''],
		['Born', formatDate(pet.birthDate)],
		['Weight', pet.weight],
		['Looks like', pet.colour],
		['Microchip', pet.microchip],
		['Insurance', pet.insurance],
	].filter(([, v]) => v);
	if (!facts.length) return '';
	return `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}

function sectionHtml(pet, section) {
	const items = sortedItems(pet, section);
	const list = items.length
		? `<ul class="items">${items.map((item) => {
			const s = section.summary(item);
			const cls = ['item', s.danger ? 'danger' : '', s.muted ? 'muted-item' : ''].join(' ');
			return `<li><button type="button" class="${cls}" data-edit="${section.key}" data-id="${esc(item.id)}">
				<span class="item-text"><span class="item-main">${esc(s.main)}</span>${s.sub ? `<span class="item-sub">${esc(s.sub)}</span>` : ''}</span>
				${s.tag ? `<span class="tag${s.danger ? ' danger' : ''}">${esc(s.tag)}</span>` : ''}
				<span class="chev" aria-hidden="true">›</span>
			</button></li>`;
		}).join('')}</ul>`
		: `<p class="empty">${esc(section.empty)}</p>`;
	return `
		<section class="card section" id="section-${section.key}">
			<header class="section-head">
				<h3><span aria-hidden="true">${section.icon}</span> ${esc(section.title)}</h3>
				<button type="button" class="btn small" data-add="${section.key}">+ Add</button>
			</header>
			${list}
		</section>`;
}

function careHtml(pet) {
	const filled = CARE_FIELDS.filter((f) => pet.care[f.key]);
	return `
		<section class="card section" id="section-care">
			<header class="section-head">
				<h3><span aria-hidden="true">🍽️</span> Daily care</h3>
				<button type="button" class="btn small" data-care="1">${filled.length ? 'Edit' : '+ Add'}</button>
			</header>
			${filled.length
				? `<dl class="care">${filled.map((f) => `<div><dt>${esc(f.label.split(':')[0])}</dt><dd>${nl2br(pet.care[f.key])}</dd></div>`).join('')}</dl>`
				: '<p class="empty">Feeding, walks, toilet habits, behaviour and routine.</p>'}
		</section>`;
}

function renderProfile(pet) {
	currentPet = pet;
	setTop(pet.name, '#/');
	const order = ['allergies', 'medications', 'conditions', 'contacts'];
	const later = ['likes', 'dislikes', 'vetVisits'];
	const severe = pet.allergies.filter((a) => a.severity === 'Severe');
	app.innerHTML = `
		<section class="card hero">
			<div class="hero-top">
				${avatar(pet, 'xl')}
				<div>
					<h2>${esc(pet.name)}</h2>
					<p class="muted">${esc([pet.species, pet.breed].filter(Boolean).join(' · '))}${ageText(pet.birthDate) ? `<br>${esc(ageText(pet.birthDate))} old` : ''}</p>
				</div>
			</div>
			${severe.length ? `<div class="alert">⚠️ <strong>Severe allergy:</strong> ${esc(severe.map((a) => a.name).join(', '))}</div>` : ''}
			${factsHtml(pet)}
			${pet.notes ? `<p class="notes">${nl2br(pet.notes)}</p>` : ''}
			<div class="actions">
				<a class="btn emergency" href="#/pet/${encodeURIComponent(pet.id)}/emergency">🚨 Emergency card</a>
				<a class="btn secondary" href="#/pet/${encodeURIComponent(pet.id)}/edit">Edit profile</a>
			</div>
		</section>
		${order.map((k) => sectionHtml(pet, sectionByKey(k))).join('')}
		${careHtml(pet)}
		${later.map((k) => sectionHtml(pet, sectionByKey(k))).join('')}`;
}

// Buttons on the profile page (one listener for the whole page).
app.addEventListener('click', (event) => {
	const btn = event.target.closest('[data-add], [data-edit], [data-care]');
	if (!btn || !currentPet) return;
	const pet = currentPet;
	if (btn.dataset.care) {
		openForm({
			title: `${pet.name}'s daily care`, fields: CARE_FIELDS, values: pet.care,
			onSave: async (values) => { pet.care = values; await savePet(pet); renderProfile(pet); },
		});
		return;
	}
	const section = sectionByKey(btn.dataset.add || btn.dataset.edit);
	if (!section) return;
	if (btn.dataset.add) {
		openForm({
			title: `Add ${section.noun}`, fields: section.fields,
			onSave: async (values) => { pet[section.key].push(newItem(section, values)); await savePet(pet); renderProfile(pet); },
		});
		return;
	}
	const item = pet[section.key].find((i) => i.id === btn.dataset.id);
	if (!item) return;
	openForm({
		title: `Edit ${section.noun}`, fields: section.fields, values: item,
		onSave: async (values) => { Object.assign(item, values); await savePet(pet); renderProfile(pet); },
		onDelete: async () => { pet[section.key] = pet[section.key].filter((i) => i !== item); await savePet(pet); renderProfile(pet); },
	});
});

// ---------- page: add or edit a profile ----------

function renderEditProfile(pet, isNew) {
	currentPet = null;
	const back = isNew ? '#/' : `#/pet/${encodeURIComponent(pet.id)}`;
	setTop(isNew ? 'Add a pet' : `Edit ${pet.name}`, back);
	let photo = pet.photo;
	app.innerHTML = `
		<form class="card form" id="profile-form">
			<div class="photo-picker">
				<div id="photo-preview"></div>
				<div class="photo-buttons">
					<label class="btn secondary">Choose photo<input type="file" accept="image/*" id="photo-input" hidden></label>
					<button type="button" class="btn danger-text" id="photo-remove">Remove photo</button>
				</div>
			</div>
			${PROFILE_FIELDS.map((f) => fieldHtml(f, pet[f.key])).join('')}
			<div class="form-actions">
				<a class="btn secondary" href="${back}">Cancel</a>
				<button type="submit" class="btn primary">${isNew ? 'Add pet' : 'Save changes'}</button>
			</div>
		</form>
		${isNew ? '' : `
		<section class="card danger-zone">
			<h3>Delete ${esc(pet.name)}</h3>
			<p class="muted">Removes this profile and everything recorded about them from this device.</p>
			<button type="button" class="btn danger" id="delete-pet">Delete ${esc(pet.name)}</button>
		</section>`}`;

	const preview = document.getElementById('photo-preview');
	const removeBtn = document.getElementById('photo-remove');
	const form = document.getElementById('profile-form');
	const showPhoto = () => {
		preview.innerHTML = avatar({ ...pet, photo, species: form.elements.species.value }, 'xl');
		removeBtn.hidden = !photo;
	};
	showPhoto();
	form.elements.species.addEventListener('change', showPhoto);

	document.getElementById('photo-input').addEventListener('change', async (event) => {
		const file = event.target.files[0];
		if (!file) return;
		try {
			photo = await resizeImage(file);
			showPhoto();
		} catch (err) {
			alert(err.message);
		}
	});
	removeBtn.addEventListener('click', () => { photo = ''; showPhoto(); });

	const submitBtn = form.querySelector('[type="submit"]');
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (submitBtn.disabled || !form.reportValidity()) return; // ignore double taps while saving
		submitBtn.disabled = true;
		Object.assign(pet, readFields(form, PROFILE_FIELDS));
		pet.photo = photo;
		try {
			await savePet(pet);
			if (isNew) requestPersistentStorage();
			location.hash = `#/pet/${encodeURIComponent(pet.id)}`;
		} catch (err) {
			submitBtn.disabled = false;
			alert(`Could not save: ${err.message}`);
		}
	});

	const del = document.getElementById('delete-pet');
	if (del) {
		del.addEventListener('click', async () => {
			if (!confirm(`Delete ${pet.name} and everything recorded about them? This cannot be undone.`)) return;
			await PetStore.remove(pet.id);
			toast(`${pet.name} was deleted`);
			location.hash = '#/';
		});
	}
}

// ---------- page: emergency card ----------

function renderEmergency(pet) {
	currentPet = null;
	setTop('Emergency card', `#/pet/${encodeURIComponent(pet.id)}`);
	const list = (items, fn) => (items.length ? `<ul>${items.map((i) => `<li>${fn(i)}</li>`).join('')}</ul>` : '<p class="muted">None recorded.</p>');
	const meds = activeMedications(pet);
	const care = CARE_FIELDS.filter((f) => pet.care[f.key]);
	const canShare = typeof navigator.share === 'function';
	app.innerHTML = `
		<article class="card emergency-card">
			<header class="em-head">
				${avatar(pet, 'xl')}
				<div>
					<p class="em-label">Pet information</p>
					<h2>${esc(pet.name)}</h2>
					<p class="muted">${esc([pet.species, pet.breed, ageText(pet.birthDate)].filter(Boolean).join(' · '))}</p>
				</div>
			</header>
			${factsHtml(pet)}

			<section class="em-block em-danger">
				<h3>⚠️ Allergies</h3>
				${list(pet.allergies, (a) => `<strong>${esc(a.name)}</strong>${a.severity ? ` <span class="tag${a.severity === 'Severe' ? ' danger' : ''}">${esc(a.severity)}</span>` : ''}${a.reaction ? `<br><span class="muted">${esc(a.reaction)}</span>` : ''}`)}
			</section>
			<section class="em-block">
				<h3>💊 Current medications</h3>
				${list(meds, (m) => `<strong>${esc(m.name)}</strong>${[m.dose, m.frequency].filter(Boolean).length ? ` – ${esc([m.dose, m.frequency].filter(Boolean).join(', '))}` : ''}${m.instructions ? `<br><span class="muted">${nl2br(m.instructions)}</span>` : ''}`)}
			</section>
			<section class="em-block">
				<h3>🩺 Medical conditions</h3>
				${list(pet.conditions, (c) => `<strong>${esc(c.name)}</strong>${c.notes ? `<br><span class="muted">${nl2br(c.notes)}</span>` : ''}`)}
			</section>
			<section class="em-block">
				<h3>📞 Who to call</h3>
				${list(pet.contacts, (c) => `<strong>${esc(c.name)}</strong> <span class="muted">(${esc(c.role)})</span>${c.phone ? `<br><a class="phone" href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a>` : ''}${c.notes ? `<br><span class="muted">${esc(c.notes)}</span>` : ''}`)}
			</section>
			${care.length ? `<section class="em-block"><h3>🍽️ Daily care</h3><dl class="care">${care.map((f) => `<div><dt>${esc(f.label.split(':')[0])}</dt><dd>${nl2br(pet.care[f.key])}</dd></div>`).join('')}</dl></section>` : ''}
			${pet.likes.length || pet.dislikes.length ? `
			<section class="em-block two-col">
				<div><h3>💚 Likes</h3>${list(pet.likes, (l) => esc(l.text))}</div>
				<div><h3>🚫 Dislikes and fears</h3>${list(pet.dislikes, (d) => esc(d.text))}</div>
			</section>` : ''}
			${pet.notes ? `<section class="em-block"><h3>Other notes</h3><p>${nl2br(pet.notes)}</p></section>` : ''}
			<p class="small muted em-footer">Last updated ${esc(new Date(pet.updatedAt).toLocaleDateString())}</p>
		</article>
		<div class="actions no-print">
			<button type="button" class="btn primary" id="share">${canShare ? 'Share as text' : 'Copy as text'}</button>
			<button type="button" class="btn secondary" id="print">Print or save as PDF</button>
		</div>`;

	document.getElementById('print').addEventListener('click', () => window.print());
	document.getElementById('share').addEventListener('click', async () => {
		const textBody = emergencyText(pet);
		try {
			if (canShare) {
				await navigator.share({ title: `${pet.name}: pet information`, text: textBody });
			} else {
				await navigator.clipboard.writeText(textBody);
				toast('Copied. Paste it into a message or email.');
			}
		} catch (err) {
			if (err.name !== 'AbortError') alert(`Could not share: ${err.message}`);
		}
	});
}

// ---------- page: backup and restore ----------

function renderBackup() {
	currentPet = null;
	setTop('Backup and restore', '#/');
	app.innerHTML = `
		<section class="card">
			<h3>Where your information is kept</h3>
			<p>Everything you enter is saved <strong>only on this device</strong>, in this browser. Nothing is uploaded. If you clear your browser data or lose the device, it is gone, so make a backup now and then.</p>
		</section>
		<section class="card">
			<h3>Make a backup</h3>
			<p class="muted">Saves one file containing all your pets, including photos. Keep it somewhere safe, such as your email or cloud drive.</p>
			<button type="button" class="btn primary" id="export">Download backup file</button>
		</section>
		<section class="card">
			<h3>Restore from a backup</h3>
			<p class="muted">Adds the pets from a backup file. A pet that is already here is replaced by the version in the file.</p>
			<label class="btn secondary">Choose backup file<input type="file" accept="application/json,.json" id="import" hidden></label>
		</section>`;

	document.getElementById('export').addEventListener('click', async () => {
		const pets = await PetStore.all();
		const data = { app: APP_NAME, version: 1, exportedAt: new Date().toISOString(), pets };
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `pawfile-backup-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		setTimeout(() => URL.revokeObjectURL(link.href), 1000);
		toast(`Backup of ${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} created`);
	});

	document.getElementById('import').addEventListener('change', async (event) => {
		const file = event.target.files[0];
		event.target.value = '';
		if (!file) return;
		try {
			const data = JSON.parse(await file.text());
			const raw = Array.isArray(data) ? data : data && Array.isArray(data.pets) ? data.pets : null;
			if (!raw) throw new Error('This does not look like a PawFile backup.');
			const pets = raw.map(normalisePet).filter(Boolean);
			const skipped = raw.length - pets.length;
			if (!pets.length) throw new Error('No pets were found in this file.');
			const names = pets.map((p) => p.name).join(', ');
			if (!confirm(`Restore ${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} (${names})?`)) return;
			await PetStore.putMany(pets);
			toast(`Restored ${pets.length} ${pets.length === 1 ? 'pet' : 'pets'}${skipped ? `, skipped ${skipped} unreadable` : ''}`);
			location.hash = '#/';
		} catch (err) {
			alert(err instanceof SyntaxError ? 'That file could not be read. Is it a PawFile backup?' : err.message);
		}
	});
}

// ---------- navigation ----------

async function route() {
	const [page, rawId, sub] = location.hash.replace(/^#\/?/, '').split('/');
	const id = rawId ? decodeURIComponent(rawId) : '';
	if (modal.open) modal.close();
	try {
		if (!page) return await renderList();
		if (page === 'new') return renderEditProfile(newPet(), true);
		if (page === 'backup') return renderBackup();
		if (page === 'pet' && id) {
			const pet = await PetStore.get(id);
			if (pet) {
				if (sub === 'edit') return renderEditProfile(pet, false);
				if (sub === 'emergency') return renderEmergency(pet);
				return renderProfile(pet);
			}
		}
		currentPet = null;
		setTop('Not found', '#/');
		app.innerHTML = '<section class="card"><p>That page could not be found.</p><a class="btn primary" href="#/">Back to my pets</a></section>';
	} catch (err) {
		console.error(err);
		app.innerHTML = `<section class="card"><h3>Something went wrong</h3><p>${esc(err.message)}</p></section>`;
	}
}

window.addEventListener('hashchange', () => { route().then(() => window.scrollTo(0, 0)); });
route();

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Offline support unavailable:', err));
}
