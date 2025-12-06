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

    // ดึงประวัติการแชท
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

            // เพิ่มข้อความแรกจากผู้ใช้
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
            // บันทึกข้อความตอบกลับ
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

            // อัปเดตสถานะข้อความเป็น 'replied'
            const { error: statusError } = await supabase
                .from('contact_messages')
                .update({ status: 'replied' })
                .eq('id', message.id);

            if (statusError) throw statusError;

            // เพิ่มข้อความใหม่ใน history
            const newReply: ChatMessage = {
                id: Date.now().toString(),
                message_id: message.id,
                sender: 'admin',
                text: replyText.trim(),
                created_at: new Date().toISOString(),
            };

            setHistory(prev => [...prev, newReply]);
            setReplyText('');
            showAlert('สำเร็จ', 'ส่งข้อความตอบกลับเรียบร้อยแล้ว', 'success');
        } catch (error) {
            console.error('Error sending reply:', error);
            showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถส่งข้อความได้', 'error');
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
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'เมื่อสักครู่';
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col max-w-4xl mx-auto border border-stone-100 rounded-xl shadow-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-stone-200 bg-white flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                <button 
                    onClick={onBack} 
                    className="p-2 rounded-full hover:bg-stone-200 transition-colors shrink-0"
                    aria-label="ย้อนกลับ"
                >
                    <ArrowLeft className="w-6 h-6 text-stone-700" />
                </button>
                <div className="flex flex-col min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-stone-900 truncate">{message.name}</h2>
                    <p className="text-sm text-stone-500 truncate">{message.email}</p>
                </div>
            </div>

            {/* Chat Body (Scrollable) */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-stone-50 min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    history.map((chat) => (
                        <div 
                            key={chat.id} 
                            className={`flex ${chat.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[75%] p-3 rounded-xl shadow-md ${
                                chat.sender === 'admin' 
                                    ? 'bg-green-600 text-white rounded-br-none' 
                                    : 'bg-white text-stone-800 rounded-tl-none border border-stone-200'
                            } transition-all duration-300`}>
                                <p className="text-sm break-words leading-relaxed">{chat.text}</p>
                                <span className={`block mt-1 text-right text-[10px] ${chat.sender === 'admin' ? 'text-green-200' : 'text-stone-500'}`}>
                                    {formatTime(chat.created_at)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Chat Input Footer */}
            <div className="p-4 border-t border-stone-200 bg-white sticky bottom-0 z-10 shadow-lg">
                <form onSubmit={handleSendReply} className="flex gap-3">
                    <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="พิมพ์ข้อความตอบกลับ..."
                        className="flex-1 px-4 py-3 border border-stone-300 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-600 transition-all text-white placeholder-stone-400"
                        autoFocus
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={replyText.trim() === '' || sending}
                        className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:bg-stone-300 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
                        aria-label="ส่งข้อความ"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

// ========== List Item Components ==========

const Card = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-stone-100 flex items-center justify-between transition-transform hover:shadow-xl">
        <div>
            <p className="text-sm font-medium text-stone-500">{title}</p>
            <p className={`text-4xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className="p-3 bg-stone-100 rounded-full shadow-inner">
            {icon}
        </div>
    </div>
);

const MessageItem = ({ message, onClick }: { message: ContactMessage, onClick: () => void }) => {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'เมื่อสักครู่';
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };

    const isUnread = message.status === 'unread';
    const isReplied = message.status === 'replied';
    
    let statusText;
    let statusColor;
    let StatusIcon;

    if (isUnread) {
        statusText = 'ต้องตอบกลับ';
        statusColor = 'text-red-500';
        StatusIcon = Clock;
    } else if (isReplied) {
        statusText = 'ตอบแล้ว';
        statusColor = 'text-green-500';
        StatusIcon = CheckCircle;
    } else {
        statusText = 'อ่านแล้ว';
        statusColor = 'text-stone-400';
        StatusIcon = Mail;
    }

    return (
        <div 
            onClick={onClick}
            className={`p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center border shadow-sm ${
                isUnread ? 'bg-red-50 hover:bg-red-100 border-red-200 border-l-4' : 'bg-white hover:bg-stone-50 border-stone-200'
            }`}
        >
            <div className="flex-1 min-w-0 flex items-center gap-3">
                <div className="shrink-0">
                    <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isUnread ? 'text-red-800' : 'text-stone-700'}`}>
                        {message.name}
                    </p>
                    <p className={`text-sm mt-1 truncate ${isUnread ? 'text-red-600 font-medium' : 'text-stone-500'}`}>
                        {message.email}
                    </p>
                    <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                        {message.message}
                    </p>
                </div>
            </div>
            <div className="ml-4 text-right shrink-0">
                <span className={`text-xs font-medium ${statusColor}`}>
                    {statusText}
                </span>
                <p className="text-xs text-stone-400 mt-1">{formatTime(message.created_at)}</p>
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

    // ดึงข้อมูลข้อความ
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
            showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อความได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ตรวจสอบสิทธิ์ Admin
    useEffect(() => {
        // รอให้ auth loading เสร็จก่อน
        if (authLoading) return;

        async function checkAdmin() {
            if (!user) {
                router.replace('/login');
                return;
            }

            console.log('Checking admin for user:', user.id, user.email);

            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            console.log('Profile query result:', { data, error });

            if (error) {
                console.error('Error fetching profile:', error);
                showAlert('เกิดข้อผิดพลาด', `ไม่สามารถตรวจสอบสิทธิ์ได้: ${error.message}`, 'error');
                return;
            }

            if (!data) {
                console.error('No profile found for user:', user.id);
                showAlert('เข้าไม่ได้', 'ไม่พบข้อมูลโปรไฟล์ กรุณาติดต่อผู้ดูแลระบบ', 'error', () => router.replace('/'));
                return;
            }

            if (data.role !== 'admin') {
                console.log('User is not admin. Role:', data.role);
                showAlert('เข้าไม่ได้', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้!', 'error', () => router.replace('/'));
                return;
            }

            console.log('Admin access granted');
            setIsAdmin(true);
            fetchMessages();
        }

        checkAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading, router, showAlert]);

    // คำนวณจำนวนข้อความที่ยังไม่ได้ตอบ
    const unreadCount = messages.filter(msg => msg.status === 'unread').length;

    // ถ้ามีการเลือกข้อความ ให้แสดงหน้า Chat View
    if (selectedMessage) {
        return (
            <AdminChatView
                message={selectedMessage}
                onBack={() => {
                    setSelectedMessage(null);
                    fetchMessages(); // รีเฟรชข้อมูลเมื่อกลับมา
                }}
            />
        );
    }

    if (authLoading || !isAdmin || loading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 p-4 md:p-8 font-sans">
            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-extrabold text-stone-900 flex items-center gap-3">
                    <MessageSquareText className="w-8 h-8 text-green-600" />
                    ข้อความจากลูกค้า
                </h1>
                <p className="text-stone-500 mt-1">ดูและตอบกลับข้อความสอบถามและแชททั้งหมดจากลูกค้า</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel 1: Overview Cards */}
                <div className="lg:col-span-1 space-y-4">
                    <Card
                        icon={<Mail className="w-6 h-6 text-green-500" />}
                        title="ข้อความใหม่ (ต้องตอบกลับ)"
                        value={unreadCount.toString()}
                        color={unreadCount > 0 ? "text-red-600" : "text-green-600"}
                    />
                    <Card
                        icon={<Users className="w-6 h-6 text-stone-500" />}
                        title="ลูกค้าที่ติดต่อทั้งหมด"
                        value={messages.length.toString()}
                        color="text-stone-600"
                    />
                </div>

                {/* Panel 2: Message List */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-stone-100">
                    <h2 className="text-xl font-semibold text-stone-800 mb-4 border-b pb-3">
                        รายการข้อความทั้งหมด
                    </h2>
                    <div className="space-y-3">
                        {messages.map(msg => (
                            <MessageItem 
                                key={msg.id} 
                                message={msg} 
                                onClick={() => {
                                    // อัปเดตสถานะเป็น 'read' เมื่อเปิดอ่าน
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
                    </div>

                    {messages.length === 0 && (
                        <div className="text-center py-10 text-stone-500 bg-stone-50 rounded-lg">
                            <p>ไม่มีข้อความใหม่ในขณะนี้</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
