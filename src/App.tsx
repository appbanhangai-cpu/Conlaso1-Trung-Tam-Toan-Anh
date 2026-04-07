import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  MapPin, 
  BookOpen, 
  Brain, 
  CheckCircle2, 
  Users, 
  Star, 
  ChevronRight, 
  Menu, 
  X, 
  GraduationCap, 
  Trophy, 
  MessageCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Trash2,
  Filter,
  Search,
  LogIn,
  Facebook,
  Youtube,
  Music,
  Heart,
  AlertCircle,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import { db, auth, storage } from './firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDocFromServer,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  User
} from 'firebase/auth';

// --- Types ---
interface Registration {
  id: string;
  parentName: string;
  phone: string;
  studentName: string;
  studentClass: string;
  subjects: string[];
  note: string;
  createdAt: any;
  status: 'new' | 'contacted' | 'enrolled';
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  approved: boolean;
  createdAt: any;
}

interface Student {
  id: string;
  name: string;
  phone: string;
  school: string;
  address: string;
  photoUrl: string;
  class: string;
  subjects: string[];
  createdAt: any;
}

// --- Utils ---
const ADMIN_EMAIL = "appbanhangai@gmail.com";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
            <h2 className="text-2xl font-bold text-brand-dark mb-4">Đã có lỗi xảy ra</h2>
            <p className="text-gray-500 mb-6">Chúng tôi rất tiếc về sự cố này. Vui lòng tải lại trang hoặc thử lại sau.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-brand-accent text-white px-8 py-3 rounded-xl font-bold shadow-lg"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const handleFirestoreError = (error: any, operation: string, path: string) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operation,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Conlaso1 Logo" 
              className="w-full h-full object-contain z-10"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
              referrerPolicy="no-referrer"
            />
            <div className="hidden absolute inset-0 bg-brand-accent rounded-xl flex items-center justify-center text-white shadow-lg">
              <Heart size={24} fill="currentColor" />
            </div>
          </div>
          <span className={`text-xl font-bold ${isScrolled ? 'text-brand-dark' : 'text-brand-dark md:text-white'}`}>CONLASO1</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className={`flex items-center gap-2 text-sm font-medium ${isScrolled ? 'text-brand-dark' : 'text-white'}`}>
            <Phone size={16} className="text-brand-cta" />
            <span>0961 771 339</span>
          </div>
          <a href="#register" className="bg-brand-cta hover:bg-opacity-90 text-white px-6 py-2 rounded-full font-semibold transition-all">
            Đăng ký học thử
          </a>
        </div>
      </div>
    </nav>
  );
};

const StickyNav = () => {
  const menuItems = [
    { id: 'home', label: 'Trang chủ', icon: <BookOpen size={18} /> },
    { id: 'programs', label: 'Chương trình', icon: <GraduationCap size={18} /> },
    { id: 'why', label: 'Lợi ích', icon: <Star size={18} /> },
    { id: 'teachers', label: 'Đội ngũ', icon: <Users size={18} /> },
    { id: 'feedback', label: 'Phụ huynh', icon: <MessageCircle size={18} /> },
    { id: 'pricing', label: 'Học phí', icon: <Trophy size={18} /> },
    { id: 'location', label: 'Địa chỉ', icon: <MapPin size={18} /> },
    { id: 'register', label: 'Đăng ký', icon: <CheckCircle2 size={18} /> },
  ];

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
      {menuItems.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="group flex items-center justify-end gap-3"
        >
          <span className="bg-brand-dark text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {item.label}
          </span>
          <div className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-brand-accent hover:bg-brand-accent hover:text-white transition-all border border-gray-100">
            {item.icon}
          </div>
        </a>
      ))}
    </div>
  );
};

