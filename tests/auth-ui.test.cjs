const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'auth-ui.js'), 'utf8');
const user = { id: 'user-1', name: 'Alex Example', email: 'alex@example.com', role: 'user', funds: ['alpha', 'neutral'] };

class Element {
    constructor(tag = 'div', attributes = {}) {
        this.tag = tag;
        this.attributes = { ...attributes };
        this.listeners = {};
        this.nodes = [];
        this.value = '';
        this.textContent = '';
        this.hidden = 'hidden' in attributes;
        this.disabled = 'disabled' in attributes;
        this.type = attributes.type;
    }
    set innerHTML(markup) {
        this.nodes = Array.from(markup.matchAll(/<([a-z0-9-]+)\b([^>]*)>/gi), ([, tag, source]) => {
            const attributes = {};
            for (const [, key, value] of source.matchAll(/([a-z][\w-]*)(?:="([^"]*)")?/gi)) attributes[key] = value === undefined ? '' : value;
            return new Element(tag, attributes);
        });
        const form = this.nodes.find(node => node.tag === 'form');
        if (form) {
            form.nodes = this.nodes.filter(node => node.tag === 'input');
            form.elements = { namedItem: name => form.nodes.find(node => node.attributes.name === name) };
        }
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    querySelectorAll(selector) {
        return this.nodes.filter(node => selector.startsWith('#') ? node.attributes.id === selector.slice(1)
            : selector.startsWith('.') ? (node.attributes.class || '').split(' ').includes(selector.slice(1))
            : selector.startsWith('[') ? selector.slice(1, -1) in node.attributes : node.tag === selector);
    }
    setAttribute(key, value) { this.attributes[key] = value; }
    removeAttribute(key) { delete this.attributes[key]; }
    addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
    async dispatch(name, detail = {}) {
        for (const listener of this.listeners[name] || []) await listener({ preventDefault() {}, ...detail });
    }
    appendChild(child) { this.nodes.push(child); }
    remove() { this.removed = true; }
    focus() { this.focused = true; }
    reset() { this.nodes.forEach(node => { node.value = ''; }); }
}

function response(data, status = 200) { return { ok: status >= 200 && status < 300, status, async json() { return data; } }; }
function tick() { return new Promise(resolve => setImmediate(resolve)); }

function harness(responses, search = '') {
    const calls = [];
    const reloads = [];
    const broadcasts = [];
    const document = new Element('document');
    document.documentElement = new Element('html', { 'data-auth-pending': '' });
    document.body = new Element('body');
    document.readyState = 'complete';
    document.visibilityState = 'visible';
    document.createElement = tag => new Element(tag);
    const window = new Element('window');
    window.location = { search, reload: () => reloads.push(true) };
    window.setTimeout = setTimeout;
    window.clearTimeout = clearTimeout;
    window.BroadcastChannel = class extends Element {
        constructor() { super(); window.channel = this; }
        postMessage(message) { broadcasts.push(message); }
    };
    const fetch = async (url, options) => {
        calls.push({ url, ...options });
        const next = responses.shift();
        if (next instanceof Error) throw next;
        if (!next) throw new Error('No queued response');
        return next;
    };
    vm.runInNewContext(script, { window, document, fetch, URLSearchParams, AbortController });
    const root = document.body.nodes[0];
    const form = root.querySelector('#point-auth-form');
    return { document, window, root, form, calls, reloads, broadcasts, responses,
        field: name => form.elements.namedItem(name),
        button: id => root.querySelector('#point-auth-' + id),
        pending: () => 'data-auth-pending' in document.documentElement.attributes };
}

test('a verified session resolves ready and reveals the application', async () => {
    const app = harness([response({ user })]);
    assert.equal(app.pending(), true);
    assert.equal(await app.window.PointAuth.ready, user);
    assert.equal(app.window.PointAuth.user, user);
    assert.equal(app.pending(), false);
    assert.equal(app.root.removed, true);
    assert.equal(app.calls[0].credentials, 'same-origin');
    assert.equal(app.calls[0].cache, 'no-store');
});

test('signup validates input and confirmation before sending credentials', async () => {
    const app = harness([response({ user: null }), response({ user })], '?auth=signup');
    await tick();
    assert.equal(app.field('name').disabled, false);
    await app.form.dispatch('submit');
    assert.equal(app.calls.length, 1);
    assert.equal(app.field('name').attributes['aria-invalid'], 'true');
    assert.equal(app.field('name').focused, true);
    app.field('name').value = ' Alex Example ';
    app.field('email').value = ' alex@example.com ';
    app.field('password').value = 'correct horse battery';
    app.field('confirm').value = 'different password';
    await app.form.dispatch('submit');
    assert.equal(app.calls.length, 1);
    assert.equal(app.field('confirm').attributes['aria-invalid'], 'true');
    app.field('confirm').value = 'correct horse battery';
    await app.form.dispatch('submit');
    const payload = JSON.parse(app.calls[1].body);
    assert.deepEqual(payload, { action: 'signup', name: 'Alex Example', email: 'alex@example.com', password: 'correct horse battery' });
    assert.equal(app.calls[1].method, 'POST');
    assert.equal(app.calls[1].headers['Content-Type'], 'application/json');
    assert.equal(await app.window.PointAuth.ready, user);
    assert.equal(app.field('password').value, '');
    assert.equal(app.field('confirm').value, '');
});

test('rejected login keeps the gate closed and displays an accessible error', async () => {
    const app = harness([response({ user: null }), response({ error: 'Email or password is incorrect.' }, 401)]);
    await tick();
    app.field('email').value = 'alex@example.com';
    app.field('password').value = 'wrong password';
    await app.form.dispatch('submit');
    assert.equal(app.pending(), true);
    assert.equal(app.window.PointAuth.user, null);
    assert.equal(app.button('error').textContent, 'Email or password is incorrect.');
    assert.equal(app.button('error').hidden, false);
    assert.equal(app.button('error').focused, true);
    assert.equal(app.button('submit').disabled, false);
});

test('password visibility is explicit and switching modes clears passwords', async () => {
    const app = harness([response({ user: null })]);
    await tick();
    app.field('password').value = 'a long passphrase';
    await app.button('password-toggle').dispatch('click');
    assert.equal(app.field('password').type, 'text');
    assert.equal(app.button('password-toggle').attributes['aria-pressed'], 'true');
    await app.button('switch').dispatch('click');
    assert.equal(app.field('password').value, '');
    assert.equal(app.field('password').type, 'password');
    assert.equal(app.field('name').disabled, false);
    assert.equal(app.field('confirm').disabled, false);
});

test('an unavailable authentication server offers a working retry', async () => {
    const app = harness([new Error('Network unavailable'), response({ user: null })]);
    await tick();
    assert.equal(app.button('retry').hidden, false);
    assert.match(app.button('error').textContent, /could not connect/i);
    await app.button('retry').dispatch('click');
    assert.equal(app.button('retry').hidden, true);
    assert.equal(app.button('error').hidden, true);
    assert.equal(app.pending(), true);
    assert.equal(app.button('content').hidden, false);
});

test('malformed authentication responses never unlock the app', async () => {
    const app = harness([{ ok: true, async json() { throw new SyntaxError('Not JSON'); } }, response({ user: {} })]);
    await tick();
    assert.match(app.button('error').textContent, /temporarily unavailable/i);
    await app.button('retry').dispatch('click');
    assert.equal(app.pending(), true);
    assert.equal(app.window.PointAuth.user, null);
    assert.match(app.button('error').textContent, /could not verify/i);
});

test('logout does not pretend success when the server rejects it', async () => {
    const app = harness([response({ user }), response({ error: 'Please try again.' }, 503), response({ ok: true })]);
    await app.window.PointAuth.ready;
    await assert.rejects(app.window.PointAuth.logout(), /Please try again/);
    assert.equal(app.reloads.length, 0);
    assert.equal(app.window.PointAuth.user, user);
    await app.window.PointAuth.logout();
    assert.equal(app.reloads.length, 1);
    assert.equal(app.window.PointAuth.user, null);
    assert.equal(app.pending(), true);
    assert.equal(app.broadcasts[0].type, 'logout');
});

test('returning to an expired session hides account data and reloads the gate', async () => {
    const app = harness([response({ user }), response({ user: null })]);
    await app.window.PointAuth.ready;
    app.document.visibilityState = 'hidden';
    await app.document.dispatch('visibilitychange');
    assert.equal(app.pending(), true);
    app.document.visibilityState = 'visible';
    await app.document.dispatch('visibilitychange');
    await tick();
    assert.equal(app.reloads.length, 1);
    assert.equal(app.window.PointAuth.user, null);
});

test('a valid returning session restores visibility without reloading', async () => {
    const app = harness([response({ user }), response({ user: { ...user } })]);
    await app.window.PointAuth.ready;
    await app.window.dispatch('pagehide', { persisted: true });
    assert.equal(app.pending(), true);
    await app.window.dispatch('pageshow', { persisted: true });
    await tick();
    assert.equal(app.pending(), false);
    assert.equal(app.reloads.length, 0);
});

test('cross-tab signout hides the authenticated workspace', async () => {
    const app = harness([response({ user })]);
    await app.window.PointAuth.ready;
    await app.window.channel.dispatch('message', { data: { type: 'logout' } });
    assert.equal(app.reloads.length, 1);
    assert.equal(app.pending(), true);
});
