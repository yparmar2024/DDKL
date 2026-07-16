function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

function openDocsModal() {
  document.getElementById('docs-modal-overlay').classList.add('open');
  toggleSidebar(); // Close sidebar if open
  showDocSection('doc-layout'); // Default open section
}

function closeDocsModal() {
  document.getElementById('docs-modal-overlay').classList.remove('open');
}

function showDocSection(sectionId) {
  document.querySelectorAll('.doc-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.doc-nav-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(sectionId).classList.add('active');
  const btn = Array.from(document.querySelectorAll('.doc-nav-btn')).find(b => b.getAttribute('onclick').includes(sectionId));
  if (btn) btn.classList.add('active');
}

function toggleTechError() {
  const techError = document.getElementById('tech-error');
  techError.classList.toggle('open');
  const isOpen = techError.classList.contains('open');
  document.querySelector('.tech-error-toggle').innerText = isOpen ? "Hide technical details" : "Show technical details";
}

function setView(view) {
  const leftPanel = document.getElementById('left');
  const rightPanel = document.getElementById('right');
  const resizer = document.getElementById('resizer');
  
  document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
  document.getElementById(`btn-${view}`).classList.add('active');

  if (view === 'code') {
    leftPanel.style.display = 'flex';
    leftPanel.style.width = '100%';
    rightPanel.style.display = 'none';
    rightPanel.style.width = '0%';
    resizer.style.display = 'none';
  } else if (view === 'render') {
    leftPanel.style.display = 'none';
    leftPanel.style.width = '0%';
    rightPanel.style.display = 'flex';
    rightPanel.style.width = '100%';
    resizer.style.display = 'none';
  } else {
    leftPanel.style.display = 'flex';
    rightPanel.style.display = 'flex';
    resizer.style.display = 'flex';
    leftPanel.style.width = '50%';
    rightPanel.style.width = '50%';
  }

  if (window.panZoomInstance && view !== 'code') {
    setTimeout(() => {
      window.panZoomInstance.resize();
      window.panZoomInstance.fit();
      window.panZoomInstance.center();
    }, 310);
  }
}

function openInDrawio() {
  const code = document.getElementById('code-input').value;
  if (!code.trim()) {
    displayError("Please enter some DDKL code first.");
    return;
  }
  
  let mermaidCode;
  try {
    mermaidCode = window.parseDDKL(code);
  } catch(e) {
    displayError(e);
    return;
  }
  
  // Open Draw.io in a new window configured to receive data via postMessage.
  // We explicitly set dark=0 to prevent automatic color inversion.
  // We pass the custom Dematic library via the clibs parameter using its Raw GitHub URL.
  const libUrl = encodeURIComponent("https://raw.githubusercontent.com/yparmar2024/DDKL/main/library/dematic_library.xml");
  const drawioUrl = `https://app.diagrams.net/?splash=0&dark=0&clibs=U${libUrl}#create=%7B%22type%22%3A%22message%22%7D`;
  const drawioWin = window.open(drawioUrl, '_blank');
  
  const msgListener = function(event) {
    if (event.source !== drawioWin) return;
    
    let msg;
    try {
      msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch(e) { 
      return; 
    }
    
    if (msg && msg.event === 'ready') {
      let direction = "DOWN";
      if (code.includes('left_right')) direction = "RIGHT";
      else if (code.includes('right_left')) direction = "LEFT";
      else if (code.includes('down_top')) direction = "UP";

      const createObj = {
        type: 'mermaid',
        data: mermaidCode,
        layout: [
          {
            layout: "elkLayered",
            config: {
              "elk.direction": direction
            }
          }
        ]
      };
      
      const payload = { action: 'create', data: createObj };
      drawioWin.postMessage(payload, '*');
      
      // Remove listener to prevent memory leaks
      window.removeEventListener('message', msgListener);
    }
  };
  
  window.addEventListener('message', msgListener);
}
