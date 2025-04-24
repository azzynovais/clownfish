// Main App Class
class NotepadApp {
    constructor() {
        this.currentNote = {
            id: null,
            title: '',
            content: '',
            drawingData: null,
            createdAt: null,
            updatedAt: null
        };
        this.notes = [];
        this.isDrawMode = false;
        this.isEraseMode = false;
        this.lineWidth = 2;
        this.strokeColor = '#000000';
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // Initialize elements
        this.initElements();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load notes from localStorage
        this.loadNotes();
        
        // Create a new note if none exists
        if (this.notes.length === 0) {
            this.createNewNote();
        } else {
            this.loadNote(this.notes[0].id);
        }
        
        // Initialize canvas
        this.initCanvas();
        
        // Auto-save interval (every 30 seconds)
        setInterval(() => this.autoSave(), 30000);
        
        // Update canvas size on window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    initElements() {
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.notesList = document.getElementById('notes-list');
        this.searchInput = document.getElementById('search-notes');
        
        // Editor elements
        this.noteTitleInput = document.getElementById('note-title-input');
        this.textEditor = document.getElementById('text-editor');
        this.drawingCanvas = document.getElementById('drawing-canvas');
        
        // Toolbar buttons
        this.boldBtn = document.getElementById('bold-btn');
        this.italicBtn = document.getElementById('italic-btn');
        this.underlineBtn = document.getElementById('underline-btn');
        this.textModeBtn = document.getElementById('text-mode-btn');
        this.drawModeBtn = document.getElementById('draw-mode-btn');
        this.eraseModeBtn = document.getElementById('erase-mode-btn');
        this.colorPicker = document.getElementById('color-picker');
        this.lineWidthSlider = document.getElementById('line-width');
        this.widthValue = document.getElementById('width-value');
        this.clearCanvasBtn = document.getElementById('clear-canvas-btn');
        
        // Control buttons
        this.newNoteBtn = document.getElementById('new-note-btn');
        this.saveNoteBtn = document.getElementById('save-note-btn');
        this.deleteNoteBtn = document.getElementById('delete-note-btn');
        
        // Status elements
        this.statusMessage = document.getElementById('status-message');
        this.lastSaved = document.getElementById('last-saved');
        
        // Modal elements
        this.modal = document.getElementById('modal');
        this.modalHeader = document.getElementById('modal-header');
        this.modalBody = document.getElementById('modal-body');
        this.modalCancelBtn = document.getElementById('modal-cancel-btn');
        this.modalConfirmBtn = document.getElementById('modal-confirm-btn');
        
        // Canvas context
        this.ctx = this.drawingCanvas.getContext('2d');
    }
    
    initEventListeners() {
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        
        // Search notes
        this.searchInput.addEventListener('input', () => this.searchNotes());
        
        // Notes list
        this.notesList.addEventListener('click', (e) => {
            const noteItem = e.target.closest('.note-item');
            if (noteItem) {
                const noteId = noteItem.dataset.id;
                this.loadNote(noteId);
            }
        });
        
        // Note title input
        this.noteTitleInput.addEventListener('input', () => {
            this.currentNote.title = this.noteTitleInput.value;
            this.updateNotesList();
        });
        
        // Text editor
        this.textEditor.addEventListener('input', () => {
            this.currentNote.content = this.textEditor.innerHTML;
        });
        
        // Formatting buttons
        this.boldBtn.addEventListener('click', () => this.execFormatting('bold'));
        this.italicBtn.addEventListener('click', () => this.execFormatting('italic'));
        this.underlineBtn.addEventListener('click', () => this.execFormatting('underline'));
        
        // Mode buttons
        this.textModeBtn.addEventListener('click', () => this.setMode('text'));
        this.drawModeBtn.addEventListener('click', () => this.setMode('draw'));
        this.eraseModeBtn.addEventListener('click', () => this.setMode('erase'));
        
        // Drawing tools
        this.colorPicker.addEventListener('input', () => {
            this.strokeColor = this.colorPicker.value;
        });
        
        this.lineWidthSlider.addEventListener('input', () => {
            this.lineWidth = parseInt(this.lineWidthSlider.value);
            this.widthValue.textContent = `${this.lineWidth}px`;
        });
        
        this.clearCanvasBtn.addEventListener('click', () => this.showModal(
            'Limpar Desenho', 
            'Tem certeza que deseja limpar o desenho? Esta ação não pode ser desfeita.',
            () => this.clearCanvas()
        ));
        
        // Canvas drawing events
        this.drawingCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.drawingCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.drawingCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.drawingCanvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch support for drawing
        this.drawingCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.drawingCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.drawingCanvas.addEventListener('touchend', () => this.stopDrawing());
        
        // Control buttons
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.saveNoteBtn.addEventListener('click', () => this.saveCurrentNote());
        this.deleteNoteBtn.addEventListener('click', () => this.showModal(
            'Excluir Nota', 
            'Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.',
            () => this.deleteCurrentNote()
        ));
        
        // Modal buttons
        this.modalCancelBtn.addEventListener('click', () => this.closeModal());
        
        // Set text mode as default
        this.setMode('text');
    }
    
