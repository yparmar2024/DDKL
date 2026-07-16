const examples = {
  basic: `# Define Layout
Flowchart: top_bottom

# Define Nodes
Node start1 start: Process Started
Node step1 step: Validate input
Node end1 end: Process Complete

# Define Arrows
Arrow solid: start1, step1
Arrow solid: step1, end1`,
  decision: `# Define Layout
Flowchart: left_right

# Define Nodes
Node start1 start: Start
Node check1 decision: Is it valid?
Node yes1 step: Proceed
Node no1 step: Reject
Node end1 end: Finish

# Define Arrows
Arrow solid: start1, check1
Arrow solid "Yes": check1, yes1
Arrow solid "No": check1, no1
Arrow solid: yes1, end1
Arrow solid: no1, end1`
};

function loadExample(key) {
  if (examples[key]) {
    document.getElementById('code-input').value = examples[key];
    updateEditorUI(-1);
    renderDiagram();
    toggleSidebar();
  }
}
