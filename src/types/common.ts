export type PaperSize = 'Letter' | 'Legal' | 'Tabloid' | 'A4' | 'A3';
export type Orientation = 'portrait' | 'landscape';
export type DownloadType = 'pdf' | 'zip';
export type SizingMode = 'cm' | 'sheets';

export interface ImageDimensions {
  width: number;
  height: number;
}
