'use client';

import React, { useState } from 'react';
import { Paper, FormField, FormFieldType } from '@/types/database';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ListFilter,
  Eye,
  Sparkles,
} from 'lucide-react';

interface Props {
  papers: Paper[];
  selectedPaperId: string;
  onSelectPaperId: (id: string) => void;
  formFields: FormField[];
  onRefresh: () => void;
}

export default function FormBuilderTab({
  papers,
  selectedPaperId,
  onSelectPaperId,
  formFields,
  onRefresh,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // New field state
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState<FormFieldType>('text');
  const [isRequired, setIsRequired] = useState(true);
  const [optionsText, setOptionsText] = useState('CEG Anna University, PSG College of Tech, MIT Chennai, SSN, Other');

  // Toggle Mandatory
  const handleToggleRequired = async (field: FormField) => {
    try {
      setLoading(true);
      await supabase
        .from('form_fields')
        .update({ is_required: !field.is_required })
        .eq('id', field.id);
      onRefresh();
    } catch (err: any) {
      alert('Error updating field: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Field
  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to remove this registration field?')) return;
    try {
      setLoading(true);
      await supabase.from('form_fields').delete().eq('id', fieldId);
      onRefresh();
    } catch (err: any) {
      alert('Error deleting field: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add New Field
  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    try {
      setLoading(true);
      const fieldKey = label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
      let optionsArray: string[] = [];

      if (fieldType === 'dropdown') {
        optionsArray = optionsText
          .split(',')
          .map((opt) => opt.trim())
          .filter(Boolean);
      }

      const { error } = await supabase.from('form_fields').insert({
        paper_id: selectedPaperId,
        field_key: fieldKey,
        label: label.trim(),
        field_type: fieldType,
        options: optionsArray,
        is_required: isRequired,
        order_index: formFields.length + 1,
      });

      if (error) throw error;

      setShowAddModal(false);
      setLabel('');
      onRefresh();
    } catch (err: any) {
      alert('Failed to add field: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Paper Switcher & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Configuring Registration Form For Paper
          </label>
          <select
            value={selectedPaperId}
            onChange={(e) => onSelectPaperId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {papers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.is_active ? '🟢 (LIVE)' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Field</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Google Forms-Style Profile Fields</h3>
            <p className="text-xs text-slate-500 mb-5">
              Customize what information students must provide before taking the test.
            </p>

            <div className="space-y-3">
              {formFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900 text-sm">{field.label}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-mono uppercase">
                        {field.field_type}
                      </span>
                    </div>

                    {field.field_type === 'dropdown' && field.options && field.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 pl-7">
                        {field.options.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      onClick={() => handleToggleRequired(field)}
                      disabled={loading}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        field.is_required
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {field.is_required ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mandatory</span>
                        </>
                      ) : (
                        <span>Optional</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteField(field.id)}
                      disabled={loading}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove Field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {formFields.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No registration fields found. Click &quot;Add Custom Field&quot; to build the form.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Form Preview */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs sticky top-24">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <Eye className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Student View Preview</h4>
            </div>

            <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {formFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {field.label}
                    {field.is_required && <span className="text-rose-500 ml-1">*</span>}
                  </label>

                  {field.field_type === 'dropdown' ? (
                    <select
                      disabled
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-500"
                    >
                      <option>Select {field.label}...</option>
                      {(field.options || []).map((o, idx) => (
                        <option key={idx}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      disabled
                      type="text"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-400"
                    />
                  )}
                </div>
              ))}

              <div className="pt-2">
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold opacity-80 cursor-not-allowed"
                >
                  Start Assessment &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Field Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Add Registration Field</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddField} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Field Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. College Name, Department, Father's Name"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Field Type</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as FormFieldType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="text">Text (General)</option>
                  <option value="email">Email Address</option>
                  <option value="tel">Phone / Mobile Number</option>
                  <option value="number">Number (e.g. Roll No, Year)</option>
                  <option value="dropdown">Dropdown Selection (Colleges, Depts, etc.)</option>
                </select>
              </div>

              {fieldType === 'dropdown' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dropdown Choices (comma-separated)
                  </label>
                  <textarea
                    rows={3}
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="College A, College B, College C, Other"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Separate multiple choices with commas.
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="text-slate-700 font-medium">Make this field mandatory for students</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  Add Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
