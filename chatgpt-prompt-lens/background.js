chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const generatePromptSummary = () => {
        // Remove previous floating panel if exists
        const existing = document.getElementById('user-prompts-summary');
        if (existing) existing.remove();

        // Collect user prompts
        const prompts = [];
        document.querySelectorAll('div[data-message-author-role="user"]').forEach((el, index) => {
          const container = el.closest('div[class*="message"]');
          if (container) {
            const id = `user-prompt-${index}`;
            container.setAttribute('id', id);
            let text = el.innerText.trim();
            if (text.length > 0) {
              text = text.length > 128 ? text.slice(0, 128) + '...' : text;
              text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
              prompts.push({ text, id });
            }
          }
        });

        // Create floating panel
        const box = document.createElement('div');
        box.id = 'user-prompts-summary';
        box.style.position = 'fixed';
        box.style.top = '50%';
        box.style.right = '20px';
        box.style.transform = 'translateY(-50%)';
        box.style.width = '300px';
        box.style.maxHeight = '70vh';
        box.style.overflowY = 'auto';
        box.style.padding = '12px 16px 12px 12px';
        box.style.borderRadius = '12px';
        box.style.zIndex = '9999';
        box.style.fontSize = '14px';
        box.style.lineHeight = '1.5';

        // Apply dark or light theme based on ChatGPT site
        const isDarkMode = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
        box.style.backgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
        box.style.color = isDarkMode ? '#f5f5f5' : '#000000';
        box.style.boxShadow = isDarkMode
          ? '0 0 10px rgba(255, 255, 255, 0.2)'
          : '0 0 10px rgba(0, 0, 0, 0.2)';
        const linkColor = isDarkMode ? 'cyan' : '#1b7396';

        // Close button
        const closeBtn = document.createElement('div');
        closeBtn.innerText = '✕';
        Object.assign(closeBtn.style, {
          position: 'absolute',
          top: '8px',
          right: '10px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#888'
        });
        closeBtn.title = 'Close';
        closeBtn.onclick = () => box.remove();
        box.appendChild(closeBtn);

        // Draggable handle
        const dragHandle = document.createElement('div');
        dragHandle.innerText = '⋮ User Prompts';
        Object.assign(dragHandle.style, {
          cursor: 'move',
          height: '20px',
          marginBottom: '8px',
          fontWeight: 'bold',
          color: isDarkMode ? '#ccc' : '#333'
        });
        box.appendChild(dragHandle);

        // Drag logic
        let offsetX = 0, offsetY = 0, dragging = false;
        dragHandle.addEventListener('mousedown', (e) => {
          dragging = true;
          offsetX = e.clientX - box.getBoundingClientRect().left;
          offsetY = e.clientY - box.getBoundingClientRect().top;
          box.style.transition = 'none';
        });
        document.addEventListener('mousemove', (e) => {
          if (dragging) {
            box.style.transform = 'none';
            box.style.left = `${e.clientX - offsetX}px`;
            box.style.top = `${e.clientY - offsetY}px`;
            box.style.bottom = 'unset';
            box.style.right = 'unset';
          }
        });
        document.addEventListener('mouseup', () => { dragging = false; });

        // Create prompt list
        const ol = document.createElement('ol');
        ol.style.paddingLeft = '1.2em';
        ol.style.marginTop = '1.5em';
        ol.innerHTML = prompts.map(p => {
          return `<li style="list-style-type: decimal; margin: 1em;">
                    <a href="#${p.id}"
                       style="text-decoration: none; color: ${linkColor};"
                       onclick="document.getElementById('${p.id}').scrollIntoView({behavior: 'smooth', block: 'center'})">
                      ${p.text}
                    </a>
                  </li>`;
        }).join('');
        box.appendChild(ol);

        // Insert into DOM
        document.body.appendChild(box);
      };

      // Rebuild when chat switches
      const observer = new MutationObserver(() => {
        if (document.getElementById('user-prompts-summary')) {
          generatePromptSummary();
        }
      });
      const root = document.querySelector('main');
      if (root) {
        observer.observe(root, { childList: true, subtree: true });
      }

      // Toggle prompt panel
      const existing = document.getElementById('user-prompts-summary');
      if (existing) {
        existing.remove();
      } else {
        generatePromptSummary();
      }

      const watchThemeChange = () => {
        const target = document.documentElement; // <html> tag
        const observer = new MutationObserver(() => {
          const box = document.getElementById('user-prompts-summary');
          if (!box) return;

          const isDarkMode = target.classList.contains('dark') || document.body.classList.contains('dark');

          box.style.backgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
          box.style.color = isDarkMode ? '#f5f5f5' : '#000000';
          box.style.boxShadow = isDarkMode
            ? '0 0 10px rgba(255, 255, 255, 0.2)'
            : '0 0 10px rgba(0, 0, 0, 0.2)';

          // Also update link colors
          document.querySelectorAll('#user-prompts-summary a').forEach(a => {
            a.style.color = isDarkMode ? 'cyan' : '#1b7396';
          });

          // Optional: update drag handle color
          const handle = document.querySelector('#user-prompts-summary div');
          if (handle) {
            handle.style.color = isDarkMode ? '#ccc' : '#333';
          }
        });

        observer.observe(target, { attributes: true, attributeFilter: ['class'] });
      };

      watchThemeChange(); // call it once

    }
  });
});