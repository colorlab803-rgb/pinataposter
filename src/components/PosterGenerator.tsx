'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { toast } from 'sonner'
import { trackGeneratorUse } from '@/components/TrackVisit'
import { useAuth } from '@/components/AuthProvider'
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

import { Upload, Ruler, FileDown, Loader2, Image as ImageIcon, AlertTriangle, Layers, Crop as CropIcon, CheckCircle2, CheckSquare, Ban, Package, Download, ArrowRight, ArrowLeft, Share, ScanSearch, FilePlus2 } from "lucide-react"
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
import autoCrop from '@/lib/autoCrop'
import { useIsMobile } from '@/lib/useIsMobile'

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
  // Props de control externo para MoldeIA
  controlledWidth?: string
  controlledHeight?: string
  controlledPaperSize?: PaperSize
  controlledOrientation?: Orientation
  externalProcessedImageSrc?: string | null
  onProcessedImageChange?: (src: string | null) => void
  onImageDimensionsChange?: (dims: { width: number; height: number }) => void
  triggerDownload?: { format: 'pdf' | 'zip'; projectName?: string } | null
}

export function PosterGenerator({ 
  initialImageSrc, 
  templateTitle,
  onImageChange,
  showImageUpload = true,
  showTitle = true,
  controlledWidth,
  controlledHeight,
  controlledPaperSize,
  controlledOrientation,
  externalProcessedImageSrc,
  onProcessedImageChange,
  onImageDimensionsChange,
  triggerDownload,
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

  // Auto-crop state
  const [isAutoCropping, setIsAutoCropping] = useState(false)

  // Daily usage limit state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { user, getIdToken } = useAuth()

  const checkDailyLimit = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    try {
      const token = await getIdToken()
      if (!token) return false
      const res = await fetch('/api/molde-usage', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!data.allowed) {
        setShowUpgradeModal(true)
        return false
      }
      return true
    } catch {
      // Si falla la verificación, permitir por cortesía
      return true
    }
  }, [user, getIdToken])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }

  /** En móvil, intenta compartir el archivo con la Web Share API nativa */
  const shareFileNative = async (blob: Blob, fileName: string, fileType: 'pdf' | 'zip'): Promise<boolean> => {
    try {
      if (navigator.share && navigator.canShare) {
        const mimeType = fileType === 'pdf' ? 'application/pdf' : 'application/zip'
        const file = new File([blob], fileName, { type: mimeType })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Mi ${fileType.toUpperCase()} de PiñataPoster`,
            files: [file]
          })
          return true
        }
      }
    } catch (err: unknown) {
      // Si el usuario cancela el share, no es un error real
      if (err instanceof Error && err.name === 'AbortError') return true
      console.warn('Web Share API no disponible o falló:', err)
    }
    return false
  }

  const handleDownloadComplete = (fileName: string, fileType: 'pdf' | 'zip', blob: Blob) => {
    trackGeneratorUse('download')
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
    try {
      const fileSaverModule = await import('file-saver')
      const saveAs = (fileSaverModule as any)?.saveAs ?? (fileSaverModule as any)?.default?.saveAs ?? (fileSaverModule as any)?.default
      if (typeof saveAs !== 'function') throw new Error('saveAs no disponible')
      saveAs(downloadCompleteInfo.blob, downloadCompleteInfo.fileName)
      toast.success("Descargado nuevamente", {
        description: `Se descargó ${downloadCompleteInfo.fileName} otra vez.`
      })
    } catch {
      toast.error("Error al descargar", {
        description: "No se pudo descargar el archivo. Inténtalo de nuevo."
      })
    }
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

  // Sincronización de props externas (MoldeIA)
  useEffect(() => {
    if (controlledWidth !== undefined) setTargetWidthCm(controlledWidth)
  }, [controlledWidth])

  useEffect(() => {
    if (controlledHeight !== undefined) setTargetHeightCm(controlledHeight)
  }, [controlledHeight])

  useEffect(() => {
    if (controlledPaperSize !== undefined) setPaperSize(controlledPaperSize)
  }, [controlledPaperSize])

  useEffect(() => {
    if (controlledOrientation !== undefined) setOrientation(controlledOrientation)
  }, [controlledOrientation])

  useEffect(() => {
    if (externalProcessedImageSrc !== undefined && externalProcessedImageSrc !== null) {
      setProcessedImageSrc(externalProcessedImageSrc)
      const preload = new window.Image()
      preload.onload = () => setImageDimensions({ width: preload.width, height: preload.height })
      preload.src = externalProcessedImageSrc
    }
  }, [externalProcessedImageSrc])

  useEffect(() => {
    if (onProcessedImageChange) {
      onProcessedImageChange(processedImageSrc)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedImageSrc])

  useEffect(() => {
    if (onImageDimensionsChange && imageDimensions.width > 0 && imageDimensions.height > 0) {
      onImageDimensionsChange(imageDimensions)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageDimensions])

  useEffect(() => {
    if (triggerDownload?.format) {
      if (triggerDownload.projectName) {
        // Auto-descarga (MoldeIA) — reintentar si el generador no está listo
        let attempts = 0
        const maxAttempts = 10
        const attempt = () => {
          attempts++
          if (processedImageSrc && grid && targetWidthCm && targetHeightCm && selectedPages.size > 0) {
            if (triggerDownload.format === 'pdf') generatePdf(triggerDownload.projectName!)
            else generateZip(triggerDownload.projectName!)
          } else if (attempts < maxAttempts) {
            setTimeout(attempt, 500)
          }
        }
        attempt()
      } else {
        handleDownloadRequest(triggerDownload.format)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerDownload])

  // Verificar rate-limit al montar el componente — deshabilitado (sin auth)

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
        trackGeneratorUse('upload')
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

  const handleAutoCrop = async () => {
    if (!processedImageSrc) return
    setIsAutoCropping(true)

    try {
      const cropped = await autoCrop(processedImageSrc)

      if (!cropped) {
        toast.info('Sin cambios', {
          description: 'No se detectaron zonas vacías para eliminar.',
        })
        return
      }

      setProcessedImageSrc(cropped)

      // Actualizar dimensiones
      const img = new window.Image()
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
        toast.success('✂️ Autorecorte aplicado', {
          description: `Imagen recortada a ${img.width} × ${img.height} px (sin zonas vacías).`,
        })
      }
      img.src = cropped
    } catch {
      toast.error('Error al autorecortar', {
        description: 'No se pudo procesar la imagen. Inténtalo de nuevo.',
      })
    } finally {
      setIsAutoCropping(false)
    }
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
    // Usar ratios separados por eje para soportar dimensiones no proporcionales
    const pxPerCmX = image.width / finalWidthCm
    const pxPerCmY = image.height / finalHeightCm
    
    const sliceWidthCm = finalWidthCm / grid.cols
    const sliceHeightCm = finalHeightCm / grid.rows

    const bleedXPx = includeBleed ? BLEED_CM * pxPerCmX : 0
    const bleedYPx = includeBleed ? BLEED_CM * pxPerCmY : 0
    
    const slices = []
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          slices.push('')
          continue
        }
        
        const bleedL = (c > 0) ? bleedXPx : 0
        const bleedR = (c < grid.cols - 1) ? bleedXPx : 0
        const bleedT = (r > 0) ? bleedYPx : 0
        const bleedB = (r < grid.rows - 1) ? bleedYPx : 0

        // Dimensiones nominales del canvas (sin clipping)
        const nominalW = sliceWidthCm * pxPerCmX + bleedL + bleedR
        const nominalH = sliceHeightCm * pxPerCmY + bleedT + bleedB

        // Posición de origen en la imagen (con bleed)
        const origSx = c * sliceWidthCm * pxPerCmX - bleedL
        const origSy = r * sliceHeightCm * pxPerCmY - bleedT

        let sx = origSx
        let sy = origSy
        let sWidth = nominalW
        let sHeight = nominalH

        // Limitar a los bordes de la imagen para evitar coordenadas fuera de rango
        if (sx < 0) { sWidth += sx; sx = 0 }
        if (sy < 0) { sHeight += sy; sy = 0 }
        if (sx + sWidth > image.width) sWidth = image.width - sx
        if (sy + sHeight > image.height) sHeight = image.height - sy

        canvas.width = Math.round(nominalW)
        canvas.height = Math.round(nominalH)
        
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Offset en destino para compensar el clipping (evita estiramiento)
        const dx = sx - origSx
        const dy = sy - origSy

        ctx.drawImage(
            image,
            sx, sy, sWidth, sHeight,
            dx, dy, sWidth, sHeight
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

    // Verificar límite diario antes de permitir la descarga
    const allowed = await checkDailyLimit()
    if (!allowed) return

    setDownloadType(type)
    setIsFileNameDialogOpen(true)
  }

  const handleConfirmDownload = async () => {
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
      const jspdfModule = await import('jspdf')
      const jsPDF = (jspdfModule as any)?.default?.default ?? (jspdfModule as any)?.default ?? (jspdfModule as any)?.jsPDF
      if (typeof jsPDF !== 'function') {
        throw new Error('jsPDF no disponible (módulo inesperado)')
      }

      const fileSaverModule = await import('file-saver')
      const saveAs = (fileSaverModule as any)?.saveAs ?? (fileSaverModule as any)?.default?.saveAs ?? (fileSaverModule as any)?.default
      if (typeof saveAs !== 'function') {
        throw new Error('saveAs no disponible (módulo inesperado)')
      }

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
        if (!dataUrl) {
          return
        }
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

        // Branding sutil en el margen superior
        doc.setFontSize(6.5)
        doc.setTextColor(180)
        const brandHint = 'PiñataPoster.com'
        const brandHintW = doc.getTextWidth(brandHint)
        doc.text(brandHint, pageW / 2 - brandHintW / 2, 0.4)
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
        doc.setTextColor(0)
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

        // Dibujar la imagen de fondo con opacidad reducida
        try {
          const thumbCanvas = document.createElement('canvas')
          const thumbCtx = thumbCanvas.getContext('2d')
          if (thumbCtx) {
            thumbCanvas.width = image.naturalWidth
            thumbCanvas.height = image.naturalHeight
            thumbCtx.globalAlpha = 0.35
            thumbCtx.drawImage(image, 0, 0)
            const thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.7)
            doc.addImage(thumbDataUrl, 'JPEG', planX, currentY, planDisplayW, planDisplayH)
          }
        } catch {
          // Si falla la imagen, seguimos sin ella
        }

        // Borde exterior
        doc.setDrawColor(0)
        doc.setLineWidth(0.04)
        doc.setLineDashPattern([], 0)
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
                const coord = `${String.fromCharCode(65 + c)}${r + 1}`
                const textW = doc.getTextWidth(coord)
                doc.setFillColor(60, 60, 60)
                doc.rect(cellX + cellW/2 - textW/2 - 0.1, cellY + cellH/2 - 0.3, textW + 0.2, 0.5, 'F')
                doc.setTextColor(255)
                doc.text(coord, cellX + cellW/2, cellY + cellH/2, { align: 'center', baseline: 'middle' })
            }
        }
      }

      // Página final con branding
      {
        doc.addPage(paperSize.toLowerCase(), 'portrait')
        const donPageDims = paperSizes[paperSize]
        const dpW = donPageDims.width
        let dy = 2.5

        doc.setFontSize(22)
        doc.setTextColor(60)
        doc.text('¡Gracias por usar PiñataPoster!', dpW / 2, dy, { align: 'center' })
        dy += 1.2

        doc.setFontSize(11)
        doc.setTextColor(120)
        doc.text('Tu molde está listo. Esperamos que quede increíble.', dpW / 2, dy, { align: 'center' })
        dy += 2.5

        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text('pinataposter.com', dpW / 2, dy, { align: 'center' })
      }

      const pdfBlob = doc.output('blob')

      if (isMobileDevice()) {
        // En móvil: usar Web Share API nativa para mejor experiencia
        const shared = await shareFileNative(pdfBlob, finalFileName, 'pdf')
        if (!shared) {
          // Fallback: descargar con saveAs si Share API no está disponible
          saveAs(pdfBlob, finalFileName)
        }
        // Mostrar modal de opciones post-descarga
        handleDownloadComplete(finalFileName, 'pdf', pdfBlob)
        toast.success("¡PDF listo!", {
          description: shared ? "Tu archivo se compartió exitosamente." : `Archivo: ${finalFileName}`,
          duration: 4000,
        })
      } else {
        // En escritorio: descargar + abrir vista previa
        saveAs(pdfBlob, finalFileName)
        
        const pdfUrl = URL.createObjectURL(pdfBlob)
        const newWindow = window.open(pdfUrl, '_blank')
        
        if (!newWindow) {
          toast.warning("Vista previa bloqueada", {
            description: "Tu navegador bloqueó la vista previa del PDF. El archivo ya se descargó.",
          })
        }
        
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl)
        }, 300000)
        
        handleDownloadComplete(finalFileName, 'pdf', pdfBlob)
        toast.success("¡PDF Descargado!", {
          description: (
            <div className="space-y-1">
              <p className="font-medium">Archivo: <code className="bg-muted px-1 py-0.5 rounded text-sm">{finalFileName}</code></p>
              <p className="text-xs text-muted-foreground">Revisa tu carpeta de Descargas.</p>
            </div>
          ),
          duration: 6000,
        })
      }

    } catch (error) {
      console.error('Error generando PDF:', error)
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      toast.error("Error al generar PDF", {
        description: `Hubo un problema al crear el archivo: ${errorMsg}`,
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
      const jszipModule = await import('jszip')
      const JSZip = (jszipModule as any)?.default ?? (jszipModule as any)?.JSZip
      if (typeof JSZip !== 'function') {
        throw new Error('JSZip no disponible (módulo inesperado)')
      }

      const fileSaverModule = await import('file-saver')
      const saveAs = (fileSaverModule as any)?.saveAs ?? (fileSaverModule as any)?.default?.saveAs ?? (fileSaverModule as any)?.default

      const image = new window.Image()
      image.crossOrigin = 'Anonymous'
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Error al cargar la imagen')); image.src = processedImageSrc! })

      const allSlices = await generateSlices(image, grid, 0.92)
      const zip = new JSZip()

      const pagesToInclude = Array.from(selectedPages).sort((a, b) => a - b)

      pagesToInclude.forEach(index => {
        const dataUrl = allSlices[index]
        if (!dataUrl) return
        const row = Math.floor(index / grid.cols)
        const col = index % grid.cols
        const coord = `${String.fromCharCode(65 + col)}${row + 1}`
        zip.file(`hoja_${coord}.jpg`, dataUrl.split(',')[1], { base64: true })
      })

        const zipBlob = await zip.generateAsync({ type: 'blob' })

        if (isMobileDevice()) {
          const shared = await shareFileNative(zipBlob, finalFileName, 'zip')
          if (!shared) {
            saveAs(zipBlob, finalFileName)
          }
          handleDownloadComplete(finalFileName, 'zip', zipBlob)
          toast.success("¡ZIP listo!", {
            description: shared 
              ? `Archivo con ${pagesToInclude.length} imagen${pagesToInclude.length > 1 ? 'es' : ''} compartido.`
              : `Archivo: ${finalFileName}`,
            duration: 4000,
          })
        } else {
          saveAs(zipBlob, finalFileName)
          handleDownloadComplete(finalFileName, 'zip', zipBlob)
          toast.success("¡ZIP Descargado!", {
            description: (
              <div className="space-y-1">
                <p className="font-medium">Archivo: <code className="bg-muted px-1 py-0.5 rounded text-sm">{finalFileName}</code></p>
                <p className="text-xs text-muted-foreground">
                  Contiene {pagesToInclude.length} imagen{pagesToInclude.length > 1 ? 'es' : ''} para imprimir.
                </p>
              </div>
            ),
            duration: 6000,
          })
        }

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
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
              {templateTitle ? `Generar Poster: ${templateTitle}` : 'Generador de Posters'}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Configura el tamaño y descarga tu diseño listo para imprimir
            </p>
          </div>
        )}

        {/* Stepper */}
        <div className="mb-4 sm:mb-6">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-3 sm:p-6">
            
            {/* Step 0: Image Upload Section */}
            {currentStep === 0 && showImageUpload && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">📷 Subir Imagen</h3>
                <div className={`flex flex-col gap-3 sm:gap-4 items-center justify-center min-h-[180px] sm:min-h-[200px] border-2 border-dashed rounded-lg p-4 sm:p-6 bg-muted/50 transition-colors duration-150 ${
                  isProcessing ? 'border-primary bg-primary/5' : ''
                }`}>
                  <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                  
                  {processedImageSrc ? (
                    <div className="text-center w-full">
                      <img src={processedImageSrc} alt="Preview" className="max-w-full max-h-[250px] sm:max-h-[400px] object-contain rounded mx-auto shadow-md" />
                      
                      {/* Vista previa info */}
                      <div className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-md border bg-muted/40 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-background rounded overflow-hidden flex items-center justify-center flex-shrink-0">
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
                        </div>
                        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto sm:flex-wrap sm:justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleAutoCrop}
                            disabled={isAutoCropping}
                            className="text-xs sm:text-sm touch-target"
                          >
                            {isAutoCropping ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                                <span className="hidden sm:inline">Detectando...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <>
                                <ScanSearch className="h-4 w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Autorecorte</span>
                                <span className="sm:hidden">Auto</span>
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setIsCropModalOpen(true)} className="text-xs sm:text-sm touch-target">
                            <CropIcon className="h-4 w-4 mr-1 sm:mr-2" />
                            Recortar
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleSelectImageClick} className="text-xs sm:text-sm touch-target">
                            <Upload className="h-4 w-4 mr-1 sm:mr-2" />
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Size Configuration */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold">📐 Configuración de Tamaño</h3>
                    
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
                            <SelectItem value="Letter">Carta</SelectItem>
                            <SelectItem value="Legal">Oficio</SelectItem>
                            <SelectItem value="Tabloid">Doble Carta</SelectItem>
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
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold">👁️ Vista Previa</h3>
                    
                    {grid && grid.cols * grid.rows > 1 ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground p-2 sm:p-3 bg-muted rounded-md">
                          <div className='flex items-center gap-2'>
                            <Layers className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              <strong>{grid.cols * grid.rows} hojas</strong> ({selectedPages.size} sel.) en <strong>{orientation === 'portrait' ? 'vertical' : 'horizontal'}</strong>
                            </span>
                          </div>
                          <Button variant="outline" size="sm" onClick={toggleSelectAll} className="w-full sm:w-auto text-xs sm:text-sm">
                            <CheckSquare className='mr-1 sm:mr-2 h-4 w-4'/>
                            {selectedPages.size === grid.cols * grid.rows ? 'Deseleccionar' : 'Seleccionar todo'}
                          </Button>
                        </div>
                        
                        {/* Vista previa con imagen completa y grid superpuesto */}
                        <div className="bg-muted/50 rounded-lg flex items-center justify-center p-2 sm:p-4 border-2 border-dashed relative min-h-[200px] sm:min-h-[300px]">
                          {/* Indicadores de medidas */}
                          {targetWidthCm && targetHeightCm && (
                            <>
                              <div className="absolute top-1/2 -left-2 sm:-left-3 -translate-y-1/2 -rotate-90 origin-bottom-left bg-primary/80 text-primary-foreground text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-t-md flex items-center gap-1 z-10 pointer-events-none">
                                <Ruler className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                <span>{targetHeightCm} cm</span>
                              </div>
                              <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 bg-primary/80 text-primary-foreground text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-b-md flex items-center gap-1 z-10 pointer-events-none">
                                <Ruler className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
                              maxHeight: '400px'
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
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t flex gap-3 sm:gap-4 justify-between">
                    <Button variant="outline" onClick={prevStep} className="touch-target">
                      <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Anterior</span>
                      <span className="sm:hidden">Atrás</span>
                    </Button>
                    <Button 
                      onClick={nextStep}
                      disabled={isNextStepDisabled()}
                      className="touch-target"
                    >
                      Siguiente
                      <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Download Section - Solo en Step 2 */}
                {currentStep === 2 && targetWidthCm && targetHeightCm && (
                  <>
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                      <Button variant="outline" onClick={prevStep} className="mb-3 sm:mb-4 touch-target">
                        <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Anterior</span>
                        <span className="sm:hidden">Atrás</span>
                      </Button>
                    </div>
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                        {isMobile ? '📲 Obtener archivo' : '📥 Descargar'}
                      </h3>
                      {isProcessing && isMobile && (
                        <div className="mb-3 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Generando tu archivo...</p>
                            <p className="text-xs text-muted-foreground">Esto puede tardar unos segundos</p>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                      <Button 
                        size="lg" 
                        onClick={() => handleDownloadRequest('pdf')}
                        disabled={isProcessing || !grid || selectedPages.size === 0}
                        className="w-full sm:w-auto touch-target min-h-[48px]"
                      >
                        {isProcessing && downloadType === 'pdf' ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <FileDown className="mr-2 h-5 w-5" />
                        )}
                        {isMobile ? 'Obtener PDF' : 'Descargar PDF'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => handleDownloadRequest('zip')}
                        disabled={isProcessing || !grid || selectedPages.size === 0}
                        className="w-full sm:w-auto touch-target min-h-[48px]"
                      >
                        {isProcessing && downloadType === 'zip' ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Package className="mr-2 h-5 w-5" />
                        )}
                        {isMobile ? 'Obtener ZIP' : 'Descargar ZIP'}
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
            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">Recortar imagen</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Puedes recortar la imagen o usar la imagen completa.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-auto max-h-[50vh] sm:max-h-[60vh]">
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

              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <Button variant="outline" onClick={handleSkipCrop} className="w-full sm:w-auto touch-target">
                  Usar imagen completa
                </Button>
                <Button onClick={showCroppedImage} className="w-full sm:w-auto touch-target">
                  Aplicar recorte
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* File Name Dialog */}
        {isFileNameDialogOpen && (
          <Dialog open={isFileNameDialogOpen} onOpenChange={setIsFileNameDialogOpen}>
            <DialogContent className="max-w-[90vw] sm:max-w-md">
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

              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <Button variant="outline" onClick={() => setIsFileNameDialogOpen(false)} className="w-full sm:w-auto touch-target">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmDownload} className="w-full sm:w-auto touch-target">
                  Descargar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Download Complete Modal */}
        {isDownloadCompleteModalOpen && downloadCompleteInfo && (
          <Dialog open={isDownloadCompleteModalOpen} onOpenChange={setIsDownloadCompleteModalOpen}>
            <DialogContent className="max-w-[90vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ¡Listo!
                </DialogTitle>
                <DialogDescription>
                  Tu {downloadCompleteInfo.fileType.toUpperCase()} se generó correctamente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm break-all">📁 {downloadCompleteInfo.fileName}</p>
                  {downloadCompleteInfo.fileType === 'zip' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedPages.size} imagen{selectedPages.size > 1 ? 'es' : ''} para imprimir
                    </p>
                  )}
                </div>

                {/* En móvil: Compartir es la acción principal */}
                {isMobile ? (
                  <div className="flex flex-col gap-2">
                    {typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && downloadCompleteInfo.blob && (
                      <Button 
                        onClick={handleShareFile}
                        size="lg"
                        className="w-full touch-target"
                      >
                        <Share className="mr-2 h-5 w-5" />
                        Compartir / Guardar en Archivos
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadAgain}
                      className="w-full touch-target"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar de nuevo
                    </Button>
                  </div>
                ) : (
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
                        Compartir
                      </Button>
                    )}
                  </div>
                )}

                {isMobile && isIOS() && (
                  <p className="text-xs text-muted-foreground text-center">
                    Toca "Compartir" para guardar en Archivos, iCloud o enviar por WhatsApp, AirDrop, etc.
                  </p>
                )}

                <div className="pt-2 border-t">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsDownloadCompleteModalOpen(false)
                      setDownloadCompleteInfo(null)
                      setOriginalImageSrc(null)
                      setProcessedImageSrc(null)
                      setImageFile(null)
                      setImageDimensions({ width: 0, height: 0 })
                      setTargetWidthCm("")
                      setTargetHeightCm("")
                      setGrid(null)
                      setSelectedPages(new Set())
                      setPreviewSlices(null)
                      setCurrentStep(0)
                      if (onImageChange) onImageChange(null)
                    }}
                    className={isMobile ? "w-full touch-target min-h-[48px]" : "w-full"}
                  >
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Crear otro póster
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant={isMobile ? "ghost" : "default"} onClick={() => setIsDownloadCompleteModalOpen(false)} className={isMobile ? "w-full" : ""}>
                  Cerrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <PremiumUpgradeModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </div>
    </TooltipProvider>
  )
}
