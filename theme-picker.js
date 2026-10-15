(function(root, factory){
  'use strict';
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root && root.document) root.PointThemePicker = api;
})(typeof window !== 'undefined' ? window : null, function(){
  'use strict';

  const storageKey = 'point-palette';
  const palettes = Object.freeze([
    {id:'soft-blue', name:'Soft Blue', colors:['#CDDFF5','#C9E8E0','#F8E7B0','#E4D7F6']},
    {id:'coastal', name:'Coastal', colors:['#C8E4F0','#BFE3DA','#F2DFC0','#D3DDF3']},
    {id:'botanical', name:'Botanical', colors:['#D4E5CC','#C6E1DC','#E9E2B8','#E4D6E8']},
    {id:'sunset', name:'Sunset', colors:['#F4D2BD','#F1DDB5','#E8CDD7','#D9D6EF']},
    {id:'orchid', name:'Orchid', colors:['#DED3F1','#C9DDF1','#ECD1DF','#D5E6D7']},
    {id:'stone', name:'Stone', colors:['#E3DDD1','#CCDCD7','#E6D8BF','#D9D6E3']}
  ].map(function(palette){
    Object.freeze(palette.colors);
    return Object.freeze(palette);
  }));
  const groups = ['ws','pf','mk','dp'];
  const instances = new WeakMap();
  let sequence = 0;

  function normalizePalette(id){
    return palettes.some(function(palette){ return palette.id === id; }) ? id : palettes[0].id;
  }

  function rgb(hex){
    return [1,3,5].map(function(offset){ return parseInt(hex.slice(offset, offset + 2), 16); });
  }

  function hex(channels){
    return '#' + channels.map(function(channel){
      return Math.round(channel).toString(16).padStart(2, '0');
    }).join('').toUpperCase();
  }

  function mix(color, target, weight){
    const source = rgb(color);
    const destination = rgb(target);
    return hex(source.map(function(channel, index){
      return channel + (destination[index] - channel) * weight;
    }));
  }

  function inkColor(color, isLight){
    const channels = rgb(color).map(function(channel){ return channel / 255; });
    const high = Math.max.apply(null, channels);
    const low = Math.min.apply(null, channels);
    const range = high - low;
    const originalLightness = (high + low) / 2;
    let hue = 0;
    let saturation = 0;
    if(range){
      saturation = range / (1 - Math.abs(2 * originalLightness - 1));
      if(high === channels[0]) hue = ((channels[1] - channels[2]) / range + 6) % 6;
      else if(high === channels[1]) hue = (channels[2] - channels[0]) / range + 2;
      else hue = (channels[0] - channels[1]) / range + 4;
    }
    saturation = Math.min(saturation, .48);
    const lightness = isLight ? .29 : .88;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const intermediate = chroma * (1 - Math.abs(hue % 2 - 1));
    const tuples = [[chroma,intermediate,0],[intermediate,chroma,0],[0,chroma,intermediate],[0,intermediate,chroma],[intermediate,0,chroma],[chroma,0,intermediate]];
    const tuple = tuples[Math.floor(hue)] || tuples[0];
    return hex(tuple.map(function(channel){ return (channel + lightness - chroma / 2) * 255; }));
  }

  function alpha(color, opacity){
    return 'rgba(' + rgb(color).join(',') + ',' + opacity + ')';
  }

  function getTokens(id, theme){
    const selected = palettes.find(function(palette){ return palette.id === normalizePalette(id); });
    const isLight = theme === 'light';
    const tokens = {'--ws-on':'#3A342C'};
    groups.forEach(function(group, index){
      const color = selected.colors[index];
      const ink = inkColor(color, isLight);
      const prefix = '--' + group;
      tokens[prefix] = color;
      tokens[prefix + '-2'] = mix(color, '#233044', .10);
      tokens[prefix + '-ink'] = ink;
      tokens[prefix + '-soft'] = alpha(isLight ? ink : color, isLight ? .10 : .24);
      tokens[prefix + '-line'] = alpha(isLight ? ink : color, isLight ? .25 : .45);
    });
    return tokens;
  }

  function init(options){
    const trigger = options && options.trigger;
    if(!trigger || !trigger.ownerDocument) return null;
    if(instances.has(trigger)) return instances.get(trigger);
    const document = trigger.ownerDocument;
    const window = document.defaultView;
    const body = document.body;
    const setTheme = options.setTheme;
    let selected = readPalette();
    let open = false;

    function readPalette(){
      try{ return normalizePalette(window.localStorage.getItem(storageKey)); }
      catch(error){ return palettes[0].id; }
    }

    function element(tag, className, text){
      const node = document.createElement(tag);
      node.className = className;
      if(text !== undefined) node.textContent = text;
      return node;
    }

    function button(className, text){
      const node = element('button', className, text);
      node.type = 'button';
      return node;
    }

    const id = 'point-theme-picker-' + (++sequence);
    const panel = element('section', 'ptp-panel');
    panel.id = id;
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Appearance');
    panel.setAttribute('aria-describedby', id + '-description');
    const heading = element('div', 'ptp-heading');
    heading.appendChild(element('h2', 'ptp-title', 'Appearance'));
    const closeButton = button('ptp-close', '\u00D7');
    closeButton.setAttribute('aria-label', 'Close appearance settings');
    heading.appendChild(closeButton);
    panel.appendChild(heading);

    const modeGroup = element('div', 'ptp-modes');
    modeGroup.setAttribute('role', 'group');
    modeGroup.setAttribute('aria-label', 'Display mode');
    const modeButtons = ['light','dark'].map(function(mode){
      const modeButton = button('ptp-mode', mode === 'light' ? 'Light' : 'Dark');
      modeButton.dataset.themeMode = mode;
      modeButton.addEventListener('click', function(){
        if(typeof setTheme === 'function') setTheme(mode);
        apply();
      });
      modeGroup.appendChild(modeButton);
      return modeButton;
    });
    panel.appendChild(modeGroup);
    panel.appendChild(element('h3', 'ptp-label', 'Color sets'));
    const description = element('p', 'ptp-description', 'Four colors for Workspace, Portfolio, Market and Deploy.');
    description.id = id + '-description';
    panel.appendChild(description);
    const paletteGroup = element('div', 'ptp-palettes');
    paletteGroup.setAttribute('role', 'group');
    paletteGroup.setAttribute('aria-label', 'Color sets');
    const paletteButtons = palettes.map(function(palette){
      const paletteButton = button('ptp-palette');
      paletteButton.dataset.palette = palette.id;
      paletteButton.setAttribute('aria-label', palette.name + ' color set');
      paletteButton.appendChild(element('span', 'ptp-name', palette.name));
      const swatches = element('span', 'ptp-swatches');
      swatches.setAttribute('aria-hidden', 'true');
      palette.colors.forEach(function(color){
        const swatch = element('span', 'ptp-swatch');
        swatch.style.backgroundColor = color;
        swatches.appendChild(swatch);
      });
      paletteButton.appendChild(swatches);
      const check = element('span', 'ptp-check', '\u2713');
      check.setAttribute('aria-hidden', 'true');
      paletteButton.appendChild(check);
      paletteButton.addEventListener('click', function(){
        selected = palette.id;
        try{ window.localStorage.setItem(storageKey, selected); }catch(error){}
        apply();
      });
      paletteGroup.appendChild(paletteButton);
      return paletteButton;
    });
    panel.appendChild(paletteGroup);
    panel.appendChild(element('p', 'ptp-footnote', 'Your choice is saved on this browser.'));
    body.appendChild(panel);
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Appearance settings');
    trigger.setAttribute('title', 'Appearance settings');

    function currentTheme(){
      return body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function apply(){
      const theme = currentTheme();
      const tokens = getTokens(selected, theme);
      Object.keys(tokens).forEach(function(name){ body.style.setProperty(name, tokens[name]); });
      const tone = groups.includes(body.getAttribute('data-tone')) ? body.getAttribute('data-tone') : 'ws';
      ['', '-2', '-ink', '-soft', '-line'].forEach(function(suffix){
        body.style.setProperty('--accent' + suffix, tokens['--' + tone + suffix]);
      });
      body.style.setProperty('--accent-weak', tokens['--' + tone + '-soft']);
      body.setAttribute('data-palette', selected);
      paletteButtons.forEach(function(paletteButton){
        paletteButton.setAttribute('aria-pressed', String(paletteButton.dataset.palette === selected));
      });
      modeButtons.forEach(function(modeButton){
        modeButton.setAttribute('aria-pressed', String(modeButton.dataset.themeMode === theme));
      });
    }

    function position(){
      if(!open) return;
      const bounds = trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const width = viewport ? viewport.width : window.innerWidth;
      const height = viewport ? viewport.height : window.innerHeight;
      const leftOffset = viewport ? viewport.offsetLeft : 0;
      const topOffset = viewport ? viewport.offsetTop : 0;
      panel.style.maxHeight = Math.max(100, height - 24) + 'px';
      panel.style.maxWidth = Math.max(160, width - 24) + 'px';
      const panelBounds = panel.getBoundingClientRect();
      const left = Math.max(leftOffset + 12, Math.min(bounds.right - panelBounds.width, leftOffset + width - panelBounds.width - 12));
      const top = Math.max(topOffset + 12, Math.min(bounds.bottom + 10, topOffset + height - panelBounds.height - 12));
      panel.style.left = Math.round(left) + 'px';
      panel.style.top = Math.round(top) + 'px';
    }

    function close(restoreFocus){
      open = false;
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if(restoreFocus) trigger.focus();
    }

    function toggle(){
      if(open){ close(false); return; }
      open = true;
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      position();
      paletteButtons.find(function(paletteButton){ return paletteButton.dataset.palette === selected; }).focus();
    }

    function outside(event){
      if(open && !panel.contains(event.target) && !trigger.contains(event.target)) close(false);
    }

    function escape(event){
      if(open && event.key === 'Escape'){
        event.preventDefault();
        event.stopPropagation();
        close(true);
      }
    }

    function paletteKeys(event){
      const index = paletteButtons.indexOf(event.target);
      if(index < 0) return;
      let next;
      if(event.key === 'ArrowDown') next = (index + 1) % paletteButtons.length;
      else if(event.key === 'ArrowUp') next = (index + paletteButtons.length - 1) % paletteButtons.length;
      else if(event.key === 'Home') next = 0;
      else if(event.key === 'End') next = paletteButtons.length - 1;
      else return;
      event.preventDefault();
      paletteButtons[next].focus();
    }

    function storage(event){
      if(event.key === storageKey || event.key === null){
        selected = readPalette();
        apply();
      }
    }

    const observer = new window.MutationObserver(apply);
    observer.observe(body, {attributes:true, attributeFilter:['data-theme','data-tone']});
    trigger.addEventListener('click', toggle);
    closeButton.addEventListener('click', function(){ close(true); });
    paletteGroup.addEventListener('keydown', paletteKeys);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    window.addEventListener('storage', storage);
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize', position);
      window.visualViewport.addEventListener('scroll', position);
    }
    apply();

    const controller = {
      close:function(){ close(true); },
      getPalette:function(){ return selected; },
      destroy:function(){
        observer.disconnect();
        trigger.removeEventListener('click', toggle);
        document.removeEventListener('pointerdown', outside);
        document.removeEventListener('keydown', escape);
        window.removeEventListener('resize', position);
        window.removeEventListener('scroll', position, true);
        window.removeEventListener('storage', storage);
        if(window.visualViewport){
          window.visualViewport.removeEventListener('resize', position);
          window.visualViewport.removeEventListener('scroll', position);
        }
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('aria-controls');
        panel.remove();
        instances.delete(trigger);
      }
    };
    instances.set(trigger, controller);
    return controller;
  }

  return {palettes:palettes, storageKey:storageKey, normalizePalette:normalizePalette, getTokens:getTokens, init:init};
});
