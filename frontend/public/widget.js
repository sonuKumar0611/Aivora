(function () {
  'use strict';
  var script = document.currentScript;
  var botId = script && script.getAttribute('data-bot');
  var apiBase = (script && script.getAttribute('data-api')) || '';
  if (!botId || !apiBase) return;

  var conversationId = null;
  var root = document.createElement('div');
  root.id = 'aivora-widget-root';
  root.setAttribute('aria-live', 'polite');

  var styles = {
    container: 'position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;font-size:14px;',
    button: 'width:56px;height:56px;border-radius:50%;background:#18181b;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;transition:transform .2s;',
    buttonHover: 'transform:scale(1.05);',
    panel: 'position:absolute;bottom:70px;right:0;width:380px;max-width:calc(100vw - 48px);height:480px;max-height:70vh;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.12);display:flex;flex-direction:column;overflow:hidden;',
    header: 'padding:16px;background:#18181b;color:#fff;font-weight:600;',
    messages: 'flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:#fafafa;',
    msgUser: 'align-self:flex-end;max-width:85%;padding:10px 14px;background:#18181b;color:#fff;border-radius:16px 16px 4px 16px;',
    msgBot: 'align-self:flex-start;max-width:85%;padding:10px 14px;background:#e4e4e7;color:#18181b;border-radius:16px 16px 16px 4px;',
    inputRow: 'display:flex;gap:8px;padding:12px;border-top:1px solid #e4e4e7;background:#fff;',
    input: 'flex:1;padding:10px 14px;border:1px solid #d4d4d8;border-radius:12px;outline:none;font-size:14px;',
    sendBtn: 'padding:10px 16px;background:#18181b;color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:500;',
    hidden: 'display:none !important;',
  };

  var bubble = document.createElement('button');
  bubble.type = 'button';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  bubble.style.cssText = styles.button;
  bubble.onmouseover = function () { bubble.style.cssText = styles.button + styles.buttonHover; };
  bubble.onmouseout = function () { bubble.style.cssText = styles.button; };

  var panel = document.createElement('div');
  panel.style.cssText = styles.panel + styles.hidden;
  panel.innerHTML =
    '<div class="aivora-header" style="' + styles.header + '">Chat</div>' +
    '<div class="aivora-messages" style="' + styles.messages + '"></div>' +
    '<div class="aivora-input-row" style="' + styles.inputRow + '">' +
    '<input type="text" class="aivora-input" placeholder="Type a message..." style="' + styles.input + '" />' +
    '<button type="button" class="aivora-send" style="' + styles.sendBtn + '">Send</button>' +
    '</div>';

  var messagesEl = panel.querySelector('.aivora-messages');
  var inputEl = panel.querySelector('.aivora-input');
  var sendBtn = panel.querySelector('.aivora-send');

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
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.data && data.data.reply) {
          conversationId = data.data.conversationId || conversationId;
          appendMessage('assistant', data.data.reply);
        } else {
          appendMessage('assistant', 'Sorry, something went wrong. Please try again.');
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

  var open = false;
  bubble.addEventListener('click', function () {
    open = !open;
    panel.style.cssText = open ? styles.panel : styles.panel + styles.hidden;
  });

  root.style.cssText = styles.container;
  root.appendChild(panel);
  root.appendChild(bubble);
  document.body.appendChild(root);
})();
