function updateEditorUI(errorLine = -1) {
  const codeInput = document.getElementById('code-input');
  const lineNumbers = document.getElementById('line-numbers');
  const highlights = document.getElementById('highlights');
  
  if (!codeInput || !lineNumbers || !highlights) return;

  const lines = codeInput.value.split('\n');
  
  let numbersHtml = '';
  let highlightsHtml = '';
  
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const isError = lineNum === errorLine;
    numbersHtml += `<div class="line-number ${isError ? 'error-line' : ''}">${lineNum}</div>`;
    highlightsHtml += `<div class="highlight-line ${isError ? 'error-bg' : ''}"></div>`;
  }
  
  lineNumbers.innerHTML = numbersHtml;
  highlights.innerHTML = highlightsHtml;
}

function initEditor() {
  const codeInput = document.getElementById('code-input');
  const lineNumbers = document.getElementById('line-numbers');
  const highlights = document.getElementById('highlights');

  codeInput.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codeInput.scrollTop;
    highlights.scrollTop = codeInput.scrollTop;
    highlights.scrollLeft = codeInput.scrollLeft;
  });

  codeInput.addEventListener('input', () => {
    updateEditorUI(-1);
    clearTimeout(window.renderTimeout);
    window.renderTimeout = setTimeout(renderDiagram, 300);
  });

  codeInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      // Insert two spaces (or a tab character) at caret
      this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
      // Move caret
      this.selectionStart = this.selectionEnd = start + 2;
      // Trigger render
      clearTimeout(window.renderTimeout);
      window.renderTimeout = setTimeout(renderDiagram, 300);
    }
  });
}
