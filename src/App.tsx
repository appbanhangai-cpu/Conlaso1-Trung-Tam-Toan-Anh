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
  LogOut,
  Trash2,
  Filter,
  Search,
  LogIn,
  Facebook,
  Youtube,
  Music,
  Heart
} from 'lucide-react';
import { db, auth } from './firebase';
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
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
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
  <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#0a0f1a]">
    {/* Background Pattern */}
    <div className="absolute inset-0">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_rgba(37,99,235,0.15),_transparent_50%)]" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,_rgba(245,158,11,0.1),_transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </div>
    
    <div className="container mx-auto px-4 relative z-10">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-4">
            <span className="text-white/70 text-sm font-medium tracking-[0.2em] uppercase">
              TRUNG TÂM TIẾNG ANH & TOÁN
            </span>
          </div>
          <h1 className="font-serif leading-[1.1] mb-8">
            <div className="text-4xl md:text-6xl lg:text-7xl font-bold mb-2 drop-shadow-lg">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cta to-yellow-200">Conlaso1 –</span>
              <span className="text-white ml-4">Đồng</span>
            </div>
            <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2 flex items-baseline gap-4 drop-shadow-lg">
              Hành Cùng Con
              <span className="text-xl md:text-3xl text-gray-400 font-sans font-medium">Chinh</span>
            </div>
            <div className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-cta via-yellow-200 to-brand-cta drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              Phục Tương Lai
            </div>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
            Giúp học sinh xây chắc nền tảng Toán và Tiếng Anh, nâng cao tư duy, tăng sự tự tin và cải thiện kết quả học tập rõ rệt.
          </p>
          <div className="flex flex-wrap gap-4 mb-10">
            <a href="#register" className="w-full sm:w-auto bg-brand-cta hover:bg-opacity-90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-cta/20">
              ĐĂNG KÝ HỌC THỬ <ChevronRight size={20} />
            </a>
            <a href="#register" className="hidden sm:inline-block bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all border border-white/20">
              NHẬN TƯ VẤN NGAY
            </a>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
            <div className="text-white">
              <div className="text-brand-cta font-bold text-xl">100%</div>
              <div className="text-xs text-gray-400">Lớp học theo trình độ</div>
            </div>
            <div className="text-white">
              <div className="text-brand-cta font-bold text-xl">Tận tâm</div>
              <div className="text-xs text-gray-400">Giáo viên chuyên môn</div>
            </div>
            <div className="text-white">
              <div className="text-brand-cta font-bold text-xl">Sát sao</div>
              <div className="text-xs text-gray-400">Theo sát từng học sinh</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white/10">
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
  const programs = [
    {
      title: "Tiếng Anh nền tảng",
      desc: "Phát âm chuẩn, tăng từ vựng, củng cố ngữ pháp và rèn luyện 4 kỹ năng Nghe - Nói - Đọc - Viết.",
      icon: <BookOpen className="text-blue-600" />,
      color: "bg-blue-50"
    },
    {
      title: "Tiếng Anh nâng cao",
      desc: "Phát triển phản xạ giao tiếp, tăng kỹ năng làm bài và chuẩn bị cho các kỳ thi quan trọng.",
      icon: <Star className="text-yellow-600" />,
      color: "bg-yellow-50"
    },
    {
      title: "Toán tư duy",
      desc: "Rèn luyện logic, khả năng phân tích, giúp trẻ học chủ động và không học vẹt.",
      icon: <Brain className="text-purple-600" />,
      color: "bg-purple-50"
    },
    {
      title: "Toán nâng cao",
      desc: "Củng cố kiến thức trọng tâm, luyện bài theo chuyên đề và nâng cao kết quả tại trường.",
      icon: <Trophy className="text-orange-600" />,
      color: "bg-orange-50"
    }
  ];

  return (
    <section id="programs" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Chương Trình Học Nổi Bật Tại Conlaso1</h2>
          <div className="w-20 h-1.5 bg-brand-accent mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {programs.map((p, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className={`${p.color} p-8 rounded-3xl transition-all border border-transparent hover:border-brand-accent/20 shadow-sm`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                  {p.icon}
                </div>
                <h3 className="text-lg font-bold text-brand-dark leading-tight">{p.title}</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">{p.desc}</p>
              <button className="text-brand-accent font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
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
    <section id="why" className="py-24 bg-brand-bg">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-8">Lý Do Nhiều Phụ Huynh Tin Tưởng Conlaso1</h2>
            <div className="space-y-4">
              {reasons.map((reason, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="w-6 h-6 bg-brand-accent text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <p className="text-gray-700 font-medium">{reason}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-8 text-brand-accent font-bold italic text-lg">
              "Conlaso1 không chỉ giúp con học tốt hơn, mà còn giúp con tự tin hơn mỗi ngày."
            </p>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1000" 
                alt="Lớp học Conlaso1" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-cta rounded-full -z-10 opacity-20 blur-2xl"></div>
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
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Con Nhận Được Gì Khi Học Tại Conlaso1?</h2>
          <div className="w-20 h-1.5 bg-brand-accent mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-4 mb-8 md:block md:text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-accent rounded-2xl flex items-center justify-center flex-shrink-0 md:mx-auto mb-0 md:mb-6 group-hover:rotate-6 transition-transform shadow-lg shadow-brand-accent/20">
                {b.icon}
              </div>
              <div className="text-left md:text-center">
                <h3 className="text-xl font-bold text-brand-dark mb-1 md:mb-3">{b.title}</h3>
                <p className="text-gray-600 text-sm">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Teachers = () => (
  <section id="teachers" className="py-24 bg-brand-dark text-white">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1">
          <img 
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1000" 
            alt="Giáo viên Conlaso1" 
            className="rounded-3xl shadow-2xl border-4 border-white/10"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Đội Ngũ Giáo Viên Tận Tâm – Phương Pháp Giảng Dạy Dễ Hiểu</h2>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Tại Conlaso1, đội ngũ giáo viên luôn đặt sự tiến bộ của học sinh làm trung tâm. Mỗi buổi học được xây dựng với mục tiêu rõ ràng, giúp học sinh tiếp thu kiến thức theo cách dễ hiểu, dễ nhớ và áp dụng được ngay.
          </p>
          <div className="space-y-6">
            {[
              { title: "Giảng dạy tận tâm", desc: "Luôn kiên nhẫn và đồng hành cùng sự tiến bộ của con." },
              { title: "Theo sát tiến độ từng học sinh", desc: "Nắm rõ điểm mạnh, điểm yếu để có lộ trình riêng." },
              { title: "Hỗ trợ phụ huynh đồng hành", desc: "Báo cáo thường xuyên và tư vấn phương pháp học tại nhà." }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-accent">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
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
    }
  ];

  return (
    <section id="feedback" className="py-24 bg-brand-bg">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Phản Hồi Từ Phụ Huynh Và Học Sinh</h2>
          <div className="w-20 h-1.5 bg-brand-accent mx-auto rounded-full mb-8"></div>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-brand-cta hover:bg-opacity-90 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-brand-cta/20 transition-all flex items-center gap-2 mx-auto"
          >
            <MessageCircle size={20} /> GỬI ĐÁNH GIÁ & BÌNH LUẬN
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Static Reviews */}
          {staticReviews.map((r, i) => (
            <motion.div 
              key={`static-${i}`}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative"
            >
              <div className="flex gap-1 text-brand-cta mb-6">
                {[...Array(r.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-gray-600 italic mb-8 leading-relaxed">"{r.text}"</p>
              <div className="flex items-center gap-4">
                <img src={r.avatar} alt={r.name} className="w-12 h-12 rounded-full" />
                <div className="font-bold text-brand-dark text-sm">{r.name}</div>
              </div>
            </motion.div>
          ))}
          {/* Real Reviews */}
          {realReviews.map((r) => (
            <motion.div 
              key={r.id}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative"
            >
              <div className="flex gap-1 text-brand-cta mb-6">
                {[...Array(r.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-gray-600 italic mb-8 leading-relaxed">"{r.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent font-bold">
                  {r.name[0]}
                </div>
                <div>
                  <div className="font-bold text-brand-dark text-sm">{r.name}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">{r.role}</div>
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
        className="fixed bottom-6 right-6 z-[90] bg-white p-2 rounded-[2rem] shadow-2xl flex items-center justify-center group border border-gray-100"
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent outline-none transition-all text-sm"
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Vai trò</label>
          <select 
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent outline-none transition-all text-sm appearance-none"
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
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent outline-none transition-all h-32 resize-none text-sm"
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
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Quy Trình Đồng Hành Cùng Học Sinh</h2>
          <p className="text-gray-500">Mỗi học sinh đều có định hướng học tập phù hợp với năng lực và mục tiêu riêng.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connector Line */}
          <div className="absolute top-12 left-0 w-full h-0.5 bg-gray-100 hidden md:block -z-10"></div>
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 bg-brand-accent text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg shadow-brand-accent/20 border-4 border-white">
                {i + 1}
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
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
    <section id="pricing" className="py-24 bg-brand-bg">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4 uppercase tracking-tight">Chọn Lộ Trình Phù Hợp Cho Con</h2>
          <div className="w-20 h-1.5 bg-brand-accent mx-auto rounded-full mb-6"></div>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Mỗi học sinh có một năng lực khác nhau. Conlaso1 giúp phụ huynh chọn đúng chương trình để con học chắc hơn, tiến bộ nhanh hơn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {sortedPackages.map((p, i) => (
            <div 
              key={i} 
              className={`relative p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col ${
                p.featured 
                  ? 'bg-brand-dark text-white border-brand-accent shadow-2xl md:scale-105 z-10' 
                  : 'bg-white text-brand-dark border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              {p.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-cta text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  {p.badge}
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                <p className={`text-xs ${p.featured ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
                  {p.desc}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{p.price}</span>
                  <span className={`text-sm ${p.featured ? 'text-gray-400' : 'text-gray-500'}`}>{p.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 size={18} className="text-brand-accent flex-shrink-0 mt-0.5" />
                    <span className={p.featured ? 'text-gray-200' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <a 
                  href="#register" 
                  className={`block w-full text-center py-4 rounded-2xl font-bold transition-all shadow-lg ${
                    p.featured 
                      ? 'bg-brand-cta hover:bg-opacity-90 text-white shadow-brand-cta/20' 
                      : 'bg-brand-bg hover:bg-gray-200 text-brand-dark shadow-gray-200/20'
                  }`}
                >
                  {p.cta}
                </a>
                <p className={`text-[10px] text-center mt-4 italic ${p.featured ? 'text-gray-400' : 'text-gray-500'}`}>
                  {p.support}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Help Block */}
        <div className="mt-16 max-w-3xl mx-auto bg-white rounded-[2rem] p-8 md:p-10 text-center shadow-xl border border-gray-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-accent"></div>
          <h3 className="text-xl md:text-2xl font-bold text-brand-dark mb-4">Phụ huynh chưa biết chọn gói nào?</h3>
          <p className="text-gray-500 mb-8 text-sm md:text-base">
            Đừng lo. Đội ngũ Conlaso1 sẽ kiểm tra trình độ và tư vấn lộ trình phù hợp nhất cho từng học sinh.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <a 
              href="#register" 
              className="w-full md:w-auto bg-brand-accent hover:bg-brand-dark text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-brand-accent/20"
            >
              NHẬN TƯ VẤN MIỄN PHÍ
            </a>
            <div className="flex items-center gap-3 text-brand-dark font-bold">
              <Phone size={20} className="text-brand-accent" />
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
  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    studentName: '',
    studentClass: '1',
    subjects: [] as string[],
    note: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const path = 'registrations';
      await addDoc(collection(db, path), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'new'
      });
      setSubmitted(true);
    } catch (error) {
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
    <section id="register" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto bg-brand-accent rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
          <div className="md:w-1/2 p-12 text-white flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Đăng Ký Nhận Tư Vấn Và Học Thử Miễn Phí</h2>
            <p className="text-blue-100 mb-8 leading-relaxed">
              Đội ngũ Conlaso1 sẽ liên hệ tư vấn lộ trình học tập phù hợp nhất cho con trong vòng 24h làm việc.
            </p>
            <div className="space-y-6">
              <motion.a 
                href="tel:0961771339"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-4 group cursor-pointer"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Phone size={24} />
                </div>
                <div>
                  <div className="text-sm text-blue-200">Hotline hỗ trợ</div>
                  <div className="font-bold group-hover:text-brand-cta transition-colors">0961 771 339 - 0988 771 339</div>
                </div>
              </motion.a>
              <motion.a 
                href="https://www.google.com/maps/dir/?api=1&destination=21.03098388770399,105.85203917430619"
                target="_blank"
                rel="noopener noreferrer"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="flex items-center gap-4 group cursor-pointer"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <MapPin size={24} />
                </div>
                <div>
                  <div className="text-sm text-blue-200">Địa chỉ trung tâm</div>
                  <div className="font-bold group-hover:text-brand-cta transition-colors">16A Lý Thái Tổ, Hoàn Kiếm, Hà Nội</div>
                </div>
              </motion.a>
            </div>
          </div>
          <div className="md:w-1/2 bg-white p-12">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Họ tên phụ huynh</label>
                      <input 
                        required 
                        type="text" 
                        value={formData.parentName}
                        onChange={e => setFormData({...formData, parentName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
                        placeholder="Nguyễn Văn B" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Lớp hiện tại</label>
                      <select 
                        value={formData.studentClass}
                        onChange={e => setFormData({...formData, studentClass: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all appearance-none"
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
                      
                      <span className="text-xs font-bold text-gray-400 uppercase">Môn quan tâm</span>

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
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-brand-cta hover:bg-opacity-90 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-cta/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'ĐANG GỬI...' : 'ĐĂNG KÝ NGAY'} <ArrowRight size={20} />
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-6"
                >
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-brand-dark mb-2">Đăng Ký Thành Công!</h3>
                  <p className="text-gray-500 text-sm mb-6">Cảm ơn bạn đã tin tưởng Conlaso1. Vui lòng kết bạn Zalo và tham gia nhóm để nhận thông tin nhanh nhất.</p>
                  
                  <div className="bg-brand-bg p-4 rounded-2xl border border-gray-100 mb-6 w-full">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Quét mã Zalo cá nhân</p>
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://zalo.me/0961771339" 
                      alt="Zalo QR 0961771339" 
                      className="w-32 h-32 mx-auto rounded-lg shadow-sm mb-2"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-sm font-bold text-brand-dark">0961 771 339</p>
                  </div>

                  <a 
                    href="https://zalo.me/g/xwj9meojzis4xau4s7eh" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-brand-accent hover:bg-brand-dark text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    THAM GIA NHÓM ZALO <MessageCircle size={18} />
                  </a>

                  <button onClick={() => setSubmitted(false)} className="text-gray-400 text-xs hover:text-brand-accent transition-colors">Gửi lại form khác</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

const Location = () => (
  <section id="location" className="py-24 bg-white">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Địa Chỉ Trung Tâm</h2>
        <div className="w-20 h-1.5 bg-brand-accent mx-auto rounded-full mb-8"></div>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Ghé thăm Conlaso1 tại cơ sở Hoàn Kiếm để được tư vấn trực tiếp và tham quan môi trường học tập hiện đại.
        </p>
      </div>
      <div className="max-w-5xl mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-brand-bg relative group">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.0425379475673!2d105.85203917430619!3d21.03098388770399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135abc03b32172d%3A0xe34ede870aed8c6a!2zMTZBIFAuIEzDvSBUaMOhaSBU4buVLCBMw70gVGjDoWkgVOG7lSwgSG_DoG4gS2nhur9tLCBIw6AgTuG7mWkgMTAwMDAwLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1775490211345!5m2!1sen!2s" 
          width="100%" 
          height="500" 
          style={{ border: 0 }} 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          className="grayscale hover:grayscale-0 transition-all duration-700"
        ></iframe>
        <div className="absolute bottom-8 left-8 right-8 md:right-auto md:w-80 bg-brand-dark/90 backdrop-blur-md p-6 rounded-3xl text-white shadow-xl border border-white/10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center text-white">
              <MapPin size={20} />
            </div>
            <h4 className="font-bold">Cơ sở Hoàn Kiếm</h4>
          </div>
          <p className="text-sm text-gray-300 mb-4 leading-relaxed">
            16A Lý Thái Tổ, Lý Thái Tổ, Hoàn Kiếm, Hà Nội 100000, Vietnam
          </p>
          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=21.03098388770399,105.85203917430619" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-accent font-bold text-sm hover:gap-3 transition-all"
          >
            Chỉ đường trên Google Maps <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  </section>
);

const Dashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'registrations' | 'testimonials'>('registrations');
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'enrolled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const regPath = 'registrations';
    const regQ = query(collection(db, regPath), orderBy('createdAt', 'desc'));
    const unsubReg = onSnapshot(regQ, (snapshot) => {
      setRegistrations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Registration[]);
      setLoading(false);
    }, (error) => handleFirestoreError(error, 'list', regPath));

    const testPath = 'testimonials';
    const testQ = query(collection(db, testPath), orderBy('createdAt', 'desc'));
    const unsubTest = onSnapshot(testQ, (snapshot) => {
      setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Testimonial[]);
    }, (error) => handleFirestoreError(error, 'list', testPath));

    return () => { unsubReg(); unsubTest(); };
  }, []);

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
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.parentName.toLowerCase().includes(searchTerm.toLowerCase()) || r.phone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Hệ thống quản trị Conlaso1</h1>
            <div className="flex gap-4 mt-2">
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
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-all">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>

        {activeTab === 'registrations' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
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
                  {filteredRegs.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-brand-dark">{reg.studentName}</div>
                        <div className="text-xs text-gray-500">PH: {reg.parentName} - Lớp {reg.studentClass}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">{reg.phone}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={reg.status}
                          onChange={(e) => updateRegStatus(reg.id, e.target.value as any)}
                          className={`text-xs font-bold px-3 py-1 rounded-full border-none outline-none cursor-pointer ${
                            reg.status === 'new' ? 'bg-yellow-100 text-yellow-700' :
                            reg.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}
                        >
                          <option value="new">Mới</option>
                          <option value="contacted">Đã liên hệ</option>
                          <option value="enrolled">Đã nhập học</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => deleteDocItem('registrations', reg.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-gray-100"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-accent/10 text-brand-accent rounded-xl flex items-center justify-center">
              <LogIn size={20} />
            </div>
            <h3 className="text-xl font-bold text-brand-dark">Xác minh quản trị</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-dark transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Mật khẩu quản trị</label>
            <input 
              autoFocus
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" 
              placeholder="Nhập mật khẩu..." 
            />
            {error && <p className="text-red-500 text-xs font-bold mt-1">{error}</p>}
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

  const handleDashboardAccess = async () => {
    if (user?.email === ADMIN_EMAIL) {
      setIsPasswordModalOpen(true);
    } else {
      handleLogin();
    }
  };

  const handlePasswordConfirm = (password: string) => {
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
          <Pricing />
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
                      <LogIn size={14} /> {user?.email === ADMIN_EMAIL ? 'Vào Dashboard' : 'Đăng nhập quản lý'}
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

          <StickyMobileCTA />
        </>
      ) : (
        user && <Dashboard user={user} onLogout={handleLogout} />
      )}
      </div>
    </ErrorBoundary>
  );
}
