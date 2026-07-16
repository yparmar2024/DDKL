function displayError(error) {
  const errorBox = document.getElementById('error-box');
  const errorMsg = document.getElementById('error-msg');
  const techError = document.getElementById('tech-error');
  
  if (!errorBox || !errorMsg || !techError) return;

  errorBox.classList.add('active');
  
  let friendlyMessage = "Oops! We encountered an error.";
  
  if (typeof error === 'string') {
    friendlyMessage = error;
    techError.innerText = "Application Warning / Error";
    updateEditorUI(-1);
  } else {
    techError.innerText = error.message || error.str || error.toString();
    
    if (error.line) { // DDKL Syntax Error
      friendlyMessage = `Syntax Error on Line ${error.line}: It looks like there's a typo in your DDKL code. Please check the expected format.`;
      updateEditorUI(error.line);
    } else if (error.message && error.message.includes("Parse error")) { // Mermaid Error
      friendlyMessage = "Diagram Error: The generated diagram structure is invalid. Make sure all arrows are properly connected and no special characters break the formatting.";
      updateEditorUI(-1);
    } else {
      friendlyMessage = "An unexpected error occurred while processing the diagram.";
      updateEditorUI(-1);
    }
  }
  
  errorMsg.innerText = friendlyMessage;
}

function clearError() {
  const errorBox = document.getElementById('error-box');
  const techError = document.getElementById('tech-error');
  const techToggle = document.querySelector('.tech-error-toggle');
  
  if (!errorBox || !techError) return;

  errorBox.classList.remove('active');
  techError.classList.remove('open');
  if (techToggle) {
    techToggle.innerText = "Show technical details";
  }
  updateEditorUI(-1);
}
