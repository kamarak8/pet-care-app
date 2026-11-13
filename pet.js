// What a pet record contains, and helpers that work on pet data.
// No screen code lives here, so the rules can change without touching the layout.

export const SPECIES = ['Dog', 'Cat', 'Rabbit', 'Guinea pig', 'Bird', 'Reptile', 'Other'];

const SPECIES_EMOJI = { Dog: '🐶', Cat: '🐱', Rabbit: '🐰', 'Guinea pig': '🐹', Bird: '🐦', Reptile: '🦎' };
export const speciesEmoji = (species) => SPECIES_EMOJI[species] || '🐾';

// The basic profile. `type` defaults to a one-line text box.
export const PROFILE_FIELDS = [
	{ key: 'name', label: 'Name', required: true },
	{ key: 'species', label: 'Type of animal', type: 'select', options: SPECIES },
	{ key: 'breed', label: 'Breed', placeholder: 'e.g. Labrador, Domestic shorthair' },
	{ key: 'sex', label: 'Sex', type: 'select', options: ['Unknown', 'Male', 'Female'] },
	{ key: 'neutered', label: 'Neutered / spayed', type: 'select', options: ['Unknown', 'Yes', 'No'] },
	{ key: 'birthDate', label: 'Date of birth (a best guess is fine)', type: 'date' },
	{ key: 'weight', label: 'Weight', placeholder: 'e.g. 12 kg' },
	{ key: 'colour', label: 'Colour and markings', placeholder: 'Helps someone recognise them' },
	{ key: 'microchip', label: 'Microchip number' },
	{ key: 'insurance', label: 'Insurance (company and policy number)' },
	{ key: 'notes', label: 'Anything else people should know', type: 'textarea' },
];

// Day-to-day care: one block of free text per topic.
export const CARE_FIELDS = [
	{ key: 'feeding', label: 'Feeding: what, how much, when', type: 'textarea', placeholder: 'e.g. 1 cup dry food at 7am and 6pm. No treats with chicken.' },
	{ key: 'exercise', label: 'Walks and exercise', type: 'textarea' },
	{ key: 'toilet', label: 'Toilet habits', type: 'textarea' },
	{ key: 'behaviour', label: 'Behaviour and temperament', type: 'textarea', placeholder: 'e.g. nervous around other dogs, pulls on the lead' },
	{ key: 'routine', label: 'Daily routine and sleeping', type: 'textarea' },
];

const today = () => new Date().toISOString().slice(0, 10);

export const isMedicationActive = (med, onDate = today()) => !med.endDate || med.endDate >= onDate;

