/**
 * Máscara e validação de números de telefone brasileiros
 * Formato: DDD (2 dígitos) + Número (8-9 dígitos)
 * Exemplo: 5596999999999 → (96) 99999-9999
 * Armazena internamente: 5596999999999 (com DDI 55)
 */

export function initPhoneMasks() {
  const phoneInputs = document.querySelectorAll('input[name*="whatsapp"], input[name*="telefone"], input[data-phone]');

  phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');

      // Se começar com 55, remover para processar
      if (value.startsWith('55')) {
        value = value.substring(2);
      }

      // Limitar a 11 dígitos (DDD + número)
      if (value.length > 11) {
        value = value.substring(0, 11);
      }

      // Formatar enquanto digita: (XX) XXXXX-XXXX
      let formatted = '';
      if (value.length > 0) {
        if (value.length <= 2) {
          formatted = `(${value}`;
        } else if (value.length <= 7) {
          formatted = `(${value.substring(0, 2)}) ${value.substring(2)}`;
        } else {
          formatted = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
        }
      }

      // Armazenar valor completo (com DDI 55) no atributo data
      const fullValue = value.length > 0 ? '55' + value : '';
      e.target.dataset.phoneRaw = fullValue;

      // Mostrar valor formatado (sem DDI)
      e.target.value = formatted;
    });

    // Ao perder foco, validar
    input.addEventListener('blur', (e) => {
      const raw = e.target.dataset.phoneRaw || '';

      if (raw && !isValidBrazilianPhone(raw)) {
        e.target.classList.add('is-invalid');
        e.target.title = 'Número de telefone inválido. Use: (96) 99999-9999';
      } else {
        e.target.classList.remove('is-invalid');
        e.target.title = '';
      }
    });
  });
}

export function isValidBrazilianPhone(value) {
  // Remove caracteres especiais
  const cleaned = value.replace(/\D/g, '');

  // Deve ter 13 dígitos (55 + 11)
  if (cleaned.length !== 13) return false;

  // Deve começar com 55 (DDI Brasil)
  if (!cleaned.startsWith('55')) return false;

  // DDD deve estar entre 11 e 99
  const ddd = parseInt(cleaned.substring(2, 4));
  if (ddd < 11 || ddd > 99) return false;

  // Número deve ter 8 ou 9 dígitos
  const number = cleaned.substring(4);
  if (number.length !== 8 && number.length !== 9) return false;

  // Primeiro dígito do número deve ser 6, 7, 8 ou 9
  const firstDigit = parseInt(number.charAt(0));
  if (firstDigit < 6 || firstDigit > 9) return false;

  return true;
}

export function formatPhoneForStorage(value) {
  // Retorna apenas números com DDI 55 para armazenamento
  let cleaned = value.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

export function formatPhoneForDisplay(value) {
  // Formata para exibição (sem DDI)
  let cleaned = value.replace(/\D/g, '');

  // Remover DDI se presente
  if (cleaned.startsWith('55')) {
    cleaned = cleaned.substring(2);
  }

  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }

  return value;
}
