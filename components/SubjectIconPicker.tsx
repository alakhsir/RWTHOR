import React, { useState } from 'react';
import {
    Book, Calculator, Atom, Dna, FlaskConical, Globe,
    Landmark, Languages, Palette, Activity, Component,
    Monitor, PenTool, Music, Microscope, Stethoscope,
    Zap, Lightbulb, Brain, Layers, GraduationCap, X
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface SubjectIconPickerProps {
    value: string; // Icon name (Lucide) or URL
    onChange: (icon: string) => void;
}

const COMMON_ICONS = [
    { name: 'Book', icon: Book },
    { name: 'Calculator', icon: Calculator },
    { name: 'Atom', icon: Atom },
    { name: 'Dna', icon: Dna },
    { name: 'FlaskConical', icon: FlaskConical },
    { name: 'Globe', icon: Globe },
    { name: 'Landmark', icon: Landmark },
    { name: 'Languages', icon: Languages },
    { name: 'Palette', icon: Palette },
    { name: 'Activity', icon: Activity },
    { name: 'Component', icon: Component },
    { name: 'Monitor', icon: Monitor },
    { name: 'PenTool', icon: PenTool },
    { name: 'Music', icon: Music },
    { name: 'Microscope', icon: Microscope },
    { name: 'Stethoscope', icon: Stethoscope },
    { name: 'Zap', icon: Zap },
    { name: 'Lightbulb', icon: Lightbulb },
    { name: 'Brain', icon: Brain },
    { name: 'Layers', icon: Layers },
    { name: 'GraduationCap', icon: GraduationCap },
];

// Only including icons confirmed to exist on disk
const ASSET_ICONS = [
    'physics.svg', 'chemistry.svg', 'maths.svg', 'biology.svg', 'english.svg', 'hindi.svg'
];

export const SubjectIconPicker: React.FC<SubjectIconPickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customUrl, setCustomUrl] = useState('');

    // Dynamic Icon Renderer
    const renderIcon = (iconVal: string, size = 20) => {
        // External URL or Asset path
        if (iconVal?.startsWith('http') || iconVal?.includes('/assets/') || iconVal?.endsWith('.svg') || iconVal?.endsWith('.png')) {
            const src = iconVal.startsWith('http') || iconVal.startsWith('/') ? iconVal : `/assets/subject-icons/${iconVal}`;
            return <img src={src} alt="icon" width={size} height={size} className="object-contain" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=?'} />;
        }
        // Lucide Icon
        // @ts-ignore
        const Icon = LucideIcons[iconVal] || Book;
        return <Icon size={size} />;
    };

    const handleSetUrl = () => {
        if (customUrl.trim()) {
            onChange(customUrl.trim());
            setIsOpen(false);
        }
    };

    return (
        <div className={`relative ${isOpen ? 'z-50' : 'z-0'}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-white/5 transition-colors p-2"
                title="Change Icon"
            >
                {renderIcon(value, 24)}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    {/* Picker Modal */}
                    <div className="absolute top-14 left-0 z-50 w-72 bg-surface border border-primary rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-sm text-white">Select Icon</h4>
                            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X size={16} /></button>
                        </div>

                        {/* Custom URL Section - NO FORM HERE */}
                        <div className="mb-4">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wider">Custom URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                                    placeholder="https://..."
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSetUrl();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSetUrl}
                                    disabled={!customUrl}
                                    className="bg-primary text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                                >
                                    Set
                                </button>
                            </div>
                        </div>

                        {/* Asset Icons Section */}
                        <div className="mb-4">
                            <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Subject Icons</h5>
                            <div className="grid grid-cols-5 gap-2">
                                {ASSET_ICONS.map((file) => (
                                    <button
                                        key={file}
                                        type="button"
                                        onClick={() => {
                                            onChange(file);
                                            setIsOpen(false);
                                        }}
                                        className={`p-2 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 ${value === file ? 'ring-2 ring-primary' : ''}`}
                                        title={file}
                                    >
                                        <img src={`/assets/subject-icons/${file}`} className="w-6 h-6 object-contain" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Generic Icons</h5>
                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {COMMON_ICONS.map((item) => (
                                <button
                                    key={item.name}
                                    type="button"
                                    onClick={() => {
                                        onChange(item.name);
                                        setIsOpen(false);
                                    }}
                                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${value === item.name ? 'bg-primary text-white scale-110' : 'bg-black/20 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <item.icon size={20} />
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
