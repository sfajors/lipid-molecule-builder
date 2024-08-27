document.querySelectorAll('.atom').forEach(atom => {
    atom.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('atom', e.target.className.split(' ')[1]);
    });
});

const workspace = document.getElementById('workspace');
workspace.addEventListener('dragover', function(e) {
    e.preventDefault();
});

workspace.addEventListener('drop', function(e) {
    e.preventDefault();
    const atomType = e.dataTransfer.getData('atom');
    if (atomType) {
        // If atomType exists, it means we are dropping a new atom
        createAtom(e.offsetX, e.offsetY, atomType);
    } else {
        // Otherwise, we are moving an existing atom
        moveAtom(e);
    }
});

let atomCount = { carbon: 0, hydrogen: 0, oxygen: 0 };
let atoms = [];
let undoStack = [];
let redoStack = [];

function createAtom(x, y, type) {
    // Adjust position if the new atom is too close to an existing atom
    let adjustedPosition = adjustPositionIfNeeded(x, y);

    const newAtom = document.createElement('div');
    newAtom.className = 'atom ' + type;
    newAtom.style.position = 'absolute';
    newAtom.style.left = adjustedPosition.x + 'px'; // Adjusted position
    newAtom.style.top = adjustedPosition.y + 'px';
    newAtom.dataset.type = type;
    newAtom.draggable = true;  // Allow the atom to be draggable
    workspace.appendChild(newAtom);
    atoms.push(newAtom);
    atomCount[type]++;
    
    // Add to undo stack
    undoStack.push({
        action: 'create',
        atom: newAtom,
        x: adjustedPosition.x,
        y: adjustedPosition.y,
        type: type
    });
    redoStack = []; // Clear the redo stack

    // Add drag and drop functionality to the new atom
    newAtom.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', '');
        e.target.dataset.dragging = true;
    });

    newAtom.addEventListener('dragend', function(e) {
        e.target.dataset.dragging = false;
    });

    // Add double-click functionality to delete the atom
    newAtom.addEventListener('dblclick', function() {
        deleteAtom(newAtom);
    });

    checkForMolecules();
}

function adjustPositionIfNeeded(x, y) {
    for (let i = 0; i < atoms.length; i++) {
        const existingAtom = atoms[i];
        const atomX = parseInt(existingAtom.style.left);
        const atomY = parseInt(existingAtom.style.top);

        const distance = Math.sqrt(Math.pow(x - atomX, 2) + Math.pow(y - atomY, 2));

        // If the distance is within 3px, reposition the new atom
        if (distance <= 3) {
            // Calculate a new position 4px away
            const angle = Math.atan2(y - atomY, x - atomX);
            x = atomX + Math.cos(angle) * 4;
            y = atomY + Math.sin(angle) * 4;
        }
    }
    return { x: x - 5, y: y - 5 }; // Adjust to center the atom
}

function moveAtom(e) {
    const draggingAtom = workspace.querySelector('[data-dragging="true"]');
    if (draggingAtom) {
        const prevX = draggingAtom.style.left;
        const prevY = draggingAtom.style.top;

        draggingAtom.style.left = e.offsetX - 5 + 'px';
        draggingAtom.style.top = e.offsetY - 5 + 'px';

        // Add to undo stack
        undoStack.push({
            action: 'move',
            atom: draggingAtom,
            prevX: prevX,
            prevY: prevY,
            newX: draggingAtom.style.left,
            newY: draggingAtom.style.top
        });
        redoStack = []; // Clear the redo stack
    }
}

function deleteAtom(atom) {
    workspace.removeChild(atom);
    atomCount[atom.dataset.type]--;
    atoms = atoms.filter(a => a !== atom);
    
    // Add to undo stack
    undoStack.push({
        action: 'delete',
        atom: atom,
        x: atom.style.left,
        y: atom.style.top,
        type: atom.dataset.type
    });
    redoStack = []; // Clear the redo stack
}

