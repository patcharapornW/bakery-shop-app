/**
 * Admin Messages Page
 * หน้าสำหรับ Admin เพื่อดูและจัดการข้อความที่ส่งมาจากลูกค้า
 * Path: /admin/messages
 */

import React, { useState } from 'react';
import { MessageSquareText, Mail, Users, ArrowLeft, Send } from 'lucide-react';

// ในระบบจริง หน้านี้ควรมีการตรวจสอบสิทธิ์ (Authentication) ว่าเป็น Admin เท่านั้นก่อนแสดงผลเนื้อหา

// Mock message structure
type Message = {
    id: number;
    user: string;
    subject: string;
    status: 'unread' | 'replied' | 'read';
    time: string;
};

// Mock chat history structure
type ChatMessage = {
    sender: 'user' | 'admin';
    text: string;
    time: string;
};

// Mock data for messages/threads (ข้อมูลจำลองสำหรับแสดงข้อความ)
const mockMessages: Message[] = [
    { id: 1, user: 'สมหญิง ใจดี', subject: 'สอบถามเรื่องขนมเค้กวันเกิด', status: 'unread', time: '5 นาทีที่แล้ว' },
    { id: 2, user: 'ชายชาญ กล้าหาญ', subject: 'ปัญหาการสั่งซื้อ', status: 'replied', time: '1 วันที่แล้ว' },
    { id: 3, user: 'ป้าศรี มีสุข', subject: 'คำชมเชยจากลูกค้า', status: 'read', time: '3 วันที่แล้ว' },
    { id: 4, user: 'เจมส์ บอนด์', subject: 'สอบถามราคาส่ง', status: 'unread', time: '1 ชั่วโมงที่แล้ว' },
];

// Mock Chat history data
const mockChatHistory: { [key: number]: ChatMessage[] } = {
    1: [
        { sender: 'user', text: 'สวัสดีค่ะ สนใจสั่งเค้กวันเกิด 2 ปอนด์ รสช็อกโกแลตค่ะ ราคาเท่าไหร่คะ?', time: '5 นาทีที่แล้ว' },
        { sender: 'admin', text: 'สวัสดีครับ/ค่ะ เค้ก 2 ปอนด์ ราคาเริ่มต้นที่ 750 บาทครับ/ค่ะ คุณต้องการแบบไหนเป็นพิเศษไหมครับ/คะ?', time: '4 นาทีที่แล้ว' },
    ],
    2: [
        { sender: 'user', text: 'ผมสั่งขนมไปเมื่อวานแต่ยังไม่ได้รับอีเมลยืนยันเลยครับ', time: '1 วันที่แล้ว' },
        { sender: 'admin', text: 'เรียนคุณลูกค้า ทางเรากำลังตรวจสอบให้อย่างเร่งด่วนครับ/ค่ะ ต้องขออภัยในความไม่สะดวกครับ/ค่ะ', time: '1 วันที่แล้ว' },
    ],
    3: [
        { sender: 'user', text: 'ขนมอร่อยมากค่ะ! ถูกใจทุกคนในบ้านเลย ไว้จะมาอุดหนุนใหม่นะคะ', time: '3 วันที่แล้ว' },
    ],
    4: [
        { sender: 'user', text: 'สวัสดีครับ ผมเป็นเจ้าของร้านกาแฟ อยากทราบราคาส่งของครอฟเฟิลและคุกกี้ครับ', time: '1 ชั่วโมงที่แล้ว' },
    ],
};

// ** NEW FUNCTION: คำนวณจำนวนกระทู้ที่มีข้อความใหม่จากลูกค้า (ยังไม่ได้ตอบกลับ) **
const calculateUnreadThreads = (messages: Message[], chatHistory: typeof mockChatHistory): number => {
    let unreadCount = 0;
    for (const msg of messages) {
        const history = chatHistory[msg.id];
        if (history && history.length > 0) {
            // Logic: ตรวจสอบว่าข้อความล่าสุดในแชทเป็นของ 'user' หรือไม่ (แปลว่า Admin ยังไม่ได้ตอบ)
            const latestMessage = history[history.length - 1];
            if (latestMessage.sender === 'user') {
                unreadCount++;
            }
        }
    }
    return unreadCount;
};
// ** END OF NEW FUNCTION **


