import { prepareInstructions } from "../../constants";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";
import { useTranslation } from "react-i18next";

export default function Upload() {
    const {auth, isLoading, fs, ai, kv} = usePuterStore();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState(" ");
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    }

    const handlerAnalyze = async({companyName, jobTitle, jobDescription, file}: {companyName: string, jobTitle: string, jobDescription: string, file: File}) => {
        setIsProcessing(true);
        try {
            setStatusText(t('upload.statusAnalyzing'));
            const uploadedFile = await fs.upload([file]);

            if(!uploadedFile) {
                setStatusText(t('upload.errorUploadResume'));
                setIsProcessing(false);
                return;
            }
            
            setStatusText(t('upload.statusConverting'));
            const imageFile = await convertPdfToImage(file);
            
            if(!imageFile.file) {
                const errorMessage = imageFile.error 
                    ? `${t('upload.errorConvertPDF')} - ${imageFile.error}` 
                    : t('upload.errorConvertPDF');
                console.error("PDF conversion error:", imageFile.error);
                setStatusText(errorMessage);
                setIsProcessing(false);
                return;
            }
            
            setStatusText(t('upload.statusUploading'));
            const uploadedImage = await fs.upload([imageFile.file]);
            if(!uploadedImage) {
                setStatusText(t('upload.errorUploadImage'));
                setIsProcessing(false);
                return;
            }
            
            setStatusText(t('upload.statusAnalyzingImage'));

            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                jobDescription,
                feedback: '',
            }

            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText(t('upload.statusAnalyzingFinal'));

            const feedback = await ai.feedback(
                uploadedFile.path, 
                prepareInstructions({jobTitle, jobDescription, language: i18n.language})
            );

            if(!feedback) {
                setStatusText(t('upload.errorAnalyzeResume'));
                setIsProcessing(false);
                return;
            }

            const feedbackText = typeof feedback.message.content === 'string' 
                ? feedback.message.content 
                : Array.isArray(feedback.message.content) && feedback.message.content[0] && typeof feedback.message.content[0] === 'object' && 'text' in feedback.message.content[0]
                ? feedback.message.content[0].text
                : String(feedback.message.content);


            data.feedback = JSON.parse(feedbackText);
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText(t('upload.statusComplete'));
            console.log(data);
            navigate(`/resume/${uuid}`);
        } catch (error) {
            console.error("Error in handlerAnalyze:", error);
            setStatusText(`${t('upload.errorUnexpected')}: ${error instanceof Error ? error.message : t('upload.errorUnexpected')}`);
            setIsProcessing(false);
        }
    }


    const handleSubmit = (e: FormEvent<HTMLFormElement>) => { 
        e.preventDefault();
        const form = e.currentTarget.closest('form') as HTMLFormElement;
        if(form) {
            const formData = new FormData(form);
            const companyName = formData.get('company-name') as string;
            const jobTitle = formData.get('job-title') as string;
            const jobDescription = formData.get('job-description') as string;

            console.log({companyName, jobTitle, jobDescription, file});
            if(!file) return;

            handlerAnalyze({companyName, jobTitle, jobDescription, file});
        }

        
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>{t('upload.title')}</h1>
                    {isProcessing ? (
                        <>
                            <div className="flex flex-col items-center gap-4 w-full">
                                <h2 className="text-xl text-gray-700 font-semibold">{statusText}</h2>
                                {(statusText.includes('Error:') || statusText.includes('Ошибка:') || statusText.includes(t('upload.error'))) ? (
                                    <div className="mt-4 flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                                        <button 
                                            onClick={() => {
                                                setIsProcessing(false);
                                                setStatusText(" ");
                                            }}
                                            className="primary-button"
                                        >
                                            {t('upload.tryAgain')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        {/* <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div> */}
                                        <img src='/images/resume-scan.gif' className="w-1/2 mx-auto max-w-md" alt="Processing" />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <h2>{t('upload.subtitle')}</h2>
                        </>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">{t('upload.companyName')}</label>
                                <input type="text" name="company-name" placeholder={t('upload.companyNamePlaceholder')} id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">{t('upload.jobTitle')}</label>
                                <input type="text" name="job-title" placeholder={t('upload.jobTitlePlaceholder')} id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">{t('upload.jobDescription')}</label>
                                <textarea rows={5} name="job-description" placeholder={t('upload.jobDescriptionPlaceholder')} id="job-description"></textarea>
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader">{t('upload.uploadResume')}</label>
                                <FileUploader onFileSelect={handleFileSelect}/>
                            </div>
                            <button type="submit" className="primary-button">
                                {t('upload.analyzeResume')}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}