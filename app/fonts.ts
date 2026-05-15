import localFont from 'next/font/local'

export const ebGaramond = localFont({
  src: [
    {
      path: './fonts/eb-garmond/EBGaramond-VariableFont_wght.ttf',
      weight: '400 700',
      style: 'normal',
    },
    {
      path: './fonts/eb-garmond/EBGaramond-Italic-VariableFont_wght.ttf',
      weight: '400 700',
      style: 'italic',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman',
})

export const montserrat = localFont({
  src: [
    {
      path: './fonts/montserrat/Montserrat-VariableFont_wght.ttf',
      weight: '300 700',
      style: 'normal',
    },
    {
      path: './fonts/montserrat/Montserrat-Italic-VariableFont_wght.ttf',
      weight: '300 700',
      style: 'italic',
    },
  ],
  variable: '--font-body',
  display: 'swap',
  fallback: ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
})
