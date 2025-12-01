import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { usePuterStore } from "~/lib/puter";
import ResumePreview from "~/components/resume-preview/ResumePreview";
import { prepareInstructions } from "../../constants";
import { generateUUID } from "~/lib/utils";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "~/components/LanguageSwitcher";
import Icon from "~/components/Icon";

export function meta() {
  return [
    { title: "ARBA | Resume Preview" },
    { name: "description", content: "Resume Preview" },
  ];
}

export default function ResumePreviewPage() {
  const { auth, isLoading, kv, fs, ai } = usePuterStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeNode, setResumeNode] = useState<HTMLDivElement | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}/preview`);
    }
  }, [auth.isAuthenticated, isLoading, navigate, id]);

  useEffect(() => {
    const loadResume = async () => {
      if (!id) return;

      try {
        const resume = await kv.get(`resume:${id}`);
        if (!resume) {
          alert(t('preview.notFound'));
          navigate("/");
          return;
        }

        const data = JSON.parse(resume) as ResumeData;
        setResumeData(data);
      } catch (error) {
        console.error("Error loading resume:", error);
        alert(t('preview.loadError'));
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    if (auth.isAuthenticated) {
      loadResume();
    }
  }, [id, auth.isAuthenticated, kv, navigate]);

  if (loading) {
    return (
      <main className="!pt-0">
        <div className="flex items-center justify-center min-h-screen">
          <img
            src="/images/resume-scan-2.gif"
            className="w-[200px]"
            alt="loading"
          />
        </div>
      </main>
    );
  }

  if (!resumeData) {
    return null;
  }

  const captureCanvas = async (element: HTMLElement) => {
    const html2canvasModule = await import("html2canvas");
    const html2canvas = html2canvasModule.default || html2canvasModule;
    return html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
  };

  const canvasToBlob = (canvas: HTMLCanvasElement, type: string) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Не удалось подготовить файл"));
        },
        type,
        0.98
      );
    });

  const handleEvaluate = async () => {
    if (!resumeData || !resumeNode || isEvaluating) return;
    setIsEvaluating(true);
      setEvaluationStatus(t('preview.preparing'));
    try {
      const canvas = await captureCanvas(resumeNode);
      const imageBlob = await canvasToBlob(canvas, "image/png");

      setEvaluationStatus(t('preview.creatingPDF'));
      const jsPDFModule = await import("jspdf");
      const { jsPDF } = jsPDFModule;
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = pdf.output("blob");

      setEvaluationStatus(t('preview.uploading'));
      const pdfFile = new File([pdfBlob], `resume-${resumeData.id || "preview"}.pdf`, {
        type: "application/pdf",
      });
      const imageFile = new File([imageBlob], `resume-${resumeData.id || "preview"}.png`, {
        type: "image/png",
      });

      const uploadedPdf = await fs.upload([pdfFile]);
      const uploadedImage = await fs.upload([imageFile]);
      if (!uploadedPdf || !uploadedImage) {
        throw new Error(t('preview.uploadError'));
      }

      const evaluationId = generateUUID();
      const analysisRecord: Resume = {
        id: evaluationId,
        companyName: resumeData.fullName || resumeData.title,
        jobTitle: resumeData.title,
        imagePath: uploadedImage.path,
        resumePath: uploadedPdf.path,
        feedback: {
          overallScore: 0,
          ATS: { score: 0, tips: [] },
          toneAndStyle: { score: 0, tips: [] },
          content: { score: 0, tips: [] },
          structure: { score: 0, tips: [] },
          skills: { score: 0, tips: [] },
        },
      };

      await kv.set(`resume:${evaluationId}`, JSON.stringify(analysisRecord));

      setEvaluationStatus(t('preview.requestingAI'));
      const instructions = prepareInstructions({
        jobTitle: resumeData.title,
        jobDescription: resumeData.about || "",
        language: i18n.language,
      });
      const feedbackResponse = await ai.feedback(uploadedPdf.path, instructions);
      if (!feedbackResponse) {
        throw new Error(t('preview.aiError'));
      }

      const feedbackText =
        typeof feedbackResponse.message.content === "string"
          ? feedbackResponse.message.content
          : Array.isArray(feedbackResponse.message.content) &&
            feedbackResponse.message.content[0] &&
            typeof feedbackResponse.message.content[0] === "object" &&
            "text" in feedbackResponse.message.content[0]
          ? feedbackResponse.message.content[0].text
          : String(feedbackResponse.message.content);

      analysisRecord.feedback = JSON.parse(feedbackText);
      await kv.set(`resume:${evaluationId}`, JSON.stringify(analysisRecord));
      setEvaluationStatus(t('preview.redirecting'));
      setIsEvaluating(false);
      navigate(`/resume/${evaluationId}`);
    } catch (error) {
      console.error(error);
      setEvaluationStatus(
        error instanceof Error ? error.message : t('preview.error')
      );
      setIsEvaluating(false);
    }
  };

  return (
    <main className="!pt-0 resume-preview-page">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <Icon name="back" className="text-gray-800 md:w-2.5 md:h-2.5 w-5 h-5" size={20} />
          <span className="text-gray-800 text-sm font-semibold hidden sm:inline">
            {t('preview.back')}
          </span>
        </Link>
        <div className="flex flex-row items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          {id && (
            <Link
              to={`/create?resumeId=${id}`}
              className="secondary-button !w-auto !px-3 !py-2 sm:!px-6 text-sm font-semibold flex items-center justify-center gap-2"
              title={t('preview.edit')}
            >
              <Icon name="edit" className="sm:hidden text-gray-700" size={18} />
              <span className="hidden sm:inline">{t('preview.edit')}</span>
            </Link>
          )}
          <div className="sm:hidden">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
      {evaluationStatus && (
        <p className="text-center text-sm text-gray-500 mt-2 px-4">{evaluationStatus}</p>
      )}
      <div className="flex flex-col items-center py-8">
        <ResumePreview resumeData={resumeData} onContentRef={setResumeNode} />
      </div>
    </main>
  );
}