function expandWorkspace() {
    // Increase workspace size by 20% each time
    const currentWidth = workspace.offsetWidth;
    const currentHeight = workspace.offsetHeight;
    workspace.style.width = `${currentWidth * 1.2}px`;
    workspace.style.height = `${currentHeight * 1.2}px`;
}

function shrinkWorkspace() {
    // Reduce workspace size by 20% each time
    const currentWidth = workspace.offsetWidth;
    const currentHeight = workspace.offsetHeight;

    // Ensure that the workspace doesn't shrink below a minimum size
    if (currentWidth > 200 && currentHeight > 150) {  // Minimum width and height
        workspace.style.width = `${currentWidth * 0.8}px`;
        workspace.style.height = `${currentHeight * 0.8}px`;
    } else {
        alert("Workspace can't be shrunk further!");
    }
}

function checkForMolecules() {
    checkForGlycerol();
    checkForFattyAcid();
}

function checkForGlycerol() {
    if (atomCount.carbon >= 3 && atomCount.hydrogen >= 8 && atomCount.oxygen >= 3) {
        formGlycerol();
    }
}

function checkForFattyAcid() {
    // Check for 12 carbons and 26 hydrogens
    if (atomCount.carbon >= 12 && atomCount.hydrogen >= 26) {
        formFattyAcid();
    }
}

function removeAtoms(type, count) {
    let removed = 0;
    atoms = atoms.filter(atom => {
        if (atom.dataset.type === type && removed < count) {
            workspace.removeChild(atom);
            removed++;
            atomCount[type]--;
            return false;
        }
        return true;
    });
}

