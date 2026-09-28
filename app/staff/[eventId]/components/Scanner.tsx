'use client'

import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { localDb } from '@/utils/localDb'

export default function Scanner() {
  const [scanResult, setScanResult] = useState<{ status: string, message: string } | null>(null)

  useEffect(() => {
    // Configuramos el escáner para usar la cámara trasera y leer rápido
    const scanner = new Html5QrcodeScanner("reader", { 
      qrbox: { width: 250, height: 250 }, 
      fps: 10,
    }, false)

    scanner.render(onScanSuccess, onScanFailure)

    async function onScanSuccess(decodedText: string) {
      // Pausar escáner para no leer el mismo código 20 veces
      scanner.pause(true)
      
      // Buscamos el Hash criptográfico en la base LOCAL
      const pass = await localDb.passes.where('qr_hash').equals(decodedText).first()

      if (!pass) {
        setScanResult({ status: 'error', message: 'CÓDIGO FALSO O NO REGISTRADO' })
      } else if (pass.pass_status === 'used') {
        setScanResult({ status: 'warning', message: `BOLETO YA USADO: ${pass.guest_name}` })
      } else {
        // Es válido. Lo marcamos como usado localmente y pendiente de sincronizar
        await localDb.passes.update(pass.id, {
          pass_status: 'used',
          scanned_at: new Date().toISOString(),
          sync_pending: true
        })
        setScanResult({ status: 'success', message: `ACCESO PERMITIDO: ${pass.guest_name}` })
      }

      // Reanudar escáner después de 3 segundos
      setTimeout(() => {
        setScanResult(null)
        scanner.resume()
      }, 3000)
    }

    function onScanFailure(error: any) {
      // Se ignora, HTML5-QRCode lanza errores constantemente mientras busca el cuadro correcto
    }

    return () => {
      scanner.clear().catch(console.error)
    }
  }, [])

  return (
    <div className="flex flex-col items-center">
      {/* Div donde se monta el feed de la cámara */}
      <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden border-4 border-gray-800 shadow-xl"></div>
      
      {/* Alerta de Resultado */}
      {scanResult && (
        <div className={`mt-6 w-full max-w-sm p-6 text-center rounded-xl text-white font-bold text-xl animate-fade-in ${
          scanResult.status === 'success' ? 'bg-green-500' : 
          scanResult.status === 'warning' ? 'bg-yellow-500' : 'bg-red-600'
        }`}>
          {scanResult.message}
        </div>
      )}
    </div>
  )
}