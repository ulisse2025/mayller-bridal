'use client'

import dynamic from 'next/dynamic'

const ShieldShader = dynamic(
  () => import('@/components/ui/shield-shader').then((m) => ({ default: m.Component })),
  { ssr: false, loading: () => <div className="w-full h-screen bg-black" /> }
)

export function ShieldShaderClient() {
  return <ShieldShader />
}
