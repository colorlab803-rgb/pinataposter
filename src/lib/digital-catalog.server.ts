import { NextResponse } from 'next/server'
import { DIGITAL_CATALOG_DISABLED_MESSAGE } from './feature-flags'

export function catalogDisabledResponse() {
  return NextResponse.json(
    { error: DIGITAL_CATALOG_DISABLED_MESSAGE },
    { status: 404 }
  )
}
