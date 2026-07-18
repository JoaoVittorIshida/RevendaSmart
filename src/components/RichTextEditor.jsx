import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Link, List, ListOrdered, Underline } from 'lucide-react';

const tools = [
    { command: 'bold', label: 'Negrito', icon: Bold },
    { command: 'italic', label: 'Itálico', icon: Italic },
    { command: 'underline', label: 'Sublinhado', icon: Underline },
    { command: 'insertUnorderedList', label: 'Lista com marcadores', icon: List },
    { command: 'insertOrderedList', label: 'Lista numerada', icon: ListOrdered }
];

const RichTextEditor = ({ value, onChange, disabled = false }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        const editor = editorRef.current;
        if (editor && editor.innerHTML !== (value || '')) editor.innerHTML = value || '';
    }, [value]);

    const runCommand = (command, commandValue = null) => {
        const editor = editorRef.current;
        if (!editor || disabled) return;
        editor.focus();
        document.execCommand(command, false, commandValue);
        onChange(editor.innerHTML);
    };

    const addLink = () => {
        const url = window.prompt('Cole o link completo, começando com https://');
        if (url) runCommand('createLink', url.trim());
    };

    return (
        <div className={`rich-editor ${disabled ? 'opacity-60' : ''}`}>
            <div className="rich-editor-toolbar" aria-label="Formatação da descrição">
                {tools.map(({ command, label, icon: Icon }) => (
                    <button key={command} type="button" onClick={() => runCommand(command)} disabled={disabled} title={label} aria-label={label}>
                        {React.createElement(Icon, { size: 16 })}
                    </button>
                ))}
                <span className="rich-editor-divider" />
                <button type="button" onClick={addLink} disabled={disabled} title="Adicionar link" aria-label="Adicionar link">
                    <Link size={16} />
                </button>
            </div>
            <div
                ref={editorRef}
                className="rich-editor-content rich-text"
                contentEditable={!disabled}
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label="Descrição do anúncio"
                data-placeholder="Descreva estado, acessórios, entrega e outros detalhes. Você também pode usar emojis ✨"
                onInput={(event) => onChange(event.currentTarget.innerHTML)}
                onPaste={(event) => {
                    event.preventDefault();
                    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
                }}
            />
        </div>
    );
};

export default RichTextEditor;
