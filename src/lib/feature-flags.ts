const catalogFlag = process.env.NEXT_PUBLIC_ENABLE_DIGITAL_CATALOG

export const DIGITAL_CATALOG_ENABLED =
  catalogFlag === 'true' ||
  (catalogFlag !== 'false' && process.env.NODE_ENV !== 'production')

export const DIGITAL_CATALOG_DISABLED_MESSAGE =
  'El catálogo digital no está disponible en este momento.'
