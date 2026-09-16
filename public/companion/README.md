# SliceDesk Companion — Firefox distribution

Firefox builds of the browser extension are **self-distributed**: Mozilla signs
them (addons.mozilla.org, add-on 3073426) but does not host them, so the signed
`.xpi` lives here and is linked from the Portal landing page. Chrome installs
from the Chrome Web Store and needs nothing from this folder.

- `slicedesk-companion-<version>-firefox.xpi` — the signed file, exactly as
  downloaded from the AMO Developer Hub. Never edit it; a changed byte breaks
  the signature.
- `updates.json` — Firefox's update manifest. Builds from 1.4.1 on carry
  `browser_specific_settings.gecko.update_url` pointing here, so installed
  copies update themselves. Add one entry per released version; keep old
  `.xpi` files until nobody is on them.

nginx serves this folder with `application/x-xpinstall` for `.xpi`
(`nginx.client.conf`), which is what makes Firefox show the install prompt
instead of downloading the file.

Release steps: download the signed `.xpi` from AMO → drop it here → add its
version to `updates.json` → bump the version in `src/app.jsx`
(`COMPANION_FIREFOX_VERSION`) → merge to main (auto-deploys).
