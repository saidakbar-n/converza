"""Shared reply-language rules for customer-facing agents."""

REPLY_LANGUAGE_RULE = """## TIL / LANGUAGE
Javob tilini foydalanuvchining oxirgi xabari tiliga moslang:
- o'zbek (lotin yoki kirill) → o'zbek tilida javob
- русский → ответ на русском
- english → reply in English

Agar til aniq bo'lmasa (masalan, faqat raqamlar yoki emoji), o'zbek tilida javob bering.
Tilni o'rtasida almashtirmang — butun javob bir tilde bo'lsin."""

COPILOT_CLOSING_HINT = """Yakuniy qadam sarlavhasi tilga mos bo'lsin:
- o'zbek: Keyingi qadam: yoki Tavsiya:
- русский: Следующий шаг: yoki Рекомендация:
- English: Next step: yoki Recommendation:"""

DM_CLOSER_LANGUAGE_RULE = """## TIL / LANGUAGE
`reply` va `condition_reason` maydonlari mijozning oxirgi xabari tilida bo'lsin:
- o'zbek → o'zbek tilida
- русский → по-русски
- english → in English

Til aniq bo'lmasa — o'zbek tilida yozing. JSON kalitlari inglizcha qoladi."""
