// One-shot seed script. Run inside the server container:
//   docker exec portal2-server node seed-guides.js
// Or from the host (Node 20+):
//   SERVER_URL=http://localhost:3001 node server/seed-guides.js

const baseUrl = process.env.SERVER_URL || 'http://localhost:3001';

const guides = [
  {
    title: 'Reset my OneLogin password',
    category: 'identity',
    source_type: 'faq',
    body: `# Reset my OneLogin password

Slice uses **OneLogin** as the single sign-on for nearly every internal tool — Google Workspace, Slack, Jira, Confluence, AWS, GitHub. If you can't sign in to any one of them, this is almost always the place to start.

## Self-serve reset

1. Go to https://slice.onelogin.com
2. Click **Forgot Password** below the sign-in box
3. Enter your @slice.com email
4. Check your inbox for a reset link — it usually arrives in under 30 seconds (check Spam if not)
5. Click the link, choose a new password (min 12 characters, mix of upper/lower, numbers, at least one symbol)
6. Sign in with the new password

## If the reset email doesn't arrive

- Wait 5 minutes — Google's spam filter sometimes holds it briefly
- Check **Spam** and **All Mail** in Gmail
- Make sure you used your @slice.com address, not a personal one

## If self-serve doesn't work

If the link is expired, you're locked out, or the email never arrives, file a ticket with the **Identity & Access** team. Typical response is 2 hours during business hours; on-call covers urgent lockouts after hours.

## What this resets

Resetting your OneLogin password resets access to almost everything — Google Workspace, Slack, GitHub, AWS — because they all federate through OneLogin. You usually don't need to reset each app individually.`,
  },

  {
    title: "Wi-Fi isn't working",
    category: 'network',
    source_type: 'guide',
    body: `# Wi-Fi isn't working

Quick triage that solves about 80% of Wi-Fi issues at HQ. Try these in order — each step is ~30 seconds.

## Step 1: Toggle Wi-Fi off and on

Click the Wi-Fi icon in your menu bar (Mac) or system tray (Windows), turn it off, wait 5 seconds, turn it back on. Reconnect to **Slice-Corp**.

## Step 2: Forget the network and rejoin

If the toggle didn't help, "forget" the Slice-Corp network and rejoin from scratch — sometimes a stale auth cache is the problem.

### Mac

1. System Settings → Wi-Fi → click the **i** next to Slice-Corp → **Forget This Network**
2. Click Slice-Corp from the list and sign in again with your OneLogin email + password

### Windows

1. Settings → Network & Internet → Wi-Fi → **Manage known networks**
2. Select Slice-Corp → **Forget**
3. Reconnect from the Wi-Fi flyout, sign in with OneLogin

## Step 3: Check if it's just you

Look at someone next to you — if their Wi-Fi works fine, it's your laptop, not the office. Restart it.

## Step 4: Check the IT status board

Go to **status.slice.com** to see if Network Operations has flagged an outage. If so, you'll see an active incident.

## If none of this works

File a ticket with the **Network Operations** team. Include:

- Building / floor / desk number
- The error message you see (screenshot helps)
- Whether anyone near you has the same issue

P1 SLA: 1 hour during business hours.`,
  },

  {
    title: 'Laptop running slow',
    category: 'performance',
    source_type: 'guide',
    body: `# Laptop running slow

A slow laptop is almost always one of three things: full disk, runaway process, or something pending a reboot. Here's how to check each in under 10 minutes.

## Check 1: Reboot if you haven't in a week

This is the single highest-yield fix. macOS and Windows both queue updates that finish on reboot — going more than a week without restarting causes weird slowdowns. Save your work and restart now if it's been a while.

## Check 2: Disk space

A nearly-full disk slows everything down because the OS can't allocate scratch space.

### Mac

1. Apple menu → **About This Mac** → **More Info** → **Storage Settings**
2. If the bar is more than 90% full, free space — empty Trash, clean Downloads, remove unused apps
3. The **Recommendations** panel can clear 20–50 GB automatically

### Windows

1. Settings → System → Storage
2. Run **Storage Sense** to clear temp files and Recycle Bin
3. If you're under 10 GB free, that's almost certainly your problem

## Check 3: Runaway process

### Mac — Activity Monitor

Spotlight → "Activity Monitor" → **CPU** tab → sort by % CPU. If something is at 90%+ for more than a few minutes and isn't a video call or build, quit it.

### Windows — Task Manager

Ctrl+Shift+Esc → **Processes** tab → click the CPU column to sort. Same logic — kill anything stuck above 90%.

## Common culprits

- **Backup software** indexing for the first time after a system update
- **Video calls** with screen-share running in the background
- **Browser tabs** — close everything you're not actively using
- **Antivirus** doing a full scan (let it finish, then reboot)

## If it's still slow

If you've done all of the above and it's still molasses, file a ticket with the **End-User Compute** team. Include the output of Activity Monitor / Task Manager (screenshot helps). Replacement laptops are 1–2 business days if the machine is genuinely failing.`,
  },

  {
    title: 'Request app access',
    category: 'access',
    source_type: 'guide',
    body: `# Request app access

Need a new app, group, repo, or environment? Here's how it gets approved and how long it takes.

## How to file the request

1. Go to the **Access Requests** section of the IT Hub
2. Pick the app or group you need from the catalog
3. Write a one-line **business justification** — don't skip this, it's what your manager and the app owner read
4. Submit

## Approval flow

For most apps, the request goes:

1. Your **manager** approves (or rejects)
2. The **app owner** approves (or rejects)
3. **Identity & Access** provisions you in OneLogin

You'll get a Slack DM and an email at each step.

## SLA

| App tier | Typical time |
|---|---|
| Standard apps (most things) | 1 business day |
| Privileged / admin access | 2–3 business days (Security review) |
| External vendor accounts | 3–5 business days |

## If it's urgent

Mark the request **Urgent** with a one-line "why" — your manager and the app owner get a higher-priority Slack ping. Use this for genuine blockers (deploy gate, P1 incident response), not impatience.

## After approval

Most apps federate through OneLogin, so once you're approved you'll see the app appear on your OneLogin dashboard within ~5 minutes. If it doesn't, sign out and back into OneLogin to refresh the directory.

## Common pitfalls

- **Wrong group**: ask the app owner before submitting if you're unsure which group level you need (Reader vs Contributor vs Admin). Re-requesting wastes a day.
- **No justification**: requests with empty justification get auto-rejected after 24 hours.
- **Manager out**: if your manager is on PTO, escalate to their delegate (set in Workday) rather than waiting.`,
  },

  {
    title: 'Email delivery issue',
    category: 'email',
    source_type: 'guide',
    body: `# Email delivery issue

Slice runs on **Google Workspace** — Gmail, Calendar, Drive, Meet. Most "email isn't working" issues fall into one of four categories. Find yours below.

## I'm not receiving an expected email

1. Check **Spam** and **All Mail** in Gmail (especially for password resets and external invitations)
2. Search by sender domain: type \`from:example.com\` in the search bar
3. Check **Filters and Blocked Addresses** in Gmail Settings — old filters sometimes route mail away
4. Ask the sender if they got a bounce-back

If the sender is getting bounces, send IT the bounce text — it usually tells us exactly what's wrong (often a misspelled address or a sender on our blocklist).

## My email isn't being delivered

1. Check the **Sent** folder — did it actually go?
2. Look for a Mailer-Daemon bounce in your inbox
3. If you're sending to an external domain, the recipient's spam filter might be holding it

If you're sending a calendar invite that's not showing up, Google has a known issue with delayed external invites (~10 min lag). Slack the recipient if it's time-sensitive.

## I'm getting too much spam

1. Open the spam message → click **Report spam** (don't just delete — reporting trains Gmail's filters)
2. Block the sender: open the message → kebab menu (⋮) → **Block <sender>**
3. For repeated phishing, forward to **phishing@slice.com**

## Suspected phishing

**Don't click links or open attachments.** Use the **Report Phishing** add-on in Gmail's toolbar, or forward the message to **phishing@slice.com**. Security reviews every report within 4 hours.

## Shared mailbox isn't working

If you've been added to a shared mailbox (e.g. **support@slice.com**) and don't see it:

1. Sign out of Gmail and back in to refresh delegations
2. If it still doesn't appear, file a ticket — the share usually needs to be re-issued by Identity & Access

## File a ticket

If none of the above fits, file with the **Collaboration** team. SLA is 4 hours during business hours.`,
  },

  {
    title: 'Set up a new device',
    category: 'onboarding',
    source_type: 'runbook',
    body: `# Set up a new device

For your first day or a replacement laptop. Plan ~90 minutes start to finish; most of that is encryption, OS updates, and software install in the background.

## Before you start

You'll need:

- Your OneLogin credentials (sent to your personal email by IT before day one)
- A second device (phone or tablet) to install OneLogin Protect for MFA
- Your laptop charger plugged in — encryption is slow on battery

## Step 1: Boot and sign in

1. Power on. The setup wizard guides you through region, keyboard layout, and Wi-Fi
2. Connect to **Slice-Corp** (in the office) or your home Wi-Fi (remote)
3. When prompted for sign-in, use your **@slice.com** email and OneLogin password

## Step 2: Install OneLogin Protect (MFA)

On your phone:

1. App Store / Play Store → search **OneLogin Protect**
2. Install and open the app
3. On your laptop, sign in to https://slice.onelogin.com — it'll prompt you to enroll a device
4. Scan the QR code with the OneLogin Protect app
5. Approve the test push

This same OneLogin Protect code is also what you'll use for VPN MFA.

## Step 3: Wait for the device to baseline

Your laptop will install the standard Slice software bundle automatically (Jamf on Mac, Intune on Windows). You'll see notifications as things install — leave it alone for ~30 minutes.

What gets installed:

- Slack
- Chrome and Firefox
- 1Password (you'll be invited to the company vault separately)
- GlobalProtect (VPN client)
- Zoom
- The standard dev toolchain (if you're an engineer)

## Step 4: Encryption check

- **Mac**: System Settings → Privacy & Security → **FileVault** → confirm it's **On**
- **Windows**: Settings → Privacy & Security → **Device encryption** → confirm it's **On**

If either is off, file a ticket — your laptop should not be in active use until disk encryption finishes.

## Step 5: Connect to VPN

Open **GlobalProtect** from the menu bar / system tray:

1. Portal: **vpn.slice.systems**
2. Username: your @slice.com email
3. Password: your OneLogin password
4. MFA: the 6-digit code from OneLogin Protect

You should see "Connected" within 10 seconds.

## Step 6: First-day checklist

- Sign in to Google Workspace at https://mail.google.com (federates through OneLogin)
- Sign in to Slack and join **#it-help**, **#general**, and your team's channel
- Confirm GitHub access if you're an engineer
- Verify your manager shows up in Workday
- Note your laptop's asset tag (sticker on the bottom)

## If something doesn't work

File a ticket with **End-User Compute**. Day-one issues are P1 — typical response is under an hour during business hours.`,
  },

  {
    title: 'Re-enroll OneLogin Protect on a new phone',
    category: 'identity',
    source_type: 'guide',
    body: `# Re-enroll OneLogin Protect on a new phone

When you switch phones, you have to re-pair OneLogin Protect (our MFA app) to keep getting prompts. The fastest path depends on whether you still have your old phone working.

## With both phones available

1. On your **new phone**, install **OneLogin Protect** from the App Store / Play Store
2. Sign in to https://slice.onelogin.com on your laptop
3. Approve the MFA prompt **on your old phone** one last time
4. Click your name (top-right) → **Profile** → **Security Factors** → **Add Factor** → OneLogin Protect
5. Scan the QR code with the OneLogin Protect app on your **new phone**
6. Approve the test push to confirm it works
7. Remove the old phone from Security Factors (click **Remove** next to its entry)

## If you no longer have your old phone

You're locked out of MFA — this needs IT.

1. File a ticket with the **Identity & Access** team
2. Mark it **Urgent** if it's blocking your work day
3. IT will verify your identity over a video call, then issue a one-time bypass code so you can log in and re-enroll on the new phone

Typical turnaround: 30 minutes during business hours, ~2 hours after-hours.

## Tip

The next time you log in, set up a backup factor (SMS or a hardware security key) — that way a future phone swap doesn't require IT.`,
  },

  {
    title: 'External monitor not detected',
    category: 'hardware',
    source_type: 'guide',
    body: `# External monitor not detected

You plugged in a monitor and your laptop is ignoring it. Try in this order — each step is under 30 seconds.

## Step 1: Re-seat the cable

Unplug from BOTH ends (laptop and monitor), wait 10 seconds, plug back in firmly. USB-C and HDMI both have a "click" feel — make sure you feel it.

## Step 2: Power-cycle the monitor

Turn the monitor off, unplug its power cord, wait 30 seconds, plug it back in, turn on.

## Step 3: Force display detection

### Mac

Hold **Option**, then click Apple menu → System Settings → Displays. A **Detect Displays** button appears.

### Windows

Right-click the desktop → **Display settings** → scroll to "Multiple displays" → click **Detect**.

## Step 4: Check the cable / dock

Not all USB-C cables are equal:

- Some cheap USB-C cables only carry data, not video
- Try a different cable, or a known-good port on the dock
- 4K monitors and Studio Displays need a **Thunderbolt-rated** cable, not just plain USB-C

## Step 5: Restart the laptop

Plug everything in first, then restart. Sometimes the system reads the cable on boot only.

## Still nothing

Test the monitor with a coworker's laptop. If it works there, it's your laptop's port or graphics. File a ticket with **End-User Compute** — include the monitor model and cable type.`,
  },

  {
    title: 'Microphone or camera not working in Zoom or Meet',
    category: 'meetings',
    source_type: 'guide',
    body: `# Microphone or camera not working in Zoom or Meet

Mid-meeting and your mic or camera is grayed out? Almost always a permission issue or wrong input source.

## Quick fix: pick the right input

- **Zoom**: gear icon → **Audio** / **Video** → confirm the right device is selected (built-in vs USB headset)
- **Google Meet**: 3-dot menu → **Settings** → check Audio + Video tabs

If the device shows up but the mic indicator doesn't move when you talk, the source is selected but muted at the OS level.

## OS-level permissions (most common cause)

### Mac

System Settings → **Privacy & Security** → **Microphone** / **Camera** → toggle ON for Zoom / Chrome / your browser.

After toggling, **fully quit** the app (Cmd+Q) and reopen. Mac caches permissions until restart.

### Windows

Settings → **Privacy & Security** → **Microphone** / **Camera** → "Let apps access" → ON. Then scroll down to Zoom / Chrome and confirm those are also ON.

## Browser-specific (Meet, Slack huddles)

Click the lock icon left of the URL → **Site settings** → ensure Camera and Mic are set to **Allow** for the meeting domain.

## Bluetooth gotcha

Bluetooth headsets often connect but use a "hands-free" profile that disables the mic. To fix:

- Mac: Sound settings → choose the headset for **both** Output AND Input (not just Output)
- If still no luck, switch to wired headphones for important meetings

## If the hardware itself is the problem

Plug a USB headset/mic in. If that works but the built-in doesn't, the built-in mic / camera is hardware-failed — file a ticket with **End-User Compute**.

## Don't trust the in-app test

The "Test mic" feature inside Zoom is sometimes lying. Best test: ask someone in the meeting to confirm they hear you.`,
  },

  {
    title: "Bluetooth headphones won't connect",
    category: 'hardware',
    source_type: 'guide',
    body: `# Bluetooth headphones won't connect

Pairing issues are 99% one of three things: the headphones aren't actually in pairing mode, they're already paired to another device, or there's a stale pairing on your laptop.

## Step 1: Force pairing mode

Most headphones need you to hold the power button for **5–10 seconds** until the LED flashes (usually fast, often blue+red alternating). Just turning them on isn't enough.

Common patterns:

- **AirPods**: open the case, hold the back button until the LED flashes
- **Sony WH series**: hold power for ~7 seconds
- **Bose**: hold power past "ON" until you hear "ready to connect"
- **Sennheiser**: hold the multi-function button for 4 seconds

## Step 2: Check they're not already paired elsewhere

Bluetooth headphones can only talk to one device at a time. If they auto-connect to your phone first, your laptop won't see them.

- Disconnect from your phone (Bluetooth → tap → "Disconnect")
- Or turn off Bluetooth on your phone temporarily

## Step 3: Remove a stale pairing on your laptop

If the laptop USED to pair with these headphones but now ignores them, the cached pairing is corrupt.

- **Mac**: System Settings → Bluetooth → click the **i** next to the device → **Forget Device**. Then pair fresh.
- **Windows**: Settings → Devices → Bluetooth → click the device → **Remove device**. Then pair fresh.

## Step 4: Reset the headphones

Most headphones have a factory-reset combo (usually power + volume buttons held together). Check the manual or the vendor's website — this clears all pairings on the headphones themselves.

## Step 5: Restart Bluetooth

- **Mac**: Option-click the Bluetooth icon → **Reset the Bluetooth module**
- **Windows**: Restart the PC. Faster than digging through services.

## Still nothing

File a ticket with **End-User Compute** with the headphone model and the steps you've tried.`,
  },

  {
    title: 'Browser shows "Your connection isn\'t private"',
    category: 'network',
    source_type: 'guide',
    body: `# Browser shows "Your connection isn't private"

Almost always one of three things: an unsigned-into captive Wi-Fi, a wrong system clock, or a missing corporate SSL inspection cert.

## First: is it everywhere or just one site?

- **Every site** (google.com, slack.com, your email) → it's your laptop or network
- **One site** → it's that site's certificate

## Cause 1: Captive portal not signed in

If you're at a hotel, coffee shop, or airport, you have to sign in to the captive portal first. To trigger it:

1. Open a new tab and go to **http://example.com** (HTTP, not HTTPS)
2. The captive portal page should appear
3. Sign in / accept the terms
4. Now https sites should work

## Cause 2: System clock is wrong

SSL certs include a "valid from / valid to" date. If your clock is off by more than a few hours, every cert appears expired or not yet valid.

Fix:

- **Mac**: System Settings → General → Date & Time → toggle OFF then ON "Set time and date automatically"
- **Windows**: Settings → Time & Language → Date & Time → toggle OFF then ON "Set time automatically"

## Cause 3: Missing Slice SSL inspection cert

If you're on a managed laptop and visiting an external site, the network sometimes intercepts HTTPS for security scanning. The Slice CA cert needs to be trusted on your machine.

Normally this is automatic via Jamf / Intune. If it's not (e.g. on a brand-new laptop), file a ticket with **End-User Compute** — the fix is for IT to push the cert.

## Cause 4: The site's cert is genuinely broken

If only ONE external site shows the warning, the site itself probably has a bad cert. Click the warning, look for "Issued by" and "Expired on" — the site owner needs to fix it. Don't bypass for unknown sites; only proceed if you know it's safe.

## Don't click "Proceed anyway" blindly

Especially for internal Slice sites, this warning is sometimes a real attack indicator. If unsure, forward the URL to **phishing@slice.com**.`,
  },

  {
    title: 'Slack keeps disconnecting or won\'t load',
    category: 'collaboration',
    source_type: 'guide',
    body: `# Slack keeps disconnecting or won't load

Slack has more failure modes than most apps because it's both a desktop app and a real-time websocket. Quick diagnostic ladder:

## Step 1: Confirm it's not a Slack outage

Open a browser, go to **status.slack.com**. If Slack reports a problem, you're done — wait it out.

If Slack itself is fine, check your network — does Gmail load? Does VPN work? If everything else is broken, the issue is your network (see the Wi-Fi guide).

## Step 2: Reload the workspace

In the Slack desktop app: **Cmd-R** (Mac) / **Ctrl-R** (Windows). Forces a full reload without restarting the app.

## Step 3: Quit and reopen

Don't just close the window — actually quit the app:

- **Mac**: Cmd+Q from the Slack menu
- **Windows**: right-click Slack in the system tray → Quit

Reopen. Many disconnect issues are stale websocket state that a full restart clears.

## Step 4: Clear the cache

If reloads don't help, the local cache may be corrupt.

- Slack menu → **Help** → **Troubleshooting** → **Clear Cache and Restart**

You'll lose draft messages, but get a fresh start.

## Step 5: Reinstall

If clearing cache doesn't fix it:

1. Quit Slack
2. Move the Slack app to Trash / uninstall
3. Reinstall from **slack.com/downloads** (don't use the App Store / Microsoft Store version — the standalone is more reliable)

## Step 6: Check VPN

If you're on VPN and Slack stops working but Gmail still works, Slack's websocket might be blocked by a bad routing rule. Disconnect VPN, see if Slack reconnects. If it does, file a ticket with **Network Operations** — the VPN ACL needs adjusting.

## Persistent disconnects on Wi-Fi but not Ethernet

Aggressive corporate Wi-Fi access points sometimes kick websockets every 10–15 minutes. If this is consistent, file a ticket with **Network Operations** and mention the floor / building.`,
  },

  {
    title: 'App keeps crashing or freezing',
    category: 'performance',
    source_type: 'guide',
    body: `# App keeps crashing or freezing

Generic crash troubleshooting that works for almost any app. Try in order — each step takes under 2 minutes.

## Step 1: Force quit and reopen

- **Mac**: Cmd+Option+Esc → select the app → Force Quit
- **Windows**: Ctrl+Shift+Esc → right-click the app → End task

Reopen. If it works now, you're done — but note the trigger; it may recur.

## Step 2: Reboot

The classic. Mac and Windows both queue updates that finish on reboot — going more than a week without restarting is a top cause of weird crashes.

## Step 3: Update the app

Most apps have **Check for Updates** in their menu. Crashes after a recent OS update usually mean you need a newer app version.

- Mac App Store apps: open App Store → Updates
- Everything else: the app's own menu, or visit the vendor's website

## Step 4: Check disk space

If your disk is more than 90% full, EVERY app gets slower and more crash-prone because the OS can't allocate scratch space. See the **Laptop running slow** guide for cleanup steps.

## Step 5: Check for OS updates

If the app crashes on launch after a Mac/Windows update, install pending OS patches:

- **Mac**: System Settings → General → Software Update
- **Windows**: Settings → Windows Update → Check for updates

## Step 6: Reinstall the app

If the issue is targeted to one app and the above didn't help:

1. Save anything important from the app first
2. Quit the app fully
3. Drag to Trash (Mac) / Uninstall (Windows)
4. Reinstall from the official source

## Step 7: Submit a crash report

If reinstalling doesn't fix it, file a ticket with **End-User Compute**. Include:

- The app name and version (from the app's About screen)
- Your OS version
- What you were doing when it crashed
- The Console / Event Viewer log entry — Mac: open Console.app, search for the app name; Windows: Event Viewer → Windows Logs → Application

## When it's not the app

Repeated crashes across multiple apps → it's the OS or hardware. File a ticket. Random shutdowns or kernel panics → likely hardware. File urgently.`,
  },

  {
    title: 'Phishing email — what to do',
    category: 'security',
    source_type: 'faq',
    body: `# Phishing email — what to do

If you suspect a message is phishing — DON'T click links, DON'T open attachments, DON'T reply. Report it.

## How to spot phishing

Common red flags:

- **Urgency**: "Your account will be closed in 24 hours"
- **Authority impersonation**: claims to be from your CEO, IT, or a bank
- **Mismatched sender**: email looks like ceo@slice.com but the sender field shows a random Gmail address
- **Generic greetings**: "Dear customer" instead of your name
- **Suspicious links** (hover before clicking): the link text says "slice.com" but the actual URL is "slice-login.ru"
- **Asks for credentials**: real Slice systems never ask for your password by email
- **Unexpected attachments**: especially .zip, .exe, .docm, .xlsm

## How to report

### Best: Phishing add-on in Gmail

1. Open the email
2. Click the **🛡️ Report Phishing** add-on icon in the toolbar (right side of Gmail)
3. Confirm

This forwards to Security AND removes the message from your inbox. One click.

### Backup: Forward to phishing@slice.com

If the add-on is missing:

1. Open the message
2. 3-dot menu → **Forward as attachment**
3. Send to **phishing@slice.com**
4. Delete the original

Don't forward inline — Security needs the original headers, which only "Forward as attachment" preserves.

## What if I already clicked the link?

1. **Don't enter credentials** if you're on a fake page — close the tab immediately
2. If you DID enter credentials: change your OneLogin password right now (see **Reset my OneLogin password**)
3. File an URGENT ticket with **Security**
4. If you ran an attachment: shut down your laptop and file a ticket — Security will image it

## When in doubt

Send to **phishing@slice.com** anyway. Better one false positive than a missed compromise. Security responds to every report within 4 hours, often faster.

## Common Slice-specific scams

Things we've seen in the past 12 months:

- Fake "Microsoft 365 storage full" notices (we use Google Workspace, not Microsoft)
- "OneLogin password expiring" emails (real ones come from noreply@onelogin.com only)
- Vendor invoice updates asking you to "update banking details" (always verify by phone before any change)`,
  },

  {
    title: 'Calendar invite not showing up',
    category: 'email',
    source_type: 'guide',
    body: `# Calendar invite not showing up

Someone told you a meeting is on your calendar but you don't see it. Almost always one of four causes.

## Cause 1: Wrong calendar account

Are you signed into a personal Google account in addition to your @slice.com one? The invite went to one but you're viewing the other.

In Google Calendar (web): top-right → click your avatar → confirm you're on **@slice.com**. Switch if not.

## Cause 2: External invite delay

Google has a known issue: invites sent **across organizations** (someone external to Slice) sometimes take **5–10 minutes** to appear. Wait, then refresh.

## Cause 3: Invite landed in spam

External invites occasionally go to Gmail's spam folder, which means Calendar never auto-accepts them. Check spam, look for "you have been invited to..." messages, click **Add to calendar** manually.

## Cause 4: Auto-accept disabled

Some people set rules like "auto-decline meetings outside business hours." Check Calendar Settings → Event settings → "Add invitations to my calendar" — make sure it's set to **From everyone** or at least **Only if I have responded**.

## Specific: meeting room not showing

Resource calendars (HQ-Conf-A, etc.) appear as a separate calendar entry, not on yours. To see room availability:

1. Calendar settings → **Add calendar** → **Browse resources**
2. Subscribe to the rooms you book often

## File a ticket if

- Invites work for everyone else but never reach you (likely a delegation issue)
- Calendar shows the meeting but the invite email is missing — file with the **Collaboration** team

Typical SLA: 4 business hours.`,
  },

  {
    title: 'Locked out of an app after a password reset',
    category: 'identity',
    source_type: 'faq',
    body: `# Locked out of an app after a password reset

You reset your OneLogin password, but now Slack / Zoom / GitHub won't let you in. Here's why and how to fix.

## Why this happens

Most Slice apps federate through OneLogin via SAML. After a password reset, OneLogin invalidates **active sessions** for security. Apps that had a cached login token now reject it.

## Quick fix: sign out, sign back in

In the app:

1. Sign out completely (don't just close the window)
2. Sign back in — it'll redirect you through OneLogin
3. Approve the OneLogin Protect MFA prompt
4. You're back in

Works for: Slack, Zoom, GitHub, Jira, Confluence, AWS, GCP.

## Mobile apps need extra steps

The Slack mobile app, Outlook mobile, etc. cache tokens longer:

- Force-quit the app (swipe from the multitasking view)
- Reopen — it'll prompt for fresh auth
- Some apps may need full sign-out from settings

## Browser caching an old session

If sign-out / sign-in doesn't work in the browser:

1. Sign out of OneLogin too: visit https://slice.onelogin.com → click your avatar → Sign out
2. Clear cookies for the app's domain (browser settings → privacy → cookies)
3. Sign in again

## If it's still rejecting you

The app might not have refreshed your federated identity yet. Wait 5 minutes and try again. If still locked out after 10 minutes, file a ticket with **Identity & Access** and mention which app — they can force-refresh the directory.

## Special case: 1Password

1Password has its own master password separate from OneLogin. Resetting OneLogin doesn't affect it. If you've forgotten the 1Password master, contact 1Password support directly — Slice IT can't recover it.`,
  },

  {
    title: 'Connect to GlobalProtect VPN',
    category: 'network',
    source_type: 'guide',
    body: `# Connect to GlobalProtect VPN

Slice uses **Palo Alto GlobalProtect** for VPN. The portal is **vpn.slice.systems** and your credentials are the same ones you use for OneLogin.

## First-time setup

GlobalProtect comes pre-installed on every Slice laptop via the device baseline. If you don't see it, file a ticket and we'll push it remotely.

1. Open **GlobalProtect** from your menu bar (Mac) or system tray (Windows)
2. Portal address: **vpn.slice.systems**
3. Click **Connect**
4. Enter your credentials:
   - **Username**: your @slice.com email
   - **Password**: your OneLogin password
5. **MFA prompt**: open OneLogin Protect on your phone and either approve the push, or enter the 6-digit code shown in the app
6. You should see **Connected** within 10 seconds

## Day-to-day

- Open GlobalProtect → click **Connect**. The app remembers your portal and credentials, so most reconnects only need the MFA step.
- The VPN auto-disconnects after 12 hours and on sleep — you'll need to re-auth in the morning.

## Troubleshooting

### "Authentication failed"

Almost always your OneLogin password expired or you mistyped it. Reset at https://slice.onelogin.com — see the **Reset my OneLogin password** guide.

### "Portal unreachable"

- Check your internet (try loading google.com)
- Confirm the portal is exactly **vpn.slice.systems** (no \`https://\`, no trailing slash)
- If you're on a hotel / coffee-shop captive portal, log into the captive portal first, then reconnect

### MFA push not arriving

- Make sure OneLogin Protect is installed on your phone and you have signal
- Use the manual 6-digit code from the app instead of waiting for the push
- If the code is rejected, your phone clock might be off — open OneLogin Protect → Settings → resync time

### Still stuck

File a ticket with the **Network Operations** team. Include the exact error message — GlobalProtect's error text usually tells us the cause within 5 seconds.`,
  },
];

// FTS mode — no external API, no rate limits. Default to 0 sleep.
const SLEEP_MS = Number(process.env.SEED_SLEEP_MS ?? 0);

const existing = await fetch(`${baseUrl}/api/guides`).then((r) => r.json());
const existingTitles = new Set(existing.map((g) => g.title));

let ok = 0, failed = 0, skipped = 0;
for (let i = 0; i < guides.length; i++) {
  const g = guides[i];
  if (existingTitles.has(g.title)) {
    console.log(`[seed] ${g.title}… skipped (already in DB)`);
    skipped++;
    continue;
  }
  process.stdout.write(`[seed] ${g.title}… `);
  try {
    const r = await fetch(`${baseUrl}/api/guides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g),
    });
    if (r.ok) {
      const j = await r.json();
      console.log(`✓ id=${j.id}, ${j.chunk_count} chunks`);
      ok++;
    } else {
      console.log(`✗ ${r.status}: ${(await r.text()).slice(0, 120)}…`);
      failed++;
    }
  } catch (e) {
    console.log(`✗ ${e.message}`);
    failed++;
  }
  if (i < guides.length - 1) {
    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }
}
console.log(`\n[seed] done — ${ok} ok, ${failed} failed, ${skipped} skipped`);
