'use client';

import React, { useState } from 'react';
import { FormField } from '@/types/database';
import { UserCheck, Sparkles, AlertCircle, Edit3 } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  durationMinutes: number;
  questionCount: number;
  formFields: FormField[];
  onStart: (data: Record<string, string>) => void;
}

export default function RegistrationForm({
  title,
  description,
  durationMinutes,
  questionCount,
  formFields,
  onStart,
}: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isOtherOption = (val: string) => {
    if (!val) return false;
    const lower = val.trim().toLowerCase();
    return lower === 'other' || lower === 'others' || lower.startsWith('other ');
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleOtherChange = (key: string, value: string) => {
    setOtherValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const finalData: Record<string, string> = { ...formData };

    formFields.forEach((field) => {
      let val = formData[field.field_key]?.trim() || '';

      // If "Other" selected in dropdown, validate and use manual typing value
      if (field.field_type === 'dropdown' && isOtherOption(val)) {
        const customOtherVal = otherValues[field.field_key]?.trim() || '';
        if (field.is_required && !customOtherVal) {
          newErrors[field.field_key] = `Please enter your specific ${field.label.toLowerCase()}.`;
        } else if (customOtherVal) {
          finalData[field.field_key] = customOtherVal;
        }
      } else {
        if (field.is_required && !val) {
          newErrors[field.field_key] = `${field.label} is required.`;
        }
      }

      if (field.field_type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          newErrors[field.field_key] = 'Please enter a valid email address.';
        }
      }
      if (field.field_type === 'tel' && val) {
        const digits = val.replace(/\D/g, '');
        if (digits.length < 10) {
          newErrors[field.field_key] = 'Please enter a valid 10-digit phone number.';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onStart(finalData);
  };

  return (
    <div className="max-w-xl mx-auto my-6 px-4">
      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-inner">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-slate-100 text-xs md:text-sm font-medium text-slate-700">
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
            ⏱️ {durationMinutes > 0 ? `${durationMinutes} Minutes` : 'No Time Limit'}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
            📝 {questionCount} Questions
          </span>
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
            🔒 Verified Assessment
          </span>
        </div>
      </div>

      {/* Registration Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Student Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {formFields.map((field) => {
            const hasError = !!errors[field.field_key];
            const currentSelected = formData[field.field_key] || '';
            const showsOtherInput = field.field_type === 'dropdown' && isOtherOption(currentSelected);

            return (
              <div key={field.id} className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-800">
                  {field.label}
                  {field.is_required && <span className="text-rose-500 ml-1">*</span>}
                </label>

                {field.field_type === 'dropdown' ? (
                  <div className="space-y-2">
                    <select
                      value={currentSelected}
                      onChange={(e) => handleChange(field.field_key, e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                        hasError
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                      }`}
                    >
                      <option value="">Select your option...</option>
                      {(field.options || []).map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    {/* Dynamic Typing Box when "Other" is selected */}
                    {showsOtherInput && (
                      <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
                        <input
                          type="text"
                          required={field.is_required}
                          autoFocus
                          placeholder={`Please enter your ${field.label.toLowerCase()} manually...`}
                          value={otherValues[field.field_key] || ''}
                          onChange={(e) => handleOtherChange(field.field_key, e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50/40 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all placeholder:text-slate-400"
                        />
                        <Edit3 className="w-4 h-4 text-indigo-500 absolute left-3 top-3" />
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type={
                      field.field_type === 'email'
                        ? 'email'
                        : field.field_type === 'tel'
                        ? 'tel'
                        : field.field_type === 'number'
                        ? 'number'
                        : 'text'
                    }
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                    value={formData[field.field_key] || ''}
                    onChange={(e) => handleChange(field.field_key, e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 ${
                      hasError
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                )}

                {hasError && (
                  <p className="flex items-center gap-1 text-xs text-rose-600 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors[field.field_key]}
                  </p>
                )}
              </div>
            );
          })}

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm md:text-base shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              Start Assessment
              <span aria-hidden="true">&rarr;</span>
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              By starting, you agree to submit answers honestly and adhere to the time limit.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