function showInfoModal(title, description) {
    const modal = document.getElementById('infoModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const closeModal = document.getElementById('closeModal');

    modalTitle.textContent = title;
    modalDescription.textContent = description;

    modal.style.display = 'block';

    closeModal.onclick = function() {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function updateInfoContainer(title, description) {
    const infoTitle = document.getElementById('infoTitle');
    const infoDescription = document.getElementById('infoDescription');
    
    infoTitle.textContent = title;
    infoDescription.textContent = description;
}

let glycerolCount = 0;
let fattyAcidCount = 0;

function formGlycerol() {
    // Clear the workspace after forming glycerol
    clearWorkspace();

    const output = document.getElementById('output');

    const glycerol = document.createElement('div');
    glycerol.id = 'glycerolMolecule';
    glycerol.style.width = '80px';
    glycerol.style.height = '80px';
    glycerol.style.backgroundColor = '#add8e6';
    glycerol.style.borderRadius = '50%';
    glycerol.style.border = '2px solid #000';
    glycerol.style.display = 'flex';
    glycerol.style.justifyContent = 'center';
    glycerol.style.alignItems = 'center';
    glycerol.style.margin = '20px auto';
    glycerol.style.position = 'relative';

    const glycerolLabel = document.createElement('div');
    glycerolLabel.innerText = 'G';
    glycerolLabel.style.fontSize = '24px';
    glycerolLabel.style.fontWeight = 'bold';
    glycerolLabel.style.color = '#000';

    glycerol.appendChild(glycerolLabel);
    output.appendChild(glycerol);

    glycerol.addEventListener('mouseover', function() {
        updateInfoContainer('Glycerol', 'Glycerol is a simple polyol compound. It is a colorless, odorless, viscous liquid that is sweet-tasting and non-toxic.');
    });

    glycerol.addEventListener('mouseleave', function() {
        updateInfoContainer('Molecule Information', 'Hover over a molecule to see details here.');
    });

    glycerolCount++;
    checkForTriglyceride(); // Check if a triglyceride can be formed
    resetAtomCounts();
    
    alert('Glycerol formed!');
}

function formFattyAcid() {
    // Clear the workspace after forming fatty acid
    clearWorkspace();

    const output = document.getElementById('output');

    const fattyAcid = document.createElement('div');
    fattyAcid.style.width = '120px';
    fattyAcid.style.height = '40px';
    fattyAcid.style.backgroundColor = '#98fb98';
    fattyAcid.style.borderRadius = '10px';
    fattyAcid.style.border = '2px solid #006400';
    fattyAcid.style.display = 'flex';
    fattyAcid.style.justifyContent = 'center';
    fattyAcid.style.alignItems = 'center';
    fattyAcid.style.margin = '20px auto';
    fattyAcid.style.position = 'relative';

    const fattyAcidLabel = document.createElement('div');
    fattyAcidLabel.innerText = 'FA';
    fattyAcidLabel.style.fontSize = '18px';
    fattyAcidLabel.style.fontWeight = 'bold';
    fattyAcidLabel.style.color = '#006400';

    fattyAcid.appendChild(fattyAcidLabel);
    output.appendChild(fattyAcid);

    fattyAcid.addEventListener('mouseover', function() {
        updateInfoContainer('Fatty Acid Chain', 'Fatty acids are important components of lipids in the body. They serve as major building blocks of fats.');
    });

    fattyAcid.addEventListener('mouseleave', function() {
        updateInfoContainer('Molecule Information', 'Hover over a molecule to see details here.');
    });

    fattyAcidCount++;
    checkForTriglyceride(); // Check if a triglyceride can be formed
    resetAtomCounts();
    
    alert('Fatty acid chain formed!');
}

function formTriglyceride() {
    const output = document.getElementById('output');
    output.innerHTML = '';  // Clear previous outputs

    const triglyceride = document.createElement('div');
    triglyceride.style.display = 'flex';
    triglyceride.style.flexDirection = 'column';
    triglyceride.style.alignItems = 'center';
    triglyceride.style.justifyContent = 'center';
    triglyceride.style.width = '100%';
    triglyceride.style.height = '100%';

    const glycerol = document.createElement('div');
    glycerol.style.width = '80px';
    glycerol.style.height = '80px';
    glycerol.style.backgroundColor = '#add8e6';
    glycerol.style.borderRadius = '50%';
    glycerol.style.border = '2px solid #000';
    glycerol.style.display = 'flex';
    glycerol.style.justifyContent = 'center';
    glycerol.style.alignItems = 'center';
    glycerol.style.marginBottom = '10px';

    const glycerolLabel = document.createElement('div');
    glycerolLabel.innerText = 'G';
    glycerolLabel.style.fontSize = '24px';
    glycerolLabel.style.fontWeight = 'bold';
    glycerolLabel.style.color = '#000';

    glycerol.appendChild(glycerolLabel);
    triglyceride.appendChild(glycerol);

    for (let i = 0; i < 3; i++) {
        const fattyAcid = document.createElement('div');
        fattyAcid.style.width = '120px';
        fattyAcid.style.height = '40px';
        fattyAcid.style.backgroundColor = '#98fb98';
        fattyAcid.style.borderRadius = '10px';
        fattyAcid.style.border = '2px solid #006400';
        fattyAcid.style.display = 'flex';
        fattyAcid.style.justifyContent = 'center';
        fattyAcid.style.alignItems = 'center';
        fattyAcid.style.marginTop = '5px';

        const fattyAcidLabel = document.createElement('div');
        fattyAcidLabel.innerText = 'FA';
        fattyAcidLabel.style.fontSize = '18px';
        fattyAcidLabel.style.fontWeight = 'bold';
        fattyAcidLabel.style.color = '#006400';

        fattyAcid.appendChild(fattyAcidLabel);
        triglyceride.appendChild(fattyAcid);
    }

    output.appendChild(triglyceride);

    triglyceride.addEventListener('mouseover', function() {
        updateInfoContainer('Triglyceride', 'Triglycerides are the main constituents of body fat in humans and other animals, as well as vegetable fat.');
    });

    triglyceride.addEventListener('mouseleave', function() {
        updateInfoContainer('Molecule Information', 'Hover over a molecule to see details here.');
    });

    // Reset molecule tracking
    glycerolCount = 0;
    fattyAcidCount = 0;

    alert('Triglyceride formed!');
}

function checkForTriglyceride() {
    if (glycerolCount >= 1 && fattyAcidCount >= 3) {
        formTriglyceride();
    }
}

function resetAtomCounts() {
    atomCount = { carbon: 0, hydrogen: 0, oxygen: 0 };
    atoms.forEach(atom => atomCount[atom.dataset.type]++);
}

function clearWorkspace() {
    const workspace = document.getElementById('workspace');
    workspace.innerHTML = '';  // Clear the workspace area
    atoms = [];  // Clear the array tracking atoms
    atomCount = { carbon: 0, hydrogen: 0, oxygen: 0 };  // Reset atom counts
}

function resetWorkspace() {
    // Reset the workspace area
    workspace.innerHTML = '<p class="workspace-description">Drag and drop atoms to build a molecule:</p>';
    
    // Reset the output area
    const output = document.getElementById('output');
    output.innerHTML = '<p class="output-description">Output will appear here:</p>';
    
    // Reset atom counts and other tracking variables
    atomCount = { carbon: 0, hydrogen: 0, oxygen: 0 };
    atoms = [];
    glycerolCount = 0;
    fattyAcidCount = 0;

    // Reset workspace size to original dimensions
    workspace.style.width = '800px';
    workspace.style.height = '600px';
}

function undo() {
    const lastAction = undoStack.pop();
    if (!lastAction) return;

    redoStack.push(lastAction);

    switch (lastAction.action) {
        case 'create':
            // Undo create: remove the atom
            workspace.removeChild(lastAction.atom);
            atomCount[lastAction.type]--;
            atoms = atoms.filter(a => a !== lastAction.atom);
            break;
        case 'delete':
            // Undo delete: re-add the atom
            workspace.appendChild(lastAction.atom);
            atomCount[lastAction.type]++;
            atoms.push(lastAction.atom);
            break;
        case 'move':
            // Undo move: move the atom back to its previous position
            lastAction.atom.style.left = lastAction.prevX;
            lastAction.atom.style.top = lastAction.prevY;
            break;
    }
}

function redo() {
    const lastAction = redoStack.pop();
    if (!lastAction) return;

    undoStack.push(lastAction);

    switch (lastAction.action) {
        case 'create':
            // Redo create: re-add the atom
            workspace.appendChild(lastAction.atom);
            atomCount[lastAction.type]++;
            atoms.push(lastAction.atom);
            break;
        case 'delete':
            // Redo delete: remove the atom again
            workspace.removeChild(lastAction.atom);
            atomCount[lastAction.type]--;
            atoms = atoms.filter(a => a !== lastAction.atom);
            break;
        case 'move':
            // Redo move: move the atom back to its new position
            lastAction.atom.style.left = lastAction.newX;
            lastAction.atom.style.top = lastAction.newY;
            break;
    }
}

// Learning Module JS
function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    event.preventDefault();
    const foodId = event.dataTransfer.getData("text");
    const feedback = document.getElementById('experimentFeedback');

    if (foodId === 'butter' || foodId === 'oil' || foodId === 'cheese') {
        feedback.textContent = `Yes! ${foodId.charAt(0).toUpperCase() + foodId.slice(1)} leaves a greasy spot, so it contains lipids.`;
        document.getElementById('paper').style.backgroundColor = '#ffd54f';
    } else {
        feedback.textContent = `Nope! ${foodId.charAt(0).toUpperCase() + foodId.slice(1)} doesn't leave a greasy spot, so it has fewer lipids.`;
        document.getElementById('paper').style.backgroundColor = '#e0f7fa';
    }
}

function showLearningModule() {
    document.getElementById('builderContainer').style.display = 'none';
    document.getElementById('learningModuleContainer').style.display = 'block';
}

function showBuilder() {
    document.getElementById('learningModuleContainer').style.display = 'none';
    document.getElementById('builderContainer').style.display = 'block';
}

function showInstructions() {
    document.getElementById('instructionsModal').style.display = 'block';
}

function closeInstructions() {
    document.getElementById('instructionsModal').style.display = 'none';
}

// Close the modal if the user clicks anywhere outside of the modal content
window.onclick = function(event) {
    const modal = document.getElementById('instructionsModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

function toggleVisibility(elementId) {
    const element = document.getElementById(elementId);
    if (element.style.display === 'none') {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}