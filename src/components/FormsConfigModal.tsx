import React, { useState } from 'react';
import { X, CheckSquare, AlignLeft, Check, List, Calendar } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { FormFieldObject, FormFieldType } from '../types/pdf';

export const FormsConfigModal: React.FC = () => {
  const { isFormsConfigOpen, setModalOpen, doc, currentPageIndex, addObject } = useEditorStore();
  const [fieldType, setFieldType] = useState<FormFieldType>('text');
  const [fieldName, setFieldName] = useState('full_name');
  const [defaultValue, setDefaultValue] = useState('');
  const [required, setRequired] = useState(false);

  if (!isFormsConfigOpen || !doc) return null;

  const handleAddField = () => {
    const page = doc.pages[currentPageIndex];
    const isCheck = fieldType === 'checkbox' || fieldType === 'radio';

    const formObj: FormFieldObject = {
      id: `form-${Date.now()}`,
      type: 'formField',
      pageId: page.id,
      x: Math.round(page.width / 2 - (isCheck ? 12 : 90)),
      y: Math.round(page.height / 2 - 15),
      width: isCheck ? 22 : 180,
      height: isCheck ? 22 : 30,
      rotation: 0,
      opacity: 1,
      zIndex: page.objects.length + 1,
      locked: false,
      visible: true,
      name: `Field: ${fieldName}`,
      fieldType,
      fieldName: fieldName || `field_${Date.now().toString().slice(-4)}`,
      defaultValue: isCheck ? defaultValue === 'true' : defaultValue,
      currentValue: isCheck ? defaultValue === 'true' : defaultValue,
      required,
      readOnly: false,
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
      fontColor: '#0f172a',
      backgroundColor: '#eff6ff',
      borderColor: '#93c5fd',
      borderWidth: 1,
    };

    addObject(formObj);
    setModalOpen('forms', false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
            Add Interactive Form Field
          </h3>
          <button
            onClick={() => setModalOpen('forms', false)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Field Type Selection */}
          <div className="space-y-1.5">
            <label className="font-medium text-neutral-700 dark:text-neutral-300">Field Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFieldType('text')}
                className={`p-2.5 rounded-lg border text-center flex flex-col items-center gap-1 ${
                  fieldType === 'text'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
                <span>Text Field</span>
              </button>
              <button
                type="button"
                onClick={() => setFieldType('checkbox')}
                className={`p-2.5 rounded-lg border text-center flex flex-col items-center gap-1 ${
                  fieldType === 'checkbox'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Checkbox</span>
              </button>
              <button
                type="button"
                onClick={() => setFieldType('dropdown')}
                className={`p-2.5 rounded-lg border text-center flex flex-col items-center gap-1 ${
                  fieldType === 'dropdown'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Dropdown</span>
              </button>
            </div>
          </div>

          {/* Field Name */}
          <div className="space-y-1">
            <label className="font-medium text-neutral-700 dark:text-neutral-300">
              Field Name / ID (AcroForm standard)
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g. employee_signature_date"
              className="w-full bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg p-2 outline-none"
            />
          </div>

          {/* Default Value */}
          <div className="space-y-1">
            <label className="font-medium text-neutral-700 dark:text-neutral-300">Default Value</label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="Optional prefilled text"
              className="w-full bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg p-2 outline-none"
            />
          </div>

          {/* Required checkbox */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="rounded text-blue-600 w-3.5 h-3.5"
            />
            <span className="text-neutral-600 dark:text-neutral-400">Required field</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setModalOpen('forms', false)}
            className="px-3 py-1.5 rounded-md hover:bg-neutral-200 text-xs font-medium text-neutral-600"
          >
            Cancel
          </button>
          <button
            onClick={handleAddField}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Place Form Field</span>
          </button>
        </div>
      </div>
    </div>
  );
};
