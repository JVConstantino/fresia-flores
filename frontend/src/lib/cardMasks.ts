/**
 * Card input masking utilities
 * Handles formatting of card number, expiry, and CVV
 */

export const cardMasks = {
  /**
   * Format card number with spaces every 4 digits
   * Input: "4532123456789010" → Output: "4532 1234 5678 9010"
   */
  formatCardNumber(value: string): string {
    const cleaned = value.replace(/\D/g, '').slice(0, 19)
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
  },

  /**
   * Extract only digits from card number
   */
  extractCardNumber(formatted: string): string {
    return formatted.replace(/\D/g, '')
  },

  /**
   * Format expiry date as MM/YY
   * Input: "1225" → Output: "12/25"
   */
  formatExpiry(value: string): string {
    const cleaned = value.replace(/\D/g, '').slice(0, 4)
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2)
    }
    return cleaned
  },

  /**
   * Extract MM and YY from formatted expiry
   */
  extractExpiry(formatted: string): { month: string; year: string } {
    const cleaned = formatted.replace(/\D/g, '')
    return {
      month: cleaned.slice(0, 2),
      year: cleaned.slice(2, 4)
    }
  },

  /**
   * Validate expiry date
   * Check if month is 01-12 and year is not in the past
   */
  isValidExpiry(month: string, year: string): boolean {
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      return false
    }

    const monthNum = parseInt(month)
    if (monthNum < 1 || monthNum > 12) {
      return false
    }

    const now = new Date()
    const currentYear = now.getFullYear() % 100
    const currentMonth = now.getMonth() + 1

    const cardYear = parseInt(year)
    if (cardYear < currentYear) {
      return false
    }

    if (cardYear === currentYear && monthNum < currentMonth) {
      return false
    }

    return true
  },

  /**
   * CVV should be 3-4 digits only
   */
  formatCVV(value: string): string {
    return value.replace(/\D/g, '').slice(0, 4)
  },

  /**
   * Detect card brand from BIN (first 6 digits)
   * Used for visual feedback only (real detection happens on backend)
   */
  detectBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '')
    if (cleaned.length < 1) return ''

    const bin = cleaned.slice(0, 6)
    const binNum = parseInt(bin)

    if (cleaned.length >= 1) {
      if (cleaned[0] === '4') return 'visa'
      if (cleaned[0] === '5') return 'mastercard'
      if (cleaned.slice(0, 4) === '3782' || cleaned.slice(0, 4) === '3783') return 'amex'
    }

    if (binNum >= 636214 && binNum <= 636215) return 'elo'
    if (binNum >= 506629 && binNum <= 506778) return 'elo'
    if (binNum >= 384100 && binNum <= 384800) return 'hipercard'

    return ''
  }
}
