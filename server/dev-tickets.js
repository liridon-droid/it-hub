// Local-dev ticket fixtures.
//
// In real deployments the portal owns NO ticket data — every ticket call proxies
// to the ticket module through the hub (see ticketModuleFetch in index.js). In
// local dev there's no hub, so those calls would 503 ("Module is not configured
// to reach the hub") and the Tickets UI shows an error. This in-memory store
// stands in for the ticket module so the UI has something to render.
//
// Enabled when DEV_TICKETS is truthy; defaults ON whenever DEV_BYPASS_AUTH is set
// (i.e. local dev). In-memory only — resets on server restart, reseeding these
// rows. Mirrors the ticket module's envelope shapes that index.js expects.
//
// SAFE FOR PROD: never runs there. Prod sets hubApiBase + apiKey (so the real
// proxy path is taken) AND doesn't set DEV_BYPASS_AUTH (so this is disabled).

const onFlag = (v) => ['1', 'true', 'yes'].includes(String(v || '').toLowerCase());

export const devTicketsEnabled = process.env.DEV_TICKETS != null
  ? onFlag(process.env.DEV_TICKETS)
  : onFlag(process.env.DEV_BYPASS_AUTH);

const DEV_USER = { id: 'dev', name: 'Dev User', email: 'dev@local' };
const now = Date.now();
const ago = (mins) => new Date(now - mins * 60000).toISOString();

