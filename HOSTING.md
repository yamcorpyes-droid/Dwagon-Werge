# Putting Dwagon Merge on the tablet

The game is hosted for free on **GitHub Pages**, then installed on the tablet like an app. After the first launch it works with **no internet and no PC**. Her progress is saved on the tablet.

You only do Parts 1 and 2 once.

## Part 1: Put the game online (on the PC, about 10 minutes)
1. Go to <https://github.com> and create a free account. Choose your username carefully; it becomes part of the game's address.
2. Click **+** (top right), then **New repository**.
   - Name: `dwagon-merge`
   - Choose **Public**. Free GitHub Pages needs a public repository. Anyone with the link could see the game files, including your ending message in `js/config.js`, but nobody will find it unless you share the link.
   - Click **Create repository**.
3. On the new repository page, click **uploading an existing file**.
4. Open the `C:\Claude\Mergedwagons` folder in File Explorer, select **everything inside it**, and drag it onto the upload page:
   - `index.html`, `sw.js`, `manifest.webmanifest`
   - the `css`, `js` and `icons` folders
   - `ROADMAP.md` and `HOSTING.md`, which are fine to include
5. Click **Commit changes**.
6. Go to **Settings**, then **Pages** (in the left menu). Under **Branch**, pick `main` and `/ (root)`, then click **Save**.
7. Wait a minute or two, then refresh the page. It shows the address, which looks like:
   **`https://YOUR-USERNAME.github.io/dwagon-merge/`**

## Part 2: Install it on the Samsung tablet
1. Open that address in **Chrome** or **Samsung Internet** on the tablet.
2. Install it:
   - Tap the **📲 Install app** button in the game, if it shows, or
   - Chrome: **⋮** menu, then **Add to Home screen** (or **Install app**)
   - Samsung Internet: **☰** menu, then **Add page to**, then **Home screen**
3. A 🐉 **Dwagon Merge** icon appears on the home screen. It opens full-screen.
4. Open it once while online, so every file is saved to the tablet. After that it works offline.

## Updating the game later
When the game changes on the PC:
1. In the repository, click **Add file**, then **Upload files**, and drag in the changed files and folders. GitHub replaces the old ones.
2. **Important:** in `sw.js`, raise the version number, e.g. `dwagon-merge-v1` to `dwagon-merge-v2`. Otherwise the tablet keeps using its saved copy.
3. The tablet picks up the update the next time she opens the game while online, and uses it from the launch after that.

Her progress is not affected by updates.

## Making your own levels
Tap the **🐉 Dwagon Merge** title 5 times to open the hidden level editor. Levels you save appear under **🛠 My Levels** on the World Map (free to play; they live on that device, and 💾 Back up carries them along). The **Level data** box shows the level as text; paste it into `js/data/levels.js` (with a new `key` and `world`) to make it a real Adventure for everyone.

## Moving or protecting her progress
- **💾 Back up** saves her whole game as a file in the tablet's Downloads.
- **📂 Restore** loads a backup file, for example on a new tablet or after reinstalling.
- Progress belongs to the game's address. If you ever change the address (a new username or repository name), use **Back up** on the old one and **Restore** on the new one.

## Playing on the PC
- Open the same `https://…github.io/dwagon-merge/` address in a browser. That's a separate save from the tablet; use Back up and Restore to copy progress across.
- Double-clicking `index.html` in the folder also works, but without the offline install.
