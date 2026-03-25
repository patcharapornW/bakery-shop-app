"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquareText, Mail, Users, ArrowLeft, Send, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseAuth } from '@/components/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/components/AlertProvider';

// Message structure from database
type ContactMessage = {
    id: string;
    user_id: string | null;
    name: string;
    email: string;
    message: string;
    status: 'unread' | 'replied' | 'read';
    created_at: string;
    profiles?: {
        email: string;
        full_name: string | null;
    } | null;
};

// Chat message structure
type ChatMessage = {
    id: string;
    message_id: string;
    sender: 'user' | 'admin';
    text: string;
    created_at: string;
};

// ========== Component for Admin Chat View ==========
const AdminChatView = ({ message, onBack }: { message: ContactMessage, onBack: () => void }) => {
    const { user } = useSupabaseAuth();
    const { showAlert } = useAlert();
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        async function fetchChatHistory() {
            const { data, error } = await supabase
                .from('message_replies')
                .select('*')
                .eq('message_id', message.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching chat history:', error);
                return;
            }

            const initialMessage: ChatMessage = {
                id: 'initial',
                message_id: message.id,
                sender: 'user',
                text: message.message,
                created_at: message.created_at,
            };

            setHistory([initialMessage, ...(data || [])]);
            setLoading(false);
        }

        fetchChatHistory();
    }, [message.id, message.message, message.created_at]);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim() === '' || !user) return;

        setSending(true);
        try {
            const { error: replyError } = await supabase
                .from('message_replies')
                .insert([
                    {
                        message_id: message.id,
                        sender: 'admin',
                        text: replyText.trim(),
                        admin_id: user.id,
                    },
                ]);

            if (replyError) throw replyError;

            await supabase
                .from('contact_messages')
                .update({ status: 'replied' })
                .eq('id', message.id);

            const newReply: ChatMessage = {
                id: Date.now().toString(),
                message_id: message.id,
                sender: 'admin',
                text: replyText.trim(),
                created_at: new Date().toISOString(),
            };

            setHistory(prev => [...prev, newReply]);
            setReplyText('');
            showAlert('สำเร็จ', 'ส่งข้อความตอบกลับเรียบร้อยแล้วค่ะ', 'success');
        } catch (error) {
            console.error('Error sending reply:', error);
            showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถส่งข้อความได้ค่ะ', 'error');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'เมื่อสักครู่';
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="flex flex-col h-screen bg-bakery-cream">
            {/* Chat Header */}
            <div className="p-6 bg-white border-b border-pink-100 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="w-10 h-10 rounded-xl hover:bg-bakery-cream flex items-center justify-center transition-all active:scale-95 text-stone-600"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-bakery-black">{message.name}</h2>
                        <p className="text-xs font-bold text-bakery-pink uppercase tracking-widest">{message.email}</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-full border border-pink-100">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black text-bakery-pink uppercase tracking-widest">Active Chat</span>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-bakery-cream/30">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-pink-100 border-t-bakery-pink rounded-full animate-spin" />
                    </div>
                ) : (
                    history.map((chat) => (
                        <div 
                            key={chat.id} 
                            className={`flex ${chat.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] p-4 rounded-[2rem] shadow-sm ${
                                chat.sender === 'admin' 
                                    ? 'bg-bakery-black text-white rounded-br-none' 
                                    : 'bg-white text-stone-800 rounded-tl-none border border-pink-100 shadow-pink-900/5'
                            }`}>
                                <p className="text-sm font-medium leading-relaxed">{chat.text}</p>
                                <span className={`block mt-2 text-[10px] font-black uppercase tracking-tighter ${chat.sender === 'admin' ? 'text-stone-400' : 'text-bakery-pink'}`}>
                                    {formatTime(chat.created_at)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Chat Input */}
            <div className="p-6 bg-white border-t border-pink-100">
                <form onSubmit={handleSendReply} className="max-w-4xl mx-auto flex gap-4">
                    <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="พิมพ์ข้อความตอบกลับลูกค้า..."
                        className="flex-1 px-6 py-4 bg-bakery-cream border border-pink-50 rounded-2xl focus:ring-2 focus:ring-bakery-pink transition-all outline-none font-medium text-bakery-black placeholder-stone-400"
                        autoFocus
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={replyText.trim() === '' || sending}
                        className="w-14 h-14 bg-bakery-black text-white rounded-2xl hover:bg-stone-800 hover:scale-105 active:scale-95 transition-all disabled:bg-stone-200 shadow-lg shadow-black/10 flex items-center justify-center"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

// ========== List Item Components ==========

const StatCard = ({ icon, title, value, variant = 'pink' }: { icon: React.ReactNode, title: string, value: string, variant?: 'pink' | 'black' }) => (
    <div className={`p-8 rounded-[2rem] border transition-all hover:scale-[1.02] ${
        variant === 'black' 
            ? 'bg-bakery-black text-white border-stone-800' 
            : 'bg-white text-bakery-black border-pink-50 shadow-xl shadow-pink-900/5'
    }`}>
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                variant === 'black' ? 'bg-stone-800 text-white' : 'bg-pink-50 text-bakery-pink'
            }`}>
                {icon}
            </div>
            <span className={`text-4xl font-black ${variant === 'black' ? 'text-bakery-pink' : 'text-bakery-black'}`}>
                {value}
            </span>
        </div>
        <p className={`text-sm font-black uppercase tracking-widest ${variant === 'black' ? 'text-stone-400' : 'text-stone-400'}`}>
            {title}
        </p>
    </div>
);

const MessageItem = ({ message, onClick }: { message: ContactMessage, onClick: () => void }) => {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'เมื่อสักครู่';
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };

    const isUnread = message.status === 'unread';
    const isReplied = message.status === 'replied';

    return (
        <div 
            onClick={onClick}
            className={`p-6 rounded-[2rem] cursor-pointer transition-all flex items-center gap-6 border group hover:scale-[1.01] ${
                isUnread 
                    ? 'bg-white border-bakery-pink shadow-xl shadow-pink-900/5 ring-1 ring-bakery-pink/20' 
                    : 'bg-white border-pink-50 hover:bg-bakery-cream shadow-sm'
            }`}
        >
            <div className="shrink-0 relative">
                <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl shadow-lg ${
                    isUnread ? 'bg-bakery-pink' : 'bg-bakery-black'
                }`}>
                    {message.name.charAt(0)}
                </div>
                {isUnread && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white animate-pulse" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-black text-bakery-black truncate group-hover:text-bakery-pink transition-colors">
                        {message.name}
                    </h4>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                        {formatTime(message.created_at)}
                    </span>
                </div>
                <p className="text-xs font-bold text-bakery-pink mb-2 uppercase tracking-tight">{message.email}</p>
                <p className="text-sm text-stone-500 line-clamp-1 font-medium italic">
                    "{message.message}"
                </p>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    isUnread 
                        ? 'bg-pink-100 text-bakery-pink' 
                        : isReplied 
                            ? 'bg-stone-100 text-stone-500' 
                            : 'bg-stone-50 text-stone-400'
                }`}>
                    {isUnread ? 'NEW MESSAGE' : isReplied ? 'REPLIED' : 'READ'}
                </span>
            </div>
        </div>
    );
};

// ========== Main Admin Messages Page Component ==========

export default function AdminMessagesPage() {
    const { user, isLoading: authLoading } = useSupabaseAuth();
    const router = useRouter();
    const { showAlert } = useAlert();
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
            showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อความได้ค่ะ', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;

        async function checkAdmin() {
            if (!user) {
                router.replace('/login');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error || !data || data.role !== 'admin') {
                showAlert('เข้าไม่ได้', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้ค่ะ', 'error', () => router.replace('/'));
                return;
            }

            setIsAdmin(true);
            fetchMessages();
        }

        checkAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading, router, showAlert]);

    const unreadCount = messages.filter(msg => msg.status === 'unread').length;

    if (selectedMessage) {
        return (
            <AdminChatView
                message={selectedMessage}
                onBack={() => {
                    setSelectedMessage(null);
                    fetchMessages();
                }}
            />
        );
    }

    if (authLoading || !isAdmin || loading) {
        return (
            <div className="min-h-screen bg-bakery-cream flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-pink-100 border-t-bakery-pink rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bakery-cream p-6 md:p-12">
            <div className="container mx-auto max-w-7xl">
                <header className="mb-12 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-bakery-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                            <MessageSquareText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-bakery-black tracking-tight">ข้อความจากลูกค้า</h1>
                            <p className="text-stone-500 font-bold uppercase text-[10px] tracking-[0.3em]">Customer Satisfaction Dashboard</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <StatCard
                            icon={<Mail className="w-6 h-6" />}
                            title="ต้องตอบกลับ"
                            value={unreadCount.toString()}
                            variant={unreadCount > 0 ? 'pink' : 'black'}
                        />
                        <StatCard
                            icon={<Users className="w-6 h-6 text-stone-500" />}
                            title="ลูกค้าทั้งหมด"
                            value={messages.length.toString()}
                        />
                    </div>

                    {/* Message List */}
                    <div className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-bakery-black">รายการล่าสุด</h2>
                            <div className="h-0.5 flex-1 mx-8 bg-pink-100 hidden md:block" />
                            <span className="text-xs font-black text-stone-400">{messages.length} Messages</span>
                        </div>

                        <div className="grid gap-4">
                            {messages.map(msg => (
                                <MessageItem 
                                    key={msg.id} 
                                    message={msg} 
                                    onClick={() => {
                                        if (msg.status === 'unread') {
                                            supabase
                                                .from('contact_messages')
                                                .update({ status: 'read' })
                                                .eq('id', msg.id);
                                        }
                                        setSelectedMessage(msg);
                                    }} 
                                />
                            ))}

                            {messages.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-pink-50 shadow-inner">
                                    <div className="w-20 h-20 bg-bakery-cream rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Mail className="w-8 h-8 text-stone-300" />
                                    </div>
                                    <p className="text-stone-400 font-black uppercase tracking-widest">ยังไม่มีข้อความส่งเข้ามาในขณะนี้</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
