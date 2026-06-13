import { useState, useEffect, useRef } from 'react'
import { Download, Copy, Check, Link, Type, Mail, Phone, Wifi, QrCode, Trash2, Clock } from 'lucide-react'

const ACCENT = '#10B981'

type QRType = 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'vcard'

interface QRPreset {
  id: string
  type: QRType
  label: string
  content: string
  created: string
}

const QR_TYPES: { type: QRType, label: string, icon: typeof Link }[] = [
  { type: 'url', label: 'URL', icon: Link },
  { type: 'text', label: 'Text', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'wifi', label: 'WiFi', icon: Wifi },
  { type: 'vcard', label: 'Contact', icon: QrCode },
]

function generateQRContent(type: QRType, fields: Record<string, string>): string {
  switch (type) {
    case 'url': return fields.url || ''
    case 'text': return fields.text || ''
    case 'email': return `mailto:${fields.email}${fields.subject ? '?subject=' + encodeURIComponent(fields.subject) : ''}`
    case 'phone': return `tel:${fields.phone}`
    case 'wifi': return `WIFI:T:${fields.security || 'WPA'};S:${fields.ssid};P:${fields.password};;`
    case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nFN:${fields.name}\nTEL:${fields.phone}\nEMAIL:${fields.email}\nURL:${fields.url}\nEND:VCARD`
    default: return ''
  }
}

// Simple QR code generator using canvas + qrcode library (CDN)
declare const QRCode: any

export default function App() {
  const [type, setType] = useState<QRType>('url')
  const [fields, setFields] = useState<Record<string, string>>({ url: '', text: '', email: '', phone: '', subject: '', ssid: '', password: '', security: 'WPA', name: '' })
  const [qrContent, setQrContent] = useState('')
  const [size, setSize] = useState(256)
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [copied, setCopied] = useState(false)
  const [presets, setPresets] = useState<QRPreset[]>(() => {
    try { return JSON.parse(localStorage.getItem('qr_presets') || '[]') } catch { return [] }
  })
  const [tab, setTab] = useState<'create' | 'saved'>('create')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrLibLoaded, setQrLibLoaded] = useState(false)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.onload = () => setQrLibLoaded(true)
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  useEffect(() => {
    localStorage.setItem('qr_presets', JSON.stringify(presets))
  }, [presets])

  const content = generateQRContent(type, fields)

  useEffect(() => {
    if (!qrLibLoaded || !content || !canvasRef.current) return
    const container = document.getElementById('qr-container')
    if (!container) return
    container.innerHTML = ''
    try {
      new QRCode(container, {
        text: content,
        width: size,
        height: size,
        colorDark: fgColor,
        colorLight: bgColor,
        correctLevel: QRCode.CorrectLevel.M,
      })
      setQrContent(content)
    } catch (e) {
      container.innerHTML = '<div style="color:#EF4444;font-size:13px;padding:20px;text-align:center">Invalid QR content</div>'
    }
  }, [qrLibLoaded, content, size, fgColor, bgColor])

  function downloadQR() {
    const container = document.getElementById('qr-container')
    if (!container) return
    const img = container.querySelector('img') as HTMLImageElement
    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    let dataUrl = ''
    if (canvas) dataUrl = canvas.toDataURL('image/png')
    else if (img) dataUrl = img.src
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-${type}-${Date.now()}.png`
    a.click()
  }

  function copyContent() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function savePreset() {
    if (!content) return
    const label = fields.url || fields.text || fields.ssid || fields.name || fields.email || fields.phone || type
    const preset: QRPreset = {
      id: Date.now().toString(),
      type,
      label: label.slice(0, 40),
      content,
      created: new Date().toLocaleDateString(),
    }
    setPresets(prev => [preset, ...prev.slice(0, 19)])
  }

  function field(key: string, placeholder: string, type_?: string) {
    return (
      <input key={key} placeholder={placeholder} type={type_ || 'text'} value={fields[key]}
        onChange={e => setFields(p => ({ ...p, [key]: e.target.value }))}
        style={{ width: '100%', background: '#1A2A1A', border: 'none', borderRadius: 10, padding: '11px 12px', color: '#F5F5F5', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
    )
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#080F0A', minHeight: '100vh', color: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#0D1A0F', padding: '20px 20px 0', borderBottom: '1px solid #1A2A1A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <QrCode size={22} color={ACCENT} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>QR Code Studio</div>
            <div style={{ fontSize: 11, color: '#555' }}>Create & save QR codes</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['create', 'saved'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', color: tab === t ? ACCENT : '#555', fontWeight: tab === t ? 600 : 400, fontSize: 14, borderBottom: `2px solid ${tab === t ? ACCENT : 'transparent'}` }}>
              {t === 'create' ? 'Create' : `Saved (${presets.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
        {tab === 'create' && (
          <>
            {/* Type selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 20 }}>
              {QR_TYPES.map(qt => {
                const Icon = qt.icon
                return (
                  <button key={qt.type} onClick={() => setType(qt.type)}
                    style={{ background: type === qt.type ? ACCENT + '33' : '#0D1A0F', border: type === qt.type ? `1px solid ${ACCENT}` : '1px solid #1A2A1A', borderRadius: 10, padding: '10px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .2s' }}>
                    <Icon size={16} color={type === qt.type ? ACCENT : '#888'} />
                    <span style={{ fontSize: 10, color: type === qt.type ? ACCENT : '#888' }}>{qt.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Fields per type */}
            <div style={{ marginBottom: 16 }}>
              {type === 'url' && field('url', 'https://example.com', 'url')}
              {type === 'text' && (
                <textarea placeholder="Enter text..." value={fields.text} onChange={e => setFields(p => ({ ...p, text: e.target.value }))}
                  rows={4} style={{ width: '100%', background: '#1A2A1A', border: 'none', borderRadius: 10, padding: '11px 12px', color: '#F5F5F5', fontSize: 14, resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }} />
              )}
              {type === 'email' && <>{field('email', 'Email address', 'email')}{field('subject', 'Subject (optional)')}</>}
              {type === 'phone' && field('phone', 'Phone number', 'tel')}
              {type === 'wifi' && (
                <>
                  {field('ssid', 'WiFi Network Name (SSID)')}
                  {field('password', 'Password')}
                  <select value={fields.security} onChange={e => setFields(p => ({ ...p, security: e.target.value }))}
                    style={{ width: '100%', background: '#1A2A1A', border: 'none', borderRadius: 10, padding: '11px 12px', color: '#F5F5F5', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }}>
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None</option>
                  </select>
                </>
              )}
              {type === 'vcard' && (
                <>
                  {field('name', 'Full Name')}
                  {field('phone', 'Phone', 'tel')}
                  {field('email', 'Email', 'email')}
                  {field('url', 'Website')}
                </>
              )}
            </div>

            {/* QR Preview */}
            {content && (
              <div style={{ background: '#0D1A0F', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center', border: '1px solid #1A2A1A' }}>
                <div id="qr-container" style={{ display: 'inline-block', background: bgColor, padding: 12, borderRadius: 8 }} />

                {!qrLibLoaded && (
                  <div style={{ color: '#888', fontSize: 13, padding: 20 }}>Loading QR generator...</div>
                )}

                {/* Size & color controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Size</div>
                    <select value={size} onChange={e => setSize(parseInt(e.target.value))}
                      style={{ width: '100%', background: '#1A2A1A', border: 'none', borderRadius: 8, padding: '8px', color: '#F5F5F5', fontSize: 12 }}>
                      <option value={128}>128px</option>
                      <option value={256}>256px</option>
                      <option value={512}>512px</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Foreground</div>
                    <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                      style={{ width: '100%', height: 34, background: '#1A2A1A', border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Background</div>
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                      style={{ width: '100%', height: 34, background: '#1A2A1A', border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={downloadQR}
                    style={{ flex: 1, background: ACCENT, border: 'none', borderRadius: 10, padding: '11px', color: '#000', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
                    <Download size={15} /> Download
                  </button>
                  <button onClick={copyContent}
                    style={{ flex: 1, background: '#1A2A1A', border: 'none', borderRadius: 10, padding: '11px', color: '#F5F5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
                    {copied ? <Check size={15} color={ACCENT} /> : <Copy size={15} />}
                    {copied ? 'Copied!' : 'Copy URL'}
                  </button>
                  <button onClick={savePreset}
                    style={{ background: '#1A2A1A', border: 'none', borderRadius: 10, padding: '11px 14px', color: '#888', cursor: 'pointer', fontSize: 13 }}>
                    Save
                  </button>
                </div>
              </div>
            )}

            {!content && (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#444', fontSize: 14 }}>
                <QrCode size={48} color="#1A2A1A" style={{ margin: '0 auto 12px' }} />
                Fill in the fields above to generate a QR code
              </div>
            )}
          </>
        )}

        {tab === 'saved' && (
          <>
            {presets.length === 0 && (
              <div style={{ textAlign: 'center', color: '#444', padding: '50px 20px', fontSize: 14 }}>
                <Clock size={40} color="#1A2A1A" style={{ margin: '0 auto 12px' }} />
                No saved QR codes yet
              </div>
            )}
            {presets.map(preset => (
              <div key={preset.id} style={{ background: '#0D1A0F', borderRadius: 14, padding: '14px 16px', marginBottom: 10, border: '1px solid #1A2A1A', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: ACCENT + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <QrCode size={20} color={ACCENT} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.label}</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{preset.type.toUpperCase()} · {preset.created}</div>
                </div>
                <button onClick={() => setPresets(prev => prev.filter(p => p.id !== preset.id))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444' }}><Trash2 size={15} /></button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
