/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  doc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  signInAnonymously,
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, 
  Package, 
  CheckCircle, 
  LogOut, 
  Plus, 
  Search, 
  Baby, 
  Phone, 
  AlertCircle,
  Clock,
  Calendar,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Info,
  ShieldCheck,
  LayoutDashboard,
  School,
  Trash2,
  Pencil,
  UserMinus,
  UserPlus,
  Download,
  FileSpreadsheet,
  Cake,
  MessageCircle,
  Lock,
  Sparkles,
  UserCheck,
  CalendarDays,
  Wand2,
  BookOpen,
  Send,
  Menu,
  X,
  Upload,
  File as FileIcon,
  QrCode,
  ScanLine,
  Share2,
  Settings
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import ReactMarkdown from 'react-markdown';

import { db, auth, storage, OperationType, handleFirestoreError } from '@/src/lib/firebase';
import { Child, Parent, Material, Volunteer, Schedule, Service } from '@/src/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditMaterialDialogOpen, setIsEditMaterialDialogOpen] = useState(false);
  const [isEditVolunteerDialogOpen, setIsEditVolunteerDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<{id: string, label: string} | null>(null);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastRegisteredData, setLastRegisteredData] = useState<{children: any[], parents: any[]} | null>(null);
  const [guardians, setGuardians] = useState([{ name: '', phone: '', leader: '', relation: 'Pai/Mãe', photoUrl: '' }]);
  const [childrenToAdd, setChildrenToAdd] = useState([{ name: '', birthDate: '', allergies: '', specialNeeds: '', status: 'Ativa', photoUrl: '' }]);
  const [editGuardians, setEditGuardians] = useState([{ id: '', name: '', phone: '', leader: '', relation: 'Pai/Mãe', photoUrl: '' }]);
  const [familyName, setFamilyName] = useState('');
  const [hasNotifiedToday, setHasNotifiedToday] = useState(false);
  const [appSettings, setAppSettings] = useState<{ logoUrl: string, appName: string }>({
    logoUrl: 'https://api.screenshotone.com/take?url=https%3A%2F%2Fstorage.googleapis.com%2Fstatic-assets-public%2Fais%2Fuser_uploads%2F601900293069%2F1744207230495_image.png&viewport_width=1024&viewport_height=768&block_ads=true&block_cookie_banners=true&block_trackers=true&delay=0&format=png',
    appName: 'Aljava Controle'
  });
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const isAdmin = !!user;

  // Service AI States
  const [serviceAiPrompt, setServiceAiPrompt] = useState('');
  const [serviceAiResponse, setServiceAiResponse] = useState('');
  const [serviceStudyAiResponse, setServiceStudyAiResponse] = useState('');
  const [isServiceAiGenerating, setIsServiceAiGenerating] = useState(false);
  const [isServiceStudyAiGenerating, setIsServiceStudyAiGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // AI States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('G1');
  const [checkinSearch, setCheckinSearch] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedChildForQr, setSelectedChildForQr] = useState<Child | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleFileUpload = async (file: File, path: string): Promise<string> => {
    setIsUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      console.log('File uploaded successfully. URL:', url);
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao fazer upload da imagem.');
      throw error;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const updateSettings = async (newSettings: any) => {
    try {
      await setDoc(doc(db, 'settings', 'app'), newSettings, { merge: true });
      toast.success('Configurações atualizadas!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erro ao atualizar configurações.');
    }
  };

  const filteredChildren = children.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = ageFilter === 'all' || getAgeGroup(c.birthDate).id === ageFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && (c.status === 'Ativa' || c.status === undefined)) ||
                         (statusFilter === 'inactive' && c.status === 'Inativa') ||
                         (statusFilter === 'visitor' && c.status === 'Visitante');
    return matchesSearch && matchesAge && matchesStatus;
  });

  const familyGroups = React.useMemo(() => {
    const groups: { [key: string]: { children: Child[], parents: Parent[], familyName?: string } } = {};
    
    filteredChildren.forEach(child => {
      const fId = child.familyId || child.parentId || 'orphan';
      if (!groups[fId]) {
        groups[fId] = { children: [], parents: [], familyName: child.familyName };
        const familyParents = parents.filter(p => (p.familyId && p.familyId === fId) || p.id === child.parentId);
        groups[fId].parents = familyParents;
      }
      groups[fId].children.push(child);
    });
    
    return Object.values(groups).sort((a, b) => a.children[0].name.localeCompare(b.children[0].name));
  }, [filteredChildren, parents]);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        testConnection();
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Volunteers
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'volunteers'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const volunteersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Volunteer));
      setVolunteers(volunteersList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'volunteers'));
    return () => unsubscribe();
  }, [user]);

  // Fetch Schedules
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'schedules'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schedulesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
      setSchedules(schedulesList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'schedules'));
    return () => unsubscribe();
  }, [user]);

  // Fetch Services
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'services'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(servicesList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'services'));
    return () => unsubscribe();
  }, [user]);

  // Fetch Settings
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'app'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAppSettings({
          logoUrl: data.logoUrl || 'https://api.screenshotone.com/take?url=https%3A%2F%2Fstorage.googleapis.com%2Fstatic-assets-public%2Fais%2Fuser_uploads%2F601900293069%2F1744207230495_image.png&viewport_width=1024&viewport_height=768&block_ads=true&block_cookie_banners=true&block_trackers=true&delay=0&format=png',
          appName: data.appName || 'Aljava Controle'
        });
      }
    });
    return () => unsubSettings();
  }, []);

  async function testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firestore connection successful.");
    } catch (error) {
      console.error("Firestore connection error:", error);
      if(error instanceof Error && error.message.includes('the client is offline')) {
        toast.error("O banco de dados parece estar offline. Verifique sua conexão.");
      } else if (error instanceof Error && error.message.includes('permission')) {
        toast.error("Erro de permissão ao testar conexão com o banco.");
      } else {
        toast.error(`Erro de conexão: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'cord.aljava') {
      setIsLoggingIn(true);
      try {
        await signInAnonymously(auth);
        toast.success('Login realizado com sucesso!');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao fazer login. Verifique se o login anônimo está ativado no Firebase.');
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      toast.error('Senha incorreta!');
    }
  };

  const handleLogout = () => signOut(auth);

  // AI Generation
  const generateStudyIdeas = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Por favor, digite um tema ou versículo.');
      return;
    }

    setIsGenerating(true);
    setAiResponse('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const groupLabel = {
        'G1': '1-3 anos (Berçário/Maternal)',
        'G2': '4-5 anos (Jardim)',
        'G3': '6-7 anos (Primários)',
        'G4': '8-9 anos (Juniores)'
      }[selectedGroupId] || selectedGroupId;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Você é um coordenador de ministério infantil apaixonado por ensinar crianças. 
        Com base no seguinte tema ou versículo: "${aiPrompt}", 
        forneça 3 ideias criativas de atividades adaptadas especificamente para a faixa etária: ${groupLabel}.
        Use uma linguagem muito simples, lúdica e carinhosa, que as crianças dessa idade consigam entender.
        Inclua uma breve explicação do estudo em linguagem infantil 
        e uma sugestão de dinâmica ou brincadeira que reforce o ensino. 
        Responda em Português do Brasil usando formatação Markdown.`,
      });
      
      setAiResponse(response.text || 'Não foi possível gerar ideias no momento.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar ideias com IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendScheduleWhatsApp = (schedule: Schedule) => {
    const volunteer = volunteers.find(v => v.id === schedule.volunteerId);
    if (!volunteer) return;

    const dateStr = format(new Date(schedule.date + 'T12:00:00'), "dd/MM", { locale: ptBR });
    const message = `Olá ${volunteer.name}! 🏹\n\nVocê está escalado para o Ministério Infantil ${appSettings.appName}:\n\n📅 Data: ${dateStr}\n⏰ Turno: ${schedule.shift}\n🏫 Turma: ${schedule.groupId}\n📖 Tema: ${schedule.studyTheme || 'A definir'}\n\n${schedule.studyIdeas ? `💡 Ideias de Estudo:\n${schedule.studyIdeas}` : ''}\n\nContamos com você! ❤️`;
    const encodedMessage = encodeURIComponent(message);
    const phone = volunteer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const sendDailySummaryToAdmin = () => {
    const today = new Date();
    const todayBirthdays = children.filter(child => {
      const parts = child.birthDate.split('-');
      if (parts.length !== 3) return false;
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10) - 1;
      return day === today.getDate() && month === today.getMonth();
    });

    if (todayBirthdays.length === 0) {
      toast.info('Nenhum aniversariante hoje.');
      return;
    }

    const names = todayBirthdays.map(c => `• ${c.name} (${getAgeGroup(c.birthDate).label})`).join('\n');
    const message = `Olá! 🏹\n\nLembrete de aniversariantes de hoje (${format(today, 'dd/MM')}):\n\n${names}\n\nNão esqueça de parabenizar essas flechas! 🎂`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5524999432601?text=${encodedMessage}`, '_blank');
  };

  const sendBirthdayMessage = (child: Child, parent: Parent) => {
    const message = `Parabéns 🎉🏹\n\nDesejamos um feliz aniversário para a flecha ${child.name}, amada da nossa ${appSettings.appName}! Que o Papai do Céu derrame bênçãos sem medida sobre sua vida e sua família hoje e sempre.\n\nUm grande abraço de toda a equipe!`;
    const encodedMessage = encodeURIComponent(message);
    const phone = parent.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const sendVolunteerBirthdayMessage = (volunteer: Volunteer) => {
    const message = `Parabéns 🎉🏹\n\nFeliz aniversário, ${volunteer.name}! Agradecemos por todo o seu empenho e dedicação servindo na ${appSettings.appName}. Que o Senhor te abençoe grandemente neste novo ciclo!\n\nUm grande abraço de toda a equipe!`;
    const encodedMessage = encodeURIComponent(message);
    const phone = volunteer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const contactVolunteer = (volunteer: Volunteer) => {
    const message = `Olá ${volunteer.name}, tudo bem? Estou entrando em contato sobre o ministério ${appSettings.appName}.`;
    const encodedMessage = encodeURIComponent(message);
    const phone = volunteer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const contactParent = (child: Child, parent: Parent) => {
    const message = `Olá ${parent.name}, tudo bem? Estou entrando em contato sobre a flecha ${child.name}.`;
    const encodedMessage = encodeURIComponent(message);
    const phone = parent.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const sendAbsenceMessage = (child: Child, parent: Parent) => {
    const message = `Olá ${parent.name}, tudo bem? Sentimos falta da flecha ${child.name} nos últimos encontros da ${appSettings.appName}! Esperamos que esteja tudo bem. Estamos ansiosos para vê-los novamente! ❤️🏹`;
    const encodedMessage = encodeURIComponent(message);
    const phone = parent.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const sendWelcomeMessage = (child: Child, parent: Parent) => {
    const message = `Seja bem-vinda, flecha ${child.name}! 🏹✨\n\nFicamos muito felizes com o seu cadastro no Ministério Infantil ${appSettings.appName}. Que sua jornada conosco seja repleta de aprendizado, diversão e do amor de Deus!\n\n${parent.name}, qualquer dúvida estamos à disposição. Nos vemos no próximo encontro! ❤️`;
    const encodedMessage = encodeURIComponent(message);
    const phone = parent.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const sendEntryCard = async (child: Child, parent: Parent) => {
    const cardId = `entry-card-${child.id}`;
    const cardElement = document.getElementById(cardId);
    
    const openWhatsAppText = (c: Child, p: Parent) => {
      const message = `*CARTÃO DE ENTRADA - ALJAVA*\n\n*Criança:* ${c.name}\n*Responsável:* ${p.name}\n*Data:* ${format(new Date(), 'dd/MM/yyyy')}\n\nApresente este cartão no check-in/check-out.\n\n_Dica: Você pode salvar o QR Code da criança para agilizar o processo!_`;
      const encodedMessage = encodeURIComponent(message);
      let phone = p.phone.replace(/\D/g, '');
      // If it doesn't start with 55 and has 10 or 11 digits (standard BR number), add 55
      if (!phone.startsWith('55') && (phone.length === 10 || phone.length === 11)) {
        phone = `55${phone}`;
      }
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    };

    if (!cardElement) {
      toast.error('Elemento do cartão não encontrado.');
      openWhatsAppText(child, parent);
      return;
    }

    try {
      const loadingToast = toast.loading('Preparando cartão...', { id: 'generating-card' });
      
      // Ensure QR code and styles are settled
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use window.html2canvas if available (from CDN), otherwise use imported one
      const h2c = (window as any).html2canvas || html2canvas;

      const canvas = await h2c(cardElement, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: true, // Enable logging for debugging
        useCORS: true,
        allowTaint: true,
        windowWidth: cardElement.scrollWidth,
        windowHeight: cardElement.scrollHeight,
      });

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
      
      if (!blob) throw new Error('Falha ao gerar blob');

      // 1. Try to copy to clipboard (Best for WhatsApp Web/Desktop)
      let copied = false;
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
          ]);
          copied = true;
        }
      } catch (clipError) {
        console.warn('Clipboard API failed, falling back...', clipError);
      }

      toast.dismiss(loadingToast);

      const fileName = `cartao-aljava-${child.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // 2. Try Web Share API (Best for Mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Cartão de Entrada ${appSettings.appName}`,
            text: `Cartão de Entrada - ${child.name}`
          });
          return; // Success on mobile share
        } catch (shareError) {
          if ((shareError as Error).name !== 'AbortError') {
            console.error('Share error:', shareError);
          } else {
            return; // User cancelled
          }
        }
      }

      // 3. Fallback: Download + WhatsApp Text
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = fileName;
      link.click();
      
      if (copied) {
        toast.success('Imagem copiada e baixada! Cole (Ctrl+V) ou anexe no WhatsApp.', {
          duration: 6000,
        });
      } else {
        toast.success('Imagem baixada! Anexe-a manualmente no WhatsApp.', {
          duration: 6000,
        });
      }
      
      // Always open the text message as well
      setTimeout(() => openWhatsAppText(child, parent), 1000);

    } catch (error) {
      toast.dismiss('generating-card');
      console.error('Error capturing card:', error);
      toast.error('Erro ao gerar imagem. Enviando apenas texto.');
      openWhatsAppText(child, parent);
    }
  };

  const finalizarCheckinECompartilhar = async (idDaDivDoComprovante: string, nomeDaCrianca: string) => {
    const elemento = document.getElementById(idDaDivDoComprovante);
    if (!elemento) {
      toast.error('Comprovante não encontrado para compartilhamento.');
      return;
    }

    try {
      toast.loading('Gerando comprovante...', { id: 'sharing-checkin' });
      
      // Use window.html2canvas if available (from CDN), otherwise use imported one
      const h2c = (window as any).html2canvas || html2canvas;
      const canvas = await h2c(elemento, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Erro ao gerar imagem do comprovante.');
          toast.dismiss('sharing-checkin');
          return;
        }

        const file = new File([blob], `checkin-${nomeDaCrianca.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });

        toast.dismiss('sharing-checkin');

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Check-in Seguro',
              text: `Olá! ${nomeDaCrianca} já está conosco no ministério infantil.`
            });
          } catch (error) {
            console.log('O usuário cancelou o compartilhamento', error);
          }
        } else {
          // Fallback for browsers that don't support file sharing
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `checkin-${nomeDaCrianca.toLowerCase().replace(/\s+/g, '-')}.png`;
          link.click();
          toast.success('Comprovante baixado! Compartilhe manualmente.');
        }
      }, 'image/png');
    } catch (error) {
      toast.dismiss('sharing-checkin');
      console.error('Erro ao compartilhar check-in:', error);
      toast.error('Erro ao gerar comprovante.');
    }
  };

  const handleCheckIn = async (childId: string, requirePassword = false) => {
    if (requirePassword) {
      const password = window.prompt("Digite a senha para autorizar o check-in/out:");
      if (password !== "cord.aljava") {
        if (password !== null) toast.error("Senha incorreta!");
        return;
      }
    }
    try {
      const child = children.find(c => c.id === childId);
      if (!child) {
        toast.error("Criança não encontrada.");
        return;
      }
      
      const isCheckingIn = !child.checkedIn;
      await updateDoc(doc(db, 'children', childId), {
        checkedIn: isCheckingIn,
        lastCheckIn: isCheckingIn ? new Date().toISOString() : child.lastCheckIn || null,
        lastCheckOut: !isCheckingIn ? new Date().toISOString() : child.lastCheckOut || null
      });
      
      toast.success(`${child.name} ${isCheckingIn ? 'entrou' : 'saiu'} com sucesso!`, {
        icon: isCheckingIn ? '✅' : '👋'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'children');
    }
  };

  useEffect(() => {
    let html5QrCode: any = null;
    
    if (isScannerOpen) {
      const startScanner = async () => {
        try {
          // Small delay to ensure the DOM element is rendered
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const readerElement = document.getElementById("reader");
          if (!readerElement) return;

          html5QrCode = new Html5Qrcode("reader");
          
          const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };

          await html5QrCode.start(
            { facingMode: "environment" }, 
            config,
            (decodedText: string) => {
              handleCheckIn(decodedText);
              setIsScannerOpen(false);
            },
            () => {
              // Ignore scan errors
            }
          );
        } catch (err) {
          console.error("Erro ao iniciar scanner:", err);
          toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
          setIsScannerOpen(false);
        }
      };

      startScanner();
      
      return () => {
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
          }).catch((err: any) => console.error("Erro ao parar scanner:", err));
        }
      };
    }
  }, [isScannerOpen]);

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Helper para formatar dados da criança para o Excel
      const formatChildForExcel = (child: Child) => {
        const familyParents = parents.filter(p => (child.familyId && p.familyId === child.familyId) || p.id === child.parentId);
        const ageGroup = getAgeGroup(child.birthDate);
        return {
          'Nome da Criança': child.name,
          'Data de Nascimento': child.birthDate.split('-').reverse().join('/'),
          'Turma': ageGroup.label,
          'Status': child.status || 'Ativa',
          'Alergias': child.allergies || 'Nenhuma',
          'Observações': child.specialNeeds || 'Nenhuma',
          'Responsáveis': familyParents.map(p => `${p.name} (${p.relation})`).join(' / '),
          'Telefones': familyParents.map(p => p.phone).join(' / '),
          'Líderes': familyParents.map(p => p.leader || '-').join(' / ')
        };
      };

      // Aba 1: Todas as Crianças
      const allChildrenData = children.map(formatChildForExcel);
      const wsAllChildren = XLSX.utils.json_to_sheet(allChildrenData);
      XLSX.utils.book_append_sheet(workbook, wsAllChildren, "Todas as Crianças");

      // Abas por Turma
      const groups = [
        { id: 'G1', label: 'G1', coordinator: 'Ana Carolina' },
        { id: 'G2', label: 'G2', coordinator: 'Lilian' },
        { id: 'G3', label: 'G3', coordinator: 'Ana Carol' },
        { id: 'G4', label: 'G4', coordinator: 'Jhennifer' }
      ];

      groups.forEach(group => {
        const groupChildren = children.filter(c => getAgeGroup(c.birthDate).id === group.id);
        if (groupChildren.length > 0) {
          const groupData = groupChildren.map(formatChildForExcel);
          const wsGroup = XLSX.utils.json_to_sheet(groupData);
          
          // Adicionar info da coordenadora no topo (opcional, mas útil)
          XLSX.utils.sheet_add_aoa(wsGroup, [[`Coordenadora: ${group.coordinator}`]], { origin: "K1" });
          
          XLSX.utils.book_append_sheet(workbook, wsGroup, `Turma ${group.id}`);
        }
      });

      // Aba Estoque: Materiais
      const materialsData = materials.map(m => ({
        'Material': m.name,
        'Quantidade': m.quantity,
        'Mínimo': m.minQuantity,
        'Categoria': m.category,
        'Última Atualização': format(new Date(m.lastUpdated), 'dd/MM/yyyy HH:mm')
      }));
      const wsMaterials = XLSX.utils.json_to_sheet(materialsData);
      XLSX.utils.book_append_sheet(workbook, wsMaterials, "Estoque");

      XLSX.writeFile(workbook, `Relatorio_${appSettings.appName.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
      toast.success('Planilha gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao gerar planilha.');
    }
  };

  const getAgeGroup = (birthDateStr: string) => {
    if (!birthDateStr) return { id: 'OUTRO', label: 'Sem Data', age: 0 };
    
    const parts = birthDateStr.split('-');
    let birthDate: Date;
    
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      birthDate = new Date(year, month - 1, day);
    } else {
      birthDate = new Date(birthDateStr);
    }

    if (isNaN(birthDate.getTime())) return { id: 'OUTRO', label: 'Data Inválida', age: 0 };
    
    const age = differenceInYears(new Date(), birthDate);
    if (age >= 1 && age <= 3) return { id: 'G1', label: 'G1 (1-3 anos)', age };
    if (age >= 4 && age <= 5) return { id: 'G2', label: 'G2 (4-5 anos)', age };
    if (age >= 6 && age <= 7) return { id: 'G3', label: 'G3 (6-7 anos)', age };
    if (age >= 8 && age <= 9) return { id: 'G4', label: 'G4 (8-9 anos)', age };
    return { id: 'OUTRO', label: age < 1 ? 'Bebê' : 'Outra idade', age };
  };

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    const unsubChildren = onSnapshot(collection(db, 'children'), (snapshot) => {
      console.log('Children snapshot received:', snapshot.size, 'documents');
      setChildren(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child)));
    }, (err) => {
      console.error('Children snapshot error:', err);
      handleFirestoreError(err, OperationType.LIST, 'children');
    });

    const unsubParents = onSnapshot(collection(db, 'parents'), (snapshot) => {
      setParents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Parent)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'parents'));

    const unsubMaterials = onSnapshot(collection(db, 'materials'), (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'materials'));

    return () => {
      unsubChildren();
      unsubParents();
      unsubMaterials();
    };
  }, [user]);

  // Daily Reminder Effect
  useEffect(() => {
    if (isAdmin && children.length > 0 && !hasNotifiedToday) {
      const today = new Date();
      const todayBirthdays = children.filter(child => {
        const parts = child.birthDate.split('-');
        if (parts.length !== 3) return false;
        const day = parseInt(parts[2], 10);
        const month = parseInt(parts[1], 10) - 1;
        return day === today.getDate() && month === today.getMonth();
      });

      if (todayBirthdays.length > 0) {
        toast.info(`Temos ${todayBirthdays.length} aniversariante(s) hoje!`, {
          description: "Clique na aba de Aniversários para ver e enviar o resumo.",
          duration: 10000,
          action: {
            label: "Ver",
            onClick: () => {
              const tabsTrigger = document.querySelector('[value="birthdays"]') as HTMLElement;
              tabsTrigger?.click();
            }
          }
        });
        setHasNotifiedToday(true);
      }
    }
  }, [isAdmin, children, hasNotifiedToday]);

  // Actions
  const addChild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // 1. Create Family ID
      const familyId = `fam_${Date.now()}`;

      // 2. Create Parents
      const createdParents: Parent[] = [];
      for (const guardian of guardians) {
        if (!guardian.name || !guardian.phone) continue;
        
        const parentData = {
          name: guardian.name,
          phone: guardian.phone,
          leader: guardian.leader,
          relation: guardian.relation,
          familyId: familyId,
          photoUrl: guardian.photoUrl || ''
        };
        const parentRef = await addDoc(collection(db, 'parents'), parentData);
        createdParents.push({ id: parentRef.id, ...parentData });
      }

      if (createdParents.length === 0) {
        toast.error('Adicione pelo menos um responsável.');
        return;
      }

      // 3. Create Children
      const createdChildren: Child[] = [];
      for (const childInfo of childrenToAdd) {
        if (!childInfo.name || !childInfo.birthDate) continue;

        let birthDate = childInfo.birthDate;
        if (birthDate.includes('/')) {
          const parts = birthDate.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }

        const childData = {
          name: childInfo.name,
          birthDate: birthDate,
          allergies: childInfo.allergies,
          specialNeeds: childInfo.specialNeeds,
          parentId: createdParents[0].id,
          parentIds: createdParents.map(p => p.id!),
          familyId: familyId,
          familyName: familyName,
          status: childInfo.status as 'Ativa' | 'Inativa' | 'Visitante',
          photoUrl: childInfo.photoUrl || ''
        };
        const childRef = await addDoc(collection(db, 'children'), childData);
        createdChildren.push({ id: childRef.id, ...childData, birthDate: childInfo.birthDate });
      }

      if (createdChildren.length === 0) {
        toast.error('Adicione pelo menos uma criança.');
        return;
      }
      
      setLastRegisteredData({
        children: createdChildren,
        parents: createdParents
      });
      setShowSuccessView(true);
      setGuardians([{ name: '', phone: '', leader: '', relation: 'Pai/Mãe', photoUrl: '' }]);
      setChildrenToAdd([{ name: '', birthDate: '', allergies: '', specialNeeds: '', status: 'Ativa', photoUrl: '' }]);
      setFamilyName('');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error('Erro ao cadastrar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      if (errorMessage.includes('permission')) {
        toast.error('Erro de permissão: Verifique se você está logado corretamente.');
      } else {
        toast.error('Erro ao cadastrar família: ' + errorMessage);
      }
      handleFirestoreError(err, OperationType.CREATE, 'children/parents');
    }
  };

  const handleDeleteChild = async (child: Child) => {
    if (!isAdmin) return;
    
    try {
      await deleteDoc(doc(db, 'children', child.id!));
      toast.success(`${child.name} foi removido(a) do sistema.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'children');
    }
  };

  const toggleChildStatus = async (child: Child) => {
    try {
      const currentStatus = child.status || 'Ativa';
      const newStatus = currentStatus === 'Ativa' ? 'Inativa' : 'Ativa';
      await updateDoc(doc(db, 'children', child.id!), {
        status: newStatus
      });
      toast.success(`Flecha ${newStatus === 'Ativa' ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'children');
    }
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    const familyId = child.familyId || child.parentId;
    const familyParents = parents.filter(p => (p.familyId && p.familyId === familyId) || p.id === child.parentId);
    setEditGuardians(familyParents.map(p => ({
      id: p.id || '',
      name: p.name,
      phone: p.phone,
      leader: p.leader,
      relation: p.relation,
      photoUrl: p.photoUrl || ''
    })));
    setIsEditDialogOpen(true);
  };

  const updateChild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingChild) return;

    const formData = new FormData(e.currentTarget);
    const birthDateRaw = formData.get('birthDate') as string;
    let birthDate = birthDateRaw;

    if (birthDateRaw.includes('/')) {
      const parts = birthDateRaw.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    try {
      const updatedFamilyName = formData.get('familyName') as string;
      const familyId = editingChild.familyId || editingChild.parentId;
      
      // 1. Update/Create Parents
      const updatedParentIds: string[] = [];
      for (const guardian of editGuardians) {
        if (!guardian.name || !guardian.phone) continue;
        
        const parentData = {
          name: guardian.name,
          phone: guardian.phone,
          leader: guardian.leader,
          relation: guardian.relation,
          familyId: familyId,
          photoUrl: guardian.photoUrl || ''
        };

        if (guardian.id) {
          await updateDoc(doc(db, 'parents', guardian.id), parentData);
          updatedParentIds.push(guardian.id);
        } else {
          const parentRef = await addDoc(collection(db, 'parents'), parentData);
          updatedParentIds.push(parentRef.id);
        }
      }

      // 2. Update the current child
      await updateDoc(doc(db, 'children', editingChild.id!), {
        name: formData.get('name') as string,
        birthDate: birthDate,
        allergies: formData.get('allergies') as string,
        specialNeeds: formData.get('specialNeeds') as string,
        status: formData.get('status') as 'Ativa' | 'Inativa' | 'Visitante',
        familyName: updatedFamilyName,
        parentIds: updatedParentIds,
        parentId: updatedParentIds[0] || editingChild.parentId,
        photoUrl: editingChild.photoUrl || ''
      });

      // 3. Update all children in the same family
      if (familyId) {
        const familyChildren = children.filter(c => (c.familyId === familyId || c.parentId === familyId) && c.id !== editingChild.id);
        for (const child of familyChildren) {
          await updateDoc(doc(db, 'children', child.id!), {
            familyName: updatedFamilyName,
            parentIds: updatedParentIds,
            parentId: updatedParentIds[0] || child.parentId
          });
        }
      }

      toast.success('Cadastro atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setEditingChild(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'children/parents');
    }
  };

  const addMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const materialData = {
        name: formData.get('name') as string,
        quantity: Number(formData.get('quantity')),
        category: formData.get('category') as string,
        minQuantity: Number(formData.get('minQuantity')),
        lastUpdated: new Date().toISOString(),
      };
      await addDoc(collection(db, 'materials'), materialData);
      toast.success('Material adicionado!');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'materials');
    }
  };

  const updateMaterialQuantity = async (material: Material, delta: number) => {
    try {
      await updateDoc(doc(db, 'materials', material.id!), {
        quantity: Math.max(0, material.quantity + delta),
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'materials');
    }
  };

  const generateServiceTheme = async () => {
    if (!serviceAiPrompt.trim()) {
      toast.error('Por favor, digite uma palavra-chave ou versículo.');
      return;
    }
    setIsServiceAiGenerating(true);
    setServiceAiResponse('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Você é um líder de ministério infantil experiente e criativo. 
        Com base no seguinte tema ou versículo: "${serviceAiPrompt}", 
        forneça 3 sugestões de temas divertidos e educativos para um culto infantil ou rede de crianças.
        Use uma linguagem lúdica, simples e cativante, adequada para o público infantil.
        Para cada sugestão, inclua:
        1. Um título criativo e infantil.
        2. Um versículo chave em uma versão de fácil compreensão.
        3. Uma breve ideia central da mensagem explicada de forma simples (2 frases).
        Responda em Português do Brasil usando formatação Markdown (use negrito para os títulos e listas para os itens).`,
      });
      setServiceAiResponse(response.text || 'Não foi possível gerar sugestões.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar sugestões com IA.');
    } finally {
      setIsServiceAiGenerating(false);
    }
  };

  const generateFullStudy = async () => {
    if (!serviceAiPrompt.trim()) {
      toast.error('Por favor, digite um tema ou versículo para gerar o estudo.');
      return;
    }
    setIsServiceStudyAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Você é um educador cristão especializado em crianças. 
        Com base no tema/versículo: "${serviceAiPrompt}", 
        gere um esboço de estudo bíblico lúdico e completo para um culto infantil.
        O conteúdo deve ser adaptado para a compreensão de crianças, usando analogias simples e linguagem carinhosa.
        O esboço deve conter:
        1. Introdução divertida (pode incluir uma pergunta para as crianças).
        2. 3 pontos principais explicados de forma simples com referências bíblicas.
        3. Aplicação prática para o dia a dia da criança (escola, casa, amigos).
        4. Conclusão e um apelo amoroso.
        Responda em Português do Brasil usando formatação Markdown.`,
      });
      setServiceStudyAiResponse(response.text || '');
      toast.success('Estudo gerado! Você pode copiá-lo para o campo de conteúdo.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar estudo com IA.');
    } finally {
      setIsServiceStudyAiGenerating(false);
    }
  };

  const downloadStudy = (service: Service) => {
    if (!service.studyContent) {
      toast.error('Não há estudo salvo para este culto.');
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([`ESTUDO: ${service.name}\nDATA: ${service.date}\nTEMA: ${service.theme || 'N/A'}\n\n${service.studyContent}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `estudo-${service.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const addService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsUploading(true);
    try {
      let fileUrl = '';
      let fileName = '';

      if (selectedFile) {
        const fileRef = ref(storage, `services/${Date.now()}_${selectedFile.name}`);
        const uploadResult = await uploadBytes(fileRef, selectedFile);
        fileUrl = await getDownloadURL(uploadResult.ref);
        fileName = selectedFile.name;
      }

      const serviceData = {
        name: (formData.get('name') as string) || '',
        date: (formData.get('date') as string) || '',
        type: (formData.get('type') as string) || '',
        description: (formData.get('description') as string) || '',
        theme: (formData.get('theme') as string) || '',
        studyContent: (formData.get('studyContent') as string) || '',
        aiSuggestions: serviceAiResponse || '',
        fileUrl,
        fileName,
      };
      await addDoc(collection(db, 'services'), serviceData);
      toast.success('Culto/Rede agendado com sucesso!');
      setIsServiceDialogOpen(false);
      setServiceAiResponse('');
      setServiceAiPrompt('');
      setSelectedFile(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'services');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteService = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este culto?')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      toast.success('Culto removido.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'services');
    }
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setIsEditMaterialDialogOpen(true);
  };

  const updateMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMaterial) return;
    const formData = new FormData(e.currentTarget);
    try {
      await updateDoc(doc(db, 'materials', editingMaterial.id!), {
        name: formData.get('name') as string,
        quantity: Number(formData.get('quantity')),
        minQuantity: Number(formData.get('minQuantity')),
        category: formData.get('category') as string,
        lastUpdated: new Date().toISOString()
      });
      toast.success('Material atualizado!');
      setIsEditMaterialDialogOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'materials');
    }
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm('Deseja realmente excluir este material?')) return;
    try {
      await deleteDoc(doc(db, 'materials', id));
      toast.success('Material excluído!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'materials');
    }
  };

  // Volunteer & Schedule Management
  const addVolunteer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const birthDateRaw = formData.get('birthDate') as string;
    let birthDate = birthDateRaw;

    if (birthDateRaw && birthDateRaw.includes('/')) {
      const parts = birthDateRaw.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    const newVolunteer: Volunteer = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string,
      active: true,
      birthDate: birthDate || undefined
    };

    try {
      await addDoc(collection(db, 'volunteers'), newVolunteer);
      toast.success('Voluntário cadastrado!');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'volunteers');
    }
  };

  const deleteVolunteer = async (id: string) => {
    if (!confirm('Deseja realmente remover este voluntário?')) return;
    try {
      await deleteDoc(doc(db, 'volunteers', id));
      toast.success('Voluntário removido!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'volunteers');
    }
  };

  const handleEditVolunteer = (volunteer: Volunteer) => {
    setEditingVolunteer(volunteer);
    setIsEditVolunteerDialogOpen(true);
  };

  const updateVolunteer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingVolunteer) return;
    const formData = new FormData(e.currentTarget);
    try {
      await updateDoc(doc(db, 'volunteers', editingVolunteer.id!), {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        role: formData.get('role') as string,
        birthDate: formData.get('birthDate') as string,
      });
      toast.success('Voluntário atualizado!');
      setIsEditVolunteerDialogOpen(false);
      setEditingVolunteer(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'volunteers');
    }
  };

  const addSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSchedule: Schedule = {
      date: formData.get('date') as string,
      volunteerId: formData.get('volunteerId') as string,
      groupId: formData.get('groupId') as string,
      shift: formData.get('shift') as string,
      studyTheme: formData.get('studyTheme') as string,
      studyIdeas: aiResponse
    };

    try {
      await addDoc(collection(db, 'schedules'), newSchedule);
      toast.success('Escala agendada!');
      setAiResponse('');
      setAiPrompt('');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schedules');
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Deseja realmente remover esta escala?')) return;
    try {
      await deleteDoc(doc(db, 'schedules', id));
      toast.success('Escala removida!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'schedules');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Clock className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA] p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 max-w-md w-full text-center relative z-10 border border-slate-100"
        >
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <img 
                src={appSettings.logoUrl} 
                alt={`${appSettings.appName} Logo`} 
                className="w-16 h-16 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">{appSettings.appName}</h1>
            <p className="text-slate-500 text-lg leading-relaxed">Gestão inteligente para o seu ministério infantil</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Senha de Acesso</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  id="password"
                  type="password" 
                  placeholder="Digite a senha" 
                  className="h-14 pl-12 rounded-2xl border-slate-200 focus:ring-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full h-14 text-lg rounded-2xl aljava-gradient hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <p className="mt-8 text-sm text-slate-400">
            Acesso exclusivo para coordenadores e líderes
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Tabs defaultValue="dashboard" className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen z-40">
          <div className="p-8 flex items-center gap-4 border-b border-slate-50">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center">
              <img 
                src={appSettings.logoUrl} 
                alt={appSettings.appName} 
                className="w-8 h-8 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-bold text-2xl text-slate-900 block leading-none">{appSettings.appName.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">{appSettings.appName.split(' ').slice(1).join(' ')}</span>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2">Menu Principal</p>
            <TabsList className="flex flex-col h-auto bg-transparent border-none space-y-2 p-0">
              <TabsTrigger value="dashboard" className="w-full justify-start h-12 px-4 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-50 transition-all border-none">
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="checkin" className="w-full justify-start h-12 px-4 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-50 transition-all border-none">
                <ScanLine className="w-5 h-5 mr-3" />
                Check-in/Check-out
              </TabsTrigger>
              <TabsTrigger value="children" className="w-full justify-start h-12 px-4 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-50 transition-all border-none">
                <Users className="w-5 h-5 mr-3" />
                Cadastro de Crianças
              </TabsTrigger>
              <TabsTrigger value="birthdays" className="w-full justify-start h-12 px-4 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-50 transition-all border-none">
                <Cake className="w-5 h-5 mr-3" />
                Aniversariantes
              </TabsTrigger>
              <TabsTrigger value="services" className="w-full justify-start h-12 px-4 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-50 transition-all border-none">
                <Calendar className="w-5 h-5 mr-3" />
                Cultos/Rede
              </TabsTrigger>
              {isAdmin && (
                <>
                  <div className="pt-4 pb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Coordenação</p>
                  </div>
                  <TabsTrigger value="schedules" className="w-full justify-start h-12 px-4 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-50 transition-all border-none">
                    <CalendarDays className="w-5 h-5 mr-3" />
                    Escalas
                  </TabsTrigger>
                  <TabsTrigger value="volunteers" className="w-full justify-start h-12 px-4 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-50 transition-all border-none">
                    <UserCheck className="w-5 h-5 mr-3" />
                    Voluntários
                  </TabsTrigger>
                  <TabsTrigger value="coordination" className="w-full justify-start h-12 px-4 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-50 transition-all border-none">
                    <Package className="w-5 h-5 mr-3" />
                    Materiais
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="w-full justify-start h-12 px-4 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-50 transition-all border-none">
                    <Settings className="w-5 h-5 mr-3" />
                    Configurações
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <div className="p-6 border-t border-slate-50 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user.displayName?.charAt(0) || 'A'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{user.displayName}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    Coordenador
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl hover:bg-red-50 hover:text-red-500">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-50 px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center">
              <img 
                src={appSettings.logoUrl} 
                alt={appSettings.appName} 
                className="w-5 h-5 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-bold text-lg text-slate-900">{appSettings.appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 pb-safe">
          <TabsList className="flex h-16 bg-transparent border-none p-0 items-center justify-around w-full">
            <TabsTrigger 
              value="dashboard" 
              className="flex-1 flex flex-col gap-1 items-center justify-center h-full data-[state=active]:text-primary data-[state=active]:bg-transparent border-none shadow-none"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-bold">Geral</span>
            </TabsTrigger>
            <TabsTrigger 
              value="checkin" 
              className="flex-1 flex flex-col gap-1 items-center justify-center h-full data-[state=active]:text-primary data-[state=active]:bg-transparent border-none shadow-none"
            >
              <ScanLine className="w-5 h-5" />
              <span className="text-[10px] font-bold">Check-in</span>
            </TabsTrigger>
            <TabsTrigger 
              value="children" 
              className="flex-1 flex flex-col gap-1 items-center justify-center h-full data-[state=active]:text-primary data-[state=active]:bg-transparent border-none shadow-none"
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-bold">Crianças</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="schedules" 
                className="flex-1 flex flex-col gap-1 items-center justify-center h-full data-[state=active]:text-primary data-[state=active]:bg-transparent border-none shadow-none"
              >
                <CalendarDays className="w-5 h-5" />
                <span className="text-[10px] font-bold">Escalas</span>
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="birthdays" 
              className="flex-1 flex flex-col gap-1 items-center justify-center h-full data-[state=active]:text-primary data-[state=active]:bg-transparent border-none shadow-none"
            >
              <Cake className="w-5 h-5" />
              <span className="text-[10px] font-bold">Níver</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="flex-1 flex flex-col gap-1 items-center justify-center h-full data-[state=active]:text-primary data-[state=active]:bg-transparent border-none shadow-none"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] font-bold">Cultos</span>
            </TabsTrigger>
          </TabsList>
        </nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="fixed inset-0 z-40 lg:hidden bg-white pt-24 px-6 overflow-y-auto pb-10"
            >
              <TabsList className="flex flex-col h-auto bg-transparent border-none space-y-4 p-0">
                <TabsTrigger 
                  value="dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full justify-start h-14 px-6 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all border-none text-lg font-semibold"
                >
                  <LayoutDashboard className="w-6 h-6 mr-4" />
                  Geral
                </TabsTrigger>
                <TabsTrigger 
                  value="checkin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full justify-start h-14 px-6 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all border-none text-lg font-semibold"
                >
                  <ScanLine className="w-6 h-6 mr-4" />
                  Check-in/Check-out
                </TabsTrigger>
                <TabsTrigger 
                  value="children" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full justify-start h-14 px-6 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all border-none text-lg font-semibold"
                >
                  <Users className="w-6 h-6 mr-4" />
                  Cadastro de Crianças
                </TabsTrigger>
                <TabsTrigger 
                  value="birthdays" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full justify-start h-14 px-6 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all border-none text-lg font-semibold"
                >
                  <Cake className="w-6 h-6 mr-4" />
                  Aniversariantes
                </TabsTrigger>
                <TabsTrigger 
                  value="services" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full justify-start h-14 px-6 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all border-none text-lg font-semibold"
                >
                  <Calendar className="w-6 h-6 mr-4" />
                  Cultos/Rede
                </TabsTrigger>
                {isAdmin && (
                  <>
                    <TabsTrigger 
                      value="schedules" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full justify-start h-14 px-6 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all border-none text-lg font-semibold"
                    >
                      <CalendarDays className="w-6 h-6 mr-4" />
                      Escalas
                    </TabsTrigger>
                    <TabsTrigger 
                      value="volunteers" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full justify-start h-14 px-6 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all border-none text-lg font-semibold"
                    >
                      <UserCheck className="w-6 h-6 mr-4" />
                      Voluntários
                    </TabsTrigger>
                    <TabsTrigger 
                      value="coordination" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full justify-start h-14 px-6 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all border-none text-lg font-semibold"
                    >
                      <Package className="w-6 h-6 mr-4" />
                      Materiais
                    </TabsTrigger>
                    <TabsTrigger 
                      value="settings" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full justify-start h-14 px-6 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all border-none text-lg font-semibold"
                    >
                      <Settings className="w-6 h-6 mr-4" />
                      Configurações
                    </TabsTrigger>
                  </>
                )}
                <div className="pt-8 border-t border-slate-100 mt-auto pb-10">
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start h-14 px-6 rounded-2xl text-red-500 hover:bg-red-50 text-lg font-semibold">
                    <LogOut className="w-6 h-6 mr-4" />
                    Sair do Sistema
                  </Button>
                </div>
              </TabsList>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
          <main className="max-w-7xl mx-auto w-full px-4 lg:px-10 py-8 lg:py-12">
            {/* TabsContent will go here */}

          <TabsContent value="dashboard" className="space-y-8">
            {isAdmin && (
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Cadastro Rápido</h3>
                    <p className="text-sm text-slate-500">Adicione uma nova flecha ao ministério agora mesmo</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsChildDialogOpen(true)} 
                  className="w-full md:w-auto h-12 rounded-2xl aljava-gradient px-8 shadow-lg shadow-primary/20 text-lg font-bold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Cadastrar Nova Criança
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { id: 'G1', label: 'G1 (1-3 anos)', color: 'from-blue-500 to-blue-600', icon: Baby },
                { id: 'G2', label: 'G2 (4-5 anos)', color: 'from-purple-500 to-purple-600', icon: Users },
                { id: 'G3', label: 'G3 (6-7 anos)', color: 'from-emerald-500 to-emerald-600', icon: School },
                { id: 'G4', label: 'G4 (8-9 anos)', color: 'from-orange-500 to-orange-600', icon: ShieldCheck }
              ].map(group => (
                <Card 
                  key={group.id} 
                  className={`rounded-[2rem] border-none shadow-lg shadow-slate-200/50 bg-gradient-to-br ${group.color} text-white cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden group`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <group.icon className="w-32 h-32" />
                  </div>
                  <CardHeader className="p-6 relative z-10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-80">{group.label}</CardTitle>
                    <div className="text-4xl font-black mt-2">
                      {children.filter(c => getAgeGroup(c.birthDate).id === group.id).length}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-70">
                    {children.filter(c => getAgeGroup(c.birthDate).id === group.id && (c.status === 'Ativa' || c.status === undefined)).length} Ativas
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-2 flex items-center gap-1 opacity-70">
                      Clique para ver lista <ArrowRight className="w-3 h-3" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
              <DialogContent className="max-w-2xl rounded-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <School className="w-6 h-6 text-primary" />
                    Lista da Turma: {selectedGroup?.label}
                  </DialogTitle>
                  <CardDescription>Crianças matriculadas nesta turma</CardDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Coordenadora Responsável</p>
                        <p className="font-semibold text-slate-900">
                          {selectedGroup?.id === 'G1' && 'Ana Caroline'}
                          {selectedGroup?.id === 'G2' && 'Lilian'}
                          {selectedGroup?.id === 'G3' && 'Ana Carol'}
                          {selectedGroup?.id === 'G4' && 'Jhennifer'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {children
                      .filter(c => getAgeGroup(c.birthDate).id === selectedGroup?.id)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(c => (
                        <div key={c.id} className={`flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors ${c.status === 'Inativa' ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-3">
                            <Baby className={`w-4 h-4 ${c.status === 'Inativa' ? 'text-slate-300' : 'text-slate-400'}`} />
                            <span className={`font-medium ${c.status === 'Inativa' ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                              {c.name}
                              {c.status === 'Inativa' && ' (Inativa)'}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {c.birthDate.split('-').reverse().join('/')} {getAgeGroup(c.birthDate).age > 0 && `• ${getAgeGroup(c.birthDate).age} ${getAgeGroup(c.birthDate).age === 1 ? 'ano' : 'anos'}`}
                          </Badge>
                        </div>
                      ))}
                    {children.filter(c => getAgeGroup(c.birthDate).id === selectedGroup?.id).length === 0 && (
                      <div className="text-center py-8 text-slate-400 italic">Nenhuma criança nesta turma ainda.</div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
              <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50 bg-white border border-slate-100">
                <CardHeader className="p-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Flechas Ativas
                  </CardTitle>
                  <CardDescription>Crianças frequentando</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="text-5xl font-black text-primary">
                    {children.filter(c => c.status === 'Ativa' || c.status === undefined).length}
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Total de {children.length} cadastradas</p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50 bg-white border border-slate-100">
                <CardHeader className="p-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <UserMinus className="w-5 h-5 text-amber-500" />
                    Flechas Inativas
                  </CardTitle>
                  <CardDescription>Aguardando retorno</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="text-5xl font-black text-amber-500">
                    {children.filter(c => c.status === 'Inativa').length}
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Crianças que não frequentam</p>
                </CardContent>
              </Card>

              {isAdmin && (
                <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50 bg-white border border-slate-100">
                  <CardHeader className="p-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      Equipe {appSettings.appName}
                    </CardTitle>
                    <CardDescription>Ministros e Auxiliares</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex gap-4 items-end">
                      <div>
                        <div className="text-5xl font-black text-blue-500">
                          {volunteers.filter(v => v.role === 'Ministro').length}
                        </div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Ministros</p>
                      </div>
                      <div className="h-10 w-px bg-slate-100 mb-2"></div>
                      <div>
                        <div className="text-5xl font-black text-slate-400">
                          {volunteers.filter(v => v.role === 'Auxiliar').length}
                        </div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Auxiliares</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">Total de {volunteers.length} voluntários</p>
                  </CardContent>
                </Card>
              )}

              {isAdmin && (
                <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50 bg-white border border-slate-100">
                  <CardHeader className="p-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-red-500" />
                      Materiais em Alerta
                    </CardTitle>
                    <CardDescription>Itens com estoque baixo</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="text-5xl font-black text-red-500">
                      {materials.filter(m => m.quantity <= m.minQuantity).length}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">Necessitam de reposição</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {isAdmin && (
                <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50 bg-white border border-slate-100 overflow-hidden">
                  <CardHeader className="p-6 bg-orange-50/50 border-b border-orange-100">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-700">
                      <AlertCircle className="w-5 h-5" />
                      Avisos de Materiais
                    </CardTitle>
                    <CardDescription className="text-orange-600/70">Itens com estoque baixo</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[350px]">
                      <div className="p-6 space-y-4">
                        {materials.filter(m => m.quantity <= m.minQuantity).map(material => (
                          <div key={material.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-sm">{material.name}</div>
                                <div className="text-[10px] text-orange-600 font-bold uppercase">
                                  Estoque: {material.quantity} (Mín: {material.minQuantity})
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/5" onClick={() => updateMaterialQuantity(material, 5)}>
                              Repor
                            </Button>
                          </div>
                        ))}
                        {materials.filter(m => m.quantity <= m.minQuantity).length === 0 && (
                          <div className="text-center py-12 text-slate-400 italic">
                            <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            Tudo em ordem com o estoque!
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50 bg-white border border-slate-100 overflow-hidden">
                <CardHeader className="p-6 bg-pink-50/50 border-b border-pink-100">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-pink-700">
                    <Cake className="w-5 h-5" />
                    Aniversariantes do Mês
                  </CardTitle>
                  <CardDescription className="text-pink-600/70">Celebrando a vida na {appSettings.appName}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[350px]">
                    <div className="p-6 space-y-4">
                      {/* Children Birthdays */}
                      {children
                        .filter(child => {
                          const parts = child.birthDate.split('-');
                          return parts.length === 3 && (parseInt(parts[1], 10) - 1) === new Date().getMonth();
                        })
                        .sort((a, b) => parseInt(a.birthDate.split('-')[2], 10) - parseInt(b.birthDate.split('-')[2], 10))
                        .map(child => {
                          const parent = parents.find(p => (child.familyId && p.familyId === child.familyId) || p.id === child.parentId);
                          return (
                            <div key={child.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">
                                  <Baby className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-sm">{child.name}</div>
                                  <div className="text-[10px] text-slate-500 uppercase font-bold">Criança • Dia {parseInt(child.birthDate.split('-')[2], 10)}</div>
                                </div>
                              </div>
                              {parent && (
                                <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => sendBirthdayMessage(child, parent)}>
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          );
                        })
                      }
                      {/* Volunteer Birthdays */}
                      {volunteers
                        .filter(v => {
                          if (!v.birthDate) return false;
                          const parts = v.birthDate.split('-');
                          return parts.length === 3 && (parseInt(parts[1], 10) - 1) === new Date().getMonth();
                        })
                        .sort((a, b) => parseInt(a.birthDate!.split('-')[2], 10) - parseInt(b.birthDate!.split('-')[2], 10))
                        .map(v => (
                          <div key={v.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <UserCheck className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-sm">{v.name}</div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Voluntário • Dia {parseInt(v.birthDate!.split('-')[2], 10)}</div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => sendVolunteerBirthdayMessage(v)}>
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      }
                      {/* Empty State */}
                      {children.filter(c => {
                        const parts = c.birthDate.split('-');
                        return parts.length === 3 && (parseInt(parts[1], 10) - 1) === new Date().getMonth();
                      }).length === 0 && 
                      volunteers.filter(v => {
                        if (!v.birthDate) return false;
                        const parts = v.birthDate.split('-');
                        return parts.length === 3 && (parseInt(parts[1], 10) - 1) === new Date().getMonth();
                      }).length === 0 && (
                        <div className="text-center py-12 text-slate-400 italic">
                          <Cake className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          Nenhum aniversariante este mês.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="checkin" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Scanner e Ações Rápidas */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                  <div className="p-8 aljava-gradient text-white">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <ScanLine className="w-6 h-6" />
                      Scanner QR Code
                    </h2>
                    <p className="text-white/70 text-sm mt-1">Aponte a câmera para o QR Code da criança</p>
                  </div>
                  <CardContent className="p-8">
                    {!isScannerOpen ? (
                      <Button 
                        onClick={() => setIsScannerOpen(true)}
                        className="w-full h-32 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-primary/30 transition-all flex flex-col gap-3 text-slate-500 hover:text-primary"
                      >
                        <QrCode className="w-10 h-10" />
                        <span className="font-bold">Abrir Câmera</span>
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div id="reader" className="overflow-hidden rounded-2xl border-2 border-primary/20"></div>
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsScannerOpen(false)}
                          className="w-full h-12 rounded-xl text-red-500 hover:bg-red-50 font-bold"
                        >
                          Cancelar Scanner
                        </Button>
                      </div>
                    )}

                    <div className="mt-8 pt-8 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        Como funciona?
                      </h3>
                      <ul className="space-y-3 text-xs text-slate-500 leading-relaxed">
                        <li className="flex gap-2">
                          <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-[8px]">1</div>
                          Escaneie o QR Code no cartão de entrada enviado aos pais.
                        </li>
                        <li className="flex gap-2">
                          <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-[8px]">2</div>
                          O sistema identificará a criança e registrará a entrada/saída.
                        </li>
                        <li className="flex gap-2">
                          <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-[8px]">3</div>
                          Para pais sem celular, use a busca manual ao lado.
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo de Presença */}
                <Card className="rounded-[2.5rem] border-none shadow-lg shadow-slate-200/50 bg-white">
                  <CardHeader className="p-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Presença Hoje
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 p-4 rounded-2xl">
                        <div className="text-2xl font-black text-primary">
                          {children.filter(c => c.checkedIn).length}
                        </div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Presentes</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl">
                        <div className="text-2xl font-black text-slate-400">
                          {children.filter(c => !c.checkedIn && c.status === 'Ativa').length}
                        </div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Ausentes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Busca Manual e Lista */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Busca manual (nome da criança ou responsável)..." 
                      className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all"
                      value={checkinSearch}
                      onChange={(e) => setCheckinSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {children
                    .filter(child => {
                      const search = checkinSearch.toLowerCase();
                      const parent = parents.find(p => (child.familyId && p.familyId === child.familyId) || p.id === child.parentId);
                      return child.name.toLowerCase().includes(search) || 
                             (parent && parent.name.toLowerCase().includes(search)) ||
                             (parent && parent.phone.includes(search));
                    })
                    .slice(0, 10)
                    .map(child => {
                      const parent = parents.find(p => (child.familyId && p.familyId === child.familyId) || p.id === child.parentId);
                      return (
                        <Card key={child.id} className={`rounded-3xl border-none shadow-md transition-all ${child.checkedIn ? 'bg-green-50/30 ring-1 ring-green-100' : 'bg-white'}`}>
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                {child.photoUrl ? (
                                  <img src={child.photoUrl} alt={child.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${child.checkedIn ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Baby className="w-6 h-6" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-bold text-slate-900">{child.name}</h4>
                                  <p className="text-xs text-slate-500">{parent?.name || 'Responsável não cadastrado'}</p>
                                  {child.checkedIn && child.lastCheckIn && (
                                    <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Entrou às {format(new Date(child.lastCheckIn), 'HH:mm')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button 
                                  size="sm" 
                                  variant={child.checkedIn ? "destructive" : "default"}
                                  className={`rounded-xl font-bold h-9 ${!child.checkedIn ? 'aljava-gradient' : ''}`}
                                  onClick={() => handleCheckIn(child.id!, true)}
                                >
                                  {child.checkedIn ? 'Check-out' : 'Check-in'}
                                </Button>
                                {child.checkedIn && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="rounded-xl h-9 border-green-200 text-green-600 hover:bg-green-50"
                                    onClick={() => finalizarCheckinECompartilhar(`entry-card-${child.id}`, child.name)}
                                  >
                                    <Share2 className="w-3 h-3 mr-2" />
                                    Comprovante
                                  </Button>
                                )}
                                <Dialog>
                                  <DialogTrigger 
                                    render={
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="rounded-xl h-9 border-slate-200 text-slate-500"
                                        onClick={() => setSelectedChildForQr(child)}
                                      >
                                        <QrCode className="w-3 h-3 mr-2" />
                                        Cartão
                                      </Button>
                                    }
                                  />
                                  <DialogContent className="max-w-sm rounded-[2.5rem] p-0 max-h-[90vh] overflow-y-auto border-none shadow-2xl scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    <div id={`entry-card-${child.id}`} className="bg-white">
                                      <div className="aljava-gradient p-8 text-white text-center">
                                        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                          <QrCode className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-bold">Cartão {appSettings.appName}</h3>
                                        <p className="text-white/70 text-sm">Acesso Seguro</p>
                                      </div>
                                      <div className="p-8 pb-4 flex flex-col items-center gap-6">
                                        <div className="p-4 bg-white rounded-3xl shadow-inner border-4 border-slate-50">
                                          <QRCodeCanvas 
                                            value={child.id || ''} 
                                            size={200}
                                            level="H"
                                            includeMargin={true}
                                          />
                                        </div>
                                        <div className="flex flex-col items-center gap-3">
                                          {child.photoUrl && (
                                            <img src={child.photoUrl} alt={child.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg -mt-10 bg-white" referrerPolicy="no-referrer" />
                                          )}
                                          <div className="text-center space-y-1">
                                            <p className="font-black text-xl text-slate-900">{child.name}</p>
                                            <p className="text-sm text-slate-500 font-medium">Responsável: {parent?.name}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="p-8 pt-0 flex flex-col items-center gap-6">
                                      <div className="w-full pt-4 border-t border-slate-100 flex gap-3">
                                        <Button 
                                          className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold gap-2"
                                          onClick={() => parent && sendEntryCard(child, parent)}
                                        >
                                          <Share2 className="w-4 h-4" />
                                          Compartilhar
                                        </Button>
                                        <DialogClose render={
                                          <Button variant="ghost" className="flex-1 h-12 rounded-xl text-slate-400 font-bold">
                                            Fechar
                                          </Button>
                                        } />
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  {children.filter(child => {
                    const search = checkinSearch.toLowerCase();
                    const parent = parents.find(p => (child.familyId && p.familyId === child.familyId) || p.id === child.parentId);
                    return child.name.toLowerCase().includes(search) || 
                           (parent && parent.name.toLowerCase().includes(search)) ||
                           (parent && parent.phone.includes(search));
                  }).length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                      <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium">Nenhuma criança encontrada para o check-in.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="children" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Buscar flecha pelo nome..." 
                  className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={ageFilter} onValueChange={setAgeFilter}>
                  <SelectTrigger className="w-full md:w-[180px] h-12 rounded-2xl border-slate-100">
                    <SelectValue placeholder="Filtrar Turma" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Todas as Turmas</SelectItem>
                    <SelectItem value="G1">G1 (1-3 anos)</SelectItem>
                    <SelectItem value="G2">G2 (4-5 anos)</SelectItem>
                    <SelectItem value="G3">G3 (6-7 anos)</SelectItem>
                    <SelectItem value="G4">G4 (8-9 anos)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[150px] h-12 rounded-2xl border-slate-100">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                    <SelectItem value="visitor">Visitantes</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>
                
                {isAdmin && (
                  <Button onClick={exportToExcel} variant="outline" className="h-12 rounded-2xl border-slate-200 hover:bg-slate-50">
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                )}
              
              {isAdmin && (
                <Button onClick={() => setIsChildDialogOpen(true)} className="h-12 rounded-2xl aljava-gradient px-6 shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Criança
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {familyGroups.map((group, groupIdx) => {
                const familyId = group.children[0].familyId || group.children[0].parentId || `group-${groupIdx}`;
                return (
                  <motion.div layout key={familyId} className="space-y-4">
                    <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl shadow-slate-200/60 bg-white group hover:shadow-2xl transition-all duration-500">
                      <div className="h-3 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
                      <CardHeader className="p-8 pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[1.25rem] bg-primary/5 flex items-center justify-center text-primary">
                              <Users className="w-7 h-7" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-black text-slate-900 tracking-tight">
                                {group.familyName || `Família ${group.parents[0]?.name.split(' ').pop() || 'Sem Nome'}`}
                              </CardTitle>
                              <CardDescription className="font-medium text-slate-500">
                                {group.children.length} {group.children.length === 1 ? 'Flecha' : 'Flechas'} • {group.parents.length} {group.parents.length === 1 ? 'Responsável' : 'Responsáveis'}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 space-y-8">
                        {/* Children Section */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <Baby className="w-3 h-3" /> Flechas
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {group.children.map(child => {
                              const ageGroup = getAgeGroup(child.birthDate);
                              return (
                                <div key={child.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group/item hover:bg-white hover:shadow-md transition-all">
                                  <div className="flex items-center gap-3">
                                    {child.photoUrl ? (
                                      <img src={child.photoUrl} alt={child.name} className="w-10 h-10 rounded-xl object-cover border border-slate-100" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        child.status === 'Inativa' ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'
                                      }`}>
                                        <Baby className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-slate-900">{child.name}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="secondary" className="text-[9px] font-black uppercase bg-white text-slate-500 border-slate-100">
                                          {ageGroup.label} • {ageGroup.age} anos
                                        </Badge>
                                        {child.status && child.status !== 'Ativa' && (
                                          <Badge className={`text-[9px] font-black uppercase ${
                                            child.status === 'Inativa' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-600'
                                          }`}>
                                            {child.status}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {isAdmin && (
                                    <div className="flex gap-1 transition-opacity">
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className={`h-8 w-8 rounded-lg ${child.status === 'Inativa' ? 'text-green-500 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`} 
                                        onClick={() => toggleChildStatus(child)}
                                        title={child.status === 'Inativa' ? "Ativar" : "Desativar"}
                                      >
                                        {child.status === 'Inativa' ? <UserPlus className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-blue-500 hover:bg-blue-50" onClick={() => handleEditChild(child)}>
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50" onClick={() => handleDeleteChild(child)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Parents Section */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" /> Responsáveis
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {group.parents.map(parent => (
                              <div key={parent.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex gap-3">
                                    {parent.photoUrl ? (
                                      <img src={parent.photoUrl} alt={parent.name} className="w-10 h-10 rounded-xl object-cover border border-slate-100" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <ShieldCheck className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-slate-900 text-sm">{parent.name}</p>
                                      <p className="text-[10px] font-medium text-slate-500">{parent.relation} • Líder: {parent.leader || '---'}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    {group.children.some(c => c.status === 'Inativa') && (
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100"
                                        onClick={() => sendAbsenceMessage(group.children[0], parent)}
                                        title="Mensagem de Ausência"
                                      >
                                        <MessageCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                                      onClick={() => contactParent(group.children[0], parent)}
                                      title="Contato Rápido"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-xl">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {parent.phone}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {(group.children.some(c => c.allergies || c.specialNeeds)) && (
                          <div className="pt-4 border-t border-slate-50 space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Observações de Saúde/Atenção</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {group.children.filter(c => c.allergies).map(c => (
                                <div key={`alg-${c.id}`} className="flex items-start gap-2 text-[11px] bg-red-50 text-red-700 p-3 rounded-2xl border border-red-100">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span><b>{c.name}:</b> {c.allergies}</span>
                                </div>
                              ))}
                              {group.children.filter(c => c.specialNeeds).map(c => (
                                <div key={`sn-${c.id}`} className="flex items-start gap-2 text-[11px] bg-amber-50 text-amber-700 p-3 rounded-2xl border border-amber-100">
                                  <Info className="w-4 h-4 shrink-0" />
                                  <span><b>{c.name}:</b> {c.specialNeeds}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {familyGroups.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                  <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">Nenhuma criança encontrada com os filtros atuais.</p>
                  <p className="text-xs text-slate-300 mt-2">Verifique os filtros de turma e status acima.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="birthdays" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-pink-50/50 border-b border-pink-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-pink-700">
                        <Cake className="w-5 h-5" />
                        Aniversariantes de {format(new Date(), 'MMMM', { locale: ptBR })}
                      </CardTitle>
                      <CardDescription className="text-pink-600/70">Crianças que celebram a vida este mês</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      {isAdmin && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-xl border-pink-200 text-pink-700 hover:bg-pink-100"
                          onClick={sendDailySummaryToAdmin}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Resumo do Dia (Meu WhatsApp)
                        </Button>
                      )}
                      <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-bold">
                        {children.filter(child => {
                          const parts = child.birthDate.split('-');
                          if (parts.length !== 3) return false;
                          const month = parseInt(parts[1], 10) - 1;
                          return month === new Date().getMonth();
                        }).length} Flechas
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[550px]">
                    <div className="p-6 space-y-4">
                      {children
                        .filter(child => {
                          const parts = child.birthDate.split('-');
                          if (parts.length !== 3) return false;
                          const month = parseInt(parts[1], 10) - 1;
                          return month === new Date().getMonth();
                        })
                        .sort((a, b) => {
                          const dayA = parseInt(a.birthDate.split('-')[2], 10);
                          const dayB = parseInt(b.birthDate.split('-')[2], 10);
                          return dayA - dayB;
                        })
                        .map(child => {
                          const parent = parents.find(p => p.id === child.parentId);
                          const parts = child.birthDate.split('-');
                          const day = parseInt(parts[2], 10);
                          const isToday = day === new Date().getDate();
                          
                          return (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={child.id} 
                              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                                isToday 
                                ? 'bg-pink-50 border-pink-200 shadow-sm ring-1 ring-pink-200' 
                                : 'bg-white border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative ${
                                  isToday ? 'bg-pink-200 text-pink-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  <Baby className="w-7 h-7" />
                                  {isToday && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 text-lg">{child.name}</p>
                                    {isToday && <Badge className="bg-pink-500 hover:bg-pink-600">HOJE! 🎂</Badge>}
                                  </div>
                                  <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Dia {parseInt(child.birthDate.split('-')[2], 10)} • {getAgeGroup(child.birthDate).label}
                                  </p>
                                </div>
                              </div>
                              <div className="flex w-full sm:w-auto gap-2">
                                {parent && (
                                  <Button 
                                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 rounded-xl h-11 px-6 shadow-sm shadow-green-100"
                                    onClick={() => sendBirthdayMessage(child, parent)}
                                  >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Enviar Parabéns
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      {children.filter(child => new Date(child.birthDate).getMonth() === new Date().getMonth()).length === 0 && (
                        <div className="text-center py-20">
                          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Cake className="w-10 h-10 text-slate-300" />
                          </div>
                          <p className="text-slate-400 font-medium">Nenhum aniversariante este mês.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    Quadro Geral
                  </CardTitle>
                  <CardDescription>Todos os aniversariantes do ano</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[550px]">
                    <div className="p-6 space-y-8">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const monthChildren = children.filter(c => {
                          const parts = c.birthDate.split('-');
                          if (parts.length !== 3) return false;
                          return (parseInt(parts[1], 10) - 1) === i;
                        });
                        
                        if (monthChildren.length === 0) return null;
                        
                        const isCurrentMonth = i === new Date().getMonth();
                        
                        return (
                          <div key={i} className={`space-y-3 p-4 rounded-2xl border ${isCurrentMonth ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-slate-50'}`}>
                            <h4 className={`font-bold capitalize flex items-center justify-between ${isCurrentMonth ? 'text-blue-700' : 'text-slate-900'}`}>
                              <span>{format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })}</span>
                              <Badge variant="outline" className={isCurrentMonth ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-slate-100'}>
                                {monthChildren.length}
                              </Badge>
                            </h4>
                            <div className="space-y-2">
                              {monthChildren
                                .sort((a, b) => {
                                  const dayA = parseInt(a.birthDate.split('-')[2], 10);
                                  const dayB = parseInt(b.birthDate.split('-')[2], 10);
                                  return dayA - dayB;
                                })
                                .map(c => (
                                  <div key={c.id} className="text-sm flex justify-between items-center group">
                                    <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{c.name}</span>
                                    <span className="text-slate-400 font-mono text-xs bg-slate-50 px-2 py-0.5 rounded">
                                      Dia {parseInt(c.birthDate.split('-')[2], 10)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Cultos & Redes</h2>
                <p className="text-slate-500">Organização e cronograma dos cultos da igreja</p>
              </div>
              <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogTrigger render={
                  <Button className="h-12 rounded-2xl aljava-gradient px-8 shadow-lg shadow-primary/20 font-bold">
                    <Plus className="w-5 h-5 mr-2" />
                    Agendar Culto
                  </Button>
                } />
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                  <div className="bg-primary p-8 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-white">Novo Culto/Rede</DialogTitle>
                    </DialogHeader>
                  </div>
                  <ScrollArea className="max-h-[80vh]">
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <form onSubmit={addService} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome do Culto</Label>
                          <Input name="name" placeholder="Ex: Culto de Celebração" required className="h-12 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Data</Label>
                            <Input type="date" name="date" required className="h-12 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tipo</Label>
                            <Select name="type" required defaultValue="Culto">
                              <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="Culto">Culto</SelectItem>
                                <SelectItem value="Rede">Rede</SelectItem>
                                <SelectItem value="Evento">Evento</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tema</Label>
                          <Input name="theme" placeholder="Ex: O Poder da Oração" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Estudo/Esboço (Para Download)</Label>
                          <textarea 
                            name="studyContent" 
                            placeholder="Cole aqui o esboço da mensagem..." 
                            className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Arquivo da Aula (PDF, Imagem, etc.)</Label>
                          <div className="flex items-center gap-2">
                            <label className="flex-1 h-12 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm text-slate-500 overflow-hidden px-4">
                              <Upload className="w-4 h-4 shrink-0" />
                              <span className="truncate">{selectedFile ? selectedFile.name : 'Clique para selecionar'}</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              />
                            </label>
                            {selectedFile && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setSelectedFile(null)}
                                className="text-red-500 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isUploading} className="w-full h-12 rounded-xl aljava-gradient font-bold">
                            {isUploading ? <Sparkles className="w-4 h-4 animate-spin mr-2" /> : null}
                            {isUploading ? 'Enviando...' : 'Agendar e Salvar'}
                          </Button>
                        </DialogFooter>
                      </form>

                      <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-slate-900">IA: Auxílio Pastoral</h3>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Palavra-chave ou versículo..." 
                              className="rounded-xl"
                              value={serviceAiPrompt}
                              onChange={(e) => setServiceAiPrompt(e.target.value)}
                            />
                            <div className="flex gap-1">
                              <Button 
                                type="button"
                                onClick={generateServiceTheme}
                                disabled={isServiceAiGenerating || isServiceStudyAiGenerating}
                                title="Sugerir Temas"
                                variant="secondary"
                                className="rounded-xl shrink-0"
                              >
                                {isServiceAiGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                              </Button>
                              <Button 
                                type="button"
                                onClick={generateFullStudy}
                                disabled={isServiceAiGenerating || isServiceStudyAiGenerating}
                                title="Gerar Estudo Completo"
                                variant="outline"
                                className="rounded-xl shrink-0 border-primary/20 text-primary hover:bg-primary/5"
                              >
                                {isServiceStudyAiGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>

                          {serviceAiResponse && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Sugestões de Temas</p>
                              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 max-h-[200px] overflow-y-auto shadow-sm prose prose-slate prose-xs">
                                <ReactMarkdown>{serviceAiResponse}</ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {serviceStudyAiResponse && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between ml-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Esboço do Estudo</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-[10px] text-primary"
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea[name="studyContent"]') as HTMLTextAreaElement;
                                    if (textarea) {
                                      textarea.value = serviceStudyAiResponse;
                                      // Trigger change event for React
                                      const event = new Event('input', { bubbles: true });
                                      textarea.dispatchEvent(event);
                                      toast.success('Estudo copiado para o campo de conteúdo!');
                                    }
                                  }}
                                >
                                  Usar este estudo
                                </Button>
                              </div>
                              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 max-h-[200px] overflow-y-auto shadow-sm prose prose-slate prose-xs">
                                <ReactMarkdown>{serviceStudyAiResponse}</ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {!serviceAiResponse && !serviceStudyAiResponse && (
                            <div className="text-center py-8 text-slate-400">
                              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                              <p className="text-[10px]">Use a IA para ter ideias criativas ou gerar esboços para o seu culto.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.length === 0 ? (
                <Card className="col-span-full p-12 text-center bg-white rounded-[2.5rem] border-dashed border-2 border-slate-200">
                  <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">Nenhum culto agendado ainda.</p>
                </Card>
              ) : (
                services.map(service => (
                  <Card key={service.id} className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            service.type === 'Rede' ? 'bg-purple-100 text-purple-600' : 
                            service.type === 'Evento' ? 'bg-orange-100 text-orange-600' : 
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div>
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold mb-1">
                              {service.type}
                            </Badge>
                            <h3 className="font-bold text-slate-900 leading-tight">{service.name}</h3>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {service.fileUrl && (
                            <a 
                              href={service.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-primary hover:bg-primary/5 transition-colors"
                              title={`Baixar Arquivo: ${service.fileName}`}
                            >
                              <FileIcon className="w-4 h-4" />
                            </a>
                          )}
                          {service.studyContent && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => downloadStudy(service)}
                              className="text-primary hover:bg-primary/5"
                              title="Baixar Esboço (.txt)"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteService(service.id!)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{format(new Date(service.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}</span>
                        </div>
                        {service.theme && (
                          <div className="flex items-center gap-2 text-sm font-bold text-primary">
                            <MessageCircle className="w-4 h-4" />
                            <span>{service.theme}</span>
                          </div>
                        )}
                        {service.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 italic">
                            "{service.description}"
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="volunteers" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cadastro de Voluntários */}
              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                <div className="p-8 aljava-gradient text-white">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <UserPlus className="w-6 h-6" />
                    Novo Voluntário
                  </h2>
                  <p className="text-white/70 text-sm mt-1">Cadastre quem serve no ministério</p>
                </div>
                <CardContent className="p-8">
                  <form onSubmit={addVolunteer} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="vol-name" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome Completo</Label>
                      <Input id="vol-name" name="name" required placeholder="Ex: João Silva" className="h-12 rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vol-phone" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">WhatsApp</Label>
                      <Input id="vol-phone" name="phone" required placeholder="(00) 00000-0000" className="h-12 rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vol-birthDate" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Data de Nascimento (DD/MM/AAAA)</Label>
                      <Input id="vol-birthDate" name="birthDate" placeholder="Ex: 15/05/1990" className="h-12 rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vol-role" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Função</Label>
                      <Select name="role" required>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Ministro">Ministro</SelectItem>
                          <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                          <SelectItem value="Coordenador">Coordenador</SelectItem>
                          <SelectItem value="Louvor">Louvor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl aljava-gradient shadow-lg shadow-primary/20">
                      Cadastrar Voluntário
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Voluntários */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Equipe {appSettings.appName}</h2>
                  <Badge variant="secondary" className="rounded-full px-4 py-1 bg-primary/5 text-primary border-none font-bold">
                    {volunteers.length} Voluntários
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {volunteers.map(volunteer => (
                    <Card key={volunteer.id} className="rounded-3xl border-none shadow-lg shadow-slate-200/50 bg-white group overflow-hidden">
                      <CardHeader className="p-6 pb-2">
                        <div className="flex justify-between items-start">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-green-500 hover:text-green-600 rounded-lg"
                              onClick={() => contactVolunteer(volunteer)}
                              title="Enviar WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-blue-400 hover:text-blue-600 rounded-lg"
                              onClick={() => handleEditVolunteer(volunteer)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-red-400 hover:text-red-600 rounded-lg"
                              onClick={() => deleteVolunteer(volunteer.id!)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <CardTitle className="text-lg font-bold mt-4">{volunteer.name}</CardTitle>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{volunteer.role}</p>
                      </CardHeader>
                      <CardContent className="p-6 pt-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <Phone className="w-4 h-4 text-green-500" />
                          {volunteer.phone}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              {/* Escala de Serviço */}
              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <CalendarDays className="w-6 h-6 text-primary" />
                      Escala de Serviço
                    </h2>
                    <p className="text-slate-500 text-sm">Organize os voluntários por turma e turno</p>
                  </div>
                  
                  <Dialog onOpenChange={(open) => {
                    if (!open) {
                      setAiResponse('');
                      setAiPrompt('');
                    }
                  }}>
                    <DialogTrigger render={
                      <Button className="rounded-xl aljava-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Escala
                      </Button>
                    } />
                    <DialogContent className="rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Agendar Escala</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={addSchedule} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Data</Label>
                          <Input type="date" name="date" required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Voluntário</Label>
                          <Select name="volunteerId" required>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Selecione o voluntário" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {volunteers.map(v => (
                                <SelectItem key={v.id} value={v.id!}>{v.name} ({v.role})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Turma</Label>
                            <Select name="groupId" required value={selectedGroupId} onValueChange={setSelectedGroupId}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Turma" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="G1">G1 (1-3 anos)</SelectItem>
                                <SelectItem value="G2">G2 (4-5 anos)</SelectItem>
                                <SelectItem value="G3">G3 (6-7 anos)</SelectItem>
                                <SelectItem value="G4">G4 (8-9 anos)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Turno</Label>
                            <Select name="shift" required>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Turno" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="Manhã">Manhã</SelectItem>
                                <SelectItem value="Noite">Noite</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-4 border-t pt-4 mt-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-primary font-bold flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Ideias de Estudo (IA)
                            </Label>
                            <Badge variant="outline" className="text-[10px] uppercase">Opcional</Badge>
                          </div>
                          
                          <div className="flex gap-2">
                            <Input 
                              name="studyTheme"
                              placeholder="Tema ou Versículo..." 
                              className="rounded-xl"
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                            />
                            <Button 
                              type="button"
                              onClick={generateStudyIdeas}
                              disabled={isGenerating}
                              variant="secondary"
                              className="rounded-xl shrink-0"
                            >
                              {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            </Button>
                          </div>

                          {aiResponse && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 max-h-40 overflow-y-auto shadow-sm prose prose-slate prose-xs">
                              <ReactMarkdown>{aiResponse}</ReactMarkdown>
                            </div>
                          )}
                        </div>

                        <DialogFooter className="pt-4">
                          <Button type="submit" className="w-full rounded-xl aljava-gradient">Salvar Escala</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <div className="p-8 space-y-4">
                      {schedules.length === 0 ? (
                        <div className="text-center py-20">
                          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-400">Nenhuma escala agendada.</p>
                        </div>
                      ) : (
                        schedules.map(schedule => {
                          const volunteer = volunteers.find(v => v.id === schedule.volunteerId);
                          return (
                            <div key={schedule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center shadow-sm border border-slate-100">
                                  <span className="text-[10px] font-bold text-primary uppercase leading-none">{format(new Date(schedule.date + 'T12:00:00'), 'MMM', { locale: ptBR })}</span>
                                  <span className="text-lg font-black text-slate-900 leading-none">{format(new Date(schedule.date + 'T12:00:00'), 'dd')}</span>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{volunteer?.name || 'Voluntário Removido'}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="secondary" className="text-[10px] bg-white border-slate-200">{schedule.groupId}</Badge>
                                    <Badge variant="secondary" className="text-[10px] bg-white border-slate-200">{schedule.shift}</Badge>
                                    {schedule.studyTheme && (
                                      <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5">
                                        {schedule.studyTheme}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="text-green-500 hover:bg-green-50 rounded-xl"
                                  onClick={() => sendScheduleWhatsApp(schedule)}
                                  title="Enviar para WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                                {schedule.studyIdeas && (
                                  <Dialog>
                                    <DialogTrigger render={
                                      <Button size="icon" variant="ghost" className="text-primary hover:bg-primary/5 rounded-xl">
                                        <Sparkles className="w-4 h-4" />
                                      </Button>
                                    } />
                                    <DialogContent className="rounded-2xl max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                          <Sparkles className="w-5 h-5 text-primary" />
                                          Estudo: {schedule.studyTheme}
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 max-h-[60vh] overflow-y-auto shadow-sm prose prose-slate prose-sm">
                                        <ReactMarkdown>{schedule.studyIdeas}</ReactMarkdown>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  onClick={() => deleteSchedule(schedule.id!)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coordination" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Materiais</h2>
              <Dialog>
                <DialogTrigger render={
                  <Button className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Material
                  </Button>
                } />
                <DialogContent className="max-w-md rounded-[2.5rem] max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 overflow-hidden">
                  <div className="bg-primary p-8 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-white">Novo Material</DialogTitle>
                      <CardDescription className="text-white/70">Adicione um novo item ao estoque</CardDescription>
                    </DialogHeader>
                  </div>
                  <form onSubmit={addMaterial} className="p-8 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="matName" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome do Material</Label>
                      <Input id="matName" name="name" required placeholder="Ex: Lápis de cor" className="h-12 rounded-xl border-slate-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="matQty" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Quantidade Inicial</Label>
                        <Input id="matQty" name="quantity" type="number" required defaultValue="0" className="h-12 rounded-xl border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="matMin" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Qtd. Mínima</Label>
                        <Input id="matMin" name="minQuantity" type="number" required defaultValue="5" className="h-12 rounded-xl border-slate-200" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="matCat" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Categoria</Label>
                      <Select name="category" defaultValue="Papelaria">
                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Papelaria">Papelaria</SelectItem>
                          <SelectItem value="Brinquedos">Brinquedos</SelectItem>
                          <SelectItem value="Lanches">Lanches</SelectItem>
                          <SelectItem value="Limpeza">Limpeza</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit" className="w-full h-14 text-lg rounded-2xl aljava-gradient shadow-lg shadow-primary/20">Cadastrar Material</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map(material => (
                <Card key={material.id} className={`rounded-2xl border-slate-200 shadow-sm ${material.quantity <= material.minQuantity ? 'border-orange-200 bg-orange-50/30' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{material.category}</Badge>
                      {material.quantity <= material.minQuantity && (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <CardTitle className="mt-2">{material.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <div className="text-3xl font-bold">{material.quantity}</div>
                        <div className="text-xs text-slate-500">unidades em estoque</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => updateMaterialQuantity(material, -1)}>
                          -
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => updateMaterialQuantity(material, 1)}>
                          +
                        </Button>
                        {isAdmin && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-blue-500" onClick={() => handleEditMaterial(material)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-red-500" onClick={() => deleteMaterial(material.id!)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Última atualização: {format(new Date(material.lastUpdated), 'dd/MM HH:mm')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
              <div className="p-8 aljava-gradient text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Configurações do Sistema
                </h2>
                <p className="text-white/70 text-sm mt-1">Personalize a aparência e informações do seu ministério</p>
              </div>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-lg font-bold">Logo do Ministério</Label>
                    <div className="flex flex-col items-center gap-6 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <div className="w-32 h-32 bg-white rounded-3xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                        <img 
                          src={appSettings.logoUrl} 
                          alt="Preview Logo" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col w-full gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="logo-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const url = await handleFileUpload(file, 'settings');
                                await setDoc(doc(db, 'settings', 'app'), { ...appSettings, logoUrl: url }, { merge: true });
                                toast.success('Logo atualizada com sucesso!');
                              } catch (error) {
                                console.error('Erro ao atualizar logo:', error);
                              }
                            }
                          }}
                        />
                        <Button 
                          asChild
                          className="w-full h-12 rounded-2xl aljava-gradient font-bold shadow-lg shadow-primary/20"
                        >
                          <label htmlFor="logo-upload" className="cursor-pointer flex items-center justify-center gap-2">
                            <Upload className="w-5 h-5" />
                            Alterar Logo
                          </label>
                        </Button>
                        <p className="text-[10px] text-center text-slate-400 font-medium">Recomendado: PNG ou JPG, fundo transparente, 512x512px</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-lg font-bold">Nome do Ministério</Label>
                    <div className="space-y-4 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <div className="space-y-2">
                        <Label htmlFor="app-name">Nome Exibido</Label>
                        <Input 
                          id="app-name"
                          value={appSettings.appName}
                          onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                          className="h-12 rounded-xl border-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="logo-url">URL da Logo</Label>
                        <Input 
                          id="logo-url"
                          value={appSettings.logoUrl}
                          onChange={(e) => setAppSettings({ ...appSettings, logoUrl: e.target.value })}
                          placeholder="https://exemplo.com/logo.png"
                          className="h-12 rounded-xl border-slate-200"
                        />
                      </div>
                      <Button 
                        onClick={async () => {
                          try {
                            await setDoc(doc(db, 'settings', 'app'), appSettings, { merge: true });
                            toast.success('Configurações salvas!');
                          } catch (error) {
                            handleFirestoreError(error, OperationType.UPDATE, 'settings/app');
                          }
                        }}
                        className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold"
                      >
                        Salvar Configurações
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </main>
        </div>
      </Tabs>
      
      <Toaster position="top-center" richColors />

      {/* Global Registration Dialog */}
      <Dialog open={isChildDialogOpen} onOpenChange={(open) => {
        setIsChildDialogOpen(open);
        if (!open) {
          // Reset success view after dialog closes
          setTimeout(() => setShowSuccessView(false), 300);
        }
      }}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <ScrollArea className="max-h-[90vh]">
            {showSuccessView && lastRegisteredData ? (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold text-slate-900">Cadastro Realizado!</DialogTitle>
                <p className="text-slate-500">Confira os dados cadastrados abaixo:</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 border border-slate-100">
                {lastRegisteredData.children[0].familyName && (
                  <div className="pb-4 border-b border-slate-200">
                    <Label className="text-xs text-slate-400 uppercase">Nome da Família</Label>
                    <p className="text-lg font-black text-primary">{lastRegisteredData.children[0].familyName}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-400 uppercase">Flechas (Crianças)</Label>
                    <div className="space-y-1">
                      {lastRegisteredData.children.map((c: any, idx: number) => (
                        <p key={idx} className="font-semibold text-slate-900">{c.name} ({getAgeGroup(c.birthDate).label})</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400 uppercase">Nascimento</Label>
                    <div className="space-y-1">
                      {lastRegisteredData.children.map((c: any, idx: number) => (
                        <p key={idx} className="font-semibold text-slate-900">{c.birthDate}</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400 uppercase">Responsáveis</Label>
                    <div className="space-y-1">
                      {lastRegisteredData.parents.map((p: any, idx: number) => (
                        <p key={idx} className="font-semibold text-slate-900">{p.name} ({p.relation})</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400 uppercase">Telefone(s)</Label>
                    <div className="space-y-1">
                      {lastRegisteredData.parents.map((p: any, idx: number) => (
                        <p key={idx} className="font-semibold text-slate-900">{p.phone}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-4 space-y-3">
                <Button 
                  className="w-full h-12 rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
                  onClick={() => sendWelcomeMessage(lastRegisteredData.children[0], lastRegisteredData.parents[0])}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Enviar Mensagem de Boas-vindas
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full h-12 rounded-2xl text-slate-400 font-bold"
                  onClick={() => {
                    setShowSuccessView(false);
                    setIsChildDialogOpen(false);
                  }}
                >
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-primary p-8 text-white relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <h2 className="text-3xl font-black flex items-center gap-3">
                    <Baby className="w-8 h-8" />
                    Nova Flecha
                  </h2>
                  <p className="text-white/70 font-medium mt-1">Preencha os dados para o cadastro no Ministério Infantil</p>
                </div>
              </div>
              
              <form onSubmit={addChild} className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Identificação da Família
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="familyName" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome da Família (Opcional)</Label>
                      <Input 
                        id="familyName" 
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        placeholder="Ex: Família Silva" 
                        className="h-12 rounded-xl border-slate-200 bg-white focus:ring-primary" 
                      />
                      <p className="text-[10px] text-slate-400 ml-1 italic">Se deixado em branco, o sistema usará o sobrenome do primeiro responsável.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Dados das Flechas (Crianças)</h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => setChildrenToAdd([...childrenToAdd, { name: '', birthDate: '', allergies: '', specialNeeds: '', status: 'Ativa', photoUrl: '' }])}
                      >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Criança
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {childrenToAdd.map((child, index) => (
                      <div key={index} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 relative group">
                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center relative group/photo">
                              {child.photoUrl ? (
                                <img src={child.photoUrl} alt="Foto da criança" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Baby className="w-10 h-10 text-slate-300" />
                              )}
                              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="w-6 h-6 text-white" />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const url = await handleFileUpload(file, 'children');
                                      const newChildren = [...childrenToAdd];
                                      newChildren[index].photoUrl = url;
                                      setChildrenToAdd(newChildren);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foto da Flecha</span>
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome da Criança {childrenToAdd.length > 1 ? index + 1 : ''}</Label>
                              <Input 
                                value={child.name}
                                onChange={(e) => {
                                  const newChildren = [...childrenToAdd];
                                  newChildren[index].name = e.target.value;
                                  setChildrenToAdd(newChildren);
                                }}
                                required 
                                placeholder="Nome completo" 
                                className="h-12 rounded-xl border-slate-200 bg-white focus:ring-primary" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Data de Nascimento (DD/MM/AAAA)</Label>
                              <Input 
                                value={child.birthDate}
                                onChange={(e) => {
                                  const newChildren = [...childrenToAdd];
                                  newChildren[index].birthDate = e.target.value;
                                  setChildrenToAdd(newChildren);
                                }}
                                required 
                                placeholder="Ex: 15/05/2018" 
                                className="h-12 rounded-xl border-slate-200 bg-white focus:ring-primary" 
                              />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Alergias</Label>
                            <Input 
                              value={child.allergies}
                              onChange={(e) => {
                                const newChildren = [...childrenToAdd];
                                newChildren[index].allergies = e.target.value;
                                setChildrenToAdd(newChildren);
                              }}
                              placeholder="Ex: Amendoim, lactose..." 
                              className="h-12 rounded-xl border-slate-200 bg-white focus:ring-primary" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Observações Especiais</Label>
                            <Input 
                              value={child.specialNeeds}
                              onChange={(e) => {
                                const newChildren = [...childrenToAdd];
                                newChildren[index].specialNeeds = e.target.value;
                                setChildrenToAdd(newChildren);
                              }}
                              placeholder="Ex: Autismo, TDAH..." 
                              className="h-12 rounded-xl border-slate-200 bg-white focus:ring-primary" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Status</Label>
                            <Select 
                              value={child.status}
                              onValueChange={(val) => {
                                const newChildren = [...childrenToAdd];
                                newChildren[index].status = val as any;
                                setChildrenToAdd(newChildren);
                              }}
                            >
                              <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="Ativa">Ativa</SelectItem>
                                <SelectItem value="Inativa">Inativa</SelectItem>
                                <SelectItem value="Visitante">Visitante</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Dados dos Responsáveis</h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => setGuardians([...guardians, { name: '', phone: '', leader: '', relation: 'Pai/Mãe', photoUrl: '' }])}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Responsável
                      </Button>
                    </div>
                    
                    <div className="space-y-8">
                      {guardians.map((guardian, index) => (
                        <div key={index} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 relative group">
                          <div className="flex flex-col md:flex-row gap-6 mb-6">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center relative group/photo">
                                {guardian.photoUrl ? (
                                  <img src={guardian.photoUrl} alt="Foto do responsável" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <ShieldCheck className="w-10 h-10 text-slate-300" />
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer">
                                  <Upload className="w-6 h-6 text-white" />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const url = await handleFileUpload(file, 'parents');
                                        const newGuardians = [...guardians];
                                        newGuardians[index].photoUrl = url;
                                        setGuardians(newGuardians);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foto do Responsável</span>
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome do Responsável {guardians.length > 1 ? index + 1 : ''}</Label>
                                <Input 
                                  value={guardian.name}
                                  onChange={(e) => {
                                    const newGuardians = [...guardians];
                                    newGuardians[index].name = e.target.value;
                                    setGuardians(newGuardians);
                                  }}
                                  required 
                                  placeholder="Nome completo" 
                                  className="h-12 rounded-xl border-slate-200 bg-white focus:ring-primary" 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">WhatsApp</Label>
                                <Input 
                                  value={guardian.phone}
                                  onChange={(e) => {
                                    const newGuardians = [...guardians];
                                    newGuardians[index].phone = e.target.value;
                                    setGuardians(newGuardians);
                                  }}
                                  required 
                                  placeholder="(00) 00000-0000" 
                                  className="h-12 rounded-xl border-slate-200 bg-white focus:ring-primary" 
                                />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Líder do Responsável</Label>
                              <Input 
                                value={guardian.leader}
                                onChange={(e) => {
                                  const newGuardians = [...guardians];
                                  newGuardians[index].leader = e.target.value;
                                  setGuardians(newGuardians);
                                }}
                                placeholder="Nome do líder" 
                                className="h-12 rounded-xl border-slate-200 bg-white focus:ring-primary" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Parentesco</Label>
                              <Select 
                                value={guardian.relation}
                                onValueChange={(val) => {
                                  const newGuardians = [...guardians];
                                  newGuardians[index].relation = val;
                                  setGuardians(newGuardians);
                                }}
                              >
                                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="Pai/Mãe">Pai/Mãe</SelectItem>
                                  <SelectItem value="Avô/Avó">Avô/Avó</SelectItem>
                                  <SelectItem value="Tio/Tia">Tio/Tia</SelectItem>
                                  <SelectItem value="Outro">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsChildDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-400">Cancelar</Button>
                  <Button type="submit" className="flex-[2] h-12 rounded-xl aljava-gradient shadow-lg shadow-primary/20 text-lg font-bold">Salvar Cadastro</Button>
                </div>
              </form>
            </>
          )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" richColors />

      {/* Edit Volunteer Dialog */}
      <Dialog open={isEditVolunteerDialogOpen} onOpenChange={setIsEditVolunteerDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <ScrollArea className="max-h-[90vh]">
            <div className="bg-primary p-8 text-white relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">Editar Voluntário</DialogTitle>
                <CardDescription className="text-white/70">Atualize os dados do voluntário</CardDescription>
              </DialogHeader>
            </div>
            {editingVolunteer && (
              <form onSubmit={updateVolunteer} className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-volName" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome Completo</Label>
                  <Input id="edit-volName" name="name" defaultValue={editingVolunteer.name} required className="h-12 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-volPhone" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">WhatsApp</Label>
                  <Input id="edit-volPhone" name="phone" defaultValue={editingVolunteer.phone} required className="h-12 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-volBirth" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nascimento</Label>
                  <Input id="edit-volBirth" name="birthDate" defaultValue={editingVolunteer.birthDate} className="h-12 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-volRole" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Função</Label>
                  <Select name="role" defaultValue={editingVolunteer.role}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Ministro">Ministro</SelectItem>
                      <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                      <SelectItem value="Coordenador">Coordenador</SelectItem>
                      <SelectItem value="Louvor">Louvor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-14 text-lg rounded-2xl aljava-gradient shadow-lg shadow-primary/20">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog open={isEditMaterialDialogOpen} onOpenChange={setIsEditMaterialDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <ScrollArea className="max-h-[90vh]">
            <div className="bg-primary p-8 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Editar Material</DialogTitle>
              <CardDescription className="text-white/70">Atualize as informações do estoque</CardDescription>
            </DialogHeader>
          </div>
          {editingMaterial && (
            <form onSubmit={updateMaterial} className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-matName" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome do Material</Label>
                <Input id="edit-matName" name="name" defaultValue={editingMaterial.name} required className="h-12 rounded-xl border-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-matQty" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Quantidade</Label>
                  <Input id="edit-matQty" name="quantity" type="number" defaultValue={editingMaterial.quantity} required className="h-12 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-matMin" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Qtd. Mínima</Label>
                  <Input id="edit-matMin" name="minQuantity" type="number" defaultValue={editingMaterial.minQuantity} required className="h-12 rounded-xl border-slate-200" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-matCat" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Categoria</Label>
                <Select name="category" defaultValue={editingMaterial.category}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Papelaria">Papelaria</SelectItem>
                    <SelectItem value="Brinquedos">Brinquedos</SelectItem>
                    <SelectItem value="Lanches">Lanches</SelectItem>
                    <SelectItem value="Limpeza">Limpeza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-14 text-lg rounded-2xl aljava-gradient shadow-lg shadow-primary/20">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Child Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <ScrollArea className="max-h-[90vh]">
            <div className="bg-primary p-8 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Editar Cadastro</DialogTitle>
              <CardDescription className="text-white/70">Atualize as informações da flecha</CardDescription>
            </DialogHeader>
          </div>
          {editingChild && (
            <form onSubmit={updateChild} className="p-8 space-y-8">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-familyName" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome da Família</Label>
                  <Input 
                    id="edit-familyName" 
                    name="familyName" 
                    defaultValue={editingChild.familyName} 
                    placeholder="Ex: Família Silva" 
                    className="h-12 rounded-xl border-slate-200 bg-white focus:ring-primary" 
                  />
                  <p className="text-[10px] text-slate-400 ml-1 italic">Alterar o nome da família afetará todos os irmãos cadastrados.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center gap-2 mb-4 md:col-span-2">
                  <div className="w-32 h-32 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center relative group/edit-child-photo">
                    {editingChild.photoUrl ? (
                      <img src={editingChild.photoUrl} alt="Foto da criança" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Baby className="w-12 h-12 text-slate-300" />
                    )}
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/edit-child-photo:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="w-8 h-8 text-white" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleFileUpload(file, 'children');
                            setEditingChild({ ...editingChild, photoUrl: url });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foto da Flecha</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome da Criança</Label>
                  <Input id="edit-name" name="name" defaultValue={editingChild.name} required className="h-12 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-birthDate" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nascimento (DD/MM/AAAA)</Label>
                  <Input 
                    id="edit-birthDate" 
                    name="birthDate" 
                    defaultValue={editingChild.birthDate} 
                    required 
                    className="h-12 rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-allergies" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Alergias</Label>
                  <Input id="edit-allergies" name="allergies" defaultValue={editingChild.allergies} className="h-12 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-specialNeeds" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Observações Especiais</Label>
                  <Input id="edit-specialNeeds" name="specialNeeds" defaultValue={editingChild.specialNeeds} className="h-12 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Status</Label>
                  <Select name="status" defaultValue={editingChild.status || 'Ativa'}>
                    <SelectTrigger id="edit-status" className="h-12 rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Ativa">Ativa</SelectItem>
                      <SelectItem value="Inativa">Inativa</SelectItem>
                      <SelectItem value="Visitante">Visitante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl space-y-6 border border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Responsáveis
                  </h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-xl border-primary/20 text-primary hover:bg-primary/5"
                    onClick={() => setEditGuardians([...editGuardians, { id: '', name: '', phone: '', leader: '', relation: 'Pai/Mãe', photoUrl: '' }])}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>

                <div className="space-y-4">
                  {editGuardians.map((guardian, index) => (
                    <div key={index} className="p-4 bg-white rounded-xl border border-slate-200 space-y-4 relative">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center relative group/edit-photo">
                            {guardian.photoUrl ? (
                              <img src={guardian.photoUrl} alt="Foto" className="w-16 h-16 object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <ShieldCheck className="w-6 h-6 text-slate-300" />
                            )}
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/edit-photo:opacity-100 transition-opacity cursor-pointer">
                              <Upload className="w-4 h-4 text-white" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = await handleFileUpload(file, 'parents');
                                    const newGuardians = [...editGuardians];
                                    newGuardians[index].photoUrl = url;
                                    setEditGuardians(newGuardians);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nome</Label>
                            <Input 
                              value={guardian.name}
                              onChange={(e) => {
                                const newGuardians = [...editGuardians];
                                newGuardians[index].name = e.target.value;
                                setEditGuardians(newGuardians);
                              }}
                              required 
                              className="h-10 rounded-lg border-slate-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Telefone</Label>
                            <Input 
                              value={guardian.phone}
                              onChange={(e) => {
                                const newGuardians = [...editGuardians];
                                newGuardians[index].phone = e.target.value;
                                setEditGuardians(newGuardians);
                              }}
                              required 
                              className="h-10 rounded-lg border-slate-200"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nome</Label>
                          <Input 
                            value={guardian.name}
                            onChange={(e) => {
                              const newGuardians = [...editGuardians];
                              newGuardians[index].name = e.target.value;
                              setEditGuardians(newGuardians);
                            }}
                            required 
                            className="h-10 rounded-lg border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Telefone</Label>
                          <Input 
                            value={guardian.phone}
                            onChange={(e) => {
                              const newGuardians = [...editGuardians];
                              newGuardians[index].phone = e.target.value;
                              setEditGuardians(newGuardians);
                            }}
                            required 
                            className="h-10 rounded-lg border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Líder</Label>
                          <Input 
                            value={guardian.leader}
                            onChange={(e) => {
                              const newGuardians = [...editGuardians];
                              newGuardians[index].leader = e.target.value;
                              setEditGuardians(newGuardians);
                            }}
                            className="h-10 rounded-lg border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Parentesco</Label>
                          <Select 
                            value={guardian.relation}
                            onValueChange={(val) => {
                              const newGuardians = [...editGuardians];
                              newGuardians[index].relation = val;
                              setEditGuardians(newGuardians);
                            }}
                          >
                            <SelectTrigger className="h-10 rounded-lg border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pai/Mãe">Pai/Mãe</SelectItem>
                              <SelectItem value="Avô/Avó">Avô/Avó</SelectItem>
                              <SelectItem value="Tio/Tia">Tio/Tia</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-14 text-lg rounded-2xl aljava-gradient shadow-lg shadow-primary/20">Atualizar Cadastro</Button>
              </DialogFooter>
            </form>
          )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
