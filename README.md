# PawFile: pet care records

PawFile ("PawFile" is a working title and easy to change) keeps everything someone needs to know about your pets in one place, so a sitter, friend or vet can look after them if you aren't there.

## What it does (version 0.1)

- **Several pets**, each with a profile and photo: type of animal, breed, sex, neutered, date of birth (age is worked out automatically), weight, markings, microchip and insurance.
- **Allergies** with how serious they are. Severe ones show as a red warning at the top of the profile.
- **Medications and prescriptions**: dose, how often, instructions and end date. Finished courses are greyed out and left off the emergency card.
- **Medical conditions**, plus what to watch for.
- **Emergency contacts**: the vet, the owner and backup carers. Phone numbers can be tapped to call.
- **Daily care**: feeding, exercise, toilet habits, behaviour and routine.
- **Likes**, and **dislikes and fears**.
- **Vet visits**, newest first, with follow-up dates.
- **Emergency card**: a one-page summary that can be shared as a text message, printed, or saved as a PDF.
- **Backup and restore**: saves everything, photos included, to a single file.

All information stays **on the device**. There are no accounts and nothing is uploaded.

## Trying it on this computer

1. Open a terminal in this folder.
2. Run:
   ```
   node serve.js
   ```
3. Open http://localhost:5173 in Chrome or Edge.
4. Press Ctrl+C in the terminal to stop it.

## Files

| File | What it is |
|---|---|
| `index.html` | The page that loads the app |
| `app.js` | The screens and buttons |
| `pet.js` | What a pet record contains, plus the rules (age, the emergency summary, cleaning up backups) |
| `db.js` | Saving to the device's built-in storage |
| `styles.css` | Look and layout, including dark mode and printing |
| `sw.js`, `manifest.webmanifest`, `icons/` | Let it be installed like an app and opened offline |
| `serve.js` | The small local web server for testing |

## Putting it online (GitHub Pages)

The app is hosted free on GitHub Pages. Only the app's code goes online; pet information never leaves each device.

**First time:**
1. In **GitHub Desktop**: File → Add local repository → choose `Documents\pet-care-app`.
2. Write a summary such as "Version 0.1 - first release" and click **Commit to main**.
3. Click **Publish repository**. **Untick "Keep this code private"** (free Pages sites need a public repository), then click Publish.
4. On github.com, open the repository → **Settings** → **Pages**. Under "Build and deployment", choose **Deploy from a branch**, then branch **main**, folder **/ (root)**, and click **Save**.
5. Wait a minute or two. The address appears at the top of that page, something like `https://<your-username>.github.io/pet-care-app/`.

**Updating it later:** commit in GitHub Desktop, then click **Push origin**. The site updates within a couple of minutes. An app already installed on a phone picks up the change the next time it's opened with internet access.

**Installing on an Android phone:** open the address in Chrome → ⋮ menu → **Install app** (or "Add to Home screen").

## Play Store (later)

Wrap the hosted app with Google's Bubblewrap ("Trusted Web Activity") or Capacitor. That needs a Google Play developer account (a one-off fee), screenshots and a privacy policy. The PNG icons are already in `icons/`.