const Hero = () => (
  <section id="home" className="relative min-h-[85vh] flex items-center pt-16 overflow-hidden bg-[#0a0f1a]">
    {/* Background Pattern */}
    <div className="absolute inset-0">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_rgba(37,99,235,0.15),_transparent_50%)]" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,_rgba(245,158,11,0.1),_transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </div>
    
    <div className="container mx-auto px-4 relative z-10">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-3">
            <span className="text-white/70 text-[10px] font-medium tracking-[0.2em] uppercase">
              TRUNG TÂM TIẾNG ANH & TOÁN
            </span>
          </div>
          <h1 className="font-serif leading-[1.1] mb-6">
            <div className="text-2xl md:text-4xl lg:text-5xl font-bold mb-1 drop-shadow-lg">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cta to-yellow-200">Conlaso1 –</span>
              <span className="text-white ml-3">Đồng</span>
            </div>
            <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-1 flex items-baseline gap-3 drop-shadow-lg">
              Hành Cùng Con
              <span className="text-base md:text-xl text-gray-400 font-sans font-medium">Chinh</span>
            </div>
            <div className="text-2xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-cta via-yellow-200 to-brand-cta drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              Phục Tương Lai
            </div>
          </h1>
          <p className="text-gray-300 text-base md:text-lg mb-8 max-w-xl leading-relaxed">
            Giúp học sinh xây chắc nền tảng Toán và Tiếng Anh, nâng cao tư duy, tăng sự tự tin và cải thiện kết quả học tập rõ rệt.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <a href="#register" className="w-full sm:w-auto bg-brand-cta hover:bg-opacity-90 text-white px-6 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-cta/20">
              ĐĂNG KÝ HỌC THỬ <ChevronRight size={18} />
            </a>
            <a href="#register" className="hidden sm:inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-base transition-all border border-white/20">
              NHẬN TƯ VẤN NGAY
            </a>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            <div className="text-white">
              <div className="text-brand-cta font-bold text-lg">100%</div>
              <div className="text-[10px] text-gray-400">Lớp học theo trình độ</div>
            </div>
            <div className="text-white">
              <div className="text-brand-cta font-bold text-lg">Tận tâm</div>
              <div className="text-[10px] text-gray-400">Giáo viên chuyên môn</div>
            </div>
            <div className="text-white">
              <div className="text-brand-cta font-bold text-lg">Sát sao</div>
              <div className="text-[10px] text-gray-400">Theo sát từng học sinh</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative z-10 rounded-3xl overflow-hidden shadow-xl border-4 border-white/10">
            <img 
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000" 
              alt="Học sinh Conlaso1" 
              className="w-full h-auto"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Contact Info Buttons below image */}
          <div className="mt-6 flex flex-col sm:flex-row gap-6 justify-center">
            <motion.a 
              href="tel:0961771339" 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 bg-brand-accent/20 text-brand-accent rounded-full flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all shadow-lg shadow-brand-accent/10">
                <Phone size={18} />
              </div>
              <motion.span
                className="text-white font-bold text-lg"
                animate={{ color: ["#ffffff", "#ffcc00", "#ffffff"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                0961771339
              </motion.span>
            </motion.a>
            <motion.a 
              href="https://www.google.com/maps/dir/?api=1&destination=21.03098388770399,105.85203917430619" 
              target="_blank" 
              rel="noopener noreferrer"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 bg-brand-accent/20 text-brand-accent rounded-full flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all shadow-lg shadow-brand-accent/10">
                <MapPin size={18} />
              </div>
              <motion.span
                className="text-white font-bold text-lg"
                animate={{ color: ["#ffffff", "#ffcc00", "#ffffff"] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                16A Lý Thái Tổ
              </motion.span>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const Programs = () => {
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  const programs = [
    {
      title: "Tiếng Anh nền tảng",
      desc: "Phát âm chuẩn, tăng từ vựng, củng cố ngữ pháp và rèn luyện 4 kỹ năng Nghe - Nói - Đọc - Viết.",
      icon: <BookOpen className="text-blue-600" />,
      color: "bg-blue-50",
      details: {
        target: "Xây dựng gốc rễ vững chắc cho học sinh mới bắt đầu hoặc mất gốc.",
        content: [
          "Học phát âm chuẩn quốc tế (IPA) ngay từ đầu.",
          "Mở rộng vốn từ vựng qua các chủ đề gần gũi, sinh động.",
          "Hệ thống hóa ngữ pháp căn bản một cách dễ hiểu.",
          "Rèn luyện phản xạ nghe nói tự nhiên qua các hoạt động tương tác."
        ],
        benefit: "Giúp con yêu thích tiếng Anh, không còn sợ hãi và tự tin giao tiếp cơ bản."
      }
    },
    {
      title: "Tiếng Anh nâng cao",
      desc: "Phát triển phản xạ giao tiếp, tăng kỹ năng làm bài và chuẩn bị cho các kỳ thi quan trọng.",
      icon: <Star className="text-yellow-600" />,
      color: "bg-yellow-50",
      details: {
        target: "Phát triển kỹ năng chuyên sâu cho học sinh đã có nền tảng.",
        content: [
          "Nâng cao kỹ năng thuyết trình và tranh biện bằng tiếng Anh.",
          "Rèn luyện kỹ năng viết bài luận logic và mạch lạc.",
          "Luyện tập các dạng bài thi học sinh giỏi, chứng chỉ quốc tế.",
          "Mở rộng kiến thức văn hóa và xã hội qua ngôn ngữ."
        ],
        benefit: "Bứt phá điểm số tại trường và sẵn sàng cho các kỳ thi chứng chỉ quốc tế."
      }
    },
    {
      title: "Toán tư duy",
      desc: "Rèn luyện logic, khả năng phân tích, giúp trẻ học chủ động và không học vẹt.",
      icon: <Brain className="text-purple-600" />,
      color: "bg-purple-50",
      details: {
        target: "Khơi dậy niềm đam mê và khả năng suy luận logic từ sớm.",
        content: [
          "Tiếp cận toán học qua hình ảnh, mô hình và trò chơi trí tuệ.",
          "Áp dụng phương pháp toán Singapore giúp hiểu bản chất vấn đề.",
          "Rèn luyện khả năng quan sát, phân tích và giải quyết tình huống.",
          "Kích thích sự sáng tạo và ham học hỏi của trẻ."
        ],
        benefit: "Hình thành tư duy logic sắc bén, giúp con học toán một cách nhẹ nhàng và hiệu quả."
      }
    },
    {
      title: "Toán nâng cao",
      desc: "Củng cố kiến thức trọng tâm, luyện bài theo chuyên đề và nâng cao kết quả tại trường.",
      icon: <Trophy className="text-orange-600" />,
      color: "bg-orange-50",
      details: {
        target: "Chinh phục các kỳ thi học sinh giỏi và thi chuyển cấp.",
        content: [
          "Hệ thống kiến thức trọng tâm và các chuyên đề toán học nâng cao.",
          "Luyện tập các phương pháp giải toán nhanh và tư duy đột phá.",
          "Tiếp cận các bộ đề thi thử sát với thực tế các kỳ thi quan trọng.",
          "Rèn luyện kỹ năng trình bày bài làm chặt chẽ và chính xác."
        ],
        benefit: "Tự tin đối đầu với các bài toán khó và đạt kết quả cao trong các kỳ thi chuyên."
      }
    }
  ];

  return (
    <section id="programs" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-4">Chương Trình Học Nổi Bật Tại Conlaso1</h2>
          <div className="w-20 h-1.5 bg-brand-accent mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {programs.map((p, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className={`${p.color} p-8 rounded-3xl transition-all border border-transparent hover:border-brand-accent/20 shadow-sm flex flex-col`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                  {p.icon}
                </div>
                <h3 className="text-lg font-bold text-brand-dark leading-tight">{p.title}</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">{p.desc}</p>
              <button 
                onClick={() => setSelectedProgram(p)}
                className="text-brand-accent font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
              >
                Xem chi tiết <ChevronRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-12">
          <a href="#register" className="inline-block bg-brand-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-dark transition-all">
            TƯ VẤN LỘ TRÌNH PHÙ HỢP
          </a>
        </div>
      </div>

      {/* Program Detail Modal */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProgram(null)}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setSelectedProgram(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors z-10"
              >
                <X size={16} />
              </button>
              
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-brand-bg rounded-xl flex items-center justify-center shadow-inner">
                    {selectedProgram.icon}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-brand-dark">{selectedProgram.title}</h3>
                    <div className="h-1 w-10 bg-brand-accent rounded-full mt-1"></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Mục tiêu khóa học</h4>
                    <p className="text-brand-dark font-medium text-base leading-relaxed">
                      {selectedProgram.details.target}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Nội dung đào tạo</h4>
                    <ul className="space-y-2">
                      {selectedProgram.details.content.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-600 text-sm">
                          <div className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 size={10} />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-brand-bg p-4 rounded-xl border border-brand-accent/10">
                    <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-wider mb-1">Kết quả đạt được</h4>
                    <p className="text-brand-dark font-semibold text-sm">
                      {selectedProgram.details.benefit}
                    </p>
                  </div>

                  <div className="pt-2">
                    <a 
                      href="#register" 
                      onClick={() => setSelectedProgram(null)}
                      className="w-full bg-brand-cta hover:bg-opacity-90 text-white py-3 rounded-xl font-bold text-center block transition-all shadow-lg shadow-brand-cta/20 text-sm"
                    >
                      ĐĂNG KÝ TƯ VẤN CHI TIẾT
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

const WhyChooseUs = () => {
  const reasons = [
    "Lộ trình học rõ ràng theo từng độ tuổi và năng lực",
    "Kết hợp song song kiến thức nền tảng và nâng cao",
    "Giáo viên tận tâm, sát sao với từng học sinh",
    "Lớp học quy mô phù hợp, dễ tương tác",
    "Báo cáo tiến độ định kỳ cho phụ huynh",
    "Môi trường học tích cực, truyền cảm hứng cho trẻ"
  ];

  return (
    <section id="why" className="py-16 bg-brand-bg">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-dark mb-6">Lý Do Nhiều Phụ Huynh Tin Tưởng Conlaso1</h2>
            <div className="space-y-3">
              {reasons.map((reason, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="w-5 h-5 bg-brand-accent text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={12} />
                  </div>
                  <p className="text-gray-700 font-medium text-sm">{reason}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-6 text-brand-accent font-bold italic text-base">
              "Conlaso1 không chỉ giúp con học tốt hơn, mà còn giúp con tự tin hơn mỗi ngày."
            </p>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1000" 
                alt="Lớp học Conlaso1" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Benefits = () => {
  const benefits = [
    {
      title: "Học chắc kiến thức",
      desc: "Nắm rõ nền tảng Tiếng Anh và Toán, giảm hổng kiến thức.",
      icon: <BookOpen className="text-white" />
    },
    {
      title: "Tăng sự tự tin",
      desc: "Con mạnh dạn hơn khi giao tiếp và giải bài.",
      icon: <Star className="text-white" />
    },
    {
      title: "Cải thiện điểm số",
      desc: "Từng bước nâng cao kết quả học tập trên lớp.",
      icon: <Trophy className="text-white" />
    },
    {
      title: "Phát triển tư duy",
      desc: "Biết suy luận, phân tích và giải quyết vấn đề tốt hơn.",
      icon: <Brain className="text-white" />
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-3">Con Nhận Được Gì Khi Học Tại Conlaso1?</h2>
          <div className="w-16 h-1 bg-brand-accent mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-4 mb-6 md:block md:text-center group">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-brand-accent rounded-2xl flex items-center justify-center flex-shrink-0 md:mx-auto mb-0 md:mb-4 group-hover:rotate-6 transition-transform shadow-lg shadow-brand-accent/20">
                {b.icon}
              </div>
              <div className="text-left md:text-center">
                <h3 className="text-lg font-bold text-brand-dark mb-1 md:mb-2">{b.title}</h3>
                <p className="text-gray-600 text-xs">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Teachers = () => (
  <section id="teachers" className="py-16 bg-brand-dark text-white">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <img 
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1000" 
            alt="Giáo viên Conlaso1" 
            className="rounded-3xl shadow-xl border-4 border-white/10"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Đội Ngũ Giáo Viên Tận Tâm – Phương Pháp Giảng Dạy Dễ Hiểu</h2>
          <p className="text-gray-300 text-base mb-6 leading-relaxed">
            Tại Conlaso1, đội ngũ giáo viên luôn đặt sự tiến bộ của học sinh làm trung tâm. Mỗi buổi học được xây dựng với mục tiêu rõ ràng, giúp học sinh tiếp thu kiến thức theo cách dễ hiểu, dễ nhớ và áp dụng được ngay.
          </p>
          <div className="space-y-4">
            {[
              { title: "Giảng dạy tận tâm", desc: "Luôn kiên nhẫn và đồng hành cùng sự tiến bộ của con." },
              { title: "Theo sát tiến độ từng học sinh", desc: "Nắm rõ điểm mạnh, điểm yếu để có lộ trình riêng." },
              { title: "Hỗ trợ phụ huynh đồng hành", desc: "Báo cáo thường xuyên và tư vấn phương pháp học tại nhà." }
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 bg-brand-accent/20 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-accent">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-base font-bold mb-0.5">{item.title}</h4>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Testimonials = () => {
  const [realReviews, setRealReviews] = useState<Testimonial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, () => {
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const q = query(
      collection(db, 'testimonials'), 
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Testimonial[];
      setRealReviews(data);
    }, (error) => {
      handleFirestoreError(error, 'get', 'testimonials');
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  const staticReviews = [
    {
      name: "Phụ huynh học sinh lớp 4",
      text: "Sau một thời gian học tại Conlaso1, con tự tin hơn hẳn với môn Toán, làm bài nhanh và chủ động hơn.",
      avatar: "https://i.pravatar.cc/150?u=1",
      rating: 5
    },
    {
      name: "Phụ huynh học sinh lớp 6",
      text: "Tiếng Anh của con tiến bộ rõ rệt, đặc biệt là phần từ vựng và phản xạ giao tiếp.",
      avatar: "https://i.pravatar.cc/150?u=2",
      rating: 5
    },
    {
      name: "Phụ huynh học sinh lớp 8",
      text: "Giáo viên nhiệt tình, có trách nhiệm và luôn cập nhật tình hình học cho phụ huynh.",
      avatar: "https://i.pravatar.cc/150?u=3",
      rating: 5
    },
    {
      name: "Phụ huynh học sinh lớp 2",
      text: "Con rất thích đi học tại trung tâm. Các cô dạy rất dễ hiểu, con về nhà tự giác làm bài tập mà không cần nhắc nhở.",
      avatar: "https://i.pravatar.cc/150?u=4",
      rating: 5
    },
    {
      name: "Học sinh lớp 9",
      text: "Em đã cải thiện được điểm số môn Tiếng Anh đáng kể sau 3 tháng học. Phương pháp dạy ở đây rất khác biệt và hiệu quả.",
      avatar: "https://i.pravatar.cc/150?u=5",
      rating: 5
    },
    {
      name: "Phụ huynh học sinh lớp 5",
      text: "Trung tâm có môi trường học tập rất tốt, sạch sẽ và hiện đại. Tôi rất yên tâm khi gửi con học tại đây.",
      avatar: "https://i.pravatar.cc/150?u=6",
      rating: 5
    },
    {
      name: "Phụ huynh học sinh lớp 7",
      text: "Môn Toán không còn là nỗi sợ của con nữa. Cảm ơn các thầy cô đã kiên trì hướng dẫn và khích lệ con.",
      avatar: "https://i.pravatar.cc/150?u=7",
      rating: 5
    },
    {
      name: "Học sinh lớp 12",
      text: "Lộ trình ôn thi đại học rất rõ ràng. Em cảm thấy tự tin hơn rất nhiều cho kỳ thi sắp tới.",
      avatar: "https://i.pravatar.cc/150?u=8",
      rating: 5
    },
    {
      name: "Phụ huynh học sinh lớp 3",
      text: "Dịch vụ đưa đón và chăm sóc học sinh rất chu đáo. Con tôi tiến bộ cả về kiến thức lẫn kỹ năng sống.",
      avatar: "https://i.pravatar.cc/150?u=9",
      rating: 5
    }
  ];

  return (
    <section id="feedback" className="py-16 bg-brand-bg">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-3">Phản Hồi Từ Phụ Huynh Và Học Sinh</h2>
          <div className="w-16 h-1 bg-brand-accent mx-auto rounded-full mb-6"></div>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-brand-cta hover:bg-opacity-90 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-brand-cta/20 transition-all flex items-center gap-2 mx-auto text-sm"
          >
            <MessageCircle size={18} /> GỬI ĐÁNH GIÁ & BÌNH LUẬN
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Static Reviews */}
          {staticReviews.map((r, i) => (
            <motion.div 
              key={`static-${i}`}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative"
            >
              <div className="flex gap-1 text-brand-cta mb-4">
                {[...Array(r.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-gray-600 italic mb-6 leading-relaxed text-sm">"{r.text}"</p>
              <div className="flex items-center gap-3">
                <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full" />
                <div className="font-bold text-brand-dark text-xs">{r.name}</div>
              </div>
            </motion.div>
          ))}
          {/* Real Reviews */}
          {realReviews.map((r) => (
            <motion.div 
              key={r.id}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative"
            >
              <div className="flex gap-1 text-brand-cta mb-4">
                {[...Array(r.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-gray-600 italic mb-6 leading-relaxed text-sm">"{r.content}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent font-bold text-sm">
                  {r.name[0]}
                </div>
                <div>
                  <div className="font-bold text-brand-dark text-xs">{r.name}</div>
                  <div className="text-[9px] text-gray-400 uppercase font-bold">{r.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-12 w-full max-w-lg shadow-2xl relative"
            >
              <button 
                onClick={() => setShowForm(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-brand-dark transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-2xl font-bold text-brand-dark mb-2">Gửi đánh giá của bạn</h3>
              <p className="text-gray-500 text-sm mb-8">Cảm ơn bạn đã chia sẻ trải nghiệm cùng Conlaso1.</p>
              
              <TestimonialForm onSuccess={() => setShowForm(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Contact Button */}
      <motion.a
        href="tel:0961771339"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-6 right-6 z-[90] bg-white p-2 rounded-[2rem] shadow-2xl hidden md:flex items-center justify-center group border border-gray-100"
      >
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center relative">
          <div className="w-10 h-10 bg-red-500 rounded-full animate-pulse" />
          <Phone size={20} className="absolute text-white" fill="currentColor" />
        </div>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:px-4 transition-all duration-500 text-brand-dark font-bold whitespace-nowrap">
          Gọi ngay: 0961.771.339
        </span>
      </motion.a>
    </section>
  );
};

const TestimonialForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Phụ huynh',
    content: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        ...formData,
        rating,
        approved: false,
        createdAt: serverTimestamp()
      });
      alert('Cảm ơn bạn! Đánh giá của bạn đã được gửi và đang chờ phê duyệt.');
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, 'create', 'testimonials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <Star 
              size={32} 
              fill={star <= rating ? "#FFC107" : "none"} 
              stroke={star <= rating ? "#FFC107" : "#CBD5E1"} 
            />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Họ tên</label>
          <input 
            required 
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-sm"
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Vai trò</label>
          <select 
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-sm appearance-none"
          >
            <option value="Phụ huynh">Phụ huynh</option>
            <option value="Học sinh">Học sinh</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Nội dung đánh giá & Bình luận</label>
        <textarea 
          required
          value={formData.content}
          onChange={e => setFormData({...formData, content: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all h-32 resize-none text-sm"
          placeholder="Chia sẻ cảm nhận hoặc bình luận của bạn về trung tâm..."
        ></textarea>
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-brand-accent hover:bg-brand-dark text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-accent/20 transition-all disabled:opacity-50"
      >
        {loading ? 'ĐANG GỬI...' : 'GỬI ĐÁNH GIÁ'}
      </button>
    </form>
  );
};

const Process = () => {
  const steps = [
    { title: "Đăng ký tư vấn", desc: "Để lại thông tin để được hỗ trợ nhanh nhất." },
    { title: "Kiểm tra trình độ", desc: "Đánh giá năng lực đầu vào hoàn toàn miễn phí." },
    { title: "Xếp lớp phù hợp", desc: "Dựa trên kết quả để chọn lớp học tối ưu nhất." },
    { title: "Học tập & Theo dõi", desc: "Bắt đầu lộ trình và nhận báo cáo định kỳ." }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-3">Quy Trình Đồng Hành Cùng Học Sinh</h2>
          <p className="text-gray-500 text-sm">Mỗi học sinh đều có định hướng học tập phù hợp với năng lực và mục tiêu riêng.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connector Line */}
          <div className="absolute top-10 left-0 w-full h-0.5 bg-gray-100 hidden md:block -z-10"></div>
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 bg-brand-accent text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow-lg shadow-brand-accent/20 border-4 border-white">
                {i + 1}
              </div>
              <h3 className="text-base font-bold text-brand-dark mb-1">{step.title}</h3>
              <p className="text-gray-500 text-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = ({ onSelectPackage }: { onSelectPackage: (pkg: any) => void }) => {
  const packages = [
    {
      title: "GÓI NÂNG CAO",
      desc: "Giải pháp tối ưu giúp con cải thiện Tiếng Anh & Toán rõ rệt",
      price: "1.800.000đ",
      period: "/ tháng",
      features: [
        "3 buổi/tuần",
        "Kiểm tra định kỳ",
        "Báo cáo tiến độ cho phụ huynh",
        "Lộ trình phù hợp theo năng lực",
        "Giáo viên theo sát quá trình học"
      ],
      cta: "ĐĂNG KÝ TƯ VẤN NGAY",
      support: "Phù hợp với đa số học sinh cần cải thiện kết quả học tập và xây nền tảng vững.",
      featured: true,
      badge: "🔥 PHỤ HUYNH CHỌN NHIỀU NHẤT",
      order: 1
    },
    {
      title: "GÓI CƠ BẢN",
      desc: "Phù hợp học sinh cần củng cố lại kiến thức nền",
      price: "1.200.000đ",
      period: "/ tháng",
      features: [
        "2 buổi/tuần",
        "Ôn tập kiến thức nền tảng",
        "Lớp học theo trình độ",
        "Môi trường học tập tích cực"
      ],
      cta: "CHỌN GÓI CƠ BẢN",
      support: "Dành cho học sinh cần học chắc lại từ gốc trước khi tăng tốc.",
      featured: false,
      order: 2
    },
    {
      title: "GÓI PREMIUM",
      desc: "Đồng hành chuyên sâu với cường độ cao hơn",
      price: "3.500.000đ",
      period: "/ tháng",
      features: [
        "5 buổi/tuần",
        "Theo sát chuyên sâu",
        "Báo cáo chi tiết hàng tuần",
        "Hỗ trợ định hướng học tập",
        "Tăng cường luyện tập nâng cao"
      ],
      cta: "NHẬN TƯ VẤN RIÊNG",
      support: "Phù hợp với học sinh cần lộ trình chuyên sâu và cường độ học cao.",
      featured: false,
      order: 3
    }
  ];

  // Sort by order for mobile (Nâng Cao first)
  const sortedPackages = [...packages].sort((a, b) => a.order - b.order);

  return (
    <section id="pricing" className="py-16 bg-brand-bg">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-3 uppercase tracking-tight">Chọn Lộ Trình Phù Hợp Cho Con</h2>
          <div className="w-16 h-1 bg-brand-accent mx-auto rounded-full mb-4"></div>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm">
            Mỗi học sinh có một năng lực khác nhau. Conlaso1 giúp phụ huynh chọn đúng chương trình để con học chắc hơn, tiến bộ nhanh hơn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {sortedPackages.map((p, i) => (
            <div 
              key={i} 
              className={`relative p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col ${
                p.featured 
                  ? 'bg-brand-dark text-white border-brand-accent shadow-2xl md:scale-105 z-10' 
                  : 'bg-white text-brand-dark border-blue-200 shadow-sm hover:shadow-lg hover:border-blue-400'
              }`}
            >
              {p.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-cta text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  {p.badge}
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-1">{p.title}</h3>
                <p className={`text-[10px] ${p.featured ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
                  {p.desc}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{p.price}</span>
                  <span className={`text-xs ${p.featured ? 'text-gray-400' : 'text-gray-500'}`}>{p.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 size={14} className="text-brand-accent flex-shrink-0 mt-0.5" />
                    <span className={p.featured ? 'text-gray-200' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto space-y-3">
                <a 
                  href="#register" 
                  className={`block w-full text-center py-3 rounded-2xl font-bold transition-all shadow-lg text-sm border-2 border-b-4 active:translate-y-[2px] active:border-b-0 active:shadow-inner hover:translate-y-[-2px] hover:shadow-xl ${
                    p.featured 
                      ? 'bg-brand-cta border-amber-600 text-white shadow-brand-cta/20' 
                      : 'bg-white border-gray-200 text-brand-dark shadow-gray-100/50 hover:bg-gray-50'
                  }`}
                >
                  {p.cta}
                </a>
                <button 
                  onClick={() => onSelectPackage(p)}
                  className={`block w-full text-center py-3 rounded-2xl font-bold transition-all border-2 text-sm flex items-center justify-center gap-2 group ${
                    p.featured 
                      ? 'border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10' 
                      : 'border-brand-accent/20 text-brand-accent hover:bg-brand-accent/5'
                  }`}
                >
                  <span className="relative">
                    Thanh toán = Mã QR
                    <span className="absolute -top-4 -right-4 text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-bounce">HOT</span>
                  </span>
                </button>
                <p className={`text-[10px] text-center mt-4 italic ${p.featured ? 'text-gray-400' : 'text-gray-500'}`}>
                  {p.support}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Help Block */}
        <div className="mt-12 max-w-3xl mx-auto bg-white rounded-[2rem] p-6 md:p-8 text-center shadow-xl border border-gray-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-accent"></div>
          <h3 className="text-lg md:text-xl font-bold text-brand-dark mb-3">Phụ huynh chưa biết chọn gói nào?</h3>
          <p className="text-gray-500 mb-6 text-xs md:text-sm">
            Đừng lo. Đội ngũ Conlaso1 sẽ kiểm tra trình độ và tư vấn lộ trình phù hợp nhất cho từng học sinh.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <a 
              href="#register" 
              className="w-full md:w-auto bg-brand-accent hover:bg-brand-dark text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-accent/20 text-sm"
            >
              NHẬN TƯ VẤN MIỄN PHÍ
            </a>
            <div className="flex items-center gap-3 text-brand-dark font-bold text-sm">
              <Phone size={18} className="text-brand-accent" />
              <span>0961 771 339 - 0988 771 339</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const RegistrationForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    studentName: '',
    studentClass: '1',
    subjects: [] as string[],
    note: ''
  });

  useEffect(() => {
    if (submitted) {
      const element = document.getElementById('form-container');
      if (element) {
        // Use a small timeout to ensure the DOM has updated with the success message
        setTimeout(() => {
          const yOffset = -100; // Offset for header
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [submitted]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Manual validation check for mobile
    if (!formData.parentName.trim() || !formData.phone.trim() || !formData.studentName.trim()) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (formData.phone.trim().length < 9) {
      setError('Số điện thoại phải có ít nhất 9 chữ số.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      console.log('Submitting form...', formData);
      const path = 'registrations';
      await addDoc(collection(db, path), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'new'
      });
      console.log('Form submitted successfully');
      setSubmitted(true);
    } catch (error) {
      console.error('Form submission error:', error);
      setError('Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại hoặc liên hệ hotline.');
      handleFirestoreError(error, 'create', 'registrations');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject) 
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  return (
    <section id="register" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto bg-brand-accent rounded-[3rem] shadow-2xl flex flex-col md:flex-row">
          <div className="md:w-1/2 p-8 md:p-10 text-white flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Đăng Ký Nhận Tư Vấn Và Học Thử Miễn Phí</h2>
            <p className="text-blue-100 mb-6 leading-relaxed text-sm">
              Đội ngũ Conlaso1 sẽ liên hệ tư vấn lộ trình học tập phù hợp nhất cho con trong vòng 24h làm việc.
            </p>
            <div className="space-y-4">
              <motion.a 
                href="tel:0961771339"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-blue-200 uppercase font-bold">Hotline hỗ trợ</div>
                  <div className="font-bold group-hover:text-brand-cta transition-colors text-sm">0961 771 339 - 0988 771 339</div>
                </div>
              </motion.a>
              <motion.a 
                href="https://www.google.com/maps/dir/?api=1&destination=21.03098388770399,105.85203917430619"
                target="_blank"
                rel="noopener noreferrer"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-blue-200 uppercase font-bold">Địa chỉ trung tâm</div>
                  <div className="font-bold group-hover:text-brand-cta transition-colors text-sm">16A Lý Thái Tổ, Hoàn Kiếm, Hà Nội</div>
                </div>
              </motion.a>
            </div>
          </div>
          <div id="form-container" className={`md:w-1/2 p-6 md:p-10 min-h-[450px] flex flex-col transition-colors duration-500 ${submitted ? 'bg-green-50/50' : 'bg-white'}`}>
            {!submitted ? (
              <form 
                onSubmit={handleSubmit} 
                className="space-y-4 flex-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Họ tên phụ huynh</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.parentName}
                      onChange={e => setFormData({...formData, parentName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
                      placeholder="Nguyễn Văn A" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Số điện thoại</label>
                    <input 
                      required 
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
                      placeholder="09xx xxx xxx" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Tên học sinh</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.studentName}
                      onChange={e => setFormData({...formData, studentName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
                      placeholder="Nguyễn Văn B" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Lớp hiện tại</label>
                    <select 
                      value={formData.studentClass}
                      onChange={e => setFormData({...formData, studentClass: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all appearance-none"
                    >
                      {[...Array(12)].map((_, i) => <option key={i} value={i+1}>Lớp {i+1}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.subjects.includes('Tiếng Anh')}
                        onChange={() => toggleSubject('Tiếng Anh')}
                        className="w-5 h-5 rounded border-gray-300 text-brand-accent focus:ring-brand-accent" 
                      />
                      <span className="text-sm font-medium text-gray-700">Tiếng Anh</span>
                    </label>
                    
                    <div className="flex items-center gap-1">
                      <motion.div
                        animate={{ x: [-4, 0, -4] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowLeft size={14} className="text-red-600 stroke-[3]" />
                      </motion.div>
                      <motion.span 
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-tighter"
                      >
                        Môn quan tâm
                      </motion.span>
                      <motion.div
                        animate={{ x: [4, 0, 4] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowRight size={14} className="text-red-600 stroke-[3]" />
                      </motion.div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.subjects.includes('Toán')}
                        onChange={() => toggleSubject('Toán')}
                        className="w-5 h-5 rounded border-gray-300 text-brand-accent focus:ring-brand-accent" 
                      />
                      <span className="text-sm font-medium text-gray-700">Toán</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Ghi chú thêm</label>
                  <textarea 
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all h-24 resize-none" 
                    placeholder="Con cần hỗ trợ thêm về..."
                  ></textarea>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-brand-cta hover:bg-opacity-90 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-cta/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'ĐANG GỬI...' : 'ĐĂNG KÝ NGAY'} <ArrowRight size={20} />
                </button>
              </form>
            ) : (
              <div className="w-full flex flex-col items-center justify-center text-center py-6 flex-1">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-2">Đăng Ký Thành Công!</h3>
                <p className="text-gray-500 text-sm mb-6">Cảm ơn bạn đã tin tưởng Conlaso1. Vui lòng kết bạn Zalo và tham gia nhóm để nhận thông tin nhanh nhất.</p>
                
                <div className="bg-brand-bg p-4 md:p-6 rounded-2xl border border-gray-100 mb-4 md:mb-6 w-full shadow-inner flex flex-col items-center">
                  <p className="text-xs md:text-sm font-bold text-gray-500 uppercase mb-3 md:mb-4">Quét hoặc Bấm Mã QR để kết bạn</p>
                  <a 
                    href="https://zalo.me/0961771339" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white p-2 rounded-xl shadow-md mb-3 hover:scale-105 transition-transform cursor-pointer block"
                    title="Bấm để kết bạn Zalo"
                  >
                    <QRCodeSVG 
                      value="https://zalo.me/0961771339" 
                      size={128}
                      level="H"
                      includeMargin={false}
                    />
                  </a>
                  <p className="text-sm md:text-lg font-bold text-brand-dark">0961 771 339</p>
                </div>

                <motion.a 
                  href="https://zalo.me/g/xwj9meojzis4xau4s7eh"
                  target="_blank"
                  rel="noopener noreferrer"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-full bg-brand-accent hover:bg-brand-dark text-white py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 mb-4 shadow-lg shadow-brand-accent/20"
                >
                  THAM GIA NHÓM ZALO <MessageCircle size={20} />
                </motion.a>

                <button onClick={() => setSubmitted(false)} className="text-gray-400 text-xs hover:text-brand-accent transition-colors">Gửi lại form khác</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Location = () => (
  <section id="location" className="py-16 bg-white">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-3">Địa Chỉ Trung Tâm</h2>
        <div className="w-16 h-1 bg-brand-accent mx-auto rounded-full mb-6"></div>
        <p className="text-gray-500 max-w-2xl mx-auto text-sm">
          Ghé thăm Conlaso1 tại cơ sở Hoàn Kiếm để được tư vấn trực tiếp và tham quan môi trường học tập hiện đại.
        </p>
      </div>
      <div className="max-w-5xl mx-auto rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-brand-bg relative group">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.0425379475673!2d105.85203917430619!3d21.03098388770399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135abc03b32172d%3A0xe34ede870aed8c6a!2zMTZBIFAuIEzDvSBUaMOhaSBU4buVLCBMw70gVGjDoWkgVOG7lSwgSG_DoG4gS2nhur9tLCBIw6AgTuG7mWkgMTAwMDAwLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1775490211345!5m2!1sen!2s" 
          width="100%" 
          height="400" 
          style={{ border: 0 }} 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          className="grayscale hover:grayscale-0 transition-all duration-700"
        ></iframe>
        <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-72 bg-brand-dark/90 backdrop-blur-md p-5 rounded-3xl text-white shadow-xl border border-white/10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-accent rounded-xl flex items-center justify-center text-white">
              <MapPin size={16} />
            </div>
            <h4 className="font-bold text-sm">Cơ sở Hoàn Kiếm</h4>
          </div>
          <p className="text-xs text-gray-300 mb-3 leading-relaxed">
            16A Lý Thái Tổ, Lý Thái Tổ, Hoàn Kiếm, Hà Nội 100000, Vietnam
          </p>
          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=21.03098388770399,105.85203917430619" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-accent font-bold text-xs hover:gap-3 transition-all"
          >
            Chỉ đường trên Google Maps <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  </section>
);

const Dashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registrations' | 'testimonials' | 'students'>('registrations');
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'enrolled'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedRegForStudent, setSelectedRegForStudent] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const regPath = 'registrations';
    const regQ = query(collection(db, regPath));
    
    const unsubReg = onSnapshot(regQ, (snapshot) => {
      try {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Registration[];
        const sortedData = data.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        setRegistrations(sortedData);
        setLoading(false);
      } catch (err) {
        console.error('Error processing registrations:', err);
        setError('Lỗi xử lý dữ liệu. Có thể một số bản ghi bị thiếu thông tin.');
        setLoading(false);
      }
    }, (err) => {
      console.error('Snapshot error (registrations):', err);
      setError('Bạn không có quyền xem dữ liệu hoặc lỗi kết nối. Hãy đảm bảo bạn đã đăng nhập đúng tài khoản Admin.');
      setLoading(false);
    });

    const testPath = 'testimonials';
    const testQ = query(collection(db, testPath));
    const unsubTest = onSnapshot(testQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Testimonial[];
      const sortedData = data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setTestimonials(sortedData);
    }, (err) => {
      console.error('Snapshot error (testimonials):', err);
    });

    const studentPath = 'students';
    const unsubStudent = onSnapshot(collection(db, studentPath), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
      setStudents(data);
    }, (err) => {
      console.error('Snapshot error (students):', err);
    });

    return () => { unsubReg(); unsubTest(); unsubStudent(); };
  }, [user?.uid]);

  const updateRegStatus = async (id: string, status: Registration['status']) => {
    try {
      await updateDoc(doc(db, 'registrations', id), { status });
    } catch (error) {
      handleFirestoreError(error, 'update', `registrations/${id}`);
    }
  };

  const updateTestimonialStatus = async (id: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'testimonials', id), { approved });
    } catch (error) {
      handleFirestoreError(error, 'update', `testimonials/${id}`);
    }
  };

  const deleteDocItem = async (col: string, id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục này?')) return;
    try {
      await deleteDoc(doc(db, col, id));
    } catch (error) {
      handleFirestoreError(error, 'delete', `${col}/${id}`);
    }
  };

  const filteredRegs = registrations.filter(r => {
    const parentName = r.parentName || '';
    const phone = r.phone || '';
    const status = r.status || 'new';
    const studentClass = r.studentClass || '';
    const subjects = r.subjects || [];
    
    const matchesFilter = filter === 'all' || status === filter;
    const matchesClass = classFilter === 'all' || studentClass === classFilter;
    const matchesSubject = subjectFilter === 'all' || subjects.includes(subjectFilter);
    const matchesSearch = parentName.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
    
    return matchesFilter && matchesClass && matchesSubject && matchesSearch;
  });

  const exportToExcel = () => {
    const dataToExport = activeTab === 'registrations' ? filteredRegs : students;
    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(item => {
      if (activeTab === 'registrations') {
        const r = item as Registration;
        return {
          'Tên học sinh': r.studentName,
          'Lớp': r.studentClass,
          'Tên phụ huynh': r.parentName,
          'Số điện thoại': r.phone,
          'Môn học': r.subjects?.join(', '),
          'Ghi chú': r.note,
          'Trạng thái': r.status === 'new' ? 'Mới' : r.status === 'contacted' ? 'Đã liên hệ' : 'Đã nhập học',
          'Ngày đăng ký': r.createdAt?.toDate?.()?.toLocaleString() || ''
        };
      } else {
        const s = item as Student;
        return {
          'Tên học sinh': s.name,
          'Lớp': s.class,
          'Số điện thoại': s.phone,
          'Trường': s.school,
          'Địa chỉ': s.address,
          'Môn học': s.subjects?.join(', '),
          'Ngày thêm': s.createdAt?.toDate?.()?.toLocaleString() || ''
        };
      }
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'registrations' ? 'DangKy' : 'HocSinh');
    XLSX.writeFile(workbook, `Conlaso1_${activeTab}_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Hệ thống quản trị Conlaso1</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Đang đăng nhập: <span className="font-bold text-brand-accent">{user.email}</span>
              {user.emailVerified ? (
                <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-[10px] font-bold">Đã xác minh</span>
              ) : (
                <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold">Chưa xác minh</span>
              )}
            </div>
            <div className="flex gap-4 mt-4">
              <button 
                onClick={() => setActiveTab('registrations')}
                className={`text-sm font-bold pb-1 border-b-2 transition-all ${activeTab === 'registrations' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-400'}`}
              >
                Đăng ký học ({registrations.length})
              </button>
              <button 
                onClick={() => setActiveTab('testimonials')}
                className={`text-sm font-bold pb-1 border-b-2 transition-all ${activeTab === 'testimonials' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-400'}`}
              >
                Đánh giá ({testimonials.length})
              </button>
              <button 
                onClick={() => setActiveTab('students')}
                className={`text-sm font-bold pb-1 border-b-2 transition-all ${activeTab === 'students' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-400'}`}
              >
                Học sinh ({students.length})
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition-all shadow-sm"
            >
              <Filter size={16} /> Xuất Excel
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-all">
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-2xl text-center shadow-sm">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">Lỗi truy cập dữ liệu</h3>
            <p className="text-sm max-w-md mx-auto mb-6 opacity-80">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
            >
              Tải lại trang
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="animate-spin w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
          </div>
        ) : activeTab === 'registrations' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm tên, số điện thoại..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand-accent outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                  <button 
                    onClick={() => {
                      setSelectedRegForStudent(null);
                      setIsAddStudentModalOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all whitespace-nowrap"
                  >
                    Thêm TT
                  </button>
                  {(['all', 'new', 'contacted', 'enrolled'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-brand-accent text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {f === 'all' ? 'Tất cả' : f === 'new' ? 'Mới' : f === 'contacted' ? 'Đã liên hệ' : 'Đã nhập học'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Lớp:</span>
                  <select 
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                    className="text-xs font-bold bg-gray-50 px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả lớp</option>
                    {Array.from(new Set(registrations.map(r => r.studentClass).filter(Boolean))).sort().map(c => (
                      <option key={c} value={c}>Lớp {c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Môn:</span>
                  <select 
                    value={subjectFilter}
                    onChange={e => setSubjectFilter(e.target.value)}
                    className="text-xs font-bold bg-gray-50 px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả môn</option>
                    {Array.from(new Set(registrations.flatMap(r => r.subjects || []))).sort().map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">Học sinh / Phụ huynh</th>
                    <th className="px-6 py-4">Liên hệ</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRegs.length > 0 ? filteredRegs.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-brand-dark">{reg.studentName || 'Không tên'}</div>
                        <div className="text-xs text-gray-500">PH: {reg.parentName || 'N/A'} - Lớp {reg.studentClass || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">{reg.phone || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <select 
                            value={reg.status || 'new'}
                            onChange={(e) => updateRegStatus(reg.id, e.target.value as any)}
                            className={`text-xs font-bold px-3 py-1 rounded-full border-none outline-none cursor-pointer ${
                              (reg.status || 'new') === 'new' ? 'bg-yellow-100 text-yellow-700' :
                              reg.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                              'bg-green-100 text-green-700'
                            }`}
                          >
                            <option value="new">Mới</option>
                            <option value="contacted">Đã liên hệ</option>
                            <option value="enrolled">Đã nhập học</option>
                          </select>
                          {reg.status === 'enrolled' && (
                            <button 
                              onClick={() => {
                                setSelectedRegForStudent(reg);
                                setIsAddStudentModalOpen(true);
                              }}
                              className="text-[10px] font-bold text-red-500 hover:text-red-600 border border-red-200 px-2 py-1 rounded-lg transition-all"
                            >
                              Thêm TT
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => deleteDocItem('registrations', reg.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                        Không tìm thấy dữ liệu nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'students' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-brand-dark">Danh sách học sinh chính thức</h2>
              <button 
                onClick={() => setIsAddStudentModalOpen(true)}
                className="bg-brand-accent text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-brand-accent/20 flex items-center gap-2"
              >
                <Users size={18} /> Thêm học sinh mới
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.length > 0 ? students.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative group">
                  <button 
                    onClick={() => deleteDocItem('students', s.id)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                      {s.photoUrl ? (
                        <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Users size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-dark">{s.name}</h3>
                      <div className="text-xs text-brand-accent font-bold">Lớp {s.class}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" /> {s.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap size={14} className="text-gray-400" /> {s.school}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" /> {s.address}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {s.subjects?.map(sub => (
                      <span key={sub} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-gray-400 italic bg-white rounded-2xl border border-dashed border-gray-200">
                  Chưa có học sinh nào trong danh sách chính thức.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-1 text-yellow-400">
                      {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {t.approved ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm italic mb-4 leading-relaxed">"{t.content}"</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div>
                    <div className="font-bold text-brand-dark text-sm">{t.name}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">{t.role}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateTestimonialStatus(t.id, !t.approved)}
                      className={`p-2 rounded-lg transition-all ${t.approved ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      title={t.approved ? 'Bỏ duyệt' : 'Duyệt'}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteDocItem('testimonials', t.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <AddStudentModal 
          isOpen={isAddStudentModalOpen}
          onClose={() => {
            setIsAddStudentModalOpen(false);
            setSelectedRegForStudent(null);
          }}
          initialData={selectedRegForStudent}
        />
      </div>
    </div>
  );
};

const AdminPasswordModal = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (password: string) => void;
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === '2021') {
      onConfirm(password);
      setPassword('');
      setError('');
    } else {
      setError('Mật khẩu không chính xác.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-brand-dark transition-colors">
          <X size={24} />
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-accent mx-auto mb-4">
            <LogIn size={32} />
          </div>
          <h2 className="text-2xl font-bold text-brand-dark">Xác thực quản trị</h2>
          <p className="text-gray-500 text-sm mt-2">Vui lòng nhập mật khẩu để tiếp tục</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <input 
              type="password" 
              autoFocus
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full px-6 py-4 rounded-xl border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-center text-xl tracking-[0.5em]"
            />
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
          </div>
          <button 
            type="submit" 
            className="w-full bg-brand-dark hover:bg-brand-accent text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-brand-dark/10"
          >
            XÁC NHẬN
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  pkg 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  pkg: any;
}) => {
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'info' | 'qr' | 'success'>('info');

  useEffect(() => {
    if (!isOpen) {
      setStep('info');
      setStudentName('');
      setPhone('');
    }
  }, [isOpen]);

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (studentName && phone) {
      setStep('qr');
    }
  };

  const handleDone = () => {
    setStep('success');
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#f59e0b', '#ef4444']
    });
  };

  const downloadQR = () => {
    // Since cross-origin download can be tricky with simple <a> tags,
    // we open the image in a new tab for the user to save, 
    // or provide a direct link if the browser allows.
    const link = document.createElement('a');
    link.href = qrUrl;
    link.target = "_blank";
    link.download = `QR_Thanh_Toan_${studentName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !pkg) return null;

  const amount = pkg.price.replace(/\D/g, '');
  const maskedPhone = phone.length >= 3 ? phone.slice(0, -3) + '***' : phone;
  const qrUrl = `https://img.vietqr.io/image/mbbank-0988771339-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(`Thanh toan ${pkg.title} ${phone} ${studentName}`)}&accountName=NGUYEN%20VIET%20THOAN`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {step === 'info' && (
          <motion.div 
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-brand-dark transition-colors">
              <X size={24} />
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                <Users size={32} />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark">Thông tin học viên</h2>
              <p className="text-gray-500 text-sm mt-2">Vui lòng nhập thông tin để tạo mã QR</p>
            </div>
            <form onSubmit={handleNext} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Tên học sinh</label>
                <input 
                  required
                  type="text" 
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-5 py-3 rounded-xl border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Số điện thoại phụ huynh</label>
                <input 
                  required
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full px-5 py-3 rounded-xl border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-brand-dark hover:bg-brand-accent text-white py-4 rounded-xl font-bold transition-all shadow-lg mt-4"
              >
                TIẾP TỤC TẠO MÃ QR
              </button>
            </form>
          </motion.div>
        )}

        {step === 'qr' && (
          <motion.div 
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-[360px] shadow-2xl relative text-center"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
              <X size={24} />
            </button>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-brand-dark mb-1">Thanh toán {pkg.title}</h2>
              <div className="bg-brand-bg py-2 px-4 rounded-xl inline-block border-2 border-brand-accent/20">
                <p className="text-brand-accent font-black text-3xl">{pkg.price}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-2xl mb-4 border-2 border-dashed border-gray-200 relative group">
              <img 
                src={qrUrl} 
                alt="MB Bank QR Code" 
                className="w-full aspect-square rounded-xl shadow-sm mb-3"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={downloadQR}
                className="absolute bottom-20 right-8 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg text-brand-accent transition-all hover:scale-110"
                title="Tải mã QR"
              >
                <Download size={20} />
              </button>
              <div className="space-y-1 text-[13px]">
                <div className="flex justify-between text-gray-500">
                  <span>Ngân hàng:</span>
                  <span className="font-bold text-brand-dark">MB Bank</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Số tài khoản:</span>
                  <span className="font-bold text-brand-dark">0988771339</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Chủ TK:</span>
                  <span className="font-bold text-brand-dark uppercase">Nguyễn Viết Thoan</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-xl mb-4 text-left border border-blue-100">
              <div className="text-[9px] text-blue-600 font-bold uppercase mb-1">Nội dung chuyển khoản</div>
              <div className="text-xs font-mono break-all text-blue-900 font-bold">
                Thanh toan {pkg.title} {maskedPhone} {studentName}
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleDone}
                className="w-full bg-brand-cta hover:bg-opacity-90 text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 size={18} />
                TÔI ĐÃ CHUYỂN KHOẢN XÔNG
              </button>
              <button 
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl font-bold transition-all text-xs"
              >
                ĐÓNG MÃ THANH TOÁN
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-8 md:p-12 w-full max-w-md shadow-2xl relative text-center"
          >
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">Chúc mừng học sinh {studentName}!</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Hệ thống đã ghi nhận yêu cầu thanh toán của phụ huynh. Vui lòng tham gia nhóm Zalo để nhận kết quả xác nhận.
            </p>
            <a 
              href="https://zalo.me/g/xwj9meojzis4xau4s7eh"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#0068ff] hover:bg-[#0055d4] text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              GỬI KẾT QUẢ VÀO NHÓM ZALO
            </a>
            <button 
              onClick={onClose}
              className="mt-6 text-gray-400 text-sm font-bold hover:text-brand-dark transition-colors"
            >
              Đóng cửa sổ
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StickyMobileCTA = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 p-3 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
      <a 
        href="tel:0961771339" 
        className="flex items-center gap-2 text-brand-dark font-bold text-sm px-3"
      >
        <div className="w-10 h-10 bg-brand-bg rounded-full flex items-center justify-center text-brand-accent">
          <Phone size={20} fill="currentColor" className="text-brand-accent" />
        </div>
        <span>0961 771 339</span>
      </a>
      <a 
        href="#register" 
        className="bg-brand-cta text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-cta/20"
      >
        Đăng ký tư vấn
      </a>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    
    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email === ADMIN_EMAIL) {
        setIsPasswordModalOpen(true);
      } else {
        setLoginError('Bạn không có quyền truy cập trang quản trị.');
        await signOut(auth);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError('Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép hiện cửa sổ bật lên (popup) và thử lại.');
      } else if (error.code === 'auth/network-request-failed') {
        setLoginError('Lỗi kết nối mạng hoặc bị trình duyệt chặn. Vui lòng kiểm tra internet, tắt trình chặn quảng cáo hoặc thử mở trang trong tab mới.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setLoginError('Tên miền này chưa được cấp quyền trong Firebase Console. Vui lòng thêm domain vào danh sách Authorized Domains.');
      } else {
        setLoginError('Lỗi đăng nhập: ' + (error.message || 'Vui lòng thử lại.'));
      }
    }
  };

  const handleDashboardAccess = () => {
    if (!user) {
      handleLogin();
    } else if (user.email === ADMIN_EMAIL) {
      setIsPasswordModalOpen(true);
    } else {
      setLoginError('Bạn không có quyền truy cập trang quản trị.');
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    if (password === '2021') {
      setView('dashboard');
      setIsPasswordModalOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('landing');
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center text-brand-accent font-bold">ĐANG TẢI...</div>;

  return (
    <ErrorBoundary>
      <div className="font-sans bg-white selection:bg-brand-accent selection:text-white scroll-smooth">
      {view === 'landing' ? (
        <>
          <Navbar />
          <StickyNav />
          <Hero />
          <Programs />
          <WhyChooseUs />
          <Benefits />
          <Teachers />
          <Testimonials />
          <Process />
          <Pricing onSelectPackage={(pkg) => {
            setSelectedPackage(pkg);
            setIsPaymentModalOpen(true);
          }} />
          <RegistrationForm />
          <Location />
          <footer className="bg-brand-dark text-white py-16 border-t border-white/5">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-3 gap-12 mb-12">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="relative w-12 h-12 flex items-center justify-center bg-white rounded-lg p-1">
                      <img 
                        src="/logo.png" 
                        alt="Conlaso1 Logo" 
                        className="w-full h-full object-contain z-10"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center text-brand-accent">
                        <Heart size={24} fill="currentColor" />
                      </div>
                    </div>
                    <span className="text-2xl font-bold">CONLASO1</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    Trung tâm đào tạo Tiếng Anh và Toán chất lượng cao, giúp học sinh phát triển tư duy và kỹ năng toàn diện.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-6">Liên Hệ</h4>
                  <ul className="space-y-4 text-gray-400">
                    <li className="flex items-start gap-3">
                      <MapPin size={20} className="text-brand-accent flex-shrink-0" />
                      <span>16A Lý Thái Tổ - Hoàn Kiếm - Hà Nội</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Phone size={20} className="text-brand-accent flex-shrink-0" />
                      <span>0961 771 339 - 0988 771 339</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Clock size={20} className="text-brand-accent flex-shrink-0" />
                      <span>Thứ 2 - Chủ Nhật: 08:00 - 21:00</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-6">Theo Dõi Chúng Tôi</h4>
                  <div className="flex gap-4">
                    {[
                      { name: 'Facebook', icon: <Facebook size={18} />, href: '#' },
                      { name: 'Youtube', icon: <Youtube size={18} />, href: '#' },
                      { name: 'Tiktok', icon: <Music size={18} />, href: '#' },
                      { name: 'Zalo OA', icon: <MessageCircle size={18} />, href: 'https://zalo.me/0961771339' }
                    ].map((social) => (
                      <a key={social.name} href={social.href} className="w-10 h-10 bg-white/5 hover:bg-brand-accent rounded-full flex items-center justify-center transition-all" title={social.name}>
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-gray-500 text-sm">
                  &copy; {new Date().getFullYear()} CONLASO1. All rights reserved.
                </div>
                <div className="p-2 bg-white/5 rounded-xl border border-white/10 flex flex-col items-end gap-2">
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quản trị viên</div>
                    <button 
                      onClick={handleDashboardAccess}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      <LogIn size={14} /> Đăng nhập quản lý
                    </button>
                  </div>
                  {loginError && (
                    <div className="text-[10px] text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded-md border border-red-400/20">
                      {loginError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </footer>

          <AdminPasswordModal 
            isOpen={isPasswordModalOpen} 
            onClose={() => setIsPasswordModalOpen(false)} 
            onConfirm={handlePasswordConfirm} 
          />

          <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            pkg={selectedPackage}
          />

          <StickyMobileCTA />
        </>
      ) : (
        user ? <Dashboard user={user} onLogout={handleLogout} /> : <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full"></div></div>
      )}
      </div>
    </ErrorBoundary>
  );
}

const AddStudentModal = ({ isOpen, onClose, initialData }: { isOpen: boolean, onClose: () => void, initialData?: any }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    school: '',
    address: '',
    class: '',
    subjects: [] as string[]
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.studentName || '',
        phone: initialData.phone || '',
        school: '',
        address: '',
        class: initialData.studentClass || '',
        subjects: initialData.subjects || []
      });
    } else {
      setFormData({ name: '', phone: '', school: '', address: '', class: '', subjects: [] });
    }
    setImage(null);
    setPreview(null);
    setError(null);
    setStatus(null);
  }, [initialData, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus('Đang khởi tạo...');
    console.log('Starting student save process...');
    
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setStatus(null);
      setError('Thao tác quá lâu. Vui lòng kiểm tra kết nối mạng và thử lại.');
      console.error('Save process timed out after 60s');
    }, 60000);

    try {
      if (!auth.currentUser) {
        throw new Error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
      }
      console.log('User authenticated:', auth.currentUser.email);

      let photoUrl = '';
      if (image) {
        setStatus('Đang tải ảnh lên...');
        console.log('Uploading image:', image.name);
        
        // Create a promise that rejects after 15 seconds for the image upload
        const imageUploadPromise = (async () => {
          try {
            const imageRef = ref(storage, `students/${Date.now()}_${image.name}`);
            await uploadBytes(imageRef, image);
            return await getDownloadURL(imageRef);
          } catch (err) {
            console.error('Image upload error:', err);
            return '';
          }
        })();

        const timeoutPromise = new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Image upload timed out')), 15000)
        );

        try {
          photoUrl = await Promise.race([imageUploadPromise, timeoutPromise]);
          console.log('Image uploaded successfully:', photoUrl);
        } catch (imgErr) {
          console.warn('Image upload failed or timed out, continuing without photo:', imgErr);
          // Continue without photo
        }
      }

      setStatus('Đang lưu dữ liệu...');
      console.log('Saving student data to Firestore...');
      
      const studentData = {
        ...formData,
        photoUrl,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'students'), studentData);
      console.log('Student data saved successfully');
      
      clearTimeout(timeoutId);
      setLoading(false);
      setStatus(null);
      onClose();
      setFormData({ name: '', phone: '', school: '', address: '', class: '', subjects: [] });
      setImage(null);
      setPreview(null);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setLoading(false);
      setStatus(null);
      console.error('Error in handleSubmit:', err);
      
      let message = 'Có lỗi xảy ra khi lưu thông tin.';
      if (err.message?.includes('permission-denied') || err.code === 'permission-denied') {
        message = 'Bạn không có quyền thực hiện thao tác này. Vui lòng kiểm tra quyền Admin.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-brand-dark/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] p-5 md:p-6 w-full max-w-lg shadow-2xl relative my-2"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-brand-dark transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-brand-dark mb-4">Thêm học sinh chính thức</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2 flex flex-col items-center mb-2">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden relative group">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-center items-center justify-center text-gray-300">
                  <Users size={32} />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[10px] font-bold">
                Chọn ảnh
              </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Ảnh học sinh</p>
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Tên học sinh</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-sm"
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Số điện thoại</label>
            <input 
              required
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-sm"
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Đang học trường</label>
            <input 
              required
              type="text" 
              value={formData.school}
              onChange={e => setFormData({...formData, school: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-sm"
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Lớp</label>
            <input 
              required
              type="text" 
              value={formData.class}
              onChange={e => setFormData({...formData, class: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-sm"
            />
          </div>
          <div className="md:col-span-2 space-y-0.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Địa chỉ</label>
            <input 
              required
              type="text" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border-2 border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-sm"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Môn học</label>
            <div className="flex flex-wrap gap-1.5">
              {['Toán', 'Tiếng Anh', 'Tiếng Việt', 'Kỹ năng'].map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    const subs = formData.subjects.includes(sub) 
                      ? formData.subjects.filter(s => s !== sub)
                      : [...formData.subjects, sub];
                    setFormData({...formData, subjects: subs});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${formData.subjects.includes(sub) ? 'bg-brand-accent text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 pt-2">
            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-brand-dark hover:bg-brand-accent text-white py-3 rounded-xl font-bold transition-all shadow-lg flex flex-col items-center justify-center gap-0.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span className="text-[10px] font-medium mt-1">{status}</span>
                </>
              ) : 'LƯU THÔNG TIN HỌC SINH'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
