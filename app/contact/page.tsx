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
  
  const [currentMessage, setCurrentMessage] = useState<ContactMessage | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

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
        setLoadingChat(true);
        try {
          const { data: repliesData, error: repliesError } = await supabase
            .from("message_replies")
            .select("*")
            .eq("message_id", data.id)
            .order("created_at", { ascending: true });

          if (repliesError) throw repliesError;

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

  const fetchChatHistory = async (messageId: string) => {
    setLoadingChat(true);
    try {
      const { data, error } = await supabase
        .from("message_replies")
        .select("*")
        .eq("message_id", messageId)
        .order("created_at", { ascending: true });

      if (error) throw error;

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
          setLoadingChat(true);
          try {
            const { data, error } = await supabase
              .from("message_replies")
              .select("*")
              .eq("message_id", currentMessage.id)
              .order("created_at", { ascending: true });

            if (error) throw error;

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

      setCurrentMessage(data);
      fetchChatHistory(data.id);

      showAlert(
        "ส่งข้อความเรียบร้อย",
        `ขอบคุณค่ะคุณ ${form.name} เราได้รับข้อความแล้ว! จะรีบตอบกลับให้เร็วที่สุดเลยค่ะ`,
        "success"
      );
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error submitting message:", error);
      showAlert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้งนะคะ",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !currentMessage || !user) return;

    setSendingChat(true);
    try {
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

      await supabase
        .from("contact_messages")
        .update({ status: 'unread' })
        .eq("id", currentMessage.id);

      fetchChatHistory(currentMessage.id);
      setChatText("");
    } catch (error) {
      console.error("Error sending chat:", error);
      showAlert("เกิดข้อผิดพลาด", "ไม่สามารถส่งข้อความได้ค่ะ", "error");
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

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-bakery-cream py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs font-black tracking-[0.3em] text-bakery-pink uppercase bg-white px-4 py-1.5 rounded-full border border-pink-100 shadow-sm">
            Contact Us
          </span>
          <h1 className="text-5xl font-black text-bakery-black tracking-tight">ติดต่อสอบถาม</h1>
          <p className="text-stone-500 text-lg max-w-xl mx-auto font-medium">
            มีคำถามเรื่องขนม หรืออยากสั่งทำเค้กพิเศษ <br /> ทักแชทคุยกับเราได้เลยนะคะ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-pink-900/5 border border-pink-50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-bakery-cream rounded-full -mr-16 -mt-16 group-hover:bg-pink-50 transition-colors duration-500" />
              
              <h3 className="text-2xl font-black text-bakery-black mb-8 border-b border-pink-50 pb-4">
                ช่องทางติดต่อ
              </h3>

              <div className="space-y-8 relative z-10">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-bakery-pink shrink-0 shadow-sm shadow-pink-200">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-bakery-black">ที่อยู่ร้าน</h4>
                    <p className="text-stone-500 text-sm mt-1 leading-relaxed capitalize">
                      123 ถนนสุขุมวิท แขวงคลองเตย <br /> เขตคลองเตย กรุงเทพมหานคร 10110
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-bakery-pink shrink-0 shadow-sm shadow-pink-200">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-bakery-black">เบอร์โทรศัพท์</h4>
                    <p className="text-stone-500 text-sm mt-1 font-bold">081-234-5678</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-bakery-pink shrink-0 shadow-sm shadow-pink-200">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-bakery-black">LINE Official</h4>
                    <p className="text-stone-500 text-sm mt-1 font-bold">@baankanom</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-bakery-pink shrink-0 shadow-sm shadow-pink-200">
                    <Clock3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-bakery-black">เวลาทำการ</h4>
                    <p className="text-stone-500 text-sm mt-1">เปิดทุกวัน: 08:00 - 20:00 น.</p>
                  </div>
                </div>
              </div>

              {/* Fake Map */}
              <div className="mt-10 h-40 w-full bg-bakery-cream rounded-[2rem] border border-pink-50 flex items-center justify-center overflow-hidden relative shadow-inner group">
                <div className="absolute inset-0 bg-pink-500/5 group-hover:bg-pink-500/0 transition-colors" />
                <div className="text-stone-300 font-black text-xs uppercase tracking-widest flex items-center gap-2 group-hover:text-bakery-pink transition-colors">
                  <MapIcon className="w-4 h-4" />
                  Google Maps Preview
                </div>
              </div>
            </div>
          </div>

          {/* Form / Chat */}
          <div className="lg:col-span-7 h-full">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-pink-900/5 border border-pink-50 h-full flex flex-col overflow-hidden">
              {currentMessage ? (
                // Chat View
                <div className="flex flex-col h-full min-h-[600px]">
                  <div className="p-8 border-b border-pink-50 bg-bakery-cream/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-bakery-pink flex items-center justify-center text-white shadow-lg shadow-pink-200">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-bakery-black">แชทกับร้าน</h3>
                        <p className="text-xs text-bakery-pink font-bold uppercase tracking-wider">Online Support</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-bakery-cream/10">
                    {loadingChat ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-pink-100 border-t-bakery-pink rounded-full animate-spin" />
                      </div>
                    ) : (
                      chatHistory.map((chat) => (
                        <div
                          key={chat.id}
                          className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${
                              chat.sender === 'user'
                                ? 'bg-bakery-black text-white rounded-br-none'
                                : 'bg-white text-stone-800 rounded-tl-none border border-pink-100 shadow-pink-500/5'
                            }`}
                          >
                            <p className="text-sm leading-relaxed font-medium">
                              {chat.text}
                            </p>
                            <span
                              className={`block mt-2 text-[10px] font-bold ${
                                chat.sender === 'user'
                                  ? 'text-stone-400'
                                  : 'text-bakery-pink'
                              }`}
                            >
                              {formatTime(chat.created_at)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-6 bg-white border-t border-pink-50">
                    <form onSubmit={handleSendChat} className="flex gap-3">
                      <input
                        type="text"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder="พิมพ์ข้อความสอบถามที่นี่..."
                        className="flex-1 px-6 py-4 bg-bakery-cream border border-pink-100 rounded-2xl focus:ring-2 focus:ring-bakery-pink focus:bg-white outline-none transition-all font-medium text-bakery-black placeholder-stone-400"
                        disabled={sendingChat}
                      />
                      <button
                        type="submit"
                        disabled={!chatText.trim() || sendingChat}
                        className="w-14 h-14 bg-bakery-black text-white rounded-2xl hover:bg-stone-800 hover:scale-105 active:scale-95 transition-all disabled:bg-stone-200 flex items-center justify-center shadow-lg shadow-black/10"
                      >
                        <Send className="w-6 h-6" />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                // Initial Form
                <div className="p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-bakery-pink">
                      <Send className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black text-bakery-black">ส่งข้อความ</h3>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">ชื่อของคุณ</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-6 py-4 bg-bakery-cream border border-pink-50 rounded-2xl focus:ring-2 focus:ring-bakery-pink focus:bg-white transition-all outline-none font-bold text-bakery-black"
                          placeholder="ชื่อ-นามสกุล"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">อีเมลติดต่อ</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-6 py-4 bg-bakery-cream border border-pink-50 rounded-2xl focus:ring-2 focus:ring-bakery-pink focus:bg-white transition-all outline-none font-bold text-bakery-black"
                          placeholder="example@email.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">ข้อความของคุณ</label>
                      <textarea
                        required
                        rows={6}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-6 py-4 bg-bakery-cream border border-pink-50 rounded-2xl focus:ring-2 focus:ring-bakery-pink focus:bg-white transition-all outline-none font-medium text-bakery-black resize-none"
                        placeholder="พิมพ์ข้อความที่ต้องการสอบถามหรือสั่งทำเค้กพิเศษ..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-5 bg-bakery-black text-white font-black rounded-2xl shadow-xl shadow-black/10 hover:bg-stone-800 hover:scale-[1.02] active:scale-95 transition-all disabled:bg-stone-200"
                    >
                      {submitting ? "กำลังส่งข้อความ..." : "ส่งข้อความหาเรา"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