// The signed-in dev user (DEV_BYPASS_AUTH) is both requester and submitter, so
// these all land in "My tickets". On-brand Slice scenarios (GlobalProtect,
// 1Password, Jabra/CCP) covering an open incident, a request pending approval,
// and a resolved incident with a back-and-forth.
let seq = 90013;
const tickets = [
  {
    id: 90012,
    ticket_number: 'IT-90012',
    type: 'incident',
    status: 'open',
    priority: 'high',
    subject: "Can't connect to the VPN (GlobalProtect)",
    description:
      'GlobalProtect just spins on "Connecting…" and never finishes. Tried quitting and reopening, same thing. I\'m on home Wi-Fi.',
    requester_id: DEV_USER.id, requester_name: DEV_USER.name, requester_email: DEV_USER.email,
    submitter_id: DEV_USER.id, submitter_name: DEV_USER.name, submitter_email: DEV_USER.email,
    created_at: ago(95), updated_at: ago(40),
    comments: [
      { id: 'c1-90012', author_name: 'IT Team', body: "Thanks for the report — can you confirm GlobalProtect is on the latest version? We pushed an update via Jamf this morning. Try reconnecting and let us know.", is_internal: false, created_at: ago(40) },
    ],
  },
  {
    id: 90008,
    ticket_number: 'IT-90008',
    type: 'service_request',
    status: 'pending',
    approval_status: 'pending',
    priority: 'medium',
    subject: 'Access request: 1Password "Payments" vault',
    description: 'I need access to the Payments vault in 1Password to pull the Adyen test credentials for the billing work.',
    requester_id: DEV_USER.id, requester_name: DEV_USER.name, requester_email: DEV_USER.email,
    submitter_id: DEV_USER.id, submitter_name: DEV_USER.name, submitter_email: DEV_USER.email,
    created_at: ago(1500), updated_at: ago(1500),
    comments: [],
  },
  // Two tickets the dev user opened ON BEHALF OF someone else (submitter = dev,
  // requester = the beneficiary) — exercises the "Requested for" facet, the
  // "For ‹name›" chip, and (IT-90010, replied-to) the per-row unseen badge.
  {
    id: 90010,
    ticket_number: 'IT-90010',
    type: 'service_request',
    status: 'open',
    priority: 'medium',
    subject: 'New starter laptop: MacBook Pro 14" for Arben',
    description: 'Arben joins the Payments team on Monday — needs the standard engineering MacBook Pro 14" build with the Jamf baseline.',
    requester_id: 'u-arben', requester_name: 'Arben Krasniqi', requester_email: 'arben@local',
    submitter_id: DEV_USER.id, submitter_name: DEV_USER.name, submitter_email: DEV_USER.email,
    created_at: ago(400), updated_at: ago(25),
    comments: [
      { id: 'c1-90010', author_name: 'IT Team', body: 'Laptop is imaged and ready — it\'ll be on Arben\'s desk Monday 9am. Can you confirm which desk he\'s sitting at?', is_internal: false, created_at: ago(60) },
      { id: 'c2-90010', author_name: 'IT Team', body: 'Also added him to the standard engineering 1Password groups while we were at it.', is_internal: false, created_at: ago(25) },
    ],
  },
  {
    id: 90006,
    ticket_number: 'IT-90006',
    type: 'service_request',
    status: 'resolved',
    priority: 'low',
    subject: 'Figma seat for Elira',
    description: 'Elira is picking up the design reviews for the portal work and needs a full Figma seat instead of a viewer one.',
    requester_id: 'u-elira', requester_name: 'Elira Hoxha', requester_email: 'elira@local',
    submitter_id: DEV_USER.id, submitter_name: DEV_USER.name, submitter_email: DEV_USER.email,
    created_at: ago(4300), updated_at: ago(4100),
    comments: [
      { id: 'c1-90006', author_name: 'IT Team', body: 'Seat upgraded — Elira has full editor access now.', is_internal: false, created_at: ago(4100) },
    ],
  },
  {
    id: 90001,
    ticket_number: 'IT-90001',
    type: 'incident',
    status: 'resolved',
    priority: 'low',
    subject: 'Jabra headset mic not picking up in CCP',
    description: 'Customers say they can hear me very faintly on Amazon Connect (CCP) calls. Speaker is fine, just the mic.',
    requester_id: DEV_USER.id, requester_name: DEV_USER.name, requester_email: DEV_USER.email,
    submitter_id: DEV_USER.id, submitter_name: DEV_USER.name, submitter_email: DEV_USER.email,
    created_at: ago(7200), updated_at: ago(6800),
    comments: [
      { id: 'c1-90001', author_name: 'IT Team', body: 'Sounds like the wrong input device is selected. In CCP → Settings, set both Microphone and Speaker to the "Jabra" USB device, not the built-in mic.', is_internal: false, created_at: ago(7000) },
      { id: 'c2-90001', author_name: 'Dev User', body: 'That was it — switched the input to the Jabra and the mic is loud and clear now. Thanks!', is_internal: false, created_at: ago(6850) },
      { id: 'c3-90001', author_name: 'IT Team', body: 'Great — marking this resolved. Reopen any time if it comes back.', is_internal: false, created_at: ago(6800) },
    ],
  },
];

// One pending approval awaiting the dev user, so the Approvals tab badge + the
// approve/reject flow are exercisable offline. Drops off when acted on.
const approvals = [
  {
    request_id: 'APR-5001',
    ticket_number: 'IT-90020',
    subject: 'Access request: Salesforce admin role',
    requester_name: 'Priya Nair',
    workflow_name: 'Access approval',
    current_stage_name: 'Manager approval',
    requested_at: ago(180),
    updated_at: ago(180),
  },
];

const findTicket = (idOrNum) => {
  const key = decodeURIComponent(String(idOrNum));
  return tickets.find((t) => String(t.id) === key || String(t.ticket_number) === key);
};
const ok = (data, status = 200) => ({ ok: true, status, data });
const notFound = () => ({ ok: false, status: 404, data: { error: 'Not found (dev-tickets)' } });

