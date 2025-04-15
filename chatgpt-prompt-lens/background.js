chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // 如果已經有浮窗，點 icon 就移除它（收起）
            const oldSummary = document.getElementById('user-prompts-summary');
            if (oldSummary) {
                oldSummary.remove();
                return;
            }

            // 給所有使用者提問加上唯一 ID
            const prompts = [];
            document.querySelectorAll('div[data-message-author-role="user"]').forEach((el, index) => {
                const container = el.closest('div[class*="message"]');
                if (container) {
                    const id = `user-prompt-${index}`;
                    container.setAttribute('id', id);
                    let text = el.innerText.trim();
                    if (text.length > 0) {
                        text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        prompts.push({ text, id });
                    }
                }
            });

            // 建立浮動提問區塊
            const summaryBox = document.createElement('div');
            summaryBox.id = 'user-prompts-summary';
            summaryBox.style.position = 'fixed';
            summaryBox.style.top = '50%';
            summaryBox.style.right = '20px';
            summaryBox.style.transform = 'translateY(-50%)';
            summaryBox.style.width = '300px';
            summaryBox.style.maxHeight = '70vh';
            summaryBox.style.overflowY = 'auto';
            summaryBox.style.backgroundColor = 'white';
            summaryBox.style.padding = '12px 16px 12px 12px';
            summaryBox.style.borderRadius = '12px';
            summaryBox.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
            summaryBox.style.zIndex = '9999';
            summaryBox.style.fontSize = '14px';
            summaryBox.style.lineHeight = '1.5';

            // 建立關閉按鈕
            const closeBtn = document.createElement('div');
            closeBtn.innerText = '✕';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '8px';
            closeBtn.style.right = '10px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.fontSize = '16px';
            closeBtn.style.fontWeight = 'bold';
            closeBtn.style.color = '#888';
            closeBtn.title = '關閉';
            closeBtn.onclick = () => summaryBox.remove();
            summaryBox.appendChild(closeBtn);

            // 建立有序清單
            const listItems = prompts.map(p => {
                return `<li style="list-style-type: decimal; margin: 1em;">
                  <a href="#${p.id}" 
                     style="text-decoration: none; color: #007bff;"
                     onclick="document.getElementById('${p.id}').scrollIntoView({behavior: 'smooth', block: 'center'})">
                    ${p.text}
                  </a>
                </li>`;
            }).join('');

            const ol = document.createElement('ol');
            ol.style.paddingLeft = '1.2em';
            ol.style.marginTop = '1.5em';
            ol.innerHTML = listItems;

            const title = document.createElement('b');
            title.textContent = '使用者提問：';

            summaryBox.appendChild(title);
            summaryBox.appendChild(ol);
            document.body.appendChild(summaryBox);
        }
    });
});