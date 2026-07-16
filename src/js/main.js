let isDragging = false;

async function renderDiagram() {
  const codeInput = document.getElementById('code-input');
  const diagramContainer = document.getElementById('diagram-container');
  const errorBox = document.getElementById('error-box');
  const errorMsg = document.getElementById('error-msg');
  const techError = document.getElementById('tech-error');
  
  const code = codeInput.value;
  try {
    clearError();
    
    if (code.trim() === '') {
      diagramContainer.innerHTML = '';
      return;
    }
    
    const mermaidCode = window.parseDDKL(code);
    
    diagramContainer.innerHTML = ''; 
    const { svg } = await mermaid.render('mermaid-svg', mermaidCode);
    diagramContainer.innerHTML = svg;
    
    // Initialize Pan/Zoom
    const svgElement = diagramContainer.querySelector('svg');
    if (svgElement) {
      svgElement.style.width = '100%';
      svgElement.style.height = '100%';
      svgElement.style.maxWidth = 'none';
      svgElement.style.maxHeight = 'none';
      svgElement.removeAttribute('width');
      svgElement.removeAttribute('height');
      
      window.panZoomInstance = svgPanZoom(svgElement, {
        zoomEnabled: true,
        controlIconsEnabled: true,
        fit: true,
        center: true,
        minZoom: 0.1,
        maxZoom: 10
      });
    }
  } catch (error) {
    displayError(error);
  }
}

function initResizer() {
  const resizer = document.getElementById('resizer');
  const leftPanel = document.getElementById('left');
  const rightPanel = document.getElementById('right');

  resizer.addEventListener('mousedown', (e) => {
    isDragging = true;
    resizer.classList.add('dragging');
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const containerWidth = document.getElementById('main').offsetWidth;
    let newLeftWidth = (e.clientX / containerWidth) * 100;
    
    // Constraints
    if (newLeftWidth < 10) newLeftWidth = 10;
    if (newLeftWidth > 90) newLeftWidth = 90;
    
    leftPanel.style.width = `${newLeftWidth}%`;
    rightPanel.style.width = `${100 - newLeftWidth}%`;
    
    if (window.panZoomInstance) {
      window.panZoomInstance.resize();
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      resizer.classList.remove('dragging');
    }
  });

  // Handle entire browser window being resized
  window.addEventListener('resize', () => {
    if (window.panZoomInstance) {
      window.panZoomInstance.resize();
    }
  });
}

window.initApp = function() {
  initEditor();
  initResizer();
  renderDiagram();
};