// Stand in for ticketModuleFetch(method, subPath, body) → { ok, status, data }.
export function handleDevTicket(method, subPath, body) {
  const [pathOnly, qs] = String(subPath).split('?');
  const params = new URLSearchParams(qs || '');
  const parts = pathOnly.split('/').filter(Boolean); // ['tickets'] | ['tickets', id] | ['tickets', id, 'comments'] | ['approvals','pending']

  // GET /tickets?requester_id=… | submitter_id=…  → the dev user's tickets
  if (method === 'GET' && parts[0] === 'tickets' && parts.length === 1) {
    const reqId = params.get('requester_id');
    const subId = params.get('submitter_id');
    const list = tickets.filter(
      (t) => (reqId && String(t.requester_id) === reqId) || (subId && String(t.submitter_id || '') === subId),
    );
    return ok({ tickets: list, total: list.length });
  }
  // GET /tickets/:id
  if (method === 'GET' && parts[0] === 'tickets' && parts.length === 2) {
    const t = findTicket(parts[1]);
    return t ? ok(t) : notFound();
  }
  // POST /tickets  (create)
  if (method === 'POST' && parts[0] === 'tickets' && parts.length === 1) {
    const id = ++seq;
    const ts = new Date().toISOString();
    const t = {
      id,
      ticket_number: 'IT-' + id,
      type: body.type || 'incident',
      status: 'open',
      priority: body.priority || 'medium',
      subject: body.subject,
      description: body.description || '',
      requester_id: body.requester_id, requester_name: body.requester_name, requester_email: body.requester_email,
      submitter_id: body.submitter_id, submitter_name: body.submitter_name, submitter_email: body.submitter_email,
      created_at: ts, updated_at: ts,
      comments: [],
    };
    tickets.unshift(t);
    return ok({ status: 'created', ticket: t }, 201);
  }
  // POST /tickets/:id/comments
  if (method === 'POST' && parts[0] === 'tickets' && parts[2] === 'comments') {
    const t = findTicket(parts[1]);
    if (!t) return notFound();
    const ts = new Date().toISOString();
    const c = {
      id: `c${t.comments.length + 1}-${t.id}`,
      author_name: body.author_name || DEV_USER.name,
      body: body.body,
      is_internal: !!body.is_internal,
      created_at: ts,
    };
    t.comments.push(c);
    t.updated_at = ts;
    return ok({ status: 'ok', comment: c }, 201);
  }
  // PATCH /tickets/:id  (status changes — close/reopen)
  if (method === 'PATCH' && parts[0] === 'tickets' && parts.length === 2) {
    const t = findTicket(parts[1]);
    if (!t) return notFound();
    if (body && body.status) t.status = body.status;
    if (body && body.priority) t.priority = body.priority;
    t.updated_at = new Date().toISOString();
    return ok({ status: 'updated', ticket: t });
  }
  // GET /approvals/pending
  if (method === 'GET' && parts[0] === 'approvals' && parts[1] === 'pending') {
    return ok({ pending: approvals });
  }
  // GET /approvals/:id
  if (method === 'GET' && parts[0] === 'approvals' && parts.length === 2 && parts[1] !== 'pending') {
    const ap = approvals.find((a) => String(a.request_id) === decodeURIComponent(parts[1]));
    if (!ap) return notFound();
    return ok({
      request: { id: ap.request_id, requested_at: ap.requested_at, updated_at: ap.updated_at },
      ticket: { ticket_number: ap.ticket_number, subject: ap.subject, requester_name: ap.requester_name },
      current_stage: { name: ap.current_stage_name, order: 1 },
      workflow: { stages: [
        { order: 1, name: 'Manager approval', type: 'role' },
        { order: 2, name: 'IT Director', type: 'role' },
      ] },
      actions: [],
      can_act: true,
    });
  }
  // POST /approvals/:id/respond  (approve/reject → drops out of the pending list)
  if (method === 'POST' && parts[0] === 'approvals' && parts[2] === 'respond') {
    const i = approvals.findIndex((a) => String(a.request_id) === decodeURIComponent(parts[1]));
    if (i >= 0) approvals.splice(i, 1);
    return ok({ status: 'ok' });
  }

  return { ok: false, status: 404, data: { error: `dev-tickets: unhandled ${method} ${subPath}` } };
}
