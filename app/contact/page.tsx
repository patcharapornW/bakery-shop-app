"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/components/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import {
  Clock3,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  MessageSquare,
} from "lucide-react";

type ChatMessage = {
  id: string;
  message_id: string;
  sender: 'user' | 'admin';
  text: string;
  created_at: string;
};

type ContactMessage = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'replied' | 'read';
  created_at: string;
};

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useAlert();
  const { user } = useSupabaseAuth();
  
  // State สำหรับแชท
  const [currentMessage, setCurrentMessage] = useState<ContactMessage | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  // ดึงข้อความล่าสุดของผู้ใช้ (ถ้ามี)
  useEffect(() => {
    if (!user) return;

    async function fetchLatestMessage() {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching message:", error);
        return;
      }

      if (data) {
        setCurrentMessage(data);
        // ดึงประวัติการแชท
        setLoadingChat(true);
        try {
          const { data: repliesData, error: repliesError } = await supabase
            .from("message_replies")
            .select("*")
            .eq("message_id", data.id)
            .order("created_at", { ascending: true });

          if (repliesError) throw repliesError;

          // เพิ่มข้อความแรกจากผู้ใช้
          const initialMessage: ChatMessage = {
            id: 'initial',
            message_id: data.id,
            sender: 'user',
            text: data.message,
            created_at: data.created_at,
          };
          setChatHistory([initialMessage, ...(repliesData || [])]);
        } catch (error) {
          console.error("Error fetching chat history:", error);
        } finally {
          setLoadingChat(false);
        }
      }
    }

    fetchLatestMessage();
  }, [user]);

  // ดึงประวัติการแชท
  const fetchChatHistory = async (messageId: string) => {
    setLoadingChat(true);
    try {
      const { data, error } = await supabase
        .from("message_replies")
        .select("*")
        .eq("message_id", messageId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // เพิ่มข้อความแรกจากผู้ใช้
      if (currentMessage) {
        const initialMessage: ChatMessage = {
          id: 'initial',
          message_id: messageId,
          sender: 'user',
          text: currentMessage.message,
          created_at: currentMessage.created_at,
        };
        setChatHistory([initialMessage, ...(data || [])]);
      } else {
        setChatHistory(data || []);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setLoadingChat(false);
    }
  };

  // Real-time subscription สำหรับข้อความใหม่
  useEffect(() => {
    if (!currentMessage) return;

    const channel = supabase
      .channel(`message_replies:${currentMessage.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_replies",
          filter: `message_id=eq.${currentMessage.id}`,
        },
        async () => {
          // ดึงประวัติใหม่
          setLoadingChat(true);
          try {
            const { data, error } = await supabase
              .from("message_replies")
              .select("*")
              .eq("message_id", currentMessage.id)
              .order("created_at", { ascending: true });

            if (error) throw error;

            // เพิ่มข้อความแรกจากผู้ใช้
            const initialMessage: ChatMessage = {
              id: 'initial',
              message_id: currentMessage.id,
              sender: 'user',
              text: currentMessage.message,
              created_at: currentMessage.created_at,
            };
            setChatHistory([initialMessage, ...(data || [])]);
          } catch (error) {
            console.error("Error fetching chat history:", error);
          } finally {
            setLoadingChat(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // บันทึกข้อความลงฐานข้อมูล
      const { data, error } = await supabase
        .from("contact_messages")
        .insert([
          {
            user_id: user?.id || null,
            name: form.name,
            email: form.email,
            message: form.message,
            status: "unread",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // ตั้งค่า currentMessage และดึงประวัติ
      setCurrentMessage(data);
      fetchChatHistory(data.id);

      showAlert(
        "ส่งข้อความเรียบร้อย",
        `ขอบคุณครับคุณ ${form.name} เราได้รับข้อความแล้ว! เราจะติดต่อกลับโดยเร็วที่สุด`,
        "success"
      );
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error submitting message:", error);
      showAlert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ส่งข้อความใหม่ในแชท
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !currentMessage || !user) return;

    setSendingChat(true);
    try {
      // สร้างข้อความใหม่ใน message_replies
      const { error: replyError } = await supabase
        .from("message_replies")
        .insert([
          {
            message_id: currentMessage.id,
            sender: 'user',
            text: chatText.trim(),
          },
        ]);

      if (replyError) throw replyError;

      // อัปเดตสถานะข้อความเป็น 'unread' เพื่อให้ admin เห็นว่ามีข้อความใหม่
      await supabase
        .from("contact_messages")
        .update({ status: 'unread' })
        .eq("id", currentMessage.id);

      // ดึงประวัติใหม่
      fetchChatHistory(currentMessage.id);
      setChatText("");

      showAlert("ส่งข้อความสำเร็จ", "ข้อความของคุณถูกส่งแล้ว", "success");
    } catch (error) {
      console.error("Error sending chat:", error);
      showAlert("เกิดข้อผิดพลาด", "ไม่สามารถส่งข้อความได้", "error");
    } finally {
      setSendingChat(false);
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
    <div className="min-h-screen bg-[#fbf4eb] py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stone-800 mb-3">ติดต่อเรา</h1>
          <p className="text-stone-500 text-lg">
            สอบถามข้อมูล สั่งทำเค้ก หรือติชมบริการ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ข้อมูลติดต่อ */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 h-fit">
            <h3 className="text-2xl font-bold text-stone-800 mb-6">
              ช่องทางการติดต่อ
            </h3>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-700">ที่อยู่ร้าน</h4>
                  <p className="text-stone-600 text-sm mt-1">
                    123 ถนนสุขุมวิท แขวงคลองเตย <br /> เขตคลองเตย กรุงเทพมหานคร
                    10110
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-700">เบอร์โทรศัพท์</h4>
                  <p className="text-stone-600 text-sm mt-1">081-234-5678</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-700">LINE Official</h4>
                  <p className="text-stone-600 text-sm mt-1">@baankanom</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                  <Clock3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-700">เวลาทำการ</h4>
                  <p className="text-stone-600 text-sm mt-1">
                    เปิดทุกวัน: 08:00 - 20:00 น.
                  </p>
                </div>
              </div>
            </div>

            {/* แผนที่จำลอง */}
            <div className="mt-8 h-48 w-full bg-stone-200 rounded-xl flex items-center justify-center overflow-hidden relative">
              <div className="absolute text-stone-500 font-bold flex items-center gap-2">
                <MapIcon className="w-5 h-5" />
                แผนที่ Google Maps
              </div>
            </div>
          </div>

          {/* ฟอร์มส่งข้อความหรือแชท */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            {currentMessage ? (
              // แสดงแชทถ้ามีข้อความแล้ว
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                  <h3 className="text-2xl font-bold text-stone-800">
                    แชทกับเรา
                  </h3>
                </div>

                {/* ประวัติการแชท */}
                <div className="bg-stone-50 rounded-xl p-4 h-96 overflow-y-auto space-y-3 border border-stone-200">
                  {loadingChat ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div className="text-center py-10 text-stone-500">
                      <p>ยังไม่มีข้อความ</p>
                    </div>
                  ) : (
                    chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-xl shadow-sm ${
                            chat.sender === 'user'
                              ? 'bg-stone-800 text-white rounded-br-none'
                              : 'bg-white text-stone-800 rounded-tl-none border border-stone-200'
                          }`}
                        >
                          <p className="text-sm break-words leading-relaxed">
                            {chat.text}
                          </p>
                          <span
                            className={`block mt-1 text-right text-[10px] ${
                              chat.sender === 'user'
                                ? 'text-stone-300'
                                : 'text-stone-500'
                            }`}
                          >
                            {formatTime(chat.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ช่องพิมพ์ข้อความ */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-400 focus:border-stone-500 transition-all text-stone-800 placeholder-stone-400 bg-white"
                    disabled={sendingChat}
                  />
                  <button
                    type="submit"
                    disabled={!chatText.trim() || sendingChat}
                    className="p-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-all disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="ส่งข้อความ"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            ) : (
              // แสดงฟอร์มส่งข้อความแรกถ้ายังไม่มีข้อความ
              <>
                <h3 className="text-2xl font-bold text-stone-800 mb-6">
                  ส่งข้อความถึงเรา
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">
                      ชื่อของคุณ
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                      placeholder="ชื่อ-นามสกุล"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                      placeholder="example@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">
                      ข้อความ
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                      placeholder="พิมพ์ข้อความของคุณที่นี่..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-stone-800 text-white font-bold rounded-xl shadow-md hover:bg-stone-900 transition-all transform active:scale-95 disabled:bg-stone-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? "กำลังส่ง..." : "ส่งข้อความ"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