    initCanvas() {
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const contentArea = this.drawingCanvas.parentElement;
        this.drawingCanvas.width = contentArea.offsetWidth;
        this.drawingCanvas.height = contentArea.offsetHeight;
        
        // Redraw canvas content if available
        if (this.currentNote.drawingData) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = this.currentNote.drawingData;
        }
    }
    
    toggleSidebar() {
        this.sidebar.classList.toggle('sidebar-collapsed');
        this.sidebarToggle.classList.toggle('collapsed');
    }
    
    setMode(mode) {
        // Reset active states
        this.textModeBtn.classList.remove('active');
        this.drawModeBtn.classList.remove('active');
        this.eraseModeBtn.classList.remove('active');
        this.drawingCanvas.classList.remove('active');
        
        this.isDrawMode = false;
        this.isEraseMode = false;
        
        // Set new mode
        switch (mode) {
            case 'text':
                this.textModeBtn.classList.add('active');
                this.textEditor.focus();
                break;
            case 'draw':
                this.drawModeBtn.classList.add('active');
                this.drawingCanvas.classList.add('active');
                this.isDrawMode = true;
                break;
            case 'erase':
                this.eraseModeBtn.classList.add('active');
                this.drawingCanvas.classList.add('active');
                this.isEraseMode = true;
                break;
        }
        
        this.updateStatus(`Modo ${mode === 'text' ? 'Texto' : mode === 'draw' ? 'Desenho' : 'Borracha'} ativado`);
    }
    
    execFormatting(command) {
        document.execCommand(command, false, null);
        this.textEditor.focus();
    }
    
    startDrawing(e) {
        if (!this.isDrawMode && !this.isEraseMode) return;
        
        this.isDrawing = true;
        
        const rect = this.drawingCanvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.drawingCanvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.lineWidth = this.lineWidth;
        
        if (this.isEraseMode) {
            this.ctx.strokeStyle = 'white';
            this.ctx.globalCompositeOperation = 'destination-out';
        } else {
            this.ctx.strokeStyle = this.strokeColor;
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
        
        this.lastX = currentX;
        this.lastY = currentY;
    }
    
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveDrawingState();
        }
    }
    
    saveDrawingState() {
        this.currentNote.drawingData = this.drawingCanvas.toDataURL();
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.saveDrawingState();
        this.closeModal();
        this.updateStatus('Desenho limpo');
    }
    
    createNewNote() {
        // Save current note before creating a new one
        if (this.currentNote.id) {
            this.saveCurrentNote();
        }
        
        const now = new Date();
        
        this.currentNote = {
            id: 'note_' + Date.now(),
            title: 'Nova Nota',
            content: '',
            drawingData: null,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        
        this.notes.unshift(this.currentNote);
        this.updateNotesList();
        this.loadNoteContent(this.currentNote);
        this.saveNotes();
        
        this.updateStatus('Nova nota criada');
    }
    
    loadNote(noteId) {
        // Save current note before loading another
        if (this.currentNote.id && this.currentNote.id !== noteId) {
            this.saveCurrentNote();
        }
        
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            this.currentNote = note;
            this.loadNoteContent(note);
            this.updateNotesList();
            this.updateStatus(`Nota "${note.title}" carregada`);
        }
    }
    
    loadNoteContent(note) {
        this.noteTitleInput.value = note.title;
        this.textEditor.innerHTML = note.content || '';
        
        // Clear and load drawing
        this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        
        if (note.drawingData) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = note.drawingData;
        }
    }
    
    saveCurrentNote() {
        if (!this.currentNote.id) return;
        
        const now = new Date();
        
        // Update note data
        this.currentNote.title = this.noteTitleInput.value;
        this.currentNote.content = this.textEditor.innerHTML;
        this.currentNote.updatedAt = now.toISOString();
        
        // Save drawing state
        this.saveDrawingState();
        
        // Update notes array and save to localStorage
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNote.id);
        if (noteIndex !== -1) {
            this.notes[noteIndex] = this.currentNote;
        }
        
        this.saveNotes();
        this.updateNotesList();
        this.updateStatus(`Nota "${this.currentNote.title}" salva`);
        this.updateLastSaved(now);
    }
    
    deleteCurrentNote() {
        if (!this.currentNote.id) return;
        
        // Remove note from array
        this.notes = this.notes.filter(n => n.id !== this.currentNote.id);
        
        // Save to localStorage
        this.saveNotes();
        
        // Create new note if no notes left, otherwise load first note
        if (this.notes.length === 0) {
            this.createNewNote();
        } else {
            this.loadNote(this.notes[0].id);
        }
        
        this.closeModal();
        this.updateStatus('Nota excluída');
    }
    
    loadNotes() {
        try {
            const notesData = localStorage.getItem('notePadPro_notes');
            if (notesData) {
                this.notes = JSON.parse(notesData);
                // Sort notes by last updated
                this.notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
        }
        
        this.updateNotesList();
    }
    
    saveNotes() {
        try {
            localStorage.setItem('notePadPro_notes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving notes:', error);
            this.updateStatus('Erro ao salvar notas', true);
        }
    }
    
    searchNotes() {
        const searchTerm = this.searchInput.value.toLowerCase();
        
        // Filter notes by search term
        const filteredNotes = this.notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) || 
            (note.content && note.content.toLowerCase().includes(searchTerm))
        );
        
        // Update notes list with filtered notes
        this.renderNotesList(filteredNotes);
    }
    
    updateNotesList() {
        this.renderNotesList(this.notes);
    }
    
    renderNotesList(notesToRender) {
        this.notesList.innerHTML = '';
        
        if (notesToRender.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'notes-empty-message';
            emptyMessage.textContent = 'Nenhuma nota encontrada';
            this.notesList.appendChild(emptyMessage);
            return;
        }
        
        notesToRender.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            noteItem.dataset.id = note.id;
            
            if (this.currentNote.id === note.id) {
                noteItem.classList.add('active');
            }
            
            const noteTitle = document.createElement('div');
            noteTitle.className = 'note-title';
            noteTitle.textContent = note.title || 'Sem título';
            
            const notePreview = document.createElement('div');
            notePreview.className = 'note-preview';
            
// Create text preview from content
if (note.content) {
    // Remove HTML tags for preview
    const tempElement = document.createElement('div');
    tempElement.innerHTML = note.content;
    const textContent = tempElement.textContent || tempElement.innerText;
    notePreview.textContent = textContent.substring(0, 60) + (textContent.length > 60 ? '...' : '');
} else {
    notePreview.textContent = 'Nota vazia';
}

noteItem.appendChild(noteTitle);
noteItem.appendChild(notePreview);
this.notesList.appendChild(noteItem);
});
}

autoSave() {
if (this.currentNote.id) {
this.saveCurrentNote();
}
}

updateStatus(message, isError = false) {
this.statusMessage.textContent = message;
this.statusMessage.style.color = isError ? 'red' : '';

// Clear message after 3 seconds
setTimeout(() => {
this.statusMessage.textContent = 'Pronto';
this.statusMessage.style.color = '';
}, 3000);
}

updateLastSaved(date) {
const formattedDate = this.formatDate(date);
this.lastSaved.textContent = `Salvo em ${formattedDate}`;
}

formatDate(date) {
const hours = date.getHours().toString().padStart(2, '0');
const minutes = date.getMinutes().toString().padStart(2, '0');
const day = date.getDate().toString().padStart(2, '0');
const month = (date.getMonth() + 1).toString().padStart(2, '0');

return `${day}/${month} ${hours}:${minutes}`;
}

showModal(title, message, confirmCallback) {
this.modalHeader.textContent = title;
this.modalBody.textContent = message;

// Set confirm callback
this.modalConfirmBtn.onclick = () => {
if (confirmCallback) confirmCallback();
};

// Show modal
this.modal.classList.add('visible');
}

closeModal() {
this.modal.classList.remove('visible');
}
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
const app = new NotepadApp();
});