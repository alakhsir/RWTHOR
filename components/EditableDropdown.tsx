import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, ChevronDown } from 'lucide-react';

interface Option {
    id: string;
    name: string;
}

interface EditableDropdownProps {
    label: string;
    options: Option[];
    value?: string;
    onChange: (value: string) => void;
    onAdd: (name: string) => Promise<void>;
    onEdit: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    placeholder?: string;
    disabled?: boolean;
}

export const EditableDropdown: React.FC<EditableDropdownProps> = ({
    label,
    options,
    value,
    onChange,
    onAdd,
    onEdit,
    onDelete,
    placeholder = "Select...",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdd = async () => {
        if (!newItemName.trim()) return;
        setLoading(true);
        try {
            await onAdd(newItemName);
            setNewItemName('');
            setIsAdding(false);
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message || 'Failed to add item'}. (Hint: Did you run the database schema?)`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!editingId || !editName.trim()) return;
        setLoading(true);
        try {
            await onEdit(editingId, editName);
            setEditingId(null);
            setEditName('');
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message || 'Failed to update item'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This cannot be undone.')) return;
        setLoading(true);
        try {
            await onDelete(id);
            if (value === id) onChange('');
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message || 'Failed to delete item'}`);
        } finally {
            setLoading(false);
        }
    };

    const selectedOption = options.find(o => o.id === value);

    return (
        <div className={`relative ${isOpen ? 'z-50' : 'z-0'}`} ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full bg-background border rounded-lg px-4 py-3 flex justify-between items-center transition-all ${disabled ? 'opacity-50 cursor-not-allowed border-border' : 'border-border hover:border-gray-500 focus:border-primary'}`}
            >
                <span className={selectedOption ? 'text-white' : 'text-gray-500'}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-xl shadow-2xl max-h-60 flex flex-col animate-in fade-in zoom-in-95 origin-top">

                    {/* Add New Section */}
                    <div className="p-2 border-b border-border">
                        {isAdding ? (
                            <div className="flex gap-2">
                                <input
                                    autoFocus
                                    className="flex-1 bg-background border border-primary/50 rounded px-2 py-1 text-sm outline-none"
                                    placeholder="Enter name..."
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                                />
                                <button type="button" onClick={handleAdd} disabled={loading} className="text-primary hover:bg-primary/10 p-1 rounded"><Check size={16} /></button>
                                <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:bg-white/10 p-1 rounded"><X size={16} /></button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAdding(true)}
                                className="w-full flex items-center gap-2 text-primary text-sm font-bold px-2 py-1.5 hover:bg-primary/10 rounded transition-colors"
                            >
                                <Plus size={16} /> Add New {label}
                            </button>
                        )}
                    </div>

                    {/* Options Grid */}
                    <div className="overflow-y-auto p-1 custom-scrollbar flex-1">
                        {options.length === 0 && <div className="text-center text-gray-500 text-xs py-4">No options found.</div>}

                        {options.map(opt => (
                            <div
                                key={opt.id}
                                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm ${opt.id === value ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/5'}`}
                                onClick={() => {
                                    if (editingId !== opt.id) {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                {editingId === opt.id ? (
                                    <div className="flex-1 flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                                        <input
                                            autoFocus
                                            className="flex-1 bg-background border border-primary/50 text-white rounded px-2 py-1 text-xs outline-none"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleEdit())}
                                        />
                                        <button type="button" onClick={handleEdit} className="text-primary hover:bg-white/10 p-1 rounded"><Check size={14} /></button>
                                        <button type="button" onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-white/10 p-1 rounded"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="truncate">{opt.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingId(opt.id);
                                                    setEditName(opt.name);
                                                }}
                                                className="p-1 hover:bg-white/20 rounded text-blue-300"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDelete(e, opt.id)}
                                                className="p-1 hover:bg-white/20 rounded text-red-300"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
