/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Clock,
  Sparkles,
  Activity,
  Smile,
  Layers,
  Flame,
  Heart,
  Award,
  Lock,
  LogOut,
  Users,
  CheckCircle2,
  Download,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  User,
  ShieldAlert,
  ListFilter,
  Search,
  Check,
  TrendingUp,
  Plus,
  Trash2,
  Printer,
} from 'lucide-react';
import {
  listenToAuth,
  loginWithGoogle,
  loginWithCredentials,
  logout,
  submitVote,
  getAdminStats,
  resetVoting,
  participantes,
  CATEGORIES,
  AppUser,
  AdminStats,
  isSimulated,
  getParticipantes,
  addParticipant,
  deleteParticipant
} from './services/firebase';

// Simple animation delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingSubmitting, setVotingSubmitting] = useState(false);
  
  // Voting state: mapping of question ID to selected participant name
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [votedSuccess, setVotedSuccess] = useState(false);

  // Admin state
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sign In Simulation modal state
  const [showSimModal, setShowSimModal] = useState(false);
  const [simName, setSimName] = useState("");
  const [simEmail, setSimEmail] = useState("");

  // Login Tabs and Credentials state
  const [loginTab, setLoginTab] = useState<'brincante' | 'admin'>('brincante');
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Dynamic participants list state
  const [dynamicParticipantes, setDynamicParticipantes] = useState<string[]>(participantes);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [participantError, setParticipantError] = useState<string | null>(null);
  const [participantLoading, setParticipantLoading] = useState(false);

  // Certificate generation state
  const [selectedCertData, setSelectedCertData] = useState<{ question: string; winnerName: string; votes: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch participants
  const fetchParticipantes = async () => {
    try {
      const list = await getParticipantes();
      setDynamicParticipantes(list);
    } catch (err) {
      console.error("Erro ao carregar brincantes:", err);
    }
  };

  useEffect(() => {
    fetchParticipantes();
  }, []);

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = listenToAuth((currUser) => {
      setUser(currUser);
      setLoading(false);
      
      // If user has already voted, set success message
      if (currUser?.votou) {
        setVotedSuccess(true);
      } else {
        setVotedSuccess(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch admin stats when admin view is toggled on or updated
  const fetchStats = async () => {
    if (!user?.isAdmin) return;
    setAdminLoading(true);
    try {
      const stats = await getAdminStats();
      setAdminStats(stats);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminView && user?.isAdmin) {
      fetchStats();
    }
  }, [isAdminView, user]);

  // Redraw certificate whenever selectedCertData changes
  useEffect(() => {
    if (selectedCertData) {
      const timer = setTimeout(() => {
        drawCertificate(selectedCertData.question, selectedCertData.winnerName, selectedCertData.votes);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedCertData]);

  // Draw certificate helper using HTML5 Canvas Rendering API
  const drawCertificate = (question: string, winnerName: string, votes: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res canvas sizes (2x scaling for crisp, professional image export)
    const scale = 2;
    const baseWidth = 800;
    const baseHeight = 560;
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    ctx.scale(scale, scale);

    // 1. Draw rich festive gradient background
    const gradient = ctx.createRadialGradient(
      baseWidth / 2, baseHeight / 2, 40,
      baseWidth / 2, baseHeight / 2, baseWidth / 1.2
    );
    gradient.addColorStop(0, '#1c1409'); // warm rich golden-brown core
    gradient.addColorStop(1, '#060606'); // deep charcoal night
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // 2. Draw dual gold framing borders
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, baseWidth - 40, baseHeight - 40);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, baseWidth - 52, baseHeight - 52);

    // Ornamented corner dots
    const drawCornerOrnament = (cx: number, cy: number, r: number) => {
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    };
    drawCornerOrnament(35, 35, 7);
    drawCornerOrnament(baseWidth - 35, 35, 7);
    drawCornerOrnament(35, baseHeight - 35, 7);
    drawCornerOrnament(baseWidth - 35, baseHeight - 35, 7);

    // 3. Draw typical São João "Bandeirinhas" (Festa Junina flags at the top)
    const flagColors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#F97316', '#8B5CF6'];
    const flagY = 42;
    const flagWidth = 14;
    const flagHeight = 22;
    const flagGap = 10;
    const totalFlags = 20;
    const startX = (baseWidth - (totalFlags * (flagWidth + flagGap) - flagGap)) / 2;

    // String hanging line
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(startX - 20, flagY);
    ctx.bezierCurveTo(startX + 100, flagY + 12, startX + baseWidth - 200, flagY + 12, startX + (totalFlags * (flagWidth + flagGap)) + 20, flagY);
    ctx.stroke();

    for (let i = 0; i < totalFlags; i++) {
      const fx = startX + i * (flagWidth + flagGap);
      const fy = flagY + Math.sin(i * 0.4) * 4; // wavy hanging effect
      
      ctx.fillStyle = flagColors[i % flagColors.length];
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + flagWidth, fy);
      ctx.lineTo(fx + flagWidth, fy + flagHeight);
      ctx.lineTo(fx + flagWidth / 2, fy + flagHeight - 5); // fork tail
      ctx.lineTo(fx, fy + flagHeight);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Render Certificate Trophy Seal
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    const cxCircle = baseWidth / 2;
    const cyCircle = 135;
    ctx.arc(cxCircle, cyCircle, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.fill();

    ctx.fillStyle = '#D4AF37';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', cxCircle, cyCircle - 1);

    // 5. Typography and Text details
    ctx.fillStyle = '#A1A1AA';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('PRÊMIO DA QUADRILHA JUNINA 2026', baseWidth / 2, 185);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold italic 22px Georgia, serif';
    ctx.fillText('CERTIFICADO DE DESTAQUE', baseWidth / 2, 218);

    ctx.fillStyle = '#E4E4E7';
    ctx.font = 'normal 13px sans-serif';
    ctx.fillText('A diretoria confere com honra e orgulho este título especial na categoria', baseWidth / 2, 265);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold italic 18px Georgia, serif';
    ctx.fillText(`"${question.toUpperCase()}"`, baseWidth / 2, 295);

    ctx.fillStyle = '#E4E4E7';
    ctx.font = 'normal 13px sans-serif';
    ctx.fillText('ao(à) brilhante e exemplar brincante', baseWidth / 2, 335);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold italic 36px Georgia, serif';
    ctx.fillText(winnerName, baseWidth / 2, 382);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(baseWidth / 2 - 140, 405);
    ctx.lineTo(baseWidth / 2 + 140, 405);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'normal 11px sans-serif';
    ctx.fillText(
      `Eleito(a) democraticamente em votação secreta realizada por toda a corporação de brincantes,`,
      baseWidth / 2,
      435
    );
    ctx.fillText(
      `como destaque máximo desta temporada com a expressiva marca de ${votes} ${votes === 1 ? 'voto' : 'votos'}.`,
      baseWidth / 2,
      455
    );

    // 6. Signatures
    const sigY = 512;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(110, sigY);
    ctx.lineTo(270, sigY);
    ctx.stroke();
    
    ctx.fillStyle = '#A1A1AA';
    ctx.font = '9px sans-serif';
    ctx.fillText('DIRETORIA DE APURAÇÃO', 190, sigY + 14);

    // Seal
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.beginPath();
    ctx.arc(baseWidth / 2, sigY - 12, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('SELO', baseWidth / 2, sigY - 18);
    ctx.fillText('OFICIAL', baseWidth / 2, sigY - 9);
    ctx.fillText('2026', baseWidth / 2, sigY);

    // Right
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(baseWidth - 270, sigY);
    ctx.lineTo(baseWidth - 110, sigY);
    ctx.stroke();

    ctx.fillStyle = '#A1A1AA';
    ctx.font = '9px sans-serif';
    ctx.fillText('PRESIDÊNCIA DA QUADRILHA', baseWidth - 190, sigY + 14);
  };

  const handleDownloadCert = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedCertData) return;
    const link = document.createElement('a');
    const sanitizedName = selectedCertData.winnerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const sanitizedQuestion = selectedCertData.question.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `Certificado_Destaque_${sanitizedName}_${sanitizedQuestion}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrintCert = () => {
    if (!selectedCertData) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor, habilite popups para imprimir o certificado.");
      return;
    }

    const { question, winnerName, votes } = selectedCertData;

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificado - ${winnerName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Georgia:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;600;800&display=swap');
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #0d0d0d;
              color: #ffffff;
              font-family: 'Inter', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              overflow: hidden;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .certificate-container {
              width: 297mm;
              height: 210mm;
              box-sizing: border-box;
              background: radial-gradient(circle, #1a140a 0%, #050505 100%);
              border: 10px solid #D4AF37;
              padding: 30px;
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              box-shadow: inset 0 0 40px rgba(0, 0, 0, 1);
            }
            .inner-border {
              position: absolute;
              top: 15px;
              bottom: 15px;
              left: 15px;
              right: 15px;
              border: 2px solid #D4AF37;
              pointer-events: none;
              opacity: 0.85;
            }
            .corner {
              position: absolute;
              width: 16px;
              height: 16px;
              border: 3px solid #D4AF37;
              border-radius: 50%;
              background: #000;
            }
            .top-left { top: 22px; left: 22px; }
            .top-right { top: 22px; right: 22px; }
            .bottom-left { bottom: 22px; left: 22px; }
            .bottom-right { bottom: 22px; right: 22px; }

            .flags-container {
              display: flex;
              gap: 8px;
              justify-content: center;
              width: 100%;
              margin-top: 10px;
            }
            .flag {
              width: 14px;
              height: 22px;
              clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%);
            }
            .flag:nth-child(1) { background-color: #EF4444; }
            .flag:nth-child(2) { background-color: #F59E0B; }
            .flag:nth-child(3) { background-color: #3B82F6; }
            .flag:nth-child(4) { background-color: #10B981; }
            .flag:nth-child(5) { background-color: #F97316; }
            .flag:nth-child(6) { background-color: #8B5CF6; }

            .trophy {
              font-size: 32px;
              margin-top: 15px;
            }
            .subtitle {
              color: #a1a1aa;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 5px;
              margin-top: 10px;
            }
            .main-title {
              color: #D4AF37;
              font-family: 'Georgia', serif;
              font-size: 30px;
              font-style: italic;
              font-weight: 700;
              margin: 10px 0 0 0;
              text-shadow: 0 4px 10px rgba(212, 175, 55, 0.3);
            }
            .desc-1 {
              color: #e4e4e7;
              font-size: 14px;
              margin-top: 25px;
              max-width: 80%;
              text-align: center;
            }
            .category-text {
              color: #ffffff;
              font-family: 'Georgia', serif;
              font-size: 20px;
              font-weight: 700;
              font-style: italic;
              margin: 8px 0;
            }
            .winner-name {
              color: #D4AF37;
              font-family: 'Georgia', serif;
              font-size: 42px;
              font-weight: 700;
              font-style: italic;
              margin: 20px 0 10px 0;
              text-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
            }
            .gold-line {
              width: 320px;
              height: 2px;
              background-color: #D4AF37;
              margin-bottom: 25px;
            }
            .desc-2 {
              color: #94a3b8;
              font-size: 12px;
              max-width: 80%;
              text-align: center;
              line-height: 1.6;
            }
            .signatures-container {
              display: flex;
              justify-content: space-between;
              width: 85%;
              margin-bottom: 30px;
              align-items: flex-end;
            }
            .sig-box {
              text-align: center;
              width: 250px;
            }
            .sig-line {
              border-top: 1px solid rgba(255, 255, 255, 0.25);
              margin-bottom: 8px;
            }
            .sig-title {
              color: #a1a1aa;
              font-size: 9px;
              font-weight: 600;
              letter-spacing: 1px;
            }
            .seal-box {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 55px;
              height: 55px;
              border-radius: 50%;
              border: 2px solid #D4AF37;
              background: rgba(212, 175, 55, 0.15);
              color: #D4AF37;
              font-size: 8px;
              font-weight: 800;
              line-height: 1.1;
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="inner-border"></div>
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>

            <div class="flags-container">
              <div class="flag"></div><div class="flag"></div><div class="flag"></div><div class="flag"></div><div class="flag"></div>
              <div class="flag"></div><div class="flag"></div><div class="flag"></div><div class="flag"></div><div class="flag"></div>
              <div class="flag"></div><div class="flag"></div><div class="flag"></div><div class="flag"></div><div class="flag"></div>
              <div class="flag"></div><div class="flag"></div><div class="flag"></div><div class="flag"></div><div class="flag"></div>
            </div>

            <div class="trophy">🏆</div>
            <div class="subtitle">PRÊMIO DA QUADRILHA JUNINA 2026</div>
            <div class="main-title">Certificado de Destaque Oficial</div>

            <div class="desc-1">
              A diretoria confere com honra e orgulho este título especial na categoria
              <div class="category-text">"\${question.toUpperCase()}"</div>
              ao(à) brilhante e exemplar brincante
            </div>

            <div class="winner-name">\${winnerName}</div>
            <div class="gold-line"></div>

            <div class="desc-2">
              Eleito(a) democraticamente em votação secreta realizada por toda a corporação de brincantes, <br />
              como destaque máximo desta temporada com a expressiva marca de \${votes} \${votes === 1 ? 'voto' : 'votos'}.
            </div>

            <div class="signatures-container">
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-title">DIRETORIA DE APURAÇÃO</div>
              </div>
              <div class="seal-box">
                <div>SELO</div>
                <div>OFICIAL</div>
                <div style="font-size: 7px; opacity: 0.8;">2026</div>
              </div>
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-title">PRESIDÊNCIA DA QUADRILHA</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle standard google login
  const handleLogin = async () => {
    if (isSimulated()) {
      // In preview sandbox, open mock modal so they can test easily
      setShowSimModal(true);
    } else {
      setLoading(true);
      try {
        await loginWithGoogle();
      } catch (error) {
        console.error("Erro ao autenticar com Google:", error);
        alert("Ocorreu um erro ao fazer login. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Simulated login execution
  const handleSimulatedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim() || !simEmail.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle({ nome: simName, email: simEmail });
      setShowSimModal(false);
      // Reset inputs
      setSimName("");
      setSimEmail("");
    } catch (error) {
      console.error("Erro no login simulado:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle direct custom admin credentials login
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsernameInput.trim() || !adminPasswordInput.trim()) {
      setAdminLoginError("Por favor, preencha o usuário e a senha.");
      return;
    }
    setAdminLoginError(null);
    setLoading(true);
    try {
      await loginWithCredentials(adminUsernameInput, adminPasswordInput);
      // Automatically redirect to admin view after successful admin login
      setIsAdminView(true);
    } catch (error: any) {
      console.error("Erro ao autenticar administrador:", error);
      setAdminLoginError(error.message || "Usuário ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to quickly login as a default admin
  const loginAsDefaultAdmin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle({
        nome: "Diretoria da Quadrilha",
        email: "ofsillvadigital@gmail.com"
      });
      setShowSimModal(false);
    } catch (error) {
      console.error("Erro login admin:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setIsAdminView(false);
    setVotes({});
    setCurrentCategoryIndex(0);
    setVotedSuccess(false);
  };

  // Handle field selection in voting form
  const handleVoteSelect = (questionId: string, participant: string) => {
    setVotes(prev => ({
      ...prev,
      [questionId]: participant
    }));
    setValidationError(null);
  };

  // Verify if current category questions are fully answered
  const isCategoryComplete = (catIndex: number) => {
    const category = CATEGORIES[catIndex];
    return category.questions.every(q => votes[q.id] && votes[q.id] !== "");
  };

  // Go to next category or submit
  const handleNextCategory = () => {
    if (!isCategoryComplete(currentCategoryIndex)) {
      setValidationError("Por favor, responda a todas as perguntas desta categoria antes de continuar.");
      return;
    }
    
    setValidationError(null);
    if (currentCategoryIndex < CATEGORIES.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };

  // Go to previous category
  const handlePrevCategory = () => {
    setValidationError(null);
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  // Validate entire vote form and submit
  const handleSubmitVotes = async () => {
    // Ensure user exists
    if (!user) return;

    // Validate ALL questions
    let incomplete = false;
    for (let i = 0; i < CATEGORIES.length; i++) {
      if (!isCategoryComplete(i)) {
        setCurrentCategoryIndex(i);
        setValidationError(`Por favor, responda a todas as perguntas da categoria "${CATEGORIES[i].title}".`);
        incomplete = true;
        break;
      }
    }

    if (incomplete) return;

    setVotingSubmitting(true);
    try {
      await submitVote(user.uid, votes);
      setVotedSuccess(true);
    } catch (error) {
      console.error("Erro ao registrar voto:", error);
      alert("Ocorreu um erro ao salvar o seu voto. Tente novamente.");
    } finally {
      setVotingSubmitting(false);
    }
  };

  // Reset entire voting (admin operation)
  const handleResetVoting = async () => {
    setAdminLoading(true);
    try {
      await resetVoting();
      setShowResetConfirm(false);
      await fetchStats();
      alert("Toda a votação foi resetada com sucesso!");
    } catch (error) {
      console.error("Erro ao resetar votação:", error);
      alert("Ocorreu um erro ao resetar a votação.");
    } finally {
      setAdminLoading(false);
    }
  };

  // Add a new participant (admin operation)
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantName.trim()) return;
    setParticipantLoading(true);
    setParticipantError(null);
    try {
      const updated = await addParticipant(newParticipantName);
      setDynamicParticipantes(updated);
      setNewParticipantName('');
    } catch (err: any) {
      setParticipantError(err.message || "Erro ao adicionar brincante.");
    } finally {
      setParticipantLoading(false);
    }
  };

  // Delete a participant (admin operation)
  const handleDeleteParticipant = async (name: string) => {
    setParticipantLoading(true);
    setParticipantError(null);
    try {
      const updated = await deleteParticipant(name);
      setDynamicParticipantes(updated);
    } catch (err: any) {
      setParticipantError(err.message || "Erro ao remover brincante.");
    } finally {
      setParticipantLoading(false);
    }
  };

  // Export Results to CSV
  const handleExportCSV = () => {
    if (!adminStats) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += "Categoria,Pergunta,Vencedor,Votos,Porcentagem\n";

    CATEGORIES.forEach(cat => {
      cat.questions.forEach(q => {
        const ranking = adminStats.questionResults[q.id] || [];
        const top = ranking[0];
        const winnerName = top ? top.name : "Nenhum voto";
        const winnerVotes = top ? top.votes : 0;
        const winnerPercent = top ? `${top.percentage}%` : "0%";

        // Clean values for CSV safety
        const cleanCat = cat.title.replace(/"/g, '""');
        const cleanLabel = q.label.replace(/"/g, '""');
        const cleanWinner = winnerName.replace(/"/g, '""');

        csvContent += `"${cleanCat}","${cleanLabel}","${cleanWinner}",${winnerVotes},"${winnerPercent}"\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Premios_Da_Quadrilha_Resultados.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to render Category Icons dynamically
  const renderCategoryIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case "Clock": return <Clock className={className} />;
      case "Sparkles": return <Sparkles className={className} />;
      case "Activity": return <Activity className={className} />;
      case "Smile": return <Smile className={className} />;
      case "Layers": return <Layers className={className} />;
      case "Flame": return <Flame className={className} />;
      case "Heart": return <Heart className={className} />;
      case "Award": return <Award className={className} />;
      default: return <Trophy className={className} />;
    }
  };

  // Calculate overall percentage of completion for the voter progress bar
  const getCompletionPercentage = () => {
    let answered = 0;
    let total = 0;
    CATEGORIES.forEach(cat => {
      cat.questions.forEach(q => {
        total++;
        if (votes[q.id]) answered++;
      });
    });
    return Math.round((answered / total) * 100);
  };

  if (loading) {
    return (
      <div id="loading-screen" className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <Trophy className="w-16 h-16 text-amber-500 animate-bounce mb-4" />
        <p className="text-zinc-400 font-medium tracking-wide">Carregando Prêmio da Quadrilha...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-[#D4AF37] selection:text-neutral-950 pb-16">
      {/* HEADER BAR */}
      <header className="border-b border-[#D4AF37]/30 bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-30 px-6 sm:px-8 py-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 flex items-center justify-center rounded-full gold-gradient shadow-lg">
              <Trophy className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase gold-text font-serif italic flex items-center gap-2">
                Prêmio da Quadrilha
                <span className="text-xs font-sans tracking-[0.2em] font-normal opacity-70 italic text-white hidden sm:inline">
                  Apuração 2026
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-3 bg-[#1A1A1A] px-4 py-2 rounded-full border border-[#D4AF37]/20">
                  <img src={user.foto} alt={user.nome} className="w-7 h-7 rounded-full border border-[#D4AF37]/40" />
                  <span className="text-xs font-semibold text-zinc-200 max-w-[120px] truncate">{user.nome}</span>
                </div>

                {user.isAdmin && (
                  <button
                    id="admin-toggle-btn"
                    onClick={() => setIsAdminView(!isAdminView)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition ${
                      isAdminView
                        ? 'gold-gradient text-neutral-950 shadow-lg shadow-amber-500/15'
                        : 'bg-[#1A1A1A] hover:bg-zinc-800 text-[#D4AF37] border border-[#D4AF37]/30'
                    }`}
                  >
                    {isAdminView ? <Award className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {isAdminView ? 'Votação' : 'Painel Admin'}
                  </button>
                )}

                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  title="Sair"
                  className="px-3 py-2 text-red-400 hover:text-red-300 bg-red-950/20 rounded-lg border border-red-900/40 hover:bg-red-900/30 transition text-xs font-bold uppercase"
                >
                  Sair
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* LANDING PAGE (NOT AUTHENTICATED) */}
        {!user && (
          <div id="landing-view" className="flex flex-col items-center justify-center text-center mt-12 sm:mt-20 max-w-xl mx-auto">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#D4AF37]/10 blur-3xl rounded-full scale-110"></div>
              <div className="relative bg-[#1A1A1A] border border-[#D4AF37]/30 p-6 rounded-2xl shadow-2xl">
                <Trophy className="w-16 h-16 text-[#D4AF37] mx-auto drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)] animate-pulse" />
              </div>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight gold-text font-serif italic mb-3">
              🏆 Prêmio da Quadrilha
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mb-8 leading-relaxed max-w-md">
              Vote nos brincantes que mais se destacaram durante toda a temporada. A votação é apenas uma vez.
            </p>

            <div className="w-full bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-2xl p-6 mb-8 text-left shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-3 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> REGRAS DA VOTAÇÃO
              </h3>
              <ul className="text-xs sm:text-sm text-zinc-300 space-y-3">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D4AF37] font-bold">•</span>
                  <span>Apenas integrantes oficiais cadastrados podem votar.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D4AF37] font-bold">•</span>
                  <span>Cada brincante tem direito a registrar seu voto **apenas uma única vez**.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D4AF37] font-bold">•</span>
                  <span>Todos os quesitos de todas as categorias são obrigatórios.</span>
                </li>
              </ul>
            </div>

            {/* TABS DE ENTRADA / LOGIN */}
            <div className="w-full bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-2xl overflow-hidden shadow-2xl p-6 mt-4">
              <div className="flex border-b border-zinc-800 pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => { setLoginTab('brincante'); setAdminLoginError(null); }}
                  className={`flex-1 text-center pb-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 ${
                    loginTab === 'brincante'
                      ? 'border-[#D4AF37] text-[#D4AF37]'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  🎭 Brincante (Votar)
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginTab('admin'); setAdminLoginError(null); }}
                  className={`flex-1 text-center pb-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 ${
                    loginTab === 'admin'
                      ? 'border-[#D4AF37] text-[#D4AF37]'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  👑 Administração
                </button>
              </div>

              {loginTab === 'brincante' ? (
                <div className="space-y-4">
                  {/* Iframe Detection Notice */}
                  {(() => {
                    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
                    if (inIframe) {
                      return (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl text-xs space-y-2.5 text-left leading-relaxed">
                          <p className="font-semibold flex items-center gap-1.5 text-amber-400">
                            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                            Atenção: Modo de Pré-visualização (Iframe)
                          </p>
                          <p>
                            Os navegadores modernos impedem o login do Google dentro de painéis embutidos (iframes) devido a políticas de segurança de cookies de terceiros.
                          </p>
                          <p className="font-medium text-white">
                            Para fazer login e registrar seus votos com sucesso, por favor abra a votação em uma nova aba do seu navegador clicando no botão abaixo:
                          </p>
                          <a
                            href={typeof window !== 'undefined' ? window.location.href : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#D4AF37] hover:bg-[#F3C63F] text-neutral-950 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg transition-all transform hover:-translate-y-0.5 mt-2 text-center"
                          >
                            🌐 Abrir Votação em Nova Aba
                          </a>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <p className="text-zinc-400 text-xs mb-4 text-center">
                    Entre com sua conta Google para registrar seus votos. Seus dados de perfil serão salvos de forma segura.
                  </p>
                  
                  <button
                    id="login-google-btn"
                    onClick={handleLogin}
                    className="flex items-center justify-center gap-3 w-full px-6 py-3.5 gold-gradient text-neutral-950 rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Entrar com o Google</span>
                  </button>

                  <div className="text-center mt-2">
                    <p className="text-[10px] text-zinc-500">
                      Problemas com o login? Certifique-se de que os pop-ups estão permitidos ou tente abrir em nova aba.
                    </p>
                  </div>

                  {isSimulated() && (
                    <p className="text-[10px] text-[#D4AF37]/80 font-mono mt-4 text-center">
                      💡 Sandbox: O login Google simula novos brincantes para testar múltiplos votos!
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCredentialLogin} className="space-y-4 text-left">
                  <p className="text-zinc-400 text-xs mb-2 text-center">
                    Acesse o painel de apuração usando usuário e senha do administrador.
                  </p>

                  {adminLoginError && (
                    <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{adminLoginError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Usuário</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Admin"
                      value={adminUsernameInput}
                      onChange={(e) => setAdminUsernameInput(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Senha</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 mt-2 gold-gradient text-neutral-950 rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl transition-all transform hover:-translate-y-0.5"
                  >
                    Entrar como Administrador
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ALREADY VOTED PAGE (SUCCESS CONFIRMATION) */}
        {user && votedSuccess && !isAdminView && (
          <div id="success-view" className="bg-[#1A1A1A] border border-[#D4AF37]/25 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-2xl">
            <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/35 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-9 h-9 text-[#D4AF37]" />
            </div>

            <h2 className="text-2xl font-bold font-serif italic gold-text mb-2">
              Seu voto foi registrado com sucesso.
            </h2>
            <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
              Muito obrigado pela sua participação! Sua resposta foi gravada no Firestore com segurança usando seu UID e sua conta foi marcada para evitar duplicidade.
            </p>

            <div className="bg-[#0A0A0A]/60 rounded-xl p-5 border border-zinc-800/80 text-left text-xs mb-8 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">ID do Usuário:</span>
                <span className="font-mono text-zinc-300">{user.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Nome:</span>
                <span className="text-zinc-200 font-semibold">{user.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status de Votação:</span>
                <span className="text-[#D4AF37] font-bold uppercase tracking-widest text-[10px]">Confirmado</span>
              </div>
              {user.dataVoto && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Data de Envio:</span>
                  <span className="text-zinc-300">{new Date(user.dataVoto).toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>

            {user.isAdmin && (
              <button
                id="view-results-btn"
                onClick={() => setIsAdminView(true)}
                className="w-full gold-gradient hover:opacity-90 text-neutral-950 font-bold py-3.5 rounded-xl transition shadow-lg shadow-amber-500/10 uppercase tracking-wider text-xs"
              >
                Acessar Painel de Resultados
              </button>
            )}

            {!user.isAdmin && (
              <div className="text-zinc-500 text-xs italic">
                Aguarde o encerramento do período de votação pela diretoria para ver os resultados oficiais.
              </div>
            )}
          </div>
        )}

        {/* ACTIVE VOTING FORM (LOGGED IN & NOT VOTED YET) */}
        {user && !votedSuccess && !isAdminView && (
          <div id="voting-form-view" className="space-y-6">
            
            {/* PROGRESS AND INSTRUCTIONS */}
            <div className="bg-[#1A1A1A] border border-zinc-800/60 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Progresso da Votação</span>
                  <span className="text-xs text-zinc-400">({Object.keys(votes).length} de 28 respondidos)</span>
                </div>
                <span className="text-sm font-bold text-[#D4AF37] font-mono">{getCompletionPercentage()}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#0A0A0A] h-2 rounded-full overflow-hidden">
                <div
                  className="gold-gradient h-full rounded-full transition-all duration-300"
                  style={{ width: `${getCompletionPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* CATEGORY TABS SELECTOR (HORIZONTAL SCROLLABLE ON MOBILE) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800/80">
              {CATEGORIES.map((cat, idx) => {
                const isCurrent = idx === currentCategoryIndex;
                const isDone = cat.questions.every(q => votes[q.id]);
                return (
                  <button
                    key={cat.title}
                    id={`tab-btn-${idx}`}
                    onClick={() => {
                      setValidationError(null);
                      setCurrentCategoryIndex(idx);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition shrink-0 border ${
                      isCurrent
                        ? 'gold-gradient text-neutral-950 border-[#D4AF37] shadow-md shadow-amber-500/15'
                        : isDone
                        ? 'bg-[#1A1A1A] text-emerald-500 border-emerald-500/20'
                        : 'bg-[#1A1A1A]/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                    }`}
                  >
                    {renderCategoryIcon(cat.icon, "w-4 h-4")}
                    <span>{cat.title}</span>
                    {isDone && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* CURRENT ACTIVE CATEGORY CARD */}
            <div className="bg-[#1A1A1A] border border-[#D4AF37]/15 rounded-2xl shadow-xl overflow-hidden">
              
              {/* Card Header */}
              <div className="bg-[#1A1A1A] p-6 border-b border-zinc-800/80 flex items-center gap-3">
                <div className="p-2.5 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37] border border-[#D4AF37]/20">
                  {renderCategoryIcon(CATEGORIES[currentCategoryIndex].icon, "w-6 h-6")}
                </div>
                <div>
                  <span className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest">Categoria {currentCategoryIndex + 1} de {CATEGORIES.length}</span>
                  <h3 className="text-xl font-bold text-white font-serif italic tracking-wide">{CATEGORIES[currentCategoryIndex].title}</h3>
                </div>
              </div>

              {/* Questions Container */}
              <div className="p-6 space-y-6">
                {CATEGORIES[currentCategoryIndex].questions.map((q) => (
                  <div key={q.id} className="space-y-2.5">
                    <label htmlFor={`select-${q.id}`} className="block text-sm font-semibold text-zinc-200 leading-relaxed">
                      {q.label} <span className="text-[#D4AF37]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id={`select-${q.id}`}
                        value={votes[q.id] || ""}
                        onChange={(e) => handleVoteSelect(q.id, e.target.value)}
                        required
                        className={`w-full bg-[#0A0A0A] text-white rounded-xl py-3.5 px-4 pr-10 border transition duration-150 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] appearance-none ${
                          votes[q.id] ? 'border-[#D4AF37]/60 text-white' : 'border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <option value="" disabled>--- Selecione um brincante ---</option>
                        {dynamicParticipantes.map((name) => (
                          <option key={name} value={name} className="bg-[#0A0A0A] text-white">
                            {name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none text-zinc-500">
                        <ChevronRight className="w-4 h-4 transform rotate-90" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error messages if any */}
              {validationError && (
                <div className="mx-6 mb-4 p-4 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Navigation Action Buttons inside Card */}
              <div className="bg-[#1A1A1A]/60 p-6 border-t border-zinc-800 flex items-center justify-between">
                <button
                  id="prev-btn"
                  onClick={handlePrevCategory}
                  disabled={currentCategoryIndex === 0}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition ${
                    currentCategoryIndex === 0
                      ? 'text-zinc-600 cursor-not-allowed bg-transparent'
                      : 'bg-transparent border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/5'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                {currentCategoryIndex < CATEGORIES.length - 1 ? (
                  <button
                    id="next-btn"
                    onClick={handleNextCategory}
                    className="flex items-center gap-2 px-5 py-3 gold-gradient hover:opacity-90 text-neutral-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/5"
                  >
                    <span>Próxima Categoria</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="submit-votes-btn"
                    onClick={handleSubmitVotes}
                    disabled={votingSubmitting}
                    className="flex items-center gap-2 px-6 py-3 gold-gradient hover:opacity-90 text-neutral-950 font-extrabold rounded-xl transition shadow-xl shadow-amber-500/10 disabled:opacity-50"
                  >
                    {votingSubmitting ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>Enviando Voto...</span>
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4" />
                        <span>Enviar Votação</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* PROTECTED ADMIN DASHBOARD */}
        {user && isAdminView && user.isAdmin && (
          <div id="admin-view" className="space-y-6">
            
            {/* Header / Actions bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1A1A1A] border border-[#D4AF37]/20 p-6 rounded-2xl shadow-lg">
              <div>
                <h2 className="text-xl font-bold uppercase gold-text font-serif italic flex items-center gap-2">
                  🏆 Painel de Controle Administrativo
                </h2>
                <p className="text-zinc-400 text-xs">Estatísticas detalhadas e controle de apuração em tempo real</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="export-csv-btn"
                  onClick={handleExportCSV}
                  disabled={!adminStats || adminStats.totalVotes === 0}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-transparent border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar CSV</span>
                </button>

                <button
                  id="reset-voting-trigger"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 rounded-xl text-xs font-bold transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Zerar Votos</span>
                </button>
              </div>
            </div>

            {/* KPI STATS CARDS */}
            {adminStats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Total votes */}
                <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 p-6 rounded-2xl relative overflow-hidden shadow-xl">
                  <div className="absolute right-4 bottom-4 text-[#D4AF37]/5 pointer-events-none">
                    <Trophy className="w-16 h-16" />
                  </div>
                  <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Total de Votos</span>
                  <p className="text-5xl font-light text-white mt-2 mb-2 font-sans tracking-tight">{adminStats.totalVotes}</p>
                  <p className="text-[11px] text-zinc-500">Votos salvos na coleção de votos</p>
                </div>

                {/* Total users */}
                <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 p-6 rounded-2xl relative overflow-hidden shadow-xl">
                  <div className="absolute right-4 bottom-4 text-[#D4AF37]/5 pointer-events-none">
                    <Users className="w-16 h-16" />
                  </div>
                  <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Usuários Ativos</span>
                  <p className="text-5xl font-light text-white mt-2 mb-2 font-sans tracking-tight">{adminStats.totalUsers}</p>
                  <p className="text-[11px] text-zinc-500">Contas criadas na coleção de usuários</p>
                </div>

                {/* Percentage */}
                <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 p-6 rounded-2xl relative overflow-hidden shadow-xl">
                  <div className="absolute right-4 bottom-4 text-[#D4AF37]/5 pointer-events-none">
                    <TrendingUp className="w-16 h-16" />
                  </div>
                  <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Porcentagem</span>
                  <p className="text-5xl font-light text-[#D4AF37] mt-2 mb-2 font-sans tracking-tight">{adminStats.votedUserPercentage}%</p>
                  {/* Miniprogress bar */}
                  <div className="w-full bg-[#0A0A0A] h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="gold-gradient h-full" style={{ width: `${adminStats.votedUserPercentage}%` }}></div>
                  </div>
                </div>

              </div>
            )}

            {/* BRINCANTES MANAGEMENT CARD */}
            <div className="bg-[#1A1A1A] border border-[#D4AF37]/15 rounded-2xl shadow-xl overflow-hidden p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
                <div>
                  <h3 className="font-bold text-white text-lg tracking-tight font-serif italic gold-text flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#D4AF37]" /> Gerenciamento de Brincantes
                  </h3>
                  <p className="text-zinc-400 text-xs mt-0.5">Adicione ou remova brincantes cadastrados na votação</p>
                </div>
                
                {/* Form to add a new participant */}
                <form onSubmit={handleAddParticipant} className="flex gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    required
                    placeholder="Nome do novo brincante..."
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    disabled={participantLoading}
                    className="bg-[#0A0A0A] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] w-full md:w-64"
                  />
                  <button
                    type="submit"
                    disabled={participantLoading || !newParticipantName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 gold-gradient text-neutral-950 font-bold rounded-xl text-xs transition disabled:opacity-50 shrink-0 shadow-lg shadow-amber-500/15 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </form>
              </div>

              {participantError && (
                <div className="mb-4 p-3.5 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{participantError}</span>
                </div>
              )}

              {/* Grid of existing participants */}
              <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {dynamicParticipantes.map((pName) => (
                    <div
                      key={pName}
                      className="bg-[#0A0A0A] border border-zinc-800/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs text-zinc-300 hover:border-[#D4AF37]/30 transition group"
                    >
                      <span className="truncate font-medium">{pName}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteParticipant(pName)}
                        disabled={participantLoading}
                        title={`Remover ${pName}`}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 text-right">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                  Total: {dynamicParticipantes.length} brincantes cadastrados
                </span>
              </div>
            </div>

            {/* RESET CONFIRMATION DIALOG / TOAST */}
            {showResetConfirm && (
              <div className="bg-red-950/20 border border-red-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-white text-sm">Tem certeza que deseja zerar a votação?</h4>
                    <p className="text-zinc-400 text-xs mt-0.5">Esta ação é irreversível e irá deletar todos os documentos da coleção "votos" e redefinir o status de todos os usuários para não votado.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResetVoting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-red-600/20"
                  >
                    Sim, Zerar Tudo
                  </button>
                </div>
              </div>
            )}

            {/* RESULTS RANKINGS EXPLORER */}
            <div className="space-y-4">
              
              {/* Filter / Search input */}
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-white text-lg tracking-tight font-serif italic gold-text">Resultados por Pergunta</h3>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Filtrar perguntas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-zinc-200"
                  />
                </div>
              </div>

              {/* Grid of Results cards */}
              {adminLoading ? (
                <div className="py-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                  <RotateCcw className="w-8 h-8 text-[#D4AF37] animate-spin" />
                  <p className="text-sm font-medium">Processando apuração...</p>
                </div>
              ) : adminStats && Object.keys(adminStats.questionResults).length > 0 ? (
                <div className="space-y-6">
                  {CATEGORIES.map(category => {
                    // Check if category has any matching question with search term
                    const matchingQuestions = category.questions.filter(q =>
                      q.label.toLowerCase().includes(searchTerm.toLowerCase())
                    );

                    if (matchingQuestions.length === 0) return null;

                    return (
                      <div key={category.title} className="space-y-3.5">
                        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                          {renderCategoryIcon(category.icon, "w-5 h-5 text-[#D4AF37]")}
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#D4AF37]">{category.title}</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchingQuestions.map(q => {
                            const ranking = adminStats.questionResults[q.id] || [];
                            const winner = ranking[0];

                            return (
                              <div key={q.id} className="bg-[#1A1A1A] p-5 rounded-2xl border border-[#D4AF37]/10 flex flex-col justify-between shadow-xl">
                                <div>
                                  <div className="flex justify-between items-center mb-4 text-[#D4AF37]">
                                    <h3 className="text-xs font-bold uppercase tracking-wider">{q.label}</h3>
                                  </div>

                                  {ranking.length > 0 ? (
                                    <div className="space-y-4">
                                      {ranking.slice(0, 3).map((item, idx) => (
                                        <div key={item.name} className="space-y-1">
                                          <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-zinc-300">{item.name}</span>
                                            <span className="text-[#D4AF37] font-mono">{item.votes} {item.votes === 1 ? 'voto' : 'votos'} ({item.percentage}%)</span>
                                          </div>
                                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all duration-300 ${
                                                idx === 0
                                                  ? 'bg-[#D4AF37]'
                                                  : idx === 1
                                                  ? 'bg-[#D4AF37]/40'
                                                  : 'bg-[#D4AF37]/20'
                                              }`}
                                              style={{ width: `${item.percentage}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-zinc-500 text-xs italic py-4">Nenhum voto registrado para esta pergunta.</p>
                                  )}
                                </div>

                                {winner && (
                                  <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Destaque</span>
                                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                                      <span className="text-xs text-[#D4AF37] font-bold flex items-center gap-1 bg-[#D4AF37]/5 px-2.5 py-1 rounded-lg border border-[#D4AF37]/15">
                                        🏆 {winner.name}
                                      </span>
                                      <button
                                        onClick={() => setSelectedCertData({
                                          question: q.label,
                                          winnerName: winner.name,
                                          votes: winner.votes
                                        })}
                                        className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-[#D4AF37] hover:bg-[#F3C63F] text-neutral-950 px-2.5 py-1.5 rounded-lg transition duration-150 shadow-md hover:shadow-amber-500/10 cursor-pointer"
                                        title="Gerar Certificado de Destaque"
                                      >
                                        <Award className="w-3.5 h-3.5" />
                                        <span>Certificado</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center bg-[#1A1A1A] border border-[#D4AF37]/10 rounded-2xl text-zinc-400 text-xs">
                  Ainda não há votos suficientes para processar estatísticas. Envie alguns votos primeiro!
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* FOOTER COPYRIGHT */}
      <footer className="text-center mt-16 max-w-xs mx-auto text-zinc-600 text-[10px] uppercase tracking-[0.4em] leading-relaxed">
        © 2026 Prêmio da Quadrilha<br />Todos os Direitos Reservados
      </footer>

      {/* GOOGLE SIGN IN SIMULATION MODAL (ONLY IN SIMULATOR MODE) */}
      {showSimModal && (
        <div id="simulation-modal" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 max-w-md w-full rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            
            {/* Header decor */}
            <div className="absolute top-0 inset-x-0 h-1.5 gold-gradient"></div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-serif italic">
                ✨ Simulador de Login Google
              </h3>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-zinc-400 hover:text-white text-sm bg-zinc-800 p-1.5 rounded-lg border border-zinc-700 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-5">
              Como este app está rodando no ambiente de preview do AI Studio, criamos este assistente para você simular logins com diferentes e-mails/nomes. Isso permite **testar a votação múltipla** e ver o Painel Administrativo em tempo real!
            </p>

            <form onSubmit={handleSimulatedLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Nome do Brincante</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Endereço de E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: joao@gmail.com"
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <p className="text-[10px] text-zinc-500">
                  Dica: use <span className="font-mono text-[#D4AF37]">ofsillvadigital@gmail.com</span> para logar como **Administrador**!
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full gold-gradient hover:opacity-90 text-neutral-950 font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-amber-500/10 uppercase tracking-wider"
                >
                  Entrar como Brincante
                </button>

                <div className="relative text-center my-1.5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                  <span className="relative bg-[#1A1A1A] px-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ou acesse como Admin</span>
                </div>

                <button
                  type="button"
                  onClick={loginAsDefaultAdmin}
                  className="w-full bg-transparent border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/5 font-bold py-2.5 rounded-xl text-xs transition uppercase tracking-wider"
                >
                  👑 Entrar como Admin (ofsillvadigital@gmail.com)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE GENERATOR MODAL */}
      {selectedCertData && (
        <div id="certificate-modal" className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 max-w-4xl w-full rounded-2xl shadow-2xl p-4 sm:p-6 my-8 relative overflow-hidden flex flex-col gap-4">
            
            {/* Header decor bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 gold-gradient"></div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-serif italic">
                  🏅 Certificado de Destaque Oficial
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">Pré-visualização do certificado oficial da temporada de São João 2026</p>
              </div>
              <button
                onClick={() => setSelectedCertData(null)}
                className="text-zinc-400 hover:text-white text-sm bg-zinc-800 p-2 rounded-xl border border-zinc-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Certificate Preview Stage */}
            <div className="flex justify-center items-center bg-black/40 border border-zinc-800 rounded-xl p-2 sm:p-4 overflow-hidden relative">
              {/* Responsive scaling container for the canvas */}
              <div className="w-full max-w-2xl aspect-[800/560] relative">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full rounded-lg border border-[#D4AF37]/20 shadow-2xl bg-[#0A0A0A]"
                  style={{ display: 'block' }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-zinc-500 text-center sm:text-left leading-relaxed max-w-md">
                💡 O arquivo gerado possui alta resolução (2x) e formato oficial pronto para impressão ou exportação como PDF!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
                <button
                  onClick={handlePrintCert}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#D4AF37]" />
                  <span>Imprimir / Salvar PDF</span>
                </button>

                <button
                  onClick={handleDownloadCert}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 gold-gradient hover:opacity-95 text-neutral-950 rounded-xl font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Imagem PNG</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
