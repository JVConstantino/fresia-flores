import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class', 'class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
  	extend: {
  		colors: {
  			lilac: {
  				'50': '#f5f0fb',
  				'100': '#ece3f7',
  				'400': '#c1aff5',
  				'500': '#9b83e6',
  				'600': '#8970d9'
  			},
  			petal: {
  				'50': '#fff0e8',
  				'100': '#fde9e3',
  				'400': '#f5a98c',
  				'500': '#f09070',
  				'600': '#e07560'
  			},
  			leaf: {
  				'50': '#edf7ef',
  				'100': '#d4ecda',
  				'500': '#5a9e68',
  				'600': '#488e55'
  			},
  			warm: {
  				'100': '#fef5e8',
  				'200': '#fde8d0',
  				'400': '#f5b878',
  				'700': '#b88a3a'
  			},
  			forest: {
  				'600': '#1e5631'
  			},
  			ink: {
  				'50': '#f9f8fc',
  				'100': '#f3f1f8',
  				'200': '#e8e4ef',
  				'300': '#bab6c7',
  				'400': '#9991aa',
  				'500': '#6b6579',
  				'600': '#4a4558',
  				'700': '#3a3348',
  				'800': '#1f1c26',
  				'900': '#100e18'
  			}
  		},
  		borderRadius: {
  			sm: '6px',
  			md: '10px',
  			lg: '16px',
  			xl: '24px',
  			pill: '9999px'
  		},
  		fontFamily: {
  			display: [
  				'Fraunces',
  				'serif'
  			],
  			body: [
  				'DM Sans',
  				'sans-serif'
  			]
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
} satisfies Config
