--
-- PostgreSQL database dump
--

\restrict s3RqP5bx5wTwJV6Rx11iB10LtBWePmsAHMlGzUXddyFvYPHEtW4xLML3RDxYgRE

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg12+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: chat_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (1, 'Headphones', NULL, '{87,82,78,83,85}', '[{"index": 1, "title": "Bluetooth headphones won''t connect", "category": "hardware", "chunk_id": 87, "guide_id": 19, "source_type": "guide", "helpful_count": 0, "content_preview": "## Still nothing\n\nFile a ticket with **End-User Compute** with the headphone model and the steps you''ve tried."}, {"index": 2, "title": "Bluetooth headphones won''t connect", "category": "hardware", "chunk_id": 82, "guide_id": 19, "source_type": "guide", "helpful_count": 0, "content_preview": "## Step 1: Force pairing mode\n\nMost headphones need you to hold the power button for **5–10 seconds** until the LED flashes (usually fast, often blue+red alternating). Just turning them on isn''t enough.\n\nCommon patterns:\n\n- **AirPods**: open the case, hold the back button until t…"}, {"index": 3, "title": "Microphone or camera not working in Zoom or Meet", "category": "meetings", "chunk_id": 78, "guide_id": 18, "source_type": "guide", "helpful_count": 0, "content_preview": "## Bluetooth gotcha\n\nBluetooth headsets often connect but use a \"hands-free\" profile that disables the mic. To fix:\n\n- Mac: Sound settings → choose the headset for **both** Output AND Input (not just Output)\n- If still no luck, switch to wired headphones for important meetings"}, {"index": 4, "title": "Bluetooth headphones won''t connect", "category": "hardware", "chunk_id": 83, "guide_id": 19, "source_type": "guide", "helpful_count": 0, "content_preview": "## Step 2: Check they''re not already paired elsewhere\n\nBluetooth headphones can only talk to one device at a time. If they auto-connect to your phone first, your laptop won''t see them.\n\n- Disconnect from your phone (Bluetooth → tap → \"Disconnect\")\n- Or turn off Bluetooth on your …"}, {"index": 5, "title": "Bluetooth headphones won''t connect", "category": "hardware", "chunk_id": 85, "guide_id": 19, "source_type": "guide", "helpful_count": 0, "content_preview": "## Step 4: Reset the headphones\n\nMost headphones have a factory-reset combo (usually power + volume buttons held together). Check the manual or the vendor''s website — this clears all pairings on the headphones themselves."}]', 'retrieval', '2026-05-01 20:06:49.03603+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (2, 'Laptop is deda', NULL, '{18,33,27,28,84}', '[{"index": 1, "title": "Laptop running slow", "category": "performance", "chunk_id": 18, "guide_id": 5, "source_type": "guide", "helpful_count": 0, "content_preview": "# Laptop running slow\n\nA slow laptop is almost always one of three things: full disk, runaway process, or something pending a reboot. Here''s how to check each in under 10 minutes."}, {"index": 2, "title": "Set up a new device", "category": "onboarding", "chunk_id": 33, "guide_id": 12, "source_type": "runbook", "helpful_count": 0, "content_preview": "## Step 4: Encryption check\n\n- **Mac**: System Settings → Privacy & Security → **FileVault** → confirm it''s **On**\n- **Windows**: Settings → Privacy & Security → **Device encryption** → confirm it''s **On**\n\nIf either is off, file a ticket — your laptop should not be in active use…"}, {"index": 3, "title": "Laptop running slow", "category": "performance", "chunk_id": 27, "guide_id": 5, "source_type": "guide", "helpful_count": 0, "content_preview": "## If it''s still slow\n\nIf you''ve done all of the above and it''s still molasses, file a ticket with the **End-User Compute** team. Include the output of Activity Monitor / Task Manager (screenshot helps). Replacement laptops are 1–2 business days if the machine is genuinely failin…"}, {"index": 4, "title": "Set up a new device", "category": "onboarding", "chunk_id": 28, "guide_id": 12, "source_type": "runbook", "helpful_count": 0, "content_preview": "# Set up a new device\n\nFor your first day or a replacement laptop. Plan ~90 minutes start to finish; most of that is encryption, OS updates, and software install in the background."}, {"index": 5, "title": "Bluetooth headphones won''t connect", "category": "hardware", "chunk_id": 84, "guide_id": 19, "source_type": "guide", "helpful_count": 0, "content_preview": "## Step 3: Remove a stale pairing on your laptop\n\nIf the laptop USED to pair with these headphones but now ignores them, the cached pairing is corrupt.\n\n- **Mac**: System Settings → Bluetooth → click the **i** next to the device → **Forget Device**. Then pair fresh.\n- **Windows**…"}]', 'retrieval', '2026-05-01 20:07:07.741145+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (3, 'I think my account was phished', NULL, '{109,110,105,104,107}', '[{"index": 1, "title": "Phishing email — what to do", "category": "security", "chunk_id": 109, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "## What if I already clicked the link?\n\n1. **Don''t enter credentials** if you''re on a fake page — close the tab immediately\n2. If you DID enter credentials: change your OneLogin password right now (see **Reset my OneLogin password**)\n3. File an URGENT ticket with **Security**\n4. …"}, {"index": 2, "title": "Phishing email — what to do", "category": "security", "chunk_id": 110, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "## When in doubt\n\nSend to **phishing@slice.com** anyway. Better one false positive than a missed compromise. Security responds to every report within 4 hours, often faster."}, {"index": 3, "title": "Phishing email — what to do", "category": "security", "chunk_id": 105, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "## How to spot phishing\n\nCommon red flags:\n\n- **Urgency**: \"Your account will be closed in 24 hours\"\n- **Authority impersonation**: claims to be from your CEO, IT, or a bank\n- **Mismatched sender**: email looks like ceo@slice.com but the sender field shows a random Gmail address\n…"}, {"index": 4, "title": "Phishing email — what to do", "category": "security", "chunk_id": 104, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "# Phishing email — what to do\n\nIf you suspect a message is phishing — DON''T click links, DON''T open attachments, DON''T reply. Report it."}, {"index": 5, "title": "Phishing email — what to do", "category": "security", "chunk_id": 107, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "### Best: Phishing add-on in Gmail\n\n1. Open the email\n2. Click the **🛡️ Report Phishing** add-on icon in the toolbar (right side of Gmail)\n3. Confirm\n\nThis forwards to Security AND removes the message from your inbox. One click."}]', 'retrieval', '2026-05-01 20:10:15.231818+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (4, 'I think my account was phished', NULL, '{109,110,105,104,107}', '[{"index": 1, "title": "Phishing email — what to do", "category": "security", "chunk_id": 109, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "## What if I already clicked the link?\n\n1. **Don''t enter credentials** if you''re on a fake page — close the tab immediately\n2. If you DID enter credentials: change your OneLogin password right now (see **Reset my OneLogin password**)\n3. File an URGENT ticket with **Security**\n4. …"}, {"index": 2, "title": "Phishing email — what to do", "category": "security", "chunk_id": 110, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "## When in doubt\n\nSend to **phishing@slice.com** anyway. Better one false positive than a missed compromise. Security responds to every report within 4 hours, often faster."}, {"index": 3, "title": "Phishing email — what to do", "category": "security", "chunk_id": 105, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "## How to spot phishing\n\nCommon red flags:\n\n- **Urgency**: \"Your account will be closed in 24 hours\"\n- **Authority impersonation**: claims to be from your CEO, IT, or a bank\n- **Mismatched sender**: email looks like ceo@slice.com but the sender field shows a random Gmail address\n…"}, {"index": 4, "title": "Phishing email — what to do", "category": "security", "chunk_id": 104, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "# Phishing email — what to do\n\nIf you suspect a message is phishing — DON''T click links, DON''T open attachments, DON''T reply. Report it."}, {"index": 5, "title": "Phishing email — what to do", "category": "security", "chunk_id": 107, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "### Best: Phishing add-on in Gmail\n\n1. Open the email\n2. Click the **🛡️ Report Phishing** add-on icon in the toolbar (right side of Gmail)\n3. Confirm\n\nThis forwards to Security AND removes the message from your inbox. One click."}]', 'retrieval', '2026-05-01 20:10:32.724822+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (5, 'i forgot my password', NULL, '{6}', '[{"index": 1, "title": "Reset my OneLogin password", "category": "identity", "chunk_id": 6, "guide_id": 3, "source_type": "faq", "helpful_count": 0, "content_preview": "## Self-serve reset\n\n1. Go to https://slice.onelogin.com\n2. Click **Forgot Password** below the sign-in box\n3. Enter your @slice.com email\n4. Check your inbox for a reset link — it usually arrives in under 30 seconds (check Spam if not)\n5. Click the link, choose a new password (m…"}]', 'retrieval', '2026-05-01 20:37:27.970644+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (6, 'VPN. hq. vpn. restart', NULL, '{125,19,37,70,86}', '[{"index": 1, "title": "Slack keeps disconnecting or won''t load", "category": "collaboration", "chunk_id": 125, "guide_id": 26, "source_type": "guide", "helpful_count": 0, "content_preview": "## Step 6: Check VPN\n\nIf you''re on VPN and Slack stops working but Gmail still works, Slack''s websocket might be blocked by a bad routing rule. Disconnect VPN, see if Slack reconnects. If it does, file a ticket with **Network Operations** — the VPN ACL needs adjusting."}, {"index": 2, "title": "Laptop running slow", "category": "performance", "chunk_id": 19, "guide_id": 5, "source_type": "guide", "helpful_count": 0, "content_preview": "## Check 1: Reboot if you haven''t in a week\n\nThis is the single highest-yield fix. macOS and Windows both queue updates that finish on reboot — going more than a week without restarting causes weird slowdowns. Save your work and restart now if it''s been a while."}, {"index": 3, "title": "Connect to GlobalProtect VPN", "category": "network", "chunk_id": 37, "guide_id": 13, "source_type": "guide", "helpful_count": 0, "content_preview": "# Connect to GlobalProtect VPN\n\nSlice uses **Palo Alto GlobalProtect** for VPN. The portal is **vpn.slice.systems** and your credentials are the same ones you use for OneLogin."}, {"index": 4, "title": "External monitor not detected", "category": "hardware", "chunk_id": 70, "guide_id": 17, "source_type": "guide", "helpful_count": 0, "content_preview": "## Step 5: Restart the laptop\n\nPlug everything in first, then restart. Sometimes the system reads the cable on boot only."}, {"index": 5, "title": "Bluetooth headphones won''t connect", "category": "hardware", "chunk_id": 86, "guide_id": 19, "source_type": "guide", "helpful_count": 0, "content_preview": "## Step 5: Restart Bluetooth\n\n- **Mac**: Option-click the Bluetooth icon → **Reset the Bluetooth module**\n- **Windows**: Restart the PC. Faster than digging through services."}]', 'retrieval', '2026-05-01 21:31:22.79691+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (7, 'i think my account was phished', NULL, '{56,104,105,107,113}', '[{"index": 1, "title": "Email delivery issue", "category": "email", "chunk_id": 56, "guide_id": 15, "source_type": "guide", "helpful_count": 0, "content_preview": "## Suspected phishing\n\n**Don''t click links or open attachments.** Use the **Report Phishing** add-on in Gmail''s toolbar, or forward the message to **phishing@slice.com**. Security reviews every report within 4 hours."}, {"index": 2, "title": "Phishing email — what to do", "category": "security", "chunk_id": 104, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "# Phishing email — what to do\n\nIf you suspect a message is phishing — DON''T click links, DON''T open attachments, DON''T reply. Report it."}, {"index": 3, "title": "Phishing email — what to do", "category": "security", "chunk_id": 105, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "## How to spot phishing\n\nCommon red flags:\n\n- **Urgency**: \"Your account will be closed in 24 hours\"\n- **Authority impersonation**: claims to be from your CEO, IT, or a bank\n- **Mismatched sender**: email looks like ceo@slice.com but the sender field shows a random Gmail address\n…"}, {"index": 4, "title": "Phishing email — what to do", "category": "security", "chunk_id": 107, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "### Best: Phishing add-on in Gmail\n\n1. Open the email\n2. Click the **🛡️ Report Phishing** add-on icon in the toolbar (right side of Gmail)\n3. Confirm\n\nThis forwards to Security AND removes the message from your inbox. One click."}, {"index": 5, "title": "Calendar invite not showing up", "category": "email", "chunk_id": 113, "guide_id": 24, "source_type": "guide", "helpful_count": 0, "content_preview": "## Cause 1: Wrong calendar account\n\nAre you signed into a personal Google account in addition to your @slice.com one? The invite went to one but you''re viewing the other.\n\nIn Google Calendar (web): top-right → click your avatar → confirm you''re on **@slice.com**. Switch if not."}]', 'retrieval', '2026-05-02 00:50:53.923061+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (8, 'my password isn''t working anymore', NULL, '{6,34,38,41,109}', '[{"index": 1, "title": "Reset my OneLogin password", "category": "identity", "chunk_id": 6, "guide_id": 3, "source_type": "faq", "helpful_count": 9, "content_preview": "## Self-serve reset\n\n1. Go to https://slice.onelogin.com\n2. Click **Forgot Password** below the sign-in box\n3. Enter your @slice.com email\n4. Check your inbox for a reset link — it usually arrives in under 30 seconds (check Spam if not)\n5. Click the link, choose a new password (m…"}, {"index": 2, "title": "Set up a new device", "category": "onboarding", "chunk_id": 34, "guide_id": 12, "source_type": "runbook", "helpful_count": 0, "content_preview": "## Step 5: Connect to VPN\n\nOpen **GlobalProtect** from the menu bar / system tray:\n\n1. Portal: **vpn.slice.systems**\n2. Username: your @slice.com email\n3. Password: your OneLogin password\n4. MFA: the 6-digit code from OneLogin Protect\n\nYou should see \"Connected\" within 10 seconds…"}, {"index": 3, "title": "Connect to GlobalProtect VPN", "category": "network", "chunk_id": 38, "guide_id": 13, "source_type": "guide", "helpful_count": 0, "content_preview": "## First-time setup\n\nGlobalProtect comes pre-installed on every Slice laptop via the device baseline. If you don''t see it, file a ticket and we''ll push it remotely.\n\n1. Open **GlobalProtect** from your menu bar (Mac) or system tray (Windows)\n2. Portal address: **vpn.slice.systems…"}, {"index": 4, "title": "Connect to GlobalProtect VPN", "category": "network", "chunk_id": 41, "guide_id": 13, "source_type": "guide", "helpful_count": 0, "content_preview": "### \"Authentication failed\"\n\nAlmost always your OneLogin password expired or you mistyped it. Reset at https://slice.onelogin.com — see the **Reset my OneLogin password** guide."}, {"index": 5, "title": "Phishing email — what to do", "category": "security", "chunk_id": 109, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "## What if I already clicked the link?\n\n1. **Don''t enter credentials** if you''re on a fake page — close the tab immediately\n2. If you DID enter credentials: change your OneLogin password right now (see **Reset my OneLogin password**)\n3. File an URGENT ticket with **Security**\n4. …"}]', 'retrieval', '2026-05-02 01:25:05.684587+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (9, 'Wi‑Fi isn''t working. access. me. now', NULL, '{126,10,11,14,30}', '[{"index": 1, "title": "Slack keeps disconnecting or won''t load", "category": "collaboration", "chunk_id": 126, "guide_id": 26, "source_type": "guide", "helpful_count": 2, "content_preview": "## Persistent disconnects on Wi-Fi but not Ethernet\n\nAggressive corporate Wi-Fi access points sometimes kick websockets every 10–15 minutes. If this is consistent, file a ticket with **Network Operations** and mention the floor / building."}, {"index": 2, "title": "Wi-Fi isn''t working", "category": "network", "chunk_id": 10, "guide_id": 4, "source_type": "guide", "helpful_count": 0, "content_preview": "# Wi-Fi isn''t working\n\nQuick triage that solves about 80% of Wi-Fi issues at HQ. Try these in order — each step is ~30 seconds."}, {"index": 3, "title": "Wi-Fi isn''t working", "category": "network", "chunk_id": 11, "guide_id": 4, "source_type": "guide", "helpful_count": 0, "content_preview": "## Step 1: Toggle Wi-Fi off and on\n\nClick the Wi-Fi icon in your menu bar (Mac) or system tray (Windows), turn it off, wait 5 seconds, turn it back on. Reconnect to **Slice-Corp**."}, {"index": 4, "title": "Wi-Fi isn''t working", "category": "network", "chunk_id": 14, "guide_id": 4, "source_type": "guide", "helpful_count": 0, "content_preview": "### Windows\n\n1. Settings → Network & Internet → Wi-Fi → **Manage known networks**\n2. Select Slice-Corp → **Forget**\n3. Reconnect from the Wi-Fi flyout, sign in with OneLogin"}, {"index": 5, "title": "Set up a new device", "category": "onboarding", "chunk_id": 30, "guide_id": 12, "source_type": "runbook", "helpful_count": 0, "content_preview": "## Step 1: Boot and sign in\n\n1. Power on. The setup wizard guides you through region, keyboard layout, and Wi-Fi\n2. Connect to **Slice-Corp** (in the office) or your home Wi-Fi (remote)\n3. When prompted for sign-in, use your **@slice.com** email and OneLogin password"}]', 'retrieval', '2026-05-02 16:46:21.124721+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (10, 'Reset my password. onelogin. yes. now', NULL, '{9,41,6,109,127}', '[{"index": 1, "title": "Reset my OneLogin password", "category": "identity", "chunk_id": 9, "guide_id": 3, "source_type": "faq", "helpful_count": 9, "content_preview": "## What this resets\n\nResetting your OneLogin password resets access to almost everything — Google Workspace, Slack, GitHub, AWS — because they all federate through OneLogin. You usually don''t need to reset each app individually."}, {"index": 2, "title": "Connect to GlobalProtect VPN", "category": "network", "chunk_id": 41, "guide_id": 13, "source_type": "guide", "helpful_count": 0, "content_preview": "### \"Authentication failed\"\n\nAlmost always your OneLogin password expired or you mistyped it. Reset at https://slice.onelogin.com — see the **Reset my OneLogin password** guide."}, {"index": 3, "title": "Reset my OneLogin password", "category": "identity", "chunk_id": 6, "guide_id": 3, "source_type": "faq", "helpful_count": 9, "content_preview": "## Self-serve reset\n\n1. Go to https://slice.onelogin.com\n2. Click **Forgot Password** below the sign-in box\n3. Enter your @slice.com email\n4. Check your inbox for a reset link — it usually arrives in under 30 seconds (check Spam if not)\n5. Click the link, choose a new password (m…"}, {"index": 4, "title": "Phishing email — what to do", "category": "security", "chunk_id": 109, "guide_id": 23, "source_type": "faq", "helpful_count": 0, "content_preview": "## What if I already clicked the link?\n\n1. **Don''t enter credentials** if you''re on a fake page — close the tab immediately\n2. If you DID enter credentials: change your OneLogin password right now (see **Reset my OneLogin password**)\n3. File an URGENT ticket with **Security**\n4. …"}, {"index": 5, "title": "Locked out of an app after a password reset", "category": "identity", "chunk_id": 127, "guide_id": 27, "source_type": "faq", "helpful_count": 0, "content_preview": "# Locked out of an app after a password reset\n\nYou reset your OneLogin password, but now Slack / Zoom / GitHub won''t let you in. Here''s why and how to fix."}]', 'retrieval', '2026-05-02 16:46:41.707845+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (11, 'Reset my password. github. lost. today', NULL, '{9,6,127,41,5}', '[{"index": 1, "title": "Reset my OneLogin password", "category": "identity", "chunk_id": 9, "guide_id": 3, "source_type": "faq", "helpful_count": 9, "content_preview": "## What this resets\n\nResetting your OneLogin password resets access to almost everything — Google Workspace, Slack, GitHub, AWS — because they all federate through OneLogin. You usually don''t need to reset each app individually."}, {"index": 2, "title": "Reset my OneLogin password", "category": "identity", "chunk_id": 6, "guide_id": 3, "source_type": "faq", "helpful_count": 9, "content_preview": "## Self-serve reset\n\n1. Go to https://slice.onelogin.com\n2. Click **Forgot Password** below the sign-in box\n3. Enter your @slice.com email\n4. Check your inbox for a reset link — it usually arrives in under 30 seconds (check Spam if not)\n5. Click the link, choose a new password (m…"}, {"index": 3, "title": "Locked out of an app after a password reset", "category": "identity", "chunk_id": 127, "guide_id": 27, "source_type": "faq", "helpful_count": 0, "content_preview": "# Locked out of an app after a password reset\n\nYou reset your OneLogin password, but now Slack / Zoom / GitHub won''t let you in. Here''s why and how to fix."}, {"index": 4, "title": "Connect to GlobalProtect VPN", "category": "network", "chunk_id": 41, "guide_id": 13, "source_type": "guide", "helpful_count": 0, "content_preview": "### \"Authentication failed\"\n\nAlmost always your OneLogin password expired or you mistyped it. Reset at https://slice.onelogin.com — see the **Reset my OneLogin password** guide."}, {"index": 5, "title": "Reset my OneLogin password", "category": "identity", "chunk_id": 5, "guide_id": 3, "source_type": "faq", "helpful_count": 9, "content_preview": "# Reset my OneLogin password\n\nSlice uses **OneLogin** as the single sign-on for nearly every internal tool — Google Workspace, Slack, Jira, Confluence, AWS, GitHub. If you can''t sign in to any one of them, this is almost always the place to start."}]', 'retrieval', '2026-05-02 16:50:53.338974+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (12, 'VPN. hq. none. restart toggle forget', NULL, '{125,12,75,19,37}', '[{"index": 1, "title": "Slack keeps disconnecting or won''t load", "category": "collaboration", "chunk_id": 125, "guide_id": 26, "source_type": "guide", "helpful_count": 3, "content_preview": "## Step 6: Check VPN\n\nIf you''re on VPN and Slack stops working but Gmail still works, Slack''s websocket might be blocked by a bad routing rule. Disconnect VPN, see if Slack reconnects. If it does, file a ticket with **Network Operations** — the VPN ACL needs adjusting."}, {"index": 2, "title": "Wi-Fi isn''t working", "category": "network", "chunk_id": 12, "guide_id": 4, "source_type": "guide", "helpful_count": 0, "content_preview": "## Step 2: Forget the network and rejoin\n\nIf the toggle didn''t help, \"forget\" the Slice-Corp network and rejoin from scratch — sometimes a stale auth cache is the problem."}, {"index": 3, "title": "Microphone or camera not working in Zoom or Meet", "category": "meetings", "chunk_id": 75, "guide_id": 18, "source_type": "guide", "helpful_count": 0, "content_preview": "### Mac\n\nSystem Settings → **Privacy & Security** → **Microphone** / **Camera** → toggle ON for Zoom / Chrome / your browser.\n\nAfter toggling, **fully quit** the app (Cmd+Q) and reopen. Mac caches permissions until restart."}, {"index": 4, "title": "Laptop running slow", "category": "performance", "chunk_id": 19, "guide_id": 5, "source_type": "guide", "helpful_count": 0, "content_preview": "## Check 1: Reboot if you haven''t in a week\n\nThis is the single highest-yield fix. macOS and Windows both queue updates that finish on reboot — going more than a week without restarting causes weird slowdowns. Save your work and restart now if it''s been a while."}, {"index": 5, "title": "Connect to GlobalProtect VPN", "category": "network", "chunk_id": 37, "guide_id": 13, "source_type": "guide", "helpful_count": 0, "content_preview": "# Connect to GlobalProtect VPN\n\nSlice uses **Palo Alto GlobalProtect** for VPN. The portal is **vpn.slice.systems** and your credentials are the same ones you use for OneLogin."}]', 'retrieval', '2026-05-02 16:55:27.031268+00');
INSERT INTO public.chat_logs (id, query, answer, retrieved_chunk_ids, citations, mode, created_at) VALUES (13, 'Clear cache. access. me. now', NULL, '{123,146,124,131,147}', '[{"index": 1, "title": "Slack keeps disconnecting or won''t load", "category": "collaboration", "chunk_id": 123, "guide_id": 26, "source_type": "guide", "helpful_count": 4, "content_preview": "## Step 4: Clear the cache\n\nIf reloads don''t help, the local cache may be corrupt.\n\n- Slack menu → **Help** → **Troubleshooting** → **Clear Cache and Restart**\n\nYou''ll lose draft messages, but get a fresh start."}, {"index": 2, "title": "How to Clear Cookies and Cache in Chrome for One Site", "category": "", "chunk_id": 146, "guide_id": 30, "source_type": "guide", "helpful_count": 0, "content_preview": "**Step** 1: Load the site from which you want to clear cookies and cache in Google Chrome and click on the **padlock-shaped icon** in the left corner of the address bar.\n\n<img src=\"https://it.slice.services/uploads/1775753346499-154521928.png\" style=\"width: 60%\" data-align=\"left\"…"}, {"index": 3, "title": "Slack keeps disconnecting or won''t load", "category": "collaboration", "chunk_id": 124, "guide_id": 26, "source_type": "guide", "helpful_count": 4, "content_preview": "## Step 5: Reinstall\n\nIf clearing cache doesn''t fix it:\n\n1. Quit Slack\n2. Move the Slack app to Trash / uninstall\n3. Reinstall from **slack.com/downloads** (don''t use the App Store / Microsoft Store version — the standalone is more reliable)"}, {"index": 4, "title": "Locked out of an app after a password reset", "category": "identity", "chunk_id": 131, "guide_id": 27, "source_type": "faq", "helpful_count": 0, "content_preview": "## Browser caching an old session\n\nIf sign-out / sign-in doesn''t work in the browser:\n\n1. Sign out of OneLogin too: visit https://slice.onelogin.com → click your avatar → Sign out\n2. Clear cookies for the app''s domain (browser settings → privacy → cookies)\n3. Sign in again"}, {"index": 5, "title": "How to Clear Cookies and Cache in Chrome for One Site", "category": "", "chunk_id": 147, "guide_id": 30, "source_type": "guide", "helpful_count": 0, "content_preview": "t you are currently on by clicking the **Trash icon**\n\n<img src=\"https://it.slice.services/uploads/1775753521954-887807358.png\" style=\"width: 60%\" data-align=\"left\" />\n\n> *The website''s cookies and cache will be cleared immediately by Chrome. Once you refresh the website, it will…"}]', 'retrieval', '2026-05-02 17:46:15.044234+00');


--
-- Data for Name: chat_feedback; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.chat_feedback (id, chat_log_id, rating, comment, created_at) VALUES (1, 10, -1, NULL, '2026-05-02 16:46:46.091135+00');
INSERT INTO public.chat_feedback (id, chat_log_id, rating, comment, created_at) VALUES (2, 11, -1, NULL, '2026-05-02 16:50:54.899257+00');
INSERT INTO public.chat_feedback (id, chat_log_id, rating, comment, created_at) VALUES (3, 11, -1, NULL, '2026-05-02 16:51:01.723153+00');


--
-- Data for Name: guides; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (3, 'Reset my OneLogin password', 'identity', '# Reset my OneLogin password

Slice uses **OneLogin** as the single sign-on for nearly every internal tool — Google Workspace, Slack, Jira, Confluence, AWS, GitHub. If you can''t sign in to any one of them, this is almost always the place to start.

## Self-serve reset

1. Go to https://slice.onelogin.com
2. Click **Forgot Password** below the sign-in box
3. Enter your @slice.com email
4. Check your inbox for a reset link — it usually arrives in under 30 seconds (check Spam if not)
5. Click the link, choose a new password (min 12 characters, mix of upper/lower, numbers, at least one symbol)
6. Sign in with the new password

## If the reset email doesn''t arrive

- Wait 5 minutes — Google''s spam filter sometimes holds it briefly
- Check **Spam** and **All Mail** in Gmail
- Make sure you used your @slice.com address, not a personal one

## If self-serve doesn''t work

If the link is expired, you''re locked out, or the email never arrives, file a ticket with the **Identity & Access** team. Typical response is 2 hours during business hours; on-call covers urgent lockouts after hours.

## What this resets

Resetting your OneLogin password resets access to almost everything — Google Workspace, Slack, GitHub, AWS — because they all federate through OneLogin. You usually don''t need to reset each app individually.', '{}', '2026-05-01 19:27:35.658458+00', '2026-05-01 19:27:35.658458+00', 'faq', '{}', NULL, 16, 22, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (4, 'Wi-Fi isn''t working', 'network', '# Wi-Fi isn''t working

Quick triage that solves about 80% of Wi-Fi issues at HQ. Try these in order — each step is ~30 seconds.

## Step 1: Toggle Wi-Fi off and on

Click the Wi-Fi icon in your menu bar (Mac) or system tray (Windows), turn it off, wait 5 seconds, turn it back on. Reconnect to **Slice-Corp**.

## Step 2: Forget the network and rejoin

If the toggle didn''t help, "forget" the Slice-Corp network and rejoin from scratch — sometimes a stale auth cache is the problem.

### Mac

1. System Settings → Wi-Fi → click the **i** next to Slice-Corp → **Forget This Network**
2. Click Slice-Corp from the list and sign in again with your OneLogin email + password

### Windows

1. Settings → Network & Internet → Wi-Fi → **Manage known networks**
2. Select Slice-Corp → **Forget**
3. Reconnect from the Wi-Fi flyout, sign in with OneLogin

## Step 3: Check if it''s just you

Look at someone next to you — if their Wi-Fi works fine, it''s your laptop, not the office. Restart it.

## Step 4: Check the IT status board

Go to **status.slice.com** to see if Network Operations has flagged an outage. If so, you''ll see an active incident.

## If none of this works

File a ticket with the **Network Operations** team. Include:

- Building / floor / desk number
- The error message you see (screenshot helps)
- Whether anyone near you has the same issue

P1 SLA: 1 hour during business hours.', '{}', '2026-05-01 19:27:36.268929+00', '2026-05-01 19:27:36.268929+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (5, 'Laptop running slow', 'performance', '# Laptop running slow

A slow laptop is almost always one of three things: full disk, runaway process, or something pending a reboot. Here''s how to check each in under 10 minutes.

## Check 1: Reboot if you haven''t in a week

This is the single highest-yield fix. macOS and Windows both queue updates that finish on reboot — going more than a week without restarting causes weird slowdowns. Save your work and restart now if it''s been a while.

## Check 2: Disk space

A nearly-full disk slows everything down because the OS can''t allocate scratch space.

### Mac

1. Apple menu → **About This Mac** → **More Info** → **Storage Settings**
2. If the bar is more than 90% full, free space — empty Trash, clean Downloads, remove unused apps
3. The **Recommendations** panel can clear 20–50 GB automatically

### Windows

1. Settings → System → Storage
2. Run **Storage Sense** to clear temp files and Recycle Bin
3. If you''re under 10 GB free, that''s almost certainly your problem

## Check 3: Runaway process

### Mac — Activity Monitor

Spotlight → "Activity Monitor" → **CPU** tab → sort by % CPU. If something is at 90%+ for more than a few minutes and isn''t a video call or build, quit it.

### Windows — Task Manager

Ctrl+Shift+Esc → **Processes** tab → click the CPU column to sort. Same logic — kill anything stuck above 90%.

## Common culprits

- **Backup software** indexing for the first time after a system update
- **Video calls** with screen-share running in the background
- **Browser tabs** — close everything you''re not actively using
- **Antivirus** doing a full scan (let it finish, then reboot)

## If it''s still slow

If you''ve done all of the above and it''s still molasses, file a ticket with the **End-User Compute** team. Include the output of Activity Monitor / Task Manager (screenshot helps). Replacement laptops are 1–2 business days if the machine is genuinely failing.', '{}', '2026-05-01 19:27:36.793097+00', '2026-05-01 19:27:36.793097+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (12, 'Set up a new device', 'onboarding', '# Set up a new device

For your first day or a replacement laptop. Plan ~90 minutes start to finish; most of that is encryption, OS updates, and software install in the background.

## Before you start

You''ll need:

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
3. On your laptop, sign in to https://slice.onelogin.com — it''ll prompt you to enroll a device
4. Scan the QR code with the OneLogin Protect app
5. Approve the test push

This same OneLogin Protect code is also what you''ll use for VPN MFA.

## Step 3: Wait for the device to baseline

Your laptop will install the standard Slice software bundle automatically (Jamf on Mac, Intune on Windows). You''ll see notifications as things install — leave it alone for ~30 minutes.

What gets installed:

- Slack
- Chrome and Firefox
- 1Password (you''ll be invited to the company vault separately)
- GlobalProtect (VPN client)
- Zoom
- The standard dev toolchain (if you''re an engineer)

## Step 4: Encryption check

- **Mac**: System Settings → Privacy & Security → **FileVault** → confirm it''s **On**
- **Windows**: Settings → Privacy & Security → **Device encryption** → confirm it''s **On**

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
- Sign in to Slack and join **#it-help**, **#general**, and your team''s channel
- Confirm GitHub access if you''re an engineer
- Verify your manager shows up in Workday
- Note your laptop''s asset tag (sticker on the bottom)

## If something doesn''t work

File a ticket with **End-User Compute**. Day-one issues are P1 — typical response is under an hour during business hours.', '{}', '2026-05-01 19:28:57.303521+00', '2026-05-01 19:28:57.303521+00', 'runbook', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (14, 'Request app access', 'access', '# Request app access

Need a new app, group, repo, or environment? Here''s how it gets approved and how long it takes.

## How to file the request

1. Go to the **Access Requests** section of the IT Hub
2. Pick the app or group you need from the catalog
3. Write a one-line **business justification** — don''t skip this, it''s what your manager and the app owner read
4. Submit

## Approval flow

For most apps, the request goes:

1. Your **manager** approves (or rejects)
2. The **app owner** approves (or rejects)
3. **Identity & Access** provisions you in OneLogin

You''ll get a Slack DM and an email at each step.

## SLA

| App tier | Typical time |
|---|---|
| Standard apps (most things) | 1 business day |
| Privileged / admin access | 2–3 business days (Security review) |
| External vendor accounts | 3–5 business days |

## If it''s urgent

Mark the request **Urgent** with a one-line "why" — your manager and the app owner get a higher-priority Slack ping. Use this for genuine blockers (deploy gate, P1 incident response), not impatience.

## After approval

Most apps federate through OneLogin, so once you''re approved you''ll see the app appear on your OneLogin dashboard within ~5 minutes. If it doesn''t, sign out and back into OneLogin to refresh the directory.

## Common pitfalls

- **Wrong group**: ask the app owner before submitting if you''re unsure which group level you need (Reader vs Contributor vs Admin). Re-requesting wastes a day.
- **No justification**: requests with empty justification get auto-rejected after 24 hours.
- **Manager out**: if your manager is on PTO, escalate to their delegate (set in Workday) rather than waiting.', '{}', '2026-05-01 19:29:40.761741+00', '2026-05-01 19:29:40.761741+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (15, 'Email delivery issue', 'email', '# Email delivery issue

Slice runs on **Google Workspace** — Gmail, Calendar, Drive, Meet. Most "email isn''t working" issues fall into one of four categories. Find yours below.

## I''m not receiving an expected email

1. Check **Spam** and **All Mail** in Gmail (especially for password resets and external invitations)
2. Search by sender domain: type `from:example.com` in the search bar
3. Check **Filters and Blocked Addresses** in Gmail Settings — old filters sometimes route mail away
4. Ask the sender if they got a bounce-back

If the sender is getting bounces, send IT the bounce text — it usually tells us exactly what''s wrong (often a misspelled address or a sender on our blocklist).

## My email isn''t being delivered

1. Check the **Sent** folder — did it actually go?
2. Look for a Mailer-Daemon bounce in your inbox
3. If you''re sending to an external domain, the recipient''s spam filter might be holding it

If you''re sending a calendar invite that''s not showing up, Google has a known issue with delayed external invites (~10 min lag). Slack the recipient if it''s time-sensitive.

## I''m getting too much spam

1. Open the spam message → click **Report spam** (don''t just delete — reporting trains Gmail''s filters)
2. Block the sender: open the message → kebab menu (⋮) → **Block <sender>**
3. For repeated phishing, forward to **phishing@slice.com**

## Suspected phishing

**Don''t click links or open attachments.** Use the **Report Phishing** add-on in Gmail''s toolbar, or forward the message to **phishing@slice.com**. Security reviews every report within 4 hours.

## Shared mailbox isn''t working

If you''ve been added to a shared mailbox (e.g. **support@slice.com**) and don''t see it:

1. Sign out of Gmail and back in to refresh delegations
2. If it still doesn''t appear, file a ticket — the share usually needs to be re-issued by Identity & Access

## File a ticket

If none of the above fits, file with the **Collaboration** team. SLA is 4 hours during business hours.', '{}', '2026-05-01 19:30:26.499075+00', '2026-05-01 19:30:26.499075+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (17, 'External monitor not detected', 'hardware', '# External monitor not detected

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

Test the monitor with a coworker''s laptop. If it works there, it''s your laptop''s port or graphics. File a ticket with **End-User Compute** — include the monitor model and cable type.', '{}', '2026-05-01 20:04:31.89222+00', '2026-05-01 20:04:31.89222+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (16, 'Re-enroll OneLogin Protect on a new phone', 'identity', '# Re-enroll OneLogin Protect on a new phone

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

You''re locked out of MFA — this needs IT.

1. File a ticket with the **Identity & Access** team
2. Mark it **Urgent** if it''s blocking your work day
3. IT will verify your identity over a video call, then issue a one-time bypass code so you can log in and re-enroll on the new phone

Typical turnaround: 30 minutes during business hours, ~2 hours after-hours.

## Tip

The next time you log in, set up a backup factor (SMS or a hardware security key) — that way a future phone swap doesn''t require IT.', '{}', '2026-05-01 20:03:45.012417+00', '2026-05-01 20:03:45.012417+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (18, 'Microphone or camera not working in Zoom or Meet', 'meetings', '# Microphone or camera not working in Zoom or Meet

Mid-meeting and your mic or camera is grayed out? Almost always a permission issue or wrong input source.

## Quick fix: pick the right input

- **Zoom**: gear icon → **Audio** / **Video** → confirm the right device is selected (built-in vs USB headset)
- **Google Meet**: 3-dot menu → **Settings** → check Audio + Video tabs

If the device shows up but the mic indicator doesn''t move when you talk, the source is selected but muted at the OS level.

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

Plug a USB headset/mic in. If that works but the built-in doesn''t, the built-in mic / camera is hardware-failed — file a ticket with **End-User Compute**.

## Don''t trust the in-app test

The "Test mic" feature inside Zoom is sometimes lying. Best test: ask someone in the meeting to confirm they hear you.', '{}', '2026-05-01 20:05:17.892137+00', '2026-05-01 20:05:17.892137+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (19, 'Bluetooth headphones won''t connect', 'hardware', '# Bluetooth headphones won''t connect

Pairing issues are 99% one of three things: the headphones aren''t actually in pairing mode, they''re already paired to another device, or there''s a stale pairing on your laptop.

## Step 1: Force pairing mode

Most headphones need you to hold the power button for **5–10 seconds** until the LED flashes (usually fast, often blue+red alternating). Just turning them on isn''t enough.

Common patterns:

- **AirPods**: open the case, hold the back button until the LED flashes
- **Sony WH series**: hold power for ~7 seconds
- **Bose**: hold power past "ON" until you hear "ready to connect"
- **Sennheiser**: hold the multi-function button for 4 seconds

## Step 2: Check they''re not already paired elsewhere

Bluetooth headphones can only talk to one device at a time. If they auto-connect to your phone first, your laptop won''t see them.

- Disconnect from your phone (Bluetooth → tap → "Disconnect")
- Or turn off Bluetooth on your phone temporarily

## Step 3: Remove a stale pairing on your laptop

If the laptop USED to pair with these headphones but now ignores them, the cached pairing is corrupt.

- **Mac**: System Settings → Bluetooth → click the **i** next to the device → **Forget Device**. Then pair fresh.
- **Windows**: Settings → Devices → Bluetooth → click the device → **Remove device**. Then pair fresh.

## Step 4: Reset the headphones

Most headphones have a factory-reset combo (usually power + volume buttons held together). Check the manual or the vendor''s website — this clears all pairings on the headphones themselves.

## Step 5: Restart Bluetooth

- **Mac**: Option-click the Bluetooth icon → **Reset the Bluetooth module**
- **Windows**: Restart the PC. Faster than digging through services.

## Still nothing

File a ticket with **End-User Compute** with the headphone model and the steps you''ve tried.', '{}', '2026-05-01 20:06:04.445752+00', '2026-05-01 20:06:04.445752+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (20, 'Browser shows "Your connection isn''t private"', 'network', '# Browser shows "Your connection isn''t private"

Almost always one of three things: an unsigned-into captive Wi-Fi, a wrong system clock, or a missing corporate SSL inspection cert.

## First: is it everywhere or just one site?

- **Every site** (google.com, slack.com, your email) → it''s your laptop or network
- **One site** → it''s that site''s certificate

## Cause 1: Captive portal not signed in

If you''re at a hotel, coffee shop, or airport, you have to sign in to the captive portal first. To trigger it:

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

If you''re on a managed laptop and visiting an external site, the network sometimes intercepts HTTPS for security scanning. The Slice CA cert needs to be trusted on your machine.

Normally this is automatic via Jamf / Intune. If it''s not (e.g. on a brand-new laptop), file a ticket with **End-User Compute** — the fix is for IT to push the cert.

## Cause 4: The site''s cert is genuinely broken

If only ONE external site shows the warning, the site itself probably has a bad cert. Click the warning, look for "Issued by" and "Expired on" — the site owner needs to fix it. Don''t bypass for unknown sites; only proceed if you know it''s safe.

## Don''t click "Proceed anyway" blindly

Especially for internal Slice sites, this warning is sometimes a real attack indicator. If unsure, forward the URL to **phishing@slice.com**.', '{}', '2026-05-01 20:06:50.123444+00', '2026-05-01 20:06:50.123444+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (22, 'App keeps crashing or freezing', 'performance', '# App keeps crashing or freezing

Generic crash troubleshooting that works for almost any app. Try in order — each step takes under 2 minutes.

## Step 1: Force quit and reopen

- **Mac**: Cmd+Option+Esc → select the app → Force Quit
- **Windows**: Ctrl+Shift+Esc → right-click the app → End task

Reopen. If it works now, you''re done — but note the trigger; it may recur.

## Step 2: Reboot

The classic. Mac and Windows both queue updates that finish on reboot — going more than a week without restarting is a top cause of weird crashes.

## Step 3: Update the app

Most apps have **Check for Updates** in their menu. Crashes after a recent OS update usually mean you need a newer app version.

- Mac App Store apps: open App Store → Updates
- Everything else: the app''s own menu, or visit the vendor''s website

## Step 4: Check disk space

If your disk is more than 90% full, EVERY app gets slower and more crash-prone because the OS can''t allocate scratch space. See the **Laptop running slow** guide for cleanup steps.

## Step 5: Check for OS updates

If the app crashes on launch after a Mac/Windows update, install pending OS patches:

- **Mac**: System Settings → General → Software Update
- **Windows**: Settings → Windows Update → Check for updates

## Step 6: Reinstall the app

If the issue is targeted to one app and the above didn''t help:

1. Save anything important from the app first
2. Quit the app fully
3. Drag to Trash (Mac) / Uninstall (Windows)
4. Reinstall from the official source

## Step 7: Submit a crash report

If reinstalling doesn''t fix it, file a ticket with **End-User Compute**. Include:

- The app name and version (from the app''s About screen)
- Your OS version
- What you were doing when it crashed
- The Console / Event Viewer log entry — Mac: open Console.app, search for the app name; Windows: Event Viewer → Windows Logs → Application

## When it''s not the app

Repeated crashes across multiple apps → it''s the OS or hardware. File a ticket. Random shutdowns or kernel panics → likely hardware. File urgently.', '{}', '2026-05-01 20:08:21.028963+00', '2026-05-01 20:08:21.028963+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (24, 'Calendar invite not showing up', 'email', '# Calendar invite not showing up

Someone told you a meeting is on your calendar but you don''t see it. Almost always one of four causes.

## Cause 1: Wrong calendar account

Are you signed into a personal Google account in addition to your @slice.com one? The invite went to one but you''re viewing the other.

In Google Calendar (web): top-right → click your avatar → confirm you''re on **@slice.com**. Switch if not.

## Cause 2: External invite delay

Google has a known issue: invites sent **across organizations** (someone external to Slice) sometimes take **5–10 minutes** to appear. Wait, then refresh.

## Cause 3: Invite landed in spam

External invites occasionally go to Gmail''s spam folder, which means Calendar never auto-accepts them. Check spam, look for "you have been invited to..." messages, click **Add to calendar** manually.

## Cause 4: Auto-accept disabled

Some people set rules like "auto-decline meetings outside business hours." Check Calendar Settings → Event settings → "Add invitations to my calendar" — make sure it''s set to **From everyone** or at least **Only if I have responded**.

## Specific: meeting room not showing

Resource calendars (HQ-Conf-A, etc.) appear as a separate calendar entry, not on yours. To see room availability:

1. Calendar settings → **Add calendar** → **Browse resources**
2. Subscribe to the rooms you book often

## File a ticket if

- Invites work for everyone else but never reach you (likely a delegation issue)
- Calendar shows the meeting but the invite email is missing — file with the **Collaboration** team

Typical SLA: 4 business hours.', '{}', '2026-05-01 20:09:52.909645+00', '2026-05-01 20:09:52.909645+00', 'guide', '{}', NULL, 0, 0, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (23, 'Phishing email — what to do', 'security', '# Phishing email — what to do

If you suspect a message is phishing — DON''T click links, DON''T open attachments, DON''T reply. Report it.

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

Don''t forward inline — Security needs the original headers, which only "Forward as attachment" preserves.

## What if I already clicked the link?

1. **Don''t enter credentials** if you''re on a fake page — close the tab immediately
2. If you DID enter credentials: change your OneLogin password right now (see **Reset my OneLogin password**)
3. File an URGENT ticket with **Security**
4. If you ran an attachment: shut down your laptop and file a ticket — Security will image it

## When in doubt

Send to **phishing@slice.com** anyway. Better one false positive than a missed compromise. Security responds to every report within 4 hours, often faster.

## Common Slice-specific scams

Things we''ve seen in the past 12 months:

- Fake "Microsoft 365 storage full" notices (we use Google Workspace, not Microsoft)
- "OneLogin password expiring" emails (real ones come from noreply@onelogin.com only)
- Vendor invoice updates asking you to "update banking details" (always verify by phone before any change)', '{}', '2026-05-01 20:09:06.725041+00', '2026-05-01 20:09:06.725041+00', 'faq', '{}', NULL, 0, 1, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (27, 'Locked out of an app after a password reset', 'identity', '# Locked out of an app after a password reset

You reset your OneLogin password, but now Slack / Zoom / GitHub won''t let you in. Here''s why and how to fix.

## Why this happens

Most Slice apps federate through OneLogin via SAML. After a password reset, OneLogin invalidates **active sessions** for security. Apps that had a cached login token now reject it.

## Quick fix: sign out, sign back in

In the app:

1. Sign out completely (don''t just close the window)
2. Sign back in — it''ll redirect you through OneLogin
3. Approve the OneLogin Protect MFA prompt
4. You''re back in

Works for: Slack, Zoom, GitHub, Jira, Confluence, AWS, GCP.

## Mobile apps need extra steps

The Slack mobile app, Outlook mobile, etc. cache tokens longer:

- Force-quit the app (swipe from the multitasking view)
- Reopen — it''ll prompt for fresh auth
- Some apps may need full sign-out from settings

## Browser caching an old session

If sign-out / sign-in doesn''t work in the browser:

1. Sign out of OneLogin too: visit https://slice.onelogin.com → click your avatar → Sign out
2. Clear cookies for the app''s domain (browser settings → privacy → cookies)
3. Sign in again

## If it''s still rejecting you

The app might not have refreshed your federated identity yet. Wait 5 minutes and try again. If still locked out after 10 minutes, file a ticket with **Identity & Access** and mention which app — they can force-refresh the directory.

## Special case: 1Password

1Password has its own master password separate from OneLogin. Resetting OneLogin doesn''t affect it. If you''ve forgotten the 1Password master, contact 1Password support directly — Slice IT can''t recover it.', '{}', '2026-05-01 20:37:27.907506+00', '2026-05-01 20:37:27.907506+00', 'faq', '{}', NULL, 0, 4, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (13, 'Connect to GlobalProtect VPN', 'network', '# Connect to GlobalProtect VPN

Slice uses **Palo Alto GlobalProtect** for VPN. The portal is **vpn.slice.systems** and your credentials are the same ones you use for OneLogin.

## First-time setup

GlobalProtect comes pre-installed on every Slice laptop via the device baseline. If you don''t see it, file a ticket and we''ll push it remotely.

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
- The VPN auto-disconnects after 12 hours and on sleep — you''ll need to re-auth in the morning.

## Troubleshooting

### "Authentication failed"

Almost always your OneLogin password expired or you mistyped it. Reset at https://slice.onelogin.com — see the **Reset my OneLogin password** guide.

### "Portal unreachable"

- Check your internet (try loading google.com)
- Confirm the portal is exactly **vpn.slice.systems** (no `https://`, no trailing slash)
- If you''re on a hotel / coffee-shop captive portal, log into the captive portal first, then reconnect

### MFA push not arriving

- Make sure OneLogin Protect is installed on your phone and you have signal
- Use the manual 6-digit code from the app instead of waiting for the push
- If the code is rejected, your phone clock might be off — open OneLogin Protect → Settings → resync time

### Still stuck

File a ticket with the **Network Operations** team. Include the exact error message — GlobalProtect''s error text usually tells us the cause within 5 seconds.', '{}', '2026-05-01 19:29:20.891356+00', '2026-05-01 19:29:20.891356+00', 'guide', '{}', NULL, 0, 3, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (26, 'Slack keeps disconnecting or won''t load', 'collaboration', '# Slack keeps disconnecting or won''t load

Slack has more failure modes than most apps because it''s both a desktop app and a real-time websocket. Quick diagnostic ladder:

## Step 1: Confirm it''s not a Slack outage

Open a browser, go to **status.slack.com**. If Slack reports a problem, you''re done — wait it out.

If Slack itself is fine, check your network — does Gmail load? Does VPN work? If everything else is broken, the issue is your network (see the Wi-Fi guide).

## Step 2: Reload the workspace

In the Slack desktop app: **Cmd-R** (Mac) / **Ctrl-R** (Windows). Forces a full reload without restarting the app.

## Step 3: Quit and reopen

Don''t just close the window — actually quit the app:

- **Mac**: Cmd+Q from the Slack menu
- **Windows**: right-click Slack in the system tray → Quit

Reopen. Many disconnect issues are stale websocket state that a full restart clears.

## Step 4: Clear the cache

If reloads don''t help, the local cache may be corrupt.

- Slack menu → **Help** → **Troubleshooting** → **Clear Cache and Restart**

You''ll lose draft messages, but get a fresh start.

## Step 5: Reinstall

If clearing cache doesn''t fix it:

1. Quit Slack
2. Move the Slack app to Trash / uninstall
3. Reinstall from **slack.com/downloads** (don''t use the App Store / Microsoft Store version — the standalone is more reliable)

## Step 6: Check VPN

If you''re on VPN and Slack stops working but Gmail still works, Slack''s websocket might be blocked by a bad routing rule. Disconnect VPN, see if Slack reconnects. If it does, file a ticket with **Network Operations** — the VPN ACL needs adjusting.

## Persistent disconnects on Wi-Fi but not Ethernet

Aggressive corporate Wi-Fi access points sometimes kick websockets every 10–15 minutes. If this is consistent, file a ticket with **Network Operations** and mention the floor / building.', '{}', '2026-05-01 20:37:27.898912+00', '2026-05-01 20:37:27.898912+00', 'guide', '{}', NULL, 4, 11, NULL);
INSERT INTO public.guides (id, title, category, body, tags, created_at, updated_at, source_type, metadata, last_verified_at, helpful_count, unhelpful_count, deleted_at) VALUES (30, 'How to Clear Cookies and Cache in Chrome for One Site', '', '**Step** 1: Load the site from which you want to clear cookies and cache in Google Chrome and click on the **padlock-shaped icon** in the left corner of the address bar.

<img src="https://it.slice.services/uploads/1775753346499-154521928.png" style="width: 60%" data-align="left" />

**Step** 2: From the pop-up modal, click on **Cookies and site data**

<img src="https://it.slice.services/uploads/1775753385494-750232294.png" style="width: 60%" data-align="left" />

**Step** 3: Continue to click on **Manage on-device site data**

<img src="https://it.slice.services/uploads/1775753432877-768744008.png" style="width: 60%" data-align="left" />

**Step 4:** Clear the data from the website URL that you are currently on by clicking the **Trash icon**

<img src="https://it.slice.services/uploads/1775753521954-887807358.png" style="width: 60%" data-align="left" />

> *The website''s cookies and cache will be cleared immediately by Chrome. Once you refresh the website, it will only load fresh cookies and data.*', '{}', '2026-05-02 17:44:14.958639+00', '2026-05-02 18:45:47.218566+00', 'guide', '{}', NULL, 0, 1, NULL);


--
-- Data for Name: guide_chunks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (119, 26, 0, '# Slack keeps disconnecting or won''t load

Slack has more failure modes than most apps because it''s both a desktop app and a real-time websocket. Quick diagnostic ladder:', '''app'':15,22 ''desktop'':21 ''diagnost'':30 ''disconnect'':3 ''failur'':11 ''keep'':2 ''ladder'':31 ''load'':7 ''mode'':12 ''quick'':29 ''real'':26 ''real-tim'':25 ''slack'':1,8 ''time'':27 ''websocket'':28 ''won'':5');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (120, 26, 1, '## Step 1: Confirm it''s not a Slack outage

Open a browser, go to **status.slack.com**. If Slack reports a problem, you''re done — wait it out.

If Slack itself is fine, check your network — does Gmail load? Does VPN work? If everything else is broken, the issue is your network (see the Wi-Fi guide).', '''1'':2 ''broken'':45 ''browser'':12 ''check'':32 ''confirm'':3 ''done'':23 ''els'':43 ''everyth'':42 ''fi'':55 ''fine'':31 ''gmail'':36 ''go'':13 ''guid'':56 ''issu'':47 ''load'':37 ''network'':34,50 ''open'':10 ''outag'':9 ''problem'':20 ''re'':22 ''report'':18 ''see'':51 ''slack'':8,17,28 ''status.slack.com'':15 ''step'':1 ''vpn'':39 ''wait'':24 ''wi'':54 ''wi-fi'':53 ''work'':40');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (121, 26, 2, '## Step 2: Reload the workspace

In the Slack desktop app: **Cmd-R** (Mac) / **Ctrl-R** (Windows). Forces a full reload without restarting the app.', '''2'':2 ''app'':10,26 ''cmd'':12 ''cmd-r'':11 ''ctrl'':16 ''ctrl-r'':15 ''desktop'':9 ''forc'':19 ''full'':21 ''mac'':14 ''r'':13,17 ''reload'':3,22 ''restart'':24 ''slack'':8 ''step'':1 ''window'':18 ''without'':23 ''workspac'':5');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (122, 26, 3, '## Step 3: Quit and reopen

Don''t just close the window — actually quit the app:

- **Mac**: Cmd+Q from the Slack menu
- **Windows**: right-click Slack in the system tray → Quit

Reopen. Many disconnect issues are stale websocket state that a full restart clears.', '''3'':2 ''actual'':12 ''app'':15 ''clear'':45 ''click'':26 ''close'':9 ''cmd'':17 ''disconnect'':35 ''full'':43 ''issu'':36 ''mac'':16 ''mani'':34 ''menu'':22 ''q'':18 ''quit'':3,13,32 ''reopen'':5,33 ''restart'':44 ''right'':25 ''right-click'':24 ''slack'':21,27 ''stale'':38 ''state'':40 ''step'':1 ''system'':30 ''tray'':31 ''websocket'':39 ''window'':11,23');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (123, 26, 4, '## Step 4: Clear the cache

If reloads don''t help, the local cache may be corrupt.

- Slack menu → **Help** → **Troubleshooting** → **Clear Cache and Restart**

You''ll lose draft messages, but get a fresh start.', '''4'':2 ''cach'':5,13,22 ''clear'':3,21 ''corrupt'':16 ''draft'':28 ''fresh'':33 ''get'':31 ''help'':10,19 ''ll'':26 ''local'':12 ''lose'':27 ''may'':14 ''menu'':18 ''messag'':29 ''reload'':7 ''restart'':24 ''slack'':17 ''start'':34 ''step'':1 ''troubleshoot'':20');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (124, 26, 5, '## Step 5: Reinstall

If clearing cache doesn''t fix it:

1. Quit Slack
2. Move the Slack app to Trash / uninstall
3. Reinstall from **slack.com/downloads** (don''t use the App Store / Microsoft Store version — the standalone is more reliable)', '''/downloads**'':27 ''1'':11 ''2'':14 ''3'':22 ''5'':2 ''app'':18,32 ''cach'':6 ''clear'':5 ''doesn'':7 ''fix'':9 ''microsoft'':34 ''move'':15 ''quit'':12 ''reinstal'':3,23 ''reliabl'':41 ''slack'':13,17 ''slack.com'':26 ''slack.com/downloads**'':25 ''standalon'':38 ''step'':1 ''store'':33,35 ''trash'':20 ''uninstal'':21 ''use'':30 ''version'':36');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (125, 26, 6, '## Step 6: Check VPN

If you''re on VPN and Slack stops working but Gmail still works, Slack''s websocket might be blocked by a bad routing rule. Disconnect VPN, see if Slack reconnects. If it does, file a ticket with **Network Operations** — the VPN ACL needs adjusting.', '''6'':2 ''acl'':46 ''adjust'':48 ''bad'':26 ''block'':23 ''check'':3 ''disconnect'':29 ''file'':38 ''gmail'':15 ''might'':21 ''need'':47 ''network'':42 ''oper'':43 ''re'':7 ''reconnect'':34 ''rout'':27 ''rule'':28 ''see'':31 ''slack'':11,18,33 ''step'':1 ''still'':16 ''stop'':12 ''ticket'':40 ''vpn'':4,9,30,45 ''websocket'':20 ''work'':13,17');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (126, 26, 7, '## Persistent disconnects on Wi-Fi but not Ethernet

Aggressive corporate Wi-Fi access points sometimes kick websockets every 10–15 minutes. If this is consistent, file a ticket with **Network Operations** and mention the floor / building.', '''10'':21 ''15'':22 ''access'':15 ''aggress'':10 ''build'':38 ''consist'':27 ''corpor'':11 ''disconnect'':2 ''ethernet'':9 ''everi'':20 ''fi'':6,14 ''file'':28 ''floor'':37 ''kick'':18 ''mention'':35 ''minut'':23 ''network'':32 ''oper'':33 ''persist'':1 ''point'':16 ''sometim'':17 ''ticket'':30 ''websocket'':19 ''wi'':5,13 ''wi-fi'':4,12');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (127, 27, 0, '# Locked out of an app after a password reset

You reset your OneLogin password, but now Slack / Zoom / GitHub won''t let you in. Here''s why and how to fix.', '''app'':5 ''fix'':31 ''github'':19 ''let'':22 ''lock'':1 ''onelogin'':13 ''password'':8,14 ''reset'':9,11 ''slack'':17 ''won'':20 ''zoom'':18');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (128, 27, 1, '## Why this happens

Most Slice apps federate through OneLogin via SAML. After a password reset, OneLogin invalidates **active sessions** for security. Apps that had a cached login token now reject it.', '''activ'':18 ''app'':6,22 ''cach'':26 ''feder'':7 ''happen'':3 ''invalid'':17 ''login'':27 ''onelogin'':9,16 ''password'':14 ''reject'':30 ''reset'':15 ''saml'':11 ''secur'':21 ''session'':19 ''slice'':5 ''token'':28 ''via'':10');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (129, 27, 2, '## Quick fix: sign out, sign back in

In the app:

1. Sign out completely (don''t just close the window)
2. Sign back in — it''ll redirect you through OneLogin
3. Approve the OneLogin Protect MFA prompt
4. You''re back in

Works for: Slack, Zoom, GitHub, Jira, Confluence, AWS, GCP.', '''1'':11 ''2'':21 ''3'':31 ''4'':38 ''app'':10 ''approv'':32 ''aw'':50 ''back'':6,23,41 ''close'':18 ''complet'':14 ''confluenc'':49 ''fix'':2 ''gcp'':51 ''github'':47 ''jira'':48 ''ll'':26 ''mfa'':36 ''onelogin'':30,34 ''prompt'':37 ''protect'':35 ''quick'':1 ''re'':40 ''redirect'':27 ''sign'':3,5,12,22 ''slack'':45 ''window'':20 ''work'':43 ''zoom'':46');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (5, 3, 0, '# Reset my OneLogin password

Slice uses **OneLogin** as the single sign-on for nearly every internal tool — Google Workspace, Slack, Jira, Confluence, AWS, GitHub. If you can''t sign in to any one of them, this is almost always the place to start.', '''almost'':39 ''alway'':40 ''aw'':24 ''confluenc'':23 ''everi'':16 ''github'':25 ''googl'':19 ''intern'':17 ''jira'':22 ''near'':15 ''one'':34 ''onelogin'':3,7 ''password'':4 ''place'':42 ''reset'':1 ''sign'':12,30 ''sign-on'':11 ''singl'':10 ''slack'':21 ''slice'':5 ''start'':44 ''tool'':18 ''use'':6 ''workspac'':20');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (10, 4, 0, '# Wi-Fi isn''t working

Quick triage that solves about 80% of Wi-Fi issues at HQ. Try these in order — each step is ~30 seconds.', '''30'':27 ''80'':12 ''fi'':3,16 ''hq'':19 ''isn'':4 ''issu'':17 ''order'':23 ''quick'':7 ''second'':28 ''solv'':10 ''step'':25 ''tri'':20 ''triag'':8 ''wi'':2,15 ''wi-fi'':1,14 ''work'':6');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (130, 27, 3, '## Mobile apps need extra steps

The Slack mobile app, Outlook mobile, etc. cache tokens longer:

- Force-quit the app (swipe from the multitasking view)
- Reopen — it''ll prompt for fresh auth
- Some apps may need full sign-out from settings', '''app'':2,9,20,34 ''auth'':32 ''cach'':13 ''etc'':12 ''extra'':4 ''forc'':17 ''force-quit'':16 ''fresh'':31 ''full'':37 ''ll'':28 ''longer'':15 ''may'':35 ''mobil'':1,8,11 ''multitask'':24 ''need'':3,36 ''outlook'':10 ''prompt'':29 ''quit'':18 ''reopen'':26 ''set'':42 ''sign'':39 ''sign-out'':38 ''slack'':7 ''step'':5 ''swipe'':21 ''token'':14 ''view'':25');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (131, 27, 4, '## Browser caching an old session

If sign-out / sign-in doesn''t work in the browser:

1. Sign out of OneLogin too: visit https://slice.onelogin.com → click your avatar → Sign out
2. Clear cookies for the app''s domain (browser settings → privacy → cookies)
3. Sign in again', '''1'':19 ''2'':32 ''3'':44 ''app'':37 ''avatar'':29 ''browser'':1,18,40 ''cach'':2 ''clear'':33 ''click'':27 ''cooki'':34,43 ''doesn'':13 ''domain'':39 ''old'':4 ''onelogin'':23 ''privaci'':42 ''session'':5 ''set'':41 ''sign'':8,11,20,30,45 ''sign-in'':10 ''sign-out'':7 ''slice.onelogin.com'':26 ''visit'':25 ''work'':15');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (132, 27, 5, '## If it''s still rejecting you

The app might not have refreshed your federated identity yet. Wait 5 minutes and try again. If still locked out after 10 minutes, file a ticket with **Identity & Access** and mention which app — they can force-refresh the directory.', '''10'':28 ''5'':18 ''access'':35 ''app'':8,39 ''directori'':46 ''feder'':14 ''file'':30 ''forc'':43 ''force-refresh'':42 ''ident'':15,34 ''lock'':25 ''mention'':37 ''might'':9 ''minut'':19,29 ''refresh'':12,44 ''reject'':5 ''still'':4,24 ''ticket'':32 ''tri'':21 ''wait'':17 ''yet'':16');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (133, 27, 6, '## Special case: 1Password

1Password has its own master password separate from OneLogin. Resetting OneLogin doesn''t affect it. If you''ve forgotten the 1Password master, contact 1Password support directly — Slice IT can''t recover it.', '''1password'':3,4,24,27 ''affect'':17 ''case'':2 ''contact'':26 ''direct'':29 ''doesn'':15 ''forgotten'':22 ''master'':8,25 ''onelogin'':12,14 ''password'':9 ''recov'':34 ''reset'':13 ''separ'':10 ''slice'':30 ''special'':1 ''support'':28 ''ve'':21');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (40, 13, 3, '## Troubleshooting', '''troubleshoot'':1');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (150, 30, 0, '**Step** 1: Load the site from which you want to clear cookies and cache in Google Chrome and click on the **padlock-shaped icon** in the left corner of the address bar.

<img src="https://it.slice.services/uploads/1775753346499-154521928.png" style="width: 60%" data-align="left" />

**Step** 2: From the pop-up modal, click on **Cookies and site data**

<img src="https://it.slice.services/uploads/1775753385494-750232294.png" style="width: 60%" data-align="left" />

**Step** 3: Continue to click on **Manage on-device site data**

<img src="https://it.slice.services/uploads/1775753432877-768744008.png" style="width: 60%" data-align="left" />

**Step 4:** Clear the data from the website URL that you are currently on by clicking the **Trash icon**

<img src="https://it.slice.services/uploads/1', '''/uploads/1'':83 ''1'':2 ''2'':35 ''3'':49 ''4'':61 ''address'':32 ''bar'':33 ''cach'':14 ''chrome'':17 ''clear'':11,62 ''click'':19,42,52,75 ''continu'':50 ''cooki'':12,44 ''corner'':29 ''current'':72 ''data'':47,59,64 ''devic'':57 ''googl'':16 ''icon'':25,78 ''img'':79 ''it.slice.services'':82 ''it.slice.services/uploads/1'':81 ''left'':28 ''load'':3 ''manag'':54 ''modal'':41 ''on-devic'':55 ''padlock'':23 ''padlock-shap'':22 ''pop'':39 ''pop-up'':38 ''shape'':24 ''site'':5,46,58 ''src'':80 ''step'':1,34,48,60 ''trash'':77 ''url'':68 ''want'':9 ''websit'':67');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (151, 30, 1, 't you are currently on by clicking the **Trash icon**

<img src="https://it.slice.services/uploads/1775753521954-887807358.png" style="width: 60%" data-align="left" />

> *The website''s cookies and cache will be cleared immediately by Chrome. Once you refresh the website, it will only load fresh cookies and data.*', '''cach'':16 ''chrome'':22 ''clear'':19 ''click'':7 ''cooki'':14,33 ''current'':4 ''data'':35 ''fresh'':32 ''icon'':10 ''immedi'':20 ''load'':31 ''refresh'':25 ''trash'':9 ''websit'':12,27');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (6, 3, 1, '## Self-serve reset

1. Go to https://slice.onelogin.com
2. Click **Forgot Password** below the sign-in box
3. Enter your @slice.com email
4. Check your inbox for a reset link — it usually arrives in under 30 seconds (check Spam if not)
5. Click the link, choose a new password (min 12 characters, mix of upper/lower, numbers, at least one symbol)
6. Sign in with the new password', '''1'':5 ''12'':52 ''2'':9 ''3'':19 ''30'':37 ''4'':24 ''5'':43 ''6'':62 ''arriv'':34 ''box'':18 ''charact'':53 ''check'':25,39 ''choos'':47 ''click'':10,44 ''email'':23 ''enter'':20 ''forgot'':11 ''go'':6 ''inbox'':27 ''least'':59 ''link'':31,46 ''min'':51 ''mix'':54 ''new'':49,67 ''number'':57 ''one'':60 ''password'':12,50,68 ''reset'':4,30 ''second'':38 ''self'':2 ''self-serv'':1 ''serv'':3 ''sign'':16,63 ''sign-in'':15 ''slice.com'':22 ''slice.onelogin.com'':8 ''spam'':40 ''symbol'':61 ''upper/lower'':56 ''usual'':33');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (7, 3, 2, '## If the reset email doesn''t arrive

- Wait 5 minutes — Google''s spam filter sometimes holds it briefly
- Check **Spam** and **All Mail** in Gmail
- Make sure you used your @slice.com address, not a personal one', '''5'':9 ''address'':32 ''arriv'':7 ''briefli'':18 ''check'':19 ''doesn'':5 ''email'':4 ''filter'':14 ''gmail'':25 ''googl'':11 ''hold'':16 ''mail'':23 ''make'':26 ''minut'':10 ''one'':36 ''person'':35 ''reset'':3 ''slice.com'':31 ''sometim'':15 ''spam'':13,20 ''sure'':27 ''use'':29 ''wait'':8');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (8, 3, 3, '## If self-serve doesn''t work

If the link is expired, you''re locked out, or the email never arrives, file a ticket with the **Identity & Access** team. Typical response is 2 hours during business hours; on-call covers urgent lockouts after hours.', '''2'':33 ''access'':28 ''arriv'':21 ''busi'':36 ''call'':40 ''cover'':41 ''doesn'':5 ''email'':19 ''expir'':12 ''file'':22 ''hour'':34,37,45 ''ident'':27 ''link'':10 ''lock'':15 ''lockout'':43 ''never'':20 ''on-cal'':38 ''re'':14 ''respons'':31 ''self'':3 ''self-serv'':2 ''serv'':4 ''team'':29 ''ticket'':24 ''typic'':30 ''urgent'':42 ''work'':7');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (9, 3, 4, '## What this resets

Resetting your OneLogin password resets access to almost everything — Google Workspace, Slack, GitHub, AWS — because they all federate through OneLogin. You usually don''t need to reset each app individually.', '''access'':9 ''almost'':11 ''app'':32 ''aw'':17 ''everyth'':12 ''feder'':21 ''github'':16 ''googl'':13 ''individu'':33 ''need'':28 ''onelogin'':6,23 ''password'':7 ''reset'':3,4,8,30 ''slack'':15 ''usual'':25 ''workspac'':14');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (11, 4, 1, '## Step 1: Toggle Wi-Fi off and on

Click the Wi-Fi icon in your menu bar (Mac) or system tray (Windows), turn it off, wait 5 seconds, turn it back on. Reconnect to **Slice-Corp**.', '''1'':2 ''5'':29 ''back'':33 ''bar'':19 ''click'':10 ''corp'':39 ''fi'':6,14 ''icon'':15 ''mac'':20 ''menu'':18 ''reconnect'':35 ''second'':30 ''slice'':38 ''slice-corp'':37 ''step'':1 ''system'':22 ''toggl'':3 ''tray'':23 ''turn'':25,31 ''wait'':28 ''wi'':5,13 ''wi-fi'':4,12 ''window'':24');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (12, 4, 2, '## Step 2: Forget the network and rejoin

If the toggle didn''t help, "forget" the Slice-Corp network and rejoin from scratch — sometimes a stale auth cache is the problem.', '''2'':2 ''auth'':27 ''cach'':28 ''corp'':18 ''didn'':11 ''forget'':3,14 ''help'':13 ''network'':5,19 ''problem'':31 ''rejoin'':7,21 ''scratch'':23 ''slice'':17 ''slice-corp'':16 ''sometim'':24 ''stale'':26 ''step'':1 ''toggl'':10');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (13, 4, 3, '### Mac

1. System Settings → Wi-Fi → click the **i** next to Slice-Corp → **Forget This Network**
2. Click Slice-Corp from the list and sign in again with your OneLogin email + password', '''1'':2 ''2'':19 ''click'':8,20 ''corp'':15,23 ''email'':34 ''fi'':7 ''forget'':16 ''list'':26 ''mac'':1 ''network'':18 ''next'':11 ''onelogin'':33 ''password'':35 ''set'':4 ''sign'':28 ''slice'':14,22 ''slice-corp'':13,21 ''system'':3 ''wi'':6 ''wi-fi'':5');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (14, 4, 4, '### Windows

1. Settings → Network & Internet → Wi-Fi → **Manage known networks**
2. Select Slice-Corp → **Forget**
3. Reconnect from the Wi-Fi flyout, sign in with OneLogin', '''1'':2 ''2'':12 ''3'':18 ''corp'':16 ''fi'':8,24 ''flyout'':25 ''forget'':17 ''internet'':5 ''known'':10 ''manag'':9 ''network'':4,11 ''onelogin'':29 ''reconnect'':19 ''select'':13 ''set'':3 ''sign'':26 ''slice'':15 ''slice-corp'':14 ''wi'':7,23 ''wi-fi'':6,22 ''window'':1');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (15, 4, 5, '## Step 3: Check if it''s just you

Look at someone next to you — if their Wi-Fi works fine, it''s your laptop, not the office. Restart it.', '''3'':2 ''check'':3 ''fi'':19 ''fine'':21 ''laptop'':25 ''look'':9 ''next'':12 ''offic'':28 ''restart'':29 ''someon'':11 ''step'':1 ''wi'':18 ''wi-fi'':17 ''work'':20');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (16, 4, 6, '## Step 4: Check the IT status board

Go to **status.slice.com** to see if Network Operations has flagged an outage. If so, you''ll see an active incident.', '''4'':2 ''activ'':26 ''board'':7 ''check'':3 ''flag'':17 ''go'':8 ''incid'':27 ''ll'':23 ''network'':14 ''oper'':15 ''outag'':19 ''see'':12,24 ''status'':6 ''status.slice.com'':10 ''step'':1');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (17, 4, 7, '## If none of this works

File a ticket with the **Network Operations** team. Include:

- Building / floor / desk number
- The error message you see (screenshot helps)
- Whether anyone near you has the same issue

P1 SLA: 1 hour during business hours.', '''1'':36 ''anyon'':27 ''build'':15 ''busi'':39 ''desk'':17 ''error'':20 ''file'':6 ''floor'':16 ''help'':25 ''hour'':37,40 ''includ'':14 ''issu'':33 ''messag'':21 ''near'':28 ''network'':11 ''none'':2 ''number'':18 ''oper'':12 ''p1'':34 ''screenshot'':24 ''see'':23 ''sla'':35 ''team'':13 ''ticket'':8 ''whether'':26 ''work'':5');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (18, 5, 0, '# Laptop running slow

A slow laptop is almost always one of three things: full disk, runaway process, or something pending a reboot. Here''s how to check each in under 10 minutes.', '''10'':31 ''almost'':8 ''alway'':9 ''check'':27 ''disk'':15 ''full'':14 ''laptop'':1,6 ''minut'':32 ''one'':10 ''pend'':20 ''process'':17 ''reboot'':22 ''run'':2 ''runaway'':16 ''slow'':3,5 ''someth'':19 ''thing'':13 ''three'':12');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (19, 5, 1, '## Check 1: Reboot if you haven''t in a week

This is the single highest-yield fix. macOS and Windows both queue updates that finish on reboot — going more than a week without restarting causes weird slowdowns. Save your work and restart now if it''s been a while.', '''1'':2 ''caus'':36 ''check'':1 ''finish'':26 ''fix'':18 ''go'':29 ''haven'':6 ''highest'':16 ''highest-yield'':15 ''maco'':19 ''queue'':23 ''reboot'':3,28 ''restart'':35,43 ''save'':39 ''singl'':14 ''slowdown'':38 ''updat'':24 ''week'':10,33 ''weird'':37 ''window'':21 ''without'':34 ''work'':41 ''yield'':17');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (20, 5, 2, '## Check 2: Disk space

A nearly-full disk slows everything down because the OS can''t allocate scratch space.', '''2'':2 ''alloc'':18 ''check'':1 ''disk'':3,9 ''everyth'':11 ''full'':8 ''near'':7 ''nearly-ful'':6 ''os'':15 ''scratch'':19 ''slow'':10 ''space'':4,20');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (21, 5, 3, '### Mac

1. Apple menu → **About This Mac** → **More Info** → **Storage Settings**
2. If the bar is more than 90% full, free space — empty Trash, clean Downloads, remove unused apps
3. The **Recommendations** panel can clear 20–50 GB automatically', '''1'':2 ''2'':12 ''20'':36 ''3'':30 ''50'':37 ''90'':19 ''app'':29 ''appl'':3 ''automat'':39 ''bar'':15 ''clean'':25 ''clear'':35 ''download'':26 ''empti'':23 ''free'':21 ''full'':20 ''gb'':38 ''info'':9 ''mac'':1,7 ''menu'':4 ''panel'':33 ''recommend'':32 ''remov'':27 ''set'':11 ''space'':22 ''storag'':10 ''trash'':24 ''unus'':28');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (22, 5, 4, '### Windows

1. Settings → System → Storage
2. Run **Storage Sense** to clear temp files and Recycle Bin
3. If you''re under 10 GB free, that''s almost certainly your problem', '''1'':2 ''10'':22 ''2'':6 ''3'':17 ''almost'':27 ''bin'':16 ''certain'':28 ''clear'':11 ''file'':13 ''free'':24 ''gb'':23 ''problem'':30 ''re'':20 ''recycl'':15 ''run'':7 ''sens'':9 ''set'':3 ''storag'':5,8 ''system'':4 ''temp'':12 ''window'':1');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (23, 5, 5, '## Check 3: Runaway process', '''3'':2 ''check'':1 ''process'':4 ''runaway'':3');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (24, 5, 6, '### Mac — Activity Monitor

Spotlight → "Activity Monitor" → **CPU** tab → sort by % CPU. If something is at 90%+ for more than a few minutes and isn''t a video call or build, quit it.', '''90'':16 ''activ'':2,5 ''build'':30 ''call'':28 ''cpu'':7,11 ''isn'':24 ''mac'':1 ''minut'':22 ''monitor'':3,6 ''quit'':31 ''someth'':13 ''sort'':9 ''spotlight'':4 ''tab'':8 ''video'':27');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (25, 5, 7, '### Windows — Task Manager

Ctrl+Shift+Esc → **Processes** tab → click the CPU column to sort. Same logic — kill anything stuck above 90%.', '''90'':21 ''anyth'':18 ''click'':9 ''column'':12 ''cpu'':11 ''ctrl'':4 ''esc'':6 ''kill'':17 ''logic'':16 ''manag'':3 ''process'':7 ''shift'':5 ''sort'':14 ''stuck'':19 ''tab'':8 ''task'':2 ''window'':1');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (26, 5, 8, '## Common culprits

- **Backup software** indexing for the first time after a system update
- **Video calls** with screen-share running in the background
- **Browser tabs** — close everything you''re not actively using
- **Antivirus** doing a full scan (let it finish, then reboot)', '''activ'':31 ''antivirus'':33 ''background'':23 ''backup'':3 ''browser'':24 ''call'':15 ''close'':26 ''common'':1 ''culprit'':2 ''everyth'':27 ''finish'':40 ''first'':8 ''full'':36 ''index'':5 ''let'':38 ''re'':29 ''reboot'':42 ''run'':20 ''scan'':37 ''screen'':18 ''screen-shar'':17 ''share'':19 ''softwar'':4 ''system'':12 ''tab'':25 ''time'':9 ''updat'':13 ''use'':32 ''video'':14');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (27, 5, 9, '## If it''s still slow

If you''ve done all of the above and it''s still molasses, file a ticket with the **End-User Compute** team. Include the output of Activity Monitor / Task Manager (screenshot helps). Replacement laptops are 1–2 business days if the machine is genuinely failing.', '''1'':42 ''2'':43 ''activ'':33 ''busi'':44 ''comput'':27 ''day'':45 ''done'':9 ''end'':25 ''end-us'':24 ''fail'':51 ''file'':19 ''genuin'':50 ''help'':38 ''includ'':29 ''laptop'':40 ''machin'':48 ''manag'':36 ''molass'':18 ''monitor'':34 ''output'':31 ''replac'':39 ''screenshot'':37 ''slow'':5 ''still'':4,17 ''task'':35 ''team'':28 ''ticket'':21 ''user'':26 ''ve'':8');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (28, 12, 0, '# Set up a new device

For your first day or a replacement laptop. Plan ~90 minutes start to finish; most of that is encryption, OS updates, and software install in the background.', '''90'':15 ''background'':32 ''day'':9 ''devic'':5 ''encrypt'':24 ''finish'':19 ''first'':8 ''instal'':29 ''laptop'':13 ''minut'':16 ''new'':4 ''os'':25 ''plan'':14 ''replac'':12 ''set'':1 ''softwar'':28 ''start'':17 ''updat'':26');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (29, 12, 1, '## Before you start

You''ll need:

- Your OneLogin credentials (sent to your personal email by IT before day one)
- A second device (phone or tablet) to install OneLogin Protect for MFA
- Your laptop charger plugged in — encryption is slow on battery', '''batteri'':41 ''charger'':34 ''credenti'':9 ''day'':18 ''devic'':22 ''email'':14 ''encrypt'':37 ''instal'':27 ''laptop'':33 ''ll'':5 ''mfa'':31 ''need'':6 ''one'':19 ''onelogin'':8,28 ''person'':13 ''phone'':23 ''plug'':35 ''protect'':29 ''second'':21 ''sent'':10 ''slow'':39 ''start'':3 ''tablet'':25');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (41, 13, 4, '### "Authentication failed"

Almost always your OneLogin password expired or you mistyped it. Reset at https://slice.onelogin.com — see the **Reset my OneLogin password** guide.', '''almost'':3 ''alway'':4 ''authent'':1 ''expir'':8 ''fail'':2 ''guid'':22 ''mistyp'':11 ''onelogin'':6,20 ''password'':7,21 ''reset'':13,18 ''see'':16 ''slice.onelogin.com'':15');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (30, 12, 2, '## Step 1: Boot and sign in

1. Power on. The setup wizard guides you through region, keyboard layout, and Wi-Fi
2. Connect to **Slice-Corp** (in the office) or your home Wi-Fi (remote)
3. When prompted for sign-in, use your **@slice.com** email and OneLogin password', '''1'':2,7 ''2'':23 ''3'':39 ''boot'':3 ''connect'':24 ''corp'':28 ''email'':49 ''fi'':22,37 ''guid'':13 ''home'':34 ''keyboard'':17 ''layout'':18 ''offic'':31 ''onelogin'':51 ''password'':52 ''power'':8 ''prompt'':41 ''region'':16 ''remot'':38 ''setup'':11 ''sign'':5,44 ''sign-in'':43 ''slice'':27 ''slice-corp'':26 ''slice.com'':48 ''step'':1 ''use'':46 ''wi'':21,36 ''wi-fi'':20,35 ''wizard'':12');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (31, 12, 3, '## Step 2: Install OneLogin Protect (MFA)

On your phone:

1. App Store / Play Store → search **OneLogin Protect**
2. Install and open the app
3. On your laptop, sign in to https://slice.onelogin.com — it''ll prompt you to enroll a device
4. Scan the QR code with the OneLogin Protect app
5. Approve the test push

This same OneLogin Protect code is also what you''ll use for VPN MFA.', '''1'':10 ''2'':2,18 ''3'':24 ''4'':40 ''5'':50 ''also'':61 ''app'':11,23,49 ''approv'':51 ''code'':44,59 ''devic'':39 ''enrol'':37 ''instal'':3,19 ''laptop'':27 ''ll'':33,64 ''mfa'':6,68 ''onelogin'':4,16,47,57 ''open'':21 ''phone'':9 ''play'':13 ''prompt'':34 ''protect'':5,17,48,58 ''push'':54 ''qr'':43 ''scan'':41 ''search'':15 ''sign'':28 ''slice.onelogin.com'':31 ''step'':1 ''store'':12,14 ''test'':53 ''use'':65 ''vpn'':67');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (32, 12, 4, '## Step 3: Wait for the device to baseline

Your laptop will install the standard Slice software bundle automatically (Jamf on Mac, Intune on Windows). You''ll see notifications as things install — leave it alone for ~30 minutes.

What gets installed:

- Slack
- Chrome and Firefox
- 1Password (you''ll be invited to the company vault separately)
- GlobalProtect (VPN client)
- Zoom
- The standard dev toolchain (if you''re an engineer)', '''1password'':45 ''3'':2 ''30'':36 ''alon'':34 ''automat'':18 ''baselin'':8 ''bundl'':17 ''chrome'':42 ''client'':57 ''compani'':52 ''dev'':61 ''devic'':6 ''engin'':67 ''firefox'':44 ''get'':39 ''globalprotect'':55 ''instal'':12,31,40 ''intun'':22 ''invit'':49 ''jamf'':19 ''laptop'':10 ''leav'':32 ''ll'':26,47 ''mac'':21 ''minut'':37 ''notif'':28 ''re'':65 ''see'':27 ''separ'':54 ''slack'':41 ''slice'':15 ''softwar'':16 ''standard'':14,60 ''step'':1 ''thing'':30 ''toolchain'':62 ''vault'':53 ''vpn'':56 ''wait'':3 ''window'':24 ''zoom'':58');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (33, 12, 5, '## Step 4: Encryption check

- **Mac**: System Settings → Privacy & Security → **FileVault** → confirm it''s **On**
- **Windows**: Settings → Privacy & Security → **Device encryption** → confirm it''s **On**

If either is off, file a ticket — your laptop should not be in active use until disk encryption finishes.', '''4'':2 ''activ'':38 ''check'':4 ''confirm'':11,21 ''devic'':19 ''disk'':41 ''either'':26 ''encrypt'':3,20,42 ''file'':29 ''filevault'':10 ''finish'':43 ''laptop'':33 ''mac'':5 ''privaci'':8,17 ''secur'':9,18 ''set'':7,16 ''step'':1 ''system'':6 ''ticket'':31 ''use'':39 ''window'':15');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (34, 12, 6, '## Step 5: Connect to VPN

Open **GlobalProtect** from the menu bar / system tray:

1. Portal: **vpn.slice.systems**
2. Username: your @slice.com email
3. Password: your OneLogin password
4. MFA: the 6-digit code from OneLogin Protect

You should see "Connected" within 10 seconds.', '''1'':14 ''10'':41 ''2'':17 ''3'':22 ''4'':27 ''5'':2 ''6'':30 ''bar'':11 ''code'':32 ''connect'':3,39 ''digit'':31 ''email'':21 ''globalprotect'':7 ''menu'':10 ''mfa'':28 ''onelogin'':25,34 ''open'':6 ''password'':23,26 ''portal'':15 ''protect'':35 ''second'':42 ''see'':38 ''slice.com'':20 ''step'':1 ''system'':12 ''tray'':13 ''usernam'':18 ''vpn'':5 ''vpn.slice.systems'':16 ''within'':40');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (35, 12, 7, '## Step 6: First-day checklist

- Sign in to Google Workspace at https://mail.google.com (federates through OneLogin)
- Sign in to Slack and join **#it-help**, **#general**, and your team''s channel
- Confirm GitHub access if you''re an engineer
- Verify your manager shows up in Workday
- Note your laptop''s asset tag (sticker on the bottom)', '''6'':2 ''access'':34 ''asset'':51 ''bottom'':56 ''channel'':31 ''checklist'':6 ''confirm'':32 ''day'':5 ''engin'':39 ''feder'':14 ''first'':4 ''first-day'':3 ''general'':26 ''github'':33 ''googl'':10 ''help'':25 ''it-help'':23 ''join'':22 ''laptop'':49 ''mail.google.com'':13 ''manag'':42 ''note'':47 ''onelogin'':16 ''re'':37 ''show'':43 ''sign'':7,17 ''slack'':20 ''step'':1 ''sticker'':53 ''tag'':52 ''team'':29 ''verifi'':40 ''workday'':46 ''workspac'':11');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (36, 12, 8, '## If something doesn''t work

File a ticket with **End-User Compute**. Day-one issues are P1 — typical response is under an hour during business hours.', '''busi'':27 ''comput'':13 ''day'':15 ''day-on'':14 ''doesn'':3 ''end'':11 ''end-us'':10 ''file'':6 ''hour'':25,28 ''issu'':17 ''one'':16 ''p1'':19 ''respons'':21 ''someth'':2 ''ticket'':8 ''typic'':20 ''user'':12 ''work'':5');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (37, 13, 0, '# Connect to GlobalProtect VPN

Slice uses **Palo Alto GlobalProtect** for VPN. The portal is **vpn.slice.systems** and your credentials are the same ones you use for OneLogin.', '''alto'':8 ''connect'':1 ''credenti'':18 ''globalprotect'':3,9 ''one'':22 ''onelogin'':26 ''palo'':7 ''portal'':13 ''slice'':5 ''use'':6,24 ''vpn'':4,11 ''vpn.slice.systems'':15');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (38, 13, 1, '## First-time setup

GlobalProtect comes pre-installed on every Slice laptop via the device baseline. If you don''t see it, file a ticket and we''ll push it remotely.

1. Open **GlobalProtect** from your menu bar (Mac) or system tray (Windows)
2. Portal address: **vpn.slice.systems**
3. Click **Connect**
4. Enter your credentials:
   - **Username**: your @slice.com email
   - **Password**: your OneLogin password
5. **MFA prompt**: open OneLogin Protect on your phone and either approve the push, or enter the 6-digit code shown in the app
6. You should see **Connected** within 10 seconds', '''1'':33 ''10'':94 ''2'':45 ''3'':49 ''4'':52 ''5'':64 ''6'':81,88 ''address'':47 ''app'':87 ''approv'':75 ''bar'':39 ''baselin'':17 ''click'':50 ''code'':83 ''come'':6 ''connect'':51,92 ''credenti'':55 ''devic'':16 ''digit'':82 ''either'':74 ''email'':59 ''enter'':53,79 ''everi'':11 ''file'':24 ''first'':2 ''first-tim'':1 ''globalprotect'':5,35 ''instal'':9 ''laptop'':13 ''ll'':29 ''mac'':40 ''menu'':38 ''mfa'':65 ''onelogin'':62,68 ''open'':34,67 ''password'':60,63 ''phone'':72 ''portal'':46 ''pre'':8 ''pre-instal'':7 ''prompt'':66 ''protect'':69 ''push'':30,77 ''remot'':32 ''second'':95 ''see'':22,91 ''setup'':4 ''shown'':84 ''slice'':12 ''slice.com'':58 ''system'':42 ''ticket'':26 ''time'':3 ''tray'':43 ''usernam'':56 ''via'':14 ''vpn.slice.systems'':48 ''window'':44 ''within'':93');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (39, 13, 2, '## Day-to-day

- Open GlobalProtect → click **Connect**. The app remembers your portal and credentials, so most reconnects only need the MFA step.
- The VPN auto-disconnects after 12 hours and on sleep — you''ll need to re-auth in the morning.', '''12'':30 ''app'':10 ''auth'':41 ''auto'':27 ''auto-disconnect'':26 ''click'':7 ''connect'':8 ''credenti'':15 ''day'':2,4 ''day-to-day'':1 ''disconnect'':28 ''globalprotect'':6 ''hour'':31 ''ll'':36 ''mfa'':22 ''morn'':44 ''need'':20,37 ''open'':5 ''portal'':13 ''re'':40 ''re-auth'':39 ''reconnect'':18 ''rememb'':11 ''sleep'':34 ''step'':23 ''vpn'':25');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (42, 13, 5, '### "Portal unreachable"

- Check your internet (try loading google.com)
- Confirm the portal is exactly **vpn.slice.systems** (no `https://`, no trailing slash)
- If you''re on a hotel / coffee-shop captive portal, log into the captive portal first, then reconnect', '''captiv'':28,33 ''check'':3 ''coffe'':26 ''coffee-shop'':25 ''confirm'':9 ''exact'':13 ''first'':35 ''google.com'':8 ''hotel'':24 ''internet'':5 ''load'':7 ''log'':30 ''portal'':1,11,29,34 ''re'':21 ''reconnect'':37 ''shop'':27 ''slash'':18 ''trail'':17 ''tri'':6 ''unreach'':2 ''vpn.slice.systems'':14');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (43, 13, 6, '### MFA push not arriving

- Make sure OneLogin Protect is installed on your phone and you have signal
- Use the manual 6-digit code from the app instead of waiting for the push
- If the code is rejected, your phone clock might be off — open OneLogin Protect → Settings → resync time', '''6'':21 ''app'':26 ''arriv'':4 ''clock'':40 ''code'':23,35 ''digit'':22 ''instal'':10 ''instead'':27 ''make'':5 ''manual'':20 ''mfa'':1 ''might'':41 ''onelogin'':7,45 ''open'':44 ''phone'':13,39 ''protect'':8,46 ''push'':2,32 ''reject'':37 ''resync'':48 ''set'':47 ''signal'':17 ''sure'':6 ''time'':49 ''use'':18 ''wait'':29');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (44, 13, 7, '### Still stuck

File a ticket with the **Network Operations** team. Include the exact error message — GlobalProtect''s error text usually tells us the cause within 5 seconds.', '''5'':26 ''caus'':24 ''error'':14,18 ''exact'':13 ''file'':3 ''globalprotect'':16 ''includ'':11 ''messag'':15 ''network'':8 ''oper'':9 ''second'':27 ''still'':1 ''stuck'':2 ''team'':10 ''tell'':21 ''text'':19 ''ticket'':5 ''us'':22 ''usual'':20 ''within'':25');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (45, 14, 0, '# Request app access

Need a new app, group, repo, or environment? Here''s how it gets approved and how long it takes.', '''access'':3 ''app'':2,7 ''approv'':17 ''environ'':11 ''get'':16 ''group'':8 ''long'':20 ''need'':4 ''new'':6 ''repo'':9 ''request'':1 ''take'':22');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (46, 14, 1, '## How to file the request

1. Go to the **Access Requests** section of the IT Hub
2. Pick the app or group you need from the catalog
3. Write a one-line **business justification** — don''t skip this, it''s what your manager and the app owner read
4. Submit', '''1'':6 ''2'':17 ''3'':28 ''4'':50 ''access'':10 ''app'':20,47 ''busi'':34 ''catalog'':27 ''file'':3 ''go'':7 ''group'':22 ''hub'':16 ''justif'':35 ''line'':33 ''manag'':44 ''need'':24 ''one'':32 ''one-lin'':31 ''owner'':48 ''pick'':18 ''read'':49 ''request'':5,11 ''section'':12 ''skip'':38 ''submit'':51 ''write'':29');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (47, 14, 2, '## Approval flow

For most apps, the request goes:

1. Your **manager** approves (or rejects)
2. The **app owner** approves (or rejects)
3. **Identity & Access** provisions you in OneLogin

You''ll get a Slack DM and an email at each step.', '''1'':9 ''2'':15 ''3'':22 ''access'':24 ''app'':5,17 ''approv'':1,12,19 ''dm'':34 ''email'':37 ''flow'':2 ''get'':31 ''goe'':8 ''ident'':23 ''ll'':30 ''manag'':11 ''onelogin'':28 ''owner'':18 ''provis'':25 ''reject'':14,21 ''request'':7 ''slack'':33 ''step'':40');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (48, 14, 3, '## SLA

| App tier | Typical time |
|---|---|
| Standard apps (most things) | 1 business day |
| Privileged / admin access | 2–3 business days (Security review) |
| External vendor accounts | 3–5 business days |', '''1'':10 ''2'':16 ''3'':17,25 ''5'':26 ''access'':15 ''account'':24 ''admin'':14 ''app'':2,7 ''busi'':11,18,27 ''day'':12,19,28 ''extern'':22 ''privileg'':13 ''review'':21 ''secur'':20 ''sla'':1 ''standard'':6 ''thing'':9 ''tier'':3 ''time'':5 ''typic'':4 ''vendor'':23');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (49, 14, 4, '## If it''s urgent

Mark the request **Urgent** with a one-line "why" — your manager and the app owner get a higher-priority Slack ping. Use this for genuine blockers (deploy gate, P1 incident response), not impatience.', '''app'':19 ''blocker'':32 ''deploy'':33 ''gate'':34 ''genuin'':31 ''get'':21 ''higher'':24 ''higher-prior'':23 ''impati'':39 ''incid'':36 ''line'':13 ''manag'':16 ''mark'':5 ''one'':12 ''one-lin'':11 ''owner'':20 ''p1'':35 ''ping'':27 ''prioriti'':25 ''request'':7 ''respons'':37 ''slack'':26 ''urgent'':4,8 ''use'':28');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (50, 14, 5, '## After approval

Most apps federate through OneLogin, so once you''re approved you''ll see the app appear on your OneLogin dashboard within ~5 minutes. If it doesn''t, sign out and back into OneLogin to refresh the directory.', '''5'':24 ''app'':4,17 ''appear'':18 ''approv'':2,12 ''back'':33 ''dashboard'':22 ''directori'':39 ''doesn'':28 ''feder'':5 ''ll'':14 ''minut'':25 ''onelogin'':7,21,35 ''re'':11 ''refresh'':37 ''see'':15 ''sign'':30 ''within'':23');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (51, 14, 6, '## Common pitfalls

- **Wrong group**: ask the app owner before submitting if you''re unsure which group level you need (Reader vs Contributor vs Admin). Re-requesting wastes a day.
- **No justification**: requests with empty justification get auto-rejected after 24 hours.
- **Manager out**: if your manager is on PTO, escalate to their delegate (set in Workday) rather than waiting.', '''24'':42 ''admin'':24 ''app'':7 ''ask'':5 ''auto'':39 ''auto-reject'':38 ''common'':1 ''contributor'':22 ''day'':30 ''deleg'':55 ''empti'':35 ''escal'':52 ''get'':37 ''group'':4,16 ''hour'':43 ''justif'':32,36 ''level'':17 ''manag'':44,48 ''need'':19 ''owner'':8 ''pitfal'':2 ''pto'':51 ''rather'':59 ''re'':13,26 ''re-request'':25 ''reader'':20 ''reject'':40 ''request'':27,33 ''set'':56 ''submit'':10 ''unsur'':14 ''vs'':21,23 ''wait'':61 ''wast'':28 ''workday'':58 ''wrong'':3');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (52, 15, 0, '# Email delivery issue

Slice runs on **Google Workspace** — Gmail, Calendar, Drive, Meet. Most "email isn''t working" issues fall into one of four categories. Find yours below.', '''calendar'':10 ''categori'':24 ''deliveri'':2 ''drive'':11 ''email'':1,14 ''fall'':19 ''find'':25 ''four'':23 ''gmail'':9 ''googl'':7 ''isn'':15 ''issu'':3,18 ''meet'':12 ''one'':21 ''run'':5 ''slice'':4 ''work'':17 ''workspac'':8');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (53, 15, 1, '## I''m not receiving an expected email

1. Check **Spam** and **All Mail** in Gmail (especially for password resets and external invitations)
2. Search by sender domain: type `from:example.com` in the search bar
3. Check **Filters and Blocked Addresses** in Gmail Settings — old filters sometimes route mail away
4. Ask the sender if they got a bounce-back

If the sender is getting bounces, send IT the bounce text — it usually tells us exactly what''s wrong (often a misspelled address or a sender on our blocklist).', '''1'':8 ''2'':23 ''3'':35 ''4'':50 ''address'':40,83 ''ask'':51 ''away'':49 ''back'':60 ''bar'':34 ''block'':39 ''blocklist'':89 ''bounc'':59,66,70 ''bounce-back'':58 ''check'':9,36 ''domain'':27 ''email'':7 ''especi'':16 ''exact'':76 ''example.com'':30 ''expect'':6 ''extern'':21 ''filter'':37,45 ''get'':65 ''gmail'':15,42 ''got'':56 ''invit'':22 ''m'':2 ''mail'':13,48 ''misspel'':82 ''often'':80 ''old'':44 ''password'':18 ''receiv'':4 ''reset'':19 ''rout'':47 ''search'':24,33 ''send'':67 ''sender'':26,53,63,86 ''set'':43 ''sometim'':46 ''spam'':10 ''tell'':74 ''text'':71 ''type'':28 ''us'':75 ''usual'':73 ''wrong'':79');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (65, 17, 2, '## Step 2: Power-cycle the monitor

Turn the monitor off, unplug its power cord, wait 30 seconds, plug it back in, turn on.', '''2'':2 ''30'':17 ''back'':21 ''cord'':15 ''cycl'':5 ''monitor'':7,10 ''plug'':19 ''power'':4,14 ''power-cycl'':3 ''second'':18 ''step'':1 ''turn'':8,23 ''unplug'':12 ''wait'':16');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (107, 23, 3, '### Best: Phishing add-on in Gmail

1. Open the email
2. Click the **🛡️ Report Phishing** add-on icon in the toolbar (right side of Gmail)
3. Confirm

This forwards to Security AND removes the message from your inbox. One click.', '''1'':8 ''2'':12 ''3'':28 ''add'':4,18 ''add-on'':3,17 ''best'':1 ''click'':13,42 ''confirm'':29 ''email'':11 ''forward'':31 ''gmail'':7,27 ''icon'':20 ''inbox'':40 ''messag'':37 ''one'':41 ''open'':9 ''phish'':2,16 ''remov'':35 ''report'':15 ''right'':24 ''secur'':33 ''side'':25 ''toolbar'':23');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (54, 15, 2, '## My email isn''t being delivered

1. Check the **Sent** folder — did it actually go?
2. Look for a Mailer-Daemon bounce in your inbox
3. If you''re sending to an external domain, the recipient''s spam filter might be holding it

If you''re sending a calendar invite that''s not showing up, Google has a known issue with delayed external invites (~10 min lag). Slack the recipient if it''s time-sensitive.', '''1'':7 ''10'':66 ''2'':16 ''3'':27 ''actual'':14 ''bounc'':23 ''calendar'':50 ''check'':8 ''daemon'':22 ''delay'':63 ''deliv'':6 ''domain'':35 ''email'':2 ''extern'':34,64 ''filter'':40 ''folder'':11 ''go'':15 ''googl'':57 ''hold'':43 ''inbox'':26 ''invit'':51,65 ''isn'':3 ''issu'':61 ''known'':60 ''lag'':68 ''look'':17 ''mailer'':21 ''mailer-daemon'':20 ''might'':41 ''min'':67 ''re'':30,47 ''recipi'':37,71 ''send'':31,48 ''sensit'':77 ''sent'':10 ''show'':55 ''slack'':69 ''spam'':39 ''time'':76 ''time-sensit'':75');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (55, 15, 3, '## I''m getting too much spam

1. Open the spam message → click **Report spam** (don''t just delete — reporting trains Gmail''s filters)
2. Block the sender: open the message → kebab menu (⋮) → **Block <sender>**
3. For repeated phishing, forward to **phishing@slice.com**', '''1'':7 ''2'':24 ''3'':34 ''block'':25,33 ''click'':12 ''delet'':18 ''filter'':23 ''forward'':38 ''get'':3 ''gmail'':21 ''kebab'':31 ''m'':2 ''menu'':32 ''messag'':11,30 ''much'':5 ''open'':8,28 ''phish'':37 ''phishing@slice.com'':40 ''repeat'':36 ''report'':13,19 ''sender'':27 ''spam'':6,10,14 ''train'':20');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (56, 15, 4, '## Suspected phishing

**Don''t click links or open attachments.** Use the **Report Phishing** add-on in Gmail''s toolbar, or forward the message to **phishing@slice.com**. Security reviews every report within 4 hours.', '''4'':32 ''add'':15 ''add-on'':14 ''attach'':9 ''click'':5 ''everi'':29 ''forward'':22 ''gmail'':18 ''hour'':33 ''link'':6 ''messag'':24 ''open'':8 ''phish'':2,13 ''phishing@slice.com'':26 ''report'':12,30 ''review'':28 ''secur'':27 ''suspect'':1 ''toolbar'':20 ''use'':10 ''within'':31');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (57, 15, 5, '## Shared mailbox isn''t working

If you''ve been added to a shared mailbox (e.g. **support@slice.com**) and don''t see it:

1. Sign out of Gmail and back in to refresh delegations
2. If it still doesn''t appear, file a ticket — the share usually needs to be re-issued by Identity & Access', '''1'':22 ''2'':33 ''access'':54 ''ad'':10 ''appear'':39 ''back'':28 ''deleg'':32 ''doesn'':37 ''e.g'':15 ''file'':40 ''gmail'':26 ''ident'':53 ''isn'':3 ''issu'':51 ''mailbox'':2,14 ''need'':46 ''re'':50 ''re-issu'':49 ''refresh'':31 ''see'':20 ''share'':1,13,44 ''sign'':23 ''still'':36 ''support@slice.com'':16 ''ticket'':42 ''usual'':45 ''ve'':8 ''work'':5');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (58, 15, 6, '## File a ticket

If none of the above fits, file with the **Collaboration** team. SLA is 4 hours during business hours.', '''4'':17 ''busi'':20 ''collabor'':13 ''file'':1,10 ''fit'':9 ''hour'':18,21 ''none'':5 ''sla'':15 ''team'':14 ''ticket'':3');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (59, 16, 0, '# Re-enroll OneLogin Protect on a new phone

When you switch phones, you have to re-pair OneLogin Protect (our MFA app) to keep getting prompts. The fastest path depends on whether you still have your old phone working.', '''app'':24 ''depend'':32 ''enrol'':3 ''fastest'':30 ''get'':27 ''keep'':26 ''mfa'':23 ''new'':8 ''old'':39 ''onelogin'':4,20 ''pair'':19 ''path'':31 ''phone'':9,13,40 ''prompt'':28 ''protect'':5,21 ''re'':2,18 ''re-enrol'':1 ''re-pair'':17 ''still'':36 ''switch'':12 ''whether'':34 ''work'':41');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (60, 16, 1, '## With both phones available

1. On your **new phone**, install **OneLogin Protect** from the App Store / Play Store
2. Sign in to https://slice.onelogin.com on your laptop
3. Approve the MFA prompt **on your old phone** one last time
4. Click your name (top-right) → **Profile** → **Security Factors** → **Add Factor** → OneLogin Protect
5. Scan the QR code with the OneLogin Protect app on your **new phone**
6. Approve the test push to confirm it works
7. Remove the old phone from Security Factors (click **Remove** next to its entry)', '''1'':5 ''2'':19 ''3'':27 ''4'':39 ''5'':53 ''6'':67 ''7'':76 ''add'':49 ''app'':15,62 ''approv'':28,68 ''avail'':4 ''click'':40,84 ''code'':57 ''confirm'':73 ''entri'':89 ''factor'':48,50,83 ''instal'':10 ''laptop'':26 ''last'':37 ''mfa'':30 ''name'':42 ''new'':8,65 ''next'':86 ''old'':34,79 ''one'':36 ''onelogin'':11,51,60 ''phone'':3,9,35,66,80 ''play'':17 ''profil'':46 ''prompt'':31 ''protect'':12,52,61 ''push'':71 ''qr'':56 ''remov'':77,85 ''right'':45 ''scan'':54 ''secur'':47,82 ''sign'':20 ''slice.onelogin.com'':23 ''store'':16,18 ''test'':70 ''time'':38 ''top'':44 ''top-right'':43 ''work'':75');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (61, 16, 2, '## If you no longer have your old phone

You''re locked out of MFA — this needs IT.

1. File a ticket with the **Identity & Access** team
2. Mark it **Urgent** if it''s blocking your work day
3. IT will verify your identity over a video call, then issue a one-time bypass code so you can log in and re-enroll on the new phone

Typical turnaround: 30 minutes during business hours, ~2 hours after-hours.', '''1'':18 ''2'':27,76 ''3'':38 ''30'':71 ''access'':25 ''after-hour'':78 ''block'':34 ''busi'':74 ''bypass'':54 ''call'':47 ''code'':55 ''day'':37 ''enrol'':64 ''file'':19 ''hour'':75,77,80 ''ident'':24,43 ''issu'':49 ''lock'':11 ''log'':59 ''longer'':4 ''mark'':28 ''mfa'':14 ''minut'':72 ''need'':16 ''new'':67 ''old'':7 ''one'':52 ''one-tim'':51 ''phone'':8,68 ''re'':10,63 ''re-enrol'':62 ''team'':26 ''ticket'':21 ''time'':53 ''turnaround'':70 ''typic'':69 ''urgent'':30 ''verifi'':41 ''video'':46 ''work'':36');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (62, 16, 3, '## Tip

The next time you log in, set up a backup factor (SMS or a hardware security key) — that way a future phone swap doesn''t require IT.', '''backup'':11 ''doesn'':25 ''factor'':12 ''futur'':22 ''hardwar'':16 ''key'':18 ''log'':6 ''next'':3 ''phone'':23 ''requir'':27 ''secur'':17 ''set'':8 ''sms'':13 ''swap'':24 ''time'':4 ''tip'':1 ''way'':20');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (63, 17, 0, '# External monitor not detected

You plugged in a monitor and your laptop is ignoring it. Try in this order — each step is under 30 seconds.', '''30'':24 ''detect'':4 ''extern'':1 ''ignor'':14 ''laptop'':12 ''monitor'':2,9 ''order'':19 ''plug'':6 ''second'':25 ''step'':21 ''tri'':16');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (64, 17, 1, '## Step 1: Re-seat the cable

Unplug from BOTH ends (laptop and monitor), wait 10 seconds, plug back in firmly. USB-C and HDMI both have a "click" feel — make sure you feel it.', '''1'':2 ''10'':16 ''back'':19 ''c'':24 ''cabl'':7 ''click'':30 ''end'':11 ''feel'':31,35 ''firm'':21 ''hdmi'':26 ''laptop'':12 ''make'':32 ''monitor'':14 ''plug'':18 ''re'':4 ''re-seat'':3 ''seat'':5 ''second'':17 ''step'':1 ''sure'':33 ''unplug'':8 ''usb'':23 ''usb-c'':22 ''wait'':15');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (66, 17, 3, '## Step 3: Force display detection', '''3'':2 ''detect'':5 ''display'':4 ''forc'':3 ''step'':1');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (67, 17, 4, '### Mac

Hold **Option**, then click Apple menu → System Settings → Displays. A **Detect Displays** button appears.', '''appear'':15 ''appl'':6 ''button'':14 ''click'':5 ''detect'':12 ''display'':10,13 ''hold'':2 ''mac'':1 ''menu'':7 ''option'':3 ''set'':9 ''system'':8');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (68, 17, 5, '### Windows

Right-click the desktop → **Display settings** → scroll to "Multiple displays" → click **Detect**.', '''click'':4,13 ''desktop'':6 ''detect'':14 ''display'':7,12 ''multipl'':11 ''right'':3 ''right-click'':2 ''scroll'':9 ''set'':8 ''window'':1');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (69, 17, 6, '## Step 4: Check the cable / dock

Not all USB-C cables are equal:

- Some cheap USB-C cables only carry data, not video
- Try a different cable, or a known-good port on the dock
- 4K monitors and Studio Displays need a **Thunderbolt-rated** cable, not just plain USB-C', '''4'':2 ''4k'':39 ''c'':11,19,55 ''cabl'':5,12,20,29,49 ''carri'':22 ''cheap'':16 ''check'':3 ''data'':23 ''differ'':28 ''display'':43 ''dock'':6,38 ''equal'':14 ''good'':34 ''known'':33 ''known-good'':32 ''monitor'':40 ''need'':44 ''plain'':52 ''port'':35 ''rate'':48 ''step'':1 ''studio'':42 ''thunderbolt'':47 ''thunderbolt-r'':46 ''tri'':26 ''usb'':10,18,54 ''usb-c'':9,17,53 ''video'':25');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (70, 17, 7, '## Step 5: Restart the laptop

Plug everything in first, then restart. Sometimes the system reads the cable on boot only.', '''5'':2 ''boot'':19 ''cabl'':17 ''everyth'':7 ''first'':9 ''laptop'':5 ''plug'':6 ''read'':15 ''restart'':3,11 ''sometim'':12 ''step'':1 ''system'':14');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (71, 17, 8, '## Still nothing

Test the monitor with a coworker''s laptop. If it works there, it''s your laptop''s port or graphics. File a ticket with **End-User Compute** — include the monitor model and cable type.', '''cabl'':36 ''comput'':30 ''cowork'':8 ''end'':28 ''end-us'':27 ''file'':23 ''graphic'':22 ''includ'':31 ''laptop'':10,18 ''model'':34 ''monitor'':5,33 ''noth'':2 ''port'':20 ''still'':1 ''test'':3 ''ticket'':25 ''type'':37 ''user'':29 ''work'':13');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (72, 18, 0, '# Microphone or camera not working in Zoom or Meet

Mid-meeting and your mic or camera is grayed out? Almost always a permission issue or wrong input source.', '''almost'':21 ''alway'':22 ''camera'':3,17 ''gray'':19 ''input'':28 ''issu'':25 ''meet'':9,12 ''mic'':15 ''microphon'':1 ''mid'':11 ''mid-meet'':10 ''permiss'':24 ''sourc'':29 ''work'':5 ''wrong'':27 ''zoom'':7');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (73, 18, 1, '## Quick fix: pick the right input

- **Zoom**: gear icon → **Audio** / **Video** → confirm the right device is selected (built-in vs USB headset)
- **Google Meet**: 3-dot menu → **Settings** → check Audio + Video tabs

If the device shows up but the mic indicator doesn''t move when you talk, the source is selected but muted at the OS level.', '''3'':26 ''audio'':10,31 ''built'':19 ''built-in'':18 ''check'':30 ''confirm'':12 ''devic'':15,36 ''doesn'':43 ''dot'':27 ''fix'':2 ''gear'':8 ''googl'':24 ''headset'':23 ''icon'':9 ''indic'':42 ''input'':6 ''level'':58 ''meet'':25 ''menu'':28 ''mic'':41 ''move'':45 ''mute'':54 ''os'':57 ''pick'':3 ''quick'':1 ''right'':5,14 ''select'':17,52 ''set'':29 ''show'':37 ''sourc'':50 ''tab'':33 ''talk'':48 ''usb'':22 ''video'':11,32 ''vs'':21 ''zoom'':7');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (74, 18, 2, '## OS-level permissions (most common cause)', '''caus'':7 ''common'':6 ''level'':3 ''os'':2 ''os-level'':1 ''permiss'':4');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (75, 18, 3, '### Mac

System Settings → **Privacy & Security** → **Microphone** / **Camera** → toggle ON for Zoom / Chrome / your browser.

After toggling, **fully quit** the app (Cmd+Q) and reopen. Mac caches permissions until restart.', '''app'':20 ''browser'':14 ''cach'':26 ''camera'':7 ''chrome'':12 ''cmd'':21 ''fulli'':17 ''mac'':1,25 ''microphon'':6 ''permiss'':27 ''privaci'':4 ''q'':22 ''quit'':18 ''reopen'':24 ''restart'':29 ''secur'':5 ''set'':3 ''system'':2 ''toggl'':8,16 ''zoom'':11');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (76, 18, 4, '### Windows

Settings → **Privacy & Security** → **Microphone** / **Camera** → "Let apps access" → ON. Then scroll down to Zoom / Chrome and confirm those are also ON.', '''access'':9 ''also'':21 ''app'':8 ''camera'':6 ''chrome'':16 ''confirm'':18 ''let'':7 ''microphon'':5 ''privaci'':3 ''scroll'':12 ''secur'':4 ''set'':2 ''window'':1 ''zoom'':15');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (77, 18, 5, '## Browser-specific (Meet, Slack huddles)

Click the lock icon left of the URL → **Site settings** → ensure Camera and Mic are set to **Allow** for the meeting domain.', '''allow'':24 ''browser'':2 ''browser-specif'':1 ''camera'':18 ''click'':7 ''domain'':28 ''ensur'':17 ''huddl'':6 ''icon'':10 ''left'':11 ''lock'':9 ''meet'':4,27 ''mic'':20 ''set'':16,22 ''site'':15 ''slack'':5 ''specif'':3 ''url'':14');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (78, 18, 6, '## Bluetooth gotcha

Bluetooth headsets often connect but use a "hands-free" profile that disables the mic. To fix:

- Mac: Sound settings → choose the headset for **both** Output AND Input (not just Output)
- If still no luck, switch to wired headphones for important meetings', '''bluetooth'':1,3 ''choos'':23 ''connect'':6 ''disabl'':15 ''fix'':19 ''free'':12 ''gotcha'':2 ''hand'':11 ''hands-fre'':10 ''headphon'':41 ''headset'':4,25 ''import'':43 ''input'':30 ''luck'':37 ''mac'':20 ''meet'':44 ''mic'':17 ''often'':5 ''output'':28,33 ''profil'':13 ''set'':22 ''sound'':21 ''still'':35 ''switch'':38 ''use'':8 ''wire'':40');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (79, 18, 7, '## If the hardware itself is the problem

Plug a USB headset/mic in. If that works but the built-in doesn''t, the built-in mic / camera is hardware-failed — file a ticket with **End-User Compute**.', '''built'':19,25 ''built-in'':18,24 ''camera'':28 ''comput'':40 ''doesn'':21 ''end'':38 ''end-us'':37 ''fail'':32 ''file'':33 ''hardwar'':3,31 ''hardware-fail'':30 ''headset/mic'':11 ''mic'':27 ''plug'':8 ''problem'':7 ''ticket'':35 ''usb'':10 ''user'':39 ''work'':15');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (80, 18, 8, '## Don''t trust the in-app test

The "Test mic" feature inside Zoom is sometimes lying. Best test: ask someone in the meeting to confirm they hear you.', '''app'':7 ''ask'':20 ''best'':18 ''confirm'':26 ''featur'':12 ''hear'':28 ''in-app'':5 ''insid'':13 ''lie'':17 ''meet'':24 ''mic'':11 ''someon'':21 ''sometim'':16 ''test'':8,10,19 ''trust'':3 ''zoom'':14');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (81, 19, 0, '# Bluetooth headphones won''t connect

Pairing issues are 99% one of three things: the headphones aren''t actually in pairing mode, they''re already paired to another device, or there''s a stale pairing on your laptop.', '''99'':9 ''actual'':18 ''alreadi'':24 ''anoth'':27 ''aren'':16 ''bluetooth'':1 ''connect'':5 ''devic'':28 ''headphon'':2,15 ''issu'':7 ''laptop'':37 ''mode'':21 ''one'':10 ''pair'':6,20,25,34 ''re'':23 ''stale'':33 ''thing'':13 ''three'':12 ''won'':3');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (108, 23, 4, '### Backup: Forward to phishing@slice.com

If the add-on is missing:

1. Open the message
2. 3-dot menu → **Forward as attachment**
3. Send to **phishing@slice.com**
4. Delete the original

Don''t forward inline — Security needs the original headers, which only "Forward as attachment" preserves.', '''1'':12 ''2'':16 ''3'':17,23 ''4'':27 ''add'':8 ''add-on'':7 ''attach'':22,44 ''backup'':1 ''delet'':28 ''dot'':18 ''forward'':2,20,33,42 ''header'':39 ''inlin'':34 ''menu'':19 ''messag'':15 ''miss'':11 ''need'':36 ''open'':13 ''origin'':30,38 ''phishing@slice.com'':4,26 ''preserv'':45 ''secur'':35 ''send'':24');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (82, 19, 1, '## Step 1: Force pairing mode

Most headphones need you to hold the power button for **5–10 seconds** until the LED flashes (usually fast, often blue+red alternating). Just turning them on isn''t enough.

Common patterns:

- **AirPods**: open the case, hold the back button until the LED flashes
- **Sony WH series**: hold power for ~7 seconds
- **Bose**: hold power past "ON" until you hear "ready to connect"
- **Sennheiser**: hold the multi-function button for 4 seconds', '''1'':2 ''10'':17 ''4'':77 ''5'':16 ''7'':56 ''airpod'':38 ''altern'':28 ''back'':44 ''blue'':26 ''bose'':58 ''button'':14,45,75 ''case'':41 ''common'':36 ''connect'':68 ''enough'':35 ''fast'':24 ''flash'':22,49 ''forc'':3 ''function'':74 ''headphon'':7 ''hear'':65 ''hold'':11,42,53,59,70 ''isn'':33 ''led'':21,48 ''mode'':5 ''multi'':73 ''multi-funct'':72 ''need'':8 ''often'':25 ''open'':39 ''pair'':4 ''past'':61 ''pattern'':37 ''power'':13,54,60 ''readi'':66 ''red'':27 ''second'':18,57,78 ''sennheis'':69 ''seri'':52 ''soni'':50 ''step'':1 ''turn'':30 ''usual'':23 ''wh'':51');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (83, 19, 2, '## Step 2: Check they''re not already paired elsewhere

Bluetooth headphones can only talk to one device at a time. If they auto-connect to your phone first, your laptop won''t see them.

- Disconnect from your phone (Bluetooth → tap → "Disconnect")
- Or turn off Bluetooth on your phone temporarily', '''2'':2 ''alreadi'':7 ''auto'':24 ''auto-connect'':23 ''bluetooth'':10,40,46 ''check'':3 ''connect'':25 ''devic'':17 ''disconnect'':36,42 ''elsewher'':9 ''first'':29 ''headphon'':11 ''laptop'':31 ''one'':16 ''pair'':8 ''phone'':28,39,49 ''re'':5 ''see'':34 ''step'':1 ''talk'':14 ''tap'':41 ''temporarili'':50 ''time'':20 ''turn'':44 ''won'':32');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (84, 19, 3, '## Step 3: Remove a stale pairing on your laptop

If the laptop USED to pair with these headphones but now ignores them, the cached pairing is corrupt.

- **Mac**: System Settings → Bluetooth → click the **i** next to the device → **Forget Device**. Then pair fresh.
- **Windows**: Settings → Devices → Bluetooth → click the device → **Remove device**. Then pair fresh.', '''3'':2 ''bluetooth'':31,47 ''cach'':24 ''click'':32,48 ''corrupt'':27 ''devic'':38,40,46,50,52 ''forget'':39 ''fresh'':43,55 ''headphon'':18 ''ignor'':21 ''laptop'':9,12 ''mac'':28 ''next'':35 ''pair'':6,15,25,42,54 ''remov'':3,51 ''set'':30,45 ''stale'':5 ''step'':1 ''system'':29 ''use'':13 ''window'':44');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (85, 19, 4, '## Step 4: Reset the headphones

Most headphones have a factory-reset combo (usually power + volume buttons held together). Check the manual or the vendor''s website — this clears all pairings on the headphones themselves.', '''4'':2 ''button'':17 ''check'':20 ''clear'':29 ''combo'':13 ''factori'':11 ''factory-reset'':10 ''headphon'':5,7,34 ''held'':18 ''manual'':22 ''pair'':31 ''power'':15 ''reset'':3,12 ''step'':1 ''togeth'':19 ''usual'':14 ''vendor'':25 ''volum'':16 ''websit'':27');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (86, 19, 5, '## Step 5: Restart Bluetooth

- **Mac**: Option-click the Bluetooth icon → **Reset the Bluetooth module**
- **Windows**: Restart the PC. Faster than digging through services.', '''5'':2 ''bluetooth'':4,10,14 ''click'':8 ''dig'':22 ''faster'':20 ''icon'':11 ''mac'':5 ''modul'':15 ''option'':7 ''option-click'':6 ''pc'':19 ''reset'':12 ''restart'':3,17 ''servic'':24 ''step'':1 ''window'':16');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (87, 19, 6, '## Still nothing

File a ticket with **End-User Compute** with the headphone model and the steps you''ve tried.', '''comput'':10 ''end'':8 ''end-us'':7 ''file'':3 ''headphon'':13 ''model'':14 ''noth'':2 ''step'':17 ''still'':1 ''ticket'':5 ''tri'':20 ''user'':9 ''ve'':19');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (88, 20, 0, '# Browser shows "Your connection isn''t private"

Almost always one of three things: an unsigned-into captive Wi-Fi, a wrong system clock, or a missing corporate SSL inspection cert.', '''almost'':8 ''alway'':9 ''browser'':1 ''captiv'':18 ''cert'':32 ''clock'':25 ''connect'':4 ''corpor'':29 ''fi'':21 ''inspect'':31 ''isn'':5 ''miss'':28 ''one'':10 ''privat'':7 ''show'':2 ''ssl'':30 ''system'':24 ''thing'':13 ''three'':12 ''unsign'':16 ''unsigned-into'':15 ''wi'':20 ''wi-fi'':19 ''wrong'':23');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (89, 20, 1, '## First: is it everywhere or just one site?

- **Every site** (google.com, slack.com, your email) → it''s your laptop or network
- **One site** → it''s that site''s certificate', '''certif'':28 ''email'':14 ''everi'':9 ''everywher'':4 ''first'':1 ''google.com'':11 ''laptop'':18 ''network'':20 ''one'':7,21 ''site'':8,10,22,26 ''slack.com'':12');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (90, 20, 2, '## Cause 1: Captive portal not signed in

If you''re at a hotel, coffee shop, or airport, you have to sign in to the captive portal first. To trigger it:

1. Open a new tab and go to **http://example.com** (HTTP, not HTTPS)
2. The captive portal page should appear
3. Sign in / accept the terms
4. Now https sites should work', '''1'':2,31 ''2'':43 ''3'':50 ''4'':56 ''accept'':53 ''airport'':17 ''appear'':49 ''captiv'':3,25,45 ''caus'':1 ''coffe'':14 ''example.com'':39 ''first'':27 ''go'':37 ''hotel'':13 ''http'':40 ''https'':42,58 ''new'':34 ''open'':32 ''page'':47 ''portal'':4,26,46 ''re'':10 ''shop'':15 ''sign'':6,21,51 ''site'':59 ''tab'':35 ''term'':55 ''trigger'':29 ''work'':61');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (91, 20, 3, '## Cause 2: System clock is wrong

SSL certs include a "valid from / valid to" date. If your clock is off by more than a few hours, every cert appears expired or not yet valid.

Fix:

- **Mac**: System Settings → General → Date & Time → toggle OFF then ON "Set time and date automatically"
- **Windows**: Settings → Time & Language → Date & Time → toggle OFF then ON "Set time automatically"', '''2'':2 ''appear'':29 ''automat'':50,63 ''caus'':1 ''cert'':8,28 ''clock'':4,18 ''date'':15,40,49,55 ''everi'':27 ''expir'':30 ''fix'':35 ''general'':39 ''hour'':26 ''includ'':9 ''languag'':54 ''mac'':36 ''set'':38,46,52,61 ''ssl'':7 ''system'':3,37 ''time'':41,47,53,56,62 ''toggl'':42,57 ''valid'':11,13,34 ''window'':51 ''wrong'':6 ''yet'':33');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (92, 20, 4, '## Cause 3: Missing Slice SSL inspection cert

If you''re on a managed laptop and visiting an external site, the network sometimes intercepts HTTPS for security scanning. The Slice CA cert needs to be trusted on your machine.

Normally this is automatic via Jamf / Intune. If it''s not (e.g. on a brand-new laptop), file a ticket with **End-User Compute** — the fix is for IT to push the cert.', '''3'':2 ''automat'':42 ''brand'':54 ''brand-new'':53 ''ca'':30 ''caus'':1 ''cert'':7,31,73 ''comput'':64 ''e.g'':50 ''end'':62 ''end-us'':61 ''extern'':18 ''file'':57 ''fix'':66 ''https'':24 ''inspect'':6 ''intercept'':23 ''intun'':45 ''jamf'':44 ''laptop'':14,56 ''machin'':38 ''manag'':13 ''miss'':3 ''need'':32 ''network'':21 ''new'':55 ''normal'':39 ''push'':71 ''re'':10 ''scan'':27 ''secur'':26 ''site'':19 ''slice'':4,29 ''sometim'':22 ''ssl'':5 ''ticket'':59 ''trust'':35 ''user'':63 ''via'':43 ''visit'':16');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (93, 20, 5, '## Cause 4: The site''s cert is genuinely broken

If only ONE external site shows the warning, the site itself probably has a bad cert. Click the warning, look for "Issued by" and "Expired on" — the site owner needs to fix it. Don''t bypass for unknown sites; only proceed if you know it''s safe.', '''4'':2 ''bad'':24 ''broken'':9 ''bypass'':45 ''caus'':1 ''cert'':6,25 ''click'':26 ''expir'':34 ''extern'':13 ''fix'':41 ''genuin'':8 ''issu'':31 ''know'':53 ''look'':29 ''need'':39 ''one'':12 ''owner'':38 ''probabl'':21 ''proceed'':50 ''safe'':56 ''show'':15 ''site'':4,14,19,37,48 ''unknown'':47 ''warn'':17,28');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (94, 20, 6, '## Don''t click "Proceed anyway" blindly

Especially for internal Slice sites, this warning is sometimes a real attack indicator. If unsure, forward the URL to **phishing@slice.com**.', '''anyway'':5 ''attack'':18 ''blind'':6 ''click'':3 ''especi'':7 ''forward'':22 ''indic'':19 ''intern'':9 ''phishing@slice.com'':26 ''proceed'':4 ''real'':17 ''site'':11 ''slice'':10 ''sometim'':15 ''unsur'':21 ''url'':24 ''warn'':13');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (95, 22, 0, '# App keeps crashing or freezing

Generic crash troubleshooting that works for almost any app. Try in order — each step takes under 2 minutes.', '''2'':22 ''almost'':12 ''app'':1,14 ''crash'':3,7 ''freez'':5 ''generic'':6 ''keep'':2 ''minut'':23 ''order'':17 ''step'':19 ''take'':20 ''tri'':15 ''troubleshoot'':8 ''work'':10');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (96, 22, 1, '## Step 1: Force quit and reopen

- **Mac**: Cmd+Option+Esc → select the app → Force Quit
- **Windows**: Ctrl+Shift+Esc → right-click the app → End task

Reopen. If it works now, you''re done — but note the trigger; it may recur.', '''1'':2 ''app'':13,24 ''click'':22 ''cmd'':8 ''ctrl'':17 ''done'':34 ''end'':25 ''esc'':10,19 ''forc'':3,14 ''mac'':7 ''may'':40 ''note'':36 ''option'':9 ''quit'':4,15 ''re'':33 ''recur'':41 ''reopen'':6,27 ''right'':21 ''right-click'':20 ''select'':11 ''shift'':18 ''step'':1 ''task'':26 ''trigger'':38 ''window'':16 ''work'':30');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (97, 22, 2, '## Step 2: Reboot

The classic. Mac and Windows both queue updates that finish on reboot — going more than a week without restarting is a top cause of weird crashes.', '''2'':2 ''caus'':26 ''classic'':5 ''crash'':29 ''finish'':13 ''go'':16 ''mac'':6 ''queue'':10 ''reboot'':3,15 ''restart'':22 ''step'':1 ''top'':25 ''updat'':11 ''week'':20 ''weird'':28 ''window'':8 ''without'':21');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (98, 22, 3, '## Step 3: Update the app

Most apps have **Check for Updates** in their menu. Crashes after a recent OS update usually mean you need a newer app version.

- Mac App Store apps: open App Store → Updates
- Everything else: the app''s own menu, or visit the vendor''s website', '''3'':2 ''app'':5,7,27,30,32,34,40 ''check'':9 ''crash'':15 ''els'':38 ''everyth'':37 ''mac'':29 ''mean'':22 ''menu'':14,43 ''need'':24 ''newer'':26 ''open'':33 ''os'':19 ''recent'':18 ''step'':1 ''store'':31,35 ''updat'':3,11,20,36 ''usual'':21 ''vendor'':47 ''version'':28 ''visit'':45 ''websit'':49');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (99, 22, 4, '## Step 4: Check disk space

If your disk is more than 90% full, EVERY app gets slower and more crash-prone because the OS can''t allocate scratch space. See the **Laptop running slow** guide for cleanup steps.', '''4'':2 ''90'':12 ''alloc'':28 ''app'':15 ''check'':3 ''cleanup'':38 ''crash'':21 ''crash-pron'':20 ''disk'':4,8 ''everi'':14 ''full'':13 ''get'':16 ''guid'':36 ''laptop'':33 ''os'':25 ''prone'':22 ''run'':34 ''scratch'':29 ''see'':31 ''slow'':35 ''slower'':17 ''space'':5,30 ''step'':1,39');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (100, 22, 5, '## Step 5: Check for OS updates

If the app crashes on launch after a Mac/Windows update, install pending OS patches:

- **Mac**: System Settings → General → Software Update
- **Windows**: Settings → Windows Update → Check for updates', '''5'':2 ''app'':9 ''check'':3,31 ''crash'':10 ''general'':24 ''instal'':17 ''launch'':12 ''mac'':21 ''mac/windows'':15 ''os'':5,19 ''patch'':20 ''pend'':18 ''set'':23,28 ''softwar'':25 ''step'':1 ''system'':22 ''updat'':6,16,26,30,33 ''window'':27,29');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (101, 22, 6, '## Step 6: Reinstall the app

If the issue is targeted to one app and the above didn''t help:

1. Save anything important from the app first
2. Quit the app fully
3. Drag to Trash (Mac) / Uninstall (Windows)
4. Reinstall from the official source', '''1'':20 ''2'':28 ''3'':33 ''4'':40 ''6'':2 ''anyth'':22 ''app'':5,13,26,31 ''didn'':17 ''drag'':34 ''first'':27 ''fulli'':32 ''help'':19 ''import'':23 ''issu'':8 ''mac'':37 ''offici'':44 ''one'':12 ''quit'':29 ''reinstal'':3,41 ''save'':21 ''sourc'':45 ''step'':1 ''target'':10 ''trash'':36 ''uninstal'':38 ''window'':39');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (102, 22, 7, '## Step 7: Submit a crash report

If reinstalling doesn''t fix it, file a ticket with **End-User Compute**. Include:

- The app name and version (from the app''s About screen)
- Your OS version
- What you were doing when it crashed
- The Console / Event Viewer log entry — Mac: open Console.app, search for the app name; Windows: Event Viewer → Windows Logs → Application', '''7'':2 ''app'':23,29,55 ''applic'':62 ''comput'':20 ''consol'':44 ''console.app'':51 ''crash'':5,42 ''doesn'':9 ''end'':18 ''end-us'':17 ''entri'':48 ''event'':45,58 ''file'':13 ''fix'':11 ''includ'':21 ''log'':47,61 ''mac'':49 ''name'':24,56 ''open'':50 ''os'':34 ''reinstal'':8 ''report'':6 ''screen'':32 ''search'':52 ''step'':1 ''submit'':3 ''ticket'':15 ''user'':19 ''version'':26,35 ''viewer'':46,59 ''window'':57,60');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (103, 22, 8, '## When it''s not the app

Repeated crashes across multiple apps → it''s the OS or hardware. File a ticket. Random shutdowns or kernel panics → likely hardware. File urgently.', '''across'':9 ''app'':6,11 ''crash'':8 ''file'':18,28 ''hardwar'':17,27 ''kernel'':24 ''like'':26 ''multipl'':10 ''os'':15 ''panic'':25 ''random'':21 ''repeat'':7 ''shutdown'':22 ''ticket'':20 ''urgent'':29');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (104, 23, 0, '# Phishing email — what to do

If you suspect a message is phishing — DON''T click links, DON''T open attachments, DON''T reply. Report it.', '''attach'':20 ''click'':15 ''email'':2 ''link'':16 ''messag'':10 ''open'':19 ''phish'':1,12 ''repli'':23 ''report'':24 ''suspect'':8');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (105, 23, 1, '## How to spot phishing

Common red flags:

- **Urgency**: "Your account will be closed in 24 hours"
- **Authority impersonation**: claims to be from your CEO, IT, or a bank
- **Mismatched sender**: email looks like ceo@slice.com but the sender field shows a random Gmail address
- **Generic greetings**: "Dear customer" instead of your name
- **Suspicious links** (hover before clicking): the link text says "slice.com" but the actual URL is "slice-login.ru"
- **Asks for credentials**: real Slice systems never ask for your password by email
- **Unexpected attachments**: especially .zip, .exe, .docm, .xlsm', '''24'':15 ''account'':10 ''actual'':64 ''address'':43 ''ask'':68,75 ''attach'':82 ''author'':17 ''bank'':28 ''ceo'':24 ''ceo@slice.com'':34 ''claim'':19 ''click'':56 ''close'':13 ''common'':5 ''credenti'':70 ''custom'':47 ''dear'':46 ''docm'':86 ''email'':31,80 ''especi'':83 ''exe'':85 ''field'':38 ''flag'':7 ''generic'':44 ''gmail'':42 ''greet'':45 ''hour'':16 ''hover'':54 ''imperson'':18 ''instead'':48 ''like'':33 ''link'':53,58 ''look'':32 ''mismatch'':29 ''name'':51 ''never'':74 ''password'':78 ''phish'':4 ''random'':41 ''real'':71 ''red'':6 ''say'':60 ''sender'':30,37 ''show'':39 ''slice'':72 ''slice-login.ru'':67 ''slice.com'':61 ''spot'':3 ''suspici'':52 ''system'':73 ''text'':59 ''unexpect'':81 ''urgenc'':8 ''url'':65 ''xlsm'':87 ''zip'':84');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (106, 23, 2, '## How to report', '''report'':3');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (109, 23, 5, '## What if I already clicked the link?

1. **Don''t enter credentials** if you''re on a fake page — close the tab immediately
2. If you DID enter credentials: change your OneLogin password right now (see **Reset my OneLogin password**)
3. File an URGENT ticket with **Security**
4. If you ran an attachment: shut down your laptop and file a ticket — Security will image it', '''1'':8 ''2'':24 ''3'':41 ''4'':48 ''alreadi'':4 ''attach'':53 ''chang'':30 ''click'':5 ''close'':20 ''credenti'':12,29 ''enter'':11,28 ''fake'':18 ''file'':42,59 ''imag'':64 ''immedi'':23 ''laptop'':57 ''link'':7 ''onelogin'':32,39 ''page'':19 ''password'':33,40 ''ran'':51 ''re'':15 ''reset'':37 ''right'':34 ''secur'':47,62 ''see'':36 ''shut'':54 ''tab'':22 ''ticket'':45,61 ''urgent'':44');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (110, 23, 6, '## When in doubt

Send to **phishing@slice.com** anyway. Better one false positive than a missed compromise. Security responds to every report within 4 hours, often faster.', '''4'':22 ''anyway'':7 ''better'':8 ''compromis'':15 ''doubt'':3 ''everi'':19 ''fals'':10 ''faster'':25 ''hour'':23 ''miss'':14 ''often'':24 ''one'':9 ''phishing@slice.com'':6 ''posit'':11 ''report'':20 ''respond'':17 ''secur'':16 ''send'':4 ''within'':21');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (111, 23, 7, '## Common Slice-specific scams

Things we''ve seen in the past 12 months:

- Fake "Microsoft 365 storage full" notices (we use Google Workspace, not Microsoft)
- "OneLogin password expiring" emails (real ones come from noreply@onelogin.com only)
- Vendor invoice updates asking you to "update banking details" (always verify by phone before any change)', '''12'':13 ''365'':17 ''alway'':46 ''ask'':40 ''bank'':44 ''chang'':52 ''come'':33 ''common'':1 ''detail'':45 ''email'':30 ''expir'':29 ''fake'':15 ''full'':19 ''googl'':23 ''invoic'':38 ''microsoft'':16,26 ''month'':14 ''noreply@onelogin.com'':35 ''notic'':20 ''one'':32 ''onelogin'':27 ''password'':28 ''past'':12 ''phone'':49 ''real'':31 ''scam'':5 ''seen'':9 ''slice'':3 ''slice-specif'':2 ''specif'':4 ''storag'':18 ''thing'':6 ''updat'':39,43 ''use'':22 ''ve'':8 ''vendor'':37 ''verifi'':47 ''workspac'':24');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (112, 24, 0, '# Calendar invite not showing up

Someone told you a meeting is on your calendar but you don''t see it. Almost always one of four causes.', '''almost'':21 ''alway'':22 ''calendar'':1,14 ''caus'':26 ''four'':25 ''invit'':2 ''meet'':10 ''one'':23 ''see'':19 ''show'':4 ''someon'':6 ''told'':7');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (113, 24, 1, '## Cause 1: Wrong calendar account

Are you signed into a personal Google account in addition to your @slice.com one? The invite went to one but you''re viewing the other.

In Google Calendar (web): top-right → click your avatar → confirm you''re on **@slice.com**. Switch if not.', '''1'':2 ''account'':5,13 ''addit'':15 ''avatar'':40 ''calendar'':4,33 ''caus'':1 ''click'':38 ''confirm'':41 ''googl'':12,32 ''invit'':21 ''one'':19,24 ''person'':11 ''re'':27,43 ''right'':37 ''sign'':8 ''slice.com'':18,45 ''switch'':46 ''top'':36 ''top-right'':35 ''view'':28 ''web'':34 ''went'':22 ''wrong'':3');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (114, 24, 2, '## Cause 2: External invite delay

Google has a known issue: invites sent **across organizations** (someone external to Slice) sometimes take **5–10 minutes** to appear. Wait, then refresh.', '''10'':22 ''2'':2 ''5'':21 ''across'':13 ''appear'':25 ''caus'':1 ''delay'':5 ''extern'':3,16 ''googl'':6 ''invit'':4,11 ''issu'':10 ''known'':9 ''minut'':23 ''organ'':14 ''refresh'':28 ''sent'':12 ''slice'':18 ''someon'':15 ''sometim'':19 ''take'':20 ''wait'':26');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (115, 24, 3, '## Cause 3: Invite landed in spam

External invites occasionally go to Gmail''s spam folder, which means Calendar never auto-accepts them. Check spam, look for "you have been invited to..." messages, click **Add to calendar** manually.', '''3'':2 ''accept'':22 ''add'':35 ''auto'':21 ''auto-accept'':20 ''calendar'':18,37 ''caus'':1 ''check'':24 ''click'':34 ''extern'':7 ''folder'':15 ''gmail'':12 ''go'':10 ''invit'':3,8,31 ''land'':4 ''look'':26 ''manual'':38 ''mean'':17 ''messag'':33 ''never'':19 ''occasion'':9 ''spam'':6,14,25');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (116, 24, 4, '## Cause 4: Auto-accept disabled

Some people set rules like "auto-decline meetings outside business hours." Check Calendar Settings → Event settings → "Add invitations to my calendar" — make sure it''s set to **From everyone** or at least **Only if I have responded**.', '''4'':2 ''accept'':5 ''add'':24 ''auto'':4,13 ''auto-accept'':3 ''auto-declin'':12 ''busi'':17 ''calendar'':20,28 ''caus'':1 ''check'':19 ''declin'':14 ''disabl'':6 ''event'':22 ''everyon'':36 ''hour'':18 ''invit'':25 ''least'':39 ''like'':11 ''make'':29 ''meet'':15 ''outsid'':16 ''peopl'':8 ''respond'':44 ''rule'':10 ''set'':9,21,23,33 ''sure'':30');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (117, 24, 5, '## Specific: meeting room not showing

Resource calendars (HQ-Conf-A, etc.) appear as a separate calendar entry, not on yours. To see room availability:

1. Calendar settings → **Add calendar** → **Browse resources**
2. Subscribe to the rooms you book often', '''1'':26 ''2'':33 ''add'':29 ''appear'':13 ''avail'':25 ''book'':39 ''brows'':31 ''calendar'':7,17,27,30 ''conf'':10 ''entri'':18 ''etc'':12 ''hq'':9 ''hq-conf-a'':8 ''meet'':2 ''often'':40 ''resourc'':6,32 ''room'':3,24,37 ''see'':23 ''separ'':16 ''set'':28 ''show'':5 ''specif'':1 ''subscrib'':34');
INSERT INTO public.guide_chunks (id, guide_id, chunk_index, content, tsv) VALUES (118, 24, 6, '## File a ticket if

- Invites work for everyone else but never reach you (likely a delegation issue)
- Calendar shows the meeting but the invite email is missing — file with the **Collaboration** team

Typical SLA: 4 business hours.', '''4'':35 ''busi'':36 ''calendar'':18 ''collabor'':31 ''deleg'':16 ''els'':9 ''email'':25 ''everyon'':8 ''file'':1,28 ''hour'':37 ''invit'':5,24 ''issu'':17 ''like'':14 ''meet'':21 ''miss'':27 ''never'':11 ''reach'':12 ''show'':19 ''sla'':34 ''team'':32 ''ticket'':3 ''typic'':33 ''work'':6');


--
-- Name: chat_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_feedback_id_seq', 3, true);


--
-- Name: chat_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_logs_id_seq', 13, true);


--
-- Name: guide_chunks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guide_chunks_id_seq', 151, true);


--
-- Name: guides_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guides_id_seq', 30, true);


--
-- PostgreSQL database dump complete
--

\unrestrict s3RqP5bx5wTwJV6Rx11iB10LtBWePmsAHMlGzUXddyFvYPHEtW4xLML3RDxYgRE