const AdminMessagesPage = () => {
    // State สำหรับเก็บข้อความที่ถูกเลือก (null = อยู่ในหน้า List)
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    // ถ้ามีการเลือกข้อความ ให้แสดงหน้า Chat View
    if (selectedMessage) {
        return (
            <AdminChatView
                message={selectedMessage}
                onBack={() => setSelectedMessage(null)}
            />
        );
    }

    // หน้าหลัก: Message List
    return (
        <div className="min-h-screen bg-stone-50 p-4 md:p-8">
            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
                    <MessageSquareText className="w-8 h-8 text-green-600" />
                    ข้อความจากลูกค้า
                </h1>
                <p className="text-stone-500 mt-1">จัดการข้อความสอบถามและแชททั้งหมดจากลูกค้า</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel 1: Overview Cards */}
                <div className="lg:col-span-1 space-y-4">
                    <Card
                        icon={<Mail className="w-6 h-6 text-green-500" />}
                        title="ข้อความใหม่ (ยังไม่อ่าน)"
                        // อัปเดตการคำนวณ: ใช้ logic ใหม่ที่ตรวจสอบจาก chat history
                        value={calculateUnreadThreads(mockMessages, mockChatHistory).toString()}
                        color="text-green-600"
                    />
                    <Card
                        icon={<Users className="w-6 h-6 text-stone-500" />}
                        title="ลูกค้าที่ติดต่อทั้งหมด"
                        // ใช้ค่า mock เดิม
                        value="154"
                        color="text-stone-600"
                    />
                </div>

                {/* Panel 2: Message List */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-stone-100">
                    <h2 className="text-xl font-semibold text-stone-800 mb-4 border-b pb-3">
                        รายการข้อความล่าสุด
                    </h2>
                    <div className="space-y-3">
                        {mockMessages.map(msg => (
                            <MessageItem 
                                key={msg.id} 
                                message={msg} 
                                // เพิ่ม onClick handler เพื่อเลือกข้อความ
                                onClick={() => setSelectedMessage(msg)} 
                            />
                        ))}
                    </div>

                    {mockMessages.length === 0 && (
                        <div className="text-center py-10 text-stone-500">
                            ไม่มีข้อความใหม่ในขณะนี้
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ========== Component for Admin Chat View ==========

const AdminChatView = ({ message, onBack }: { message: Message, onBack: () => void }) => {
    // ดึงประวัติการแชทจำลอง
    const chatHistory = mockChatHistory[message.id] || [];
    const [replyText, setReplyText] = useState('');

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim() === '') return;

        // ในระบบจริง: ต้องส่งข้อความไปยัง Database
        console.log(`Sending reply to ${message.user}: ${replyText}`);

        // รีเซ็ต input
        setReplyText('');
        // ในระบบจริง: อัปเดตสถานะข้อความเป็น 'replied' และเพิ่มข้อความลงใน chatHistory
    };

    return (
        <div className="min-h-screen bg-white shadow-xl flex flex-col max-w-4xl mx-auto border-x border-stone-100">
            {/* Chat Header */}
            <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-4 sticky top-0 z-10">
                <button 
                    onClick={onBack} 
                    className="p-2 rounded-full hover:bg-stone-200 transition-colors"
                    aria-label="ย้อนกลับ"
                >
                    <ArrowLeft className="w-6 h-6 text-stone-700" />
                </button>
                <div className="flex flex-col min-w-0">
                    <h2 className="text-xl font-bold text-stone-900 truncate">{message.user}</h2>
                    <p className="text-sm text-stone-500 truncate">หัวข้อ: {message.subject}</p>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chatHistory.map((chat, index) => (
                    <div 
                        key={index} 
                        className={`flex ${chat.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-sm ${
                            chat.sender === 'admin' 
                                ? 'bg-green-600 text-white rounded-br-none' 
                                : 'bg-stone-200 text-stone-800 rounded-tl-none'
                        }`}>
                            <p className="text-sm break-words">{chat.text}</p>
                            <span className={`block mt-1 text-right text-xs ${chat.sender === 'admin' ? 'text-green-200' : 'text-stone-500'}`}>
                                {chat.time}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chat Input Footer */}
            <div className="p-4 border-t border-stone-100 bg-white sticky bottom-0 z-10">
                <form onSubmit={handleSendReply} className="flex gap-3">
                    <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="พิมพ์ข้อความตอบกลับ..."
                        className="flex-1 px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-stone-800"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={replyText.trim() === ''}
                        className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:bg-green-300 shadow-md"
                        aria-label="ส่งข้อความ"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
}

// ========== List Item Components ==========

// Component สำหรับแสดง Card สรุปข้อมูล
const Card = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-stone-100 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-stone-500">{title}</p>
            <p className={`text-4xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className="p-3 bg-stone-100 rounded-full">
            {icon}
        </div>
    </div>
);

// Component สำหรับแสดงรายการข้อความ
const MessageItem = ({ message, onClick }: { message: Message, onClick: () => void }) => {
    const isUnread = message.status === 'unread';
    return (
        <div 
            onClick={onClick}
            className={`p-4 rounded-lg cursor-pointer transition-all flex justify-between items-center ${isUnread ? 'bg-green-50 hover:bg-green-100 border-green-200 border-l-4' : 'bg-white hover:bg-stone-50 border-stone-100 border'}`}
        >
            <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isUnread ? 'text-green-700' : 'text-stone-700'}`}>
                    {message.subject}
                </p>
                <p className={`text-sm mt-1 truncate ${isUnread ? 'text-green-600 font-medium' : 'text-stone-500'}`}>
                    จาก: {message.user}
                </p>
            </div>
            <div className="ml-4 text-right">
                <span className={`text-xs font-medium ${isUnread ? 'text-red-500' : 'text-stone-400'}`}>
                    {isUnread ? 'ใหม่' : message.status === 'replied' ? 'ตอบแล้ว' : 'อ่านแล้ว'}
                </span>
                <p className="text-xs text-stone-400 mt-1">{message.time}</p>
            </div>
        </div>
    );
};


export default AdminMessagesPage;