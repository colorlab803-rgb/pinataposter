'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { toast } from 'sonner'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

import { Upload, Ruler, FileDown, Loader2, Image as ImageIcon, AlertTriangle, Layers, Crop as CropIcon, CheckCircle2, CheckSquare, Ban, Package, Download, ArrowRight, ArrowLeft, Share } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Stepper } from '@/components/ui/stepper'
import getCroppedImg from '@/lib/cropImage'

const paperSizes = {
  Letter: { width: 21.59, height: 27.94 },
  Legal: { width: 21.59, height: 35.56 },
  Tabloid: { width: 27.94, height: 43.18 },
  A4: { width: 21.0, height: 29.7 },
  A3: { width: 29.7, height: 42.0 },
}
const MARGIN_CM = 1.0
const BLEED_CM = 0.5

type PaperSize = keyof typeof paperSizes
type Orientation = 'portrait' | 'landscape'
type DownloadType = 'pdf' | 'zip'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_IMAGE_DIMENSION = 16000 // px

const steps = [
  { id: 'Step 1', name: 'Subir Imagen' },
  { id: 'Step 2', name: 'Ajustar Tamaño' },
  { id: 'Step 3', name: 'Descargar' },
]

interface PosterGeneratorProps {
  initialImageSrc?: string
  templateTitle?: string
  onImageChange?: (imageFile: File | null) => void
  showImageUpload?: boolean
  showTitle?: boolean
}

