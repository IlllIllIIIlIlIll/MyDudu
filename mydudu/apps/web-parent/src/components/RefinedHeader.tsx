'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Bell } from 'lucide-react';

interface Child {
    id: string;
    name: string;
    age?: number;
}

interface RefinedHeaderProps {
    userName: string;
    children: Child[];
    selectedChildId: string;
    onSelectChild: (childId: string) => void;
    unreadCount?: number;
    onNotificationClick?: () => void;
}

export function RefinedHeader({
    userName,
    children,
    selectedChildId,
    onSelectChild,
    unreadCount = 0,
    onNotificationClick,
}: RefinedHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const selectedChild = children.find(c => c.id === selectedChildId);
    const headerRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.addEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    return (
        <div
            ref={headerRef}
            style={{
                background: 'linear-gradient(to bottom right, #11998E, #38EF7D)',
                color: 'white',
                padding: '16px 16px 20px 16px',
                borderBottomLeftRadius: '24px',
                borderBottomRightRadius: '24px',
                boxShadow: '0 10px 15px -3px rgba(17, 153, 142, 0.2), 0 4px 6px -2px rgba(17, 153, 142, 0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
            }}
            onClick={toggleDropdown}
        >
            <div style={{ maxWidth: '448px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <p style={{
                            fontSize: '12px',
                            opacity: 0.9,
                            margin: '0 0 2px 0',
                            fontWeight: 500,
                        }}>
                            Halo, {userName}
                        </p>
                        <h1 style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            margin: 0,
                            letterSpacing: '-0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            {isDropdownOpen ? 'Pilih Anak Anda' : (selectedChild?.name || 'Pilih Anak')}
                            {!isDropdownOpen && <ChevronDown size={18} style={{ opacity: 0.8 }} />}
                        </h1>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // prevent toggling dropdown when clicking bell
                            onNotificationClick?.();
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                        }}>
                        <Bell size={24} color="white" />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: '#ef4444',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '10px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #23c781', // roughly matching the gradient behind it to look cut-out
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Dropdown Menu (Collapsible section) */}
                <div style={{
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    maxHeight: isDropdownOpen ? '400px' : '0px',
                    opacity: isDropdownOpen ? 1 : 0,
                    marginTop: isDropdownOpen ? '16px' : '0px',
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        overflow: 'hidden',
                    }}>
                        {children.map((child, index) => (
                            <button
                                key={child.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectChild(child.id);
                                    setIsDropdownOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    border: 'none',
                                    borderBottom: index < children.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    background: selectedChildId === child.id ? '#f0fdf4' : 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedChildId !== child.id) {
                                        e.currentTarget.style.background = '#f9fafb';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = selectedChildId === child.id ? '#f0fdf4' : 'white';
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: selectedChildId === child.id ? '#10b981' : '#f3f4f6',
                                    color: selectedChildId === child.id ? 'white' : '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                }}>
                                    {child.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: selectedChildId === child.id ? 700 : 500,
                                        color: selectedChildId === child.id ? '#047857' : '#1f2937',
                                    }}>
                                        {child.name}
                                    </div>
                                    {child.age && (
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#6b7280',
                                            marginTop: '2px'
                                        }}>
                                            {child.age} tahun
                                        </div>
                                    )}
                                </div>
                                {selectedChildId === child.id && (
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: '#10b981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>✓</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