// Lists of entries on each pet. Each has its own form fields and a one-line summary.
export const SECTIONS = [
	{
		key: 'allergies', title: 'Allergies', noun: 'allergy', icon: '⚠️',
		empty: 'No allergies recorded. If there are none, it is still worth knowing.',
		fields: [
			{ key: 'name', label: 'Allergic to', required: true, placeholder: 'e.g. chicken, bee stings, penicillin' },
			{ key: 'reaction', label: 'What happens', placeholder: 'e.g. itchy skin, swelling, vomiting' },
			{ key: 'severity', label: 'How serious', type: 'select', options: ['Mild', 'Moderate', 'Severe'] },
		],
		summary: (i) => ({ main: i.name, sub: [i.severity, i.reaction].filter(Boolean).join(' · '), tag: i.severity === 'Severe' ? 'Severe' : '', danger: i.severity === 'Severe' }),
	},
	{
		key: 'medications', title: 'Medications and prescriptions', noun: 'medication', icon: '💊',
		empty: 'No medications recorded.',
		fields: [
			{ key: 'name', label: 'Medicine', required: true },
			{ key: 'dose', label: 'Dose', placeholder: 'e.g. 1 tablet, 2.5 ml' },
			{ key: 'frequency', label: 'How often', placeholder: 'e.g. twice a day with food' },
			{ key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'e.g. hide in cheese; never on an empty stomach' },
			{ key: 'prescribedBy', label: 'Prescribed by' },
			{ key: 'startDate', label: 'Started', type: 'date' },
			{ key: 'endDate', label: 'Finishes (leave blank if ongoing)', type: 'date' },
		],
		sort: (a, b) => Number(isMedicationActive(b)) - Number(isMedicationActive(a)) || a.name.localeCompare(b.name),
		summary: (i) => ({ main: i.name, sub: [i.dose, i.frequency].filter(Boolean).join(' · '), tag: isMedicationActive(i) ? '' : 'Finished', muted: !isMedicationActive(i) }),
	},
	{
		key: 'conditions', title: 'Medical conditions', noun: 'condition', icon: '🩺',
		empty: 'No medical conditions recorded.',
		fields: [
			{ key: 'name', label: 'Condition', required: true, placeholder: 'e.g. epilepsy, arthritis, heart murmur' },
			{ key: 'diagnosed', label: 'Diagnosed', type: 'date' },
			{ key: 'notes', label: 'What to watch for and what to do', type: 'textarea' },
		],
		summary: (i) => ({ main: i.name, sub: i.notes }),
	},
	{
		key: 'contacts', title: 'Emergency contacts', noun: 'contact', icon: '📞',
		empty: 'Add the vet and at least one person to call.',
		fields: [
			{ key: 'role', label: 'Who they are', type: 'select', options: ['Owner', 'Vet', 'Emergency vet', 'Backup carer', 'Family or friend', 'Other'] },
			{ key: 'name', label: 'Name', required: true, placeholder: 'Person or practice name' },
			{ key: 'phone', label: 'Phone', type: 'tel' },
			{ key: 'notes', label: 'Notes', placeholder: 'e.g. address, opening hours, has a spare key' },
		],
		summary: (i) => ({ main: i.name, sub: [i.role, i.phone].filter(Boolean).join(' · ') }),
	},
	{
		key: 'likes', title: 'Likes', noun: 'like', icon: '💚',
		empty: 'Favourite toys, treats, games, places to be scratched…',
		fields: [{ key: 'text', label: 'Something they like', required: true }],
		summary: (i) => ({ main: i.text }),
	},
	{
		key: 'dislikes', title: 'Dislikes and fears', noun: 'dislike', icon: '🚫',
		empty: 'Things that upset or scare them, e.g. fireworks, the hoover, men in hats.',
		fields: [{ key: 'text', label: 'Something they dislike or fear', required: true }],
		summary: (i) => ({ main: i.text }),
	},
	{
		key: 'vetVisits', title: 'Vet visits', noun: 'vet visit', icon: '🏥',
		empty: 'No vet visits recorded yet.',
		fields: [
			{ key: 'date', label: 'Date', type: 'date', required: true },
			{ key: 'reason', label: 'Reason', required: true, placeholder: 'e.g. vaccination, limping, annual check' },
			{ key: 'clinic', label: 'Practice' },
			{ key: 'vet', label: 'Vet seen' },
			{ key: 'outcome', label: 'What happened / advice given', type: 'textarea' },
			{ key: 'followUp', label: 'Follow-up due', type: 'date' },
		],
		sort: (a, b) => b.date.localeCompare(a.date),
		summary: (i) => ({ main: i.reason, sub: [formatDate(i.date), i.clinic].filter(Boolean).join(' · '), tag: i.followUp && i.followUp >= today() ? `Follow-up ${formatDate(i.followUp)}` : '' }),
	},
];

export const sectionByKey = (key) => SECTIONS.find((s) => s.key === key);

export function sortedItems(pet, section) {
	const items = [...(pet[section.key] || [])];
	return section.sort ? items.sort(section.sort) : items;
}

