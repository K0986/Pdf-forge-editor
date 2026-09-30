import React, { useEffect, useRef } from 'react';
import { TextObject } from '../types/pdf';
import { useEditorStore } from '../stores/editorStore';

interface InlineTextEditorProps {
  object: TextObject;
  zoom: number;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({ object, zoom }) => {
  const { updateObject, setEditingTextId } = useEditorStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      autoResize();
    }
  }, []);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(
        object.height * zoom,
        textareaRef.current.scrollHeight
      )}px`;
    }
  };

  const handleBlur = () => {
    if (textareaRef.current) {
      const newContent = textareaRef.current.value;
      updateObject(object.id, {
        content: newContent,
        width: Math.max(object.width, textareaRef.current.scrollWidth / zoom),
        height: Math.max(object.height, textareaRef.current.scrollHeight / zoom),
      });
    }
    setEditingTextId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      handleBlur();
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full min-w-[120px] min-h-[32px] z-40">
      <textarea
        ref={textareaRef}
        defaultValue={object.content}
        onChange={(e) => {
          autoResize();
          updateObject(
            object.id,
            {
              content: e.target.value,
              height: Math.max(object.height, (e.target.scrollHeight || object.height) / zoom),
            },
            false
          );
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full h-full min-h-[32px] bg-white/95 dark:bg-neutral-900/95 border-2 border-blue-500 rounded p-1 outline-none resize-none shadow-lg block"
        style={{
          fontFamily: object.fontFamily,
          fontSize: `${object.fontSize * zoom}px`,
          fontWeight: object.fontWeight,
          fontStyle: object.fontStyle,
          color: object.color,
          textAlign: object.alignment,
          lineHeight: object.lineHeight,
          letterSpacing: `${object.letterSpacing}px`,
          textDecoration: `${object.underline ? 'underline' : ''} ${
            object.strikethrough ? 'line-through' : ''
          }`.trim(),
        }}
      />
    </div>
  );
};
