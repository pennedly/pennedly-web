/* mobile/sprite.js — injects one inline SVG sprite of calm 24-grid line icons
   (1.8 stroke, round caps/joins) used by every phone mockup. Keeps the spec
   files DRY. Reference with <svg class="ic"><use href="#i-nib"/></svg>. */
(function () {
  var SVG = [
    '<svg aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden" xmlns="http://www.w3.org/2000/svg">',
    '<defs>',
    sym('nib', '<path d="M4 20 L13 11"/><path d="M12 4 L20 12 L13 11 L13 4 Z"/><circle cx="6" cy="18" r="0.6"/>'),
    sym('feed', '<path d="M3 12h4l2 5 4-12 2 7h6"/>'),
    sym('bubble', '<path d="M5 17l-1.5 3.5L8 19h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v6a3 3 0 0 0 1 2.7Z"/>'),
    sym('advisor', '<path d="M4 16V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 4v-4Z"/><path d="M8 13l2.6-2.6 1.8 1.8L16 9"/><path d="M13.4 9H16v2.6"/>'),
    sym('at', '<circle cx="12" cy="12" r="3.4"/><path d="M15.4 12v1.4a2.3 2.3 0 0 0 4.6 0V12a8 8 0 1 0-3.2 6.4"/>'),
    sym('grid', '<circle cx="6" cy="6" r="1.3"/><circle cx="12" cy="6" r="1.3"/><circle cx="18" cy="6" r="1.3"/><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/><circle cx="6" cy="18" r="1.3"/><circle cx="12" cy="18" r="1.3"/><circle cx="18" cy="18" r="1.3"/>'),
    sym('chart', '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12.5" y="8" width="3" height="9"/><rect x="18" y="14" width="0" height="3"/><path d="M18 17v-6"/>'),
    sym('audit', '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5h6V7H9Z"/><path d="M8.5 12.5l2 2 4-4.5"/>'),
    sym('layers', '<path d="M12 4 3 9l9 5 9-5-9-5Z"/><path d="M3 14l9 5 9-5"/>'),
    sym('compass', '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z"/>'),
    sym('overview', '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
    sym('voice', '<path d="M4 12h2l2-5 3 11 3-15 2.5 9H20"/>'),
    sym('sliders', '<path d="M5 7h9"/><circle cx="17" cy="7" r="2"/><path d="M19 7h0"/><path d="M5 17h2"/><circle cx="10" cy="17" r="2"/><path d="M13 17h6"/>'),
    sym('repeat', '<path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/>'),
    sym('gift', '<path d="M20 11v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8"/><path d="M3 7.5h18V11H3z"/><path d="M12 7.5V20"/><path d="M12 7.5S10.5 3.5 8 4a2 2 0 0 0 0 3.5ZM12 7.5S13.5 3.5 16 4a2 2 0 0 1 0 3.5Z"/>'),
    sym('autopilot', '<circle cx="12" cy="12" r="8.5"/><path d="M12 12 9 9"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2"/>'),
    sym('settings', '<circle cx="12" cy="12" r="3"/><path d="M12 4.5v-1M12 20.5v-1M5 7.5l-.8-.6M19.8 17.1l-.8-.6M5 16.5l-.8.6M19.8 6.9l-.8.6M3.5 12h-1M21.5 12h-1"/><path d="M9.3 5.2l-.4-1M15.1 19.8l-.4-1M5.2 14.7l-1 .4M19.8 8.9l-1 .4M5.2 9.3l-1-.4M19.8 15.1l-1-.4M9.3 18.8l-.4 1M15.1 4.2l-.4 1" opacity="0"/>'),
    sym('logout', '<path d="M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/><path d="M10 12h10M17 9l3 3-3 3"/>'),
    sym('plus', '<path d="M12 5v14M5 12h14"/>'),
    sym('check', '<path d="M5 12.5l4.5 4.5L19 7"/>'),
    sym('more', '<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>'),
    sym('menu', '<path d="M4 7h16M4 12h16M4 17h16"/>'),
    sym('chev-down', '<path d="M6 9l6 6 6-6"/>'),
    sym('chev-right', '<path d="M9 6l6 6-6 6"/>'),
    sym('arrow-left', '<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    sym('arrow-up', '<path d="M12 19V5M6 11l6-6 6 6"/>'),
    sym('arrow-down', '<path d="M12 5v14M6 13l6 6 6-6"/>'),
    sym('globe', '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.2 2.5 14.8 0 17M12 3.5c-2.5 2.2-2.5 14.8 0 17"/>'),
    sym('external', '<path d="M14 5h5v5"/><path d="M19 5l-8 8"/><path d="M18 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>'),
    sym('sparkle', '<path d="M12 4l1.6 4.8L18 10l-4.4 1.2L12 16l-1.6-4.8L6 10l4.4-1.2L12 4Z"/>'),
    sym('tweak', '<path d="M5 19l9-9"/><path d="M14.5 5.5l1 1"/><path d="M16 4l1.5 1.5L19 7l1.5-1.5L19 4l-1.5-1.5L16 4Z"/><path d="M5 12l1.2-1.2"/>'),
    sym('pencil', '<path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z"/><path d="M14 7l3 3"/>'),
    sym('trash', '<path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13"/>'),
    sym('undo', '<path d="M9 7L5 11l4 4"/><path d="M5 11h9a5 5 0 0 1 0 10h-3"/>'),
    sym('send', '<path d="M5 12l15-7-7 15-2.5-5.5L5 12Z"/>'),
    sym('heart', '<path d="M12 20s-7-4.6-7-9.5A3.6 3.6 0 0 1 12 7a3.6 3.6 0 0 1 7 3.5C19 15.4 12 20 12 20Z"/>'),
    sym('repost', '<path d="M5 9V8a3 3 0 0 1 3-3h8l-2-2M19 15v1a3 3 0 0 1-3 3H8l2 2M16 5l2.5 2.5M8 19l-2.5-2.5"/>'),
    sym('eye', '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>'),
    sym('clock', '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    sym('calendar', '<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3.5v4M15.5 3.5v4"/>'),
    sym('x', '<path d="M6 6l12 12M18 6L6 18"/>'),
    sym('moon', '<path d="M20 13a8 8 0 1 1-9-9 6.5 6.5 0 0 0 9 9Z"/>'),
    sym('sun', '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.5 4.5l1.5 1.5M18 18l1.5 1.5M3 12h2M19 12h2M4.5 19.5l1.5-1.5M18 6l1.5-1.5"/>'),
    sym('reply', '<path d="M9 7L4 11l5 4"/><path d="M4 11h8a6 6 0 0 1 6 6v2"/>'),
    sym('search', '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>'),
    sym('quote', '<path d="M7 7h4v5a4 4 0 0 1-4 4M13 7h4v5a4 4 0 0 1-4 4"/>'),
    sym('link', '<path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5"/>'),
    sym('mail', '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7.5l8 5.5 8-5.5"/>'),
    sym('alert', '<path d="M12 4 2.5 20.5h19L12 4Z"/><path d="M12 10v4"/><circle cx="12" cy="17.4" r="0.6" fill="currentColor" stroke="none"/>'),
    sym('users', '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.3a3 3 0 0 1 0 5.4M17.5 19a5.5 5.5 0 0 0-3-4.9"/>'),
    sym('at-small', '<circle cx="12" cy="12" r="3"/><path d="M15 12v1a2 2 0 0 0 4 0v-1a7 7 0 1 0-2.8 5.6"/>'),
    '<symbol id="i-signal" viewBox="0 0 24 18" fill="currentColor"><rect x="1" y="11" width="3.5" height="6" rx="1"/><rect x="7" y="8" width="3.5" height="9" rx="1"/><rect x="13" y="5" width="3.5" height="12" rx="1"/><rect x="19" y="2" width="3.5" height="15" rx="1"/></symbol>',
    '<symbol id="i-wifi" viewBox="0 0 26 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6.5a14 14 0 0 1 20 0"/><path d="M6.5 10a9 9 0 0 1 13 0"/><path d="M10 13.5a4 4 0 0 1 6 0"/><circle cx="13" cy="16.5" r="0.6" fill="currentColor" stroke="none"/></symbol>',
    '<symbol id="i-battery" viewBox="0 0 30 16" fill="none"><rect x="1" y="2" width="23" height="12" rx="3" stroke="currentColor" stroke-width="1.4" opacity="0.5"/><rect x="3" y="4" width="17" height="8" rx="1.5" fill="currentColor"/><rect x="25.5" y="6" width="2" height="4" rx="1" fill="currentColor" opacity="0.5"/></symbol>',
    '</defs></svg>'
  ].join('');

  function sym(id, body) {
    return '<symbol id="i-' + id + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + body + '</symbol>';
  }

  function inject() {
    if (document.getElementById('__pennedly_sprite')) return;
    var d = document.createElement('div');
    d.id = '__pennedly_sprite';
    d.innerHTML = SVG;
    document.body.insertBefore(d, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