export function uid() {
	if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function newPet() {
	const now = new Date().toISOString();
	const pet = { id: uid(), photo: '', care: {}, createdAt: now, updatedAt: now };
	PROFILE_FIELDS.forEach((f) => { pet[f.key] = f.type === 'select' ? f.options[0] : ''; });
	CARE_FIELDS.forEach((f) => { pet.care[f.key] = ''; });
	SECTIONS.forEach((s) => { pet[s.key] = []; });
	return pet;
}

export function newItem(section, values) {
	const item = { id: uid() };
	section.fields.forEach((f) => { item[f.key] = values[f.key] || ''; });
	return item;
}

const text = (v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');

// Cleans a pet record that came from a backup file. Returns null if it is unusable.
export function normalisePet(raw) {
	if (!raw || typeof raw !== 'object') return null;
	const pet = newPet();
	if (text(raw.id)) pet.id = text(raw.id);
	PROFILE_FIELDS.forEach((f) => {
		const value = text(raw[f.key]);
		if (f.type === 'select') { if (f.options.includes(value)) pet[f.key] = value; } else pet[f.key] = value;
	});
	if (!pet.name) return null;
	pet.photo = typeof raw.photo === 'string' && raw.photo.startsWith('data:image/') ? raw.photo : '';
	CARE_FIELDS.forEach((f) => { pet.care[f.key] = text(raw.care && raw.care[f.key]); });
	SECTIONS.forEach((s) => {
		const list = Array.isArray(raw[s.key]) ? raw[s.key] : [];
		pet[s.key] = list
			.filter((o) => o && typeof o === 'object')
			.map((o) => {
				const item = { id: text(o.id) || uid() };
				s.fields.forEach((f) => { item[f.key] = text(o[f.key]); });
				return item;
			})
			.filter((item) => s.fields.every((f) => !f.required || item[f.key]));
	});
	pet.createdAt = text(raw.createdAt) || pet.createdAt;
	pet.updatedAt = text(raw.updatedAt) || pet.updatedAt;
	return pet;
}

export function formatDate(iso) {
	if (!iso) return '';
	const d = new Date(`${iso}T00:00:00`);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ageText(birthDate, now = new Date()) {
	if (!birthDate) return '';
	const born = new Date(`${birthDate}T00:00:00`);
	if (Number.isNaN(born.getTime()) || born > now) return '';
	let months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
	if (now.getDate() < born.getDate()) months -= 1;
	const years = Math.floor(months / 12);
	const rest = months % 12;
	const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
	if (years === 0) return months === 0 ? 'Under 1 month' : plural(months, 'month');
	return rest ? `${plural(years, 'year')} ${plural(rest, 'month')}` : plural(years, 'year');
}

export const activeMedications = (pet) => (pet.medications || []).filter((m) => isMedicationActive(m));

// A plain-text summary someone can be sent by message, or read over the phone.
export function emergencyText(pet) {
	const lines = [];
	const kind = [pet.species, pet.breed].filter(Boolean).join(', ');
	lines.push(`PET INFORMATION: ${pet.name}${kind ? ` (${kind})` : ''}`);
	const facts = [
		ageText(pet.birthDate) && `Age: ${ageText(pet.birthDate)}`,
		pet.sex !== 'Unknown' && `Sex: ${pet.sex}`,
		pet.weight && `Weight: ${pet.weight}`,
		pet.colour && `Looks like: ${pet.colour}`,
		pet.microchip && `Microchip: ${pet.microchip}`,
		pet.insurance && `Insurance: ${pet.insurance}`,
	].filter(Boolean);
	if (facts.length) lines.push(facts.join('\n'));

	const block = (title, entries) => { if (entries.length) lines.push(`${title}:\n${entries.map((e) => `- ${e}`).join('\n')}`); };
	block('ALLERGIES', pet.allergies.map((a) => [a.name, a.severity, a.reaction].filter(Boolean).join(' – ')));
	block('MEDICATIONS', activeMedications(pet).map((m) => [m.name, m.dose, m.frequency, m.instructions].filter(Boolean).join(' – ')));
	block('MEDICAL CONDITIONS', pet.conditions.map((c) => [c.name, c.notes].filter(Boolean).join(' – ')));
	block('CONTACTS', pet.contacts.map((c) => [c.role, c.name, c.phone].filter(Boolean).join(' – ')));
	CARE_FIELDS.forEach((f) => { if (pet.care[f.key]) lines.push(`${f.label.split(':')[0].toUpperCase()}:\n${pet.care[f.key]}`); });
	block('LIKES', pet.likes.map((l) => l.text));
	block('DISLIKES AND FEARS', pet.dislikes.map((d) => d.text));
	if (pet.notes) lines.push(`OTHER NOTES:\n${pet.notes}`);
	return lines.join('\n\n');
}
