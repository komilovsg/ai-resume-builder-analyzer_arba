import { useRef, useState } from "react";
import { useResumeStore } from "~/lib/resume-store";
import ResumeModern from "./styles/ResumeModern";
import ResumeClassic from "./styles/ResumeClassic";
import ResumeMinimal from "./styles/ResumeMinimal";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import { useTranslation } from "react-i18next";

interface ResumePreviewProps {
  resumeData: ResumeData;
  onContentRef?: (node: HTMLDivElement | null) => void;
}

export default function ResumePreview({ resumeData, onContentRef }: ResumePreviewProps) {
  const { setStyle } = useResumeStore();
  const { t } = useTranslation();
  const [selectedStyle, setSelectedStyle] = useState<ResumeStyle>(
    resumeData.style || "modern"
  );
  const resumeRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleStyleChange = (style: ResumeStyle) => {
    setSelectedStyle(style);
    setStyle(style);
  };

  const handleExportPDF = async () => {
    if (!resumeRef.current || typeof window === "undefined") return;

    setIsExporting(true);
    
    // Сохраняем оригинальные стили для восстановления
    const originalStyles: Array<{ el: HTMLElement; prop: string; value: string }> = [];
    
    // Функция для конвертации oklch/oklab/lab цвета в RGB через canvas
    const convertColorToRGB = (colorValue: string, fallback: string): string => {
      if (!colorValue || (!colorValue.includes("oklch") && !colorValue.includes("oklab") && !colorValue.includes("lab("))) {
        return colorValue;
      }
      
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return fallback;
        
        ctx.fillStyle = colorValue;
        const rgb = ctx.fillStyle;
        // Если canvas вернул oklch обратно, используем fallback
        if (rgb.includes("oklch") || rgb.includes("oklab") || rgb.includes("lab(")) {
          return fallback;
        }
        return rgb;
      } catch {
        return fallback;
      }
    };
    
    // Функция для замены oklch цветов в строке (для градиентов, теней и т.д.)
    const replaceOklchInString = (str: string): string => {
      if (!str) return str;
      
      // Регулярное выражение для поиска oklch/oklab/lab функций
      const oklchPattern = /(oklch|oklab|lab)\([^)]+\)/gi;
      
      return str.replace(oklchPattern, (match) => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return "#000000";
          
          ctx.fillStyle = match;
          const rgb = ctx.fillStyle;
          if (rgb.includes("oklch") || rgb.includes("oklab") || rgb.includes("lab(")) {
            return "#000000"; // Fallback
          }
          return rgb;
        } catch {
          return "#000000";
        }
      });
    };
    
    // Функция для обхода всех элементов и замены oklch цветов
    const replaceOklchColors = (node: HTMLElement) => {
      const computed = window.getComputedStyle(node);
      
      // Список всех CSS-свойств, которые могут содержать цвета
      const colorProperties = [
        'color',
        'backgroundColor',
        'borderColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
        'outlineColor',
        'textDecorationColor',
        'columnRuleColor',
      ];
      
      // Обрабатываем простые цветовые свойства
      colorProperties.forEach(prop => {
        const value = computed.getPropertyValue(prop) || (computed as any)[prop];
        if (value && (value.includes("oklch") || value.includes("oklab") || value.includes("lab("))) {
          originalStyles.push({ 
            el: node, 
            prop: prop.replace(/([A-Z])/g, '-$1').toLowerCase(), 
            value: node.style.getPropertyValue(prop) || '' 
          });
          const convertedColor = convertColorToRGB(value, 
            prop === 'color' ? '#000000' : 
            prop === 'backgroundColor' ? '#ffffff' : '#cccccc'
          );
          node.style.setProperty(prop.replace(/([A-Z])/g, '-$1').toLowerCase(), convertedColor);
        }
      });
      
      // Обрабатываем сложные свойства с градиентами и тенями
      const complexProperties = [
        { prop: 'background', propName: 'background' },
        { prop: 'backgroundImage', propName: 'background-image' },
        { prop: 'boxShadow', propName: 'box-shadow' },
        { prop: 'textShadow', propName: 'text-shadow' },
      ];
      
      complexProperties.forEach(({ prop, propName }) => {
        const value = computed.getPropertyValue(propName) || (computed as any)[prop];
        if (value && (value.includes("oklch") || value.includes("oklab") || value.includes("lab("))) {
          originalStyles.push({ 
            el: node, 
            prop: propName, 
            value: node.style.getPropertyValue(propName) || '' 
          });
          const convertedValue = replaceOklchInString(value);
          node.style.setProperty(propName, convertedValue);
        }
      });
      
      // Рекурсивно обрабатываем дочерние элементы
      for (const child of Array.from(node.children)) {
        if (child instanceof HTMLElement) {
          replaceOklchColors(child);
        }
      }
      
      // Обрабатываем псевдоэлементы (если они есть)
      try {
        const before = window.getComputedStyle(node, '::before');
        const after = window.getComputedStyle(node, '::after');
        // Псевдоэлементы сложнее обработать, но мы можем попробовать через CSS
        // Для надежности лучше избегать oklch в псевдоэлементах
      } catch (e) {
        // Игнорируем ошибки с псевдоэлементами
      }
    };
    
    try {
      // Используем jspdf и html2canvas напрямую для более надежной работы
      const html2canvasModule = await import("html2canvas");
      const jsPDFModule = await import("jspdf");

      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = jsPDFModule;

      const element = resumeRef.current;
      
      if (!element) {
        throw new Error("Элемент резюме не найден");
      }

      // Обрабатываем CSS переменные (custom properties) в корневом элементе
      const root = document.documentElement;
      const rootStyles = window.getComputedStyle(root);
      const cssVarReplacements: Array<{ name: string; value: string }> = [];
      
      try {
        // Получаем все CSS переменные
        const allStyles = rootStyles.cssText?.split(';') || [];
        for (const style of allStyles) {
          if (style.includes('--') && style.includes(':')) {
            const match = style.match(/--([^:]+):\s*(.+)/);
            if (match) {
              const varName = match[1].trim();
              let varValue = match[2].trim();
              if (varValue && (varValue.includes("oklch") || varValue.includes("oklab") || varValue.includes("lab("))) {
                const converted = replaceOklchInString(varValue);
                if (converted !== varValue) {
                  cssVarReplacements.push({ name: `--${varName}`, value: root.style.getPropertyValue(`--${varName}`) });
                  root.style.setProperty(`--${varName}`, converted);
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn("Could not process CSS variables:", e);
      }
      
      // Заменяем oklch цвета в элементах перед рендерингом
      replaceOklchColors(element);

      // Конвертируем HTML в canvas с дополнительными опциями для избежания проблем с oklch
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        ignoreElements: (element) => {
          // Игнорируем элементы, которые могут вызывать проблемы
          return false;
        },
        onclone: (clonedDoc) => {
          // Дополнительная обработка клонированного документа
          // Обрабатываем все элементы в клонированном документе
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computed = clonedDoc.defaultView?.getComputedStyle(el);
              if (!computed) return;
              
              // Список свойств, которые могут содержать oklch
              const colorProps = [
                'color', 'background-color', 'border-color', 'border-top-color',
                'border-right-color', 'border-bottom-color', 'border-left-color',
                'outline-color', 'text-decoration-color', 'column-rule-color'
              ];
              
              const complexProps = [
                'background', 'background-image', 'box-shadow', 'text-shadow'
              ];
              
              // Обрабатываем простые цветовые свойства
              colorProps.forEach(prop => {
                const value = computed.getPropertyValue(prop);
                if (value && (value.includes("oklch") || value.includes("oklab") || value.includes("lab("))) {
                  const converted = convertColorToRGB(value, "#000000");
                  el.style.setProperty(prop, converted);
                }
              });
              
              // Обрабатываем сложные свойства
              complexProps.forEach(prop => {
                const value = computed.getPropertyValue(prop);
                if (value && (value.includes("oklch") || value.includes("oklab") || value.includes("lab("))) {
                  const converted = replaceOklchInString(value);
                  el.style.setProperty(prop, converted);
                }
              });
            }
          });
        },
      });
      
      // Восстанавливаем оригинальные стили элементов
      originalStyles.forEach(({ el, prop, value }) => {
        if (value) {
          el.style.setProperty(prop, value);
        } else {
          el.style.removeProperty(prop);
        }
      });
      
      // Восстанавливаем CSS переменные
      cssVarReplacements.forEach(({ name, value }) => {
        try {
          if (value) {
            root.style.setProperty(name, value);
          } else {
            root.style.removeProperty(name);
          }
        } catch (e) {
          // Игнорируем ошибки восстановления
        }
      });

      const imgData = canvas.toDataURL("image/png");
      
      // Создаем PDF
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Добавляем первую страницу
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Добавляем дополнительные страницы, если нужно
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Сохраняем PDF
      pdf.save(`resume-${resumeData.title || "resume"}.pdf`);
      
      Toastify({
        text: "PDF успешно экспортирован!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
      }).showToast();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Восстанавливаем оригинальные стили даже при ошибке
      originalStyles.forEach(({ el, prop, value }) => {
        (el.style as any)[prop] = value;
      });
      
      Toastify({
        text: `Ошибка при экспорте PDF: ${errorMessage}`,
        duration: 5000,
        gravity: "top",
        position: "right",
        style: {
          background: "linear-gradient(to right, #ff5f6d, #ffc371)",
        },
      }).showToast();
    } finally {
      setIsExporting(false);
    }
  };

  const renderResume = () => {
    switch (selectedStyle) {
      case "modern":
        return <ResumeModern resumeData={resumeData} />;
      case "classic":
        return <ResumeClassic resumeData={resumeData} />;
      case "minimal":
        return <ResumeMinimal resumeData={resumeData} />;
      default:
        return <ResumeModern resumeData={resumeData} />;
    }
  };

  const assignResumeRef = (node: HTMLDivElement | null) => {
    resumeRef.current = node;
    if (onContentRef) {
      onContentRef(node);
    }
  };

  return (
    <div className="w-full max-w-6xl px-4 resume-preview-container">
      {/* Style Selector */}
      <div className="mb-6 text-center text-sm text-gray-600">
        {t('preview.stylesDescription')}
      </div>
      <div className="mb-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 resume-style-switcher">
        <button
          onClick={() => handleStyleChange("modern")}
          className={`px-6 py-2 rounded-full font-semibold transition-colors ${
            selectedStyle === "modern"
              ? "primary-gradient text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {t('preview.styles.modern')}
        </button>
        <button
          onClick={() => handleStyleChange("classic")}
          className={`px-6 py-2 rounded-full font-semibold transition-colors ${
            selectedStyle === "classic"
              ? "primary-gradient text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {t('preview.styles.classic')}
        </button>
        <button
          onClick={() => handleStyleChange("minimal")}
          className={`px-6 py-2 rounded-full font-semibold transition-colors ${
            selectedStyle === "minimal"
              ? "primary-gradient text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {t('preview.styles.minimal')}
        </button>
      </div>

      {/* Resume Preview */}
      <div
        ref={assignResumeRef}
        className="bg-white shadow-lg rounded-lg p-8 mb-8 resume-content-card w-full md:w-[90%] mx-auto"
      >
        {renderResume()}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 resume-actions">
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="primary-button max-w-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <p>{isExporting ? t('preview.exporting') : t('preview.exportPDF')}</p>
        </button>
      </div>
    </div>
  );
}


