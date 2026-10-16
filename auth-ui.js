(function () {
    'use strict';

    let currentUser = null;
    let resolveReady;
    let readyResolved = false;
    let root;
    let form;
    let busy = false;
    let checking = false;
    let requestVersion = 0;
    let sessionCheck = null;
    let mode = new URLSearchParams(window.location.search).get('auth') === 'signup' ? 'signup' : 'login';
    const ready = new Promise(function (resolve) { resolveReady = resolve; });
    let channel = null;
    try {
        if (typeof window.BroadcastChannel === 'function') channel = new window.BroadcastChannel('point-auth');
    } catch (error) { /* Cross-tab notifications are optional in restricted browser contexts. */ }

    async function request(payload) {
        let response;
        const controller = new AbortController();
        const timeout = window.setTimeout(function () { controller.abort(); }, 15000);
        try {
            response = await fetch('/api/auth', {
                method: payload ? 'POST' : 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
                headers: payload ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
                body: payload ? JSON.stringify(payload) : undefined,
                signal: controller.signal
            });
        } catch (error) {
            throw new Error(error.name === 'AbortError' ? 'The connection is taking too long. Please try again.' : 'We could not connect. Check your connection and try again.');
        } finally {
            window.clearTimeout(timeout);
        }

        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new Error('Sign-in is temporarily unavailable. Please try again in a moment.');
        }
        if (!response.ok) {
            const message = data && typeof data.error === 'string' && data.error.length <= 250 ? data.error : 'Unable to complete your request. Please try again.';
            throw new Error(message);
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Sign-in is temporarily unavailable. Please try again in a moment.');
        }
        return data;
    }

    function validUser(user) {
        return user && typeof user === 'object' && typeof user.id === 'string' && typeof user.name === 'string' && typeof user.email === 'string';
    }

    function authenticate(user) {
        if (!validUser(user)) throw new Error('We could not verify your account. Please try again.');
        currentUser = user;
        if (window.history?.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('auth');
            window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        }
        if (form) form.reset();
        if (root) root.remove();
        document.documentElement.removeAttribute('data-auth-pending');
        if (!readyResolved) {
            readyResolved = true;
            resolveReady(user);
        }
    }

    function reloadForLogin() {
        currentUser = null;
        document.documentElement.setAttribute('data-auth-pending', '');
        window.location.reload();
    }

    async function logout() {
        await request({ action: 'logout' });
        if (channel) {
            try { channel.postMessage({ type: 'logout' }); } catch (error) { /* The server session is already invalidated. */ }
        }
        reloadForLogin();
    }

    function recheckSession() {
        if (!currentUser || sessionCheck) return sessionCheck;
        const previousUser = currentUser;
        document.documentElement.setAttribute('data-auth-pending', '');
        sessionCheck = request().then(function (data) {
            if (!currentUser || currentUser.id !== previousUser.id) return;
            const user = data.user;
            if (!validUser(user) || user.id !== previousUser.id || user.role !== previousUser.role || JSON.stringify(user.funds) !== JSON.stringify(previousUser.funds)) {
                reloadForLogin();
                return;
            }
            currentUser = user;
            document.documentElement.removeAttribute('data-auth-pending');
        }).catch(reloadForLogin).finally(function () { sessionCheck = null; });
        return sessionCheck;
    }

    window.PointAuth = {
        ready: ready,
        get user() { return currentUser; },
        logout: logout,
        requireLogin: reloadForLogin
    };

    if (channel) {
        channel.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'logout' && currentUser) reloadForLogin();
        });
    }

    document.addEventListener('visibilitychange', function () {
        if (!currentUser) return;
        if (document.visibilityState === 'hidden') document.documentElement.setAttribute('data-auth-pending', '');
        else recheckSession();
    });
    window.addEventListener('pagehide', function (event) {
        if (event.persisted && currentUser) document.documentElement.setAttribute('data-auth-pending', '');
    });
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) recheckSession();
    });

    function errorMessage(message, focus) {
        const error = root.querySelector('#point-auth-error');
        error.textContent = message || '';
        error.hidden = !message;
        if (message && focus) error.focus();
    }

    function clearFieldErrors() {
        form.querySelectorAll('[aria-invalid]').forEach(function (input) { input.removeAttribute('aria-invalid'); });
        root.querySelectorAll('.point-auth-field-error').forEach(function (field) { field.textContent = ''; });
    }

    function fieldError(name, message) {
        const input = form.elements.namedItem(name);
        input.setAttribute('aria-invalid', 'true');
        root.querySelector('#point-auth-' + name + '-error').textContent = message;
        return input;
    }

    function setBusy(value) {
        busy = value;
        form.setAttribute('aria-busy', String(value));
        root.querySelectorAll('button').forEach(function (button) { button.disabled = value; });
        root.querySelector('#point-auth-submit').textContent = value ? (mode === 'signup' ? 'Creating your account…' : 'Signing in…') : (mode === 'signup' ? 'Create account' : 'Sign in');
    }

    function renderMode() {
        const signup = mode === 'signup';
        root.querySelector('#point-auth-title').textContent = signup ? 'Make yourself at home.' : 'Welcome back.';
        root.querySelector('#point-auth-description').textContent = signup ? 'Create your Point account to access your workspace.' : 'Sign in to continue to your Point workspace.';
        root.querySelectorAll('[data-signup-only]').forEach(function (element) { element.hidden = !signup; });
        form.elements.namedItem('name').disabled = !signup;
        form.elements.namedItem('confirm').disabled = !signup;
        form.elements.namedItem('password').autocomplete = signup ? 'new-password' : 'current-password';
        form.elements.namedItem('password').setAttribute('aria-describedby', signup ? 'point-auth-password-hint point-auth-password-error' : 'point-auth-password-error');
        root.querySelector('#point-auth-password-hint').hidden = !signup;
        root.querySelector('#point-auth-switch-copy').textContent = signup ? 'Already have an account?' : 'New to Point?';
        root.querySelector('#point-auth-switch').textContent = signup ? 'Sign in' : 'Create an account';
        form.elements.namedItem('password').value = '';
        form.elements.namedItem('confirm').value = '';
        setPasswordVisible(false);
        clearFieldErrors();
        errorMessage('');
        setBusy(false);
    }

    function setPasswordVisible(visible) {
        form.elements.namedItem('password').type = visible ? 'text' : 'password';
        form.elements.namedItem('confirm').type = visible ? 'text' : 'password';
        const button = root.querySelector('#point-auth-password-toggle');
        button.textContent = visible ? 'Hide' : 'Show';
        button.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
        button.setAttribute('aria-pressed', String(visible));
    }

    async function submit(event) {
        event.preventDefault();
        if (busy || checking) return;
        clearFieldErrors();
        errorMessage('');
        const name = form.elements.namedItem('name').value.trim();
        const email = form.elements.namedItem('email').value.trim();
        const password = form.elements.namedItem('password').value;
        const confirm = form.elements.namedItem('confirm').value;
        const invalid = [];
        if (mode === 'signup' && (name.length < 2 || name.length > 80)) invalid.push(fieldError('name', 'Enter your name using 2–80 characters.'));
        if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.push(fieldError('email', 'Enter a valid email address.'));
        if (!password || password.length > 128 || (mode === 'signup' && password.length < 12)) invalid.push(fieldError('password', mode === 'signup' ? 'Use a password with 12–128 characters.' : 'Enter your password (up to 128 characters).'));
        if (mode === 'signup' && password !== confirm) invalid.push(fieldError('confirm', 'Your passwords do not match.'));
        if (invalid.length) {
            invalid[0].focus();
            return;
        }
        const version = ++requestVersion;
        setBusy(true);
        try {
            const payload = { action: mode, email: email, password: password };
            if (mode === 'signup') payload.name = name;
            const data = await request(payload);
            if (version === requestVersion) authenticate(data.user);
        } catch (error) {
            if (version === requestVersion) errorMessage(error.message, true);
        } finally {
            if (version === requestVersion && !currentUser) setBusy(false);
        }
    }

    async function checkSession() {
        if (checking || busy) return;
        checking = true;
        const version = ++requestVersion;
        const loading = root.querySelector('#point-auth-loading');
        const content = root.querySelector('#point-auth-content');
        loading.hidden = false;
        content.hidden = true;
        errorMessage('');
        try {
            const data = await request();
            if (version !== requestVersion) return;
            if (data.user === null) {
                root.querySelector('#point-auth-retry').hidden = true;
            } else {
                authenticate(data.user);
            }
        } catch (error) {
            if (version === requestVersion) {
                errorMessage(error.message);
                root.querySelector('#point-auth-retry').hidden = false;
            }
        } finally {
            checking = false;
            if (!currentUser) {
                loading.hidden = true;
                content.hidden = false;
            }
        }
    }

    function mount() {
        document.documentElement.setAttribute('data-auth-pending', '');
        root = document.createElement('main');
        root.id = 'point-auth-root';
        root.innerHTML = `
            <section class="point-auth-story" aria-label="Point">
                <a class="point-auth-brand" href="landing.html" aria-label="Point home"><span class="point-auth-brand-symbol" aria-hidden="true">p.</span><span>Point</span></a>
                <div class="point-auth-story-copy"><span class="point-auth-eyebrow">A clearer perspective</span><h1>A place for<br>your next move.</h1><p>Your portfolio, your opportunities, your Point of view.</p></div>
                <div class="point-auth-story-footer"><span class="point-auth-line" aria-hidden="true"></span><span>Considered investing. Connected thinking.</span></div>
            </section>
            <section class="point-auth-panel" aria-label="Account access">
                <a class="point-auth-back" href="landing.html"><span aria-hidden="true">←</span> Back to Point</a>
                <div id="point-auth-loading" class="point-auth-loading" role="status"><span class="point-auth-spinner" aria-hidden="true"></span>Checking your session…</div>
                <div id="point-auth-content" class="point-auth-content" hidden>
                    <p class="point-auth-eyebrow">Your Point account</p>
                    <h2 id="point-auth-title">Welcome back.</h2>
                    <p id="point-auth-description" class="point-auth-description">Sign in to continue to your Point workspace.</p>
                    <div id="point-auth-error" class="point-auth-error" role="alert" tabindex="-1" hidden></div>
                    <button id="point-auth-retry" class="point-auth-retry" type="button" hidden>Retry connection</button>
                    <form id="point-auth-form" novalidate aria-labelledby="point-auth-title">
                        <div class="point-auth-field" data-signup-only hidden><label for="point-auth-name">Full name</label><input id="point-auth-name" name="name" type="text" autocomplete="name" minlength="2" maxlength="80" aria-describedby="point-auth-name-error" required disabled><p id="point-auth-name-error" class="point-auth-field-error" aria-live="polite"></p></div>
                        <div class="point-auth-field"><label for="point-auth-email">Email address</label><input id="point-auth-email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" autocapitalize="none" spellcheck="false" aria-describedby="point-auth-email-error" required><p id="point-auth-email-error" class="point-auth-field-error" aria-live="polite"></p></div>
                        <div class="point-auth-field"><label for="point-auth-password">Password</label><div class="point-auth-password-wrap"><input id="point-auth-password" name="password" type="password" autocomplete="current-password" maxlength="128" aria-describedby="point-auth-password-error" required><button id="point-auth-password-toggle" type="button" aria-label="Show password" aria-pressed="false" aria-controls="point-auth-password point-auth-confirm">Show</button></div><p id="point-auth-password-hint" class="point-auth-hint" hidden>Use at least 12 characters. A memorable phrase works well.</p><p id="point-auth-password-error" class="point-auth-field-error" aria-live="polite"></p></div>
                        <div class="point-auth-field" data-signup-only hidden><label for="point-auth-confirm">Confirm password</label><input id="point-auth-confirm" name="confirm" type="password" autocomplete="new-password" maxlength="128" aria-describedby="point-auth-confirm-error" required disabled><p id="point-auth-confirm-error" class="point-auth-field-error" aria-live="polite"></p></div>
                        <button id="point-auth-submit" class="point-auth-submit" type="submit">Sign in</button>
                    </form>
                    <p class="point-auth-switch-row"><span id="point-auth-switch-copy">New to Point?</span> <button id="point-auth-switch" type="button">Create an account</button></p>
                </div>
                <p class="point-auth-panel-footer">Your perspective starts here.</p>
            </section>`;
        document.body.appendChild(root);
        form = root.querySelector('#point-auth-form');
        form.addEventListener('submit', submit);
        root.querySelector('#point-auth-switch').addEventListener('click', function () {
            if (busy || checking) return;
            mode = mode === 'login' ? 'signup' : 'login';
            renderMode();
            form.elements.namedItem(mode === 'signup' ? 'name' : 'email').focus();
        });
        root.querySelector('#point-auth-password-toggle').addEventListener('click', function () {
            setPasswordVisible(form.elements.namedItem('password').type === 'password');
        });
        root.querySelector('#point-auth-retry').addEventListener('click', checkSession);
        renderMode();
        checkSession();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
})();
