import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User,
  Sparkles,
  Phone,
  Leaf
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zai-chat`;

const quickPrompts = [
  { label: "🥛 Best probiotic for beginners", message: "I'm new to probiotics. What's the best starter culture for gut health?" },
  { label: "💰 View prices", message: "Can you show me the price ranges for kefir, kombucha and EM1 products?" },
  { label: "🌱 EM1 for farming", message: "How do I use EM1 for my vegetable garden or farm?" },
  { label: "🧪 Spirulina cultures", message: "Tell me about your live spirulina and chlorella cultures for labs" },
  { label: "📦 Shipping info", message: "Where do you ship to and how long does delivery take?" },
];

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setIsLoading(true);
    setInput("");

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          action: "with_products"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.delta?.reasoning_content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev.filter(m => m.content !== ""),
        {
          role: "assistant",
          content: `I'm having trouble connecting right now. Please contact us directly:\n\n📞 **Reception:** +1 351 777 2848\n📱 **WhatsApp:** +27 83 447 4639\n📧 **Email:** admin@proagrisa.co.za`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleQuickPrompt = (message: string) => {
    if (isLoading) return;
    streamChat(message);
  };

  return (
    <>
      {/* Chat Button - Premium Gut Health Styling */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            data-ai-assistant
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-[#0B3D2E] to-[#22C55E] text-white px-6 py-4 rounded-full shadow-[0_10px_40px_-10px_rgba(34,197,94,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(34,197,94,0.6)] transition-all duration-300 hover:scale-105 group border border-[#22C55E]/30"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-semibold hidden sm:inline">Ask Gut Health Assistant</span>
            <Sparkles className="h-4 w-4 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[420px] h-[600px] max-h-[80vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-[#0B3D2E] to-[#0F4C3A]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#22C55E] to-[#4ADE80] flex items-center justify-center shadow-lg">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-lg">Gut Health Assistant</h3>
                  <p className="text-xs text-white/60 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                    Online • Probiotic Expert
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-4">
                  {/* Welcome message */}
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#22C55E] to-[#4ADE80] flex items-center justify-center flex-shrink-0 shadow">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-2xl rounded-tl-sm p-4">
                      <p className="text-sm font-medium text-foreground">
                        👋 Welcome to Gut Health Probiotics South Africa!
                      </p>
                      <p className="text-sm mt-2 text-muted-foreground">
                        I can help you with:
                      </p>
                      <ul className="text-sm mt-2 space-y-1.5 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                          Finding the right probiotic cultures
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                          Product recommendations & pricing
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                          EM1 & bio-fertilizer guidance
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                          Fermentation tips & recipes
                        </li>
                      </ul>
                      <p className="text-sm mt-4 font-medium text-foreground">
                        How can I help you today?
                      </p>
                    </div>
                  </div>

                  {/* Quick prompts */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickPrompt(prompt.message)}
                        className="text-xs px-4 py-2 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] rounded-full transition-colors border border-[#22C55E]/20 font-medium"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow ${
                        msg.role === "user" 
                          ? "bg-[#0B3D2E]" 
                          : "bg-gradient-to-br from-[#22C55E] to-[#4ADE80]"
                      }`}>
                        {msg.role === "user" ? (
                          <User className="h-5 w-5 text-white" />
                        ) : (
                          <Bot className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className={`flex-1 max-w-[85%] rounded-2xl p-4 ${
                        msg.role === "user"
                          ? "bg-[#0B3D2E] text-white rounded-tr-sm"
                          : "bg-muted/50 rounded-tl-sm border border-border/50"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content || "..."}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#22C55E] to-[#4ADE80] flex items-center justify-center shadow">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-4 border border-border/50">
                        <Loader2 className="h-5 w-5 animate-spin text-[#22C55E]" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Quick actions when in conversation */}
            {messages.length > 0 && (
              <div className="px-4 py-2 border-t bg-muted/30">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickPrompts.slice(0, 3).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickPrompt(prompt.message)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 bg-background border border-border rounded-full whitespace-nowrap hover:bg-[#22C55E]/10 hover:border-[#22C55E]/30 transition-colors disabled:opacity-50"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about probiotics, EM1, fermentation..."
                  disabled={isLoading}
                  className="flex-1 rounded-full border-border/50 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !input.trim()} 
                  size="icon"
                  className="rounded-full bg-[#22C55E] hover:bg-[#16A34A] w-10 h-10"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-2">
                <Phone className="h-3 w-3" />
                Need human help? Call +1 351 777 2848
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
