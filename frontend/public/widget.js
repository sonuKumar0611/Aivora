(function () {
  'use strict';
  var script = document.currentScript;
  var botId = script && (script.getAttribute('data-agent') || script.getAttribute('data-bot'));
  var apiBase = (script && script.getAttribute('data-api')) || '';
  if (!botId || !apiBase) return;

  var conversationId = null;
  var botName = 'Chat';

  /* Theme: Aivora brand – violet primary, soft backgrounds */
  var colors = {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryLight: 'rgba(99, 102, 241, 0.12)',
    headerBg: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    surface: '#ffffff',
    surfaceSoft: '#f8fafc',
    border: '#e2e8f0',
    text: '#1e293b',
    textMuted: '#64748b',
    userBubble: '#6366f1',
    botBubble: '#f1f5f9',
    poweredBy: '#94a3b8',
  };

  var styles = {
    container: 'position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;',
    button: 'width:56px;height:56px;border-radius:50%;background:' + colors.headerBg + ';color:#fff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;transition:transform .2s, box-shadow .2s;',
    buttonHover: 'transform:scale(1.05);box-shadow:0 6px 20px rgba(99,102,241,0.5);',
    panel: 'position:absolute;bottom:70px;right:0;width:392px;max-width:calc(100vw - 48px);height:520px;max-height:75vh;background:' + colors.surface + ';border-radius:20px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px ' + colors.border + ';display:flex;flex-direction:column;overflow:hidden;',
    header: 'padding:18px 20px;background:' + colors.headerBg + ';color:#fff;font-weight:600;font-size:1.0625rem;letter-spacing:-0.01em;',
    messages: 'flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;background:' + colors.surfaceSoft + ';',
    msgUser: 'align-self:flex-end;max-width:85%;padding:12px 16px;background:' + colors.userBubble + ';color:#fff;border-radius:18px 18px 4px 18px;font-size:0.9375rem;line-height:1.45;box-shadow:0 2px 8px rgba(99,102,241,0.25);',
    msgBot: 'align-self:flex-start;max-width:85%;padding:12px 16px;background:' + colors.botBubble + ';color:' + colors.text + ';border-radius:18px 18px 18px 4px;font-size:0.9375rem;line-height:1.45;border:1px solid ' + colors.border + ';',
    inputRow: 'display:flex;gap:10px;padding:14px 16px;border-top:1px solid ' + colors.border + ';background:' + colors.surface + ';',
    input: 'flex:1;padding:12px 16px;border:1px solid ' + colors.border + ';border-radius:14px;outline:none;font-size:0.9375rem;background:' + colors.surface + ';color:' + colors.text + ';transition:border-color .2s, box-shadow .2s;',
    sendBtn: 'padding:12px 20px;background:' + colors.primary + ';color:#fff;border:none;border-radius:14px;cursor:pointer;font-weight:600;font-size:0.9375rem;transition:background .2s;',
    poweredBy: 'padding:8px 16px;text-align:center;font-size:0.75rem;color:' + colors.poweredBy + ';border-top:1px solid ' + colors.border + ';background:' + colors.surface + ';',
    hidden: 'display:none !important;',
  };

  var root = document.createElement('div');
  root.id = 'aivora-widget-root';
  root.setAttribute('aria-live', 'polite');
  root.style.cssText = styles.container;

  var bubble = document.createElement('button');
  bubble.type = 'button';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  bubble.style.cssText = styles.button;
  bubble.onmouseover = function () { bubble.style.cssText = styles.button + styles.buttonHover; };
  bubble.onmouseout = function () { bubble.style.cssText = styles.button; };

  var headerEl = document.createElement('div');
  headerEl.className = 'aivora-header';
  headerEl.style.cssText = styles.header;
  headerEl.textContent = botName;

  var messagesEl = document.createElement('div');
  messagesEl.className = 'aivora-messages';
  messagesEl.style.cssText = styles.messages;

  var inputEl = document.createElement('input');
  inputEl.type = 'text';
  inputEl.className = 'aivora-input';
  inputEl.placeholder = 'Type a message...';
  inputEl.style.cssText = styles.input;

  var sendBtn = document.createElement('button');
  sendBtn.type = 'button';
  sendBtn.className = 'aivora-send';
  sendBtn.style.cssText = styles.sendBtn;
  sendBtn.textContent = 'Send';

  var inputRow = document.createElement('div');
  inputRow.className = 'aivora-input-row';
  inputRow.style.cssText = styles.inputRow;
  inputRow.appendChild(inputEl);
  inputRow.appendChild(sendBtn);

  var poweredEl = document.createElement('div');
  poweredEl.className = 'aivora-powered';
  poweredEl.style.cssText = styles.poweredBy;
  poweredEl.innerHTML = 'Powered by <strong style="color:#6366f1">Aivora™</strong>';

  var panel = document.createElement('div');
  panel.className = 'aivora-panel';
  panel.style.cssText = styles.panel + styles.hidden;
  panel.appendChild(headerEl);
  panel.appendChild(messagesEl);
  panel.appendChild(inputRow);
  panel.appendChild(poweredEl);

  function setBotName(name) {
    botName = name && name.trim() ? name.trim() : 'Chat';
    headerEl.textContent = botName;
  }

  function appendMessage(role, text) {
    var div = document.createElement('div');
    div.className = role === 'user' ? 'aivora-msg-user' : 'aivora-msg-bot';
    div.style.cssText = role === 'user' ? styles.msgUser : styles.msgBot;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setLoading(on) {
    sendBtn.disabled = on;
    sendBtn.textContent = on ? '…' : 'Send';
  }

  function send() {
    var text = (inputEl.value || '').trim();
    if (!text) return;
    inputEl.value = '';
    appendMessage('user', text);
    setLoading(true);
    var payload = { message: text };
    if (conversationId) payload.conversationId = conversationId;
    fetch(apiBase + '/api/chat/' + botId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, status: r.status, data: data };
        });
      })
      .then(function (res) {
        if (res.ok && res.data.data && res.data.data.reply) {
          conversationId = res.data.data.conversationId || conversationId;
          appendMessage('assistant', res.data.data.reply);
        } else {
          var msg = 'Sorry, something went wrong. Please try again.';
          if (!res.ok && res.data && typeof res.data.message === 'string' && res.data.message.length > 0 && res.data.message.length < 200) {
            msg = res.data.message;
          }
          appendMessage('assistant', msg);
        }
      })
      .catch(function () {
        appendMessage('assistant', 'Sorry, we could not reach the server. Please try again.');
      })
      .then(function () { setLoading(false); });
  }

  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); send(); }
  });
  inputEl.addEventListener('focus', function () {
    inputEl.style.borderColor = colors.primary;
    inputEl.style.boxShadow = '0 0 0 2px ' + colors.primaryLight;
  });
  inputEl.addEventListener('blur', function () {
    inputEl.style.borderColor = colors.border;
    inputEl.style.boxShadow = 'none';
  });
  sendBtn.addEventListener('mouseover', function () {
    if (!sendBtn.disabled) sendBtn.style.background = colors.primaryHover;
  });
  sendBtn.addEventListener('mouseout', function () {
    sendBtn.style.background = colors.primary;
  });

  var open = false;
  bubble.addEventListener('click', function () {
    open = !open;
    panel.style.cssText = open ? styles.panel : styles.panel + styles.hidden;
  });

  root.appendChild(panel);
  root.appendChild(bubble);
  document.body.appendChild(root);

  fetch(apiBase + '/api/embed/bot/' + botId, { method: 'GET' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data && data.data && data.data.name) setBotName(data.data.name);
    })
    .catch(function () {});
})();