export function PosterGenerator({ 
  initialImageSrc, 
  templateTitle,
  onImageChange,
  showImageUpload = true,
  showTitle = true
}: PosterGeneratorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(initialImageSrc || null)
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(initialImageSrc || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number }>({ width: 0, height: 0 })

  const [targetWidthCm, setTargetWidthCm] = useState<string>("")
  const [targetHeightCm, setTargetHeightCm] = useState<string>("")
  const [editingDimension, setEditingDimension] = useState<'width' | 'height' | null>(null)
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true)
  const [paperSize, setPaperSize] = useState<PaperSize>('Letter')
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [includeCutGuides, setIncludeCutGuides] = useState<boolean>(true)
  const [includeBleed, setIncludeBleed] = useState<boolean>(true)
  const [includeAssemblyPlan, setIncludeAssemblyPlan] = useState<boolean>(true)
  
  const [grid, setGrid] = useState<{ cols: number, rows: number } | null>(null)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false)
  // Vista previa (miniaturas por hoja)
  const [previewSlices, setPreviewSlices] = useState<string[] | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Crop state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const cropImgRef = useRef<HTMLImageElement>(null)

  const [isDownloadCompleteModalOpen, setIsDownloadCompleteModalOpen] = useState(false)
  const [downloadCompleteInfo, setDownloadCompleteInfo] = useState<{
    fileName: string
    fileType: 'pdf' | 'zip'
    blob: Blob
  } | null>(null)

  const [isFileNameDialogOpen, setIsFileNameDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [downloadType, setDownloadType] = useState<DownloadType | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }

  const handleDownloadComplete = (fileName: string, fileType: 'pdf' | 'zip', blob: Blob) => {
    setDownloadCompleteInfo({ fileName, fileType, blob })
    setIsDownloadCompleteModalOpen(true)
  }

  const handleShareFile = async () => {
    if (!downloadCompleteInfo) return

    try {
      if (navigator.share && navigator.canShare) {
        const file = new File([downloadCompleteInfo.blob], downloadCompleteInfo.fileName, {
          type: downloadCompleteInfo.fileType === 'pdf' ? 'application/pdf' : 'application/zip'
        })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Mi ${downloadCompleteInfo.fileType.toUpperCase()} de PiñataPoster`,
            text: `¡Mira mi diseño creado con PiñataPoster!`,
            files: [file]
          })
          toast.success("¡Compartido!", {
            description: "Tu archivo se ha compartido exitosamente."
          })
        } else {
          // Fallback: compartir solo texto
          await navigator.share({
            title: `Mi ${downloadCompleteInfo.fileType.toUpperCase()} de PiñataPoster`,
            text: `¡Mira mi diseño creado con PiñataPoster! Archivo: ${downloadCompleteInfo.fileName}`,
            url: window.location.href
          })
        }
      } else {
        // Fallback para navegadores que no soportan Web Share API
        navigator.clipboard.writeText(`${window.location.href}\n\n¡Mira mi diseño creado con PiñataPoster! Archivo: ${downloadCompleteInfo.fileName}`)
        toast.success("Enlace copiado", {
          description: "El enlace de la página se copió al portapapeles. Puedes compartirlo manualmente."
        })
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error("Error al compartir", {
        description: "No se pudo compartir el archivo. Inténtalo de nuevo."
      })
    }
  }

  const handleDownloadAgain = async () => {
    if (!downloadCompleteInfo) return
    const { saveAs } = await import('file-saver')
    saveAs(downloadCompleteInfo.blob, downloadCompleteInfo.fileName)
    toast.success("Descargado nuevamente", {
      description: `Se descargó ${downloadCompleteInfo.fileName} otra vez.`
    })
  }
  useEffect(() => {
    if (initialImageSrc && !processedImageSrc) {
      setProcessedImageSrc(initialImageSrc)
      setOriginalImageSrc(initialImageSrc)
      const preload = new window.Image()
      preload.onload = () => setImageDimensions({ width: preload.width, height: preload.height })
      preload.src = initialImageSrc
    }
  }, [initialImageSrc, processedImageSrc])

  const getPrintableArea = useCallback(() => {
    const paperDim = paperSizes[paperSize]
    let printableWidth, printableHeight

    if (orientation === 'portrait') {
        printableWidth = paperDim.width - 2 * MARGIN_CM
        printableHeight = paperDim.height - 2 * MARGIN_CM
    } else {
        printableWidth = paperDim.height - 2 * MARGIN_CM
        printableHeight = paperDim.width - 2 * MARGIN_CM
    }
    return { printableWidth, printableHeight }
  }, [paperSize, orientation])

  const normalizeDimensionInput = (value: string) => {
    const trimmed = value.trim()

    // Permite borrar el campo sin forzar valores temporales.
    if (trimmed === '') return ''

    // Acepta coma o punto decimal para teclado ES.
    const normalized = trimmed.replace(',', '.')
    if (!/^\d*(\.\d*)?$/.test(normalized)) return null

    return normalized
  }

  const handleDimensionChange = (value: string, dimension: 'width' | 'height') => {
    const normalizedValue = normalizeDimensionInput(value)
    if (normalizedValue === null) return

    if (dimension === 'width') setTargetWidthCm(normalizedValue)
    else setTargetHeightCm(normalizedValue)

    const numValue = parseFloat(normalizedValue)
    if (normalizedValue === '' || isNaN(numValue) || numValue <= 0) return
  
    if (dimension === 'width') {
      if (keepAspectRatio && imageDimensions.width > 0) {
        const aspectRatio = imageDimensions.height / imageDimensions.width
        const newHeight = numValue * aspectRatio
        setTargetHeightCm(newHeight.toFixed(2))
      }
    } else {
      if (keepAspectRatio && imageDimensions.height > 0) {
        const aspectRatio = imageDimensions.width / imageDimensions.height
        const newWidth = numValue * aspectRatio
        setTargetWidthCm(newWidth.toFixed(2))
      }
    }
  }

  const getGrid = useCallback((targetW: number, targetH: number): { cols: number, rows: number } => {
    const { printableWidth, printableHeight } = getPrintableArea()
    const cols = Math.ceil(targetW / printableWidth)
    const rows = Math.ceil(targetH / printableHeight)
    return { cols, rows }
  }, [getPrintableArea])

  useEffect(() => {
    if (!processedImageSrc || !targetWidthCm || !targetHeightCm) {
      setGrid(null)
      return
    }
    const width = parseFloat(targetWidthCm)
    const height = parseFloat(targetHeightCm)

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        setGrid(null)
        return
    }
    
    const newGrid = getGrid(width, height)
   
    if (newGrid.cols > 0 && newGrid.rows > 0 && newGrid.cols * newGrid.rows <= 100) {
      setGrid(newGrid)
      const allPages = new Set<number>()
      for (let i = 0; i < newGrid.cols * newGrid.rows; i++) {
        allPages.add(i)
      }
      setSelectedPages(allPages)
    } else {
      setGrid(null)
      if (newGrid.cols * newGrid.rows > 100) {
        toast.error("Diseño demasiado grande", {
          description: "La imagen resultante requiere demasiadas hojas. Por favor, reduce el tamaño.",
        })
      }
    }
  }, [processedImageSrc, targetWidthCm, targetHeightCm, getGrid])

  const handleSelectImageClick = () => {
    setIsImageLoading(true)
    fileInputRef.current?.click()
    setTimeout(() => setIsImageLoading(false), 200)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsImageLoading(false)
    
    const file = e.target.files?.[0]
    if (!file || !(file.type === 'image/jpeg' || file.type === 'image/png')) {
      toast.error("Tipo de archivo no válido", {
        description: "Solo puedes subir fotos en formato JPG o PNG.",
      })
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Archivo demasiado grande", {
        description: `El archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB. El máximo permitido es 50 MB.`,
      })
      return
    }

    // Reset del input para permitir re-seleccionar el mismo archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

  setIsProcessing(true)
  // Limpiar medidas para que el usuario defina una y calcule la otra a proporción
  setTargetWidthCm("")
  setTargetHeightCm("")
    setImageFile(file)
    
    // Notify parent component about image change
    if (onImageChange) {
      onImageChange(file)
    }
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const imgSrc = event.target?.result as string
      setOriginalImageSrc(imgSrc)
      setProcessedImageSrc(imgSrc)
      
      const img = new window.Image()
      img.src = imgSrc
      img.onload = () => {
        if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
          toast.error("Imagen demasiado grande", {
            description: `La imagen tiene ${img.width}×${img.height} px. El máximo es ${MAX_IMAGE_DIMENSION}×${MAX_IMAGE_DIMENSION} px.`,
          })
          setIsProcessing(false)
          return
        }
        setImageDimensions({ width: img.width, height: img.height })
        setIsProcessing(false)
        toast.success("✅ Imagen cargada", {
          description: "Tu imagen está lista. Configura el tamaño y genera tu póster.",
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const onImageLoadForCrop = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget
      setCrop(centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          1,
          width,
          height
        ),
        width,
        height
      ))
  }

  const showCroppedImage = useCallback(async () => {
    if (!completedCrop || !cropImgRef.current) {
        toast.error("Error de recorte", {
            description: "No se pudo obtener el área de recorte."
        })
        return
    }
    
    try {
        const croppedImageSrc = await getCroppedImg(cropImgRef.current, completedCrop)
        setProcessedImageSrc(croppedImageSrc) 
        
        const img = new window.Image()
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height })
        }
        img.src = croppedImageSrc
    } catch (e) {
        console.error(e)
        toast.error("Error al recortar", {
            description: "No se pudo procesar el recorte de la imagen."
        })
    } finally {
        setIsCropModalOpen(false)
    }
  }, [completedCrop])

  const handleSkipCrop = () => {
      if (!originalImageSrc) return
      setProcessedImageSrc(originalImageSrc)
      setIsCropModalOpen(false)
  }

  const validateInputs = () => {
    const missingParams: string[] = []
    if (!processedImageSrc) {
        missingParams.push("• No has subido una imagen.")
    }
    if (!targetWidthCm || parseFloat(targetWidthCm) <= 0) {
        missingParams.push("• No has definido el ancho final.")
    }
    if (!targetHeightCm || parseFloat(targetHeightCm) <= 0) {
        missingParams.push("• No has definido el alto final.")
    }
    if (selectedPages.size === 0) {
        missingParams.push("• No has seleccionado ninguna hoja para imprimir.")
    }

    if (missingParams.length > 0) {
        toast.error("Faltan Parámetros", {
            description: (
                <div className="flex flex-col gap-1">
                    {missingParams.map((param, i) => <p key={i}>{param}</p>)}
                </div>
            )
        })
        return false
    }

    return true
  }

  const generateSlices = useCallback(async (image: HTMLImageElement, grid: {cols: number, rows: number}, quality: number = 0.9) => {
    const finalWidthCm = parseFloat(targetWidthCm)
    const finalHeightCm = parseFloat(targetHeightCm)
    const pxPerCm = image.width / finalWidthCm
    
    const sliceWidthCm = finalWidthCm / grid.cols
    const sliceHeightCm = finalHeightCm / grid.rows

    const bleedXPx = includeBleed ? BLEED_CM * pxPerCm : 0
    const bleedYPx = includeBleed ? BLEED_CM * pxPerCm : 0
    
    const slices = []
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        
        const bleedL = (c > 0) ? bleedXPx : 0
        const bleedR = (c < grid.cols - 1) ? bleedXPx : 0
        const bleedT = (r > 0) ? bleedYPx : 0
        const bleedB = (r < grid.rows - 1) ? bleedYPx : 0

        // Calcular posición de origen en la imagen (con bleed)
        let sx = c * sliceWidthCm * pxPerCm - bleedL
        let sy = r * sliceHeightCm * pxPerCm - bleedT

        // Calcular dimensiones de la porción a extraer (con bleed)
        let sWidth = sliceWidthCm * pxPerCm + bleedL + bleedR
        let sHeight = sliceHeightCm * pxPerCm + bleedT + bleedB

        // Limitar a los bordes de la imagen para evitar coordenadas negativas o fuera de rango
        if (sx < 0) {
          sWidth += sx
          sx = 0
        }
        if (sy < 0) {
          sHeight += sy
          sy = 0
        }
        if (sx + sWidth > image.width) {
          sWidth = image.width - sx
        }
        if (sy + sHeight > image.height) {
          sHeight = image.height - sy
        }

        canvas.width = sliceWidthCm * pxPerCm + bleedL + bleedR
        canvas.height = sliceHeightCm * pxPerCm + bleedT + bleedB
        
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Dibujar la porción exacta de la imagen
        ctx.drawImage(
            image,
            sx, sy, sWidth, sHeight,
            0, 0, canvas.width, canvas.height
        )

        slices.push(canvas.toDataURL('image/jpeg', quality))
      }
    }
    return slices
  }, [includeBleed, targetWidthCm, targetHeightCm])

  // Generar miniaturas de vista previa cuando haya grid y medidas listas
  useEffect(() => {
    let cancelled = false
    if (!processedImageSrc || !grid || !targetWidthCm || !targetHeightCm) {
      setPreviewSlices(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        setIsGeneratingPreview(true)
        setPreviewError(null)
        const img = new window.Image()
        img.crossOrigin = 'Anonymous'
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('Error al cargar imagen')); img.src = processedImageSrc! })
        const slices = await generateSlices(img, grid, 0.6)
        if (!cancelled) setPreviewSlices(slices)
      } catch (e) {
        console.error('Error generando vista previa:', e)
        if (!cancelled) setPreviewError('No se pudo generar la vista previa')
      } finally {
        if (!cancelled) setIsGeneratingPreview(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [processedImageSrc, grid, includeBleed, targetWidthCm, targetHeightCm, generateSlices])

  const handleDownloadRequest = async (type: DownloadType) => {
    if (!validateInputs()) return
    setDownloadType(type)
    setIsFileNameDialogOpen(true)
  }

  const handleConfirmDownload = () => {
    if (downloadType === 'pdf') {
      generatePdf(projectName)
    } else if (downloadType === 'zip') {
      generateZip(projectName)
    }
    setIsFileNameDialogOpen(false)
    setProjectName("")
    setDownloadType(null)
  }

  // Auto-calcular la medida faltante cuando se mantiene proporción y solo hay un campo definido
  useLayoutEffect(() => {
    // Validaciones más estrictas para evitar race conditions
    if (!keepAspectRatio) return
    if (imageDimensions.width <= 0 || imageDimensions.height <= 0) return
    
    // Solo procesar si tenemos exactamente uno de los dos campos
    const w = parseFloat(targetWidthCm || "")
    const h = parseFloat(targetHeightCm || "")
    const hasValidW = targetWidthCm && targetWidthCm.trim() !== "" && !isNaN(w) && w > 0
    const hasValidH = targetHeightCm && targetHeightCm.trim() !== "" && !isNaN(h) && h > 0
    
    // Auto-calcular solo si tenemos exactamente un campo válido
    // NO sobreescribir si el usuario está actualmente editando el campo objetivo
    if (hasValidW && !hasValidH) {
      if (editingDimension === 'height') return
      const aspect = imageDimensions.height / imageDimensions.width
      const calculatedHeight = (w * aspect).toFixed(2)
      if (targetHeightCm !== calculatedHeight) {
        setTargetHeightCm(calculatedHeight)
      }
    } else if (!hasValidW && hasValidH) {
      if (editingDimension === 'width') return
      const aspect = imageDimensions.width / imageDimensions.height
      const calculatedWidth = (h * aspect).toFixed(2)
      if (targetWidthCm !== calculatedWidth) {
        setTargetWidthCm(calculatedWidth)
      }
    }
  }, [keepAspectRatio, imageDimensions.width, imageDimensions.height, targetWidthCm, targetHeightCm, editingDimension])

  // Fallback para re-establecer dimensiones si hay imagen pero dimensiones en 0 (problema de hidratación)
  useEffect(() => {
    if (processedImageSrc && imageDimensions.width === 0 && imageDimensions.height === 0) {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const newDimensions = { width: img.width, height: img.height }
        setImageDimensions(newDimensions)
      }
      img.onerror = () => {
        console.warn('⚠️ Error al recargar imagen para dimensiones en PosterGenerator')
      }
      img.src = processedImageSrc
    }
  }, [processedImageSrc, imageDimensions.width, imageDimensions.height])

  const generatePdf = async (fileName: string) => {
    if (!validateInputs() || !grid || !processedImageSrc) return
    
    setIsProcessing(true)
    const finalFileName = fileName ? `${fileName}.pdf` : `${templateTitle || 'poster'}.pdf`

    try {
      const { default: jsPDF } = await import('jspdf')
      const { saveAs } = await import('file-saver')
      const image = new window.Image()
      image.crossOrigin = "Anonymous"
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Error al cargar la imagen')); image.src = processedImageSrc! })
      
      const allSlices = await generateSlices(image, grid, 0.92)

      const doc = new jsPDF({
        orientation: orientation,
        unit: 'cm',
        format: paperSize.toLowerCase()
      })

      doc.deletePage(1)
      
      const paperDim = paperSizes[paperSize]
      let pageW, pageH
      if (orientation === 'portrait') {
          pageW = paperDim.width
          pageH = paperDim.height
      } else {
          pageW = paperDim.height
          pageH = paperDim.width
      }
      
      const finalWidthCm = parseFloat(targetWidthCm)
      const finalHeightCm = parseFloat(targetHeightCm)
      const sliceWidthCm = finalWidthCm / grid.cols
      const sliceHeightCm = finalHeightCm / grid.rows
      
      const pagesToInclude = Array.from(selectedPages).sort((a,b) => a - b)
      const totalPages = pagesToInclude.length
      let pageCounter = 0

      pagesToInclude.forEach((index) => {
        pageCounter++
        const dataUrl = allSlices[index]
        doc.addPage(paperSize.toLowerCase(), orientation)
        
        const row = Math.floor(index / grid.cols)
        const col = index % grid.cols

        const bleedL = (includeBleed && col > 0) ? BLEED_CM : 0
        const bleedT = (includeBleed && row > 0) ? BLEED_CM : 0

        const imgW = sliceWidthCm + bleedL + ((includeBleed && col < grid.cols - 1) ? BLEED_CM : 0)
        const imgH = sliceHeightCm + bleedT + ((includeBleed && row < grid.rows - 1) ? BLEED_CM : 0)

        const x = MARGIN_CM - bleedL
        const y = MARGIN_CM - bleedT
        
        doc.addImage(dataUrl, 'JPEG', x, y, imgW, imgH)
        
        if (includeCutGuides) {
            doc.setLineWidth(0.01)
            doc.setDrawColor(180)
            doc.setLineDashPattern([0.1, 0.1], 0)

            const x1_cut = MARGIN_CM
            const y1_cut = MARGIN_CM
            const x2_cut = MARGIN_CM + sliceWidthCm
            const y2_cut = MARGIN_CM + sliceHeightCm

            if (row > 0) doc.line(x1_cut, y1_cut, x2_cut, y1_cut)
            if (col < grid.cols - 1) doc.line(x2_cut, y1_cut, x2_cut, y2_cut)
            if (row < grid.rows - 1) doc.line(x1_cut, y2_cut, x2_cut, y2_cut)
            if (col > 0) doc.line(x1_cut, y1_cut, x1_cut, y2_cut)
        }

        doc.setFontSize(8)
        doc.setTextColor(150)
        const pageNumText = `Hoja ${pageCounter} de ${totalPages}`
        const textWidth = doc.getTextWidth(pageNumText)
        doc.text(pageNumText, pageW - MARGIN_CM - textWidth, pageH - 0.5)

        const coordText = `Fila ${row + 1}, Columna ${col + 1} (${String.fromCharCode(65 + col)}${row + 1})`
        doc.text(coordText, MARGIN_CM, pageH - 0.5)
      })

      // Add assembly plan if enabled and multiple pages
      if (includeAssemblyPlan && grid.cols * grid.rows > 1) {
        doc.addPage(paperSize.toLowerCase(), 'portrait')
        const planPageDimensions = paperSizes[paperSize]
        const planPageW = planPageDimensions.width
        const planPageH = planPageDimensions.height
        const planMargin = 2
        let currentY = planMargin

        doc.setFontSize(16)
        doc.text("Plano de Armado", planPageW / 2, currentY, { align: 'center' })
        currentY += 0.8
        
        doc.setFontSize(10)
        doc.setTextColor(100)
        const dimensionsText = `Tamaño Final: ${finalWidthCm.toFixed(2)} cm de ancho x ${finalHeightCm.toFixed(2)} cm de alto`
        doc.text(dimensionsText, planPageW / 2, currentY, { align: 'center' })
        currentY += 1.2

        const maxPlanHeight = planPageH * 0.55
        const availableWidthForPlan = planPageW - 2 * planMargin
        const planAspectRatio = finalWidthCm / finalHeightCm
        let planDisplayW = availableWidthForPlan
        let planDisplayH = planDisplayW / planAspectRatio

        if (planDisplayH > maxPlanHeight) {
            planDisplayH = maxPlanHeight
            planDisplayW = planDisplayH * planAspectRatio
        }

        const planX = (planPageW - planDisplayW) / 2
        
        doc.setDrawColor(0)
        doc.rect(planX, currentY, planDisplayW, planDisplayH)

        const cellW = planDisplayW / grid.cols
        const cellH = planDisplayH / grid.rows

        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                const cellX = planX + c * cellW
                const cellY = currentY + r * cellH
                doc.setDrawColor(150)
                doc.setLineDashPattern([0.1, 0.1], 0)
                doc.setLineWidth(0.02)
                doc.rect(cellX, cellY, cellW, cellH)
                
                doc.setFontSize(12)
                doc.setTextColor(255)
                const coord = `${String.fromCharCode(65 + c)}${r + 1}`
                const textW = doc.getTextWidth(coord)
                doc.setFillColor(0, 0, 0, 0.5)
                doc.rect(cellX + cellW/2 - textW/2 - 0.1, cellY + cellH/2 - 0.3, textW + 0.2, 0.5, 'F')
                doc.text(coord, cellX + cellW/2, cellY + cellH/2, { align: 'center', baseline: 'middle' })
            }
        }
      }

      const pdfBlob = doc.output('blob')
      saveAs(pdfBlob, finalFileName)
      
      // Abrir el PDF en una nueva pestaña automáticamente
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const newWindow = window.open(pdfUrl, '_blank')
      
      if (!newWindow) {
        toast.warning("Vista previa bloqueada", {
          description: "Tu navegador bloqueó la vista previa del PDF. El archivo ya se descargó.",
        })
      }
      
      // Limpiar la URL después de un tiempo para liberar memoria
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 60000)
      
      // Mostrar modal de opciones post-descarga
      handleDownloadComplete(finalFileName, 'pdf', pdfBlob)

      // También mostrar toast con información específica para iOS
      const iosInstructions = isIOS() ? (
        <div className="space-y-2">
          <p className="font-medium">📱 <strong>En iPhone/iPad:</strong></p>
          <p className="text-xs">1. Toca el botón de compartir (cuadrado con flecha) en la parte inferior</p>
          <p className="text-xs">2. Selecciona "Guardar en Archivos" o "Guardar en iCloud Drive"</p>
          <p className="text-xs">3. Elige la ubicación donde quieres guardar tu archivo</p>
          <p className="text-xs font-medium text-primary">💡 También puedes compartir directamente con otras apps</p>
        </div>
      ) : null

      toast.success("✅ ¡PDF Descargado exitosamente!", {
          description: iosInstructions || (
            <div className="space-y-2">
              <p className="font-medium">📁 Archivo guardado: <code className="bg-muted px-1 py-0.5 rounded text-sm">{finalFileName}</code></p>
              <p className="text-sm text-muted-foreground">
                Revisa tu carpeta de "Descargas" o la ubicación predeterminada de tu navegador.
                <br />
                <strong>💡 Tip:</strong> Si no lo encuentras, busca por "{finalFileName}" en tu explorador de archivos.
              </p>
            </div>
          ),
          duration: 10000,
      })

    } catch (error) {
      console.error(error)
      toast.error("Error al generar PDF", {
        description: "Hubo un problema al crear el archivo. Inténtalo de nuevo.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const generateZip = async (fileName: string) => {
    if (!validateInputs() || !grid || !processedImageSrc) return
    
    setIsProcessing(true)
    const finalFileName = fileName ? `${fileName}.zip` : `${templateTitle || 'poster'}-imagenes.zip`

    try {
        const JSZip = (await import('jszip')).default
        const { saveAs } = await import('file-saver')
        const image = new window.Image()
        image.crossOrigin = "Anonymous"
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Error al cargar la imagen')); image.src = processedImageSrc! })
        
        const allSlices = await generateSlices(image, grid, 0.92)
        const zip = new JSZip()

        const pagesToInclude = Array.from(selectedPages).sort((a,b) => a - b)
        
        pagesToInclude.forEach(index => {
            const dataUrl = allSlices[index]
            const row = Math.floor(index / grid.cols)
            const col = index % grid.cols
            const coord = `${String.fromCharCode(65 + col)}${row + 1}`
            zip.file(`hoja_${coord}.jpg`, dataUrl.split(',')[1], { base64: true })
        })

        const zipBlob = await zip.generateAsync({ type: 'blob' })
        
        saveAs(zipBlob, finalFileName)
        
        // Mostrar modal de opciones post-descarga
        handleDownloadComplete(finalFileName, 'zip', zipBlob)

        // Toast con información específica para iOS
        const iosInstructions = isIOS() ? (
          <div className="space-y-2">
            <p className="font-medium">📱 <strong>En iPhone/iPad:</strong></p>
            <p className="text-xs">1. Toca el botón de compartir (cuadrado con flecha) en la parte inferior</p>
            <p className="text-xs">2. Selecciona "Guardar en Archivos" o "Guardar en iCloud Drive"</p>
            <p className="text-xs">3. Elige la ubicación donde quieres guardar tu archivo</p>
            <p className="text-xs font-medium text-primary">💡 También puedes compartir directamente con otras apps</p>
          </div>
        ) : null

        toast.success("✅ ¡ZIP Descargado exitosamente!", {
          description: iosInstructions || (
            <div className="space-y-2">
              <p className="font-medium">📁 Archivo guardado: <code className="bg-muted px-1 py-0.5 rounded text-sm">{finalFileName}</code></p>
              <p className="text-sm text-muted-foreground">
                Revisa tu carpeta de "Descargas" o la ubicación predeterminada de tu navegador.
                <br />
                <strong>💡 Tip:</strong> El ZIP contiene {pagesToInclude.length} imagen{pagesToInclude.length > 1 ? 'es' : ''} lista{pagesToInclude.length > 1 ? 's' : ''} para imprimir.
              </p>
            </div>
          ),
          duration: 10000,
        })

    } catch (error) {
        console.error(error)
        toast.error("Error al generar ZIP", {
            description: "Hubo un problema al crear el archivo. Inténtalo de nuevo.",
        })
    } finally {
        setIsProcessing(false)
    }
  }

  const togglePageSelection = (index: number) => {
    setSelectedPages(prev => {
        const newSelection = new Set(prev)
        if (newSelection.has(index)) {
            newSelection.delete(index)
        } else {
            newSelection.add(index)
        }
        return newSelection
    })
  }

  const toggleSelectAll = () => {
    if (!grid) return
    if (selectedPages.size === grid.cols * grid.rows) {
        setSelectedPages(new Set())
    } else {
        const allPages = new Set<number>()
        for (let i = 0; i < grid.cols * grid.rows; i++) {
            allPages.add(i)
        }
        setSelectedPages(allPages)
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep => Math.max(currentStep - 1, 0))
  }

  const nextStep = () => {
    setCurrentStep(currentStep => Math.min(currentStep + 1, steps.length - 1))
  }

  const isNextStepDisabled = () => {
    if(currentStep === 0 && !processedImageSrc) return true
    if(currentStep === 1 && (!targetWidthCm || !targetHeightCm)) return true
    return false
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-6xl mx-auto">
        {showTitle && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {templateTitle ? `Generar Poster: ${templateTitle}` : 'Generador de Posters'}
            </h2>
            <p className="text-muted-foreground">
              Configura el tamaño y descarga tu diseño listo para imprimir
            </p>
          </div>
        )}

        {/* Stepper */}
        <div className="mb-6">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            
            {/* Step 0: Image Upload Section */}
            {currentStep === 0 && showImageUpload && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">📷 Subir Imagen</h3>
                <div className={`flex flex-col gap-4 items-center justify-center min-h-[200px] border-2 border-dashed rounded-lg p-6 bg-muted/50 transition-colors duration-150 ${
                  isProcessing ? 'border-primary bg-primary/5' : ''
                }`}>
                  <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                  
                  {processedImageSrc ? (
                    <div className="text-center w-full">
                      <img src={processedImageSrc} alt="Preview" className="max-w-full max-h-[400px] object-contain rounded mx-auto shadow-md" />
                      
                      {/* Vista previa info */}
                      <div className="mb-4 p-2 sm:p-3 rounded-md border bg-muted/40 flex items-center gap-3 mt-4">
                        <div className="w-16 h-16 bg-background rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                          <img
                            src={processedImageSrc}
                            alt="Vista previa"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Vista previa</p>
                          {imageDimensions.width && imageDimensions.height ? (
                            <p className="text-xs text-muted-foreground truncate">
                              {imageDimensions.width} × {imageDimensions.height} px
                            </p>
                          ) : null}
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button variant="outline" size="sm" onClick={() => setIsCropModalOpen(true)}>
                            <CropIcon className="h-4 w-4 mr-2" />
                            Recortar
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleSelectImageClick}>
                            <Upload className="h-4 w-4 mr-2" />
                            Cambiar
                          </Button>
                        </div>
                      </div>

                      {/* Botón continuar */}
                      <Button 
                        size="lg" 
                        onClick={nextStep}
                        className="mt-4"
                      >
                        Continuar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                      <Button 
                        size="lg" 
                        onClick={handleSelectImageClick} 
                        disabled={isProcessing}
                      >
                        {isImageLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            Abriendo...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" /> 
                            Seleccionar imagen
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-muted-foreground text-center">
                        Formatos: JPG, PNG
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 1 y 2: Configuración y Vista Previa */}
            {currentStep >= 1 && processedImageSrc && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Size Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">📐 Configuración de Tamaño</h3>
                    
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="keep-aspect" 
                            checked={keepAspectRatio} 
                            onCheckedChange={(checked) => {
                              const newValue = Boolean(checked)
                              setKeepAspectRatio(newValue)
                              // Si se activa "mantener proporción" y hay ambos valores, recalcular el alto basado en el ancho
                              if (newValue && targetWidthCm && targetHeightCm && imageDimensions.width > 0) {
                                const w = parseFloat(targetWidthCm)
                                if (!isNaN(w) && w > 0) {
                                  const aspectRatio = imageDimensions.height / imageDimensions.width
                                  const newHeight = (w * aspectRatio).toFixed(2)
                                  setTargetHeightCm(newHeight)
                                }
                              }
                            }} 
                          />
                          <Label htmlFor="keep-aspect">Mantener proporción</Label>
                        </div>

                        {/* Advertencia si las proporciones no coinciden */}
                        {keepAspectRatio && targetWidthCm && targetHeightCm && imageDimensions.width > 0 && imageDimensions.height > 0 && (() => {
                          const w = parseFloat(targetWidthCm)
                          const h = parseFloat(targetHeightCm)
                          if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                            const imageAspect = imageDimensions.height / imageDimensions.width
                            const currentAspect = h / w
                            const diff = Math.abs(imageAspect - currentAspect) / imageAspect
                            // Si la diferencia es mayor al 5%, mostrar advertencia
                            if (diff > 0.05) {
                              const correctHeight = (w * imageAspect).toFixed(2)
                              return (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                  <div className="text-xs text-amber-800">
                                    <p className="font-medium mb-1">⚠️ Proporción incorrecta</p>
                                    <p>Tu imagen se deformará. Para respetar la proporción original ({imageDimensions.width}×{imageDimensions.height}px), el alto debería ser <strong>{correctHeight} cm</strong>.</p>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="mt-2 h-7 text-xs"
                                      onClick={() => setTargetHeightCm(correctHeight)}
                                    >
                                      Corregir automáticamente
                                    </Button>
                                  </div>
                                </div>
                              )
                            }
                          }
                          return null
                        })()}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="width">Ancho (cm)</Label>
                            <Input
                              id="width"
                              type="text"
                              inputMode="decimal"
                              value={targetWidthCm}
                              onChange={(e) => handleDimensionChange(e.target.value, 'width')}
                              onFocus={() => setEditingDimension('width')}
                              onBlur={() => setEditingDimension(null)}
                              placeholder="Ej: 100"
                            />
                          </div>
                          <div>
                            <Label htmlFor="height">Alto (cm)</Label>
                            <Input
                              id="height"
                              type="text"
                              inputMode="decimal"
                              value={targetHeightCm}
                              onChange={(e) => handleDimensionChange(e.target.value, 'height')}
                              onFocus={() => setEditingDimension('height')}
                              onBlur={() => setEditingDimension(null)}
                              placeholder="Ej: 70"
                            />
                          </div>
                        </div>
                      </div>

                    {/* Paper Settings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="paper-size">Tamaño de papel</Label>
                        <Select value={paperSize} onValueChange={(value) => setPaperSize(value as PaperSize)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Letter">Letter</SelectItem>
                            <SelectItem value="Legal">Legal</SelectItem>
                            <SelectItem value="Tabloid">Tabloid</SelectItem>
                            <SelectItem value="A4">A4</SelectItem>
                            <SelectItem value="A3">A3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="orientation">Orientación</Label>
                        <Select value={orientation} onValueChange={(value) => setOrientation(value as Orientation)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">Vertical</SelectItem>
                            <SelectItem value="landscape">Horizontal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="cut-guides" checked={includeCutGuides} onCheckedChange={(checked) => setIncludeCutGuides(Boolean(checked))} />
                        <Label htmlFor="cut-guides">✂️ Líneas de corte</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="bleed" checked={includeBleed} onCheckedChange={(checked) => setIncludeBleed(Boolean(checked))} />
                        <Label htmlFor="bleed">🎨 Sangrado (para pegado perfecto)</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="assembly" checked={includeAssemblyPlan} onCheckedChange={(checked) => setIncludeAssemblyPlan(Boolean(checked))} />
                        <Label htmlFor="assembly">📋 Plano de armado</Label>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">👁️ Vista Previa</h3>
                    
                    {grid && grid.cols * grid.rows > 1 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground p-3 bg-muted rounded-md">
                          <div className='flex items-center gap-2'>
                            <Layers className="h-4 w-4" />
                            <span>
                              <strong>{grid.cols * grid.rows} hojas</strong> ({selectedPages.size} seleccionadas) en <strong>{orientation === 'portrait' ? 'vertical' : 'horizontal'}</strong>
                            </span>
                          </div>
                          <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                            <CheckSquare className='mr-2 h-4 w-4'/>
                            {selectedPages.size === grid.cols * grid.rows ? 'Deseleccionar todo' : 'Seleccionar todo'}
                          </Button>
                        </div>
                        
                        {/* Vista previa con imagen completa y grid superpuesto */}
                        <div className="bg-muted/50 rounded-lg flex items-center justify-center p-4 border-2 border-dashed relative min-h-[300px]">
                          {/* Indicadores de medidas */}
                          {targetWidthCm && targetHeightCm && (
                            <>
                              <div className="absolute top-1/2 -left-3 -translate-y-1/2 -rotate-90 origin-bottom-left bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-t-md flex items-center gap-1 z-10 pointer-events-none">
                                <Ruler className="h-3 w-3" />
                                <span>{targetHeightCm} cm</span>
                              </div>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-b-md flex items-center gap-1 z-10 pointer-events-none">
                                <Ruler className="h-3 w-3" />
                                <span>{targetWidthCm} cm</span>
                              </div>
                            </>
                          )}
                          
                          {/* Imagen con grid superpuesto */}
                          <div 
                            className="relative w-full"
                            style={{ 
                              aspectRatio: (imageDimensions.width > 0 && imageDimensions.height > 0) 
                                ? imageDimensions.width / imageDimensions.height 
                                : '4 / 3',
                              maxHeight: '500px'
                            }}
                          >
                            {processedImageSrc ? (
                              <>
                                {/* Imagen de fondo */}
                                <img 
                                  src={processedImageSrc} 
                                  alt="Vista previa" 
                                  className="w-full h-full object-contain"
                                />
                                
                                {/* Grid superpuesto con celdas clickeables */}
                                <div
                                  className="absolute inset-0 grid"
                                  style={{
                                    gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
                                    gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
                                  }}
                                >
                                  {Array.from({ length: grid.cols * grid.rows }).map((_, i) => {
                                    const row = Math.floor(i / grid.cols)
                                    const col = i % grid.cols
                                    const coord = `${String.fromCharCode(65 + col)}${row + 1}`
                                    const isSelected = selectedPages.has(i)
                                    
                                    return (
                                      <div 
                                        key={i} 
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Hoja ${coord}, ${isSelected ? 'seleccionada' : 'no seleccionada'}`}
                                        className="relative flex items-center justify-center group transition-colors border-dashed border-black/30 dark:border-white/20 cursor-pointer"
                                        style={{
                                          borderRightWidth: (col === grid.cols - 1) ? 0 : '2px',
                                          borderBottomWidth: (row === grid.rows - 1) ? 0 : '2px',
                                        }}
                                        onClick={() => togglePageSelection(i)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePageSelection(i) } }}
                                      >
                                        {/* Overlay para hojas NO seleccionadas */}
                                        <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-transparent' : 'bg-red-500/70'}`} />
                                        
                                        {/* Ícono de prohibido cuando no está seleccionada */}
                                        {!isSelected && <Ban className="relative h-1/3 w-1/3 text-white/80 z-10" />}
                                        
                                        {/* Etiqueta de coordenada */}
                                        <div className='absolute top-1 right-1 z-10'>
                                          <span className={`relative text-xs font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                                            isSelected ? 'bg-primary/90 text-primary-foreground' : 'bg-red-600 text-white'
                                          }`}>
                                            {coord}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </>
                            ) : (
                              <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full">
                                <ImageIcon className="mx-auto h-12 w-12" />
                                <p className="mt-2">Aquí verás la vista previa de tu imagen.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground border rounded-lg p-4 bg-muted/50">
                        {grid?.cols === 1 && grid?.rows === 1 
                          ? "Tu poster cabe en una sola hoja 🎉" 
                          : "Configura el tamaño para ver la vista previa"
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Navegación entre steps */}
                {currentStep === 1 && (
                  <div className="mt-6 pt-6 border-t flex gap-4 justify-between">
                    <Button variant="outline" onClick={prevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button 
                      onClick={nextStep}
                      disabled={isNextStepDisabled()}
                    >
                      Siguiente
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Download Section - Solo en Step 2 */}
                {currentStep === 2 && targetWidthCm && targetHeightCm && (
                  <>
                    <div className="mt-6 pt-6 border-t">
                      <Button variant="outline" onClick={prevStep} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Anterior
                      </Button>
                    </div>
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4">📥 Descargar</h3>
                      <div className="flex gap-4 justify-center">
                      <Button 
                        size="lg" 
                        onClick={() => handleDownloadRequest('pdf')}
                        disabled={isProcessing || !grid || selectedPages.size === 0}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="mr-2 h-4 w-4" />
                        )}
                        Descargar PDF
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => handleDownloadRequest('zip')}
                        disabled={isProcessing || !grid || selectedPages.size === 0}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Package className="mr-2 h-4 w-4" />
                        )}
                        Descargar ZIP
                      </Button>
                    </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Crop Modal */}
        {isCropModalOpen && originalImageSrc && (
          <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Recortar imagen</DialogTitle>
                <DialogDescription>
                  Puedes recortar la imagen o usar la imagen completa. El recorte te ayuda a enfocar en la parte más importante.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-auto max-h-[60vh]">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={undefined}
                  className="max-w-full"
                >
                  <img
                    ref={cropImgRef}
                    alt="Crop me"
                    src={originalImageSrc}
                    style={{ maxHeight: '50vh', maxWidth: '100%' }}
                    onLoad={onImageLoadForCrop}
                  />
                </ReactCrop>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleSkipCrop}>
                  Usar imagen completa
                </Button>
                <Button onClick={showCroppedImage}>
                  Aplicar recorte
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* File Name Dialog */}
        {isFileNameDialogOpen && (
          <Dialog open={isFileNameDialogOpen} onOpenChange={setIsFileNameDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nombre del archivo</DialogTitle>
                <DialogDescription>
                  ¿Cómo quieres llamar a tu {downloadType === 'pdf' ? 'PDF' : 'ZIP'}?
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Nombre del proyecto</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={templateTitle || "mi-poster"}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFileNameDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmDownload}>
                  Descargar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Download Complete Modal */}
        {isDownloadCompleteModalOpen && downloadCompleteInfo && (
          <Dialog open={isDownloadCompleteModalOpen} onOpenChange={setIsDownloadCompleteModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ¡Descarga completada!
                </DialogTitle>
                <DialogDescription>
                  Tu {downloadCompleteInfo.fileType.toUpperCase()} se ha generado correctamente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium">📁 Archivo: <code className="bg-background px-2 py-1 rounded text-sm">{downloadCompleteInfo.fileName}</code></p>
                  {downloadCompleteInfo.fileType === 'zip' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Contiene {selectedPages.size} imagen{selectedPages.size > 1 ? 'es' : ''} lista{selectedPages.size > 1 ? 's' : ''} para imprimir
                    </p>
                  )}
                </div>

                {isIOS() && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📱 Instrucciones para iPhone/iPad:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Toca el botón de compartir (cuadrado con flecha) en la parte inferior</li>
                      <li>Selecciona "Guardar en Archivos" o "Guardar en iCloud Drive"</li>
                      <li>Elige la ubicación donde quieres guardar tu archivo</li>
                    </ol>
                    <p className="text-sm text-blue-700 mt-2 font-medium">
                      💡 También puedes compartir directamente con otras apps
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadAgain}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar de nuevo
                  </Button>
                  
                  {typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && downloadCompleteInfo.blob && (
                    <Button 
                      onClick={handleShareFile}
                      className="flex-1"
                    >
                      <Share className="mr-2 h-4 w-4" />
                      Compartir archivo
                    </Button>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsDownloadCompleteModalOpen(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  )
}
